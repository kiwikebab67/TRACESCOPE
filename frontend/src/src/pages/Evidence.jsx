import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldAlert, FileText, Database, Activity, FileKey, HardDrive, Download, Eye, Link } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';
import InfoBox from '../components/common/InfoBox';

const Evidence = () => {
  const [evidenceData, setEvidenceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtifact, setSelectedArtifact] = useState(null);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const response = await axios.get('/api/evidence');
        setEvidenceData(response.data);
      } catch (err) {
        console.error("Failed to fetch evidence:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, []);

  const getIconForFile = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['evtx', 'log', 'txt'].includes(ext)) return <FileText className="w-5 h-5 text-blue-400" />;
    if (['reg', 'dat'].includes(ext)) return <Database className="w-5 h-5 text-purple-400" />;
    if (['pcap', 'cap'].includes(ext)) return <Activity className="w-5 h-5 text-orange-400" />;
    if (['exe', 'dll', 'sys', 'bin'].includes(ext)) return <ShieldAlert className="w-5 h-5 text-red-500" />;
    if (['raw', 'mem', 'dmp'].includes(ext)) return <HardDrive className="w-5 h-5 text-pink-400" />;
    return <FileKey className="w-5 h-5 text-ts-text-muted" />;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredEvidence = evidenceData.filter(ev => 
    ev.filename.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ev.hash_sha256.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ev.case_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className="flex-1 flex flex-col gap-6 h-full">
        <InfoBox 
          title="What does this do?" 
          description="The Digital Evidence Locker is where you upload the raw files collected from a compromised system (like event logs, memory dumps, or network captures). Once uploaded, the backend engines will automatically dissect these files and populate the other dashboards with findings." 
        />
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
              <Database className="w-6 h-6 text-[var(--ts-blue)]" />
              Global Evidence Repository
            </h1>
            <p className="text-ts-text-muted text-sm mt-1">Centralized registry of all ingested forensic artifacts.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-ts-text-muted" />
              <input 
                type="text" 
                placeholder="Search hash or filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[var(--ts-panel)] border border-[var(--ts-border)] rounded-lg text-sm text-[var(--ts-text)] focus:outline-none focus:border-[var(--ts-blue)] transition-colors w-64"
              />
            </div>
            <button className="glass-panel px-4 py-2 flex items-center gap-2 text-sm font-medium hover:text-[var(--ts-blue)]">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="glass-panel flex flex-col overflow-hidden h-full">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--ts-border)] text-xs font-bold text-ts-text-muted uppercase tracking-wider bg-black/20 shrink-0">
            <div className="col-span-4">Artifact Name</div>
            <div className="col-span-2">Case Number</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-3">Ingested Time</div>
            <div className="col-span-1 text-center">Action</div>
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-ts-text-muted animate-pulse">Loading artifact repository...</div>
            ) : filteredEvidence.length === 0 ? (
              <div className="p-8 text-center text-ts-text-muted">No evidence artifacts found matching your search.</div>
            ) : (
              filteredEvidence.map(ev => (
                <div 
                  key={ev.id}
                  onClick={() => setSelectedArtifact(ev)}
                  className={clsx(
                    "grid grid-cols-12 gap-4 p-4 border-b border-[var(--ts-border)] items-center text-sm cursor-pointer transition-colors group",
                    selectedArtifact?.id === ev.id ? "bg-[var(--ts-blue)]/10" : "hover:bg-white/5"
                  )}
                >
                  <div className="col-span-4 flex items-center gap-3 truncate">
                    {getIconForFile(ev.filename)}
                    <span className="font-medium text-[var(--ts-text)] truncate">{ev.filename}</span>
                  </div>
                  <div className="col-span-2 font-mono text-xs text-[var(--ts-blue)]">{ev.case_number}</div>
                  <div className="col-span-2 text-ts-text-muted">{formatSize(ev.size)}</div>
                  <div className="col-span-3 text-ts-text-muted text-xs truncate">
                    {new Date(ev.date_added).toLocaleString()}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button className="p-1.5 rounded bg-[var(--ts-border)] text-ts-text-muted hover:text-[var(--ts-blue)] hover:bg-[var(--ts-blue)]/20 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedArtifact && (
        <div className="w-96 glass-panel flex flex-col shrink-0 animate-in slide-in-from-right-8 duration-300 h-full">
          <div className="p-5 border-b border-[var(--ts-border)] bg-black/20 shrink-0">
            <div className="flex items-start gap-3">
              <div className="mt-1">{getIconForFile(selectedArtifact.filename)}</div>
              <div>
                <h3 className="font-bold text-[var(--ts-text)] break-all">{selectedArtifact.filename}</h3>
                <span className="badge bg-[var(--ts-blue)]/20 text-[var(--ts-blue)] border border-[var(--ts-blue)]/30 mt-2">
                  CASE: {selectedArtifact.case_number}
                </span>
              </div>
            </div>
          </div>
          <div className="p-5 flex flex-col gap-6 overflow-y-auto flex-1">
            <div>
              <label className="text-xs font-bold text-ts-text-muted uppercase tracking-wider mb-1 flex items-center gap-2">
                <Link className="w-3 h-3" /> Chain of Custody
              </label>
              <div className="text-sm bg-black/20 p-3 rounded border border-[var(--ts-border)]">
                <div className="flex justify-between mb-2">
                  <span className="text-ts-text-muted">Acquired</span>
                  <span className="text-[var(--ts-text)]">{new Date(selectedArtifact.date_added).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ts-text-muted">Agent</span>
                  <span className="text-[var(--ts-text)]">System Auto</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-ts-text-muted uppercase tracking-wider mb-1">Cryptographic Hashes</label>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-ts-text-muted">SHA-256</span>
                  <div className="font-mono text-xs break-all bg-black/30 p-2 rounded text-[var(--ts-pink)] border border-[var(--ts-border)]">
                    {selectedArtifact.hash_sha256}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-ts-text-muted">MD5</span>
                  <div className="font-mono text-xs break-all bg-black/30 p-2 rounded text-[var(--ts-blue)] border border-[var(--ts-border)]">
                    {selectedArtifact.hash_md5}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-auto pt-4 flex flex-col gap-3">
              <button className="btn-primary w-full justify-center">
                <Download className="w-4 h-4" /> Download Artifact
              </button>
              {['exe', 'dll'].includes(selectedArtifact.filename.split('.').pop().toLowerCase()) && (
                <button className="w-full justify-center py-2 px-4 rounded-lg border border-[var(--ts-purple)] text-[var(--ts-purple)] hover:bg-[var(--ts-purple)]/10 transition-colors font-medium text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Analyze in Malware Sandbox
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Evidence;
