import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { query, audit } from '@/lib/db';
import { getCached, setCached, invalidateReportCache } from '@/lib/redis';
import { createReportSchema } from '@/lib/validation';
import { authenticateOptional, upsertPrincipal } from '@/lib/auth';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
 const status=request.nextUrl.searchParams.get('status'), category=request.nextUrl.searchParams.get('category');
 const key=`reports:list:${status??'all'}:${category??'all'}`; const cached=await getCached<unknown>(key); if(cached)return NextResponse.json(cached);
 try { const values:unknown[]=[]; let where=''; if(status){values.push(status);where+=` AND status=$${values.length}`;} if(category){values.push(category);where+=` AND category=$${values.length}`;}
  const result=await query(`SELECT id,reference,title,category,priority,status,latitude,longitude,address,created_at AS "createdAt" FROM reports WHERE true${where} ORDER BY created_at DESC LIMIT 100`,values); await setCached(key,result.rows,20); return NextResponse.json(result.rows);
 } catch { return NextResponse.json({error:'Unable to retrieve reports'},{status:503}); }
}
export async function POST(request: NextRequest) {
 try { const parsed=createReportSchema.safeParse(await request.json()); if(!parsed.success)return NextResponse.json({error:'Invalid report data',details:parsed.error.flatten()},{status:400}); const d=parsed.data;if(d.municipalityId){const locality=await query('SELECT id FROM municipalities WHERE id=$1 AND province_id IS NOT DISTINCT FROM $2',[d.municipalityId,d.provinceId||null]);if(!locality.rowCount)return NextResponse.json({error:'Selected municipality does not belong to the selected province'},{status:400});}
  const signedIn=await authenticateOptional(request); if(signedIn instanceof NextResponse)return signedIn;
  const ownerId=signedIn?await upsertPrincipal(signedIn):null;
  const reference=`BC-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  const result=await query(`INSERT INTO reports(reference,title,description,category,priority,severity,reporter,email,latitude,longitude,address,province_id,municipality_id,owner_user_id) VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id,reference,status`,[reference,d.title,d.description,d.category,d.priority,d.reporter||signedIn?.name||null,d.email||signedIn?.email||null,d.latitude,d.longitude,d.address||null,d.provinceId||null,d.municipalityId||null,ownerId]);
  const report=result.rows[0]; await audit('public','REPORT_SUBMITTED',{reference},report.id,request.headers.get('x-forwarded-for')?.split(',')[0]||null); await invalidateReportCache(); return NextResponse.json(report,{status:201});
 } catch { return NextResponse.json({error:'Unable to save report. Check database connectivity and try again.'},{status:503}); }
}
