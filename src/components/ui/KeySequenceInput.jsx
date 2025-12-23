import { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * KeySequenceInput - Visual key sequence builder for Leader Key shortcuts
 * 
 * Instead of typing "a → b → c", users:
 * 1. See existing keys as visual badges
 * 2. Type single letters to add new keys
 * 3. Click X on any key to remove it
 * 
 * The component handles the complexity of the arrow syntax internally.
 */
export function KeySequenceInput({ 
    value = [], // Array like ['Leader', 'a', 'b'] 
    onChange, 
    prefixKeys = [], // Keys that are locked (from current group context)
    error,
    disabled = false 
}) {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);
    
    // Keys to display (excluding 'Leader' prefix if present)
    const displayKeys = value[0] === 'Leader' ? value.slice(1) : value;
    
    // Number of keys that are locked (from group context)
    const lockedCount = prefixKeys.length;
    
    const handleKeyDown = (e) => {
        if (disabled) return;
        
        // Allow backspace to remove last key if input is empty
        if (e.key === 'Backspace' && !inputValue && displayKeys.length > lockedCount) {
            e.preventDefault();
            const newKeys = displayKeys.slice(0, -1);
            onChange(['Leader', ...newKeys]);
        }
        
        // Prevent spaces and arrows from being typed - we handle those visually
        if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
        }
        
        // Enter or Tab adds the current input as a key
        if ((e.key === 'Enter' || e.key === 'Tab') && inputValue.trim()) {
            e.preventDefault();
            addKey(inputValue.trim());
        }
    };
    
    const handleInputChange = (e) => {
        const val = e.target.value.toLowerCase();
        
        // If it's a single valid character, add it immediately
        if (val.length === 1 && /^[a-z0-9]$/.test(val)) {
            addKey(val);
            return;
        }
        
        // For multi-character pastes or other input, store it temporarily
        setInputValue(val.replace(/[^a-z0-9]/g, ''));
    };
    
    const addKey = (key) => {
        const cleanKey = key.toLowerCase().slice(0, 1); // Only first char
        if (!cleanKey) return;
        
        const newKeys = [...displayKeys, cleanKey];
        onChange(['Leader', ...newKeys]);
        setInputValue('');
    };
    
    const removeKey = (index) => {
        if (disabled) return;
        // Can't remove locked prefix keys
        if (index < lockedCount) return;
        
        const newKeys = displayKeys.filter((_, i) => i !== index);
        onChange(['Leader', ...newKeys]);
    };
    
    const handleContainerClick = () => {
        if (!disabled) {
            inputRef.current?.focus();
        }
    };
    
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
                Key Sequence <span className="text-red-400">*</span>
            </label>
            
            <div 
                onClick={handleContainerClick}
                className={`
                    min-h-[52px] px-3 py-2 
                    bg-[var(--input-bg)] rounded-lg 
                    border transition-all cursor-text
                    flex items-center gap-2 flex-wrap
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500/30'}
                    ${error 
                        ? 'border-red-500 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30' 
                        : 'border-[var(--input-border)] focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/30'
                    }
                `}
            >
                {/* Rendered keys */}
                <AnimatePresence mode="popLayout">
                    {displayKeys.map((key, index) => {
                        const isLocked = index < lockedCount;
                        const isLast = index === displayKeys.length - 1 && !inputValue;
                        
                        return (
                            <motion.div 
                                key={`${key}-${index}`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center gap-1.5"
                            >
                                <div 
                                    className={`
                                        group flex items-center gap-1 
                                        px-2.5 py-1.5 rounded-lg font-mono font-semibold text-sm
                                        transition-all
                                        ${isLast && !isLocked
                                            ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-purple-600 dark:text-purple-200 border-2 border-purple-400/50 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                                            : isLocked
                                                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-400/40'
                                                : 'bg-[var(--surface-highlight)] text-[var(--text-primary)] border border-[var(--surface-border-strong)]'
                                        }
                                    `}
                                >
                                    <span>{key}</span>
                                    {!isLocked && !disabled && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeKey(index);
                                            }}
                                            className="ml-0.5 -mr-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                                        >
                                            <X size={12} className="text-red-400" />
                                        </button>
                                    )}
                                </div>
                                {index < displayKeys.length - 1 && (
                                    <ArrowRight size={14} className="text-[var(--text-muted)]" />
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                
                {/* Arrow before input if there are existing keys */}
                {displayKeys.length > 0 && (
                    <ArrowRight size={14} className="text-[var(--text-muted)]" />
                )}
                
                {/* Input for new keys */}
                <div className="flex items-center gap-1 flex-1 min-w-[60px]">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        placeholder={displayKeys.length === 0 ? "Type a key..." : "Next key..."}
                        className="
                            flex-1 min-w-0 px-1 py-1 
                            bg-transparent border-none outline-none
                            text-[var(--text-primary)] placeholder-[var(--text-muted)]
                            font-mono text-sm
                        "
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                    />
                </div>
            </div>
            
            {/* Helper text */}
            {!error && (
                <p className="text-xs text-[var(--text-muted)]">
                    {lockedCount > 0 
                        ? `Prefix ${prefixKeys.join(' → ')} is set from current group. Type the final key.`
                        : 'Type single letters to build the sequence. Press backspace to remove.'}
                </p>
            )}
            
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}
