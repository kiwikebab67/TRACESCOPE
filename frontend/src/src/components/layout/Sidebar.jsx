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
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [isHovered, setIsHovered] = useState(false);
  const effectiveOpen = isOpen || isHovered;
  const navGroups = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Investigations', icon: Briefcase, path: '/investigations' },
        { name: 'Evidence', icon: Files, path: '/evidence' },
        { name: 'Timeline', icon: Activity, path: '/timeline' },
        { name: 'Chain of Custody', icon: Link2, path: '/chain-of-custody' },
      ]
    },
    {
      label: 'Forensic Suite',
      items: [
        { name: 'AI Investigation', icon: BrainCircuit, path: '/ai-assistant' },
        { name: 'Malware Analysis', icon: Bug, path: '/malware' },
        { name: 'Memory Analysis', icon: Cpu, path: '/memory' },
        { name: 'Registry Analysis', icon: Database, path: '/registry' },
        { name: 'Log Analysis', icon: FileText, path: '/logs' },
        { name: 'USB Analysis', icon: Usb, path: '/usb' },
        { name: 'Network Analysis', icon: Network, path: '/network' },
        { name: 'Email Investigation', icon: Mail, path: '/email' },
        { name: 'Browser Artifacts', icon: Globe, path: '/browser' },
      ]
    },
    {
      label: 'Threat Intel',
      items: [
        { name: 'Threat Intelligence', icon: ShieldAlert, path: '/threat-intel' },
        { name: 'IOC Scanner', icon: Scan, path: '/ioc-scanner' },
        { name: 'Hash Database', icon: Hash, path: '/hashes' },
      ]
    },
    {
      label: 'Output',
      items: [
        { name: 'Reports', icon: FileOutput, path: '/reports' },
      ]
    },
    {
      label: 'Resources',
      items: [
        { name: 'Victim Support', icon: Users, path: '/connect' },
      ]
    }
  ];

  return (
    <aside 
      onMouseEnter={() => !isOpen && setIsHovered(true)}
      onMouseLeave={() => !isOpen && setIsHovered(false)}
      className={clsx(
        "bg-[var(--ts-panel)] border-r border-[var(--ts-border)] flex flex-col h-full transition-all duration-300 ease-in-out z-30 shrink-0 overflow-y-auto relative",
        effectiveOpen ? "w-64" : "w-16"
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-ts-border shrink-0 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3 w-full overflow-hidden">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[var(--ts-purple)] to-[var(--ts-blue)] flex items-center justify-center text-white font-bold shrink-0 shadow-[0_0_10px_var(--ts-glow)]">
            TS
          </div>
          <div className={clsx("flex flex-col whitespace-nowrap transition-opacity duration-200", !effectiveOpen && "opacity-0")}>
            <span className="font-bold text-[var(--ts-text)] tracking-wide text-sm text-gradient">TraceScope</span>
            <span className="text-[0.65rem] text-ts-text-muted font-medium uppercase tracking-wider">DFIR Platform</span>
          </div>
        </div>
      </div>

      <div className="flex-1 py-4 flex flex-col gap-6">
        {navGroups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-1 px-3">
            <span 
              className={clsx(
                "text-[0.65rem] font-bold text-ts-text-muted uppercase tracking-wider px-3 mb-1 whitespace-nowrap transition-opacity duration-200",
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
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap group",
                  isActive 
                    ? "bg-gradient-to-r from-[var(--ts-blue)]/10 to-[var(--ts-pink)]/10 text-[var(--ts-blue)] font-semibold shadow-[inset_2px_0_0_var(--ts-blue)]" 
                    : "text-ts-text-muted hover:bg-[var(--ts-border)] hover:text-[var(--ts-text)] font-medium"
                )}
                title={!effectiveOpen ? item.name : undefined}
              >
                <item.icon className={clsx("w-5 h-5 shrink-0 transition-colors", "group-hover:text-[var(--ts-blue)] group-hover:drop-shadow-[0_0_5px_var(--ts-glow)]")} />
                <span className={clsx("text-sm transition-opacity duration-200", !effectiveOpen && "opacity-0 hidden")}>
                  {item.name}
                </span>
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Collapse Toggle Button at bottom */}
      <div className="p-4 border-t border-[var(--ts-border)] sticky bottom-0 bg-[var(--ts-panel)] z-10">
         <button 
           onClick={() => setIsOpen(!isOpen)}
           className={clsx(
             "w-full flex items-center p-2 rounded-lg text-ts-text-muted hover:text-[var(--ts-text)] hover:bg-[var(--ts-border)] transition-colors",
             effectiveOpen ? "justify-end" : "justify-center"
           )}
         >
           {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;
