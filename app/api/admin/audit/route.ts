import { NextRequest,NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { reportScope } from '@/lib/admin';
export const runtime='nodejs';
export async function GET(request:NextRequest){const auth=await reportScope(request);if(auth.response)return auth.response;const r=await query(`SELECT a.*,r.reference,r.title FROM audit_logs a LEFT JOIN reports r ON r.id=a.report_id WHERE true${auth.where} ORDER BY a.created_at DESC LIMIT 500`,auth.values);return NextResponse.json(r.rows);}
