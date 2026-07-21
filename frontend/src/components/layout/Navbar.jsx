import React, { useState, useEffect } from 'react';
import { Search, Bell, Sun, Moon, Settings, User } from 'lucide-react';

const Navbar = ({ toggleSidebar }) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <div className="flex flex-col shrink-0">
      <div className="h-6 w-full bg-[#ff003c] flex items-center justify-center text-[0.6rem] font-bold text-white tracking-[0.3em]">
        CLASSIFICATION: TOP SECRET // TRACESCOPE FOR OFFICIAL USE ONLY
      </div>
      <header className="bg-[var(--ts-panel)] border-b border-[var(--ts-border)] h-16 flex items-center justify-between px-6 shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-4">
        {/* Toggle button for mobile or collapsing */}
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
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-3 mr-4">
           <div className="flex flex-col text-right">
             <span className="text-xs font-semibold text-[var(--ts-text)] uppercase tracking-wider">Current Case</span>
             <span className="text-xs text-[var(--ts-blue)] font-mono font-medium drop-shadow-[0_0_5px_var(--ts-glow)]">CS-2024-009</span>
           </div>
           <div className="h-8 w-px bg-[var(--ts-border)] mx-2"></div>
           <div className="flex flex-col text-right">
             <span className="text-xs font-semibold text-[var(--ts-text)] uppercase tracking-wider">System Status</span>
             <span className="text-xs text-green-500 font-medium flex items-center gap-1 justify-end">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span> ONLINE
             </span>
           </div>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-2 text-ts-text-muted hover:bg-[var(--ts-border)] hover:text-[var(--ts-blue)] rounded-full transition-all"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button className="p-2 text-ts-text-muted hover:bg-[var(--ts-border)] rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--ts-pink)] rounded-full shadow-[0_0_8px_var(--ts-pink)]"></span>
        </button>
        
        <button className="p-2 text-ts-text-muted hover:bg-[var(--ts-border)] rounded-full transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[var(--ts-blue)] to-[var(--ts-purple)] flex items-center justify-center text-white shadow-[0_0_10px_var(--ts-glow)] ml-2 cursor-pointer">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
    </div>
  );
};

export default Navbar;
