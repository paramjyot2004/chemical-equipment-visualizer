
import React from 'react';

interface NavbarProps {
  isLive?: boolean;
  isDemo?: boolean;
  activeTab: string;
  onTabChange: (tab: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isLive, isDemo, activeTab, onTabChange }) => {
  return (
    <nav className="bg-slate-900 text-white shadow-2xl border-b border-slate-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('dashboard')}>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-inner">
            <i className="fas fa-flask text-white"></i>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-black text-lg tracking-tighter uppercase">ChemVis<span className="text-blue-400">Pro</span></span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Enterprise Core</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-8 text-[11px] font-bold uppercase tracking-widest">
          <button 
            onClick={() => onTabChange('dashboard')}
            className={`transition-all pb-1 border-b-2 ${activeTab === 'dashboard' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-white'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => onTabChange('equipment')}
            className={`transition-all pb-1 border-b-2 ${activeTab === 'equipment' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-white'}`}
          >
            Equipment
          </button>
          <button 
            onClick={() => onTabChange('reports')}
            className={`transition-all pb-1 border-b-2 ${activeTab === 'reports' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-white'}`}
          >
            Reports
          </button>
          
          <div className="h-4 w-px bg-slate-700 mx-2"></div>

          <div className="flex items-center">
            {isDemo ? (
              <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-[9px] font-black">
                DEMO MODE ACTIVE
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-slate-300 text-[9px] uppercase font-black tracking-tight">
                  {isLive ? 'SYSTEM LIVE' : 'CONNECTING...'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative group">
            <button className="bg-slate-800 hover:bg-slate-700 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 transition-all active:scale-90 shadow-lg">
              <i className="fas fa-bell text-sm"></i>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-slate-900 shadow-md animate-bounce"></span>
            </button>
          </div>
          <div className="flex items-center space-x-3 pl-4 border-l border-slate-800 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-black text-white group-hover:text-blue-400 transition-colors uppercase">Systems Admin</div>
              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Verified Access</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden group-hover:border-blue-500 transition-all shadow-md">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
