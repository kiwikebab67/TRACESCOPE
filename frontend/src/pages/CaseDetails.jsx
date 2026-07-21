import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ShieldAlert, FileText, Activity, AlertTriangle, ShieldCheck, Search, Loader, Server, Terminal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CaseDetails = () => {
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [threatIntel, setThreatIntel] = useState(null);

  useEffect(() => {
    fetchCaseDetails();
    fetchThreatIntel();
  }, [caseId]);

  const fetchCaseDetails = async () => {
    try {
      const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
      const response = await axios.get(`${baseUrl}/api/cases/${caseId}`);
      setCaseData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch case details:', error);
      setLoading(false);
    }
  };

  const fetchThreatIntel = async () => {
    try {
      const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
      const response = await axios.get(`${baseUrl}/api/threat-intel/${caseId}`);
      if (response.data.status === 'success') {
        setThreatIntel(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch threat intel:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center text-ts-blue">
          <Loader className="w-8 h-8 animate-spin mb-4" />
          <p className="font-semibold text-sm">Parsing Forensic Artifacts...</p>
        </div>
      </div>
    );
  }

  if (!caseData || !caseData.case) {
    return <div>Case not found.</div>;
  }

  // Calculate Risk Metrics
  const highRiskCount = caseData.analysis_results.filter(log => log.risk_level === 'High').length;
  const mediumRiskCount = caseData.analysis_results.filter(log => log.risk_level === 'Medium').length;
  const totalEvents = caseData.analysis_results.length;

  const chartData = [
    { name: 'High Risk', value: highRiskCount, color: '#ef4444' },
    { name: 'Medium Risk', value: mediumRiskCount, color: '#f59e0b' },
    { name: 'Low Risk', value: totalEvents - highRiskCount - mediumRiskCount, color: '#3b82f6' }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/investigations" className="p-2 bg-white rounded-lg border border-ts-border hover:bg-gray-50 text-ts-text">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ts-text flex items-center gap-2">
              {caseData.case.case_number} 
              <span className="text-sm font-normal text-ts-text-muted bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                {caseData.case.investigator}
              </span>
            </h1>
            <p className="text-sm text-ts-text-muted mt-1">{caseData.case.title}</p>
          </div>
        </div>
        <button 
          onClick={() => window.open(`/api/cases/${caseId}/report`, '_blank')}
          className="btn-primary py-2 px-4 flex items-center gap-2 bg-gradient-to-r from-[var(--ts-blue)] to-[var(--ts-purple)]"
        >
          <FileText className="w-4 h-4" /> Generate Case Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Threat Intelligence Panel */}
        <div className="glass-panel p-5 flex flex-col">
          <h3 className="font-bold text-ts-text mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-ts-blue" /> Threat Intelligence
          </h3>
          
          {threatIntel ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <div className="relative mb-4">
                <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center
                  ${threatIntel.malicious > 0 ? 'border-red-500 bg-red-50 text-red-600' : 'border-green-500 bg-green-50 text-green-600'}`}>
                  <div>
                    <div className="text-3xl font-black">{threatIntel.malicious}</div>
                    <div className="text-xs font-bold uppercase">Malicious</div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-ts-text-muted mb-2">VirusTotal analysis complete.</p>
              <div className="flex gap-4 text-xs font-medium w-full justify-center">
                <span className="text-yellow-600">{threatIntel.suspicious} Suspicious</span>
                <span className="text-green-600">{threatIntel.undetected} Undetected</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-ts-text-muted opacity-50 py-10">
              <ShieldCheck className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No external intel available</p>
              <p className="text-xs text-center px-4 mt-2">Upload a malicious sample to trigger VirusTotal analysis.</p>
            </div>
          )}
        </div>

        {/* Evidence Summary Panel */}
        <div className="glass-panel p-5 col-span-2">
          <h3 className="font-bold text-ts-text mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-ts-blue" /> Ingested Artifacts
          </h3>
          
          {caseData.evidence.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-ts-text-muted uppercase border-b border-ts-border">
                  <tr>
                    <th className="pb-2 font-semibold">Filename</th>
                    <th className="pb-2 font-semibold">SHA-256 Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {caseData.evidence.map(ev => (
                    <tr key={ev.id}>
                      <td className="py-3 font-medium text-ts-text">{ev.filename}</td>
                      <td className="py-3 text-ts-text-muted font-mono text-xs">{ev.hash_sha256}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-ts-text-muted text-sm py-10 border border-dashed border-gray-200 rounded-lg bg-gray-50/50 mt-2">
              No artifacts ingested yet.
            </div>
          )}
        </div>
      </div>

      {/* Forensic Log Triage */}
      <div className="glass-panel overflow-hidden flex flex-col">
        <div className="p-4 border-b border-ts-border flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-ts-text flex items-center gap-2">
            <Activity className="w-4 h-4 text-ts-blue" /> Forensic Pipeline Output
          </h3>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search signatures..." 
              className="w-full bg-white border border-ts-border rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-ts-blue"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase text-ts-text-muted font-semibold">
              <tr>
                <th className="px-5 py-3 border-b border-ts-border">Risk</th>
                <th className="px-5 py-3 border-b border-ts-border">Tool Source</th>
                <th className="px-5 py-3 border-b border-ts-border">Finding / Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ts-border">
              {caseData.analysis_results.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap">
                    {log.risk_level === 'High' && (
                      <span className="badge bg-red-100 text-red-700 border border-red-200">
                        <AlertTriangle className="w-3 h-3 mr-1 inline" /> High
                      </span>
                    )}
                    {log.risk_level === 'Medium' && (
                      <span className="badge bg-orange-100 text-orange-700 border border-orange-200">
                        Medium
                      </span>
                    )}
                    {log.risk_level === 'Low' && (
                      <span className="badge bg-blue-50 text-blue-600 border border-blue-100">
                        Low
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-medium text-ts-text uppercase text-xs tracking-wider">
                    {log.tool_source}
                  </td>
                  <td className="px-5 py-3 text-ts-text font-mono text-xs break-all">
                    {log.description}
                  </td>
                </tr>
              ))}
              {caseData.analysis_results.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-5 py-10 text-center text-ts-text-muted">
                    No threats or forensic signatures detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
