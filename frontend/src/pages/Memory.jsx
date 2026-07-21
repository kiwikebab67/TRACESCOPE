import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cpu, Terminal, ShieldAlert, Network, Code, ServerCrash, UploadCloud } from 'lucide-react';
import clsx from 'clsx';
import InfoBox from '../components/common/InfoBox';
import FileUpload from '../components/FileUpload';

const Memory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pslist');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const activeCaseId = localStorage.getItem('activeCaseId');

  const fetchMemory = async () => {
    try {
      const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
      const res = await axios.get(`${baseUrl}/api/memory/latest`);
      setLogs(res.data.analysis_logs || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, []);

  const pslist = logs.filter(l => l.source.includes('pslist'));
  const netscan = logs.filter(l => l.source.includes('netscan'));
  const malfind = logs.filter(l => l.source.includes('malfind'));

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
            <Cpu className="w-8 h-8 text-[var(--ts-blue)]" />
            Memory Forensics (Volatility)
          </h1>
          <p className="text-ts-text-muted mt-1">Deep analysis of physical memory dumps for advanced persistent threats.</p>
        </div>
        <div className="flex bg-black/40 p-1 rounded-lg border border-[var(--ts-border)]">
          <button onClick={() => setActiveTab('pslist')} className={clsx("px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2", activeTab === 'pslist' ? "bg-[var(--ts-blue)] text-white shadow-[0_0_10px_rgba(0,240,255,0.3)]" : "text-ts-text-muted hover:text-white")}>
            <Terminal className="w-4 h-4" /> PsList
          </button>
          <button onClick={() => setActiveTab('netscan')} className={clsx("px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2", activeTab === 'netscan' ? "bg-[var(--ts-blue)] text-white shadow-[0_0_10px_rgba(0,240,255,0.3)]" : "text-ts-text-muted hover:text-white")}>
            <Network className="w-4 h-4" /> NetScan
          </button>
          <button onClick={() => setActiveTab('malfind')} className={clsx("px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2", activeTab === 'malfind' ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "text-ts-text-muted hover:text-white")}>
            <ServerCrash className="w-4 h-4" /> Malfind (Injections)
          </button>
        </div>
      </div>

      <InfoBox 
        title="What does this do?" 
        description="Memory Forensics looks inside the computer's temporary brain (RAM). Advanced viruses often try to hide by never saving themselves to the hard drive, living purely in memory. This tool extracts raw text and hidden processes from that memory to expose them." 
      />

      <div className="flex-1 glass-panel flex flex-col min-h-0 relative overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-black/80 px-4 py-2 flex items-center gap-2 border-b border-[var(--ts-border)]">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-500 font-mono ml-2">volatility -f memdump.raw --profile=Win10x64_19041 {activeTab}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 font-mono text-sm bg-black/40 custom-scrollbar">
          {loading ? (
            <div className="text-[var(--ts-blue)] animate-pulse">Running Volatility Plugins...</div>
          ) : (
            <div className="space-y-4">
              {(activeTab === 'pslist' ? pslist : activeTab === 'netscan' ? netscan : malfind).map((log, i) => (
                <div key={i} className={clsx("p-4 rounded border", log.risk_level === 'High' ? "bg-red-950/30 border-red-500/50" : "bg-black/40 border-[var(--ts-border)]")}>
                  <div className="flex items-center gap-3 mb-2">
                    {log.risk_level === 'High' ? <ShieldAlert className="w-5 h-5 text-red-500" /> : <Code className="w-5 h-5 text-[var(--ts-blue)]" />}
                    <span className="text-gray-400 text-xs">[{log.time_created}]</span>
                  </div>
                  <div className={clsx("whitespace-pre-wrap", log.risk_level === 'High' ? "text-red-200" : "text-green-400")}>
                    {log.description}
                  </div>
                </div>
              ))}
              {(activeTab === 'pslist' ? pslist : activeTab === 'netscan' ? netscan : malfind).length === 0 && (
                <div className="text-gray-500 italic">No artifacts found for this plugin.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {isUploadOpen && (
        <FileUpload 
          caseId={activeCaseId} 
          onClose={() => setIsUploadOpen(false)} 
          onUploadComplete={() => {
            setIsUploadOpen(false);
            fetchMemory();
          }}
        />
      )}
    </div>
  );
};

export default Memory;
