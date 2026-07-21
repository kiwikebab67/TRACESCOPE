import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Briefcase, 
  Plus,
  Search,
  ChevronRight,
  UploadCloud,
  FileBox,
  Upload
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FileUpload from '../components/FileUpload';

const Investigations = () => {
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState('');
  const [activeUploadCaseId, setActiveUploadCaseId] = useState(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
      const response = await axios.get(`${baseUrl}/api/cases`);
      setCases(response.data);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    }
  };

  const handleInitializeCase = async () => {
    try {
      const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
      await axios.post(`${baseUrl}/api/cases`, {
        case_number: `CASE-${Math.floor(Math.random() * 10000)}`,
        title: "New Investigation",
        investigator: "Admin",
        description: "Auto-generated case room"
      });
      fetchCases();
    } catch (error) {
      console.error('Failed to initialize case:', error);
    }
  };

  const handleUploadComplete = () => {
    setActiveUploadCaseId(null);
    fetchCases(); // Refresh list to show new artifact count
  };

  const filteredCases = cases.filter(c => 
    c.case_number.toLowerCase().includes(search.toLowerCase()) || 
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-ts-text">Investigations</h1>
          <p className="text-sm text-ts-text-muted mt-1">Manage active case rooms and evidence ingestion.</p>
        </div>
        <button className="btn-primary" onClick={handleInitializeCase}>
          <Plus className="w-4 h-4" /> Initialize Case
        </button>
      </div>

      <div className="glass-panel overflow-hidden flex flex-col">
        <div className="p-4 border-b border-ts-border flex justify-between items-center bg-gray-50/50">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search cases..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-ts-border rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-ts-blue"
            />
          </div>
          <div className="text-sm text-ts-text-muted font-medium">
            Showing {filteredCases.length} cases
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase text-ts-text-muted font-semibold">
              <tr>
                <th className="px-5 py-3 border-b border-ts-border">Case ID</th>
                <th className="px-5 py-3 border-b border-ts-border">Title / Objective</th>
                <th className="px-5 py-3 border-b border-ts-border">Lead Investigator</th>
                <th className="px-5 py-3 border-b border-ts-border">Artifacts</th>
                <th className="px-5 py-3 border-b border-ts-border">Created</th>
                <th className="px-5 py-3 border-b border-ts-border text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ts-border">
              {filteredCases.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-bold text-ts-blue whitespace-nowrap">{c.case_number}</td>
                  <td className="px-5 py-4 font-medium text-ts-text">{c.title}</td>
                  <td className="px-5 py-4 text-ts-text-muted">{c.investigator}</td>
                  <td className="px-5 py-4">
                    <span className="badge bg-ts-blue/10 text-ts-blue">
                      <FileBox className="w-3 h-3 mr-1 inline" /> {c.evidence_count} items
                    </span>
                  </td>
                  <td className="px-5 py-4 text-ts-text-muted text-xs">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setActiveUploadCaseId(c.id)}
                        className="btn-secondary py-1 px-3 text-xs border-ts-blue text-ts-blue hover:bg-blue-50"
                      >
                        <Upload className="w-3 h-3 mr-1" /> Upload
                      </button>
                      <Link to={`/investigations/${c.id}`} className="btn-secondary py-1 px-3 text-xs bg-ts-blue text-white border-transparent hover:bg-blue-600 hover:text-white">
                        Triage <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-ts-text-muted">
                    No investigations found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {activeUploadCaseId && (
        <FileUpload 
          caseId={activeUploadCaseId} 
          onClose={() => setActiveUploadCaseId(null)} 
          onUploadComplete={handleUploadComplete} 
        />
      )}
    </div>
  );
};

export default Investigations;
