'use client';
import dynamic from 'next/dynamic';
const MapPicker=dynamic(()=>import('./MapPicker'),{ssr:false,loading:()=> <div className="map-frame d-flex align-items-center justify-content-center muted">Loading map…</div>});
type Report={id:string;latitude:number;longitude:number;title:string;status:string};
export default function MapPanel({reports}:{reports:Report[]}) {
  const center=reports.length?{latitude:reports[0].latitude,longitude:reports[0].longitude}:{latitude:14.5995,longitude:120.9842};
  return <MapPicker {...center} onChange={()=>{}} reports={reports} selectable={false}/>;
}
