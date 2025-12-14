import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, User, LogOut, Settings, ChevronDown, Shield, Eye, EyeOff } from 'lucide-react';

export const ProfileDropdown = ({ onOpenAuthModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { user, isAuthenticated, isAdmin, isDemo, logout, updateProfile } = useAuth();
  
  // Use controlled state through key comparison instead of effect-based setState
  const userKey = useMemo(() => user?.id || 'anonymous', [user?.id]);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [lastUserKey, setLastUserKey] = useState(userKey);
  
  if (userKey !== lastUserKey) {
    setDisplayName(user?.displayName || '');
    setLastUserKey(userKey);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const updates = { displayName };
    if (newPassword) {
      updates.currentPassword = currentPassword;
      updates.newPassword = newPassword;
    }

    const result = await updateProfile(updates);
    
    if (result.success) {
      setSuccess('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => onOpenAuthModal('login')}
        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95 whitespace-nowrap"
      >
        <User size={18} className="shrink-0" />
        <span className="hidden sm:inline">Log In</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[var(--glass-bg)] hover:bg-neutral-200 dark:hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] rounded-lg transition-all"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {(user.displayName || user.username).charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="hidden sm:block text-sm text-[var(--text-primary)] max-w-24 truncate">
          {user.displayName || user.username}
        </span>
        {isAdmin && (
          <Shield size={14} className="text-amber-400" />
        )}
        {isDemo && (
          <User size={14} className="text-blue-400" />
        )}
        <ChevronDown 
          size={14} 
          className={`text-[var(--text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--bg-card)] border border-[var(--glass-border)] rounded-xl shadow-2xl overflow-hidden z-50">
          {/* User Info */}
          <div className="p-4 border-b border-[var(--glass-border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {(user.displayName || user.username).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-primary)] font-medium truncate">
                  {user.displayName || user.username}
                </p>
                <p className="text-[var(--text-secondary)] text-sm flex items-center gap-1">
                  @{user.username}
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                      <Shield size={10} />
                      Admin
                    </span>
                  )}
                  {isDemo && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                      <User size={10} />
                      Demo
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full px-4 py-3 flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-highlight)] transition-colors"
          >
            <Settings size={18} />
            <span className="text-sm">Settings</span>
            <ChevronDown 
              size={14} 
              className={`ml-auto transition-transform ${showSettings ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* Settings Form */}
          {showSettings && (
            <form onSubmit={handleUpdateProfile} className="px-4 pb-4 space-y-3">
              {error && (
                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs">
                  {success}
                </div>
              )}
              
              <div>
                <label className="block text-[var(--text-secondary)] text-xs mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>

              <div className="pt-2 border-t border-[var(--glass-border)]">
                <label className="block text-[var(--text-secondary)] text-xs mb-1">Change Password</label>
                <div className="space-y-2">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {showPasswords ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showPasswords ? 'Hide' : 'Show'} passwords
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Logout */}
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full px-4 py-3 flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border-t border-[var(--glass-border)]"
          >
            <LogOut size={18} />
            <span className="text-sm">Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
