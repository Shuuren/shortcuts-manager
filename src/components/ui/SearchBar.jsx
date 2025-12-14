import { Search, X } from 'lucide-react';
import { useRef, useEffect, useCallback, useState, memo } from 'react';

/**
 * SearchBar with debounced input
 * 
 * Features:
 * - Local state for immediate UI responsiveness
 * - Debounced onChange callback (200ms) 
 * - Cmd+K to focus/blur
 * - Escape to blur
 */
export const SearchBar = memo(function SearchBar({ value, onChange, debounceMs = 200 }) {
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  
  // Local state for immediate UI feedback
  const [localValue, setLocalValue] = useState(value);
  
  // Sync local value when prop value changes (e.g., from clearing)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle Cmd+K to toggle search bar focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (document.activeElement === inputRef.current) {
          inputRef.current.blur();
        } else {
          inputRef.current?.focus();
        }
      }
      // Also allow Escape to blur the search
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced change handler
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    
    // Update local state immediately for responsive UI
    setLocalValue(newValue);
    
    // Clear existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce the actual onChange callback
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
    // Clear immediately without debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className="relative w-full max-w-md group">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--text-muted)] group-focus-within:text-[var(--text-primary)] transition-colors">
        <Search size={16} />
      </div>
      <input
        ref={inputRef}
        type="text"
        className="input-search pl-10 pr-12" 
        placeholder="Search" 
        value={localValue}
        onChange={handleChange}
      />
      
      {/* Shortcut Hint - Only show if empty */}
      {!localValue && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-[var(--glass-border)] bg-[var(--surface-highlight)] px-1.5 font-mono text-[10px] font-medium text-[var(--text-muted)] opacity-50">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      )}

      {/* Clear Button - Shows when there is value */}
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          type="button"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
});

