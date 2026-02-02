
import React, { useState, useEffect } from 'react';

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

interface NavbarProps {
  isLive?: boolean;
  isDemo?: boolean;
  activeTab: string;
  onTabChange: (tab: any) => void;
  onLogout?: () => void;
  notifications?: Notification[];
  onNotificationClear?: (id: string) => void;
  adminSession?: AdminSession;
}

export const Navbar: React.FC<NavbarProps> = ({ isLive, isDemo, activeTab, onTabChange, onLogout, notifications = [], onNotificationClear, adminSession }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationList, setNotificationList] = useState<Notification[]>(notifications);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  useEffect(() => {
    setNotificationList(notifications);
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notification-container')) {
        setShowNotifications(false);
      }
      if (!target.closest('.admin-menu-container')) {
        setShowAdminMenu(false);
      }
    };

    if (showNotifications || showAdminMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showNotifications, showAdminMenu]);
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
          <div className="relative group notification-container">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-slate-800 hover:bg-slate-700 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 transition-all active:scale-90 shadow-lg relative"
            >
              <i className="fas fa-bell text-sm"></i>
              {notificationList.length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full border-2 border-slate-900 shadow-md flex items-center justify-center text-white text-[10px] font-bold animate-pulse">
                  {notificationList.length > 9 ? '9+' : notificationList.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden notification-container">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Notifications</h3>
                  {notificationList.length > 0 && (
                    <button
                      onClick={() => {
                        setNotificationList([]);
                        setShowNotifications(false);
                      }}
                      className="text-[10px] text-slate-400 hover:text-red-400 transition-colors font-bold uppercase"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-96 overflow-y-auto">
                  {notificationList.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <i className="fas fa-inbox text-4xl text-slate-700 mb-3 block"></i>
                      <p className="text-slate-400 text-sm font-semibold">No notifications</p>
                      <p className="text-slate-500 text-xs mt-1">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {notificationList.map((notif, idx) => {
                        const iconColor = {
                          success: 'text-emerald-500',
                          error: 'text-red-500',
                          warning: 'text-amber-500',
                          info: 'text-blue-500'
                        }[notif.type];

                        const bgColor = {
                          success: 'bg-emerald-500/10 border-emerald-500/20',
                          error: 'bg-red-500/10 border-red-500/20',
                          warning: 'bg-amber-500/10 border-amber-500/20',
                          info: 'bg-blue-500/10 border-blue-500/20'
                        }[notif.type];

                        const icon = {
                          success: 'fa-check-circle',
                          error: 'fa-exclamation-circle',
                          warning: 'fa-warning',
                          info: 'fa-info-circle'
                        }[notif.type];

                        const timeAgo = (date: Date) => {
                          const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
                          if (seconds < 60) return 'Just now';
                          if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
                          if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
                          return `${Math.floor(seconds / 86400)}d ago`;
                        };

                        return (
                          <div
                            key={notif.id}
                            className={`px-4 py-3 hover:bg-slate-800/50 transition-colors border-l-2 ${
                              notif.type === 'success' ? 'border-l-emerald-500' :
                              notif.type === 'error' ? 'border-l-red-500' :
                              notif.type === 'warning' ? 'border-l-amber-500' :
                              'border-l-blue-500'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <i className={`fas ${icon} ${iconColor} mt-0.5 flex-shrink-0`}></i>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium">{notif.message}</p>
                                <p className="text-[10px] text-slate-500 mt-1 font-semibold">{timeAgo(notif.timestamp)}</p>
                              </div>
                              <button
                                onClick={() => {
                                  setNotificationList(notificationList.filter(n => n.id !== notif.id));
                                  onNotificationClear?.(notif.id);
                                }}
                                className="text-slate-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                              >
                                <i className="fas fa-times text-xs"></i>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notificationList.length > 0 && (
                  <div className="bg-slate-900 px-4 py-2 border-t border-slate-700 text-center">
                    <button className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase transition-colors">
                      View All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3 pl-4 border-l border-slate-800 relative admin-menu-container">
            {/* Admin Badge and Menu */}
            <div 
              onClick={() => setShowAdminMenu(!showAdminMenu)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
                adminSession?.isAdmin 
                  ? 'bg-gradient-to-r from-amber-900/30 to-orange-900/20 border border-amber-700/50 hover:border-amber-600 hover:from-amber-900/50 hover:to-orange-900/40' 
                  : 'bg-slate-800/70 border border-slate-600 hover:border-slate-500 hover:bg-slate-800/90'
              }`}
              title={adminSession?.isAdmin ? 'Admin Controls' : 'User Account'}
            >
              <div className="text-right hidden sm:block">
                <div className={`text-[10px] font-black uppercase transition-colors ${
                  adminSession?.isAdmin 
                    ? 'text-amber-400 group-hover:text-amber-300' 
                    : 'text-slate-200'
                }`}>
                  {adminSession?.isAdmin ? '⚙ Systems Admin' : 'Systems User'}
                </div>
                <div className={`text-[9px] font-bold uppercase tracking-tighter ${
                  adminSession?.isAdmin
                    ? 'text-amber-500/80'
                    : 'text-slate-400'
                }`}>
                  {adminSession?.verificationStatus === 'verified' ? (
                    <span className="text-emerald-400">✓ Verified Access</span>
                  ) : (
                    <span className="text-slate-300">Standard Access</span>
                  )}
                </div>
              </div>
              <div className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all ${
                adminSession?.isAdmin 
                  ? 'border-amber-600 shadow-lg shadow-amber-900/30' 
                  : 'border-slate-600'
              }`}>
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${adminSession?.username || 'user'}`} 
                  alt="User" 
                />
                {adminSession?.isAdmin && (
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                )}
              </div>
            </div>

            {/* Admin Menu Dropdown */}
            {showAdminMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 top-14">
                {/* Header */}
                <div className={`px-4 py-3 border-b ${
                  adminSession?.isAdmin 
                    ? 'border-amber-700/30 bg-gradient-to-r from-amber-900/20 to-orange-900/10' 
                    : 'border-slate-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Account Info</div>
                      <div className={`text-sm font-bold mt-1 ${adminSession?.isAdmin ? 'text-amber-400' : 'text-blue-400'}`}>
                        {adminSession?.username || 'User'}
                      </div>
                    </div>
                    {adminSession?.isAdmin && (
                      <div className="bg-amber-500/20 border border-amber-600/50 rounded-lg px-2 py-1">
                        <div className="text-[10px] font-black text-amber-400 uppercase">Admin</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 py-3 space-y-3 max-h-96 overflow-y-auto">
                  {/* Status */}
                  <div className="text-[11px] space-y-2">
                    <div className="text-slate-400 font-bold uppercase tracking-wide">Status</div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                        <span className="text-slate-400 text-[10px]">Verification</span>
                        <span className={`text-[10px] font-bold uppercase ${
                          adminSession?.verificationStatus === 'verified' 
                            ? 'text-emerald-400' 
                            : adminSession?.verificationStatus === 'pending'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}>
                          {adminSession?.verificationStatus === 'verified' && '✓ Verified'}
                          {adminSession?.verificationStatus === 'pending' && '◐ Pending'}
                          {adminSession?.verificationStatus === 'failed' && '✗ Failed'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                        <span className="text-slate-400 text-[10px]">Access Level</span>
                        <span className={`text-[10px] font-bold uppercase ${
                          adminSession?.isAdmin ? 'text-amber-400' : 'text-blue-400'
                        }`}>
                          {adminSession?.isAdmin ? 'Administrator' : 'Standard'}
                        </span>
                      </div>
                      {adminSession?.lastVerificationTime && (
                        <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                          <span className="text-slate-400 text-[10px]">Last Verified</span>
                          <span className="text-slate-300 text-[10px]">
                            {new Date(adminSession.lastVerificationTime).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Controls */}
                  {adminSession?.isAdmin && (
                    <>
                      <div className="border-t border-slate-700"></div>
                      <div className="text-[11px] space-y-2">
                        <div className="text-slate-400 font-bold uppercase tracking-wide">Admin Controls</div>
                        <button className="w-full text-left px-3 py-2 bg-slate-800/50 hover:bg-amber-900/30 rounded-lg text-slate-300 hover:text-amber-300 text-[10px] font-bold uppercase transition-colors">
                          <i className="fas fa-shield-alt mr-2"></i>Security Settings
                        </button>
                        <button className="w-full text-left px-3 py-2 bg-slate-800/50 hover:bg-amber-900/30 rounded-lg text-slate-300 hover:text-amber-300 text-[10px] font-bold uppercase transition-colors">
                          <i className="fas fa-users mr-2"></i>User Management
                        </button>
                        <button className="w-full text-left px-3 py-2 bg-slate-800/50 hover:bg-amber-900/30 rounded-lg text-slate-300 hover:text-amber-300 text-[10px] font-bold uppercase transition-colors">
                          <i className="fas fa-history mr-2"></i>System Logs
                        </button>
                        <button className="w-full text-left px-3 py-2 bg-slate-800/50 hover:bg-amber-900/30 rounded-lg text-slate-300 hover:text-amber-300 text-[10px] font-bold uppercase transition-colors">
                          <i className="fas fa-cog mr-2"></i>System Settings
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-slate-700 flex justify-end">
                  <button 
                    onClick={() => setShowAdminMenu(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-300 font-bold uppercase transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="ml-2 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-400 transition-colors hover:bg-slate-800 rounded-lg"
              title="Sign out"
            >
              <i className="fas fa-sign-out-alt mr-1"></i>
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
