import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

const NetworkWaterfall = ({ packets }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    const setDimensions = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    
    setDimensions();
    window.addEventListener('resize', setDimensions);

    // Matrix characters (hex and basic ascii)
    const chars = '0123456789ABCDEF!@#$%^&*()_+-=<>?'.split('');
    
    const fontSize = 12;
    let columns = canvas.width / fontSize;
    const drops = [];
    const colors = [];
    
    for (let x = 0; x < columns; x++) {
      drops[x] = Math.random() * -100;
      colors[x] = '#0ea5e9'; // Default blue
    }

    let animationFrameId;

    const draw = () => {
      // Recalculate columns in case of resize
      if (columns !== Math.floor(canvas.width / fontSize)) {
        const oldCols = columns;
        columns = Math.floor(canvas.width / fontSize);
        for (let x = oldCols; x < columns; x++) {
          drops[x] = Math.random() * -100;
          colors[x] = '#0ea5e9';
        }
      }

      const isDark = document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = fontSize + 'px monospace';

      // Check if we have high risk packets recently
      const hasHighRisk = packets.some(p => p.risk === 'High');
      const baseColor = hasHighRisk ? '#ef4444' : '#0ea5e9';

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        
        // Randomly make some streams red if there's high risk
        if (hasHighRisk && Math.random() > 0.95) {
          colors[i] = '#ef4444';
        } else if (!hasHighRisk && colors[i] === '#ef4444') {
          colors[i] = '#0ea5e9';
        }

        ctx.fillStyle = colors[i];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', setDimensions);
      cancelAnimationFrame(animationFrameId);
    };
  }, [packets]);

  return (
    <div className="w-full h-full absolute inset-0 bg-[var(--ts-panel)] dark:bg-black overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--ts-panel)] dark:to-black pointer-events-none z-10" />
      <canvas ref={canvasRef} className="block w-full h-full opacity-80" />
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none text-right">
        <h3 className="font-bold text-ts-cyan text-sm tracking-widest uppercase">
          Flow Waterfall
        </h3>
        <p className="text-[10px] text-ts-text-muted mt-1">Deep Packet Inspection</p>
      </div>
    </div>
  );
};

export default NetworkWaterfall;
