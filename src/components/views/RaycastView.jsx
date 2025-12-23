import { GlassCard } from '../ui/GlassPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, memo } from 'react';
import { Command, Box, Type, ArrowRight, Edit2, Settings, Archive, ChevronDown, ChevronRight } from 'lucide-react';
import { getAppIcon } from '../../config/icons';


// Diamond icon for Hyper key (like Raycast uses)
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
const AppIcon = memo(function AppIcon({ name, customUrl, size = 24, className = "" }) {
    // Use custom URL if provided, otherwise look up from global config
    const iconUrl = customUrl || getAppIcon(name);
    
    if (iconUrl) {
        return (
            <img 
                src={iconUrl} 
                alt={name}
                className={`rounded object-contain ${className}`}
                style={{ width: size, height: size }}
                onError={(e) => {
                    e.target.style.display = 'none';
                }}
            />
        );
    }
    
    return <Box size={size * 0.7} className="text-[var(--text-muted)]" />;
});

// Helper to render keys visually with separate boxes
const KeyVisual = memo(function KeyVisual({ keys }) {
    if (!keys) return <span className="text-[var(--text-muted)] text-xs">No key</span>;
    
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
            <span className="px-2 py-1 bg-white border border-neutral-200 dark:bg-white/10 dark:border-white/20 text-xs font-medium text-neutral-800 dark:text-white/80 shadow-sm rounded-lg">
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
                    <span 
                        key={i} 
                        className="px-1.5 py-1 min-w-[22px] text-center bg-white border border-neutral-200 dark:bg-white/15 dark:border-white/25 text-xs font-mono text-neutral-800 dark:text-white font-semibold rounded shadow-sm"
                    >
                        {displayKey}
                    </span>
                );
            })}
        </div>
    );
});

export function RaycastView({ shortcuts, apps = [], onEdit, onEditGroup }) {
    // Collapse state for archive sections
    const [commandsArchiveOpen, setCommandsArchiveOpen] = useState(false);
    const [aliasesArchiveOpen, setAliasesArchiveOpen] = useState(false);
    
    // Create app lookup map
    const appMap = useMemo(() => {
        return apps.reduce((acc, app) => {
            acc[app.id] = app;
            return acc;
        }, {});
    }, [apps]);

    // Separate active vs archived first
    const activeShortcuts = shortcuts.filter(s => !s.archived);
    const archivedShortcuts = shortcuts.filter(s => s.archived);

    // Separate commands (those with keys or no aliasText) from aliases
    const commands = activeShortcuts.filter(s => s.keys || !s.aliasText);
    const aliases = activeShortcuts.filter(s => s.aliasText).sort((a, b) => 
        (a.commandName || '').localeCompare(b.commandName || '')
    );
    
    // Archived items (also sorted alphabetically)
    const archivedCommands = archivedShortcuts.filter(s => s.keys || !s.aliasText);
    const archivedAliases = archivedShortcuts.filter(s => s.aliasText).sort((a, b) => 
        (a.commandName || '').localeCompare(b.commandName || '')
    );

    // Group commands by category
    const groupedCommands = commands.reduce((acc, curr) => {
        const cat = curr.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(curr);
        return acc;
    }, {});

    // Sort categories alphabetically, then sort commands within each category by commandName
    const sortedCategories = Object.keys(groupedCommands).sort();
    sortedCategories.forEach(cat => {
        groupedCommands[cat].sort((a, b) => (a.commandName || '').localeCompare(b.commandName || ''));
    });

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 md:overflow-hidden overflow-y-auto custom-scrollbar">
            
            {/* Left Column: Commands grouped by Extension */}
            <div className="flex-none md:flex-1 flex flex-col gap-4 md:overflow-y-auto pl-1 pr-3 custom-scrollbar pt-4 pb-24">
                <div className="flex items-center gap-2 mb-2 sticky top-0 z-10 py-2 px-3 backdrop-blur-md bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl">
                     <Command size={16} className="text-blue-400" />
                     <h3 className="text-lg font-bold text-[var(--text-primary)]">Commands</h3>
                     <span className="text-xs bg-[var(--surface-highlight)] border border-[var(--surface-border-strong)] px-2 py-0.5 rounded-full text-[var(--text-secondary)]">{commands.length}</span>
                </div>

                {sortedCategories.map(category => {
                    // Create a virtual group object for editing
                    const groupData = {
                        id: `raycast_cat_${category}`,
                        type: 'raycastCategory',
                        name: category,
                        key: category,
                        iconUrl: getAppIcon(category)
                    };
                    
                    return (
                    <div key={category} className="mb-6">
                        <div 
                            className="flex items-center gap-2 mb-3 pl-1 group/header cursor-pointer hover:bg-[var(--glass-bg-hover)] rounded-lg py-1 px-2 -mx-2 transition-colors"
                            onClick={() => onEditGroup && onEditGroup(groupData)}
                        >
                            <div className="relative">
                                <AppIcon name={category} size={20} />
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/60 backdrop-blur-[1px] rounded opacity-0 group-hover/header:opacity-100 transition-opacity">
                                    <Edit2 size={10} className="text-black dark:text-white" />
                                </div>
                            </div>
                            <h4 className="text-sm uppercase tracking-wider text-[var(--text-muted)] font-bold group-hover/header:text-[var(--text-secondary)] transition-colors">{category}</h4>
                            <div className="ml-auto opacity-0 group-hover/header:opacity-100 transition-opacity p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
                                <Settings size={14} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {groupedCommands[category].map(item => {
                                const hasBoth = item.keys && item.aliasText;
                                const appName = item.commandName?.replace(/^(Open|Launch|Toggle)\s+/i, '').trim();
                                
                                // Resolve App Icon
                                const linkedApp = appMap[item.appId];
                                const finalIconUrl = linkedApp?.iconUrl || item.iconUrl; // Fallback to item.iconUrl or let AppIcon handle name lookup

                                
                                return (
                                    <motion.div 
                                        key={item.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        <GlassCard 
                                            className="flex flex-col gap-2 group cursor-pointer border-l-4 border-l-blue-500/0 hover:border-l-blue-500 transition-all relative"
                                            onClick={() => onEdit && onEdit(item)}
                                        >
                                            {/* Edit indicator */}
                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
                                                <Edit2 size={14} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" />
                                            </div>
                                            
                                            {/* Top row: Icon + Command Name */}
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-8 h-8 rounded bg-[var(--input-bg)] flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer relative group/icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEdit && onEdit(item);
                                                    }}
                                                >
                                                    <AppIcon name={appName} customUrl={finalIconUrl} size={24} />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded opacity-0 group-hover/icon:opacity-100 transition-opacity">
                                                        <Edit2 size={12} className="text-black dark:text-white" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0 pr-8">
                                                    <div className="font-medium truncate text-[var(--text-primary)]">{item.commandName}</div>
                                                </div>
                                            </div>
                                            
                                            {/* Bottom row: Keys and/or Alias - stacked if both exist */}
                                            {(item.keys || item.aliasText) && (
                                                <div className={`flex ${hasBoth ? 'flex-col gap-2' : 'flex-row'} mt-1 ml-11`}>
                                                    {item.keys && (
                                                        <KeyVisual keys={item.keys} />
                                                    )}
                                                    {item.aliasText && (
                                                        <span className="px-2 py-1 bg-purple-500/20 rounded text-xs font-mono text-purple-700 dark:text-purple-300 border border-purple-500/40 w-fit">
                                                            {item.aliasText}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </GlassCard>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                    );
                })}
                
                {/* Archived Commands Section */}
                {archivedCommands.length > 0 && (
                    <div className="mt-6 border-t border-[var(--glass-border)] pt-4">
                        <button
                            onClick={() => setCommandsArchiveOpen(!commandsArchiveOpen)}
                            className="flex items-center gap-2 w-full text-left py-2 px-3 rounded-lg hover:bg-[var(--glass-bg-hover)] transition-colors"
                        >
                            {commandsArchiveOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <Archive size={16} className="text-amber-500" />
                            <span className="font-medium text-[var(--text-secondary)]">Archive</span>
                            <span className="text-xs bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full text-amber-600 dark:text-amber-400">
                                {archivedCommands.length}
                            </span>
                        </button>
                        
                        <AnimatePresence>
                            {commandsArchiveOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 gap-3 mt-3">
                                        {archivedCommands.map(item => {
                                            const appName = item.commandName?.replace(/^(Open|Launch|Toggle)\s+/i, '').trim();
                                            const linkedApp = appMap[item.appId];
                                            const finalIconUrl = linkedApp?.iconUrl || item.iconUrl;
                                            
                                            return (
                                                <motion.div 
                                                    key={item.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                >
                                                    <GlassCard 
                                                        className="flex flex-col gap-2 group cursor-pointer border-l-4 border-l-amber-500/30 transition-all relative opacity-50 hover:opacity-80"
                                                        onClick={() => onEdit && onEdit(item)}
                                                    >
                                                        {/* Archived badge */}
                                                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 rounded-full text-[10px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                                            <Archive size={10} />
                                                            Archived
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-[var(--input-bg)] flex items-center justify-center flex-shrink-0 overflow-hidden grayscale">
                                                                <AppIcon name={appName} customUrl={finalIconUrl} size={24} />
                                                            </div>
                                                            <div className="flex-1 min-w-0 pr-16">
                                                                <div className="font-medium truncate text-[var(--text-muted)]">{item.commandName}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        {(item.keys || item.aliasText) && (
                                                            <div className="flex flex-col gap-2 mt-1 ml-11 opacity-60">
                                                                {item.keys && <KeyVisual keys={item.keys} />}
                                                                {item.aliasText && (
                                                                    <span className="px-2 py-1 bg-purple-500/10 rounded text-xs font-mono text-purple-500/70 border border-purple-500/20 w-fit">
                                                                        {item.aliasText}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </GlassCard>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="w-full h-px md:w-px md:h-auto bg-[var(--glass-border)] my-4 md:my-0 flex-shrink-0" />

            {/* Right Column: Aliases */}
            <div className="flex-none md:flex-1 flex flex-col gap-4 md:overflow-y-auto pl-1 pr-3 custom-scrollbar pt-4 pb-24">
                <div className="flex items-center gap-2 mb-2 sticky top-0 z-10 py-2 px-3 backdrop-blur-md bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl">
                     <Type size={16} className="text-purple-400" />
                     <h3 className="text-lg font-bold text-[var(--text-primary)]">Aliases</h3>
                     <span className="text-xs bg-[var(--surface-highlight)] border border-[var(--surface-border-strong)] px-2 py-0.5 rounded-full text-[var(--text-secondary)]">{aliases.length}</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {aliases.map((item) => {
                        const appName = item.commandName?.replace(/^(Open|Launch|Toggle)\s+/i, '').trim();
                        
                        // Resolve App Icon
                        const linkedApp = appMap[item.appId];
                        const finalIconUrl = linkedApp?.iconUrl || item.iconUrl;

                        return (
                            <motion.div 
                                key={item.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <GlassCard 
                                    className="group cursor-pointer border-l-4 border-l-purple-500/0 hover:border-l-purple-500 transition-all relative"
                                    onClick={() => onEdit && onEdit(item)}
                                >
                                    {/* Edit indicator */}
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
                                        <Edit2 size={14} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" />
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-8">
                                            <div 
                                                className="w-7 h-7 rounded bg-[var(--input-bg)] flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer relative group/icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit && onEdit(item);
                                                }}
                                            >
                                                <AppIcon name={appName} customUrl={finalIconUrl} size={20} />
                                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded opacity-0 group-hover/icon:opacity-100 transition-opacity">
                                                    <Edit2 size={10} className="text-black dark:text-white" />
                                                </div>
                                            </div>
                                            <span className="text-[var(--text-primary)] font-medium truncate">{item.commandName}</span>
                                            <ArrowRight size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                                            <span className="px-2 py-1 bg-purple-500/20 rounded text-sm font-mono font-bold text-purple-700 dark:text-purple-300 border border-purple-500/40 flex-shrink-0">
                                                {item.aliasText}
                                            </span>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    );
                })}
                </div>
                
                {/* Archived Aliases Section */}
                {archivedAliases.length > 0 && (
                    <div className="mt-6 border-t border-[var(--glass-border)] pt-4">
                        <button
                            onClick={() => setAliasesArchiveOpen(!aliasesArchiveOpen)}
                            className="flex items-center gap-2 w-full text-left py-2 px-3 rounded-lg hover:bg-[var(--glass-bg-hover)] transition-colors"
                        >
                            {aliasesArchiveOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <Archive size={16} className="text-amber-500" />
                            <span className="font-medium text-[var(--text-secondary)]">Archive</span>
                            <span className="text-xs bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full text-amber-600 dark:text-amber-400">
                                {archivedAliases.length}
                            </span>
                        </button>
                        
                        <AnimatePresence>
                            {aliasesArchiveOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 gap-3 mt-3">
                                        {archivedAliases.map(item => {
                                            const appName = item.commandName?.replace(/^(Open|Launch|Toggle)\s+/i, '').trim();
                                            const linkedApp = appMap[item.appId];
                                            const finalIconUrl = linkedApp?.iconUrl || item.iconUrl;
                                            
                                            return (
                                                <motion.div 
                                                    key={item.id}
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                >
                                                    <GlassCard 
                                                        className="group cursor-pointer border-l-4 border-l-amber-500/30 transition-all relative opacity-50 hover:opacity-80"
                                                        onClick={() => onEdit && onEdit(item)}
                                                    >
                                                        {/* Archived badge */}
                                                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 rounded-full text-[10px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                                            <Archive size={10} />
                                                            Archived
                                                        </div>
                                                        
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-20">
                                                                <div className="w-7 h-7 rounded bg-[var(--input-bg)] flex items-center justify-center flex-shrink-0 overflow-hidden grayscale">
                                                                    <AppIcon name={appName} customUrl={finalIconUrl} size={20} />
                                                                </div>
                                                                <span className="text-[var(--text-muted)] font-medium truncate">{item.commandName}</span>
                                                                <ArrowRight size={14} className="text-[var(--text-muted)] opacity-40 flex-shrink-0" />
                                                                <span className="px-2 py-1 bg-purple-500/10 rounded text-sm font-mono font-bold text-purple-500/50 border border-purple-500/20 flex-shrink-0">
                                                                    {item.aliasText}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </GlassCard>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
