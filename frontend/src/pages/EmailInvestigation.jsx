import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, ShieldAlert, UploadCloud } from 'lucide-react';
import clsx from 'clsx';
import InfoBox from '../components/common/InfoBox';
import FileUpload from '../components/FileUpload';

const EmailInvestigation = () => {
  const [logs, setLogs] = useState([]);
  const [currentEvidence, setCurrentEvidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const activeCaseId = localStorage.getItem('activeCaseId');

  const fetchEmail = async () => {
    if (!activeCaseId) {
      setLoading(false);
      return;
    }
    
    try {
      const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
      const res = await axios.get(`${baseUrl}/api/email?caseId=${activeCaseId}`);
      if (res.data.status === 'success') {
        setLogs(res.data.email_logs || []);
        setCurrentEvidence(res.data.current_evidence);
        setError(null);
      } else {
        setError(res.data.message);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch email logs.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmail();
  }, [activeCaseId]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
            <Mail className="w-8 h-8 text-[var(--ts-blue)]" />
            Email Investigation
          </h1>
          <p className="text-ts-text-muted mt-1">Extract malicious URLs, IPs, and phishing indicators from email artifacts.</p>
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
        description="The Email Engine parses raw .eml files to automatically extract sender/recipient details, malicious attachments, and embedded URLs or IP addresses used in phishing campaigns." 
      />

      <div className="flex-1 glass-panel flex flex-col min-h-0 relative overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-black/80 px-4 py-2 flex items-center justify-between border-b border-[var(--ts-border)]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-500 font-mono ml-2">msgparser -f phishing.eml</span>
          </div>
          {currentEvidence && (
            <div className="text-xs font-mono text-[var(--ts-blue)] flex items-center gap-2">
              <span className="text-gray-500">Target Evidence:</span> {currentEvidence}
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 font-mono text-sm bg-black/40 custom-scrollbar">
          {loading ? (
            <div className="text-[var(--ts-blue)] animate-pulse">Parsing Email Headers...</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, i) => (
                <div key={i} className={clsx("p-4 rounded border", log.risk_level === 'High' ? "bg-red-950/30 border-red-500/50" : log.risk_level === 'Medium' ? "bg-yellow-950/30 border-yellow-500/50" : "bg-black/40 border-[var(--ts-border)]")}>
                  <div className="flex items-center gap-3 mb-2">
                    {log.risk_level === 'High' ? <ShieldAlert className="w-5 h-5 text-red-500" /> : <Mail className="w-5 h-5 text-[var(--ts-blue)]" />}
                    <span className="text-gray-400 text-xs">[{log.time_created}]</span>
                    <span className="text-[var(--ts-blue)] font-bold">{log.source}</span>
                  </div>
                  <div className={clsx("whitespace-pre-wrap mt-1", log.risk_level === 'High' ? "text-red-200" : log.risk_level === 'Medium' ? "text-yellow-200" : "text-gray-300")}>
                    {log.description.includes('[THREAT INTEL]') ? (
                      <>
                        <div className="mb-2 break-all">{log.description.split('[THREAT INTEL]')[0].trim()}</div>
                        <div className={clsx("mt-3 p-3 rounded border text-sm font-sans flex items-start gap-2", 
                          log.risk_level === 'High' ? "bg-red-500/10 border-red-500/30 text-red-300" : 
                          log.risk_level === 'Medium' ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300" : 
                          "bg-[var(--ts-blue)]/10 border-[var(--ts-blue)]/30 text-[var(--ts-blue)]"
                        )}>
                          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block mb-1 tracking-wider text-xs uppercase">Automated Security Analysis</span>
                            {log.description.split('[THREAT INTEL]')[1].trim()}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="break-all">{log.description}</div>
                    )}
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500 italic text-center mt-10">
                  {error || "No email artifacts found. Please upload a .eml file to begin analysis."}
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
            fetchEmail();
          }}
        />
      )}
    </div>
  );
};

export default EmailInvestigation;
