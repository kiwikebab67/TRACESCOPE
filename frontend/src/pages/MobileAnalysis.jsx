import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Radio, Activity, ShieldAlert, Cpu, HardDrive, Wifi, Link, Info, FileCode2, Code, ShieldCheck } from 'lucide-react';
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

  const [rootFile, setRootFile] = useState(null);
  const [isRootLoading, setIsRootLoading] = useState(false);
  const [rootResult, setRootResult] = useState(null);
  const [rootError, setRootError] = useState(null);

  const [apkFile, setApkFile] = useState(null);
  const [isApkLoading, setIsApkLoading] = useState(false);
  const [apkResult, setApkResult] = useState(null);
  const [apkError, setApkError] = useState(null);
  
  // Decompiler states
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [decompiledCode, setDecompiledCode] = useState('');
  const [isDecompilingMethod, setIsDecompilingMethod] = useState(false);
  const [apkActiveTab, setApkActiveTab] = useState('manifest');
  
  useEffect(() => {
    const caseId = localStorage.getItem('activeCaseId');
    if (caseId) setActiveCaseId(caseId);
  }, []);

  useEffect(() => {
    const handleCaseChange = () => {
      const caseId = localStorage.getItem('activeCaseId');
      setActiveCaseId(caseId || null);
    };
    window.addEventListener('caseChanged', handleCaseChange);
    return () => window.removeEventListener('caseChanged', handleCaseChange);
  }, []);

  const handleImeiSubmit = async (e) => {
    e.preventDefault();
    setIsImeiLoading(true);
    setImeiError(null);
    setImeiResult(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      const res = await axios.post(`${baseUrl}/api/mobile/imei`, { imei });
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
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      const res = await axios.post(`${baseUrl}/api/mobile/bluetooth`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBtResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBtLoading(false);
    }
  };

  const handleRootUpload = async (e) => {
    e.preventDefault();
    if (!rootFile) return;
    setIsRootLoading(true);
    setRootError(null);
    setRootResult(null);
    const formData = new FormData();
    formData.append('file', rootFile);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      const res = await axios.post(`${baseUrl}/api/mobile/root`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setRootResult(res.data.result);
    } catch (err) {
      setRootError(err.response?.data?.message || 'Error processing build.prop');
    } finally {
      setIsRootLoading(false);
    }
  };

  const handleApkUpload = async (e) => {
    e.preventDefault();
    if (!apkFile) return;
    setIsApkLoading(true);
    setApkError(null);
    setApkResult(null);
    setSelectedClass(null);
    setSelectedMethod(null);
    setDecompiledCode('');
    setApkActiveTab('manifest');
    const formData = new FormData();
    formData.append('file', apkFile);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      const res = await axios.post(`${baseUrl}/api/mobile/apk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'error') {
        setApkError(res.data.message);
      } else {
        setApkResult(res.data);
      }
    } catch (err) {
      setApkError(err.response?.data?.message || 'Error parsing APK file');
    } finally {
      setIsApkLoading(false);
    }
  };

  const handleMethodDecompile = async (className, methodName) => {
    if (!apkResult?.temp_filepath) return;
    
    setSelectedClass(className);
    setSelectedMethod(methodName);
    setIsDecompilingMethod(true);
    setDecompiledCode('');
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      const res = await axios.post(`${baseUrl}/api/mobile/apk/decompile-method`, {
        filepath: apkResult.temp_filepath,
        class_name: className,
        method_name: methodName
      });
      if (res.data.status === 'success') {
        setDecompiledCode(res.data.decompiled_code);
      } else {
        setDecompiledCode(`// Decompilation failed: ${res.data.message}`);
      }
    } catch (err) {
      setDecompiledCode(`// Decompilation error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsDecompilingMethod(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans animate-fade-in text-slate-800 dark:text-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-indigo-500" />
            Mobile & Wireless Forensics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Analyze Mobile Telemetry, Root Integrations, and APK Manifests.
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

      {/* Row 1: IMEI and Bluetooth */}
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
              Upload a raw <code className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded">btsnoop_hci.log</code>. The engine will carve the binary payload to extract all paired and proximate MAC addresses.
            </p>
            
            <form onSubmit={handleBtUpload} className="mb-6 flex gap-3">
              <input
                type="file"
                className="flex-1 block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-900/30 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
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
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
      
      {/* Row 2: APK Analyzer and Root Detection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ROOT DETECTION MODULE */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Root Integrity Scanner</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Upload a device <code className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded">build.prop</code> file. The engine will scan for compromised system properties, test-keys, and insecure ADB configurations indicative of Root or custom ROMs.
            </p>
            
            <form onSubmit={handleRootUpload} className="mb-6 flex gap-3">
              <input
                type="file"
                className="flex-1 block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-900/30 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
                onChange={(e) => setRootFile(e.target.files[0])}
                accept=".prop,.txt"
              />
              <button
                type="submit"
                disabled={!rootFile || isRootLoading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                {isRootLoading ? 'Scanning...' : 'Scan Integrity'}
              </button>
            </form>

            {rootError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800 text-sm mb-4">
                {rootError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-[200px]">
              {rootResult && (
                <div className="animate-fade-in space-y-4">
                  {/* Integrity Score */}
                  <div className={`p-4 rounded-lg flex items-center justify-between ${rootResult.integrity_score < 100 ? 'bg-rose-500/10 border border-rose-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'}`}>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">System Integrity Score</p>
                      <h3 className={`text-3xl font-bold ${rootResult.integrity_score < 100 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {rootResult.integrity_score} / 100
                      </h3>
                    </div>
                    {rootResult.is_rooted ? (
                      <div className="px-3 py-1 bg-rose-500 text-white rounded-full text-sm font-bold shadow-[0_0_15px_rgba(244,63,94,0.5)]">
                        ROOTED
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                        SECURE
                      </div>
                    )}
                  </div>
                  
                  {/* Findings */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Detailed Findings</h4>
                    {rootResult.findings.map((finding, idx) => (
                      <div key={idx} className={`p-3 rounded border text-sm ${finding.risk === 'High' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' : finding.risk === 'Medium' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                        <div className="font-mono font-semibold mb-1 flex items-center justify-between">
                          <span className={finding.risk === 'High' ? 'text-rose-700 dark:text-rose-400' : finding.risk === 'Medium' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}>
                            {finding.indicator}
                          </span>
                          <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${finding.risk === 'High' ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400' : finding.risk === 'Medium' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                            {finding.risk}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">{finding.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* APK STATIC ANALYZER */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-indigo-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">APK Static Analyzer</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Upload an <code className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded">.apk</code> file. The engine decodes the binary AndroidManifest.xml and highlights malicious and highly-abused permissions.
            </p>
            
            <form onSubmit={handleApkUpload} className="mb-6 flex gap-3">
              <input
                type="file"
                className="flex-1 block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-900/30 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
                onChange={(e) => setApkFile(e.target.files[0])}
                accept=".apk"
              />
              <button
                type="submit"
                disabled={!apkFile || isApkLoading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                {isApkLoading ? 'Unpacking...' : 'Decompile'}
              </button>
            </form>

            {apkError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800 text-sm mb-4">
                {apkError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[200px]">
              {apkResult && (
                <div className="animate-fade-in flex flex-col h-full">
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{apkResult.app_name}</h3>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">{apkResult.package_name}</p>
                    </div>
                    <div className={`px-3 py-1 rounded text-xs font-bold border ${apkResult.overall_risk === 'CRITICAL' ? 'bg-rose-900 text-rose-200 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : apkResult.overall_risk === 'High' ? 'bg-orange-900 text-orange-200 border-orange-500' : 'bg-emerald-900 text-emerald-200 border-emerald-500'}`}>
                      RISK: {apkResult.overall_risk}
                    </div>
                  </div>
                  
                  {/* Tab Selector */}
                  <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700/50 mb-4 shrink-0 font-mono text-xs">
                    <button 
                      type="button"
                      onClick={() => setApkActiveTab('manifest')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${apkActiveTab === 'manifest' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      Manifest & Risk
                    </button>
                    <button 
                      type="button"
                      onClick={() => setApkActiveTab('decompiler')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${apkActiveTab === 'decompiler' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      DEX Decompiler
                    </button>
                    <button 
                      type="button"
                      onClick={() => setApkActiveTab('strings')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${apkActiveTab === 'strings' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      IOC Strings ({apkResult.sensitive_strings?.length || 0})
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="flex-1">
                    {apkActiveTab === 'manifest' && (
                      <div className="space-y-4">
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-700/30">
                          <Activity className="w-4 h-4 text-indigo-500" />
                          {apkResult.risk_summary}
                        </div>

                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Requested Permissions</h4>
                        <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {apkResult.permissions.map((p, idx) => (
                            <div key={idx} className={`p-2 rounded text-xs font-mono flex items-center justify-between ${p.risk_level === 'CRITICAL' || p.risk_level === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800'}`}>
                              <span>{p.permission.replace('android.permission.', '')}</span>
                              {(p.risk_level === 'CRITICAL' || p.risk_level === 'High') && (
                                <ShieldAlert className="w-3 h-3 text-rose-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {apkActiveTab === 'decompiler' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[350px] overflow-hidden">
                        {/* Classes list */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20 font-mono text-[11px] max-h-full custom-scrollbar">
                          <h4 className="font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider mb-3">Dex Classes</h4>
                          {apkResult.classes && Object.keys(apkResult.classes).length > 0 ? (
                            Object.entries(apkResult.classes).map(([className, classInfo]) => (
                              <div key={className} className="mb-4">
                                <div className="font-bold text-indigo-500 dark:text-indigo-400 truncate" title={className}>
                                  {className.split('/').pop().replace(';', '')}
                                </div>
                                <div className="pl-3 mt-1 space-y-1">
                                  {classInfo.methods.map((method) => (
                                    <div 
                                      key={method.name}
                                      onClick={() => handleMethodDecompile(className, method.name)}
                                      className={`cursor-pointer hover:text-cyan-500 py-0.5 truncate flex items-center gap-1.5 ${selectedClass === className && selectedMethod === method.name ? 'text-cyan-500 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
                                    >
                                      <Code className="w-3 h-3 shrink-0" />
                                      <span>{method.name}()</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500 italic">No classes found in classes.dex.</div>
                          )}
                        </div>

                        {/* Decompile View */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col bg-[#020617] text-slate-300 font-mono text-[11px] max-h-full">
                          <div className="p-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-[10px] text-slate-400 shrink-0">
                            <span className="truncate">{selectedMethod ? `${selectedMethod}()` : 'Decompiled Source'}</span>
                            <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold shrink-0">java-pseudocode</span>
                          </div>
                          <div className="p-4 flex-1 overflow-y-auto whitespace-pre custom-scrollbar">
                            {isDecompilingMethod ? (
                              <span className="text-cyan-400 animate-pulse">Decompiling bytecode...</span>
                            ) : decompiledCode ? (
                              <code>{decompiledCode}</code>
                            ) : (
                              <span className="text-slate-600">// Select a method on the left to decompile Dalvik instructions</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {apkActiveTab === 'strings' && (
                      <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar">
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400 font-mono">
                          <span className="font-bold">Total DEX Strings:</span> {apkResult.raw_strings_count} | Crawled indicators (URLs, IPs, Credentials):
                        </div>
                        <div className="space-y-1.5">
                          {apkResult.sensitive_strings && apkResult.sensitive_strings.length > 0 ? (
                            apkResult.sensitive_strings.map((str, idx) => (
                              <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded font-mono text-xs break-all text-rose-500 dark:text-rose-400">
                                {str}
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500 italic text-center py-6 text-xs">No sensitive strings carved from classes.dex string pool.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
