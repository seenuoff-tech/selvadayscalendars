import React, { useState } from 'react';
import { Lock, X, AlertCircle, KeyRound, User, Eye, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple frontend validation before sending
    if (!username.trim()) {
      setError('Please enter your username.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        }),
      });

      const data = await response.json();

      if (data.success) {
        onLoginSuccess(data.token || 'admin-session-token');
        setUsername('');
        setPassword('');
      } else {
        setError(data.message || 'Invalid admin credentials.');
      }
    } catch (err) {
      setError('Connection failed. Please check network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setUsername('admin');
    setPassword('admin123');
  };

  return (
    <div id="admin-login-modal-backdrop" className="fixed inset-0 z-50 bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 w-full max-w-sm overflow-hidden animate-in fade-in duration-200 my-auto">
        
        {/* Header */}
        <div className="bg-white relative flex flex-col items-center justify-center p-6 pb-2">
          <img src="/sspic-logo.png" alt="SSP Logo" className="h-24 w-auto object-contain mb-4" />
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="admin-username-input" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" /> Username
            </label>
            <input
              id="admin-username-input"
              type="text"
              required
              placeholder="Enter admin username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-[#0C8D99] focus:border-transparent text-sm text-slate-900 rounded-xl px-3.5 py-2.5 outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="admin-password-input" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-500" /> Password
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter admin password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-[#0C8D99] focus:border-transparent text-sm text-slate-900 rounded-xl pl-3.5 pr-10 py-2.5 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              id="btn-submit-admin-login"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#0C8D99] hover:bg-[#0a7983] text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Login to Admin'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
