import { NextRequest, NextResponse } from 'next/server';
import { query, audit } from '@/lib/db';
import { reportScope } from '@/lib/admin';
import { z } from 'zod';
const schema = z.object({ reportId: z.string().uuid(), action: z.enum(['LINK','UNLINK']).default('LINK') });
export const runtime = 'nodejs';
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await reportScope(request);
  if (auth.response) return auth.response;
  if (!auth.principal || auth.principal.roles.includes('AUDITOR')) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid report association' }, { status: 400 });
  const { id } = await params;
  try {
    const problem = await query('SELECT id,reference,province_id,municipality_id FROM problems WHERE id=$1', [id]);
    if (!problem.rowCount) return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    const report = await query(`SELECT id,reference,province_id,municipality_id FROM reports r WHERE r.id=$${auth.values.length + 1} ${auth.where}`, [...auth.values, parsed.data.reportId]);
    if (!report.rowCount) return NextResponse.json({ error: 'Report is outside your authorized scope' }, { status: 404 });
    const p = problem.rows[0], r = report.rows[0];
    if (!auth.principal.roles.includes('SYSTEM_ADMIN')) {
      const assignments = await query(`SELECT a.province_id,a.municipality_id FROM user_assignments a JOIN app_users u ON u.id=a.user_id WHERE u.keycloak_sub=$1`, [auth.principal.sub]);
      const problemInScope = assignments.rows.some(a => (!a.province_id || a.province_id === p.province_id) && (!a.municipality_id || a.municipality_id === p.municipality_id));
      if (!problemInScope) return NextResponse.json({ error: 'Problem is outside your authorized geographic scope' }, { status: 404 });
    }
    if ((p.province_id && p.province_id !== r.province_id) || (p.municipality_id && p.municipality_id !== r.municipality_id)) {
      return NextResponse.json({ error: 'Problem and report must belong to the same geographic scope' }, { status: 400 });
    }
    if (parsed.data.action === 'LINK') {
      await query('INSERT INTO problem_reports(problem_id,report_id,linked_by) VALUES($1,$2,(SELECT id FROM app_users WHERE keycloak_sub=$3)) ON CONFLICT DO NOTHING', [id,parsed.data.reportId,auth.principal.sub]);
    } else {
      await query('DELETE FROM problem_reports WHERE problem_id=$1 AND report_id=$2', [id,parsed.data.reportId]);
    }
    await audit(auth.principal.email, parsed.data.action === 'LINK' ? 'REPORT_LINKED_TO_PROBLEM' : 'REPORT_UNLINKED_FROM_PROBLEM', { problemReference:p.reference,reportReference:r.reference }, parsed.data.reportId);
    return NextResponse.json({ success:true });
  } catch {
    return NextResponse.json({ error:'Unable to update association' }, { status:500 });
  }
}
