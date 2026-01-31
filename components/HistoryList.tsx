
import React from 'react';
import { HistoryEntry } from '../types';

interface HistoryListProps {
  history: HistoryEntry[];
  loading: boolean;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, loading }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <i className="fas fa-history text-slate-400 mr-2"></i>
          Recent Uploads
        </h3>
        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold">LAST 5</span>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse"></div>
          ))
        ) : history.length === 0 ? (
          <div className="text-center py-4 text-slate-400 text-xs">No upload history yet.</div>
        ) : (
          history.map((entry) => (
            <div key={entry.id} className="flex items-start space-x-3 group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-all">
              <div className="bg-blue-50 text-blue-500 p-2 rounded-lg group-hover:bg-blue-100">
                <i className="fas fa-file-csv"></i>
              </div>
              <div className="flex-grow">
                <div className="text-sm font-semibold text-slate-800 truncate">{entry.filename}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>{new Date(entry.upload_date).toLocaleString()}</span>
                  <span className="bg-slate-100 px-1 rounded font-bold">{entry.item_count} items</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
