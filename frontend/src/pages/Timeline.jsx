import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, ShieldAlert, Cpu, HardDrive, Filter, Clock, UploadCloud } from 'lucide-react';
import clsx from 'clsx';
import InfoBox from '../components/common/InfoBox';
import FileUpload from '../components/FileUpload';

const Timeline = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const activeCaseId = localStorage.getItem('activeCaseId');

  const fetchTimeline = async () => {
    try {
      const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
      const res = await axios.get(`${baseUrl}/api/timeline`);
      // Sort chronologically if time_created is sortable, here we just use the API order (which is all logs)
      setLogs(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const getIcon = (source) => {
    if (source.toLowerCase().includes('volatility')) return <Cpu className="w-5 h-5" />;
    if (source.toLowerCase().includes('network') || source.toLowerCase().includes('pcap')) return <Activity className="w-5 h-5" />;
    if (source.toLowerCase().includes('autopsy') || source.toLowerCase().includes('disk')) return <HardDrive className="w-5 h-5" />;
    return <ShieldAlert className="w-5 h-5" />;
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto h-[calc(100vh-120px)]">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gradient mb-2 flex items-center gap-3">
            <Clock className="text-ts-blue" /> 
            EVENT TIMELINE
          </h2>
          <p className="text-ts-text-muted">Chronological reconstruction of the attack sequence.</p>
        </div>
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="btn-primary flex items-center gap-2"
          disabled={!activeCaseId}
          title={!activeCaseId ? "Open a case first in Investigations" : "Upload Evidence"}
        >
          <UploadCloud className="w-4 h-4" />
          Upload Evidence
        </button>
      </div>

      <InfoBox 
        title="What does this do?" 
        description="The Event Timeline pieces together the exact chronological order of how an attack happened. It takes all the raw logs, alerts, and system changes from different computers and maps them vertically so you can trace the infection from the initial compromise all the way to data exfiltration." 
      />

      <div className="flex-1 glass-panel p-6 overflow-y-auto custom-scrollbar relative">
        {loading ? (
          <div className="flex justify-center items-center h-full text-ts-blue animate-pulse">Loading Timeline...</div>
        ) : (
          <div className="relative pl-8 md:pl-0">
            {/* Vertical Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-[var(--ts-border)] transform md:-translate-x-1/2"></div>
            
            <div className="flex flex-col gap-8">
              {logs.map((log, i) => (
                <div key={log.id} className={clsx("relative flex md:justify-between items-center w-full", i % 2 === 0 ? "md:flex-row-reverse" : "md:flex-row")}>
                  
                  <div className="hidden md:block w-5/12"></div>
                  
                  {/* Icon Node */}
                  <div className="absolute left-0 md:left-1/2 w-8 h-8 rounded-full border-4 border-[var(--ts-panel)] flex items-center justify-center transform -translate-x-1/2 z-10" 
                    style={{ backgroundColor: log.risk_level === 'High' ? '#ef4444' : log.risk_level === 'Medium' ? '#f59e0b' : '#3b82f6' }}>
                    <div className="text-white scale-75">
                      {getIcon(log.source)}
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className="w-full md:w-5/12 ml-10 md:ml-0 glass-panel p-4 border-l-4 hover:scale-[1.02] transition-transform"
                    style={{ borderLeftColor: log.risk_level === 'High' ? '#ef4444' : log.risk_level === 'Medium' ? '#f59e0b' : '#3b82f6' }}>
                    <div className="text-xs font-mono text-[var(--ts-blue)] font-bold mb-1">{log.time_created}</div>
                    <h3 className="text-sm font-bold text-[var(--ts-text)] mb-2">{log.source}</h3>
                    <p className="text-sm text-ts-text-muted">{log.description}</p>
                    <div className="mt-3 flex gap-2">
                      <span className="badge bg-black/20 text-gray-400">Case: {log.case_number}</span>
                      <span className="badge bg-black/20 text-gray-400">EID: {log.event_id}</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isUploadOpen && (
        <FileUpload 
          caseId={activeCaseId} 
          onClose={() => setIsUploadOpen(false)} 
          onUploadComplete={() => {
            setIsUploadOpen(false);
            fetchTimelineData();
          }}
        />
      )}
    </div>
  );
};

export default Timeline;
