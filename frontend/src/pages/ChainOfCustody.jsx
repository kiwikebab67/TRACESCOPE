import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link2, Shield, Calendar, HardDrive, Hash, AlertTriangle, FileText } from 'lucide-react';
import InfoBox from '../components/common/InfoBox';
import EmptyState from '../components/common/EmptyState';

const ChainOfCustody = () => {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      const response = await axios.get(`${baseUrl}/api/evidence`);
      setEvidence(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-ts-text-muted">Loading Chain of Custody ledgers...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2 flex items-center gap-3">
            <Link2 className="w-8 h-8 text-[var(--ts-blue)]" />
            Chain of Custody Ledger
          </h1>
          <p className="text-ts-text-muted">Immutable cryptographic record of all ingested artifacts across all investigations.</p>
        </div>
      </div>

      <InfoBox 
        title="What is the Chain of Custody?" 
        description="In digital forensics, a Chain of Custody is a critical legal document that tracks every piece of evidence from the moment it is collected. TraceScope automatically generates this ledger by hashing every uploaded file (MD5/SHA256). If the hash changes, the evidence has been tampered with and is inadmissible in court." 
      />

      {evidence.length === 0 ? (
        <EmptyState 
          icon={Shield} 
          title="No Evidence Ingested" 
          description="The Chain of Custody ledger is currently empty. Upload forensic artifacts in any active case to begin building the immutable ledger."
        />
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--ts-border)] text-xs uppercase tracking-wider text-ts-text-muted">
                  <th className="p-4 font-semibold">Case #</th>
                  <th className="p-4 font-semibold">Artifact Name</th>
                  <th className="p-4 font-semibold">Size</th>
                  <th className="p-4 font-semibold">SHA-256 Checksum</th>
                  <th className="p-4 font-semibold">Ingestion Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {evidence.map((ev, i) => (
                  <tr key={i} className="border-b border-[var(--ts-border)] hover:bg-[var(--ts-panel)] transition-colors">
                    <td className="p-4 font-mono text-[var(--ts-blue)]">{ev.case_number}</td>
                    <td className="p-4 font-semibold text-[var(--ts-text)] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-ts-text-muted" />
                      {ev.filename}
                    </td>
                    <td className="p-4 text-ts-text-muted">{(ev.size / 1024).toFixed(1)} KB</td>
                    <td className="p-4 font-mono text-xs text-[var(--ts-purple)]">{ev.hash_sha256}</td>
                    <td className="p-4 text-ts-text-muted">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(ev.date_added).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChainOfCustody;
