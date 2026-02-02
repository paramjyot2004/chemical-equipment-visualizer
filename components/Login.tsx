import React, { useState } from 'react';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { username?: string; password?: string } = {};

    // Validation
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors and submit
    setErrors({});
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Login card */}
      <div className="w-full max-w-md relative z-10">
        {/* Header with logo */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-5 shadow-xl shadow-blue-500/30">
            <i className="fas fa-flask text-white text-3xl"></i>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            <span className="text-white">CHEMVIS</span>
            <span className="text-blue-400">PRO</span>
          </h1>
          <p className="text-blue-300/80 text-xs font-bold tracking-[0.3em] uppercase">Industrial Intelligence</p>
        </div>

        {/* Form container */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          {/* Title */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-1">System Access</h2>
            <p className="text-blue-300/70 text-sm">Enter authorized credentials to continue.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-user text-slate-500"></i>
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors({ ...errors, username: undefined });
                  }}
                  className={`w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border ${
                    errors.username ? 'border-red-500/50' : 'border-slate-700/50'
                  } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm`}
                  placeholder="admin"
                />
              </div>
              {errors.username && (
                <p className="text-red-400 text-xs mt-2 ml-1">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-slate-500"></i>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  className={`w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border ${
                    errors.password ? 'border-red-500/50' : 'border-slate-700/50'
                  } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-2 ml-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-8 px-4 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              Initialize Session
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Protected by Industry Standard Encryption
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs">
            <button className="text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wide font-semibold">
              Privacy Policy
            </button>
            <span className="text-slate-600">•</span>
            <button className="text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wide font-semibold">
              System Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
