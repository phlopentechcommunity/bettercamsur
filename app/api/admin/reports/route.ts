import { NextRequest,NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { reportScope } from '@/lib/admin';
export const runtime='nodejs';
export async function GET(request:NextRequest){const auth=await reportScope(request);if(auth.response)return auth.response;const r=await query(`SELECT r.*,d.name AS department_name,COALESCE(json_agg(json_build_object('id',e.id,'url',e.url,'fileName',e.file_name,'mimeType',e.mime_type,'size',e.size)) FILTER(WHERE e.id IS NOT NULL),'[]') AS evidence FROM reports r LEFT JOIN departments d ON d.id=r.department_id LEFT JOIN evidence e ON e.report_id=r.id WHERE true${auth.where} GROUP BY r.id,d.name ORDER BY r.created_at DESC LIMIT 300`,auth.values);return NextResponse.json(r.rows);}
