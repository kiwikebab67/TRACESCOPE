import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { ShieldAlert, Crosshair, Wifi } from 'lucide-react';

const ThreatMap = () => {
  const globeRef = useRef();
  const [arcsData, setArcsData] = useState([]);
  const [ringsData, setRingsData] = useState([]);
  const [htmlData, setHtmlData] = useState([]);

  // Generate simulated realistic 3D attack arcs targeting a central server
  useEffect(() => {
    // San Francisco (Server / Target)
    const targetLat = 37.7749;
    const targetLng = -122.4194;

    // Origin sources
    const origins = [
      { lat: 55.7558, lng: 37.6173, name: 'Moscow, RU' },
      { lat: 39.9042, lng: 116.4074, name: 'Beijing, CN' },
      { lat: 39.0194, lng: 125.7625, name: 'Pyongyang, KP' },
      { lat: 35.6892, lng: 51.3890, name: 'Tehran, IR' },
      { lat: 51.5072, lng: -0.1276, name: 'London, UK' },
      { lat: -23.5505, lng: -46.6333, name: 'Sao Paulo, BR' }
    ];

    // Generate arcs
    const arcs = origins.map(origin => ({
      startLat: origin.lat,
      startLng: origin.lng,
      endLat: targetLat,
      endLng: targetLng,
      color: ['#ff00ff', '#00f0ff'] // Gradient from pink to cyan
    }));

    // Generate pulse rings at origins
    const rings = origins.map(origin => ({
      lat: origin.lat,
      lng: origin.lng,
      color: '#ff003c' // Magenta
    }));
    
    // Add target ring
    rings.push({
      lat: targetLat,
      lng: targetLng,
      color: '#00f0ff' // Cyan
    });

    const markers = origins.map(origin => ({
      lat: origin.lat,
      lng: origin.lng,
      name: origin.name,
      type: 'Source'
    }));
    markers.push({
      lat: targetLat,
      lng: targetLng,
      name: 'TRACESCOPE-HQ',
      type: 'Target'
    });

    setArcsData(arcs);
    setRingsData(rings);
    setHtmlData(markers);

    // Auto-rotate the globe slowly
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      globeRef.current.pointOfView({ lat: 20, lng: -40, altitude: 2.2 });
    }
  }, []);

  return (
    <div className="w-full h-[500px] relative overflow-hidden bg-[#020617] rounded-xl border border-[var(--ts-border)] shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
      
      {/* TraceScope Branding Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 overflow-hidden">
        <h1 className="text-[12rem] font-black tracking-tighter text-white whitespace-nowrap select-none blur-[2px]">
          TRACESCOPE
        </h1>
      </div>

      {/* Title & Overlay UI */}
      <div className="absolute top-5 left-5 z-20 pointer-events-none">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 drop-shadow-md">
          <Wifi className="w-4 h-4 text-[var(--ts-blue)] animate-pulse" />
          Global Threat Telemetry
        </h2>
        <p className="text-xs text-ts-text-muted mt-1 font-mono">Live 3D WebGL Projection</p>
        
        <div className="mt-4 flex flex-col gap-2 bg-black/40 backdrop-blur-md border border-[var(--ts-border)] p-3 rounded-lg w-64">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">Incoming Vectors</span>
            <span className="text-[var(--ts-pink)] font-bold font-mono">1,024</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">Primary Target</span>
            <span className="text-[var(--ts-blue)] font-bold font-mono">US-WEST-1</span>
          </div>
        </div>
      </div>

      {/* Target Marker HUD */}
      <div className="absolute bottom-5 right-5 z-20 pointer-events-none bg-black/40 backdrop-blur-md border border-[var(--ts-border)] p-3 rounded-lg">
         <div className="flex items-center gap-2 text-xs">
           <Crosshair className="w-4 h-4 text-green-400 animate-spin-slow" />
           <span className="text-gray-300">Target Acquired</span>
         </div>
      </div>

      <Globe
        ref={globeRef}
        height={500}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        
        // Render glowing arcs
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={2000}
        arcAltitudeAutoScale={0.4}
        
        // Render pulse rings
        ringsData={ringsData}
        ringColor="color"
        ringMaxRadius={4}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1000}
        
        // Atmosphere Glow
        atmosphereColor="#00f0ff"
        atmosphereAltitude={0.2}
        
        // Interactive HUD Markers
        htmlElementsData={htmlData}
        htmlElement={d => {
          const el = document.createElement('div');
          el.innerHTML = `
            <div style="color: ${d.type === 'Target' ? '#00f0ff' : '#ff003c'}; font-family: monospace; font-size: 11px; font-weight: bold; background: rgba(0,0,0,0.7); padding: 4px 8px; border-radius: 4px; border: 1px solid ${d.type === 'Target' ? '#00f0ff' : '#ff003c'}; white-space: nowrap; backdrop-filter: blur(4px); box-shadow: 0 0 10px ${d.type === 'Target' ? 'rgba(0,240,255,0.3)' : 'rgba(255,0,60,0.3)'}; cursor: crosshair;">
              ${d.type === 'Source' ? '⚠ ORIGIN:' : '⌖'} ${d.name}
            </div>
          `;
          return el;
        }}
        htmlTransitionDuration={250}
      />
    </div>
  );
};

export default ThreatMap;
