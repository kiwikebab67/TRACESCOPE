import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Usb, Key, UploadCloud, AlertTriangle, ShieldAlert, Terminal, ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import InfoBox from '../components/common/InfoBox';
import FileUpload from '../components/FileUpload';
import UsbTopology from '../components/UsbTopology';

const parseDescription = (desc) => {
  if (!desc) return { text: '', threat: null, mitre: [], raw: null };
  let text = desc;
  
  let threat = null;
  if (text.includes('[THREAT INTEL]')) {
    const parts = text.split('[THREAT INTEL]');
    const afterThreat = parts[1];
    const nextBracketIndex = afterThreat.indexOf('[');
    if (nextBracketIndex !== -1) {
      threat = afterThreat.substring(0, nextBracketIndex).trim();
      text = parts[0] + afterThreat.substring(nextBracketIndex);
    } else {
      threat = afterThreat.trim();
      text = parts[0];
    }
  }

  const mitre = [];
  const mitreRegex = /\[MITRE (.*?)\]/g;
  text = text.replace(mitreRegex, (match, p1) => {
    mitre.push(p1);
    return '';
  });

  let raw = null;
  if (text.includes('[RAW LOG]')) {
    const parts = text.split('[RAW LOG]');
    raw = parts[1].trim();
    text = parts[0];
  }

  return { text: text.trim(), threat, mitre, raw };
};

const LogEntry = ({ log }) => {
  const [rawOpen, setRawOpen] = useState(false);
  const { text, threat, mitre, raw } = parseDescription(log.description);
  
  return (
    <div className={clsx("p-4 rounded-xl border transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,0,0,0.5)]", log.risk_level === 'High' ? "bg-red-950/20 border-red-500/30 hover:border-red-500/60" : log.risk_level === 'Medium' ? "bg-yellow-950/20 border-yellow-500/30 hover:border-yellow-500/60" : "bg-black/40 border-[var(--ts-border)] hover:border-[var(--ts-blue)]/50")}>
      <div className="flex items-center gap-3 mb-3">
        <div className={clsx("p-2 rounded-lg", log.source.includes('USB') ? "bg-[var(--ts-blue)]/10 text-[var(--ts-blue)]" : "bg-yellow-500/10 text-yellow-500")}>
          {log.source.includes('USB') ? <Usb className="w-4 h-4" /> : <Key className="w-4 h-4" />}
        </div>
        <span className="text-gray-400 text-xs font-mono">[{log.time_created || 'UNKNOWN TIME'}]</span>
        <span className="text-white font-bold font-mono text-sm">{log.source}</span>
        
        <div className="flex gap-2 ml-auto">
          {mitre.map(m => (
            <span key={m} className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              MITRE {m}
            </span>
          ))}
        </div>
      </div>

      <div className={clsx("whitespace-pre-wrap font-mono text-sm leading-relaxed mb-3", log.risk_level === 'High' ? "text-red-200" : log.risk_level === 'Medium' ? "text-yellow-200" : "text-gray-300")}>
        {text}
      </div>

      {threat && (
        <div className="mb-3 p-3 bg-red-950/40 border border-red-500/40 rounded-lg flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-500 text-xs uppercase tracking-wider mb-1">Threat Intelligence</h4>
            <p className="text-sm text-red-200">{threat}</p>
          </div>
        </div>
      )}

      {raw && (
        <div className="mt-4 border border-[var(--ts-border)] rounded-lg overflow-hidden">
          <button 
            onClick={() => setRawOpen(!rawOpen)}
            className="w-full flex items-center justify-between p-2 bg-black/60 hover:bg-black/80 text-xs text-gray-400 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[var(--ts-blue)]" />
              <span>View Raw Artifact</span>
            </div>
            {rawOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {rawOpen && (
            <div className="p-3 bg-black/90 font-mono text-[11px] text-[var(--ts-cyan)] break-all whitespace-pre-wrap">
              {raw}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const UsbAnalysis = () => {
  const [logs, setLogs] = useState([]);
  const [currentEvidence, setCurrentEvidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const activeCaseId = localStorage.getItem('activeCaseId');

  const fetchUsb = async () => {
    if (!activeCaseId) {
      setLoading(false);
      return;
    }
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      const res = await axios.get(`${baseUrl}/api/usb?caseId=${activeCaseId}`);
      if (res.data.status === 'success') {
        setLogs(res.data.usb_logs || []);
        setCurrentEvidence(res.data.current_evidence);
        setError(null);
      } else {
        setError(res.data.message);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch USB logs.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsb();
  }, [activeCaseId]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto min-h-[calc(100vh-120px)] h-auto pb-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
            <Usb className="w-8 h-8 text-[var(--ts-blue)]" />
            USB Analysis
          </h1>
          <p className="text-ts-text-muted mt-1">Track unauthorized USB insertions and historical device records.</p>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="btn-primary flex items-center gap-2 mr-4"
            disabled={!activeCaseId}
            title={!activeCaseId ? "Open a case first in Investigations" : "Upload Evidence"}
          >
            <UploadCloud className="w-4 h-4" />
            Upload Evidence
          </button>
        </div>
      </div>

      <InfoBox 
        title="What does this do?" 
        description="The USB Engine parses Windows Registry Hives (.reg, .dat) specifically for USBSTOR keys to automatically locate records of unauthorized USB devices previously plugged into the system." 
      />

      <div className="h-64 shrink-0 shadow-[0_0_30px_rgba(14,165,233,0.1)] rounded-xl overflow-hidden">
        <UsbTopology logs={logs} />
      </div>

      <div className="flex-1 glass-panel flex flex-col min-h-[400px] relative overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-black/80 px-4 py-2 flex items-center justify-between border-b border-[var(--ts-border)]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-500 font-mono ml-2">regripper -f NTUSER.DAT</span>
          </div>
          {currentEvidence && (
            <div className="text-xs font-mono text-[var(--ts-blue)] flex items-center gap-2">
              <span className="text-gray-500">Target Evidence:</span> {currentEvidence}
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 font-mono text-sm bg-black/40 custom-scrollbar">
          {loading ? (
            <div className="text-[var(--ts-blue)] animate-pulse">Parsing USB Devices...</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, i) => (
                <LogEntry key={i} log={log} />
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500 italic text-center mt-10">
                  {error || "No USB artifacts found. Please upload a .reg or .dat file to begin analysis."}
                </div>
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
            fetchUsb();
          }}
        />
      )}
    </div>
  );
};

export default UsbAnalysis;
