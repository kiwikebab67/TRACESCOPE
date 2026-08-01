import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldAlert, Cpu, Database, Network } from 'lucide-react';
import clsx from 'clsx';

const NodeGraph = () => {
  const containerRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
    }

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    // Generate centralized structure (Center Node + Outer Nodes)
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(centerX, centerY) * 0.7;

    const numNodes = 8;
    const suites = [
      { label: "Memory Analysis", icon: Database, color: '#ff00ff' }, // Magenta
      { label: "Network Analysis", icon: Network, color: '#00f0ff' }, // Cyan
      { label: "Log Analysis", icon: Activity, color: '#ffea00' }, // Neon Yellow
      { label: "Registry Analysis", icon: Database, color: '#bc13fe' }, // Neon Purple
      { label: "Malware Analysis", icon: Activity, color: '#ff003c' }, // Neon Red
      { label: "USB Analysis", icon: Cpu, color: '#39ff14' }, // Neon Green
      { label: "Email Investigation", icon: Network, color: '#ff00ff' }, // Magenta
      { label: "Browser Artifacts", icon: Database, color: '#00f0ff' } // Cyan
    ];

    const generatedNodes = [
      {
        id: 'center',
        x: centerX,
        y: centerY,
        label: 'TRACESCOPE-HQ',
        type: 'core',
        color: '#00f0ff', // Cyan
        icon: ShieldAlert
      }
    ];

    const generatedEdges = [];

    for (let i = 0; i < numNodes; i++) {
      const angle = (i / numNodes) * 2 * Math.PI;
      const rawX = centerX + radius * Math.cos(angle);
      const rawY = centerY + radius * Math.sin(angle);
      
      // Snap to 30px grid for perfect alignment with the background lines
      const grid = 30;
      const x = Math.round((rawX - centerX) / grid) * grid + centerX;
      const y = Math.round((rawY - centerY) / grid) * grid + centerY;
      
      const isHighRisk = i === 2 || i === 4; // Highlight Log and Malware as High Risk
      const id = `node-${i}`;
      
      generatedNodes.push({
        id,
        x,
        y,
        label: suites[i].label,
        type: isHighRisk ? 'alert' : 'standard',
        color: suites[i].color,
        icon: suites[i].icon,
        angle // Store angle for floating animation
      });

      generatedEdges.push({
        id: `edge-center-${id}`,
        from: 'center',
        to: id,
        color: suites[i].color,
        opacity: isHighRisk ? 0.6 : 0.2
      });
      
      // Connect to adjacent nodes
      if (i > 0) {
        generatedEdges.push({
          id: `edge-${id}-prev`,
          from: id,
          to: `node-${i-1}`,
          color: suites[i].color,
          opacity: 0.15
        });
      }
    }
    // Connect last to first
    generatedEdges.push({
      id: `edge-last-first`,
      from: `node-${numNodes - 1}`,
      to: `node-0`,
      color: suites[0].color,
      opacity: 0.15
    });

    setNodes(generatedNodes);
    setEdges(generatedEdges);
  }, [dimensions]);

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const radius = Math.min(centerX, centerY) * 0.6;
  const outerRadarRadius = radius * 1.3;

  // Build particles for center-connected edges
  const particles = useMemo(() => {
    if (nodes.length === 0) return [];
    const centerNode = nodes.find(n => n.id === 'center');
    if (!centerNode) return [];
    return edges
      .filter(e => e.from === 'center' || e.to === 'center')
      .flatMap(edge => {
        const outerNode = nodes.find(n => n.id === (edge.from === 'center' ? edge.to : edge.from));
        if (!outerNode) return [];
        return [0, 1, 2].map(idx => ({
          key: `${edge.id}-p${idx}`,
          x1: outerNode.x,
          y1: outerNode.y,
          x2: centerNode.x,
          y2: centerNode.y,
          color: edge.color,
          delay: idx * 1.2,
        }));
      });
  }, [nodes, edges]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-[500px] relative overflow-hidden rounded-xl border border-[var(--ts-border)] 
                 bg-white/50 dark:bg-[#020617] backdrop-blur-md transition-colors"
      style={{
        boxShadow: 'inset 0 0 40px rgba(0, 240, 255, 0.05)'
      }}
    >
      {/* Dynamic Grid Background with Vignette */}
      <div 
        className="absolute inset-0 dark:opacity-30 opacity-15" 
        style={{
          backgroundImage: 'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.8) 100%), linear-gradient(to right, #00f0ff 1px, transparent 1px), linear-gradient(to bottom, #00f0ff 1px, transparent 1px)',
          backgroundSize: '100% 100%, 30px 30px, 30px 30px',
          backgroundPosition: 'center center, calc(50% + 15px) calc(50% + 15px), calc(50% + 15px) calc(50% + 15px)'
        }}
      />
      
      {/* Title Overlay */}
      <div className="absolute top-5 left-5 z-20 pointer-events-none">
        <h2 className="text-sm font-bold text-[var(--ts-text)] uppercase tracking-wider flex items-center gap-2 drop-shadow-md">
          <Cpu className="w-4 h-4 text-[var(--ts-blue)] animate-pulse" />
          Cybernetic Threat Matrix
        </h2>
        <p className="text-xs text-ts-text-muted mt-1 font-mono">Real-time Node Telemetry</p>
      </div>

      {/* Radar sweep CSS animation */}
      <style>{`
        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {dimensions.width > 0 && dimensions.height > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {/* Defs for glowing filters */}
          <defs>
            <filter id="neon-glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="neon-glow-magenta" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Gradient for the radar sweep line */}
            <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Radar Circles */}
          <circle cx={centerX} cy={centerY} r={radius * 0.4} stroke="#00f0ff" strokeWidth="1" fill="none" strokeDasharray="4,4" opacity="0.2" />
          <circle cx={centerX} cy={centerY} r={radius * 0.7} stroke="#00f0ff" strokeWidth="1" fill="none" opacity="0.1" />
          <circle cx={centerX} cy={centerY} r={radius * 1.0} stroke="#00f0ff" strokeWidth="1" fill="none" strokeDasharray="2,6" opacity="0.15" />
          <circle cx={centerX} cy={centerY} r={radius * 1.3} stroke="#00f0ff" strokeWidth="1" fill="none" opacity="0.05" />

          {/* ─── Rotating Radar Sweep Line ─── */}
          <g style={{ transformOrigin: `${centerX}px ${centerY}px`, animation: 'radarSweep 6s linear infinite' }}>
            <line
              x1={centerX}
              y1={centerY}
              x2={centerX}
              y2={centerY - outerRadarRadius}
              stroke="url(#sweepGrad)"
              strokeWidth="2"
              opacity="0.6"
            />
            {/* Faint cone trailing the sweep */}
            <path
              d={`M ${centerX} ${centerY} L ${centerX} ${centerY - outerRadarRadius} A ${outerRadarRadius} ${outerRadarRadius} 0 0 0 ${centerX - outerRadarRadius * Math.sin(Math.PI / 12)} ${centerY - outerRadarRadius * Math.cos(Math.PI / 12)} Z`}
              fill="#00f0ff"
              opacity="0.04"
            />
          </g>

          {/* Render Edges */}
          {edges.map(edge => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            
            const isHovered = hoveredNode === edge.from || hoveredNode === edge.to;
            const isAlert = edge.color === '#ff003c' || edge.color === '#ffea00';

            return (
              <motion.line
                key={edge.id}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isHovered ? edge.color : edge.color}
                strokeWidth={isHovered ? 2 : 1}
                animate={{
                  opacity: isHovered ? 1 : (edge.opacity || 0.4)
                }}
                transition={{ duration: 0.3 }}
                filter={isAlert ? 'url(#neon-glow-magenta)' : 'url(#neon-glow-cyan)'}
              />
            );
          })}

          {/* ─── Animated Data Particles ─── */}
          {particles.map(p => {
            const pathD = `M ${p.x1} ${p.y1} L ${p.x2} ${p.y2}`;
            return (
              <g key={p.key}>
                <circle r="2.5" fill={p.color} opacity="0.9" filter="url(#neon-glow-cyan)">
                  <animateMotion dur="3s" repeatCount="indefinite" begin={`${p.delay}s`} path={pathD} />
                </circle>
                {/* Trailing glow particle */}
                <circle r="1.5" fill="white" opacity="0.5">
                  <animateMotion dur="3s" repeatCount="indefinite" begin={`${p.delay + 0.15}s`} path={pathD} />
                </circle>
              </g>
            );
          })}
        </svg>
      )}

      {/* Render Nodes */}
      {nodes.map(node => {
        const Icon = node.icon;
        const isCore = node.type === 'core';
        const isAlert = node.type === 'alert';
        
        // Floating animation logic
        const floatY = isCore ? 0 : Math.sin(node.angle || 0) * 10;
        
        return (
          <motion.div
            key={node.id}
            className="absolute z-10 cursor-pointer flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: node.x,
              top: node.y,
            }}
            animate={{
              y: [0, floatY, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <motion.div 
              className={clsx(
                "relative flex items-center justify-center rounded-full backdrop-blur-sm",
                isCore ? "w-16 h-16 bg-black dark:bg-[#020617] border-2" : "w-10 h-10 bg-white/80 dark:bg-[#020617]/80 border"
              )}
              style={{
                borderColor: node.color,
                boxShadow: hoveredNode === node.id || isAlert || isCore
                  ? `0 0 ${isCore ? '25px' : '15px'} ${node.color}` 
                  : 'none'
              }}
              whileHover={{ scale: 1.2 }}
            >
              <Icon 
                className={clsx(isCore ? "w-8 h-8" : "w-5 h-5")} 
                style={{ color: node.color }} 
              />
              
              {/* Ping effect for alerts */}
              {isAlert && (
                <span 
                  className="absolute inset-0 rounded-full animate-ping opacity-50"
                  style={{ backgroundColor: node.color }}
                ></span>
              )}

              {/* ─── Pulsing Sonar Rings for Center Node ─── */}
              {isCore && (
                <>
                  <motion.span
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: node.color }}
                    animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <motion.span
                    className="absolute inset-0 rounded-full border"
                    style={{ borderColor: node.color }}
                    animate={{ scale: [1, 2.8], opacity: [0.4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
                  />
                </>
              )}
            </motion.div>

            {/* Label (Always Visible and Glowing) */}
            <div 
              className="absolute top-full mt-3 text-[11px] font-bold font-mono px-2 py-1 rounded bg-white/90 dark:bg-black/90 border whitespace-nowrap pointer-events-none"
              style={{
                borderColor: node.color,
                color: node.color,
                boxShadow: `0 0 10px ${node.color}40`,
                textShadow: `0 0 8px ${node.color}90`,
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              {node.label}
            </div>

            {/* ─── Tooltip on Hover ─── */}
            <AnimatePresence>
              {hoveredNode === node.id && !isCore && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.92 }}
                  transition={{ duration: 0.18 }}
                  className="absolute z-30 bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 rounded-lg p-3
                             bg-white/95 dark:bg-[#0b1120]/95 backdrop-blur-xl border
                             shadow-lg shadow-black/30 pointer-events-none"
                  style={{
                    borderColor: node.color,
                    boxShadow: `0 0 18px ${node.color}30, 0 4px 24px rgba(0,0,0,0.4)`,
                  }}
                >
                  <p className="text-xs font-bold font-mono truncate" style={{ color: node.color }}>
                    {node.label}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
                    <span className="text-[10px] text-green-400 font-semibold">Online</span>
                  </div>
                  <p className="mt-1 text-[10px] text-[var(--ts-text)] opacity-60 font-mono">Last Scan: 2m ago</p>
                  <p className="text-[10px] text-[var(--ts-text)] opacity-60 font-mono">Throughput: 1.4 kB/s</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

export default NodeGraph;
