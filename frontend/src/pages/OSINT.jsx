import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Globe2, ShieldAlert, Activity, Server, MapPin, Database, ChevronRight, Terminal } from 'lucide-react';
import clsx from 'clsx';
import InfoBox from '../components/common/InfoBox';
import Globe from 'react-globe.gl';

const OSINT = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [dnsData, setDnsData] = useState(null);
  const [error, setError] = useState(null);
  
  const globeRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [countries, setCountries] = useState({ features: [] });

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
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setGeoData(null);
    setDnsData(null);
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      
      // Determine if it's an IP or Domain
      const isIP = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(query.trim());
      
      if (isIP) {
        const geoRes = await axios.post(`${baseUrl}/api/osint/geoip`, { ip: query.trim() });
        setGeoData(geoRes.data);
        
        if (globeRef.current && geoRes.data.lat && geoRes.data.lon) {
           globeRef.current.pointOfView({ lat: geoRes.data.lat, lng: geoRes.data.lon, altitude: 1.5 }, 2000);
           globeRef.current.controls().autoRotate = false;
        }
      } else {
        // Query DNS first
        const dnsRes = await axios.post(`${baseUrl}/api/osint/dns`, { domain: query.trim() });
        setDnsData(dnsRes.data);
        
        // Extract IP from DNS raw records to plot on globe
        const raw = dnsRes.data.raw_records || "";
        const ipMatch = raw.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/);
        if (ipMatch) {
            const extractedIp = ipMatch[0];
            const geoRes = await axios.post(`${baseUrl}/api/osint/geoip`, { ip: extractedIp });
            setGeoData(geoRes.data);
            if (globeRef.current && geoRes.data.lat && geoRes.data.lon) {
               globeRef.current.pointOfView({ lat: geoRes.data.lat, lng: geoRes.data.lon, altitude: 1.5 }, 2000);
               globeRef.current.controls().autoRotate = false;
            }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch threat intelligence.");
    } finally {
      setLoading(false);
    }
  };

  const ringData = geoData && geoData.lat && geoData.lon ? [{ lat: geoData.lat, lng: geoData.lon, maxR: 15, propagationSpeed: 2, repeatPeriod: 1000 }] : [];
  const htmlElementsData = geoData && geoData.lat && geoData.lon ? [{
    lat: geoData.lat,
    lng: geoData.lon,
    size: 20,
    color: 'red'
  }] : [];

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
            <Globe2 className="w-8 h-8 text-[var(--ts-blue)]" />
            OSINT Command Center
          </h1>
          <p className="text-ts-text-muted mt-1">Live open-source intelligence and global threat tracking.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-full min-h-0">
        {/* Left Panel: Search & Results */}
        <div className="col-span-4 flex flex-col gap-6 min-h-0">
            
          <form onSubmit={handleSearch} className="glass-panel p-6 shrink-0 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--ts-blue)] to-[var(--ts-purple)]"></div>
            <h2 className="text-lg font-bold text-[var(--ts-text)] mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-[var(--ts-blue)]" /> Threat Intel Query
            </h2>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter IP address or Domain..." 
                className="input-field flex-1 border border-[var(--ts-border)] focus:border-[var(--ts-blue)]/50" 
              />
              <button 
                type="submit" 
                disabled={loading || !query.trim()}
                className="btn-primary"
              >
                {loading ? 'Scanning...' : 'Track'}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>

          <div className="glass-panel flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0 relative">
            <div className="p-4 border-b border-[var(--ts-border)] bg-black/40 sticky top-0 backdrop-blur-md z-10">
              <h3 className="font-bold text-[var(--ts-text)] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--ts-cyan)]" /> Telemetry Results
              </h3>
            </div>
            
            <div className="p-4 space-y-6">
              {!geoData && !dnsData && !loading && !error && (
                <div className="h-48 flex flex-col items-center justify-center text-ts-text-muted opacity-60">
                  <Globe2 className="w-12 h-12 mb-3 opacity-20" />
                  <p>Awaiting target telemetry...</p>
                </div>
              )}

              {loading && (
                 <div className="space-y-4 animate-pulse">
                    <div className="h-24 bg-white/5 rounded-lg border border-[var(--ts-border)]"></div>
                    <div className="h-40 bg-white/5 rounded-lg border border-[var(--ts-border)]"></div>
                 </div>
              )}

              {geoData && !loading && (
                <div className="bg-black/40 border border-[var(--ts-border)] rounded-lg overflow-hidden">
                  <div className="bg-[var(--ts-blue)]/10 p-3 border-b border-[var(--ts-border)] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--ts-blue)]" />
                    <span className="font-bold text-sm tracking-wider uppercase">Geolocation Intel</span>
                  </div>
                  <div className="p-4 space-y-3 text-sm font-mono text-gray-300">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-500">TARGET IP</span>
                      <span className="text-[var(--ts-blue)] font-bold">{geoData.ip}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-500">COUNTRY</span>
                      <span>{geoData.country}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-500">CITY</span>
                      <span>{geoData.city}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-500">ISP</span>
                      <span className="truncate max-w-[150px]" title={geoData.isp}>{geoData.isp}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-500">ORG/ASN</span>
                      <span className="truncate max-w-[150px]" title={geoData.org || geoData.asn}>{geoData.org || geoData.asn}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-gray-500">COORDINATES</span>
                      <span className="text-green-400">[{geoData.lat}, {geoData.lon}]</span>
                    </div>
                  </div>
                </div>
              )}

              {dnsData && !loading && (
                <div className="bg-black/40 border border-[var(--ts-border)] rounded-lg overflow-hidden">
                  <div className="bg-[var(--ts-purple)]/10 p-3 border-b border-[var(--ts-border)] flex items-center gap-2">
                    <Database className="w-4 h-4 text-[var(--ts-purple)]" />
                    <span className="font-bold text-sm tracking-wider uppercase">DNS Topology</span>
                  </div>
                  <div className="p-4 bg-black/60 font-mono text-xs text-[var(--ts-purple)] break-all whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto custom-scrollbar">
                    {dnsData.raw_records}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: 3D Globe */}
        <div className="col-span-8 glass-panel relative overflow-hidden rounded-xl border border-[var(--ts-border)] flex flex-col min-h-0">
          <div className="absolute top-6 left-6 z-10 pointer-events-none">
             <div className="flex items-center gap-2 bg-black/50 p-2 px-4 rounded-full border border-white/10 backdrop-blur-md">
                <span className={clsx("w-2 h-2 rounded-full animate-pulse", (geoData && !loading) ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]" : "bg-ts-cyan")}></span>
                <span className="font-mono text-xs tracking-widest uppercase font-bold text-white">
                  {loading ? "Establishing Satellite Link..." : geoData ? "TARGET LOCK ACQUIRED" : "ORBITAL SCAN MODE"}
                </span>
             </div>
          </div>
          
          <div ref={containerRef} className="w-full h-full bg-black cursor-move">
            {dimensions.width > 0 && (
              <Globe
                ref={globeRef}
                width={dimensions.width}
                height={dimensions.height}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                backgroundColor="rgba(0,0,0,0)"
                
                polygonsData={countries.features}
                polygonAltitude={0.01}
                polygonCapColor={() => 'rgba(0, 240, 255, 0.05)'}
                polygonSideColor={() => 'rgba(0, 240, 255, 0.02)'}
                polygonStrokeColor={() => '#00f0ff40'}
                
                ringsData={ringData}
                ringColor={() => '#ef4444'}
                ringMaxRadius="maxR"
                ringPropagationSpeed="propagationSpeed"
                ringRepeatPeriod="repeatPeriod"

                htmlElementsData={htmlElementsData}
                htmlElement={d => {
                  const el = document.createElement('div');
                  el.innerHTML = `
                    <div style="display:flex; flex-direction:column; items-center; justify-center;">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <div style="background:rgba(0,0,0,0.8); border:1px solid #ef4444; color:white; padding:2px 6px; font-family:monospace; font-size:10px; border-radius:4px; margin-top:4px; white-space:nowrap;">
                        TARGET IP<br/>${geoData?.ip}
                      </div>
                    </div>
                  `;
                  el.style.transform = `translate(-50%, -50%)`;
                  el.style.pointerEvents = 'none';
                  return el;
                }}
                
                atmosphereColor="#0ea5e9"
                atmosphereAltitude={0.15}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OSINT;
