import { GlassCard } from '../ui/GlassPanel';
import { motion } from 'framer-motion';
import { useMemo, useEffect, memo } from 'react';
import { Monitor, AppWindow, Keyboard, Settings, Camera, Folder, Zap, Volume2, Layout, Terminal, Box, Edit2, Pencil } from 'lucide-react';
// Icon mapping for categories (Removed, now using centralized config)
import { getCategoryIcon } from '../../config/categories';
import { getAppIcon } from '../../config/icons';

// Diamond icon for Hyper key
const HyperIcon = memo(function HyperIcon({ size = 12, className = "" }) {
  return (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 16 16" 
        fill="currentColor"
        className={className}
    >
        <path d="M8 0L16 8L8 16L0 8L8 0Z" />
    </svg>
  );
});

// Key symbol mapping - modifiers
const modifierSymbols = {
    'Cmd': '⌘',
    'Command': '⌘',
    'Ctrl': '⌃',
    'Control': '⌃',
    'Option': '⌥',
    'Alt': '⌥',
    'Shift': '⇧',
};

// Key symbol mapping - special keys
const specialKeySymbols = {
    'Left': '←',
    'Right': '→',
    'Up': '↑',
    'Down': '↓',
    'Space': '␣',
    'Enter': '⏎',
    'Return': '⏎',
    'Tab': '⇥',
    'Backspace': '⌫',
    'Delete': '⌦',
    'Escape': 'ESC',
    'Esc': 'ESC',
    'Minus': '−',
    'Plus': '+',
    'Equals': '=',
};

// Modifiers list for styling
const modifiers = ['Cmd', 'Command', 'Ctrl', 'Control', 'Option', 'Alt', 'Shift'];

// App Icon component with fallback - supports custom iconUrl
const AppIcon = memo(function AppIcon({ name, customUrl, size = 24 }) {
    // Use custom URL if provided, otherwise look up from global config
    const iconUrl = customUrl || getAppIcon(name);
    
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
});

// Special action patterns to render as badges
const specialActionPatterns = [
    { pattern: /^tap twice$|^double tap$|^2x tap$/i, icon: '⟲', label: 'Tap ×2', color: 'from-amber-500/30 to-orange-500/30', border: 'border-amber-500/50', text: 'text-amber-700 dark:text-amber-300' },
    { pattern: /^triple tap$|^3x tap$/i, icon: '⟲', label: 'Tap ×3', color: 'from-amber-500/30 to-orange-500/30', border: 'border-amber-500/50', text: 'text-amber-700 dark:text-amber-300' },
    { pattern: /^hold$|^long press$/i, icon: '⏱', label: 'Hold', color: 'from-purple-500/30 to-fuchsia-500/30', border: 'border-purple-500/50', text: 'text-purple-700 dark:text-purple-300' },
];

// Check if a key part matches a special action
const getSpecialAction = (keyPart) => {
    for (const action of specialActionPatterns) {
        if (action.pattern.test(keyPart.trim())) {
            return action;
        }
    }
    return null;
};

// Helper to render keys visually - defined outside component to avoid recreation
const KeyVisual = memo(function KeyVisual({ keys }) {
    if (!keys) return <span className="text-[var(--text-muted)] text-xs">No key</span>;
    
    // If there's no + separator, check if it's a special pattern or display as single badge
    if (!keys.includes('+')) {
        const specialAction = getSpecialAction(keys);
        if (specialAction) {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r ${specialAction.color} rounded-full text-[10px] font-medium ${specialAction.text} ${specialAction.border}`}>
                <span>{specialAction.icon}</span>
                <span>{specialAction.label}</span>
            </span>
        );
        }
        return (
            <span className="px-2 py-1 bg-[var(--surface-highlight)] border border-[var(--surface-border-strong)] text-xs font-medium text-[var(--text-primary)] shadow-sm rounded-lg">
            {keys}
        </span>
        );
    }
    
    const parts = keys.split('+');
    
    return (
        <div className="flex gap-1 flex-wrap items-center">
            {parts.map((k, i) => {
                const trimmedKey = k.trim();
                const isHyper = trimmedKey.toLowerCase() === 'hyper';
                const isModifier = modifiers.includes(trimmedKey);
                const modSymbol = modifierSymbols[trimmedKey];
                const specialSymbol = specialKeySymbols[trimmedKey];
                
                // Check for special action patterns (like "tap twice")
                const specialAction = getSpecialAction(trimmedKey);
                if (specialAction) {
                return (
                    <span 
                        key={i} 
                        className={`inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r ${specialAction.color} rounded-full text-[10px] font-medium ${specialAction.text} ${specialAction.border}`}
                    >
                        <span>{specialAction.icon}</span>
                        <span>{specialAction.label}</span>
                    </span>
                );
            }

                // Check if it's an "or" key like "h/j/k/l"
                if (trimmedKey.includes('/')) {
                    const orKeys = trimmedKey.split('/');
                    return (
                        <span key={i} className="flex items-center gap-0.5">
                        {orKeys.map((orKey, j) => (
                            <span key={j} className="flex items-center">
                                <span className="px-1.5 py-1 min-w-[22px] text-center bg-white border border-neutral-200 dark:bg-white/15 dark:border-white/25 text-xs font-mono text-neutral-800 dark:text-white font-semibold rounded shadow-sm">
                                    {orKey}
                                </span>
                                {j < orKeys.length - 1 && (
                                    <span className="text-[var(--text-muted)] text-xs mx-0.5">/</span>
                                )}
                            </span>
                        ))}
                    </span>
                    );
                }

                if (isHyper) {
                    return (
                        <span 
                            key={i} 
                            className="relative group/hyper px-1.5 py-1 min-w-[28px] flex items-center justify-center gap-1 bg-gradient-to-br from-cyan-500/30 to-teal-500/30 rounded shadow-sm border border-cyan-500/50 text-xs font-mono text-cyan-700 dark:text-cyan-300"
                        >
                            <HyperIcon size={10} />
                            {/* Custom tooltip */}
                            <span className="absolute bottom-full left-0 mb-2 px-3 py-1.5 bg-neutral-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/hyper:opacity-100 transition-opacity pointer-events-none border border-white/20 shadow-xl z-50">
                                Hyper = ⌃⇧⌥⌘
                            </span>
                        </span>
                    );
                }

                if (isModifier) {
                    return (
                        <span 
                            key={i} 
                            className="px-1.5 py-1 min-w-[24px] text-center bg-indigo-500/15 rounded shadow-sm border border-indigo-500/30 text-xs font-mono text-indigo-700 dark:text-indigo-300"
                        >
                            {modSymbol || trimmedKey}
                        </span>
                    );
                }
                
                // Normal key - check for special symbol first
                const displayKey = specialSymbol || trimmedKey;
                return (
                    <span key={i} className="px-1.5 py-1 min-w-[22px] text-center bg-white border border-neutral-200 dark:bg-white/15 dark:border-white/25 text-xs font-mono text-neutral-800 dark:text-white font-semibold rounded shadow-sm">
                    {displayKey}
                </span>
                );
            })}
        </div>
    );
});

export function SystemView({ shortcuts, apps = [], onEdit, onEditGroup, highlightedShortcutId }) {
    // Create app lookup map
    const appMap = useMemo(() => {
        return apps.reduce((acc, app) => {
            acc[app.id] = app;
            return acc;
        }, {});
    }, [apps]);

    // Handle scrolling to highlighted shortcut
    useEffect(() => {
        if (highlightedShortcutId) {
            // Small delay to ensure rendering is complete
            setTimeout(() => {
                const element = document.getElementById(`shortcut-${highlightedShortcutId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Add a temporary highlight effect using keyframes or class manipulation
                    element.classList.add('highlight-pulse');
                    setTimeout(() => element.classList.remove('highlight-pulse'), 2000);
                }
            }, 100);
        }
    }, [highlightedShortcutId]);

    // Dynamically group by category/functionality from the data
    const groups = shortcuts.reduce((acc, curr) => {
        let cat = curr.category || 'Uncategorized';
        // Normalize to Title Case to merge "pasting" and "Pasting"
        cat = cat.charAt(0).toUpperCase() + cat.slice(1);
        
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(curr);
        return acc;
    }, {});

    // Sort categories alphabetically
    const sortedCategories = Object.keys(groups).sort();

    return (
        <div className="h-full overflow-y-auto custom-scrollbar pr-2 pb-32">
            <div className="grid grid-cols-1 gap-8">
                {sortedCategories.map((groupName) => {
                    const items = groups[groupName];
                    const IconComponent = getCategoryIcon(groupName);
                    
                    // Create a virtual group object for editing
                    const groupData = {
                        id: `system_cat_${groupName}`,
                        type: 'systemCategory',
                        name: groupName,
                        key: groupName,
                        iconType: IconComponent.name
                    };

                    return (
                        <div key={groupName}>
                            <div 
                                className="sticky top-0 z-10 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-md flex items-center gap-2 mb-4 group/header cursor-pointer hover:bg-[var(--glass-bg-hover)] rounded-lg py-2 px-3 -mx-3 transition-colors border-b border-[var(--glass-border)]"
                                onClick={() => onEditGroup && onEditGroup(groupData)}
                            >
                                <div className="relative">
                                    <IconComponent size={18} className="text-blue-600 dark:text-blue-400" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/60 backdrop-blur-[1px] rounded opacity-0 group-hover/header:opacity-100 transition-opacity">
                                        <Pencil size={10} className="text-black dark:text-white" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)] transition-colors">{groupName}</h3>
                                <span className="text-xs bg-[var(--surface-highlight)] border border-[var(--surface-border-strong)] px-2 py-0.5 rounded-full text-[var(--text-secondary)]">{items.length}</span>
                                <div className="ml-auto opacity-0 group-hover/header:opacity-100 transition-opacity p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
                                    <Settings size={14} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                {/* Desktop Header */}
                                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                    <div className="col-span-3">Key Combo</div>
                                    <div className="col-span-3">App</div>
                                    <div className="col-span-4">Action</div>
                                    <div className="col-span-2">Notes</div>
                                </div>
                                
                                {items.map((item, i) => (
                                    <motion.div
                                        key={item.id}
                                        id={`shortcut-${item.id}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ 
                                            opacity: 1, 
                                            y: 0,
                                            scale: highlightedShortcutId === item.id ? 1.02 : 1,
                                            backgroundColor: highlightedShortcutId === item.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0)'
                                        }}
                                        transition={{ delay: i * 0.02 }}
                                        className={highlightedShortcutId === item.id ? 'z-20 ring-2 ring-blue-500/50 rounded-xl' : ''}
                                    >
                                        <GlassCard 
                                            className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-3 hover:bg-[var(--glass-bg-hover)] transition-colors cursor-pointer group relative"
                                            onClick={() => onEdit && onEdit(item)}
                                        >
                                            {/* Edit indicator */}
                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer z-10">
                                                <Edit2 size={14} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" />
                                            </div>
                                            
                                            {/* Mobile: Top Row with App and Action */}
                                            <div className="md:col-span-3 md:order-2 flex items-center gap-2">
                                                {(() => {
                                                    const linkedApp = appMap[item.appId];
                                                    const appName = linkedApp?.name || item.appOrContext || '—';
                                                    const finalIconUrl = linkedApp?.iconUrl || item.iconUrl;
                                                    return (
                                                        <>
                                                            <div 
                                                                className="w-8 h-8 md:w-6 md:h-6 rounded bg-[var(--input-bg)] flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer relative group/icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onEdit && onEdit(item);
                                                                }}
                                                            >
                                                                <AppIcon name={appName} customUrl={finalIconUrl} size={18} />
                                                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/60 rounded opacity-0 group-hover/icon:opacity-100 transition-opacity">
                                                                    <Edit2 size={10} className="text-black dark:text-white" />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col md:hidden">
                                                                <span className="font-medium text-sm">{item.action}</span>
                                                                <span className="text-xs text-[var(--text-muted)]">{appName}</span>
                                                            </div>
                                                            <span className="font-medium truncate hidden md:block">{appName}</span>
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                            {/* Key Combo - Prominent on Mobile */}
                                            <div className="md:col-span-3 md:order-1 mt-2 md:mt-0">
                                                <KeyVisual keys={item.keys} />
                                            </div>

                                            {/* Desktop Action / Mobile Note */}
                                            <div className="md:col-span-4 md:order-3 text-[var(--text-secondary)] hidden md:block">
                                                {item.action}
                                            </div>

                                            {/* Notes: Bottom on mobile */}
                                            <div className="md:col-span-2 md:order-4 text-xs text-[var(--text-muted)] line-clamp-2 md:pr-6 mt-1 md:mt-0">
                                                {item.notes || (
                                                    <span className="md:hidden inline-block italic opacity-50">No notes</span>
                                                )}
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
