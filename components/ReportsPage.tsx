import React, { useState } from 'react';
import { downloadReport } from '../services/api';
import { SummaryStats } from '../types';

interface ReportsPageProps {
  summary: SummaryStats | null;
  loading: boolean;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ summary, loading }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await downloadReport();
      setReportGenerated(true);
      setTimeout(() => setReportGenerated(false), 3000);
    } catch (err: any) {
      alert('Error generating report: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center">
              <i className="fas fa-file-pdf text-blue-600 mr-3"></i>
              Report Generator
            </h2>
            <p className="text-slate-600 text-sm">Generate compliance and audit reports in PDF format</p>
          </div>
          <div className="text-5xl text-blue-200 opacity-30">
            <i className="fas fa-chart-bar"></i>
          </div>
        </div>
      </div>

      {/* Main Report Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generate Button */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-8">
            <h3 className="text-sm font-black text-slate-700 mb-4 uppercase tracking-widest">Quick Actions</h3>
            
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-5 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <i className={`fas ${isGenerating ? 'fa-circle-notch fa-spin' : 'fa-download'} text-lg`}></i>
              <span>{isGenerating ? 'Generating...' : 'Generate PDF'}</span>
            </button>

            {reportGenerated && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                <i className="fas fa-check-circle text-emerald-600 text-2xl mb-2"></i>
                <p className="text-emerald-700 text-xs font-bold uppercase">Report Downloaded!</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-200 space-y-3 text-[10px]">
              <div className="flex items-start space-x-2">
                <i className="fas fa-check-circle text-blue-500 mt-0.5 flex-shrink-0"></i>
                <span className="text-slate-600 font-semibold">Executive summary with key metrics</span>
              </div>
              <div className="flex items-start space-x-2">
                <i className="fas fa-check-circle text-blue-500 mt-0.5 flex-shrink-0"></i>
                <span className="text-slate-600 font-semibold">Equipment type distribution</span>
              </div>
              <div className="flex items-start space-x-2">
                <i className="fas fa-check-circle text-blue-500 mt-0.5 flex-shrink-0"></i>
                <span className="text-slate-600 font-semibold">Detailed asset inventory table</span>
              </div>
              <div className="flex items-start space-x-2">
                <i className="fas fa-check-circle text-blue-500 mt-0.5 flex-shrink-0"></i>
                <span className="text-slate-600 font-semibold">Professional PDF formatting</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-700 mb-4 uppercase tracking-widest">Current Metrics</h3>
            
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bg-slate-100 rounded-lg h-24 animate-pulse"></div>
                ))}
              </div>
            ) : summary ? (
              <div className="grid grid-cols-2 gap-4">
                {/* Total Equipment */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <i className="fas fa-cubes text-blue-600 text-2xl"></i>
                    <span className="text-[8px] bg-blue-200 text-blue-700 px-2.5 py-1 rounded-full font-bold">EQUIPMENT</span>
                  </div>
                  <div className="text-3xl font-black text-blue-800">{summary.total_equipment}</div>
                  <p className="text-[10px] text-blue-600 mt-1 font-semibold">Total Equipment Units</p>
                </div>

                {/* Avg Flowrate */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-5 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <i className="fas fa-water text-emerald-600 text-2xl"></i>
                    <span className="text-[8px] bg-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full font-bold">FLOWRATE</span>
                  </div>
                  <div className="text-3xl font-black text-emerald-800">{summary.avg_flowrate.toFixed(1)}</div>
                  <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Avg Flowrate (m³/h)</p>
                </div>

                {/* Avg Pressure */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <i className="fas fa-gauge text-orange-600 text-2xl"></i>
                    <span className="text-[8px] bg-orange-200 text-orange-700 px-2.5 py-1 rounded-full font-bold">PRESSURE</span>
                  </div>
                  <div className="text-3xl font-black text-orange-800">{summary.avg_pressure.toFixed(2)}</div>
                  <p className="text-[10px] text-orange-600 mt-1 font-semibold">Avg Pressure (Bar)</p>
                </div>

                {/* Avg Temperature */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <i className="fas fa-thermometer text-red-600 text-2xl"></i>
                    <span className="text-[8px] bg-red-200 text-red-700 px-2.5 py-1 rounded-full font-bold">TEMPERATURE</span>
                  </div>
                  <div className="text-3xl font-black text-red-800">{summary.avg_temperature.toFixed(1)}</div>
                  <p className="text-[10px] text-red-600 mt-1 font-semibold">Avg Temperature (°C)</p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200">
                <i className="fas fa-inbox text-4xl text-slate-300 mb-4"></i>
                <p className="text-slate-500 font-semibold">No data available</p>
              </div>
            )}
          </div>

          {/* Equipment Distribution */}
          {summary && Object.keys(summary.type_distribution).length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-sm font-black text-slate-700 mb-4 uppercase tracking-widest">Equipment Distribution</h3>
              <div className="space-y-3">
                {Object.entries(summary.type_distribution).map(([type, count]) => {
                  const percentage = ((count as number) / summary.total_equipment * 100);
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">{type}</span>
                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                          {count} units ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-500 text-white p-3 rounded-lg">
              <i className="fas fa-file-pdf text-xl"></i>
            </div>
            <div>
              <h4 className="font-black text-slate-800 mb-1">Professional PDF Format</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Reports are generated in high-quality PDF format with structured layout, tables, and professional styling suitable for audits and compliance documentation.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-emerald-500 text-white p-3 rounded-lg">
              <i className="fas fa-shield text-xl"></i>
            </div>
            <div>
              <h4 className="font-black text-slate-800 mb-1">Complete Data Integrity</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                All reports include a complete asset inventory with parameters from your latest dataset, ensuring data accuracy and audit trail compliance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
