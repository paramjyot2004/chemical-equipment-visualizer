
import React, { useRef, useState } from 'react';
import { uploadCsv, downloadReport } from '../services/api';

interface UploadSectionProps {
  onUploadSuccess: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onUploadSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // ✅ ADD THIS PART (CSV VALIDATION)
  if (!file.name.toLowerCase().endsWith(".csv")) {
    setStatus({ type: "error", message: "Please upload a valid CSV file." });
    if (fileInputRef.current) fileInputRef.current.value = "";
    return;
  }
  // ✅ END OF ADDITION

  setIsUploading(true);
  setStatus(null);

  try {
    await uploadCsv(file);
    setStatus({ type: 'success', message: 'Synchronization Complete.' });
    onUploadSuccess();
    if (fileInputRef.current) fileInputRef.current.value = '';
  } catch (err: any) {
    const errorMsg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      'Upload failed.';
    setStatus({ type: 'error', message: errorMsg });
  } finally {
    setIsUploading(false);
  }
};


  const handleDownloadReport = async () => {
    setIsGenerating(true);
    try {
      await downloadReport();
    } catch (err: any) {
      alert("Error generating report: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-[11px] font-black text-slate-400 mb-5 flex items-center uppercase tracking-[0.2em]">
        <i className="fas fa-toolbox text-blue-500 mr-2"></i>
        System Actions
      </h3>
      
      <div className="space-y-4">
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`group border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isUploading ? 'bg-slate-50 border-blue-200 cursor-wait' : 'hover:bg-blue-50 hover:border-blue-400 border-slate-200 cursor-pointer'
          }`}
        >
          <input 
            type="file" ref={fileInputRef} onChange={handleUpload} 
            className="hidden" accept=".csv" disabled={isUploading}
          />
          <div className={`${isUploading ? 'text-blue-400 animate-spin' : 'text-slate-300 group-hover:text-blue-500'} mb-3 transition-colors`}>
            <i className={`fas ${isUploading ? 'fa-spinner' : 'fa-file-csv'} text-4xl`}></i>
          </div>
          <p className="text-xs font-black text-slate-700">
            {isUploading ? 'SYNCING DATABASE...' : 'IMPORT PARAMETERS (CSV)'}
          </p>
          <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-tight">Native Schema Detection Active</p>
        </div>

        {status && (
          <div className={`text-[10px] font-black p-3 rounded-lg flex items-center space-x-2 animate-fade-in border ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
          }`}>
            <i className={`fas ${status.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
            <span className="uppercase">{status.message}</span>
          </div>
        )}

        <button 
          id="report-btn"
          onClick={handleDownloadReport}
          disabled={isGenerating}
          className="group w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50"
        >
          <i className={`fas ${isGenerating ? 'fa-circle-notch fa-spin' : 'fa-file-pdf'} mr-2 text-sm text-blue-400 group-hover:text-white transition-colors`}></i>
          {isGenerating ? 'Generating PDF...' : 'Export PDF Report'}
        </button>
      </div>
    </div>
  );
};
