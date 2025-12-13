import { useState, useRef, useEffect } from 'react';
import { Box, Search, ChevronDown, X, Plus, Check } from 'lucide-react';

// App icon component with fallback
const AppIcon = ({ iconUrl, name, size = 24 }) => {
    if (iconUrl) {
        return (
            <img 
                src={iconUrl} 
                alt={name}
                className="rounded object-contain"
                style={{ width: size, height: size }}
                onError={(e) => {
                    e.target.style.display = 'none';
                }}
            />
        );
    }
    
    return <Box size={size * 0.7} className="text-[var(--text-muted)]" />;
};

export function AppSelector({ 
    apps = [], 
    value = null, // appId or null
    onChange, // (appId, app) => void
    onCreateNew, // optional - if provided, shows "Add to Library" option
    label = "Link to App",
    placeholder = "Search apps or type new...",
    showIcon = true
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    
    // Get selected app details
    const selectedApp = apps.find(a => a.id === value);
    
    // Filter apps based on search
    const filteredApps = apps.filter(app => 
        app.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    // Check if search query matches no existing apps (for "Add new")
    const canAddNew = onCreateNew && 
        searchQuery.trim() && 
        !apps.some(a => a.name?.toLowerCase() === searchQuery.trim().toLowerCase());
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }
        
        const totalItems = filteredApps.length + (canAddNew ? 1 : 0);
        
        switch (e.key) {
            case 'ArrowDown':
                setHighlightedIndex(prev => Math.min(prev + 1, totalItems - 1));
                e.preventDefault();
                break;
            case 'ArrowUp':
                setHighlightedIndex(prev => Math.max(prev - 1, 0));
                e.preventDefault();
                break;
            case 'Enter':
                if (highlightedIndex < filteredApps.length) {
                    selectApp(filteredApps[highlightedIndex]);
                } else if (canAddNew) {
                    handleAddNew();
                }
                e.preventDefault();
                break;
            case 'Escape':
                setIsOpen(false);
                e.preventDefault();
                break;
        }
    };
    
    const selectApp = (app) => {
        onChange(app.id, app);
        setSearchQuery('');
        setIsOpen(false);
    };
    
    const clearSelection = () => {
        onChange(null, null);
        setSearchQuery('');
    };
    
    const handleAddNew = () => {
        if (onCreateNew && searchQuery.trim()) {
            onCreateNew(searchQuery.trim());
            setSearchQuery('');
            setIsOpen(false);
        }
    };
    
    return (
        <div className="flex flex-col gap-2" ref={containerRef}>
            <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
            
            <div className="relative">
                {/* Selected app display / search input */}
                <div 
                    className={`
                        flex items-center gap-2 px-3 py-2.5 
                        bg-[var(--input-bg)] border rounded-lg cursor-pointer
                        transition-all
                        ${isOpen ? 'border-blue-500/50 ring-1 ring-blue-500/30' : 'border-[var(--input-border)] hover:border-[var(--input-focus-border)]'}
                    `}
                    onClick={() => {
                        setIsOpen(true);
                        inputRef.current?.focus();
                    }}
                >
                    {selectedApp && !isOpen ? (
                        <>
                            {showIcon && (
                                <div className="w-6 h-6 rounded bg-[var(--input-bg)] flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <AppIcon iconUrl={selectedApp.iconUrl} name={selectedApp.name} size={20} />
                                </div>
                            )}
                            <span className="flex-1 text-[var(--text-primary)]">{selectedApp.name}</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); clearSelection(); }}
                                className="p-0.5 hover:bg-[var(--glass-bg-hover)] rounded transition-colors"
                            >
                                <X size={14} className="text-[var(--text-muted)]" />
                            </button>
                        </>
                    ) : (
                        <>
                            <Search size={16} className="text-[var(--text-muted)] flex-shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setHighlightedIndex(0);
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setIsOpen(true)}
                                placeholder={placeholder}
                                className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none text-sm"
                            />
                            <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </>
                    )}
                </div>
                
                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-app)] backdrop-blur-lg border border-[var(--glass-border)] rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                        {filteredApps.length === 0 && !canAddNew ? (
                            <div className="px-4 py-3 text-[var(--text-muted)] text-sm text-center">
                                {searchQuery ? 'No apps found' : 'No apps in library'}
                            </div>
                        ) : (
                            <>
                                {filteredApps.map((app, index) => (
                                    <div
                                        key={app.id}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors
                                            ${highlightedIndex === index ? 'bg-blue-500/20' : 'hover:bg-[var(--glass-bg-hover)]'}
                                            ${app.id === value ? 'bg-blue-500/10' : ''}
                                        `}
                                        onClick={() => selectApp(app)}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                    >
                                        {showIcon && (
                                            <div className="w-8 h-8 rounded-lg bg-[var(--input-bg)] flex items-center justify-center overflow-hidden flex-shrink-0">
                                                <AppIcon iconUrl={app.iconUrl} name={app.name} size={24} />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[var(--text-primary)] text-sm font-medium truncate">{app.name}</p>
                                            {app.category && (
                                                <p className="text-[var(--text-muted)] text-xs truncate">{app.category}</p>
                                            )}
                                        </div>
                                        {app.id === value && (
                                            <Check size={16} className="text-blue-400 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                                
                                {/* Add new option */}
                                {canAddNew && (
                                    <div
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors
                                            border-t border-[var(--glass-border)]
                                            ${highlightedIndex === filteredApps.length ? 'bg-green-500/20' : 'hover:bg-[var(--glass-bg-hover)]'}
                                        `}
                                        onClick={handleAddNew}
                                        onMouseEnter={() => setHighlightedIndex(filteredApps.length)}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                            <Plus size={18} className="text-green-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-green-400 text-sm font-medium">Add "{searchQuery.trim()}" to Library</p>
                                            <p className="text-[var(--text-muted)] text-xs">Create new app entry</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
            
            {/* Helper text */}
            {selectedApp && (
                <p className="text-xs text-[var(--text-muted)]">
                    Icon and details inherited from Apps Library
                </p>
            )}
        </div>
    );
}
