import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Network as NetworkIcon, Search, Download, AlertTriangle, ShieldAlert, FileText, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const Network = () => {
  const [packets, setPackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPacket, setSelectedPacket] = useState(null);

  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
        const res = await axios.get(`${baseUrl}/api/network`);
        setPackets(res.data.packets);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchNetwork();
  }, []);

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
            <NetworkIcon className="w-8 h-8 text-[var(--ts-blue)]" />
            Network Protocol Analyzer
          </h1>
          <p className="text-ts-text-muted mt-1">Deep packet inspection and live traffic analysis.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-ts-text-muted" />
            <input type="text" placeholder="Filter by IP, Protocol..." className="input-field pl-9 w-64" />
          </div>
          <button className="btn-secondary py-2 px-4 flex items-center gap-2"><Download className="w-4 h-4" /> PCAP</button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Packet List */}
        <div className="flex-1 glass-panel flex flex-col min-w-0">
          <div className="grid grid-cols-12 gap-2 p-3 border-b border-[var(--ts-border)] text-xs font-bold text-ts-text-muted uppercase tracking-wider bg-black/20">
            <div className="col-span-1">No.</div>
            <div className="col-span-1">Time</div>
            <div className="col-span-2">Source</div>
            <div className="col-span-2">Destination</div>
            <div className="col-span-1">Protocol</div>
            <div className="col-span-1">Length</div>
            <div className="col-span-4">Info</div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-ts-blue animate-pulse">Capturing packets...</div>
            ) : (
              packets.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedPacket(p)}
                  className={clsx(
                    "grid grid-cols-12 gap-2 p-2 border-b border-[var(--ts-border)]/50 text-sm font-mono cursor-pointer hover:bg-white/5 transition-colors items-center",
                    selectedPacket?.id === p.id ? "bg-[var(--ts-blue)]/20 border-l-4 border-l-[var(--ts-blue)]" : "border-l-4 border-l-transparent",
                    p.risk === 'High' ? "text-red-400 bg-red-950/20" : "text-[var(--ts-text)]"
                  )}
                >
                  <div className="col-span-1 text-ts-text-muted">{p.id}</div>
                  <div className="col-span-1 text-ts-text-muted">{p.time}</div>
                  <div className="col-span-2 truncate" title={p.source_ip}>{p.source_ip}</div>
                  <div className="col-span-2 truncate" title={p.dest_ip}>{p.dest_ip}</div>
                  <div className={clsx("col-span-1 font-bold", p.protocol.includes('TLS') ? 'text-[var(--ts-purple)]' : p.protocol === 'DNS' ? 'text-green-400' : 'text-[var(--ts-blue)]')}>{p.protocol}</div>
                  <div className="col-span-1 text-ts-text-muted">{p.length}</div>
                  <div className="col-span-4 truncate text-xs flex items-center gap-2">
                    {p.risk === 'High' && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                    {p.info}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Packet Inspector Side Panel */}
        {selectedPacket && (
          <div className="w-96 glass-panel flex flex-col shrink-0 min-h-0">
            <div className="p-4 border-b border-[var(--ts-border)] flex justify-between items-center bg-black/20">
              <h3 className="font-bold text-[var(--ts-text)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--ts-blue)]" /> Packet Details
              </h3>
              <button onClick={() => setSelectedPacket(null)} className="text-ts-text-muted hover:text-white">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-sm">
              {selectedPacket.risk === 'High' && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-500 text-xs uppercase mb-1">Threat Indicator Match</h4>
                    <p className="text-xs text-red-200">{selectedPacket.note || "Suspicious signature detected in payload."}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-1 font-bold text-[var(--ts-text)] mb-1 cursor-pointer hover:text-[var(--ts-blue)]">
                    <ChevronRight className="w-4 h-4" /> Frame {selectedPacket.id}: {selectedPacket.length} bytes on wire
                  </div>
                  <div className="pl-5 text-xs text-ts-text-muted space-y-1 font-mono">
                    <div>Arrival Time: Jul 20, 2026 14:32:01.000000000 UTC</div>
                    <div>Epoch Time: 1784557921.000000000</div>
                    <div>Frame Length: {selectedPacket.length} bytes</div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-1 font-bold text-[var(--ts-text)] mb-1 cursor-pointer hover:text-[var(--ts-blue)]">
                    <ChevronRight className="w-4 h-4" /> Internet Protocol Version 4, Src: {selectedPacket.source_ip}, Dst: {selectedPacket.dest_ip}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1 font-bold text-[var(--ts-text)] mb-1 cursor-pointer hover:text-[var(--ts-blue)]">
                    <ChevronRight className="w-4 h-4" /> {selectedPacket.protocol} Protocol
                  </div>
                </div>
                
                <div className="pt-4 border-t border-[var(--ts-border)]">
                  <h4 className="font-bold text-xs uppercase text-ts-text-muted mb-2 tracking-wider">Hex Dump (Simulated)</h4>
                  <div className="bg-black/50 p-3 rounded border border-[var(--ts-border)] font-mono text-[10px] text-gray-400 break-all leading-relaxed">
                    0000  45 00 00 3c 1c 46 40 00 40 06 b1 e6 c0 a8 01 69<br/>
                    0010  01 01 01 01 d4 31 01 bb 00 00 00 00 00 00 00 00<br/>
                    0020  a0 02 fa f0 68 83 00 00 02 04 05 b4 04 02 08 0a<br/>
                    0030  {selectedPacket.risk === 'High' ? <span className="text-red-500 font-bold bg-red-500/20 px-1">6d 61 6c 77 61 72 65</span> : "00 00 00 00 00 00 00" } 01 03 03 07<br/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Network;
