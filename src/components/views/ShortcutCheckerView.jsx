/**
 * ShortcutCheckerView - Check if a hotkey is already in use
 * 
 * Features:
 * - Real-time conflict detection for Raycast and System hotkeys
 * - Visual feedback for available/taken shortcuts
 * - Click to navigate to conflicting shortcut
 * - Support for modifier keys (cmd, ctrl, opt, shift, hyper)
 * 
 * Note: Leader Key sequences are a different paradigm (key chains, not hotkeys)
 * and aliases are text-based - neither are checked here.
 */

import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    CheckCircle, 
    AlertTriangle, 
    Command, 
    Keyboard, 
    ChevronRight,
    X,
    Diamond,
    Sparkles
} from 'lucide-react';

// Modifier key mapping for display
const MODIFIER_SYMBOLS = {
    cmd: { symbol: '⌘', label: 'Command' },
    command: { symbol: '⌘', label: 'Command' },
    ctrl: { symbol: '⌃', label: 'Control' },
    control: { symbol: '⌃', label: 'Control' },
    opt: { symbol: '⌥', label: 'Option' },
    option: { symbol: '⌥', label: 'Option' },
    alt: { symbol: '⌥', label: 'Option' },
    shift: { symbol: '⇧', label: 'Shift' },
    hyper: { symbol: '◆', label: 'Hyper' },
};

// Parse a key string like "cmd+shift+a" into normalized parts
const parseKeyString = (keyString) => {
    if (!keyString) return { modifiers: [], key: '' };
    
    const parts = keyString.toLowerCase().split('+').map(p => p.trim()).filter(Boolean);
    const modifiers = [];
    let key = '';
    
    parts.forEach(part => {
        if (MODIFIER_SYMBOLS[part]) {
            // Normalize modifier names
            if (part === 'command') modifiers.push('cmd');
            else if (part === 'control') modifiers.push('ctrl');
            else if (part === 'option' || part === 'alt') modifiers.push('opt');
            else modifiers.push(part);
        } else {
            key = part;
        }
    });
    
    return { modifiers: modifiers.sort(), key };
};

// Check if two key combinations match
const keyMatchesQuery = (shortcutKeys, queryModifiers, queryKey) => {
    if (!shortcutKeys || !queryKey) return false;
    
    const parsed = parseKeyString(shortcutKeys);
    
    // Key must match
    if (parsed.key !== queryKey.toLowerCase()) return false;
    
    // Modifiers must match (both sorted)
    if (queryModifiers.length !== parsed.modifiers.length) return false;
    
    return queryModifiers.every((mod, i) => mod === parsed.modifiers[i]);
};

// Key badge component
const KeyBadge = memo(function KeyBadge({ keyStr, isModifier = false, isHyper = false }) {
    if (isHyper) {
        return (
            <span className="px-2 py-1 bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/50 rounded-lg text-sm font-medium text-purple-300 flex items-center gap-1">
                <Diamond size={12} /> Hyper
            </span>
        );
    }
    
    const modifier = MODIFIER_SYMBOLS[keyStr?.toLowerCase()];
    
    return (
        <span className={`
            px-2 py-1 rounded-lg text-sm font-medium
            ${isModifier 
                ? 'bg-[var(--surface-highlight)] border border-[var(--surface-border-strong)] text-[var(--text-secondary)]'
                : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/40 text-blue-400'
            }
        `}>
            {modifier ? modifier.symbol : keyStr}
        </span>
    );
});

// Result card component
const ResultCard = memo(function ResultCard({ shortcut, type, onNavigate }) {
    const typeConfig = {
        raycast: { 
            icon: Command, 
            label: 'Raycast', 
            color: 'from-orange-500 to-red-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/30'
        },
        system: { 
            icon: Keyboard, 
            label: 'System', 
            color: 'from-blue-500 to-cyan-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30'
        }
    };
    
    const config = typeConfig[type];
    const Icon = config.icon;
    
    // Get display info based on type
    const getDisplayInfo = () => {
        if (type === 'raycast') {
            return {
                name: shortcut.commandName || 'Unnamed',
                keys: shortcut.keys || '',
                description: shortcut.category || shortcut.notes || ''
            };
        } else {
            return {
                name: shortcut.action || 'Unnamed',
                keys: shortcut.keys || '',
                description: shortcut.app || shortcut.functionality || shortcut.notes || ''
            };
        }
    };
    
    const info = getDisplayInfo();
    
    return (
        <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={() => onNavigate(shortcut, type)}
            className={`
                w-full p-4 rounded-xl ${config.bg} ${config.border} border
                hover:scale-[1.02] transition-transform cursor-pointer
                flex items-center gap-4 text-left group
            `}
        >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className="text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="font-medium text-[var(--text-primary)] truncate">
                    {info.name}
                </div>
                <div className="text-sm text-[var(--text-muted)] truncate">
                    {info.keys && <span className="font-mono">{info.keys}</span>}
                    {info.keys && info.description && ' · '}
                    {info.description}
                </div>
            </div>
            
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <span className="text-xs uppercase tracking-wider hidden sm:block">{config.label}</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
        </motion.button>
    );
});

// Main view component
export const ShortcutCheckerView = memo(function ShortcutCheckerView({ 
    raycastShortcuts = [], 
    systemShortcuts = [],
    onNavigate // (shortcut, type) => void - navigate to shortcut
}) {
    // Hotkey state
    const [modifiers, setModifiers] = useState([]);
    const [key, setKey] = useState('');
    
    const inputRef = useRef(null);
    
    // Toggle modifier
    const toggleModifier = useCallback((mod) => {
        setModifiers(prev => 
            prev.includes(mod) 
                ? prev.filter(m => m !== mod)
                : [...prev, mod].sort()
        );
    }, []);
    
    // Handle key input
    const handleKeyChange = useCallback((e) => {
        const value = e.target.value.toLowerCase().slice(-1); // Only take last char
        setKey(value);
    }, []);
    
    // Clear all
    const clearAll = useCallback(() => {
        setModifiers([]);
        setKey('');
    }, []);
    
    // Find matching shortcuts
    const matches = useMemo(() => {
        const results = {
            raycast: [],
            system: []
        };
        
        // Need at least a key to search
        if (!key) return results;
        
        const sortedMods = [...modifiers].sort();
        
        // Check Raycast shortcuts (only those with keys, not aliases)
        raycastShortcuts.forEach(shortcut => {
            if (!shortcut.archived && shortcut.keys && keyMatchesQuery(shortcut.keys, sortedMods, key)) {
                results.raycast.push(shortcut);
            }
        });
        
        // Check System shortcuts
        systemShortcuts.forEach(shortcut => {
            if (!shortcut.archived && keyMatchesQuery(shortcut.keys, sortedMods, key)) {
                results.system.push(shortcut);
            }
        });
        
        return results;
    }, [modifiers, key, raycastShortcuts, systemShortcuts]);
    
    const totalMatches = matches.raycast.length + matches.system.length;
    const hasQuery = !!key;
    
    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    
    return (
        <div className="h-full w-full flex flex-col items-center p-4 sm:p-6 lg:p-12 !pb-32 overflow-y-auto">
            <div className="w-full max-w-2xl flex flex-col gap-6 sm:gap-8">
                
                {/* Subtitle only - header is in the top bar */}
                <div className="text-center">
                    <p className="text-sm text-[var(--text-secondary)]">
                        Check if a hotkey is already in use across Raycast and System shortcuts
                    </p>
                </div>
                
                {/* Input Area */}
                <div className="space-y-4">
                    {/* Modifier Toggles */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {['cmd', 'ctrl', 'opt', 'shift', 'hyper'].map(mod => (
                            <button
                                key={mod}
                                onClick={() => toggleModifier(mod)}
                                className={`
                                    px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-sm font-medium transition-all
                                    border flex items-center gap-1.5 sm:gap-2
                                    ${modifiers.includes(mod)
                                        ? mod === 'hyper'
                                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                            : 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                        : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                                    }
                                `}
                            >
                                {mod === 'hyper' ? (
                                    <Diamond size={14} />
                                ) : (
                                    <span>{MODIFIER_SYMBOLS[mod]?.symbol}</span>
                                )}
                                {/* Full label on sm+, hidden on mobile */}
                                <span className="hidden sm:inline capitalize">
                                    {mod === 'cmd' ? 'Command' : mod === 'ctrl' ? 'Control' : mod === 'opt' ? 'Option' : mod}
                                </span>
                            </button>
                        ))}
                    </div>
                    
                    {/* Key Input */}
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={key}
                            onChange={handleKeyChange}
                            placeholder="Type a key"
                            className="
                                w-full px-6 py-4 rounded-2xl text-center text-2xl font-mono
                                bg-[var(--glass-bg)] border-2 border-[var(--glass-border)]
                                text-[var(--text-primary)] placeholder-[var(--text-muted)]
                                focus:outline-none focus:border-blue-500/50
                                transition-colors
                            "
                            maxLength={1}
                        />
                        {(modifiers.length > 0 || key) && (
                            <button
                                onClick={clearAll}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                    
                    {/* Visual Preview */}
                    {(modifiers.length > 0 || key) && (
                        <div className="flex justify-center items-center gap-2 flex-wrap">
                            {modifiers.map(mod => (
                                <KeyBadge key={mod} keyStr={mod} isModifier isHyper={mod === 'hyper'} />
                            ))}
                            {modifiers.length > 0 && key && <span className="text-[var(--text-muted)]">+</span>}
                            {key && <KeyBadge keyStr={key.toUpperCase()} />}
                        </div>
                    )}
                </div>
                
                {/* Results */}
                <div className="space-y-4">
                    <AnimatePresence mode="wait">
                        {!hasQuery ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-12 text-[var(--text-muted)]"
                            >
                                <Search size={40} className="mx-auto mb-4 opacity-50" />
                                <p>Select modifiers and type a key to check for conflicts</p>
                            </motion.div>
                        ) : totalMatches === 0 ? (
                            <motion.div
                                key="available"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="text-center py-12"
                            >
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 flex items-center justify-center">
                                    <CheckCircle size={32} className="text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-emerald-400 mb-2">
                                    Available!
                                </h3>
                                <p className="text-[var(--text-muted)]">
                                    This hotkey is not currently in use
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="conflicts"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                {/* Conflict Header */}
                                <div className="flex items-center justify-center gap-3 py-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                                        <AlertTriangle size={20} className="text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-amber-400">
                                            {totalMatches} Conflict{totalMatches > 1 ? 's' : ''} Found
                                        </h3>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            Click to view shortcut
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Results List */}
                                <div className="space-y-3">
                                    {matches.raycast.map(shortcut => (
                                        <ResultCard 
                                            key={shortcut.id} 
                                            shortcut={shortcut} 
                                            type="raycast" 
                                            onNavigate={onNavigate}
                                        />
                                    ))}
                                    {matches.system.map(shortcut => (
                                        <ResultCard 
                                            key={shortcut.id} 
                                            shortcut={shortcut} 
                                            type="system" 
                                            onNavigate={onNavigate}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                {/* Info Note */}
                <div className="flex items-start gap-3 p-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-sm">
                    <Sparkles size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[var(--text-muted)]">
                        <strong className="text-[var(--text-secondary)]">Note:</strong> This checks <strong>Raycast</strong> and <strong>System</strong> hotkeys only. 
                        Leader Key sequences use a different input method and are managed separately.
                    </div>
                </div>
            </div>
        </div>
    );
});
