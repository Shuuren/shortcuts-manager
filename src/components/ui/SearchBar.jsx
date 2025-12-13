import { Search, X } from 'lucide-react';
import { useRef, useEffect, useCallback, memo } from 'react';

export const SearchBar = memo(function SearchBar({ value, onChange }) {
  const inputRef = useRef(null);

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

  // Stable callback to prevent re-renders
  const handleChange = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--text-muted)]">
        <Search size={16} />
      </div>
      <input
        ref={inputRef}
        type="text"
        className="input-search pl-10 pr-10"
        placeholder="Search shortcuts... (⌘K)"
        value={value}
        onChange={handleChange}
      />
      {value && (
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

