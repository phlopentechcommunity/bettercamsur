import Link from 'next/link';
import PublicReportDetails from '@/components/PublicReportDetails';

export default async function TrackReportPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <main className="app-shell min-vh-100">
    <header className="topbar"><div className="container"><Link href="/" className="text-decoration-none text-dark fw-bold">bettercamsur.ph</Link></div></header>
    <div className="container py-4" style={{maxWidth: 850}}>
      <PublicReportDetails reference={reference} />
    </div>
  </main>;
}
