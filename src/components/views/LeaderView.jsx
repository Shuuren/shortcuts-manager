import { useState, useMemo, useEffect, useRef, memo } from 'react';
import { GlassCard, GlassPanel } from '../ui/GlassPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, File, ArrowLeft, ArrowRight, Box, Zap, Search, Edit2, Plus, Settings, Home } from 'lucide-react';
import { clsx } from 'clsx';
import { getAppIcon } from '../../config/icons';


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

// Generic icons for categories without specific icons
const GenericCategoryIcon = memo(function GenericCategoryIcon({ name, size = 32 }) {
    const lower = name?.toLowerCase() || '';
    
    if (lower.includes('quick') || lower.includes('action')) {
        return <Zap size={size} className="text-yellow-400" />;
    }
    if (lower.includes('search')) {
        return <Search size={size} className="text-blue-400" />;
    }
    
    return <Folder size={size} className="text-blue-400" />;
});

// Leader Key Icon - box with filled circle in the middle
const LeaderKeyIcon = memo(function LeaderKeyIcon({ className = "", size = 20 }) {
  return (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        className={className}
    >
        <rect 
            x="3" 
            y="3" 
            width="18" 
            height="18" 
            rx="3" 
            stroke="currentColor" 
            strokeWidth="2"
        />
        <circle 
            cx="12" 
            cy="12" 
            r="4" 
            fill="currentColor"
        />
    </svg>
  );
});

// Helper to build tree structure from flat shortcuts using dynamic groups
const buildTree = (shortcuts, groupsConfig) => {
    const root = { id: 'root', name: 'Leader', children: {}, items: [], groupData: null };
    
    // Build lookup maps from group config
    const groupsByKey = {};
    const subGroupsByParent = {};
    
    groupsConfig.forEach(g => {
        if (g.parentKey) {
            // It's a subgroup
            if (!subGroupsByParent[g.parentKey]) {
                subGroupsByParent[g.parentKey] = {};
            }
            subGroupsByParent[g.parentKey][g.key] = g;
        } else {
            // It's a top-level group
            groupsByKey[g.key] = g;
        }
    });
    
    // First, add all groups from config (even empty ones)
    Object.values(groupsByKey).forEach(g => {
        if (!root.children[g.key]) {
            root.children[g.key] = { 
                id: g.key, 
                name: g.name, 
                children: {}, 
                items: [], 
                groupData: g 
            };
        }
        
        // Add subgroups for this parent
        if (subGroupsByParent[g.key]) {
            Object.values(subGroupsByParent[g.key]).forEach(sub => {
                if (!root.children[g.key].children[sub.key]) {
                    root.children[g.key].children[sub.key] = {
                        id: sub.key,
                        name: sub.name,
                        children: {},
                        items: [],
                        groupData: sub
                    };
                }
            });
        }
    });
    
    // Then, add shortcuts to the appropriate nodes
    shortcuts.forEach(shortcut => {
        let current = root;
        let parentKey = null;
        
        // Skip "Leader" prefix if present in sequence
        const sequence = shortcut.sequence[0] === 'Leader' 
            ? shortcut.sequence.slice(1) 
            : shortcut.sequence;
        
        sequence.forEach((key, index) => {
            const isLast = index === sequence.length - 1;
            
            if (isLast) {
                 // It's the action itself
                 if (!current.children[key]) {
                    current.children[key] = { id: key, name: key, children: {}, items: [], groupData: null };
                 }
                 current.children[key].items.push(shortcut);
            } else {
                if (!current.children[key]) {
                    // Look up group config
                    let name = key;
                    let groupData = null;
                    
                    if (index === 0 && groupsByKey[key]) {
                        name = groupsByKey[key].name;
                        groupData = groupsByKey[key];
                    } else if (index === 1 && parentKey && subGroupsByParent[parentKey]?.[key]) {
                        name = subGroupsByParent[parentKey][key].name;
                        groupData = subGroupsByParent[parentKey][key];
                    }
                    
                    current.children[key] = { id: key, name: name, children: {}, items: [], groupData: groupData };
                }
                parentKey = key;
                current = current.children[key];
            }
        });
    });
    return root;
};

// Helper to prune tree based on search query
const pruneTree = (node, query) => {
    if (!query) return node;
    const lowerQ = query.toLowerCase();

    const newChildren = {};
    let hasMatchingChildren = false;
    
    Object.entries(node.children).forEach(([key, child]) => {
        const prunedChild = pruneTree(child, query);
        if (prunedChild) {
            newChildren[key] = prunedChild;
            hasMatchingChildren = true;
        }
    });

    // Check if this node should be kept
    const hasItems = node.items.length > 0;
    // Check if name matches (unless it's root)
    const nameMatches = node.id !== 'root' && node.name.toLowerCase().includes(lowerQ);
    
    if (hasItems || hasMatchingChildren || nameMatches || node.id === 'root') {
        return {
            ...node,
            children: newChildren,
            _isMatch: nameMatches,
            _containsMatch: hasItems || hasMatchingChildren
        };
    }
    
    return null;
};

export function LeaderView({ shortcuts, groups = [], apps = [], searchQuery = '', onEdit, onEditGroup, onCreateGroup, onCreateShortcut, highlightedShortcutId }) {
    const [path, setPath] = useState(['root']);
    const prevHighlightedRef = useRef(null);
    
    // Build the tree
    const tree = useMemo(() => {
        const fullTree = buildTree(shortcuts, groups);
        if (!searchQuery) return fullTree;
        return pruneTree(fullTree, searchQuery) || fullTree;
    }, [shortcuts, groups, searchQuery]);
    
    // Helper function to validate a path against current tree
    const validatePath = (currentPath, currentTree) => {
        let node = currentTree;
        for (let i = 1; i < currentPath.length; i++) {
            if (node.children && node.children[currentPath[i]]) {
                node = node.children[currentPath[i]];
            } else {
                return ['root'];
            }
        }
        return currentPath;
    };
    
    // Compute the effective path - validated against current tree
    // Always validate path against current tree structure
    const effectivePath = useMemo(() => {
        return validatePath(path, tree);
    }, [path, tree]);
    
    // Reset path when search query changes and current path becomes invalid
    useEffect(() => {
        if (searchQuery) {
            const validated = validatePath(path, tree);
            if (validated.length !== path.length || !validated.every((p, i) => p === path[i])) {
                // Path is invalid - use a setTimeout to defer the state update
                // This moves the update to the next tick, avoiding the synchronous issue
                const timeoutId = setTimeout(() => setPath(validated), 0);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [searchQuery, tree, path]);
    
    // Handle navigation to highlighted shortcut - only when it changes
    useEffect(() => {
        // Only navigate if highlightedShortcutId actually changed to a new value
        if (highlightedShortcutId && highlightedShortcutId !== prevHighlightedRef.current && shortcuts.length > 0) {
            const targetShortcut = shortcuts.find(s => s.id === highlightedShortcutId);
            
            if (targetShortcut && targetShortcut.sequence) {
                // Calculate path to this shortcut
                // Remove 'Leader' prefix if present
                const keys = targetShortcut.sequence[0] === 'Leader' 
                    ? targetShortcut.sequence.slice(1) 
                    : targetShortcut.sequence;
                
                // The item is at the end of the sequence. The path is everything before it.
                // e.g. Leader -> v -> c. Path is root -> v. Item is c.
                if (keys.length > 0) {
                    const newPath = ['root', ...keys.slice(0, -1)];
                    // Defer to next tick
                    setTimeout(() => {
                        setPath(newPath);
                        // Scroll to item after render
                        setTimeout(() => {
                            const element = document.getElementById(`leader-item-${highlightedShortcutId}`);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                element.classList.add('highlight-pulse');
                                setTimeout(() => element.classList.remove('highlight-pulse'), 2000);
                            }
                        }, 300);
                    }, 0);
                }
            }
        }
        prevHighlightedRef.current = highlightedShortcutId;
    }, [highlightedShortcutId, shortcuts]);

    // Create app lookup map
    const appMap = useMemo(() => {
        return apps.reduce((acc, app) => {
            acc[app.id] = app;
            return acc;
        }, {});
    }, [apps]);

    // Get current node based on effective path (which is validated)
    const currentNode = effectivePath.reduce((node, key) => {
        if (key === 'root') return node;
        return node?.children?.[key] || node;
    }, tree);

    if (!currentNode) {
        // Return early - this shouldn't happen with validated path
        return null; 
    }

    const handleNodeClick = (key) => {
        const nextNode = currentNode.children[key];
        if (nextNode) {
             setPath([...effectivePath, key]);
        }
    };

    const handleBack = () => {
        if (effectivePath.length > 1) {
            setPath(effectivePath.slice(0, -1));
        }
    };

    const handleGoHome = () => {
        setPath(['root']);
    };

    // Separate groups from end-nodes (shortcuts)
    const groupNodes = [];
    const endNodes = [];
    
    if (currentNode.children) {
        Object.values(currentNode.children).forEach((child) => {
            const hasSubGroups = Object.keys(child.children).length > 0;
            const isDefinedGroup = !!child.groupData; 
            
            if (hasSubGroups || isDefinedGroup) {
                groupNodes.push(child);
            } else {
                child.items.forEach(item => endNodes.push(item));
            }
        });
    }

    // Sort groups by KEY ID
    groupNodes.sort((a, b) => a.id.localeCompare(b.id));

    // Also add direct items on this node
    if (currentNode.items) {
        currentNode.items.forEach(item => endNodes.push(item));
    }

    // Sort shortcuts by the last key in their sequence (alphabetically)
    endNodes.sort((a, b) => {
        const seqA = a.sequence || [];
        const seqB = b.sequence || [];
        const lastKeyA = seqA[seqA.length - 1] || '';
        const lastKeyB = seqB[seqB.length - 1] || '';
        return lastKeyA.localeCompare(lastKeyB);
    });

    // Helper to render sequence
    const renderSequence = (sequence) => {
        const keys = sequence[0] === 'Leader' ? sequence.slice(1) : sequence;
        
        return (
            <div className="flex items-center gap-2">
                {keys.map((k, i) => {
                    const isLast = i === keys.length - 1;
                    
                    return (
                        <div key={i} className="flex items-center gap-2">
                            <span 
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg font-mono font-semibold transition-all",
                                    isLast 
                                        ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-purple-600 dark:text-purple-200 border-2 border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.4)] text-base" 
                                        : "bg-[var(--surface-highlight)] text-[var(--text-primary)] border border-[var(--surface-border-strong)] text-sm shadow-sm"
                                )}
                            >
                                {k}
                            </span>
                            {!isLast && (
                                <ArrowRight size={14} className="text-[var(--text-muted)]" />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const hasGroups = groupNodes.length > 0;
    const hasShortcuts = endNodes.length > 0;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar pr-2 pt-4 pb-24">
            {/* Navigation buttons */}
            {path.length > 1 && (
                <div className="flex items-center gap-3 mb-4">
                    {/* Home button - shows when at least 2 levels deep */}
                    {path.length > 2 && (
                        <button 
                            onClick={handleGoHome} 
                            className="glass-button p-2 rounded-full"
                            title="Go to root"
                        >
                            <Home size={16} />
                        </button>
                    )}
                    <button onClick={handleBack} className="glass-button p-2 rounded-full" title="Go back">
                        <ArrowLeft size={16} />
                    </button>
                    <span className="text-sm text-[var(--text-muted)]">
                        Back to {path.length === 2 ? 'Root' : path[path.length - 2]}
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Groups Column */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
                            Groups
                        </h3>
                        {onCreateGroup && (
                            <button 
                                onClick={onCreateGroup}
                                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <Plus size={14} />
                                Add Group
                            </button>
                        )}
                    </div>
                    
                    {hasGroups ? (
                        <AnimatePresence mode='popLayout'>
                            {groupNodes.map((child) => {
                                const groupData = child.groupData;
                                const iconUrl = groupData?.iconUrl || getAppIcon(child.name);
                                
                                return (
                                    <motion.div
                                        key={child.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <GlassCard 
                                            className={clsx(
                                                "min-h-[5rem] h-auto py-3 sm:py-0 sm:h-28 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 cursor-pointer group hover:bg-[var(--glass-bg-hover)] border-l-4 relative transition-all",
                                                child._containsMatch || child._isMatch
                                                    ? "border-l-green-500 bg-green-500/5 dark:bg-green-500/10"
                                                    : "border-l-blue-500/50"
                                            )}
                                        >
                                            {onEditGroup && groupData && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditGroup(groupData);
                                                    }}
                                                    className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 z-10"
                                                >
                                                    <Settings size={14} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" />
                                                </button>
                                            )}
                                            
                                            <div 
                                                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-1 h-full w-full justify-between px-2 sm:px-0"
                                                onClick={() => handleNodeClick(child.id)}
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                                    <div 
                                                        className={clsx(
                                                            "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-transform overflow-hidden cursor-pointer relative group/icon flex-shrink-0",
                                                            child._containsMatch || child._isMatch
                                                                ? "bg-green-500/20 text-green-500 group-hover:scale-110"
                                                                : "bg-blue-500/20 text-blue-400 group-hover:scale-110"
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onEditGroup && groupData) {
                                                                onEditGroup(groupData);
                                                            }
                                                        }}
                                                    >
                                                        {iconUrl ? (
                                                            <AppIcon name={child.name} customUrl={iconUrl} size={32} />
                                                        ) : (
                                                            <GenericCategoryIcon name={child.name} size={28} />
                                                        )}
                                                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/60 rounded-xl opacity-0 group-hover/icon:opacity-100 transition-opacity">
                                                            <Edit2 size={16} className="text-black dark:text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className={clsx(
                                                            "font-semibold text-base sm:text-lg truncate pr-6 sm:pr-0",
                                                            child._isMatch && "text-green-600 dark:text-green-400"
                                                        )}>
                                                            {child.name}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)] mt-1">
                                                            {(() => {
                                                                // Count subgroups (children that are actual groups, not end-nodes)
                                                                const subgroupCount = Object.values(child.children).filter(c => 
                                                                    Object.keys(c.children).length > 0 || !!c.groupData
                                                                ).length;
                                                                return subgroupCount > 0 ? (
                                                                    <span className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300/80 whitespace-nowrap">
                                                                        {subgroupCount} subgroup{subgroupCount !== 1 ? 's' : ''}
                                                                    </span>
                                                                ) : null;
                                                            })()}
                                                            {(() => {
                                                                // Count shortcuts (end-nodes: children without subgroups that have items)
                                                                const countShortcuts = (node) => {
                                                                    let count = node.items?.length || 0;
                                                                    if (node.children) {
                                                                        Object.values(node.children).forEach(c => {
                                                                            count += countShortcuts(c);
                                                                        });
                                                                    }
                                                                    return count;
                                                                };
                                                                const totalShortcuts = countShortcuts(child);
                                                                return totalShortcuts > 0 ? (
                                                                    <span className="flex items-center gap-1.5 bg-purple-500/10 px-2 py-0.5 rounded text-purple-700 dark:text-purple-300/80 whitespace-nowrap">
                                                                        {totalShortcuts} shortcut{totalShortcuts !== 1 ? 's' : ''}
                                                                    </span>
                                                                ) : null;
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center justify-between w-full sm:w-auto mt-2 sm:mt-0 sm:gap-3 sm:mr-4 pl-[3.75rem] sm:pl-0">
                                                    <span className={clsx(
                                                        "w-10 h-10 flex items-center justify-center rounded-xl font-mono text-lg font-bold border-2 shadow-[0_0_12px_rgba(59,130,246,0.4)]",
                                                        child._containsMatch || child._isMatch
                                                            ? "bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-green-400/50 text-green-800 dark:text-green-200"
                                                            : "bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border-blue-400/50 text-blue-800 dark:text-blue-200"
                                                    )}>
                                                        {child.id}
                                                    </span>
                                                    <ChevronRight size={20} className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors sm:block hidden" />
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-[var(--text-muted)] py-8">
                            <p className="text-sm">No sub-groups at this level</p>
                        </div>
                    )}
                </div>

                {/* Shortcuts Column */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
                            Shortcuts
                        </h3>
                        {onCreateShortcut && (
                            <button 
                                onClick={() => {
                                    // Pass the current path (excluding 'root') as the prefix sequence
                                    const prefixKeys = effectivePath.slice(1);
                                    onCreateShortcut(prefixKeys);
                                }}
                                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                <Plus size={14} />
                                Add Shortcut
                            </button>
                        )}
                    </div>
                    
                    {hasShortcuts ? (
                        <AnimatePresence mode='popLayout'>
                            {endNodes.map((item) => (
                                <motion.div
                                    key={item.id}
                                    id={`leader-item-${item.id}`}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ 
                                        opacity: 1, 
                                        y: 0,
                                        scale: highlightedShortcutId === item.id ? 1.02 : 1,
                                        backgroundColor: highlightedShortcutId === item.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0)',
                                        borderColor: highlightedShortcutId === item.id ? 'rgba(59, 130, 246, 0.5)' : 'rgba(0,0,0,0)'
                                    }}
                                    className={highlightedShortcutId === item.id ? 'rounded-xl z-20' : ''}
                                >
                                    <GlassCard 
                                        className={clsx(
                                            "p-3 sm:p-4 border-l-4 relative group cursor-pointer hover:bg-[var(--glass-bg-hover)] transition-all",
                                            highlightedShortcutId === item.id ? "border-l-blue-500 shadow-lg ring-1 ring-blue-500/30" : "border-l-purple-500/50"
                                        )}
                                        onClick={() => onEdit && onEdit(item)}
                                    >
                                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer z-10">
                                            <Edit2 size={14} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" />
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                            <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                                                <div 
                                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--input-bg)] flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer relative group/icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEdit && onEdit(item);
                                                    }}
                                                >
                                                    {(() => {
                                                        const linkedApp = appMap[item.appId];
                                                        const finalIconUrl = linkedApp?.iconUrl || item.iconUrl;
                                                        return <AppIcon name={item.app} customUrl={finalIconUrl} size={32} />;
                                                    })()}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/60 rounded-xl opacity-0 group-hover/icon:opacity-100 transition-opacity">
                                                        <Edit2 size={14} className="text-black dark:text-white" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1 pr-6 sm:pr-0">
                                                    <h3 className="font-semibold text-sm sm:text-base truncate">{item.app}</h3>
                                                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] truncate">{item.action}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end overflow-x-auto custom-scrollbar pb-1 sm:pb-0 pl-[3.25rem] sm:pl-0">
                                                {renderSequence(item.sequence)}
                                                <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-purple-500/20 text-purple-400 ml-2 flex-shrink-0">
                                                    <LeaderKeyIcon size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-[var(--text-muted)] py-8">
                            <p className="text-sm">No shortcuts at this level</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
