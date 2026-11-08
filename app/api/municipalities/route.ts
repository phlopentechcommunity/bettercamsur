import { NextRequest,NextResponse } from 'next/server';
import { query } from '@/lib/db';
export const runtime='nodejs';
export async function GET(request:NextRequest){
 const provinceId=request.nextUrl.searchParams.get('provinceId');
 const independent=request.nextUrl.searchParams.get('independent')==='true';
 if(independent)return NextResponse.json((await query(`SELECT id,name,kind FROM municipalities WHERE province_id IS NULL AND kind IN ('INDEPENDENT_CITY','HIGHLY_URBANIZED_CITY') AND active=true ORDER BY name`)).rows);
 if(!provinceId)return NextResponse.json({error:'provinceId or independent=true is required'},{status:400});
 return NextResponse.json((await query(`SELECT id,name,kind FROM municipalities WHERE province_id=$1 AND active=true UNION ALL SELECT id,name,kind FROM municipalities WHERE province_id IS NULL AND kind IN ('INDEPENDENT_CITY','HIGHLY_URBANIZED_CITY') AND active=true ORDER BY name`,[provinceId])).rows);
}
