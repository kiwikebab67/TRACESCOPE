import React, { useState, useEffect } from 'react';
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
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import ThreatMap from '../components/dashboard/ThreatMap';

// Data fetched dynamically from backend

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className="glass-panel p-5 relative overflow-hidden group">
    <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`}></div>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-ts-text-muted uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-[var(--ts-text)] text-gradient">{value}</h3>
        {subtitle && <p className="text-xs text-ts-text-muted mt-2">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg bg-[var(--ts-bg)] text-[var(--ts-text-muted)] group-hover:scale-110 group-hover:text-[var(--ts-blue)] transition-all`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
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
          <h1 className="text-2xl font-bold text-gradient">Command Center</h1>
          <p className="text-sm text-ts-text-muted mt-1">Overview of active investigations and system telemetry.</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <button 
            onClick={() => window.open('/api/cases/1/report', '_blank')}
            className="btn-secondary py-2 px-4 flex items-center gap-2 hover:bg-[var(--ts-purple)]/20 hover:text-white transition-all"
          >
            <FileText className="w-4 h-4" /> Export Report
          </button>
          <button className="btn-primary py-2 px-4 flex items-center gap-2 shadow-[0_0_15px_rgba(255,0,60,0.4)]">
            <ShieldAlert className="w-4 h-4" /> New Investigation
          </button>
        </div>
      </div>
      
      {/* Global Threat Map */}
      <ThreatMap />

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
              <LineChart data={stats.timeline_data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Line type="monotone" dataKey="events" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
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
                  <tr key={act.id} className="hover:bg-[var(--ts-bg)] transition-colors">
                    <td className="px-5 py-3 text-ts-text-muted whitespace-nowrap">{act.time}</td>
                    <td className="px-5 py-3 font-medium">{act.investigator}</td>
                    <td className="px-5 py-3">{act.action}</td>
                    <td className="px-5 py-3 font-mono text-xs">{act.target}</td>
                    <td className="px-5 py-3 text-right">
                      {act.status === 'High' && (
                        <span className="badge bg-red-100 text-red-700">Alert</span>
                      )}
                      {act.status === 'Medium' && (
                        <span className="badge bg-yellow-100 text-yellow-700">Warning</span>
                      )}
                      {act.status === 'Low' && (
                        <span className="badge bg-green-100 text-green-700">Logged</span>
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

    </div>
  );
};

export default Dashboard;
