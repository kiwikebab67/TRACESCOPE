import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, ShieldAlert, Cpu, HardDrive, Filter, Clock, UploadCloud, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import InfoBox from '../components/common/InfoBox';
import FileUpload from '../components/FileUpload';

const getIcon = (source) => {
  if (source?.toLowerCase().includes('volatility')) return <Cpu className="w-5 h-5" />;
  if (source?.toLowerCase().includes('network') || source?.toLowerCase().includes('pcap')) return <Activity className="w-5 h-5" />;
  if (source?.toLowerCase().includes('autopsy') || source?.toLowerCase().includes('disk')) return <HardDrive className="w-5 h-5" />;
  return <ShieldAlert className="w-5 h-5" />;
};

const TimelineNode = ({ log, i }) => {
  const [expanded, setExpanded] = useState(false);

  // Threat Intel Parsing
  let description = log.description || "";
  let threatIntel = null;
  if (description.includes('[THREAT INTEL]')) {
    const parts = description.split('[THREAT INTEL]');
    description = parts[0].trim();
    threatIntel = parts[1].trim();
  }

  const rawJson = JSON.stringify({
    event_id: log.event_id,
    source: log.source,
    timestamp: log.time_created,
    case_id: log.case_number,
    risk_classification: log.risk_level,
    payload_preview: (log.description || "").substring(0, 50) + "..."
  }, null, 2);

  const getRiskColor = (risk) => {
    if (risk === 'High') return '#ef4444';
    if (risk === 'Medium') return '#f59e0b';
    return '#3b82f6';
  };
  
  const getRiskClass = (risk) => {
    if (risk === 'High') return 'border-red-500';
    if (risk === 'Medium') return 'border-amber-500';
    return 'border-blue-500';
  };

  const riskColor = getRiskColor(log.risk_level);
  const isHighRisk = log.risk_level === 'High';
  const isMedRisk = log.risk_level === 'Medium';
  
  return (
    <div className={clsx("relative flex md:justify-between items-center w-full group", i % 2 === 0 ? "md:flex-row-reverse" : "md:flex-row")}>
      <div className="hidden md:block w-5/12"></div>
      
      {/* Icon Node */}
      <div 
        className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full border-[3px] border-white dark:border-[#020617] flex items-center justify-center transform -translate-x-1/2 z-10 shadow-sm" 
        style={{ backgroundColor: riskColor }}
      >
        {/* Pulsing ring based on risk */}
        {(isHighRisk || isMedRisk) && (
          <div className={clsx("absolute w-full h-full rounded-full opacity-40 animate-pulse", isHighRisk ? "bg-red-500 scale-[1.7]" : "bg-amber-500 scale-[1.4]")}></div>
        )}
        <div className="text-white scale-75 z-10 relative">
          {getIcon(log.source)}
        </div>
      </div>

      {/* Content Card */}
      <div className={clsx(
        "w-full md:w-5/12 ml-12 md:ml-0 p-4 border-l-4 transition-all duration-300 rounded-lg shadow-sm hover:shadow-md bg-white dark:bg-[#020617] border-y border-r border-gray-200 dark:border-gray-800",
        getRiskClass(log.risk_level)
      )}>
        <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold mb-1">{log.time_created}</div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">{log.source}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
        
        {threatIntel && (
          <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-md p-3 flex gap-3 items-start">
            <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-red-700 dark:text-red-400 mb-1 uppercase tracking-wider">Threat Intel Match</div>
              <div className="text-xs text-red-600 dark:text-red-300 font-mono leading-relaxed">{threatIntel}</div>
            </div>
          </div>
        )}

        <div className="mt-3 flex gap-2 mb-3">
          <span className="px-2 py-1 text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">File: {log.evidence_file}</span>
          <span className="px-2 py-1 text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">EID: {log.event_id}</span>
        </div>

        {/* View Raw Artifact Toggle */}
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors font-medium"
        >
          <Terminal className="w-3 h-3" />
          {expanded ? "Hide Raw Artifact" : "View Raw Artifact"}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {expanded && (
          <div className="mt-3 bg-gray-900 text-green-400 font-mono p-3 rounded text-xs overflow-x-auto shadow-inner border border-black/50">
            <pre className="whitespace-pre-wrap">{rawJson}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

const Timeline = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const activeCaseId = localStorage.getItem('activeCaseId');

  const fetchTimeline = async () => {
    if (!activeCaseId) return;
    try {
      const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
      const res = await axios.get(`${baseUrl}/api/timeline?caseId=${activeCaseId}`);
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
          <div className="relative pl-4 md:pl-0">
            {/* Animated Center Axis */}
            {logs.length > 0 && (
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-gray-200 dark:bg-gray-800 transform md:-translate-x-1/2 overflow-hidden rounded-full">
                <div className="w-full h-full bg-gradient-to-b from-transparent via-cyan-500 to-transparent bg-[length:100%_200%] animate-gradient-y"></div>
              </div>
            )}
            
            <div className="flex flex-col gap-10 pt-4 pb-10">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <Clock className="w-16 h-16 text-ts-text-muted mb-4" />
                  <h2 className="text-xl font-bold mb-2">No Timeline Events</h2>
                  <p className="text-ts-text-muted text-center max-w-md">Upload forensic evidence to automatically generate the chronological attack timeline.</p>
                </div>
              ) : (
                logs.map((log, i) => (
                  <TimelineNode key={log.id} log={log} i={i} />
                ))
              )}
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
            fetchTimeline();
          }}
        />
      )}
    </div>
  );
};

export default Timeline;
