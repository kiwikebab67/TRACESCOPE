import React, { useState } from 'react';
import { Wallet, ShieldAlert, Upload, Cpu, Search, Activity, FileDigit, Link2 } from 'lucide-react';
import axios from 'axios';

const Web3Forensics = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [artifacts, setArtifacts] = useState([]);
  const [error, setError] = useState('');
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleScan = async () => {
    if (!file) return;
    
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('/api/web3/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setArtifacts(response.data.artifacts || []);
    } catch (err) {
      console.error(err);
      setError('Failed to scan file for Web3 artifacts. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-[var(--ts-blue)]/20 border border-[var(--ts-blue)] flex items-center justify-center text-[var(--ts-blue)] shadow-[0_0_15px_var(--ts-glow)]">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[var(--ts-text)] tracking-wider">WEB3 <span className="text-[var(--ts-blue)]">FORENSICS</span></h1>
              <p className="text-ts-text-muted font-medium mt-1">
                Deep-scan memory dumps and drives for Cryptocurrency artifacts, BIP39 seed phrases, and Private Keys.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[var(--ts-panel)] border border-[var(--ts-border)] rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--ts-blue)] transition-all">
             <div className="absolute inset-0 bg-gradient-to-br from-[var(--ts-blue)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             
             <h2 className="text-xl font-bold text-[var(--ts-text)] mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[var(--ts-blue)]" />
                Ingest Artifact
             </h2>
             
             <div className="border-2 border-dashed border-[var(--ts-border)] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[var(--ts-blue)] hover:bg-[var(--ts-blue)]/5 transition-all relative">
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileDigit className="w-10 h-10 text-slate-500 mb-3 group-hover:text-[var(--ts-blue)] transition-colors" />
                <p className="text-sm font-medium text-slate-300">
                  {file ? file.name : "Drag & Drop Memory Dump / File"}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Supports RAW, TXT, MEM, EML
                </p>
             </div>
             
             {error && (
               <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                 {error}
               </div>
             )}
             
             <button 
               onClick={handleScan}
               disabled={!file || loading}
               className="w-full mt-6 bg-[var(--ts-blue)] hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_var(--ts-glow)] disabled:shadow-none"
             >
                {loading ? <Activity className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {loading ? "SCANNING SECTORS..." : "INITIATE DEEP SCAN"}
             </button>
          </div>
          
          {/* Engine Info */}
          <div className="bg-[var(--ts-panel)] border border-[var(--ts-border)] rounded-2xl p-6">
            <h3 className="text-sm font-black text-slate-400 tracking-widest uppercase mb-4">Detection Capabilities</h3>
            <ul className="space-y-3">
               <li className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-[var(--ts-blue)] shadow-[0_0_8px_var(--ts-glow)]" />
                  BIP39 Seed Phrase Extraction (12/24 words)
               </li>
               <li className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  EVM Private Key Identification (Hex)
               </li>
               <li className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                  Metamask Vault Discovery (JSON)
               </li>
            </ul>
          </div>
        </div>
        
        {/* Results Panel */}
        <div className="lg:col-span-2">
           <div className="bg-[var(--ts-panel)] border border-[var(--ts-border)] rounded-2xl h-full p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--ts-border)]">
                 <h2 className="text-xl font-bold text-[var(--ts-text)] flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-[var(--ts-blue)]" />
                    Cryptographic Artifacts Found
                 </h2>
                 <div className="bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700 text-xs font-mono text-slate-400">
                    COUNT: {artifacts.length.toString().padStart(3, '0')}
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                 {artifacts.length === 0 && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 py-12">
                       <Link2 className="w-16 h-16 opacity-20" />
                       <p className="font-mono text-sm uppercase tracking-widest">No Artifacts Detected</p>
                    </div>
                 )}
                 
                 {loading && (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--ts-blue)] space-y-4 py-12">
                       <Activity className="w-16 h-16 animate-pulse" />
                       <p className="font-mono text-sm uppercase tracking-widest animate-pulse">Running Heuristics...</p>
                    </div>
                 )}
                 
                 {!loading && artifacts.length > 0 && (
                    <div className="space-y-4">
                       {artifacts.map((art, idx) => (
                          <div key={idx} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 hover:border-slate-500 transition-colors">
                             <div className="flex justify-between items-start mb-2">
                                <span className={`text-xs font-black px-2 py-1 rounded uppercase tracking-wider ${
                                   art.threat === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                   'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                }`}>
                                   {art.type}
                                </span>
                                <ShieldAlert className={`w-4 h-4 ${art.threat === 'CRITICAL' ? 'text-rose-500' : 'text-orange-500'}`} />
                             </div>
                             
                             <p className="text-sm font-medium text-slate-300 mb-3">{art.description}</p>
                             
                             <div className="bg-black/50 rounded-lg p-3 border border-slate-800 font-mono text-sm text-[var(--ts-blue)] break-all relative group">
                                {art.value}
                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm rounded-lg text-white font-bold text-xs cursor-pointer">
                                   CLICK TO COPY
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Web3Forensics;
