import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Usb, Cpu, HardDrive, Keyboard, ShieldAlert } from 'lucide-react';

const UsbTopology = ({ logs }) => {
  // Hardcoded device topology for the visualizer
  const hasSuspicious = logs && logs.some(l => l.risk_level === 'High');

  const nodes = useMemo(() => [
    { id: 'host', type: 'cpu', x: 100, y: 125, label: 'Host Controller (PCIe)', suspicious: false },
    { id: 'hub1', type: 'hub', x: 300, y: 75, label: 'Root Hub A', suspicious: false },
    { id: 'hub2', type: 'hub', x: 300, y: 175, label: 'Root Hub B', suspicious: false },
    { id: 'keyboard', type: 'hid', x: 500, y: 50, label: 'Logitech HID', suspicious: false },
    { id: 'mouse', type: 'hid', x: 500, y: 100, label: 'Razer Mouse', suspicious: false },
    { id: 'usb1', type: 'storage', x: 500, y: 175, label: 'SanDisk Cruzer (E:)', suspicious: hasSuspicious },
    { id: 'payload', type: 'malware', x: 700, y: 175, label: 'payload.exe Executed', suspicious: hasSuspicious },
  ], [hasSuspicious]);

  const edges = useMemo(() => [
    { source: 'host', target: 'hub1' },
    { source: 'host', target: 'hub2' },
    { source: 'hub1', target: 'keyboard' },
    { source: 'hub1', target: 'mouse' },
    { source: 'hub2', target: 'usb1' },
    { source: 'usb1', target: 'payload', isThreatPath: hasSuspicious },
  ], [hasSuspicious]);

  const getNodeIcon = (type, suspicious) => {
    const props = { className: clsx("w-5 h-5", suspicious ? "text-red-400" : "text-[var(--ts-blue)]") };
    switch(type) {
      case 'cpu': return <Cpu {...props} />;
      case 'hub': return <Usb {...props} />;
      case 'storage': return <HardDrive {...props} />;
      case 'hid': return <Keyboard {...props} />;
      case 'malware': return <ShieldAlert {...props} />;
      default: return <Usb {...props} />;
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
            <g key={i}>
              <motion.path
                d={`M ${sourceNode.x} ${sourceNode.y} C ${sourceNode.x + 100} ${sourceNode.y}, ${targetNode.x - 100} ${targetNode.y}, ${targetNode.x} ${targetNode.y}`}
                fill="none"
                stroke={edge.isThreatPath ? "rgba(239, 68, 68, 0.4)" : "rgba(14, 165, 233, 0.4)"}
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: i * 0.15 }}
              />
              {/* Data Pulses */}
              {(!edge.isThreatPath || edge.isThreatPath === true) && (
                <motion.circle
                  r="3"
                  fill={edge.isThreatPath ? "#ff003c" : "#00f0ff"}
                  initial={{ offsetDistance: "0%" }}
                  animate={{ offsetDistance: "100%" }}
                  transition={{ 
                    duration: edge.isThreatPath ? 1.5 : 3, 
                    repeat: Infinity, 
                    ease: "linear",
                    delay: Math.random() * 2 
                  }}
                  style={{ offsetPath: `path('M ${sourceNode.x} ${sourceNode.y} C ${sourceNode.x + 100} ${sourceNode.y}, ${targetNode.x - 100} ${targetNode.y}, ${targetNode.x} ${targetNode.y}')` }}
                  className="shadow-[0_0_10px_#00f0ff]"
                />
              )}
            </g>
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
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: i * 0.1 
          }}
        >
          <div className={clsx(
            "w-10 h-10 rounded bg-[var(--ts-panel)] dark:bg-black border flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
            node.suspicious ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "border-[var(--ts-blue)] shadow-[0_0_15px_rgba(14,165,233,0.3)]"
          )}>
            {getNodeIcon(node.type, node.suspicious)}
          </div>
          <div className={clsx(
            "mt-2 text-[10px] font-mono whitespace-nowrap bg-[var(--ts-panel)]/90 dark:bg-black/90 px-2 py-1 rounded backdrop-blur-sm border",
            node.suspicious ? "text-red-400 font-bold border-red-500/30" : "text-[var(--ts-text-muted)] border-[var(--ts-border)]"
          )}>
            {node.label}
          </div>
        </motion.div>
      ))}

      <div className="absolute top-4 left-4 z-30 pointer-events-none">
        <h3 className="font-bold text-ts-cyan text-sm tracking-widest uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-ts-cyan animate-pulse"></span>
          Device Pulse Topology
        </h3>
        <p className="text-[10px] text-ts-text-muted mt-1">Hardware tree and data exfiltration paths.</p>
      </div>
    </div>
  );
};

export default UsbTopology;
