// ui/src/pages/GlobeDemo.tsx
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMapStyle } from '../utils/mapStyle';

export default function GlobeDemo() {
  const ref = useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    if (!ref.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: getMapStyle('globe'), // now supported
      center: [0, 0],
      zoom: 2
    });
    return () => map.remove();
  },[]);
  return <div ref={ref} style={{height:'100vh', width:'100%'}} />;
}
