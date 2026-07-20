import React, { useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from 'react-simple-maps';
import clsx from 'clsx';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Simulated attack nodes
const generateNodes = () => [
  { markerOffset: -15, name: "Moscow", coordinates: [37.6173, 55.7558], size: Math.random() * 8 + 4 },
  { markerOffset: -15, name: "Beijing", coordinates: [116.4074, 39.9042], size: Math.random() * 8 + 4 },
  { markerOffset: -15, name: "San Francisco", coordinates: [-122.4194, 37.7749], size: Math.random() * 8 + 4 },
  { markerOffset: 15, name: "London", coordinates: [-0.1276, 51.5072], size: Math.random() * 6 + 3 },
  { markerOffset: 15, name: "Pyongyang", coordinates: [125.7625, 39.0194], size: Math.random() * 8 + 5 },
  { markerOffset: -15, name: "Tehran", coordinates: [51.3890, 35.6892], size: Math.random() * 7 + 3 },
  { markerOffset: 15, name: "St. Petersburg", coordinates: [30.3141, 59.9386], size: Math.random() * 6 + 2 },
];

const ThreatMap = () => {
  const [nodes, setNodes] = useState(generateNodes());

  // Simulate real-time data changing
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(generateNodes());
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-[400px] relative overflow-hidden bg-[var(--ts-panel)] rounded-xl border border-[var(--ts-border)] shadow-sm">
      {/* Overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--ts-bg)]/20 pointer-events-none z-10" />
      
      {/* Title */}
      <div className="absolute top-4 left-4 z-20">
        <h2 className="text-sm font-bold text-[var(--ts-text)] uppercase tracking-wider flex items-center gap-2">
          Global Threat Telemetry
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--ts-purple)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--ts-purple)]"></span>
          </span>
        </h2>
        <p className="text-xs text-ts-text-muted">Real-time IP origin plotting</p>
      </div>

      <ComposableMap
        projectionConfig={{
          scale: 140,
          rotation: [-11, 0, 0],
        }}
        width={800}
        height={400}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="var(--ts-border)"
                stroke="var(--ts-panel)"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "var(--ts-text-muted)", outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>
        
        {nodes.map(({ name, coordinates, markerOffset, size }) => (
          <Marker key={name} coordinates={coordinates}>
            {/* Animated pulse ring */}
            <circle 
              r={size * 2.5} 
              fill="none" 
              stroke="var(--ts-purple)" 
              strokeWidth="1" 
              className="animate-ping origin-center opacity-50"
            />
            {/* Core dot */}
            <circle 
              r={size} 
              fill="var(--ts-purple)" 
              className="drop-shadow-[0_0_8px_var(--ts-glow-magenta)]"
            />
            <text
              textAnchor="middle"
              y={markerOffset}
              style={{ fontFamily: "monospace", fill: "var(--ts-text-muted)", fontSize: "10px", fontWeight: "bold" }}
            >
              {name}
            </text>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
};

export default ThreatMap;
