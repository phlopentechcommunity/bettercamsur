'use client';

import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

type Props = { latitude: number; longitude: number; onChange: (lat: number, lng: number) => void; reports?: Array<{id:string;latitude:number;longitude:number;title:string;status:string}>; selectable?: boolean };
const markerIcon = new L.Icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', iconSize: [25,41], iconAnchor: [12,41] });
function ClickHandler({onChange,selectable}:{onChange:(lat:number,lng:number)=>void;selectable:boolean}) { useMapEvents({ click(e) { if (selectable) onChange(e.latlng.lat,e.latlng.lng); } }); return null; }
export default function MapPicker({latitude,longitude,onChange,reports=[],selectable=true}:Props) {
  const [ready,setReady]=useState(false);
  useEffect(()=>setReady(true),[]);
  if (!ready) return <div className="map-frame d-flex align-items-center justify-content-center muted">Loading map…</div>;
  return <div className="map-frame"><MapContainer center={[latitude,longitude]} zoom={13} scrollWheelZoom style={{height:'100%',width:'100%'}}>
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <ClickHandler onChange={onChange} selectable={selectable}/>
    {selectable && <Marker position={[latitude,longitude]} icon={markerIcon}/>}
    {reports.map(r=><Marker key={r.id} position={[r.latitude,r.longitude]} icon={markerIcon}><Tooltip>{r.title} · {r.status}</Tooltip></Marker>)}
  </MapContainer></div>;
}
