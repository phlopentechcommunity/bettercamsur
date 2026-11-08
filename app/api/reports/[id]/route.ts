import { NextRequest, NextResponse } from 'next/server';
import { query, audit } from '@/lib/db';
import { invalidateReportCache } from '@/lib/redis';
import { reportScope } from '@/lib/admin';
import { sendStatusEmail } from '@/lib/email';
import { updateStatusSchema } from '@/lib/validation';
export const runtime='nodejs';
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
 const auth=await reportScope(request); if(auth.response)return auth.response; if(!auth.principal)return NextResponse.json({error:'Unauthorized'},{status:403}); const {id}=await params; const body=await request.json(); if(auth.principal.roles.includes('AUDITOR'))return NextResponse.json({error:'Auditor access is read-only'},{status:403}); if(body.departmentId!==undefined&&!auth.principal.roles.some(r=>['SYSTEM_ADMIN','PROVINCIAL_ADMIN','PROVINCIAL_DEPARTMENT_ADMIN','MUNICIPAL_ADMIN','MUNICIPAL_DEPARTMENT_ADMIN'].includes(r)))return NextResponse.json({error:'You cannot assign reports to departments'},{status:403});
 if((!body.status||!updateStatusSchema.safeParse({status:body.status}).success)&&body.departmentId===undefined&&body.severity===undefined)return NextResponse.json({error:'Invalid update'},{status:400});
 try { const before=await query(`SELECT * FROM reports r WHERE id=$${auth.values.length+1}${auth.where}`,[...auth.values,id]); if(!before.rowCount)return NextResponse.json({error:'Report not found'},{status:404}); const old=before.rows[0];
  if(body.departmentId!==undefined&&body.departmentId){const d=await query('SELECT id FROM departments WHERE id=$1 AND active=true AND (province_id IS NULL OR province_id=$2) AND (municipality_id IS NULL OR municipality_id=$3)',[body.departmentId,old.province_id,old.municipality_id]);if(!d.rowCount)return NextResponse.json({error:'Department not found'},{status:400});}
  if(body.severity!==undefined&&!['LOW','NORMAL','HIGH','URGENT'].includes(body.severity))return NextResponse.json({error:'Invalid severity'},{status:400});
  const status=body.status??old.status, departmentId=body.departmentId===undefined?old.department_id:(body.departmentId||null), severity=body.severity??old.severity??old.priority;
  const updated=await query(`UPDATE reports SET status=$2,department_id=$3,severity=$4,priority=$4,updated_at=now() WHERE id=$1 RETURNING *`,[id,status,departmentId,severity]); const report=updated.rows[0];
  await audit(auth.principal.email,'REPORT_UPDATED',{before:{status:old.status,departmentId:old.department_id,severity:old.severity??old.priority},after:{status:report.status,departmentId:report.department_id,severity:report.severity}},id,request.headers.get('x-forwarded-for')?.split(',')[0]||null);
  if(body.status&&old.status!==report.status)try{await sendStatusEmail(report.email,report.reference,report.title,report.status);}catch(e){console.error('Status email failed',e);}
  await invalidateReportCache();return NextResponse.json(report);
 }catch{return NextResponse.json({error:'Report update failed'},{status:400});}
}
