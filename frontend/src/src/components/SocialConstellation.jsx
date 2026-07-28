import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Mail, Globe, Server, ShieldAlert, UserX } from 'lucide-react';

const SocialConstellation = ({ logs }) => {
  // Check if we have logs to extract some dynamic info
  const hasMalicious = logs && logs.some(l => l.risk_level === 'High');

  // Hardcoded constellation layout for the visualizer
  // In a real scenario, this would be computed using d3-force or similar
  const nodes = useMemo(() => [
    { id: 'attacker', type: 'hacker', x: 50, y: 100, label: 'Attacker C2', isMalicious: true },
    { id: 'domain1', type: 'domain', x: 200, y: 50, label: 'login-secure-update.com', isMalicious: true },
    { id: 'domain2', type: 'domain', x: 250, y: 150, label: 'auth-gateway.net', isMalicious: hasMalicious },
    { id: 'ip1', type: 'ip', x: 400, y: 80, label: '192.168.1.104', isMalicious: false },
    { id: 'ip2', type: 'ip', x: 450, y: 200, label: '10.0.0.5 (Victim)', isMalicious: false },
    { id: 'email1', type: 'email', x: 600, y: 120, label: 'HR-Update@company.com', isMalicious: hasMalicious },
    { id: 'victim1', type: 'victim', x: 750, y: 60, label: 'John Doe', isMalicious: false },
    { id: 'victim2', type: 'victim', x: 750, y: 180, label: 'Jane Smith', isMalicious: false },
  ], [hasMalicious]);

  const edges = useMemo(() => [
    { source: 'attacker', target: 'domain1' },
    { source: 'attacker', target: 'domain2' },
    { source: 'domain1', target: 'ip1' },
    { source: 'domain2', target: 'ip2' },
    { source: 'ip1', target: 'email1' },
    { source: 'ip2', target: 'email1' },
    { source: 'email1', target: 'victim1' },
    { source: 'email1', target: 'victim2' },
  ], []);

  const getNodeIcon = (type, isMalicious) => {
    const props = { className: clsx("w-6 h-6", isMalicious ? "text-red-400" : "text-[var(--ts-blue)]") };
    switch(type) {
      case 'hacker': return <ShieldAlert {...props} />;
      case 'domain': return <Globe {...props} />;
      case 'ip': return <Server {...props} />;
      case 'email': return <Mail {...props} />;
      case 'victim': return <UserX {...props} />;
      default: return <Server {...props} />;
    }
  };

  return (
    <div className="w-full h-full relative bg-[var(--ts-panel)] dark:bg-black overflow-hidden rounded-xl border border-ts-border">
      <div className="absolute inset-0 bg-gradient-radial from-[var(--ts-blue)]/5 to-transparent pointer-events-none z-10 opacity-70" />
      
      <svg className="w-full h-full absolute inset-0" viewBox="0 0 800 250" preserveAspectRatio="xMidYMid meet">
        {/* Edges */}
        {edges.map((edge, i) => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;
          
          return (
            <motion.line
              key={i}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke={sourceNode.isMalicious || targetNode.isMalicious ? "rgba(239, 68, 68, 0.4)" : "rgba(14, 165, 233, 0.4)"}
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: i * 0.2 }}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => (
        <motion.div
          key={node.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center cursor-pointer group z-20"
          style={{ left: `${(node.x / 800) * 100}%`, top: `${(node.y / 250) * 100}%` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            y: [0, -5, 0]
          }}
          transition={{ 
            scale: { duration: 0.5, delay: i * 0.1 },
            opacity: { duration: 0.5, delay: i * 0.1 },
            y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }
          }}
        >
          <div className={clsx(
            "w-12 h-12 rounded-full flex items-center justify-center bg-[var(--ts-panel)] dark:bg-black border-2 shadow-lg transition-transform group-hover:scale-110",
            node.isMalicious ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "border-[var(--ts-blue)] shadow-[0_0_15px_rgba(14,165,233,0.5)]"
          )}>
            {getNodeIcon(node.type, node.isMalicious)}
          </div>
          <div className={clsx(
            "mt-2 text-[10px] font-mono font-bold whitespace-nowrap bg-[var(--ts-panel)]/80 dark:bg-black/80 px-2 py-1 rounded backdrop-blur-sm border",
            node.isMalicious ? "text-red-400 border-red-500/30" : "text-[var(--ts-text)] border-[var(--ts-border)]"
          )}>
            {node.label}
          </div>
        </motion.div>
      ))}

      {/* Floating Particles for Cyberpunk effect */}
      <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 800 250">
        {[...Array(20)].map((_, i) => (
          <motion.circle
            key={`particle-${i}`}
            r="1"
            fill={i % 2 === 0 ? "#00f0ff" : "#ff003c"}
            initial={{ cx: Math.random() * 800, cy: Math.random() * 250, opacity: 0 }}
            animate={{ 
              cx: Math.random() * 800,
              cy: Math.random() * 250,
              opacity: [0, 0.8, 0] 
            }}
            transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </svg>

      <div className="absolute top-4 left-4 z-30 pointer-events-none">
        <h3 className="font-bold text-ts-cyan text-sm tracking-widest uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-ts-cyan animate-pulse"></span>
          Social Engineering Constellation
        </h3>
        <p className="text-[10px] text-ts-text-muted mt-1">Phishing blast radius analysis.</p>
      </div>
    </div>
  );
};

export default SocialConstellation;
