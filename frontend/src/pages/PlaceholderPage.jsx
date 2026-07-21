import React from 'react';
import { Lock, Construction, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlaceholderPage = ({ moduleName, description, expectedRelease }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
      <div className="glass-panel max-w-lg w-full p-10 text-center flex flex-col items-center shadow-lg border border-ts-border/50">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner mb-6 relative overflow-hidden">
           <Construction className="w-10 h-10 text-ts-text-muted" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
        </div>
        
        <h1 className="text-2xl font-bold text-ts-text mb-2 flex items-center gap-2">
          {moduleName} <Lock className="w-5 h-5 text-ts-purple" />
        </h1>
        
        <p className="text-sm text-ts-text-muted mb-6 px-4">
          {description || "This premium forensic module is currently in active development or requires a higher tier license."}
        </p>

        <div className="bg-ts-blue/5 border border-ts-blue/20 rounded-lg p-4 w-full mb-8">
          <p className="text-xs font-semibold text-ts-blue uppercase tracking-wider mb-1">Status</p>
          <p className="text-sm text-ts-text font-medium">{expectedRelease || "Scheduled for v3.1"}</p>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="btn-primary w-full justify-center gap-2"
        >
          Return to Command Center <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PlaceholderPage;
