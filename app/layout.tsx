import type { Metadata } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import './globals.css';
export const metadata: Metadata = {
 title: 'bettercamsur.ph — Community Issue Reporting',
 description: 'Report local issues, pin their location, and follow their resolution.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="en"><body>{children}</body></html>;
}
