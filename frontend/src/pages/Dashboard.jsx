import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  ShieldAlert, 
  Files, 
  FileText,
  Activity, 
  AlertTriangle,
  FileSearch,
  HardDrive,
  Users,
  Network,
  Briefcase,
  Phone
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import NodeGraph from '../components/dashboard/NodeGraph';

// Data fetched dynamically from backend

// Hook: animate a number counting up from 0
const useCountUp = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = 0;
    const end = typeof target === 'number' ? target : parseFloat(target) || 0;
    if (isNaN(end)) { setCount(target); return; }
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    prevTarget.current = target;
  }, [target, duration]);
  return count;
};

// Mini animated sparkline bar
const AnimatedSparkline = ({ colorClass }) => {
  const bars = [40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 65];
  return (
    <div className="flex items-end gap-[3px] h-4 mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className={`w-[4px] rounded-full ${colorClass}`}
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => {
  // Parse numeric part for counting animation
  const numericMatch = String(value).match(/^(\d+)(.*)$/);
  const numericVal = numericMatch ? parseInt(numericMatch[1], 10) : null;
  const suffix = numericMatch ? numericMatch[2] : '';
  const animatedCount = useCountUp(numericVal ?? 0);

  return (
    <motion.div
      className="glass-panel p-5 relative overflow-hidden group cursor-default"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      style={{ isolation: 'isolate' }}
    >
      {/* Pulsing glow border on hover */}
      <div className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'none',
          boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, currentColor 20%, transparent), 0 0 20px -4px color-mix(in srgb, currentColor 30%, transparent)`,
        }}
      />
      <div
        className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          animation: 'statcard-glow-pulse 2s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes statcard-glow-pulse {
          0%, 100% { box-shadow: 0 0 15px -5px rgba(59,130,246,0.3); }
          50% { box-shadow: 0 0 25px -3px rgba(59,130,246,0.5); }
        }
      `}</style>

      <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`}></div>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-ts-text-muted uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-[var(--ts-text)] text-gradient">
            {numericVal !== null ? `${animatedCount}${suffix}` : value}
          </h3>
          {subtitle && <p className="text-xs text-ts-text-muted mt-2">{subtitle}</p>}
          <AnimatedSparkline colorClass={colorClass} />
        </div>
        <motion.div
          className={`p-3 rounded-lg bg-[var(--ts-bg)] text-[var(--ts-text-muted)] group-hover:text-[var(--ts-blue)] transition-colors`}
          whileHover={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1.15 }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="w-6 h-6" />
        </motion.div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    cases_count: 0,
    evidence_count: 0,
    high_risk_logs: 0,
    avg_score: 0,
    timeline_data: [],
    evidence_data: [],
    recent_activities: []
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCaseData, setNewCaseData] = useState({ title: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      const response = await axios.post(`${baseUrl}/api/cases`, newCaseData);
      
      // Update local storage and reload to switch context to new case
      localStorage.setItem('activeCaseId', response.data.case_id);
      window.location.href = `/investigations/${response.data.case_id}`;
    } catch (err) {
      console.error(err);
      alert("Failed to create new investigation.");
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
        const response = await axios.get(`${baseUrl}/api/dashboard`);
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gradient flex items-center gap-3">
            Command Center
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Live
            </span>
          </h1>
          <p className="text-sm text-ts-text-muted mt-1">Overview of active investigations and system telemetry.</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <button 
            onClick={() => window.open('/api/cases/1/report', '_blank')}
            className="btn-secondary py-2 px-4 flex items-center gap-2 hover:bg-[var(--ts-purple)]/20 hover:text-white transition-all"
          >
            <FileText className="w-4 h-4" /> Export Report
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary py-2 px-4 flex items-center gap-2 shadow-[0_0_15px_rgba(255,0,60,0.4)] hover:shadow-[0_0_25px_rgba(255,0,60,0.6)] transition-shadow"
          >
            <ShieldAlert className="w-4 h-4" /> New Investigation
          </button>
        </div>
      </div>
      
      {/* Global Threat Map - Replaced with Cybernetic Node Graph */}
      <NodeGraph />

      {/* New Investigation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md p-6 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-ts-text-muted hover:text-ts-text"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-gradient mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-ts-red" />
              Initialize Investigation
            </h2>
            <form onSubmit={handleCreateCase} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-ts-text-muted uppercase mb-1">Case Title</label>
                <input 
                  type="text" 
                  required
                  value={newCaseData.title}
                  onChange={e => setNewCaseData({...newCaseData, title: e.target.value})}
                  className="w-full bg-[var(--ts-bg)] border border-[var(--ts-border)] text-ts-text rounded px-3 py-2 text-sm focus:outline-none focus:border-ts-blue"
                  placeholder="e.g., Ransomware Outbreak Q3"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ts-text-muted uppercase mb-1">Description (Optional)</label>
                <textarea 
                  value={newCaseData.description}
                  onChange={e => setNewCaseData({...newCaseData, description: e.target.value})}
                  className="w-full bg-[var(--ts-bg)] border border-[var(--ts-border)] text-ts-text rounded px-3 py-2 text-sm focus:outline-none focus:border-ts-blue h-24 resize-none"
                  placeholder="Brief context about the incident..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-ts-text-muted hover:text-ts-text font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-primary py-2 px-6 shadow-[0_0_15px_rgba(255,0,60,0.4)] flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Initializing...' : 'Deploy Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Helpline Banner */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between border-l-4 border-l-orange-500 bg-orange-500/5 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--ts-text)] text-sm">Emergency Victim Helpline</h3>
            <p className="text-xs text-ts-text-muted mt-0.5">Facing a ransomware or fraud attack? Call Cyber Crime Portal <strong className="text-orange-500">1930</strong> or CyberPeace Foundation <strong className="text-[var(--ts-blue)]">+91 9570000066</strong></p>
          </div>
        </div>
        <button 
          onClick={() => window.location.href = '/connect'}
          className="btn-secondary text-orange-500 border-orange-500/30 hover:bg-orange-500/10 py-1.5 px-3 text-xs whitespace-nowrap shrink-0"
        >
          View Rescue Portal
        </button>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Threat Score" 
          value={`${stats.avg_score}/100`} 
          icon={AlertTriangle} 
          colorClass="bg-ts-red"
          subtitle="Critical IOCs detected in last 24h"
        />
        <StatCard 
          title="Active Investigations" 
          value={stats.cases_count} 
          icon={Briefcase} 
          colorClass="bg-ts-blue"
          subtitle="Open case environments"
        />
        <StatCard 
          title="Analyzed Artifacts" 
          value={stats.evidence_count} 
          icon={FileSearch} 
          colorClass="bg-ts-orange"
          subtitle="Total samples ingested"
        />
        <StatCard 
          title="High Risk Indicators" 
          value={stats.high_risk_logs} 
          icon={ShieldAlert} 
          colorClass="bg-ts-purple"
          subtitle="Unusual outbound connections/matches"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="glass-panel p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-[var(--ts-text)] uppercase tracking-wider">Event Timeline Analysis</h3>
            <select className="text-xs border-[var(--ts-border)] rounded p-1 bg-[var(--ts-bg)] text-[var(--ts-text)]">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.timeline_data}>
                <defs>
                  <linearGradient id="areaGradientBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Area type="monotone" dataKey="events" stroke="#3b82f6" strokeWidth={3} fill="url(#areaGradientBlue)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evidence Composition */}
        <div className="glass-panel p-5">
          <h3 className="text-sm font-bold text-ts-text uppercase tracking-wider mb-6">Evidence Composition</h3>
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.evidence_data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1200}
                  animationEasing="ease-out"
                >
                  {stats.evidence_data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-ts-text">{stats.evidence_count}</span>
              <span className="text-[10px] text-ts-text-muted uppercase">Artifacts</span>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {stats.evidence_data.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-ts-text-muted font-medium">{item.name}</span>
                </div>
                <span className="font-semibold">{Math.round((item.value / stats.evidence_count) * 100) || 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Recent Activity Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-[var(--ts-border)] flex justify-between items-center bg-[var(--ts-bg)]">
          <h3 className="text-sm font-bold text-[var(--ts-text)] uppercase tracking-wider">Recent Forensic Activities</h3>
          <button className="text-xs text-[var(--ts-blue)] font-medium hover:underline">View All Logs</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--ts-bg)] text-xs uppercase text-ts-text-muted font-semibold">
              <tr>
                <th className="px-5 py-3 border-b border-[var(--ts-border)]">Time</th>
                <th className="px-5 py-3 border-b border-[var(--ts-border)]">Investigator</th>
                <th className="px-5 py-3 border-b border-[var(--ts-border)]">Action</th>
                <th className="px-5 py-3 border-b border-[var(--ts-border)]">Target Artifact</th>
                <th className="px-5 py-3 border-b border-[var(--ts-border)] text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ts-border)]">
              {stats.recent_activities.length > 0 ? (
                stats.recent_activities.map((act) => (
                  <tr key={act.id} className="hover:bg-[var(--ts-bg)] transition-all duration-200 hover:scale-[1.005] hover:border-l-2 hover:border-l-[var(--ts-blue)] hover:shadow-sm" style={{ transformOrigin: 'left center' }}>
                    <td className="px-5 py-3 text-ts-text-muted whitespace-nowrap">{act.time}</td>
                    <td className="px-5 py-3 font-medium">{act.investigator}</td>
                    <td className="px-5 py-3">{act.action}</td>
                    <td className="px-5 py-3 font-mono text-xs">{act.target}</td>
                    <td className="px-5 py-3 text-right">
                      {act.status === 'High' && (
                        <span className="badge bg-red-100 text-red-700" style={{ boxShadow: '0 0 8px 1px rgba(239,68,68,0.35)' }}>Alert</span>
                      )}
                      {act.status === 'Medium' && (
                        <span className="badge bg-yellow-100 text-yellow-700" style={{ boxShadow: '0 0 8px 1px rgba(234,179,8,0.35)' }}>Warning</span>
                      )}
                      {act.status === 'Low' && (
                        <span className="badge bg-green-100 text-green-700" style={{ boxShadow: '0 0 8px 1px rgba(34,197,94,0.35)' }}>Logged</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-ts-text-muted">
                    No recent forensic activities.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Live eBPF Telemetry Feed */}
      <div className="glass-panel overflow-hidden mt-6">
        <div className="p-5 border-b border-[var(--ts-border)] flex justify-between items-center bg-[var(--ts-bg)]">
          <h3 className="text-sm font-bold text-[var(--ts-text)] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Kernel Telemetry (eBPF)
          </h3>
          <button className="text-xs text-[var(--ts-blue)] font-medium hover:underline">Configure Hooks</button>
        </div>
        <div className="h-64 overflow-y-auto bg-black/80 font-mono text-xs p-4 custom-scrollbar">
          {stats.recent_activities.filter(a => a.target === 'ebpf_telemetry').length > 0 ? (
            stats.recent_activities.filter(a => a.target === 'ebpf_telemetry').map((log, i) => (
              <div key={i} className="mb-2 flex items-start gap-3 border-b border-gray-800/50 pb-2">
                <span className="text-green-500 shrink-0">[{log.time}]</span>
                <span className="text-[var(--ts-blue)] shrink-0">[KERNEL]</span>
                <span className={log.status === 'High' ? 'text-red-400' : 'text-gray-300'}>
                  {log.action}
                </span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 flex items-center justify-center h-full flex-col gap-2">
              <Activity className="w-8 h-8 opacity-20" />
              <span>Listening for kernel events via simulated eBPF hooks...</span>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
