import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Hash, Copy, CheckCircle } from 'lucide-react';
import InfoBox from '../components/common/InfoBox';
import EmptyState from '../components/common/EmptyState';

const HashDatabase = () => {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchHashes();
  }, []);

  const fetchHashes = async () => {
    try {
      const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
      const response = await axios.get(`${baseUrl}/api/evidence`);
      setEvidence(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return <div className="p-8 text-center text-ts-text-muted">Loading Hash Database...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2 flex items-center gap-3">
          <Hash className="w-8 h-8 text-[var(--ts-pink)]" />
          Global Hash Database
        </h1>
        <p className="text-ts-text-muted">Centralized repository of all cryptographic hashes extracted across every investigation.</p>
      </div>

      <InfoBox 
        title="What is the Hash Database?" 
        description="A hash is a unique digital fingerprint (MD5 or SHA256) of a file. This database lists the fingerprints of every single file ever uploaded to TraceScope. You can copy these hashes and paste them into the 'IOC Scanner' module to instantly check if they are known malware." 
      />

      {evidence.length === 0 ? (
        <EmptyState 
          icon={Hash} 
          title="No Hashes Available" 
          description="Upload evidence to any case to begin populating the hash database."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {evidence.map((ev) => (
            <div key={ev.id} className="glass-panel p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 text-xs font-bold bg-[var(--ts-border)] text-ts-text-muted rounded-bl-lg">
                CASE {ev.case_number}
              </div>
              <h3 className="text-lg font-bold text-[var(--ts-text)] mb-4 w-3/4 truncate" title={ev.filename}>
                {ev.filename}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-ts-text-muted uppercase tracking-wider mb-1 flex justify-between">
                    <span>SHA-256</span>
                    <button 
                      onClick={() => copyToClipboard(ev.hash_sha256, `sha256-${ev.id}`)}
                      className="text-[var(--ts-blue)] hover:text-blue-400 transition-colors flex items-center gap-1"
                    >
                      {copiedId === `sha256-${ev.id}` ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId === `sha256-${ev.id}` ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-black/30 p-2 rounded border border-[var(--ts-border)] font-mono text-xs text-[var(--ts-purple)] break-all">
                    {ev.hash_sha256}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-ts-text-muted uppercase tracking-wider mb-1 flex justify-between">
                    <span>MD5</span>
                    <button 
                      onClick={() => copyToClipboard(ev.hash_md5, `md5-${ev.id}`)}
                      className="text-[var(--ts-blue)] hover:text-blue-400 transition-colors flex items-center gap-1"
                    >
                      {copiedId === `md5-${ev.id}` ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId === `md5-${ev.id}` ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-black/30 p-2 rounded border border-[var(--ts-border)] font-mono text-xs text-[var(--ts-blue)] break-all">
                    {ev.hash_md5}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HashDatabase;
