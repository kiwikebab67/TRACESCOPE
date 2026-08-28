import React, { useState } from 'react';
import axios from 'axios';
import { 
  Globe2, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Server, 
  Lock, 
  Layers, 
  Activity, 
  Clock, 
  Loader2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import InfoBox from '../components/common/InfoBox';

const sampleUrls = [
  'http://paypal-security-update.account-verification.xyz/login.php',
  'http://185.220.101.5/bin/payload.sh',
  'https://www.google.com',
  'http://metamask-airdrop-claim.click/connect-wallet'
];

const UrlScanner = () => {
  const [urlInput, setUrlInput] = useState('http://paypal-security-update.account-verification.xyz/login.php');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScan = async (targetToScan) => {
    const urlToUse = targetToScan || urlInput;
    if (!urlToUse.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      const vtApiKey = localStorage.getItem('vt_api_key') || '';
      
      const res = await axios.post(`${baseUrl}/api/v1/forensics/url-scan`, {
        url: urlToUse.trim(),
        vt_api_key: vtApiKey
      });

      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to complete URL scan.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-red-500 border-red-500/30 bg-red-500/10';
    if (score >= 40) return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
    return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-gradient tracking-wide flex items-center gap-3">
            <Globe2 className="w-8 h-8 text-[var(--ts-blue)] animate-pulse" />
            REAL-TIME MALICIOUS URL SCANNER
          </h1>
          <p className="text-sm text-ts-text-muted mt-1">
            Analyze suspicious domains, phishing links, brand impersonation, and live threat intelligence feeds.
          </p>
        </div>
      </div>

      <InfoBox 
        title="What does this do & How does it work?" 
        description="The Real-Time Malicious URL Scanner inspects web links for phishing, drive-by malware drops, and credential theft. It parses domain syntax to catch IP-as-hostnames, Punycode/IDN homograph spoofs, excessive subdomain nesting, and high-risk abuse TLDs (.xyz, .top, .click). It performs live DNS A-record resolutions and queries VirusTotal threat feeds to calculate an automated 0-100 Phishing Risk Score." 
      />

      {/* URL Input Box */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 border border-[var(--ts-border)]">
        <form onSubmit={(e) => { e.preventDefault(); handleScan(); }} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-ts-text-muted" />
            <input 
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter URL to scan (e.g. http://login.suspicious-domain.xyz/verify)..."
              className="w-full bg-black/5 dark:bg-black/40 border border-[var(--ts-border)] rounded-xl pl-12 pr-4 py-3 font-mono text-sm text-[var(--ts-text)] focus:ring-[var(--ts-blue)] focus:border-[var(--ts-blue)] transition-all"
            />
          </div>
          <button 
            type="submit"
            disabled={loading || !urlInput.trim()}
            className="btn-primary px-8 py-3 flex items-center gap-2 font-bold tracking-wider uppercase text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Scanning...' : 'Scan URL'}
          </button>
        </form>

        {/* Quick Sample URLs */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-ts-text-muted">Test Samples:</span>
          {sampleUrls.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { setUrlInput(sample); handleScan(sample); }}
              className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-black/5 dark:bg-black/30 border border-[var(--ts-border)] text-ts-text-muted hover:text-[var(--ts-blue)] hover:border-[var(--ts-blue)] transition-all"
            >
              {sample.length > 40 ? sample.substring(0, 40) + '...' : sample}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="flex flex-col gap-6">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Risk Score */}
            <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center ${getScoreColor(result.risk_score)}`}>
              <span className="text-xs font-mono font-bold uppercase tracking-widest mb-1">Threat Score</span>
              <span className="text-5xl font-black">{result.risk_score}<span className="text-2xl">/100</span></span>
              <span className="text-xs font-bold uppercase tracking-wider mt-2 px-3 py-1 rounded-full bg-black/20">
                {result.verdict}
              </span>
            </div>

            {/* Impersonated Brand */}
            <div className="glass-panel p-5 rounded-2xl border border-[var(--ts-border)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-ts-text-muted">
                <span className="text-xs font-mono font-bold uppercase">Brand Mimicked</span>
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-lg font-bold text-[var(--ts-text)] mt-2">
                {result.impersonated_brand}
              </div>
              <span className="text-[11px] text-ts-text-muted">Target impersonation heuristic</span>
            </div>

            {/* Resolved IP */}
            <div className="glass-panel p-5 rounded-2xl border border-[var(--ts-border)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-ts-text-muted">
                <span className="text-xs font-mono font-bold uppercase">Resolved IP</span>
                <Server className="w-4 h-4 text-[var(--ts-blue)]" />
              </div>
              <div className="text-lg font-mono font-bold text-[var(--ts-text)] mt-2">
                {result.resolved_ip}
              </div>
              <span className="text-[11px] text-ts-text-muted">DNS: {result.dns_status}</span>
            </div>

            {/* Multi-AV Feed */}
            <div className="glass-panel p-5 rounded-2xl border border-[var(--ts-border)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-ts-text-muted">
                <span className="text-xs font-mono font-bold uppercase">VirusTotal AV</span>
                <Activity className="w-4 h-4 text-ts-purple" />
              </div>
              <div className="text-lg font-bold text-[var(--ts-text)] mt-2">
                {result.virustotal_detections.malicious > 0 ? (
                  <span className="text-red-500">{result.virustotal_detections.malicious} Engines Flagged</span>
                ) : (
                  <span className="text-emerald-500">0 Blacklisted</span>
                )}
              </div>
              <span className="text-[11px] text-ts-text-muted">Global threat intelligence check</span>
            </div>
          </div>

          {/* Detailed Findings & Mechanics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Heuristic Findings */}
            <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-[var(--ts-border)] flex flex-col gap-4">
              <h3 className="text-sm font-bold text-[var(--ts-text)] uppercase tracking-wider flex items-center gap-2 border-b border-[var(--ts-border)] pb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Forensic Heuristic Findings ({result.findings.length})
              </h3>
              <ul className="flex flex-col gap-3">
                {result.findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs font-mono text-[var(--ts-text)] bg-black/5 dark:bg-black/30 p-3 rounded-xl border border-[var(--ts-border)]">
                    <span className="text-[var(--ts-blue)] font-bold">#{i + 1}</span>
                    <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: f.replace(/`([^`]+)`/g, '<code class="bg-black/20 px-1 py-0.5 rounded text-amber-500">$1</code>') }} />
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: URL Specifications */}
            <div className="glass-panel p-6 rounded-2xl border border-[var(--ts-border)] flex flex-col gap-4">
              <h3 className="text-sm font-bold text-[var(--ts-text)] uppercase tracking-wider flex items-center gap-2 border-b border-[var(--ts-border)] pb-3">
                <Layers className="w-4 h-4 text-[var(--ts-blue)]" />
                URL Metadata
              </h3>
              <div className="flex flex-col gap-3 text-xs font-mono">
                <div className="flex justify-between border-b border-[var(--ts-border)] pb-2">
                  <span className="text-ts-text-muted">Hostname:</span>
                  <span className="font-bold text-[var(--ts-text)] truncate max-w-[160px]">{result.hostname}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--ts-border)] pb-2">
                  <span className="text-ts-text-muted">Protocol:</span>
                  <span className="font-bold text-[var(--ts-text)]">{result.scheme}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--ts-border)] pb-2">
                  <span className="text-ts-text-muted">Verdict:</span>
                  <span className="font-bold text-red-500">{result.verdict}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ts-text-muted">Scanned At:</span>
                  <span className="text-[10px] text-ts-text-muted">{result.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlScanner;
