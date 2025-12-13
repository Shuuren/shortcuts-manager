import { useMemo } from 'react';
import { GlassCard } from '../ui/GlassPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Edit2, Link, Keyboard, Command, LayoutGrid } from 'lucide-react';
import { getCategoryIcon } from '../../config/categories';

// App Icon component with fallback
const AppIcon = ({ iconUrl, name, size = 48 }) => {
    if (iconUrl) {
        return (
            <img 
                src={iconUrl} 
                alt={name}
                className="rounded-xl object-contain"
                style={{ width: size, height: size }}
                onError={(e) => {
                    e.target.style.display = 'none';
                }}
            />
        );
    }
    
    return <Box size={size * 0.6} className="text-[var(--text-muted)]" />;
};

// Badge showing where an app is linked
const LinkBadge = ({ type, count }) => {
    const badges = {

        leader: { icon: LayoutGrid, color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20' },
        raycast: { icon: Command, color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20' },
        system: { icon: Keyboard, color: 'bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20' }
    };
    
    const badge = badges[type];
    if (!badge || count === 0) return null;
    
    const Icon = badge.icon;
    
    return (
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${badge.color}`}>
            <Icon size={10} />
            {count}
        </span>
    );
};

export function AppsView({ apps = [], shortcuts = {}, onEdit }) {
    
    // Count shortcuts linking to each app
    const appLinkCounts = useMemo(() => {
        const counts = {};
        
        apps.forEach(app => {
            counts[app.id] = { leader: 0, raycast: 0, system: 0 };
            
            // Count leader shortcuts
            (shortcuts.leaderShortcuts || []).forEach(s => {
                if (s.appId === app.id || s.app?.toLowerCase() === app.name?.toLowerCase()) {
                    counts[app.id].leader++;
                }
            });
            
            // Count raycast shortcuts
            (shortcuts.raycastShortcuts || []).forEach(s => {
                const appName = s.commandName?.replace(/^(Open|Launch|Toggle)\s+/i, '').trim();
                if (s.appId === app.id || appName?.toLowerCase() === app.name?.toLowerCase()) {
                    counts[app.id].raycast++;
                }
            });
            
            // Count system shortcuts
            (shortcuts.systemShortcuts || []).forEach(s => {
                if (s.appId === app.id || s.appOrContext?.toLowerCase() === app.name?.toLowerCase()) {
                    counts[app.id].system++;
                }
            });
        });
        
        return counts;
    }, [apps, shortcuts]);
    
    // Group apps by category
    const groupedApps = useMemo(() => {
        const groups = {};
        apps.forEach(app => {
            const cat = app.category || 'Uncategorized';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(app);
        });
        
        // Sort apps within each category by name
        Object.keys(groups).forEach(cat => {
            groups[cat].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        });
        
        return groups;
    }, [apps]);
    
    // Sort categories alphabetically, but put "Uncategorized" at the bottom
    const sortedCategories = Object.keys(groupedApps).sort((a, b) => {
        if (a === 'Uncategorized') return 1;
        if (b === 'Uncategorized') return -1;
        return a.localeCompare(b);
    });
    
    return (
        <div className="h-full flex flex-col">
            {/* Apps grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {/* Stats bar */}
                <div className="flex items-center gap-6 mb-6 text-sm">
                    <span className="flex items-baseline gap-1.5">
                        <strong className="text-[var(--text-primary)] text-lg">{apps.length}</strong> 
                        <span className="text-[var(--text-muted)] opacity-70 font-medium">apps in library</span>
                    </span>
                    <span className="w-px h-4 bg-[var(--text-muted)]/20"></span>
                    <span className="flex items-baseline gap-1.5">
                        <strong className="text-[var(--text-primary)] text-lg">{sortedCategories.length}</strong> 
                        <span className="text-[var(--text-muted)] opacity-70 font-medium">categories</span>
                    </span>
                </div>

                {sortedCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)]">
                        <Box size={48} className="mb-4 text-[var(--text-muted)] opacity-50" />
                        <p className="text-lg mb-2 text-[var(--text-primary)]">No apps found</p>
                        <p className="text-sm">Try adjusting your search or add a new app</p>
                    </div>
                ) : (
                    sortedCategories.map(category => {
                        const Icon = getCategoryIcon(category);
                        return (
                        <div key={category} className="mb-8">
                            <h3 className="sticky top-0 z-10 backdrop-blur-md bg-[var(--glass-bg)] py-2 px-1 text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4 rounded-lg border border-transparent shadow-sm flex items-center gap-2">
                                <Icon size={16} className="text-blue-400" />
                                {category}
                                <span className="ml-2 text-[var(--text-muted)] opacity-60 text-xs normal-case">({groupedApps[category].length})</span>
                            </h3>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {groupedApps[category].map((app, index) => {
                                        const links = appLinkCounts[app.id] || { leader: 0, raycast: 0, system: 0 };
                                        const totalLinks = links.leader + links.raycast + links.system;
                                        
                                        return (
                                            <motion.div
                                                key={app.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ delay: index * 0.02 }}
                                            >
                                                <GlassCard 
                                                    className="flex flex-col items-center gap-3 p-4 cursor-pointer group hover:bg-[var(--glass-bg-hover)] transition-all relative border border-transparent hover:border-[var(--glass-border)]"
                                                    onClick={() => onEdit(app)}
                                                >
                                                    {/* Edit indicator */}
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
                                                        <Edit2 size={14} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" />
                                                    </div>
                                                    
                                                    {/* Link count indicator */}
                                                    {totalLinks > 0 && (
                                                        <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                                                            <Link size={10} />
                                                            {totalLinks}
                                                        </div>
                                                    )}
                                                    
                                                    {/* App Icon */}
                                                    <div className="w-16 h-16 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                                                        <AppIcon iconUrl={app.iconUrl} name={app.name} size={48} />
                                                    </div>
                                                    
                                                    {/* App Name */}
                                                    <div className="text-center w-full">
                                                        <h4 className="font-medium text-sm truncate w-full text-[var(--text-primary)]">{app.name}</h4>
                                                    </div>
                                                    
                                                    {/* Link badges */}
                                                    <div className="flex items-center gap-1 flex-wrap justify-center">
                                                        <LinkBadge type="leader" count={links.leader} />
                                                        <LinkBadge type="raycast" count={links.raycast} />
                                                        <LinkBadge type="system" count={links.system} />
                                                    </div>
                                                </GlassCard>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                    })
                )}
            </div>
        </div>
    );
}
