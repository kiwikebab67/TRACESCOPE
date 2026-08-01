import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { 
  LayoutDashboard, 
  Briefcase, 
  Files, 
  Activity, 
  BrainCircuit, 
  Bug, 
  Cpu, 
  Database, 
  FileText, 
  Usb, 
  Network, 
  Mail, 
  Globe, 
  Link2, 
  ShieldAlert, 
  Scan, 
  Hash, 
  FileOutput,
  Users,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Crosshair
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [isHovered, setIsHovered] = useState(false);
  const effectiveOpen = isOpen || isHovered;
  
  const navGroups = [
    {
      label: 'System Core',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Investigations', icon: Briefcase, path: '/investigations' },
        { name: 'Evidence', icon: Files, path: '/evidence' },
        { name: 'Timeline', icon: Activity, path: '/timeline' },
        { name: 'Chain of Custody', icon: Link2, path: '/chain-of-custody' },
      ]
    },
    {
      label: 'Cyber Forensics',
      items: [
        { name: 'TraceScope AI', icon: BrainCircuit, path: '/ai-assistant' },
        { name: 'Malware Engine', icon: Bug, path: '/malware' },
        { name: 'Memory Scan', icon: Cpu, path: '/memory' },
        { name: 'Registry Hive', icon: Database, path: '/registry' },
        { name: 'Event Logs', icon: FileText, path: '/logs' },
        { name: 'USB History', icon: Usb, path: '/usb' },
        { name: 'Packet Analysis', icon: Network, path: '/network' },
        { name: 'Email Headers', icon: Mail, path: '/email' },
        { name: 'Web History', icon: Globe, path: '/browser' },
      ]
    },
    {
      label: 'Global Defense',
      items: [
        { name: 'Threat Tracker', icon: Globe2, path: '/osint' },
        { name: 'Threat Intel', icon: ShieldAlert, path: '/threat-intel' },
        { name: 'IOC Scanner', icon: Scan, path: '/ioc-scanner' },
        { name: 'Hash Matrix', icon: Hash, path: '/hashes' },
      ]
    },
    {
      label: 'Output',
      items: [
        { name: 'Auto-Report', icon: FileOutput, path: '/reports' },
        { name: 'Victim Connect', icon: Users, path: '/connect' },
      ]
    }
  ];

  return (
    <aside 
      onMouseEnter={() => !isOpen && setIsHovered(true)}
      onMouseLeave={() => !isOpen && setIsHovered(false)}
      className={clsx(
        "relative flex flex-col h-full transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] z-30 shrink-0 overflow-y-auto bg-[var(--ts-panel)] border-r border-[var(--ts-border)] shadow-xl",
        effectiveOpen ? "w-[280px]" : "w-[72px]"
      )}
    >
      {/* Cyber Grid Background */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
           backgroundImage: 'linear-gradient(var(--ts-blue) 1px, transparent 1px), linear-gradient(90deg, var(--ts-blue) 1px, transparent 1px)',
           backgroundSize: '24px 24px',
           backgroundPosition: 'top left'
        }}
      />
      
      {/* Neon Edge Highlight */}
      <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[var(--ts-blue)] to-transparent opacity-50 shadow-[0_0_10px_var(--ts-blue)] pointer-events-none" />

      {/* Header */}
      <div className="h-20 flex items-center px-5 border-b border-[var(--ts-border)] shrink-0 sticky top-0 bg-[var(--ts-panel)]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4 w-full overflow-hidden">
          <div className="relative shrink-0">
             <div className="w-10 h-10 rounded-xl bg-[var(--ts-bg)] border border-[var(--ts-blue)] flex items-center justify-center text-[var(--ts-blue)] font-black shadow-[0_0_15px_var(--ts-glow)] overflow-hidden group">
               <Crosshair className="w-6 h-6 animate-spin-slow group-hover:scale-110 transition-transform" />
             </div>
          </div>
          <div className={clsx("flex flex-col whitespace-nowrap transition-all duration-300", !effectiveOpen ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0")}>
            <span className="font-black text-[var(--ts-text)] tracking-[0.2em] text-lg hover-glitch cursor-default">TRACE<span className="text-[var(--ts-blue)]">SCOPE</span></span>
            <span className="text-[10px] text-[var(--ts-blue)] font-mono uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ts-blue)] animate-pulse"></span>
              DFIR ORCHESTRATOR
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-8 custom-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-2 px-3">
            <span 
              className={clsx(
                "text-[9px] font-black text-ts-text-muted uppercase tracking-[0.3em] px-4 mb-2 whitespace-nowrap transition-opacity duration-200 border-l border-[var(--ts-border)] ml-1 pl-3",
                !effectiveOpen && "opacity-0 hidden"
              )}
            >
              {group.label}
            </span>
            {group.items.map((item, i) => (
              <NavLink
                key={i}
                to={item.path}
                className={({ isActive }) => clsx(
                  "relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap group overflow-hidden cyber-border",
                  isActive 
                    ? "bg-[var(--ts-blue)]/10 text-[var(--ts-text)] font-bold" 
                    : "text-ts-text-muted hover:text-[var(--ts-text)] font-medium hover:bg-[var(--ts-blue)]/5"
                )}
                title={!effectiveOpen ? item.name : undefined}
              >
                {({ isActive }) => (
                  <>
                    {/* Active State Background Elements */}
                    {isActive && (
                       <>
                         <div className="absolute inset-0 bg-gradient-to-r from-[var(--ts-blue)]/20 to-transparent pointer-events-none" />
                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--ts-blue)] shadow-[0_0_15px_var(--ts-glow)]" />
                         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--ts-blue)]/10 to-transparent animate-scanline pointer-events-none" />
                       </>
                    )}
                    
                    <item.icon className={clsx(
                        "w-5 h-5 shrink-0 transition-all duration-300 z-10", 
                        isActive ? "text-[var(--ts-blue)] drop-shadow-[0_0_8px_var(--ts-glow)]" : "group-hover:text-[var(--ts-blue)] group-hover:scale-110"
                    )} />
                    
                    <span className={clsx("text-sm tracking-wide transition-all duration-300 z-10", !effectiveOpen && "opacity-0 translate-x-4")}>
                      {item.name}
                    </span>
                    
                    {/* Hover Hexagon Accents */}
                    {isActive && effectiveOpen && (
                      <div className="absolute right-4 w-1 h-1 bg-[var(--ts-blue)] rotate-45 shadow-[0_0_5px_var(--ts-glow)]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-[var(--ts-border)] sticky bottom-0 bg-[var(--ts-panel)]/90 backdrop-blur-lg z-10">
         <button 
           onClick={() => setIsOpen(!isOpen)}
           className={clsx(
             "w-full flex items-center p-3 rounded-xl text-ts-text-muted hover:text-[var(--ts-blue)] hover:bg-[var(--ts-blue)]/10 transition-all duration-300 cyber-border group",
             effectiveOpen ? "justify-end" : "justify-center"
           )}
         >
           <div className={clsx("transition-transform duration-300", !isOpen && isHovered && "rotate-180")}>
             {isOpen ? <ChevronLeft className="w-5 h-5 group-hover:drop-shadow-[0_0_5px_var(--ts-glow)]" /> : <ChevronRight className="w-5 h-5 group-hover:drop-shadow-[0_0_5px_var(--ts-glow)]" />}
           </div>
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;
