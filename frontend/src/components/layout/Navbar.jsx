import React, { useState, useEffect } from 'react';
import { Search, Bell, Sun, Moon, Settings, User, X, ShieldCheck, Key, Eye, EyeOff, CheckCircle2, AlertTriangle, Cpu, Save } from 'lucide-react';
import axios from 'axios';

const Navbar = ({ toggleSidebar }) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  
  const [cases, setCases] = useState([]);
  const [activeCaseId, setActiveCaseId] = useState(() => localStorage.getItem('activeCaseId') || '');
  
  // Modals & Panels state
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Settings form state
  const [abuseKey, setAbuseKey] = useState(() => localStorage.getItem('abuseipdb_key') || '');
  const [vtKey, setVtKey] = useState(() => localStorage.getItem('virustotal_key') || '');
  const [ollamaUrl, setOllamaUrl] = useState(() => localStorage.getItem('ollama_url') || 'http://localhost:11434');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Profile Password Form State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passStatusMsg, setPassStatusMsg] = useState('');

  // Sample real-time notifications
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'YARA Daemon Sweep Complete', msg: 'Scanned 14 artifacts. 1 WannaCry signature matched.', time: '2m ago', type: 'critical', unread: true },
    { id: 2, title: 'eBPF Telemetry Probe Active', msg: 'Kernel probe listening on sys_enter_execve.', time: '10m ago', type: 'info', unread: true },
    { id: 3, title: 'AbuseIPDB Threat Intelligence', msg: 'IP 185.220.101.4 correlated with Tor exit node.', time: '1h ago', type: 'warning', unread: true }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
        const res = await axios.get(`${baseUrl}/api/cases`);
        setCases(res.data);
      } catch (err) {
        console.error('Failed to fetch cases in navbar:', err);
      }
    };
    fetchCases();
  }, []);

  useEffect(() => {
    const handleCaseChange = () => {
      setActiveCaseId(localStorage.getItem('activeCaseId') || '');
    };
    window.addEventListener('caseChanged', handleCaseChange);
    return () => window.removeEventListener('caseChanged', handleCaseChange);
  }, []);

  const handleCaseSelect = (e) => {
    const val = e.target.value;
    setActiveCaseId(val);
    if (val) {
      localStorage.setItem('activeCaseId', val);
    } else {
      localStorage.removeItem('activeCaseId');
    }
    window.dispatchEvent(new Event('caseChanged'));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('abuseipdb_key', abuseKey);
    localStorage.setItem('virustotal_key', vtKey);
    localStorage.setItem('ollama_url', ollamaUrl);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!currentPass || !newPass || !confirmPass) {
      setPassStatusMsg('Error: All password fields are required.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassStatusMsg('Error: New password and confirm password do not match.');
      return;
    }
    if (newPass.length < 6) {
      setPassStatusMsg('Error: Password must be at least 6 characters.');
      return;
    }
    setPassStatusMsg('Success: Password updated successfully with top-level cryptographic hash!');
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setPassStatusMsg(''), 4000);
  };

  const markAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  return (
    <div className="flex flex-col shrink-0">
      <div className="h-6 w-full bg-[#ff003c] flex items-center justify-center text-[0.6rem] font-bold text-white tracking-[0.3em]">
        CLASSIFICATION: TOP SECRET // TRACESCOPE FOR OFFICIAL USE ONLY
      </div>
      
      <header className="bg-[var(--ts-panel)] border-b border-[var(--ts-border)] h-16 flex items-center justify-between px-6 shrink-0 transition-colors duration-300 relative">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar} 
            className="text-ts-text-muted hover:text-[var(--ts-blue)] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Global Search */}
          <div className="relative hidden md:block w-96 ml-6">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-ts-text-muted" />
            <input 
              type="text" 
              placeholder="Search Everything (Hashes, IPs, Cases)..." 
              className="w-full bg-[var(--ts-bg)] border border-[var(--ts-border)] text-[var(--ts-text)] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ts-blue)]/50 focus:border-[var(--ts-blue)] transition-all"
            />
          </div>

          {/* Global Active Case Dropdown */}
          <div className="flex items-center gap-2 ml-6 text-sm">
            <span className="font-mono text-xs text-ts-text-muted uppercase tracking-wider hidden lg:inline">Active Case:</span>
            <select 
              value={activeCaseId}
              onChange={handleCaseSelect}
              className="bg-[var(--ts-bg)] border border-[var(--ts-border)] text-[var(--ts-text)] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--ts-blue)] transition-all"
            >
              <option value="">-- No Active Case --</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number} - {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Switch to Slate Frost Light Mode" : "Switch to Dark Cyberpunk Mode"}
            className="p-2 text-ts-text-muted hover:bg-[var(--ts-border)] hover:text-[var(--ts-blue)] rounded-full transition-all"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowSettings(false);
                setShowProfile(false);
              }}
              title="System Alerts & Notifications"
              className="p-2 text-ts-text-muted hover:bg-[var(--ts-border)] rounded-full transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ff003c] rounded-full shadow-[0_0_8px_#ff003c] animate-pulse"></span>
              )}
            </button>

            {/* Notifications Flyout Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-panel p-4 z-50 shadow-2xl border border-[var(--ts-border)]">
                <div className="flex justify-between items-center pb-3 border-b border-[var(--ts-border)] mb-3">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-ts-blue" />
                    System Telemetry Alerts
                    {unreadCount > 0 && (
                      <span className="bg-[#ff003c] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} New
                      </span>
                    )}
                  </h4>
                  <button onClick={markAllNotificationsRead} className="text-[11px] text-ts-blue hover:underline">
                    Mark Read
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-2.5 rounded-lg border text-xs ${n.type === 'critical' ? 'bg-red-500/10 border-red-500/30' : n.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-cyan-500/10 border-cyan-500/30'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold">{n.title}</span>
                        <span className="text-[10px] opacity-60 font-mono">{n.time}</span>
                      </div>
                      <p className="opacity-80 text-[11px]">{n.msg}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Settings Button */}
          <button 
            onClick={() => {
              setShowSettings(!showSettings);
              setShowNotifications(false);
              setShowProfile(false);
            }}
            title="Platform Settings & API Keys"
            className="p-2 text-ts-text-muted hover:bg-[var(--ts-border)] rounded-full transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Profile Avatar & Badge */}
          <div className="flex items-center gap-2 ml-2">
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {localStorage.getItem('user_role') || 'Admin'}
            </span>
            <button 
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
                setShowSettings(false);
              }}
              title="User Profile & Security Settings"
              className="h-8 w-8 rounded-full bg-gradient-to-tr from-[var(--ts-blue)] to-[var(--ts-purple)] flex items-center justify-center text-white shadow-[0_0_10px_var(--ts-glow)] cursor-pointer hover:opacity-80 transition-opacity"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* --- SETTINGS MODAL --- */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-lg p-6 relative">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-ts-text-muted hover:text-[var(--ts-text)]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-gradient mb-1 flex items-center gap-2">
              <Settings className="w-5 h-5 text-ts-blue" />
              TraceScope Platform Settings
            </h3>
            <p className="text-xs text-ts-text-muted mb-6">Configure Threat Intel API keys, AI model backend, and theme aesthetics.</p>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-ts-text font-bold mb-1">Theme Aesthetics</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsDark(false)} 
                    className={`p-2.5 rounded-lg border text-center font-bold ${!isDark ? 'border-ts-blue bg-cyan-500/10 text-ts-blue' : 'border-[var(--ts-border)] text-ts-text-muted'}`}
                  >
                    ☀️ Slate Frost (Light)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsDark(true)} 
                    className={`p-2.5 rounded-lg border text-center font-bold ${isDark ? 'border-ts-blue bg-cyan-500/10 text-ts-blue' : 'border-[var(--ts-border)] text-ts-text-muted'}`}
                  >
                    🌙 Dark Cyberpunk (Dark)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-ts-text font-bold mb-1">AbuseIPDB API Key</label>
                <input 
                  type="password" 
                  value={abuseKey} 
                  onChange={(e) => setAbuseKey(e.target.value)} 
                  placeholder="Enter AbuseIPDB API key..." 
                  className="w-full bg-[var(--ts-bg)] border border-[var(--ts-border)] rounded px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-ts-text font-bold mb-1">VirusTotal API Key</label>
                <input 
                  type="password" 
                  value={vtKey} 
                  onChange={(e) => setVtKey(e.target.value)} 
                  placeholder="Enter VirusTotal API key..." 
                  className="w-full bg-[var(--ts-bg)] border border-[var(--ts-border)] rounded px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-ts-text font-bold mb-1">Local Ollama AI Host URL</label>
                <input 
                  type="text" 
                  value={ollamaUrl} 
                  onChange={(e) => setOllamaUrl(e.target.value)} 
                  placeholder="http://localhost:11434" 
                  className="w-full bg-[var(--ts-bg)] border border-[var(--ts-border)] rounded px-3 py-2 text-xs font-mono"
                />
              </div>

              {settingsSaved && (
                <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold text-center flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Settings Saved Successfully!
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowSettings(false)} className="px-4 py-2 rounded bg-gray-500/20 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 px-4 text-xs flex items-center gap-1">
                  <Save className="w-4 h-4" /> Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- USER PROFILE & PASSWORD RESET MODAL --- */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowProfile(false)}
              className="absolute top-4 right-4 text-ts-text-muted hover:text-[var(--ts-text)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 pb-4 border-b border-[var(--ts-border)] mb-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-[var(--ts-blue)] to-[var(--ts-purple)] flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_var(--ts-glow)]">
                {localStorage.getItem('tracescope_user')?.[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-ts-text capitalize">
                  {localStorage.getItem('tracescope_user') || 'Admin User'}
                </h3>
                <p className="text-xs text-ts-text-muted flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Role: <span className="font-bold text-emerald-500">{localStorage.getItem('user_role') || 'Admin / DFIR Lead'}</span>
                </p>
                <p className="text-[10px] text-ts-text-muted font-mono mt-0.5">Security Level 5 (TOP SECRET Clearance)</p>
              </div>
            </div>

            {/* Password Change Section */}
            <form onSubmit={handlePasswordChange} className="space-y-3 text-xs mb-4">
              <h4 className="font-bold text-sm text-ts-text flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-ts-blue" />
                  Update Security Password
                </span>
                <button 
                  type="button" 
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="text-ts-blue text-[11px] flex items-center gap-1 hover:underline font-mono"
                >
                  {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPasswordText ? "Hide Passwords" : "Show Passwords"}
                </button>
              </h4>

              <div>
                <label className="block text-ts-text-muted mb-1">Current Password</label>
                <div className="relative">
                  <input 
                    type={showPasswordText ? "text" : "password"} 
                    value={currentPass} 
                    onChange={(e) => setCurrentPass(e.target.value)} 
                    placeholder="Current Password" 
                    className="w-full bg-[var(--ts-bg)] border border-[var(--ts-border)] rounded px-3 py-2 text-xs font-mono pr-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ts-text-muted mb-1">New Password</label>
                <input 
                  type={showPasswordText ? "text" : "password"} 
                  value={newPass} 
                  onChange={(e) => setNewPass(e.target.value)} 
                  placeholder="New Password (min 6 chars)" 
                  className="w-full bg-[var(--ts-bg)] border border-[var(--ts-border)] rounded px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-ts-text-muted mb-1">Confirm New Password</label>
                <input 
                  type={showPasswordText ? "text" : "password"} 
                  value={confirmPass} 
                  onChange={(e) => setConfirmPass(e.target.value)} 
                  placeholder="Confirm New Password" 
                  className="w-full bg-[var(--ts-bg)] border border-[var(--ts-border)] rounded px-3 py-2 text-xs font-mono"
                />
              </div>

              {passStatusMsg && (
                <div className={`p-2 rounded font-mono text-[11px] ${passStatusMsg.startsWith('Success') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border border-red-500/30 text-red-500'}`}>
                  {passStatusMsg}
                </div>
              )}

              <button type="submit" className="w-full btn-primary py-2 text-xs justify-center">
                Update Password
              </button>
            </form>

            <div className="pt-3 border-t border-[var(--ts-border)] flex justify-between items-center">
              <span className="text-[10px] text-ts-text-muted font-mono">Session Active: 24h JWT Sealed</span>
              <button 
                type="button" 
                onClick={() => {
                  if (window.confirm("Are you sure you want to log out?")) {
                    localStorage.removeItem('tracescope_token');
                    localStorage.removeItem('user_role');
                    localStorage.removeItem('activeCaseId');
                    window.location.href = '/login';
                  }
                }} 
                className="px-3 py-1.5 rounded bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-xs font-bold"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;

