import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { UploadCloud, File, AlertCircle, CheckCircle2, X } from 'lucide-react';

const FileUpload = ({ caseId, onUploadComplete, onClose }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    setError('');
    setSuccess('');
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/octet-stream': ['.raw', '.dmp', '.mem', '.bin', '.exe', '.dll', '.sys'],
      'application/vnd.tcpdump.pcap': ['.pcap', '.cap'],
      'text/xml': ['.evtx'],
      'text/plain': ['.txt', '.log']
    }
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError('');
    
    const formData = new FormData();
    formData.append('evidence_file', file);

    try {
      // Allow dynamic switching based on deployment (Vite proxy/local vs built static API)
      const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
      
      const response = await axios.post(`${baseUrl}/api/cases/${caseId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        },
      });

      setSuccess(`File processed successfully. Artifacts parsed.`);
      setUploading(false);
      
      setTimeout(() => {
        if (onUploadComplete) onUploadComplete(response.data);
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading and processing file.');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl shadow-premium w-full max-w-lg overflow-hidden border border-ts-border relative">
        <div className="flex justify-between items-center p-4 border-b border-ts-border bg-gray-50/50">
          <h3 className="font-bold text-ts-text">Ingest Evidence</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!file ? (
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-ts-blue bg-blue-50' : 'border-gray-300 hover:border-ts-blue hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-ts-blue/10 flex items-center justify-center text-ts-blue">
                  <UploadCloud className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-medium text-ts-text">
                {isDragActive ? "Drop the file here..." : "Drag & drop an artifact, or click to select"}
              </p>
              <p className="text-xs text-ts-text-muted mt-2">
                Supported: .raw, .pcap, .evtx, .exe, .dll, .txt
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-ts-blue">
                  <File className="w-8 h-8" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="text-sm font-semibold text-ts-text truncate" title={file.name}>{file.name}</h4>
                  <p className="text-xs text-ts-text-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  
                  {uploading && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ts-text-muted font-medium">Processing...</span>
                        <span className="text-ts-blue font-bold">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-ts-blue h-1.5 rounded-full transition-all duration-300 ease-out" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                {!uploading && (
                  <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2 border border-green-100">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
              <span className="font-medium">{success}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-ts-border bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={uploading}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="btn-primary disabled:opacity-50"
          >
            {uploading ? 'Processing Artifact...' : 'Ingest to Pipeline'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
