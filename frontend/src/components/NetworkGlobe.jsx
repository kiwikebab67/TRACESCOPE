import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';

const NetworkGlobe = ({ packets }) => {
  const globeRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [countries, setCountries] = useState({ features: [] });
  const containerRef = useRef();

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries)
      .catch(err => console.error("Could not load globe geojson:", err));
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
    }

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (globeRef.current) {
      // Auto-rotate
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 1;
      
      // Setup default camera position
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
    }
  }, []);

  // Generate random coordinates for IPs since we don't have a real GeoIP database locally
  // In a real app, this would use a MaxMind DB or similar.
  const ipCache = useRef(new Map());
  
  const getGeoForIp = (ip) => {
    if (!ip) return null;
    if (ipCache.current.has(ip)) return ipCache.current.get(ip);
    
    // Hash IP to consistent lat/lng
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = ip.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const lat = (hash % 180) - 90;
    const lng = ((hash * 13) % 360) - 180;
    
    const geo = { lat, lng };
    ipCache.current.set(ip, geo);
    return geo;
  };

  const arcsData = useMemo(() => {
    if (!packets || packets.length === 0) return [];
    
    return packets.map(p => {
      const src = getGeoForIp(p.source_ip);
      const dst = getGeoForIp(p.dest_ip);
      const isHighRisk = p.risk === 'High';
      
      return {
        startLat: src.lat,
        startLng: src.lng,
        endLat: dst.lat,
        endLng: dst.lng,
        color: isHighRisk ? ['#ef4444', '#ff003c'] : ['#0ea5e9', '#8b5cf6'],
        isHighRisk
      };
    }).slice(0, 100); // Limit to 100 arcs for performance
  }, [packets]);

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0 bg-[#020617] text-white overflow-hidden flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--ts-blue)]/10 to-transparent pointer-events-none z-10" />
      
      {dimensions.width > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          backgroundColor="rgba(0,0,0,0)"
          
          polygonsData={countries.features}
          polygonAltitude={0.01}
          polygonCapColor={() => 'rgba(0, 240, 255, 0.15)'}
          polygonSideColor={() => 'rgba(0, 240, 255, 0.05)'}
          polygonStrokeColor={() => '#00f0ff'}
          
          arcsData={arcsData}
          arcStartLat={d => d.startLat}
          arcStartLng={d => d.startLng}
          arcEndLat={d => d.endLat}
          arcEndLng={d => d.endLng}
          arcColor={d => d.color}
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={d => d.isHighRisk ? 1000 : 2000}
          arcStroke={d => d.isHighRisk ? 1.5 : 0.5}
          
          atmosphereColor="#0ea5e9"
          atmosphereAltitude={0.15}
        />
      )}
      
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <h3 className="font-bold text-ts-cyan text-sm tracking-widest uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-ts-cyan animate-pulse"></span>
          Global Threat Telemetry
        </h3>
        <p className="text-[10px] text-ts-text-muted mt-1">Live routing visualization.</p>
      </div>
    </div>
  );
};

export default NetworkGlobe;
