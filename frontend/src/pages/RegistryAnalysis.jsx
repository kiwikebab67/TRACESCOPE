import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Usb, Key, UploadCloud, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import InfoBox from '../components/common/InfoBox';
import FileUpload from '../components/FileUpload';

const RegistryAnalysis = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const activeCaseId = localStorage.getItem('activeCaseId');

  const fetchRegistry = async () => {
    if (!activeCaseId) {
      setLoading(false);
      return;
    }
    
    try {
      const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
      const res = await axios.get(`${baseUrl}/api/registry?caseId=${activeCaseId}`);
      if (res.data.status === 'success') {
        setLogs(res.data.registry_logs || []);
        setError(null);
      } else {
        setError(res.data.message);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch registry logs.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, [activeCaseId]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
            <Database className="w-8 h-8 text-[var(--ts-blue)]" />
            Registry & USB Analysis
          </h1>
          <p className="text-ts-text-muted mt-1">Extract malware persistence (Run keys) and historic USB insertions.</p>
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
        description="The Registry Engine parses Windows Hive files (.reg, .dat) to automatically locate malware persistence mechanisms (like Auto-Run keys) and records of unauthorized USB devices previously plugged into the system." 
      />

      <div className="flex-1 glass-panel flex flex-col min-h-0 relative overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-black/80 px-4 py-2 flex items-center gap-2 border-b border-[var(--ts-border)]">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-500 font-mono ml-2">regripper -f NTUSER.DAT</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 font-mono text-sm bg-black/40 custom-scrollbar">
          {loading ? (
            <div className="text-[var(--ts-blue)] animate-pulse">Parsing Registry Hives...</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, i) => (
                <div key={i} className={clsx("p-4 rounded border", log.risk_level === 'High' ? "bg-red-950/30 border-red-500/50" : log.risk_level === 'Medium' ? "bg-yellow-950/30 border-yellow-500/50" : "bg-black/40 border-[var(--ts-border)]")}>
                  <div className="flex items-center gap-3 mb-2">
                    {log.source.includes('USB') ? <Usb className="w-5 h-5 text-[var(--ts-blue)]" /> : <Key className="w-5 h-5 text-yellow-500" />}
                    <span className="text-gray-400 text-xs">[{log.time_created}]</span>
                    <span className="text-[var(--ts-blue)] font-bold">{log.source}</span>
                  </div>
                  <div className={clsx("whitespace-pre-wrap", log.risk_level === 'High' ? "text-red-200" : log.risk_level === 'Medium' ? "text-yellow-200" : "text-gray-300")}>
                    {log.description}
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500 italic text-center mt-10">
                  {error || "No registry artifacts found. Please upload a .reg or .dat file to begin analysis."}
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
            fetchRegistry();
          }}
        />
      )}
    </div>
  );
};

export default RegistryAnalysis;
