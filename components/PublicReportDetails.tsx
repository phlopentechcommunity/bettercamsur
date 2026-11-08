'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type RelatedProblem = { reference: string; title: string; status: string };
type Evidence = { url: string; fileName: string; createdAt?: string };
type Report = {
  reference: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  severity?: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  department: string | null;
  createdAt: string;
  updatedAt: string;
  evidence: Evidence[];
  problems: RelatedProblem[];
};

const stages = [
  { key: 'SUBMITTED', label: 'Submitted', detail: 'Received by the platform' },
  { key: 'ACKNOWLEDGED', label: 'Acknowledged', detail: 'Reviewed by the responsible office' },
  { key: 'IN_PROGRESS', label: 'In progress', detail: 'Work or action is underway' },
  { key: 'RESOLVED', label: 'Resolved', detail: 'The office has marked the issue resolved' },
];

const statusLabel: Record<string, string> = {
  SUBMITTED: 'Submitted',
  ACKNOWLEDGED: 'Acknowledged',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  REJECTED: 'Not accepted',
  CLOSED: 'Closed',
};

const severityLabel: Record<string, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export default function PublicReportDetails({ reference }: { reference: string }) {
  const [item, setItem] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/track/${encodeURIComponent(reference)}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load report');
        if (active) setItem(data);
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load report'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reference]);

  const severity = (item?.severity || item?.priority || 'NORMAL').toUpperCase();
  const currentIndex = stages.findIndex(stage => stage.key === item?.status);
  const mapUrl = item?.latitude != null && item?.longitude != null
    ? `https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=18/${item.latitude}/${item.longitude}`
    : null;

  return (
    <section className="public-report-content">
      {loading && <div className="panel p-4"><p className="muted mb-0">Loading report {reference}…</p></div>}
      {error && <div className="notice error-notice">{error}</div>}
      {item && <>
        <section className="panel p-3 p-md-4 mb-3">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <div className="eyebrow mb-2">Public report record</div>
              <div className="small muted">{item.reference}</div>
              <h1 className="h3 fw-bold mt-1 mb-2">{item.title}</h1>
              <div className="small muted">{item.category}</div>
              <p className="report-description mt-3 mb-0">{item.description}</p>
            </div>
            <div className="text-md-end">
              <span className={`status-pill status-${item.status}`}>{statusLabel[item.status] || item.status.replaceAll('_', ' ')}</span>
              <div className={`priority priority-${severity} mt-2`}>Severity: {severityLabel[severity] || severity}</div>
            </div>
          </div>
          <hr />
          <div className="row g-3 small">
            <div className="col-sm-6"><div className="detail-label">Responsible department</div><div>{item.department || 'Awaiting assignment'}</div></div>
            <div className="col-sm-6"><div className="detail-label">Location</div><div>{item.address || 'Location pin submitted'}</div>{mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="small text-success">View on OpenStreetMap ↗</a>}</div>
            <div className="col-sm-6"><div className="detail-label">Date submitted</div><div>{new Date(item.createdAt).toLocaleString('en-PH')}</div></div>
            <div className="col-sm-6"><div className="detail-label">Last updated</div><div>{new Date(item.updatedAt).toLocaleString('en-PH')}</div></div>
          </div>
        </section>

        <section className="panel p-3 p-md-4 mb-3">
          <h2 className="section-title mb-1">Report progress</h2>
          <p className="section-sub mb-4">This shows the current recorded status. It does not promise a processing deadline.</p>
          {item.status === 'REJECTED' ? (
            <div className="notice error-notice">This report was marked as not accepted by the responsible office. Contact the office through its official channels if you need clarification.</div>
          ) : (
            <div className="status-timeline">
              {stages.map((stage, index) => {
                const complete = currentIndex >= index && currentIndex >= 0;
                const current = item.status === stage.key;
                return <div className={`status-step ${complete ? 'is-complete' : ''} ${current ? 'is-current' : ''}`} key={stage.key}>
                  <span className="status-step-marker">{complete ? '✓' : index + 1}</span>
                  <div><div className="fw-semibold">{stage.label}</div><div className="small muted">{stage.detail}</div></div>
                </div>;
              })}
            </div>
          )}
        </section>

        {item.problems?.length > 0 && <section className="panel p-3 p-md-4 mb-3">
          <h2 className="section-title mb-1">Related community problem</h2>
          <p className="section-sub">This report has been grouped with other reports about the same underlying issue.</p>
          {item.problems.map(problem => <div className="related-problem-row" key={problem.reference}>
            <div className="fw-semibold">{problem.title}</div>
            <div className="small muted">{problem.reference} · {statusLabel[problem.status] || problem.status}</div>
          </div>)}
        </section>}

        {item.evidence?.length > 0 && <section className="panel p-3 p-md-4 mb-3">
          <h2 className="section-title mb-3">Photographic evidence</h2>
          <div className="d-flex flex-wrap gap-2">
            {item.evidence.map(photo => <a className="evidence-link" href={photo.url} target="_blank" rel="noreferrer" key={photo.url}>{photo.fileName} ↗</a>)}
          </div>
          <p className="small muted mt-3 mb-0">Only upload images that you are permitted to share. Avoid including private documents or sensitive personal information.</p>
        </section>}

        <section className="panel p-3 p-md-4 mb-3">
          <h2 className="section-title mb-3">Status and severity guide</h2>
          <div className="row g-3">
            <div className="col-md-6">
              <div className="detail-label mb-2">Status</div>
              {stages.map(s => <div className="legend-line" key={s.key}><span className={`status-pill status-${s.key}`}>{s.label}</span><span className="small muted">{s.detail}</span></div>)}
              <div className="legend-line"><span className="status-pill status-REJECTED">Not accepted</span><span className="small muted">The office did not accept the report for processing.</span></div>
            </div>
            <div className="col-md-6">
              <div className="detail-label mb-2">Severity</div>
              <div className="legend-line"><span className="priority priority-LOW">LOW</span><span className="small muted">Minor inconvenience or limited impact.</span></div>
              <div className="legend-line"><span className="priority priority-NORMAL">NORMAL</span><span className="small muted">Routine community issue.</span></div>
              <div className="legend-line"><span className="priority priority-HIGH">HIGH</span><span className="small muted">Significant disruption or wider impact.</span></div>
              <div className="legend-line"><span className="priority priority-URGENT">URGENT</span><span className="small muted">Immediate safety, health, or essential-service concern.</span></div>
            </div>
          </div>
          <p className="small muted mt-3 mb-0">Severity is an initial assessment and may be reviewed by authorized government personnel. For emergencies, contact the appropriate emergency services directly; this platform is not an emergency-response service.</p>
        </section>
      </>}
      <div className="d-flex flex-wrap gap-3 mt-4"><Link href="/track" className="small text-success text-decoration-none">Track another report</Link><Link href="/" className="small text-success text-decoration-none">Back to community map</Link></div>
    </section>
  );
}
