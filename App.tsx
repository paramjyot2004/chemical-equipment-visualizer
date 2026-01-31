
import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { UploadSection } from './components/UploadSection';
import { EquipmentTable } from './components/EquipmentTable';
import { HistoryList } from './components/HistoryList';
import { getSummary, getEquipment, getHistory, isDemoMode as apiIsDemoMode } from './services/api';
import { EquipmentItem, SummaryStats, HistoryEntry } from './types';

type Tab = 'dashboard' | 'equipment' | 'reports';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  // Fetch all necessary data from the API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, eqRes, histRes] = await Promise.all([
        getSummary(),
        getEquipment(),
        getHistory()
      ]);
      setSummary(sumRes);
      setEquipment(eqRes);
      setHistory(histRes);
      // apiIsDemoMode updates based on the success of the fetch calls in services/api.ts
      setIsDemo(apiIsDemoMode);
    } catch (err) {
      console.warn("Real-time data fetch failed. Dashboard is operating in simulated failover mode.");
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Data Load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time Update Listener (WebSockets)
  useEffect(() => {
    // If in Demo Mode, don't attempt WebSocket connection
    if (isDemo) {
      setIsLive(false);
      return;
    }

    const wsUrl = 'ws://localhost:8000/ws/updates/';
    let socket: WebSocket;

    const connectWS = () => {
      try {
        socket = new WebSocket(wsUrl);
        socket.onopen = () => setIsLive(true);
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          // If backend says data changed, refresh our local state
          if (data.message === 'data_updated') fetchData();
        };
        socket.onclose = () => {
          setIsLive(false);
          // Try to reconnect every 5 seconds if not in demo mode
          if (!isDemo) setTimeout(connectWS, 5000);
        };
        socket.onerror = () => {
            setIsLive(false);
            socket.close();
        };
      } catch (e) {
        setIsLive(false);
      }
    };

    connectWS();
    return () => { if (socket) socket.close(); };
  }, [isDemo, fetchData]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation Header */}
      <Navbar 
        isLive={isLive} 
        isDemo={isDemo}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {activeTab === 'dashboard' && (
              <Dashboard summary={summary} loading={loading} />
            )}
            
            {activeTab === 'equipment' && (
              <EquipmentTable data={equipment} loading={loading} />
            )}
            
            {activeTab === 'reports' && (
              <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center animate-fade-in">
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
                    <i className="fas fa-file-invoice"></i>
                </div>
                <h3 className="text-xl font-black text-slate-700 mb-2 uppercase tracking-tight">Compliance & Audit Hub</h3>
                <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                  Generate regulatory-grade PDF reports including visual distribution charts and average parameter metrics for equipment inspections.
                </p>
                <div className="mt-8 flex justify-center space-x-4">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase transition-all"
                    >
                        View Analytics
                    </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            <UploadSection onUploadSuccess={fetchData} />
            <HistoryList history={history} loading={loading} />
          </div>

        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>&copy; 2024 ChemVis Industrial Systems • All Rights Reserved</span>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="hover:text-blue-500 cursor-pointer transition-colors">Safety Protocol</span>
            <span className="hover:text-blue-500 cursor-pointer transition-colors">API Docs</span>
            <span className="hover:text-blue-500 cursor-pointer transition-colors">Hardware Sync</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
