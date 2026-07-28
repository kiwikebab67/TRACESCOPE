import React, { useEffect, useRef, useState } from 'react';

const MemoryRadar = ({ logs }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Scale for high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);
    
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    const radius = Math.min(cx, cy) - 20;

    let angle = 0;
    let animationFrameId;

    // Generate static hex grid data for the background
    const hexGrid = [];
    const hexChars = '0123456789ABCDEF';
    for (let i = 0; i < 300; i++) {
      let r = Math.random() * radius;
      let theta = Math.random() * Math.PI * 2;
      let hex = '';
      for (let j=0; j<4; j++) hex += hexChars[Math.floor(Math.random() * 16)];
      hexGrid.push({
        x: cx + r * Math.cos(theta),
        y: cy + r * Math.sin(theta),
        hex,
        isMalicious: Math.random() > 0.95
      });
    }

    const hasHighRisk = logs && logs.some(l => l.risk_level === 'High');

    const draw = () => {
      // Clear
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw hex grid
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      hexGrid.forEach(point => {
        // Calculate distance from current radar sweep angle
        let dx = point.x - cx;
        let dy = point.y - cy;
        let pointAngle = Math.atan2(dy, dx);
        if (pointAngle < 0) pointAngle += Math.PI * 2;
        
        let angleDiff = angle - pointAngle;
        if (angleDiff < 0) angleDiff += Math.PI * 2;

        let alpha = 0.1; // base visibility
        if (angleDiff < Math.PI / 2) {
          alpha = Math.max(0.1, 1 - (angleDiff / (Math.PI / 2)));
        }

        const isDark = document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (hasHighRisk && point.isMalicious) {
          ctx.fillStyle = `rgba(239, 68, 68, ${Math.max(0.3, alpha * 2)})`; // Red
          ctx.font = 'bold 12px monospace';
        } else {
          ctx.fillStyle = `rgba(14, 165, 233, ${isDark ? alpha : alpha + 0.3})`; // Blue, make it more visible in light mode
          ctx.font = '10px monospace';
        }
        
        ctx.fillText(point.hex, point.x, point.y);
      });

      // Draw radar circles
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (radius / 3) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.stroke();

      // Draw sweep gradient
      const sweepGradient = ctx.createConicGradient(angle, cx, cy);
      sweepGradient.addColorStop(0, 'rgba(14, 165, 233, 0)');
      sweepGradient.addColorStop(0.9, 'rgba(14, 165, 233, 0)');
      sweepGradient.addColorStop(1, 'rgba(14, 165, 233, 0.4)');
      
      ctx.fillStyle = sweepGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw sweep line
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.stroke();

      angle += 0.05;
      if (angle >= Math.PI * 2) {
        angle = 0;
        // Optionally randomize hex slightly each rotation
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions, logs]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[var(--ts-panel)] dark:bg-black flex items-center justify-center overflow-hidden rounded-xl border border-ts-border">
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-[var(--ts-panel)] dark:to-black pointer-events-none z-10 opacity-70" />
      <canvas 
        ref={canvasRef} 
        style={{ width: dimensions.width, height: dimensions.height }}
        className="block"
      />
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <h3 className="font-bold text-ts-cyan text-sm tracking-widest uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-ts-cyan animate-pulse"></span>
          Hex Grid Radar
        </h3>
        <p className="text-[10px] text-ts-text-muted mt-1">Memory Address Space Sweeper</p>
      </div>
    </div>
  );
};

export default MemoryRadar;
