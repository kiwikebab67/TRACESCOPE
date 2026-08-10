import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("UI Crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-slate-200">
          <div className="max-w-2xl w-full bg-slate-900 border border-rose-500/30 rounded-xl p-8 shadow-[0_0_50px_rgba(244,63,94,0.1)] relative overflow-hidden">
            {/* Background warning grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(to right, #f43f5e 1px, transparent 1px), linear-gradient(to bottom, #f43f5e 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-2 tracking-wide uppercase">
                Cybernetic System Fault
              </h1>
              <p className="text-slate-400 mb-8 max-w-lg">
                The TraceScope UI encountered an unhandled exception. The error boundary has successfully contained the crash to prevent data corruption.
              </p>
              
              <div className="w-full bg-[#0b0f19] border border-slate-800 rounded-lg p-4 mb-8 text-left overflow-auto max-h-48 font-mono text-xs custom-scrollbar">
                <div className="text-rose-400 font-bold mb-2">{this.state.error && this.state.error.toString()}</div>
                <div className="text-slate-500 whitespace-pre-wrap">
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </div>
              </div>
              
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reboot Subsystem
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
