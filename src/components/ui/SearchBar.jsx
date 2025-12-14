import { Search, X, ArrowLeft } from 'lucide-react';
import { useRef, useEffect, useCallback, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SearchBar with debounced input
 * 
 * Features:
 * - Local state for immediate UI responsiveness
 * - Debounced onChange callback (200ms) 
 * - Cmd+K to focus/blur
 * - Escape to blur
 * - Mobile: Expands from button to full bar
 */
export const SearchBar = memo(function SearchBar({ value, onChange, debounceMs = 200 }) {
  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const debounceRef = useRef(null);
  
  // Local state for immediate UI feedback
  const [localValue, setLocalValue] = useState(value);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Sync local value when prop value changes (e.g., from clearing)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle Cmd+K to toggle search bar focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle logic usually applies to the main desktop search or force-opens mobile
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // If on mobile (check width? or just state), maybe open mobile search
        if (window.innerWidth < 768) {
             if (!isMobileOpen) setIsMobileOpen(true);
        } else {
             if (document.activeElement === inputRef.current) {
               inputRef.current.blur();
             } else {
               inputRef.current?.focus();
             }
        }
      }
      
      // Escape to blur or close mobile
      if (e.key === 'Escape') {
          if (isMobileOpen) {
              setIsMobileOpen(false);
          } else if (document.activeElement === inputRef.current) {
              inputRef.current.blur();
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  // Debounced change handler
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    
    setLocalValue(newValue);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  }, [onChange, debounceMs]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleClear = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setLocalValue('');
    onChange('');
    // Focus appropriate input
    if (isMobileOpen) {
        mobileInputRef.current?.focus();
    } else {
        inputRef.current?.focus();
    }
  }, [onChange, isMobileOpen]);

  // Common input classes
  const inputClasses = "w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[var(--text-primary)] placeholder-[var(--text-muted)] h-full";

  return (
    <>
        {/* Desktop Search Bar */}
        <div className="hidden md:block relative w-full max-w-md group transition-all">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--text-muted)] group-focus-within:text-[var(--text-primary)] transition-colors">
            <Search size={16} />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="input-search pl-10 pr-12 w-full" 
            placeholder="Search..." 
            value={localValue}
            onChange={handleChange}
          />
          
          {/* Shortcut Hint */}
          {!localValue && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-[var(--glass-border)] bg-[var(--surface-highlight)] px-1.5 font-mono text-[10px] font-medium text-[var(--text-muted)] opacity-50">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          )}

          {/* Clear Button */}
          {localValue && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              type="button"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Mobile Search Trigger Button */}
        <button
            onClick={() => setIsMobileOpen(true)}
            className={`md:hidden p-2 rounded-full hover:bg-[var(--glass-bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ${isMobileOpen ? 'opacity-0' : 'opacity-100'}`}
            aria-label="Open search"
        >
            <Search size={20} />
        </button>

        {/* Mobile Search Overlay */}
        <AnimatePresence>
            {isMobileOpen && (
                <motion.div
                    initial={{ opacity: 0, width: '40px' }}
                    animate={{ opacity: 1, width: '100%' }}
                    exit={{ opacity: 0, width: '40px' }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute inset-y-2 right-2 left-2 z-50 flex items-center bg-[var(--bg-app)] md:hidden rounded-xl border border-[var(--glass-border)] shadow-xl overflow-hidden"
                >
                    <button 
                        onClick={() => setIsMobileOpen(false)}
                        className="p-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    
                    <input
                        ref={mobileInputRef}
                        type="text"
                        className={inputClasses}
                        placeholder="Search..."
                        value={localValue}
                        onChange={handleChange}
                        autoFocus
                    />
                    
                    {localValue && (
                        <button
                            onClick={handleClear}
                            className="p-3 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        >
                            <X size={16} />
                        </button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    </>
  );
});

