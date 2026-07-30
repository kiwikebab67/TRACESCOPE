import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileOutput, Download, FileText, Calendar, ShieldCheck } from 'lucide-react';
import InfoBox from '../components/common/InfoBox';
import EmptyState from '../components/common/EmptyState';

const Reports = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      const response = await axios.get(`${baseUrl}/api/cases`);
      setCases(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (caseId, caseNumber) => {
    const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
    window.location.href = `${baseUrl}/api/cases/${caseId}/report`;
  };

  if (loading) {
    return <div className="p-8 text-center text-ts-text-muted">Loading Report Engine...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2 flex items-center gap-3">
          <FileOutput className="w-8 h-8 text-[var(--ts-blue)]" />
          Forensic Reports
        </h1>
        <p className="text-ts-text-muted">Generate and download official PDF/HTML case reports for chain-of-custody handovers.</p>
      </div>

      <InfoBox 
        title="What are Forensic Reports?" 
        description="At the end of an investigation, you must hand over a formal document to legal teams or senior management. This module automatically compiles all the hashes, artifacts, critical anomalies, and findings for a specific case and generates a highly professional, beautifully styled HTML document that can be printed or saved as a PDF." 
      />

      {cases.length === 0 ? (
        <EmptyState 
          icon={FileText} 
          title="No Cases Available" 
          description="You must create an investigation case before you can generate a forensic report."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <div key={c.id} className="glass-panel p-6 flex flex-col justify-between group hover:border-[var(--ts-blue)] transition-colors">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="font-mono text-[var(--ts-blue)] font-bold">{c.case_number}</span>
                  <span className="text-xs text-ts-text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[var(--ts-text)] mb-2 line-clamp-1" title={c.title}>
                  {c.title}
                </h3>
                <p className="text-sm text-ts-text-muted mb-4 line-clamp-2">
                  {c.description || "No description provided."}
                </p>
                
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--ts-purple)] mb-6 bg-black/30 p-2 rounded w-fit">
                  <ShieldCheck className="w-3 h-3" />
                  {c.evidence_count} Artifacts Ingested
                </div>
              </div>
              
              <button 
                onClick={() => handleDownload(c.id, c.case_number)}
                className="w-full btn-primary flex items-center justify-center gap-2 group-hover:shadow-[0_0_15px_var(--ts-blue)]"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
