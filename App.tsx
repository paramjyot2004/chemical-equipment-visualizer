import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ReportsPage } from './components/ReportsPage';
import { UploadSection } from './components/UploadSection';
import { EquipmentTable } from './components/EquipmentTable';
import { HistoryList } from './components/HistoryList';
import { getSummary, getEquipment, getHistory, isDemoMode as apiIsDemoMode } from './services/api';
import { EquipmentItem, SummaryStats, HistoryEntry } from './types';

type Tab = 'dashboard' | 'equipment' | 'reports';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: Date;
}

interface AdminSession {
  isAdmin: boolean;
  username: string;
  loginTime: Date;
  verificationStatus: 'verified' | 'pending' | 'failed';
  lastVerificationTime?: Date;
}

const App: React.FC = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminSession, setAdminSession] = useState<AdminSession>({
    isAdmin: false,
    username: '',
    loginTime: new Date(),
    verificationStatus: 'pending'
  });

  // Tab and data state
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Check if user is already logged in on mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('auth_credentials');
    if (savedCredentials) {
      const creds = JSON.parse(savedCredentials);
      setIsAuthenticated(true);
      // Check if admin on restore
      verifyAdminAccess(creds.username);
    }
  }, []);

  // Verify admin access based on credentials
  const verifyAdminAccess = useCallback((username: string) => {
    const isAdmin = username.toLowerCase() === 'admin';
    setAdminSession({
      isAdmin,
      username,
      loginTime: new Date(),
      verificationStatus: isAdmin ? 'verified' : 'failed',
      lastVerificationTime: new Date()
    });
    return isAdmin;
  }, []);

  // Add notification helper
  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotif, ...prev]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 5000);
  }, []);

  // Handle login
  const handleLogin = (username: string, password: string) => {
    // Store credentials in localStorage
    localStorage.setItem('auth_credentials', JSON.stringify({ username, password }));
    setIsAuthenticated(true);
    
    // Verify admin access
    const isAdmin = verifyAdminAccess(username);
    
    // Add appropriate notification
    if (isAdmin) {
      addNotification('🔐 Admin access verified • System privileges enabled', 'success');
    } else {
      addNotification('✓ Logged in as user', 'success');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('auth_credentials');
    setIsAuthenticated(false);
    setAdminSession({
      isAdmin: false,
      username: '',
      loginTime: new Date(),
      verificationStatus: 'pending'
    });
    setActiveTab('dashboard');
    addNotification('Successfully logged out', 'info');
  };

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

  // Initial Data Load (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Real-time Update Listener (WebSockets)
  useEffect(() => {
    // If not authenticated, demo mode, or no WebSocket support, skip
    if (!isAuthenticated || isDemo) {
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
  }, [isAuthenticated, isDemo, fetchData]);

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Main authenticated app layout
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation Header */}
      <Navbar 
        isLive={isLive} 
        isDemo={isDemo}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        notifications={notifications}
        onNotificationClear={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
        adminSession={adminSession}
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
              <ReportsPage summary={summary} loading={loading} />
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            <UploadSection onUploadSuccess={() => {
              addNotification('✓ Dataset synchronized successfully!', 'success');
              fetchData();
            }} />
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