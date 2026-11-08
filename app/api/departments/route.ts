import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
export const runtime='nodejs';
export async function GET(){try{return NextResponse.json((await query('SELECT id,name,description,province_id,municipality_id FROM departments WHERE active=true ORDER BY name')).rows);}catch{return NextResponse.json({error:'Unable to load departments'},{status:503});}}
