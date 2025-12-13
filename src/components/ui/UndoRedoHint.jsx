import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Redo2, X } from 'lucide-react';

// Inner component that handles its own visibility and timer
function HintContent({ canUndo, canRedo, onDismiss }) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';
  const [isHidden, setIsHidden] = useState(false);
  const timerRef = useRef(null);

  // Start auto-hide timer on mount
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setIsHidden(true);
    }, 5000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleDismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsHidden(true);
    if (onDismiss) onDismiss();
  }, [onDismiss]);

  if (isHidden) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-lg">
        {/* Undo */}
        <div className={`flex items-center gap-2 ${canUndo ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] opacity-50'}`}>
          <Undo2 size={14} />
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-xs font-medium bg-[var(--glass-bg-hover)] rounded border border-[var(--glass-border)]">
              {modKey}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-medium bg-[var(--glass-bg-hover)] rounded border border-[var(--glass-border)]">
              Z
            </kbd>
          </div>
          <span className="text-xs font-medium hidden sm:inline">Undo</span>
        </div>

        <div className="w-px h-4 bg-[var(--glass-border)]" />

        {/* Redo */}
        <div className={`flex items-center gap-2 ${canRedo ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] opacity-50'}`}>
          <Redo2 size={14} />
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-xs font-medium bg-[var(--glass-bg-hover)] rounded border border-[var(--glass-border)]">
              {modKey}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-medium bg-[var(--glass-bg-hover)] rounded border border-[var(--glass-border)]">
              ⇧
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-medium bg-[var(--glass-bg-hover)] rounded border border-[var(--glass-border)]">
              Z
            </kbd>
          </div>
          <span className="text-xs font-medium hidden sm:inline">Redo</span>
        </div>

        <div className="w-px h-4 bg-[var(--glass-border)]" />

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="p-1 rounded-full hover:bg-[var(--glass-bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export function UndoRedoHint({ canUndo, canRedo, historyLength = 0, activeTab = '' }) {
  // Don't show if nothing to undo or redo
  if (!canUndo && !canRedo) return null;

  // Use a key that changes when history length changes (new action added)
  // or when undo/redo state changes or tab changes - this ensures the hint re-appears
  const stateKey = `hint-${canUndo}-${canRedo}-${historyLength}-${activeTab}`;

  return (
    <AnimatePresence>
      <HintContent 
        key={stateKey}
        canUndo={canUndo} 
        canRedo={canRedo} 
      />
    </AnimatePresence>
  );
}
