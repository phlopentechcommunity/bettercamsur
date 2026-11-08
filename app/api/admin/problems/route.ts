import { NextRequest, NextResponse } from 'next/server';
import { query, audit } from '@/lib/db';
import { reportScope } from '@/lib/admin';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const schema = z.object({
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().max(5000).optional(),
  category: z.string().trim().min(2).max(60),
  provinceId: z.string().uuid().nullable().optional(),
  municipalityId: z.string().uuid().nullable().optional(),
});
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await reportScope(request);
  if (auth.response) return auth.response;
  try {
    const isSystemAdmin = auth.principal?.roles.includes('SYSTEM_ADMIN') ?? false;
    const scopedReportWhere = auth.where.replaceAll('r.', 'sr.');
    const scope = isSystemAdmin ? '' : `AND (
      EXISTS (SELECT 1 FROM problem_reports prs JOIN reports sr ON sr.id=prs.report_id
              WHERE prs.problem_id=p.id ${scopedReportWhere})
      OR p.created_by=(SELECT id FROM app_users WHERE keycloak_sub=$${auth.values.length + 1})
    )`;
    const values = isSystemAdmin ? [] : [...auth.values, auth.principal!.sub];
    const result = await query(`
      SELECT p.id,p.reference,p.title,p.category,p.status,p.created_at,
             count(DISTINCT pr.report_id)::int AS report_count,
             COALESCE(json_agg(DISTINCT jsonb_build_object('id',r.id,'reference',r.reference,'title',r.title,'status',r.status))
               FILTER (WHERE r.id IS NOT NULL),'[]'::json) AS reports
      FROM problems p
      LEFT JOIN problem_reports pr ON pr.problem_id=p.id
      LEFT JOIN reports r ON r.id=pr.report_id
      WHERE true ${scope}
      GROUP BY p.id ORDER BY p.created_at DESC LIMIT 200
    `, values);
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: 'Unable to load problems' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await reportScope(request);
  if (auth.response) return auth.response;
  if (!auth.principal || auth.principal.roles.includes('AUDITOR')) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid problem details', details: parsed.error.flatten() }, { status: 400 });
  try {
    const data = parsed.data;
    if (data.municipalityId) {
      const locality = await query('SELECT id FROM municipalities WHERE id=$1 AND province_id IS NOT DISTINCT FROM $2', [data.municipalityId, data.provinceId || null]);
      if (!locality.rowCount) return NextResponse.json({ error: 'Municipality does not belong to the selected province' }, { status: 400 });
    }
    if (!auth.principal.roles.includes('SYSTEM_ADMIN')) {
      const user = await query(`SELECT a.province_id,a.municipality_id,a.department_id,r.code FROM user_assignments a JOIN app_users u ON u.id=a.user_id JOIN roles r ON r.id=a.role_id WHERE u.keycloak_sub=$1`, [auth.principal.sub]);
      const permitted = user.rows.some(a => {
        if (a.province_id && a.province_id !== (data.provinceId || null)) return false;
        if (a.municipality_id && a.municipality_id !== (data.municipalityId || null)) return false;
        return Boolean(data.provinceId || data.municipalityId) || (!a.province_id && !a.municipality_id);
      });
      if (!permitted) return NextResponse.json({ error: 'Select a province or municipality within your assigned geographic scope' }, { status: 403 });
    }
    const reference = `PR-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const result = await query(`
      INSERT INTO problems(reference,title,description,category,province_id,municipality_id,created_by)
      VALUES($1,$2,$3,$4,$5,$6,(SELECT id FROM app_users WHERE keycloak_sub=$7)) RETURNING *
    `, [reference,data.title,data.description || null,data.category,data.provinceId || null,data.municipalityId || null,auth.principal.sub]);
    await audit(auth.principal.email, 'PROBLEM_CREATED', { reference });
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to create problem' }, { status: 500 });
  }
}
