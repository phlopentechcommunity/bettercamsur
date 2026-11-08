'use client';
import { useState } from 'react';
import Link from 'next/link';
export default function TrackSearch(){
 const [ref,setRef]=useState(''),[error,setError]=useState('');
 return <main className="app-shell min-vh-100"><header className="topbar"><div className="container"><Link href="/" className="text-decoration-none text-dark fw-bold">bettercamsur.ph</Link></div></header><div className="container py-5" style={{maxWidth:650}}><div className="eyebrow mb-2">Public report tracking</div><h1 className="h2 fw-bold">Track a submitted report</h1><p className="muted">Enter the reference number provided after submission.</p><form className="panel p-4" onSubmit={e=>{e.preventDefault();if(ref.trim())location.href=`/track/${encodeURIComponent(ref.trim().toUpperCase())}`}}><label className="form-label">Reference number</label><input className="form-control mb-3" required placeholder="CD-2026-ABC123" value={ref} onChange={e=>setRef(e.target.value)}/>{error&&<p className="text-danger">{error}</p>}<button className="btn btn-green">Track report</button></form></div></main>
}
