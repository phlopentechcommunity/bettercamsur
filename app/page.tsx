import Link from 'next/link';
import { query } from '@/lib/db';
import { getCached, setCached } from '@/lib/redis';
import MapPanel from '@/components/MapPanel';

export const dynamic = 'force-dynamic';
async function getOverview() {
  const cached = await getCached<any>('reports:overview');
  if (cached) return cached;
  try {
    const [reports,total,open,resolved] = await Promise.all([
      query('SELECT id,reference,title,category,priority,status,latitude,longitude,address,created_at AS "createdAt" FROM reports ORDER BY created_at DESC LIMIT 8'),
      query('SELECT count(*)::int AS count FROM reports'),
      query("SELECT count(*)::int AS count FROM reports WHERE status IN ('SUBMITTED','ACKNOWLEDGED','IN_PROGRESS')"),
      query("SELECT count(*)::int AS count FROM reports WHERE status='RESOLVED'"),
    ]);
    const data={reports:reports.rows,total:total.rows[0].count,open:open.rows[0].count,resolved:resolved.rows[0].count}; await setCached('reports:overview',data,15); return data;
  } catch { return {reports:[],total:0,open:0,resolved:0}; }
}
const date = (d:Date) => new Intl.DateTimeFormat('en-PH',{dateStyle:'medium'}).format(d);
export default async function Home() {
  const data=await getOverview();
  return <main className="app-shell">
    <header className="topbar"><div className="container d-flex align-items-center justify-content-between"><Link href="/" className="d-flex align-items-center gap-2 text-decoration-none text-dark"><div className="brand-mark">C</div><div><div className="brand-name">bettercamsur.ph</div><div className="brand-sub">Community reporting</div></div></Link><div className="d-flex gap-2"><Link href="/account" className="btn btn-outline-secondary btn-sm">My account</Link><Link href="/request-access" className="btn btn-outline-secondary btn-sm">Government access</Link><Link href="/track" className="btn btn-outline-secondary btn-sm">Track report</Link><Link href="/report" className="btn btn-green btn-sm px-3">＋ Report an issue</Link></div></div></header>
    <div className="container">
      <section className="hero"><div className="eyebrow mb-3">Your community. Your voice.</div><h1>See a problem?<br/>Put it on the map.</h1><p>Report local issues, identify exactly where they are happening, and help your community keep track of what needs attention.</p><Link href="/report" className="btn btn-green mt-2">Submit a report <span aria-hidden="true">→</span></Link></section>
      <section className="row g-3 mb-4">
        <div className="col-4"><div className="panel stat-card h-100"><div className="stat-value">{data.total}</div><div className="stat-label">Total reports</div></div></div>
        <div className="col-4"><div className="panel stat-card h-100"><div className="stat-value">{data.open}</div><div className="stat-label">Needs attention</div></div></div>
        <div className="col-4"><div className="panel stat-card h-100"><div className="stat-value">{data.resolved}</div><div className="stat-label">Resolved</div></div></div>
      </section>
      <section className="panel p-3 p-md-4 mb-4"><div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3"><div><div className="section-title">Community issue map</div><div className="section-sub">Reported problems and their locations</div></div><div className="map-legend-wrap">
          <span className="map-legend">Severity: <b className="priority priority-LOW">Low</b> · <b className="priority priority-NORMAL">Normal</b> · <b className="priority priority-HIGH">High</b> · <b className="priority priority-URGENT">Urgent</b></span>
          <span className="map-legend">Status: Submitted · Acknowledged · In progress · Resolved</span>
          <span className="map-legend">Map data © OpenStreetMap contributors</span>
        </div></div><MapPanel reports={data.reports}/></section>
      <section className="panel mb-5"><div className="p-3 p-md-4 d-flex justify-content-between align-items-center"><div><div className="section-title">Recent reports</div><div className="section-sub">Latest issues submitted by the community</div></div><Link href="/report" className="small text-success fw-bold text-decoration-none">Add report →</Link></div>
        {data.reports.length===0?<div className="p-4 text-center muted">No reports yet. Submit the first community report.</div>:data.reports.map((r:any)=><div className="report-row" key={r.id}><div className="d-flex justify-content-between gap-3"><div className="min-w-0"><Link href={`/reports/${encodeURIComponent(r.reference)}`} className="fw-bold mb-1 text-decoration-none text-dark">{r.title}</Link><div className="small muted">{r.reference} · {r.category} · {date(new Date(r.createdAt))}</div>{r.address&&<div className="small muted mt-1">{r.address}</div>}</div><div className="text-end flex-shrink-0"><span className={`status-pill status-${r.status}`}>{r.status.replace('_',' ')}</span><div className={`priority priority-${r.priority} mt-2`}>{r.priority}</div></div></div></div>)}
      </section>
    </div>
  </main>;
}
