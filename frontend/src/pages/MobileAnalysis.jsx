import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Radio, Activity, ShieldAlert, Cpu, HardDrive, Wifi, Link, Info } from 'lucide-react';
import axios from 'axios';

// A radar visualization for bluetooth MACs
const ProximityRadar = ({ devices }) => {
  return (
    <div className="relative w-full h-80 bg-[#020617] rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
      {/* Radar Background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full absolute opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at center, #0284c7 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          backgroundPosition: 'center center'
        }} />
        <div className="w-64 h-64 border border-cyan-500/20 rounded-full absolute" />
        <div className="w-48 h-48 border border-cyan-500/30 rounded-full absolute" />
        <div className="w-32 h-32 border border-cyan-500/40 rounded-full absolute" />
        
        {/* Radar Sweep */}
        <motion.div 
          className="absolute w-64 h-64 rounded-full border-r-2 border-cyan-400"
          style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(34, 211, 238, 0.2) 100%)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Central Hub (Victim Phone) */}
        <div className="absolute flex flex-col items-center justify-center z-10">
          <div className="bg-cyan-950 p-3 rounded-full border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            <Smartphone className="w-6 h-6 text-cyan-400" />
          </div>
          <span className="text-[10px] text-cyan-400 font-mono mt-2 bg-[#020617] px-1 absolute top-full">TARGET_DEVICE</span>
        </div>
      </div>
      
      {/* Plotted Devices */}
      {devices.map((dev, i) => {
        // Distribute them radially
        const angle = (i * (360 / Math.max(devices.length, 1))) * (Math.PI / 180);
        // Randomize radius between 50 and 120
        const radius = 60 + (i % 3) * 20; 
        
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <motion.div
            key={i}
            className="absolute z-20 flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.2 }}
            style={{ 
              x, y 
            }}
          >
            <div className="w-3 h-3 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.8)] border border-rose-300" />
            <div className="absolute top-4 flex flex-col items-center whitespace-nowrap bg-[#020617]/80 px-1 border border-slate-700/50 rounded">
              <span className="text-[9px] text-rose-400 font-mono">{dev.mac}</span>
              <span className="text-[8px] text-slate-400">{dev.vendor}</span>
            </div>
            
            {/* Connection Line */}
            <svg className="absolute pointer-events-none" style={{ width: radius * 2, height: radius * 2, left: -radius, top: -radius, zIndex: -1 }}>
               <line x1={radius} y1={radius} x2={radius - x} y2={radius - y} stroke="rgba(244,63,94,0.3)" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
};

export default function MobileAnalysis() {
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [imei, setImei] = useState('');
  const [imeiResult, setImeiResult] = useState(null);
  const [isImeiLoading, setIsImeiLoading] = useState(false);
  const [imeiError, setImeiError] = useState(null);
  
  const [file, setFile] = useState(null);
  const [isBtLoading, setIsBtLoading] = useState(false);
  const [btResult, setBtResult] = useState(null);
  
  useEffect(() => {
    const caseId = localStorage.getItem('activeCaseId');
    if (caseId) setActiveCaseId(caseId);
  }, []);

  const handleImeiSubmit = async (e) => {
    e.preventDefault();
    setIsImeiLoading(true);
    setImeiError(null);
    setImeiResult(null);
    try {
      const res = await axios.post('/api/mobile/imei', { imei });
      setImeiResult(res.data.result);
    } catch (err) {
      setImeiError(err.response?.data?.message || 'Error validating IMEI');
    } finally {
      setIsImeiLoading(false);
    }
  };

  const handleBtUpload = async (e) => {
    e.preventDefault();
    if (!file || !activeCaseId) return;
    
    setIsBtLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('case_id', activeCaseId);
    
    try {
      const res = await axios.post('/api/mobile/bluetooth', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBtResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBtLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans animate-fade-in text-slate-800 dark:text-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Radio className="w-8 h-8 text-indigo-500" />
            Mobile & Wireless Forensics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Cryptographic IMEI Validation & Authentic Bluetooth Proximity Analysis
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800 text-sm font-medium">
          <ShieldAlert className="w-4 h-4" />
          <span>Authentic Processing Active</span>
        </div>
      </div>

      {!activeCaseId && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-amber-700 dark:text-amber-400 flex items-center gap-3">
          <Info className="w-5 h-5" />
          <p>Please select an active investigation case from the Dashboard to log wireless telemetry.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* IMEI MODULE */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">IMEI Cryptographic Validator</h2>
          </div>
          <div className="p-6 flex-1">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Enter a 15-digit IMEI. The engine will mathematically validate the Luhn checksum and resolve the physical device model against a local TAC database.
            </p>
            
            <form onSubmit={handleImeiSubmit} className="flex gap-3 mb-6">
              <input
                type="text"
                placeholder="e.g. 352994110000000"
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                maxLength={15}
              />
              <button
                type="submit"
                disabled={isImeiLoading || imei.length !== 15}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {isImeiLoading ? 'Validating...' : 'Analyze'}
              </button>
            </form>

            {imeiError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800 text-sm">
                {imeiError}
              </div>
            )}

            <AnimatePresence mode="wait">
              {imeiResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className={`p-4 rounded-lg border flex items-start gap-4 ${imeiResult.is_valid ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'}`}>
                    <div className={`p-2 rounded-full ${imeiResult.is_valid ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'}`}>
                      {imeiResult.is_valid ? <ShieldAlert className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${imeiResult.is_valid ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                        {imeiResult.is_valid ? 'Authentic Checksum Validated' : 'Spoofing Detected'}
                      </h3>
                      <p className={`text-sm mt-1 ${imeiResult.is_valid ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                        {imeiResult.message}
                      </p>
                    </div>
                  </div>

                  {imeiResult.is_valid && imeiResult.device_info && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50">
                      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Resolved TAC Data</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">TAC (First 8 Digits)</p>
                          <p className="font-mono text-sm text-slate-900 dark:text-white mt-1">{imeiResult.tac}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Manufacturer</p>
                          <p className="font-medium text-sm text-slate-900 dark:text-white mt-1">{imeiResult.device_info.manufacturer}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500">Exact Model Identity</p>
                          <p className="font-medium text-lg text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            {imeiResult.device_info.model}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* BLUETOOTH MODULE */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-indigo-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Bluetooth HCI Snoop Analysis</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Upload a raw <code className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded">btsnoop_hci.log</code> or Android bugreport. The engine will carve the binary payload to extract all paired and proximate MAC addresses.
            </p>
            
            <form onSubmit={handleBtUpload} className="mb-6 flex gap-3">
              <input
                type="file"
                className="flex-1 block w-full text-sm text-slate-500 dark:text-slate-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  dark:file:bg-indigo-900/30 dark:file:text-indigo-400
                  hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50
                  border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
                onChange={(e) => setFile(e.target.files[0])}
                disabled={!activeCaseId}
              />
              <button
                type="submit"
                disabled={!file || isBtLoading || !activeCaseId}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                {isBtLoading ? 'Carving...' : 'Extract MACs'}
              </button>
            </form>

            <div className="flex-1 flex flex-col">
              {btResult ? (
                <div className="flex-1 flex flex-col gap-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <Link className="w-4 h-4 text-emerald-500" />
                      Proximity Radar
                    </h3>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                      {btResult.devices.length} Devices Found
                    </span>
                  </div>
                  
                  <ProximityRadar devices={btResult.devices} />
                  
                </div>
              ) : (
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center p-6 text-center">
                  <Radio className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Waiting for HCI Log</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">Upload a bluetooth trace file to visualize proximate devices</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
