import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

const CaseModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    case_number: `CASE-${Math.floor(Math.random() * 10000)}`,
    title: '',
    investigator: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        case_number: initialData.case_number || '',
        title: initialData.title || '',
        investigator: initialData.investigator || '',
        description: initialData.description || ''
      });
    } else {
      setFormData({
        case_number: `CASE-${Math.floor(Math.random() * 10000)}`,
        title: '',
        investigator: '',
        description: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.title || !formData.investigator) {
      setError('Title and Investigator are required fields.');
      setLoading(false);
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save case.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-ts-bg-dark border border-[var(--ts-border)] rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.15)] w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-[var(--ts-border)] bg-black/40">
          <h3 className="font-bold text-white text-lg">
            {initialData ? 'Edit Case Details' : 'Initialize New Investigation'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ts-text-muted mb-1">Case Number</label>
              <input 
                type="text" 
                value={formData.case_number}
                onChange={(e) => setFormData({...formData, case_number: e.target.value})}
                className="w-full bg-black/50 border border-[var(--ts-border)] rounded p-2 text-white focus:outline-none focus:border-ts-cyan focus:ring-1 focus:ring-ts-cyan transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ts-text-muted mb-1">Investigation Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Operation Phantom Strike"
                className="w-full bg-black/50 border border-[var(--ts-border)] rounded p-2 text-white focus:outline-none focus:border-ts-cyan focus:ring-1 focus:ring-ts-cyan transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ts-text-muted mb-1">Lead Investigator</label>
              <input 
                type="text" 
                value={formData.investigator}
                onChange={(e) => setFormData({...formData, investigator: e.target.value})}
                className="w-full bg-black/50 border border-[var(--ts-border)] rounded p-2 text-white focus:outline-none focus:border-ts-cyan focus:ring-1 focus:ring-ts-cyan transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ts-text-muted mb-1">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
                className="w-full bg-black/50 border border-[var(--ts-border)] rounded p-2 text-white focus:outline-none focus:border-ts-cyan focus:ring-1 focus:ring-ts-cyan transition-all resize-none"
              ></textarea>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[var(--ts-border)]">
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-[var(--ts-border)] text-gray-300 rounded hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[var(--ts-cyan)]/20 text-[var(--ts-cyan)] border border-[var(--ts-cyan)]/50 rounded hover:bg-[var(--ts-cyan)] hover:text-black font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaseModal;
