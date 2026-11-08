import { S3Client } from '@aws-sdk/client-s3';
export const s3 = new S3Client({ region: process.env.S3_REGION || 'us-east-1', endpoint: process.env.S3_ENDPOINT, forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false', credentials: { accessKeyId: process.env.S3_ACCESS_KEY || 'minio', secretAccessKey: process.env.S3_SECRET_KEY || 'minio-secret' } });
export const bucket = process.env.S3_BUCKET || 'bettercamsur-evidence';
export function publicObjectUrl(key: string) {
 const base = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT;
 if (!base) throw new Error('S3_PUBLIC_URL or S3_ENDPOINT must be configured');
 return `${base.replace(/\/$/, '')}/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
}
