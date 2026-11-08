import { Pool, type QueryResultRow } from 'pg';

declare global { var pgPool: Pool | undefined }
export const db = global.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.PG_POOL_MAX || 15), idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000, ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined });
if (process.env.NODE_ENV !== 'production') global.pgPool = db;
export async function query<T extends QueryResultRow = QueryResultRow>(sql: string, values: unknown[] = []) { return db.query<T>(sql, values); }
export async function audit(actor: string, action: string, details: unknown = {}, reportId: string | null = null, ipAddress: string | null = null) {
 await query('INSERT INTO audit_logs (actor, action, details, report_id, ip_address) VALUES ($1,$2,$3,$4,$5)', [actor, action, JSON.stringify(details), reportId, ipAddress]);
}
