import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react';
import { STANDARD_CATEGORIES, getCategoryIcon } from '../../config/categories';
import { clsx } from 'clsx';

export function CategorySelector({ value, onChange, placeholder = "Select category..." }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter categories based on search
    const filteredCategories = STANDARD_CATEGORIES.filter(cat => 
        cat.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (category) => {
        onChange(category);
        setIsOpen(false);
        setSearch('');
    };

    const handleCreate = () => {
        if (search.trim()) {
            onChange(search.trim());
            setIsOpen(false);
            setSearch('');
        }
    };



    return (
        <div className="relative" ref={containerRef}>
            <div
                className="w-full flex items-center justify-between px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg cursor-pointer hover:bg-[var(--glass-bg-hover)] transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {value ? (
                        <>
                            {(() => {
                                const Icon = getCategoryIcon(value);
                                return <Icon size={16} className="text-blue-400 flex-shrink-0" />;
                            })()}
                            <span className="text-[var(--text-primary)] truncate">{value}</span>
                        </>
                    ) : (
                        <span className="text-[var(--text-muted)]">{placeholder}</span>
                    )}
                </div>
                <ChevronsUpDown size={14} className="text-[var(--text-muted)] flex-shrink-0" />
            </div>

            {isOpen && (
                <div className="absolute z-[9999] w-full mt-1 bg-[var(--bg-card)] border border-[var(--glass-border)] rounded-lg shadow-2xl max-h-80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-[var(--glass-border)]">
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-[var(--input-bg)] rounded-md border border-[var(--input-border)]">
                            <Search size={14} className="text-[var(--text-muted)]" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search or create..."
                                className="bg-transparent border-none outline-none text-xs w-full text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                                autoFocus
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto p-1 custom-scrollbar">
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map(cat => {
                                const Icon = getCategoryIcon(cat);
                                const isSelected = value === cat;
                                return (
                                    <div
                                        key={cat}
                                        onClick={() => handleSelect(cat)}
                                        className={clsx(
                                            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors",
                                            isSelected 
                                                ? "bg-blue-500/10 text-blue-400" 
                                                : "text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)]"
                                        )}
                                    >
                                        <Icon size={14} className={isSelected ? "text-blue-400" : "text-[var(--text-muted)]"} />
                                        <span className="flex-1 truncate">{cat}</span>
                                        {isSelected && <Check size={14} />}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-2 py-4 text-center text-xs text-[var(--text-muted)]">
                                No matching categories
                            </div>
                        )}
                        
                        {search && !filteredCategories.includes(search) && (
                            <div
                                onClick={handleCreate}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm text-blue-400 hover:bg-blue-500/10 border-t border-[var(--glass-border)] mt-1"
                            >
                                <Plus size={14} />
                                <span className="flex-1 truncate">Create "{search}"</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
