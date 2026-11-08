import type { Metadata } from 'next';
import Link from 'next/link';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'bettercamsur.ph — Community Issue Reporting',
  description: 'Report local issues, pin their location, and follow their resolution.',
};

function SiteFooter() {
  return <footer className="site-footer">
    <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
      <span>bettercamsur.ph · Community issue reporting</span>
      <nav aria-label="Legal" className="d-flex gap-3">
        <Link href="/privacy">Privacy Notice</Link>
        <Link href="/terms">Terms of Use</Link>
      </nav>
    </div>
  </footer>;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<SiteFooter /></body></html>;
}
