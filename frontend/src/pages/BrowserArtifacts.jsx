import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Globe, Clock, Hash, AlertTriangle, Search, Activity, ExternalLink } from 'lucide-react';
import InfoBox from '../components/common/InfoBox';
import EmptyState from '../components/common/EmptyState';
import FileUpload from '../components/FileUpload';

const BrowserArtifacts = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [currentEvidence, setCurrentEvidence] = useState(null);
  const activeCaseId = localStorage.getItem('activeCaseId');

  const fetchLogs = async () => {
    if (!activeCaseId) {
      setLoading(false);
      return;
    }
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      const response = await axios.get(`${baseUrl}/api/browser?caseId=${activeCaseId}`);
      if (response.data.status === 'success') {
        setLogs(response.data.browser_logs || []);
        setCurrentEvidence(response.data.current_evidence);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeCaseId]);

  if (loading) {
    return <div className="p-8 text-center text-ts-text-muted">Extracting Browser History...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2 flex items-center gap-3">
            <Globe className="w-8 h-8 text-[var(--ts-pink)]" />
            Browser Forensics
          </h1>
          <p className="text-ts-text-muted">Analyze SQLite history databases for web activity, C2 beaconing, and credential access.</p>
        </div>
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="btn-primary flex items-center gap-2"
          disabled={!activeCaseId}
        >
          Upload Artifact
        </button>
      </div>

      <InfoBox 
        title="What is Browser Forensics?" 
        description="Modern web browsers (Chrome, Edge, Firefox) store all user history, downloads, and search queries inside hidden SQLite databases on the hard drive. By uploading a 'History' file here, TraceScope's parser reads the SQLite tables and identifies URLs that match known malicious infrastructure, helping you trace exactly how a machine was infected." 
      />

      {!activeCaseId ? (
        <EmptyState 
          icon={AlertTriangle} 
          title="No Active Case" 
          description="You must select an active case in the Investigations tab before viewing browser artifacts."
        />
      ) : logs.length === 0 ? (
        <EmptyState 
          icon={Search} 
          title="Awaiting SQLite Databases" 
          description="No browser history found. Upload a Chrome 'History' file or Firefox 'places.sqlite' database to begin extraction."
        />
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-[var(--ts-blue)] bg-[var(--ts-blue)]/10 p-3 rounded-lg border border-[var(--ts-blue)]/30 font-mono">
            <Activity className="w-4 h-4" />
            Extracted {logs.length} URLs from Source: <span className="font-bold">{currentEvidence}</span>
          </div>

          <div className="grid gap-4">
            {logs.map((log) => (
              <div key={log.id} className={`glass-panel p-4 border-l-4 ${
                log.risk_level === 'High' ? 'border-red-500' :
                log.risk_level === 'Medium' ? 'border-yellow-500' :
                'border-[var(--ts-blue)]'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ts-text-muted">
                    {log.source}
                  </span>
                  <div className="flex items-center gap-4 text-xs font-mono text-ts-text-muted">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {log.time_created}</span>
                    <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> EVT-{log.event_id}</span>
                  </div>
                </div>
                
                <div className="mt-2 text-[var(--ts-text)] font-mono text-sm whitespace-pre-wrap leading-relaxed p-3 bg-black/30 rounded border border-[var(--ts-border)]">
                  {log.description}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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

export default BrowserArtifacts;
