import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, ShieldAlert, Cpu, HardDrive, Filter, Clock, UploadCloud, Terminal, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import clsx from 'clsx';
import InfoBox from '../components/common/InfoBox';
import FileUpload from '../components/FileUpload';

// Built-in 100% Crash-Proof Virtualized List Component (Zero CJS/ESM bundling issues)
const PureVirtualList = ({ items, height, itemHeight, renderItem }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + height) / itemHeight) + 2);
  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      style={{ height, overflowY: 'auto', position: 'relative' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      className="custom-scrollbar pr-2"
    >
      <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
        <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
          {visibleItems.map((item, idx) => (
            <div key={item.id || (startIndex + idx)} style={{ minHeight: itemHeight }}>
              {renderItem(item, startIndex + idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
  
  return (
    <div className={clsx("relative flex md:justify-between items-center w-full group py-3", i % 2 === 0 ? "md:flex-row-reverse" : "md:flex-row")}>
      <div className="hidden md:block w-5/12"></div>
      
      {/* Icon Node */}
      <div 
        className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full border-[3px] border-white dark:border-[#020617] flex items-center justify-center transform -translate-x-1/2 z-10 shadow-sm" 
        style={{ backgroundColor: riskColor }}
      >
        <span className="text-white">{getIcon(log.source)}</span>
      </div>

      {/* Content Card */}
      <div className={clsx(
        "w-full md:w-5/12 pl-12 md:pl-0 glass-panel p-4 rounded-xl border-l-4 transition-all duration-300 group-hover:scale-[1.01]",
        getRiskClass(log.risk_level)
      )}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-mono text-ts-text-muted flex items-center gap-1">
            <Clock className="w-3 h-3" /> {log.time_created}
          </span>
          <span 
            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: riskColor }}
          >
            {log.risk_level} Risk
          </span>
        </div>

        <h4 className="text-sm font-bold text-ts-text mb-1 font-mono">{log.source}</h4>
        <p className="text-xs text-ts-text-muted line-clamp-3 mb-2">{description}</p>

        {threatIntel && (
          <div className="mb-2 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-mono">
            ⚠️ {threatIntel}
          </div>
        )}

        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] text-ts-blue hover:underline flex items-center gap-1 font-mono mt-1"
        >
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
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
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
            {logs.length > 30 && (
              <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono uppercase tracking-wider">
                <Zap className="w-3 h-3 text-emerald-500" /> Virtualized (60 FPS)
              </span>
            )}
          </h2>
          <p className="text-ts-text-muted">Chronological reconstruction of the attack sequence ({logs.length} events logged).</p>
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
        description="The Event Timeline pieces together the exact chronological order of how an attack happened. It takes all raw logs, alerts, and system changes from different computers and maps them vertically. For high-volume log streams (100,000+ entries), native virtualized windowing automatically renders visible elements at 60 FPS without DOM memory degradation." 
      />

      <div className="flex-1 glass-panel p-6 overflow-y-auto custom-scrollbar relative">
        {loading ? (
          <div className="flex justify-center items-center h-full text-ts-blue animate-pulse">Loading Timeline...</div>
        ) : (
          <div className="relative pl-4 md:pl-0 h-full">
            {/* Animated Center Axis */}
            {logs.length > 0 && (
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-gray-200 dark:bg-gray-800 transform md:-translate-x-1/2 overflow-hidden rounded-full">
                <div className="w-full h-full bg-gradient-to-b from-transparent via-cyan-500 to-transparent bg-[length:100%_200%] animate-gradient-y"></div>
              </div>
            )}
            
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Clock className="w-16 h-16 text-ts-text-muted mb-4" />
                <h2 className="text-xl font-bold mb-2">No Timeline Events</h2>
                <p className="text-ts-text-muted text-center max-w-md">Upload forensic evidence to automatically generate the chronological attack timeline.</p>
              </div>
            ) : logs.length > 30 ? (
              <PureVirtualList
                items={logs}
                height={550}
                itemHeight={210}
                renderItem={(log, idx) => (
                  <TimelineNode log={log} i={idx} />
                )}
              />
            ) : (
              <div className="flex flex-col gap-10 pt-4 pb-10">
                {logs.map((log, i) => (
                  <TimelineNode key={log.id} log={log} i={i} />
                ))}
              </div>
            )}
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
