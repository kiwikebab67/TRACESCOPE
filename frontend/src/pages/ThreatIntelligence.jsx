import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, ShieldCheck, Activity, Globe, UploadCloud } from 'lucide-react';
import InfoBox from '../components/common/InfoBox';
import EmptyState from '../components/common/EmptyState';
import FileUpload from '../components/FileUpload';
import clsx from 'clsx';

const ThreatIntelligence = () => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState(() => localStorage.getItem('activeCaseId'));
  
  // New threat correlation states
  const [correlatedAlerts, setCorrelatedAlerts] = useState([]);
  const [correlationLoading, setCorrelationLoading] = useState(false);
  const [correlationError, setCorrelationError] = useState('');

  const fetchThreatIntel = async () => {
    if (!activeCaseId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      const res = await axios.get(`${baseUrl}/api/threat-intel/${activeCaseId}`);
      
      if (res.data.status === 'success') {
        setResult(res.data);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch threat intelligence.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCorrelatedAlerts = async () => {
    if (!activeCaseId) {
      setCorrelationLoading(false);
      return;
    }
    
    setCorrelationLoading(true);
    setCorrelationError('');
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      const res = await axios.get(`${baseUrl}/api/threat-intel/correlate/${activeCaseId}`);
      if (res.data.status === 'success') {
        setCorrelatedAlerts(res.data.alerts || []);
      } else {
        setCorrelationError(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setCorrelationError(err.response?.data?.message || 'Failed to fetch correlated indicators.');
    } finally {
      setCorrelationLoading(false);
    }
  };

  useEffect(() => {
    const handleCaseChange = () => {
      setActiveCaseId(localStorage.getItem('activeCaseId'));
    };
    window.addEventListener('caseChanged', handleCaseChange);
    return () => window.removeEventListener('caseChanged', handleCaseChange);
  }, []);

  useEffect(() => {
    if (activeCaseId) {
      fetchThreatIntel();
      fetchCorrelatedAlerts();
    } else {
      setLoading(false);
      setResult(null);
      setCorrelatedAlerts([]);
    }
  }, [activeCaseId]);

  if (loading) {
    return <div className="p-8 text-center text-ts-text-muted">Querying Threat Feeds...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto min-h-[calc(100vh-120px)]">
      <div className="flex justify-between items-end mb-2 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-[var(--ts-purple)]" />
            Automated Threat Intelligence
          </h1>
          <p className="text-ts-text-muted">Live cross-referencing of your latest evidence against global threat feeds.</p>
        </div>
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="btn-primary flex items-center gap-2"
          disabled={!activeCaseId}
        >
          <UploadCloud className="w-4 h-4" />
          Upload Evidence
        </button>
      </div>
      
      <InfoBox 
        title="What does this do?" 
        description="While the 'IOC Scanner' lets you manually search for arbitrary hashes or IPs, this module automatically takes the SHA-256 hash of the very last file you uploaded to this case and checks it against VirusTotal's live database. It provides an immediate verdict on whether global security vendors already know about this specific file." 
      />

      {!activeCaseId ? (
        <EmptyState 
          icon={ShieldAlert} 
          title="No Active Case" 
          description="You must select an active case in the Investigations tab before viewing threat intelligence."
        />
      ) : error ? (
        <EmptyState 
          icon={Activity} 
          title="No Intelligence Found" 
          description={error}
        />
      ) : result && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Verdict Card */}
          <div className="glass-panel p-8 text-center flex flex-col items-center justify-center">
            {result.message ? (
               <>
                <div className="w-24 h-24 rounded-full bg-[var(--ts-blue)]/20 border-4 border-[var(--ts-blue)] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                  <ShieldCheck className="w-12 h-12 text-[var(--ts-blue)]" />
                </div>
                <h2 className="text-3xl font-bold text-[var(--ts-blue)] mb-2">UNKNOWN / CLEAN</h2>
                <p className="text-blue-200 font-mono">{result.message}</p>
              </>
            ) : result.malicious > 0 ? (
              <>
                <div className="w-24 h-24 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                  <ShieldAlert className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-3xl font-bold text-red-500 mb-2">MALICIOUS</h2>
                <p className="text-red-200 font-mono">{result.malicious} security vendors flagged this file.</p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                  <ShieldCheck className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold text-green-500 mb-2">UNDETECTED</h2>
                <p className="text-green-200 font-mono">0 security vendors flagged this file.</p>
              </>
            )}
          </div>

          {/* Details Card */}
          <div className="glass-panel p-6 flex flex-col justify-center">
            <h3 className="font-bold text-[var(--ts-text)] uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-[var(--ts-border)] pb-2">
              <Activity className="w-5 h-5 text-[var(--ts-purple)]" /> Scan Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-ts-text-muted mb-1">Target Hash (SHA-256)</div>
                <div className="font-mono text-sm text-[var(--ts-purple)] break-all bg-black/40 p-2 rounded">{result.hash}</div>
              </div>
              
              {!result.message && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/40 p-3 rounded text-center">
                    <div className="text-2xl font-bold text-red-500">{result.malicious}</div>
                    <div className="text-xs text-ts-text-muted uppercase">Malicious</div>
                  </div>
                  <div className="bg-black/40 p-3 rounded text-center">
                    <div className="text-2xl font-bold text-yellow-500">{result.suspicious}</div>
                    <div className="text-xs text-ts-text-muted uppercase">Suspicious</div>
                  </div>
                  <div className="bg-black/40 p-3 rounded text-center">
                    <div className="text-2xl font-bold text-green-500">{result.undetected}</div>
                    <div className="text-xs text-ts-text-muted uppercase">Clean</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-[var(--ts-border)] text-xs text-center text-ts-text-muted flex items-center justify-center gap-1">
              <Globe className="w-3 h-3" /> Live Intelligence pulled from VirusTotal Network
            </div>
          </div>
        </div>
      )}

      {/* Correlation alerts section */}
      {activeCaseId && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gradient mb-4 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[var(--ts-pink)]" />
            Correlated Indicators of Compromise (IOCs)
          </h2>
          
          <div className="glass-panel overflow-hidden">
            <div className="p-4 border-b border-[var(--ts-border)] bg-black/10 dark:bg-black/20 flex justify-between items-center">
              <span className="text-sm font-semibold text-ts-text-muted">Extracted IP/Hash Threat Matches</span>
              <span className="text-xs text-ts-text-muted">Automatically crawled and analyzed from case logs</span>
            </div>
            
            <div className="overflow-x-auto">
              {correlationLoading ? (
                <div className="p-8 text-center text-ts-text-muted animate-pulse">Running threat correlation engine...</div>
              ) : correlationError ? (
                <div className="p-8 text-center text-red-500 font-mono text-sm">{correlationError}</div>
              ) : correlatedAlerts.length === 0 ? (
                <div className="p-8 text-center text-ts-text-muted italic">
                  No correlated high-risk indicators of compromise found in this case's logs.
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-black/5 dark:bg-black/20 text-xs uppercase text-ts-text-muted font-bold border-b border-[var(--ts-border)]">
                    <tr>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Indicator (IOC)</th>
                      <th className="px-5 py-3">Risk</th>
                      <th className="px-5 py-3">Source</th>
                      <th className="px-5 py-3">Intelligence Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ts-border)]">
                    {correlatedAlerts.map((alert, idx) => (
                      <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-ts-text-muted">{alert.type}</td>
                        <td className="px-5 py-4 font-mono text-sm text-[var(--ts-blue)] font-bold">{alert.ioc}</td>
                        <td className="px-5 py-4">
                          <span className={clsx(
                            "badge", 
                            alert.risk_level === 'High' ? "bg-red-500/10 text-red-500 border border-red-500/30" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
                          )}>
                            {alert.risk_level}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs uppercase bg-black/20 px-2 py-0.5 rounded text-ts-text-muted">
                            {alert.source_module} ({alert.source_name})
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-[var(--ts-text)] max-w-xs truncate" title={alert.description}>
                          {alert.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {isUploadOpen && (
        <FileUpload 
          caseId={activeCaseId} 
          onClose={() => setIsUploadOpen(false)} 
          onUploadComplete={() => {
            setIsUploadOpen(false);
            fetchThreatIntel();
            fetchCorrelatedAlerts();
          }}
        />
      )}
    </div>
  );
};

export default ThreatIntelligence;
