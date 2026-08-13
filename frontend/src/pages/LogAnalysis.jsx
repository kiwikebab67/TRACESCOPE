import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, ShieldAlert, ShieldCheck, UploadCloud, Terminal, Cloud } from 'lucide-react';
import clsx from 'clsx';
import InfoBox from '../components/common/InfoBox';
import FileUpload from '../components/FileUpload';

const LogAnalysis = () => {
  const [logs, setLogs] = useState([]);
  const [currentEvidence, setCurrentEvidence] = useState(null);
  const [currentEvidenceHash, setCurrentEvidenceHash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const activeCaseId = localStorage.getItem('activeCaseId');

  const fetchLogs = async () => {
    if (!activeCaseId) {
      setLoading(false);
      return;
    }
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      const res = await axios.get(`${baseUrl}/api/logs?caseId=${activeCaseId}&t=${new Date().getTime()}`);
      if (res.data.status === 'success') {
        setLogs(res.data.analysis_logs || []);
        setCurrentEvidence(res.data.current_evidence);
        setCurrentEvidenceHash(res.data.current_evidence_hash);
        setError(null);
      } else {
        setError(res.data.message);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch event logs.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeCaseId]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
            <FileText className="w-8 h-8 text-[var(--ts-blue)]" />
            Log Analysis (EVTX & CloudTrail)
          </h1>
          <p className="text-ts-text-muted mt-1">Parse Windows Event Logs and AWS CloudTrail logs for authentication anomalies and lateral movement.</p>
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
        description="The Security Log Engine parses Windows Event Logs (.evtx) and AWS CloudTrail Logs (.json) to automatically detect malicious login attempts, privilege escalations, and defense evasion." 
      />

      <div className="flex-1 glass-panel flex flex-col min-h-0 relative overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-black/80 px-4 py-2 flex items-center justify-between border-b border-[var(--ts-border)]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-500 font-mono ml-2">sysmon -i security.evtx</span>
          </div>
          {currentEvidence && (
            <div className="flex flex-col items-end gap-1">
              <div className="text-xs font-mono text-[var(--ts-blue)] flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Target Evidence:</span> {currentEvidence}
              </div>
              {currentEvidenceHash && (
                <div className="text-[10px] font-mono text-[var(--ts-pink)] flex items-center gap-1 opacity-80" title="Cryptographically Sealed SHA-256 Hash">
                  <ShieldCheck className="w-3 h-3" />
                  {currentEvidenceHash.substring(0, 32)}...
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 font-mono text-sm bg-gray-50 dark:bg-black/40 custom-scrollbar">
          {loading ? (
            <div className="text-[var(--ts-blue)] animate-pulse">Parsing Event Logs...</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, i) => (
                <div key={i} className={clsx("p-4 rounded border transition-colors", 
                  log.risk_level === 'High' ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-500/50" : 
                  log.risk_level === 'Medium' ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-500/50" : 
                  "bg-white border-gray-200 dark:bg-black/40 dark:border-[var(--ts-border)]")}>
                  <div className="flex items-center gap-3 mb-2">
                    {log.source.includes('Cloud') ? <Cloud className="w-5 h-5 text-blue-500 dark:text-blue-400" /> : (log.risk_level === 'High' ? <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-500" /> : log.risk_level === 'Medium' ? <ShieldAlert className="w-5 h-5 text-yellow-600 dark:text-yellow-500" /> : <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-500" />)}
                    <span className="text-gray-500 dark:text-gray-400 text-xs">[{log.time_created}]</span>
                    {log.source.includes('Cloud') && <span className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">AWS CLOUD</span>}
                    <span className="text-[var(--ts-blue)] font-bold">Event ID: {log.event_id}</span>
                  </div>
                  <div className={clsx("whitespace-pre-wrap font-medium", 
                    log.risk_level === 'High' ? "text-red-700 dark:text-red-200" : 
                    log.risk_level === 'Medium' ? "text-yellow-700 dark:text-yellow-200" : 
                    "text-green-700 dark:text-green-400")}>
                    {log.description}
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500 italic text-center mt-10">
                  {error || "No event logs found. Please upload a .evtx file to begin analysis."}
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
            fetchLogs();
          }}
        />
      )}
    </div>
  );
};

export default LogAnalysis;
