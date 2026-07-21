import React from 'react';
import { Lightbulb } from 'lucide-react';

const InfoBox = ({ title, description }) => {
  return (
    <div className="bg-[var(--ts-blue)]/10 border border-[var(--ts-blue)]/30 rounded-lg p-4 mb-6 flex items-start gap-4 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
      <div className="mt-1 shrink-0 bg-[var(--ts-blue)]/20 p-2 rounded-full text-[var(--ts-blue)]">
        <Lightbulb className="w-5 h-5" />
      </div>
      <div>
        <h4 className="font-bold text-[var(--ts-blue)] mb-1 text-sm uppercase tracking-wider">{title}</h4>
        <p className="text-ts-text-muted text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default InfoBox;
