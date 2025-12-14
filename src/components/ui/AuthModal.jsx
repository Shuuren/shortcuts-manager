import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Eye, EyeOff, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AuthModal = ({ isOpen, onClose, mode: initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
    }
  }, [isOpen, initialMode]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (mode === 'login') {
        result = await login(username, password);
      } else {
        result = await register(username, password, displayName);
      }

      if (result.success) {
        onClose();
        setUsername('');
        setPassword('');
        setDisplayName('');
      } else {
        setError(result.error);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-[#111111] rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="px-5 py-6 md:px-8 md:pt-10 md:pb-8 relative z-0">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 transform rotate-3">
              <Sparkles className="text-white w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent mb-1">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-neutral-400">
              {mode === 'login' 
                ? 'Enter your details to access your shortcuts' 
                : 'Join us and start organizing your workflow'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs md:text-sm text-center font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3 md:space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-semibold text-neutral-300 ml-1 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative group">
                    <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 md:py-3.5 bg-neutral-900/50 border border-white/5 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all group-hover:border-white/10 text-sm md:text-base"
                    placeholder="Enter your username"
                    required
                    minLength={3}
                    autoFocus
                  />
                </div>
              </div>

              {mode === 'register' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-[10px] md:text-xs font-semibold text-neutral-300 ml-1 uppercase tracking-wider">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 md:py-3.5 bg-neutral-900/50 border border-white/5 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:border-white/10 text-sm md:text-base"
                    placeholder="How should we call you?"
                  />
                </motion.div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-semibold text-neutral-300 ml-1 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative group">
                    <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 md:py-3.5 bg-neutral-900/50 border border-white/5 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all pr-12 group-hover:border-white/10 text-sm md:text-base"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 md:py-4 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={toggleMode}
                className="text-xs md:text-sm text-neutral-400 hover:text-white transition-colors underline decoration-transparent hover:decoration-white/30 underline-offset-4"
              >
                {mode === 'login' 
                  ? "Don't have an account? Register" 
                  : 'Already have an account? Sign In'}
              </button>
            </div>

            {/* Demo Credentials - For Testing */}
            {mode === 'login' && (
              <div className="mt-4 pt-3 border-t border-white/5">
                <p className="text-[10px] text-neutral-500 text-center mb-2 uppercase tracking-widest">Demo Account</p>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('gabby_demo');
                    setPassword('gabby123');
                  }}
                  className="w-full flex items-center justify-between p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group"
                >
                   <div className="text-left">
                     <div className="text-xs text-white/90 font-medium font-mono">gabby_demo</div>
                     <div className="text-[10px] text-white/50">Click to autofill</div>
                   </div>
                   <div className="text-[10px] md:text-xs text-blue-400 group-hover:text-blue-300 font-medium bg-blue-500/10 px-2 py-1 rounded-lg">
                     Use Demo
                   </div>
                </button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
};
