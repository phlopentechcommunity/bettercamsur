import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
export const runtime='nodejs';
export async function GET(){return NextResponse.json((await query('SELECT id,name,code FROM provinces WHERE active=true ORDER BY name')).rows);}
