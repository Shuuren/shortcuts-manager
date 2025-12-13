import { useState, useRef } from 'react';
import { GlassPanel } from '../ui/GlassPanel';
import { LayoutGrid, Command, Keyboard, Menu, X, Box, ChevronLeft, ChevronRight, Sparkles, Sun, Moon, History, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ProfileDropdown } from '../ui/ProfileDropdown';
import { AuthModal } from '../ui/AuthModal';

const NAV_ITEMS = [
  { id: 'leader', label: 'Leader Key', icon: LayoutGrid, headerLabel: 'Leader Key View' },
  { id: 'raycast', label: 'Raycast', icon: Command, headerLabel: 'Raycast View' },
  { id: 'system', label: 'System', icon: Keyboard, headerLabel: 'System View' },
  { id: 'divider' }, // divider
  { id: 'apps', label: 'Apps Library', icon: Box, headerLabel: 'Apps Library' },
  { id: 'divider2' }, // divider
  { id: 'export', label: 'Export', icon: FileDown, headerLabel: 'Export Manager' },
  { id: 'history', label: 'History', icon: History, headerLabel: 'Change History', editorsOnly: true },
];

export function Layout({ children, activeTab, onTabChange, theme, toggleTheme }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Desktop collapsed state
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const { canEdit } = useAuth();

  const hoverTimeout = useRef(null);
  const hoverDisabledUntil = useRef(0); // Timestamp until which hover is disabled

  // Desktop: show expanded if not collapsed OR if hovered
  const isExpanded = !sidebarCollapsed || sidebarHovered || sidebarOpen;

  const handleMouseEnter = () => {
    // Ignore hover if we're in the cooldown period after unpinning
    if (Date.now() < hoverDisabledUntil.current) {
      return;
    }
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    setSidebarHovered(true);
  };

  const handleMouseLeave = () => {
    // Reset hoverDisabled when mouse leaves (user has moved away)
    hoverDisabledUntil.current = 0;
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    hoverTimeout.current = setTimeout(() => {
      setSidebarHovered(false);
    }, 300);
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // Filter nav items based on role
  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.editorsOnly && !canEdit) return false;
    return true;
  });

  return (
    <div className="flex h-screen w-full overflow-hidden p-2 md:p-4 gap-2 md:gap-4 transition-colors duration-300">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden flex items-center justify-between p-3 backdrop-blur-md border-b border-[var(--glass-border)] bg-[var(--glass-bg)]">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-[var(--glass-bg-hover)] transition-colors text-[var(--text-primary)]"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Shortcut Manager
        </h1>
        <ProfileDropdown onOpenAuthModal={openAuthModal} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <GlassPanel 
        className={`
          fixed md:relative z-40 md:z-auto
          flex flex-col gap-4 h-full border-r-0
          transition-all duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          top-0 left-0 md:top-auto md:left-auto
          pt-16 md:pt-0 px-0 pb-0
          ${isExpanded ? 'w-56' : 'w-16'}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const willCollapse = !sidebarCollapsed;
            setSidebarCollapsed(willCollapse);
            // When collapsing (unpinning), immediately reset hover state to collapse sidebar
            if (willCollapse) {
              if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
              setSidebarHovered(false);
              // Set a cooldown period to ignore hover events (500ms)
              hoverDisabledUntil.current = Date.now() + 500;
            }
          }}
          className={`
            absolute -right-3 top-1/2 transform -translate-y-1/2 z-50
            w-6 h-6 rounded-full bg-[var(--bg-app)] border border-[var(--glass-border)]
            flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]
            transition-colors shadow-lg hidden md:flex
          `}
          title={sidebarCollapsed ? "Pin sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Header */}
        <div className={`pt-4 pb-1 hidden md:flex items-center transition-all duration-300 ${isExpanded ? 'px-3 justify-between' : 'px-0 justify-center'}`}>
          {isExpanded ? (
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Shortcut Manager
            </h1>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
              <Sparkles size={16} className="text-blue-400" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {visibleNavItems.map((item) => {
            // Render divider
            if (item.id.startsWith('divider')) {
              return <div key={item.id} className={`border-t border-[var(--glass-border)] my-2 ${isExpanded ? 'mx-2' : 'mx-1'}`} />;
            }
            
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  flex items-center gap-3 rounded-xl transition-all duration-200 relative group
                  ${isExpanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'}
                  ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-neutral-200 dark:hover:bg-[var(--glass-bg-hover)]'}
                `}
                title={!isExpanded ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 bg-black/5 dark:bg-[var(--glass-bg-hover)] rounded-xl ${!isExpanded ? 'mx-1' : ''}`}
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={18} className="relative z-10 flex-shrink-0" />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span 
                      className="relative z-10 font-medium text-sm whitespace-nowrap overflow-hidden"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        {/* Footer with Theme Toggle */}
        <div className={`mt-auto pb-4 flex flex-col items-center gap-2 transition-all duration-300 ${isExpanded ? 'px-2' : 'px-0'}`}>
            <button
              onClick={toggleTheme}
              className={`
                flex items-center gap-3 rounded-xl transition-all duration-200 w-full
                ${isExpanded ? 'px-3 py-2 text-left' : 'p-2 justify-center'}
                text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-neutral-200 dark:hover:bg-[var(--glass-bg-hover)]
              `}
              title={isExpanded ? "Toggle Theme" : `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              <div className="relative w-[18px] h-[18px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={theme}
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                  </motion.div>
                </AnimatePresence>
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.span 
                    className="flex-1 font-medium text-sm whitespace-nowrap overflow-hidden"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    Theme
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  className="text-[10px] text-[var(--text-muted)] text-center w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                   v1.0.0
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </GlassPanel>

      {/* Main Content */}
      <GlassPanel className="flex-1 h-full overflow-hidden relative border-none bg-[var(--glass-bg)] flex flex-col mt-14 md:mt-0">
        {/* Top Bar */}
        <div className="p-4 border-b border-[var(--glass-border)] flex justify-between items-center backdrop-blur-md z-20">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {visibleNavItems.find(i => i.id === activeTab)?.headerLabel || `${activeTab} View`}
          </h2>
          <div className="flex items-center gap-3">
            <div id="top-bar-actions" />
            <div className="hidden md:block">
              <ProfileDropdown onOpenAuthModal={openAuthModal} />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative p-4">
          {children}
        </div>
      </GlassPanel>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        mode={authModalMode}
      />
    </div>
  );
}
