import { NextRequest,NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3,bucket,publicObjectUrl } from '@/lib/s3';
import { query } from '@/lib/db';
export const runtime='nodejs';
const allowed=new Set(['image/jpeg','image/png','image/webp','image/heic']);
export async function POST(request:NextRequest){try{const b=await request.json();if(typeof b.reportId!=='string'||typeof b.fileName!=='string'||!allowed.has(b.mimeType)||!Number.isInteger(b.size)||b.size<1||b.size>10*1024*1024)return NextResponse.json({error:'Provide a report, supported image, and file size up to 10 MB'},{status:400});const report=await query('SELECT id FROM reports WHERE id=$1',[b.reportId]);if(!report.rowCount)return NextResponse.json({error:'Report not found'},{status:404});const ext=b.mimeType==='image/jpeg'?'jpg':b.mimeType.split('/')[1],key=`reports/${b.reportId}/${randomUUID()}.${ext}`;const uploadUrl=await getSignedUrl(s3,new PutObjectCommand({Bucket:bucket,Key:key,ContentType:b.mimeType}),{expiresIn:300});return NextResponse.json({uploadUrl,objectKey:key,publicUrl:publicObjectUrl(key)});}catch{return NextResponse.json({error:'Unable to create upload URL. Check S3 configuration.'},{status:503});}}
