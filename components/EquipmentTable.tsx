
import React from 'react';
import { EquipmentItem } from '../types';

interface EquipmentTableProps {
  data: EquipmentItem[];
  loading: boolean;
}

export const EquipmentTable: React.FC<EquipmentTableProps> = ({ data, loading }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-sm font-black text-slate-700 flex items-center uppercase tracking-widest">
          <i className="fas fa-list-check text-blue-500 mr-2"></i>
          Asset Inventory Registry
        </h3>
        <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase">
          {data.length} Registered Units
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Equipment / Asset Name</th>
              <th className="px-6 py-4">Classification</th>
              <th className="px-6 py-4 text-right">Flow (m³/h)</th>
              <th className="px-6 py-4 text-right">Pressure (Bar)</th>
              <th className="px-6 py-4 text-right">Temperature (°C)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-6"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <i className="fas fa-database text-slate-200 text-5xl mb-4"></i>
                    <p className="text-slate-400 font-bold uppercase text-xs">No active assets detected</p>
                    <p className="text-[10px] text-slate-300 mt-1 uppercase">Synchronize CSV data to populate inventory</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-all cursor-default group">
                  <td className="px-6 py-4 font-black text-slate-700 text-sm group-hover:text-blue-600">
                    {item.equipment_name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-800 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter">
                      {item.equipment_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-slate-500">{item.flowrate.toFixed(1)}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-slate-500">{item.pressure.toFixed(1)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-mono text-sm font-bold ${item.temperature > 100 ? 'text-red-500' : 'text-slate-600'}`}>
                      {item.temperature.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
