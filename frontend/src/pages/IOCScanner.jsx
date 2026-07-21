import React, { useState } from 'react';
import axios from 'axios';
import { Target, Search, ShieldAlert, ShieldCheck, Activity, Globe, Tag } from 'lucide-react';
import clsx from 'clsx';

const IOCScanner = () => {
  const [ioc, setIoc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleScan = async (e) => {
    e.preventDefault();
    if (!ioc) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
      const res = await axios.post(`${baseUrl}/api/ioc-scan`, { ioc });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to scan IOC.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto min-h-[calc(100vh-120px)]">
      <div className="text-center mb-8 mt-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--ts-blue)]/10 border border-[var(--ts-blue)]/30 mb-6">
          <Target className="w-10 h-10 text-[var(--ts-blue)]" />
        </div>
        <h1 className="text-4xl font-bold text-gradient mb-4">Threat Intelligence Radar</h1>
        <p className="text-ts-text-muted max-w-xl mx-auto">
          Paste a file hash (MD5/SHA256), IP address, or domain below to cross-reference against global threat feeds and the VirusTotal engine.
        </p>
      </div>

      <form onSubmit={handleScan} className="relative w-full group">
        <div className="absolute inset-0 bg-[var(--ts-blue)]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative flex items-center bg-black/60 border border-[var(--ts-border)] rounded-full p-2 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <Search className="w-6 h-6 text-ts-text-muted ml-4" />
          <input 
            type="text" 
            value={ioc}
            onChange={(e) => setIoc(e.target.value)}
            placeholder="Enter Hash, IP, or Domain..." 
            className="flex-1 bg-transparent border-none outline-none text-[var(--ts-text)] px-4 py-3 text-lg font-mono placeholder-gray-600"
          />
          <button 
            type="submit" 
            disabled={loading || !ioc}
            className="btn-primary rounded-full px-8 py-3 font-bold uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? 'Scanning...' : 'Initiate Scan'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-8 p-4 bg-red-950/50 border border-red-500 rounded-lg text-red-200 text-center font-mono">
          <ShieldAlert className="w-6 h-6 mx-auto mb-2 text-red-500" />
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Verdict Card */}
          <div className="glass-panel p-8 text-center flex flex-col items-center justify-center">
            {result.malicious > 0 ? (
              <>
                <div className="w-24 h-24 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                  <ShieldAlert className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-3xl font-bold text-red-500 mb-2">MALICIOUS</h2>
                <p className="text-red-200 font-mono">{result.malicious} security vendors flagged this IOC.</p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                  <ShieldCheck className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold text-green-500 mb-2">UNDETECTED</h2>
                <p className="text-green-200 font-mono">0 security vendors flagged this IOC.</p>
              </>
            )}
          </div>

          {/* Details Card */}
          <div className="glass-panel p-6 flex flex-col justify-center">
            <h3 className="font-bold text-[var(--ts-text)] uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-[var(--ts-border)] pb-2">
              <Activity className="w-5 h-5 text-[var(--ts-blue)]" /> Intelligence Report
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-ts-text-muted mb-1">Target IOC</div>
                <div className="font-mono text-sm text-[var(--ts-blue)] break-all bg-black/40 p-2 rounded">{result.ioc}</div>
              </div>
              
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

              {result.tags && result.tags.length > 0 && (
                <div>
                  <div className="text-xs text-ts-text-muted mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Associated Tags / TTPs</div>
                  <div className="flex flex-wrap gap-2">
                    {result.tags.map((tag, i) => (
                      <span key={i} className="badge bg-[var(--ts-purple)]/20 text-[var(--ts-purple)] border-[var(--ts-purple)] border">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-[var(--ts-border)] text-xs text-center text-ts-text-muted flex items-center justify-center gap-1">
              <Globe className="w-3 h-3" /> {result.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IOCScanner;
