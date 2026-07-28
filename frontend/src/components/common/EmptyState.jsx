import React from 'react';

const EmptyState = ({ icon: Icon, title, description }) => {
  return (
    <div className="glass-panel p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-[var(--ts-border)] opacity-80 mt-8">
      {Icon && <Icon className="w-16 h-16 text-ts-text-muted mb-4 drop-shadow-[0_0_10px_rgba(100,116,139,0.3)]" />}
      <h3 className="text-2xl font-bold text-[var(--ts-text)] mb-2 uppercase tracking-wide">{title}</h3>
      <p className="text-ts-text-muted max-w-md">
        {description}
      </p>
    </div>
  );
};

export default EmptyState;
