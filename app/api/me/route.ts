import {NextRequest,NextResponse} from 'next/server';import {authenticate,isResponse,upsertPrincipal} from '@/lib/auth';import {query} from '@/lib/db';
export const runtime='nodejs';
export async function GET(req:NextRequest){const p=await authenticate(req);if(isResponse(p))return p;try{const id=await upsertPrincipal(p);const u=await query('SELECT id,email,display_name AS "displayName" FROM app_users WHERE id=$1 AND active=true',[id]);return NextResponse.json({user:u.rows[0]});}catch{return NextResponse.json({error:'Unable to load account'},{status:503});}}
