import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { History, RotateCcw, ChevronDown, ChevronUp, Clock, Trash2, ArrowLeft, Package, Keyboard, Command, LayoutGrid, Undo2, Redo2, X } from 'lucide-react';
import { useHistory } from '../../context/HistoryContext';

const TYPE_ICONS = {
  leaderShortcuts: LayoutGrid,
  raycastShortcuts: Command,
  systemShortcuts: Keyboard,
  leaderGroups: Package,
  apps: Package,
};

const TYPE_LABELS = {
  leaderShortcuts: 'Leader Shortcut',
  raycastShortcuts: 'Raycast Shortcut',
  systemShortcuts: 'System Shortcut',
  leaderGroups: 'Leader Group',
  apps: 'App',
};

const ACTION_COLORS = {
  create: 'from-green-500 to-emerald-500',
  update: 'from-blue-500 to-cyan-500',
  delete: 'from-red-500 to-rose-500',
  revert: 'from-amber-500 to-orange-500',
};

const ACTION_LABELS = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  revert: 'Reverted',
};

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} h ago`;
  if (diffDays < 7) return `${diffDays} d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}

const ChangeDetail = memo(function ChangeDetail({ label, before, after }) {
  if (before === after) return null;
  
  return (
    <div className="py-2 border-b border-[var(--glass-border)] last:border-b-0">
      <div className="text-xs text-[var(--text-muted)] mb-1">{label}</div>
      <div className="flex items-start gap-2 text-sm">
        {before !== undefined && before !== null && (
          <div className="flex-1 min-w-0">
            <span className="text-[var(--text-muted)] text-xs">From:</span>
            <div className="bg-red-500/10 text-red-500 px-2 py-1 rounded mt-0.5 break-all font-mono text-xs">
              {typeof before === 'object' ? JSON.stringify(before) : String(before) || '(empty)'}
            </div>
          </div>
        )}
        {after !== undefined && after !== null && (
          <div className="flex-1 min-w-0">
            <span className="text-[var(--text-muted)] text-xs">To:</span>
            <div className="bg-green-500/10 text-green-600 px-2 py-1 rounded mt-0.5 break-all font-mono text-xs">
              {typeof after === 'object' ? JSON.stringify(after) : String(after) || '(empty)'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

const HistoryEntry = memo(function HistoryEntry({ entry, onRevert, onReapply, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const TypeIcon = TYPE_ICONS[entry.entityType] || Package;
  const controls = useAnimation();
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);
  
  const getChangedFields = () => {
    if (!entry.before || !entry.after) return [];
    const fields = new Set([...Object.keys(entry.before || {}), ...Object.keys(entry.after || {})]);
    const changes = [];
    
    fields.forEach(field => {
      if (field === 'id') return; // Skip ID field
      const beforeVal = entry.before?.[field];
      const afterVal = entry.after?.[field];
      
      if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
        changes.push({ field, before: beforeVal, after: afterVal });
      }
    });
    
    return changes;
  };

  const changedFields = (entry.action === 'update' || entry.action === 'revert') ? getChangedFields() : [];
  
  const handleDragEnd = async (_, info) => {
    if (info.offset.x > 100) { // Swiped right threshold
      await controls.start({ x: window.innerWidth + 100, opacity: 0, transition: { duration: 0.2 } });
      onDelete(entry.id);
    } else {
      controls.start({ x: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 25 } });
    }
  };

  return (
    <div className="relative group mb-3 select-none">
       {/* Swipe Action Background (Delete) - Left side, visible when swiping right */}
      <motion.div 
        style={{ opacity: bgOpacity }}
        className="absolute inset-y-0 left-0 w-full bg-red-500/20 rounded-xl flex items-center justify-start px-6 z-0"
      >
        <div className="flex items-center gap-2 text-red-600 font-medium animate-pulse">
            <Trash2 size={24} />
            <span>Delete</span>
        </div>
      </motion.div>

      <div className="flex items-stretch gap-2 relative z-10">
        {/* External Delete Button (Desktop Only) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry.id);
          }}
          className="hidden sm:flex w-12 flex-shrink-0 bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 text-[var(--text-muted)] rounded-xl items-center justify-center transition-all active:scale-95 touch-manipulation"
          title="Delete Entry"
        >
          <X size={20} className="stroke-[2.5]" />
        </button>

        {/* Main Card */}
        <motion.div
          style={{ x }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0.05, right: 0.5 }}
          onDragEnd={handleDragEnd}
          animate={controls}
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            flex-1 glass-card overflow-hidden border-l-4 relative cursor-pointer active:scale-[0.99] transition-transform touch-pan-y
            ${entry.isCurrent ? 'ring-2 ring-blue-500/50' : ''}
            ${entry.isReverted ? 'opacity-75 bg-amber-500/5' : ''}
            ${entry.action === 'create' ? 'border-l-emerald-500' : ''}
            ${entry.action === 'update' ? 'border-l-blue-500' : ''}
            ${entry.action === 'delete' ? 'border-l-red-500' : ''}
            ${entry.action === 'revert' ? 'border-l-amber-500' : ''}
          `}
        >
          {/* Card Header Content */}
          <div className="p-3 flex items-start gap-3">
              
            {/* Left Icon Badge */}
            <div className={`
              w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-1
              bg-gradient-to-br ${ACTION_COLORS[entry.action]}
              shadow-sm
            `}>
              {entry.action === 'delete' ? (
                <Trash2 size={18} className="text-white" />
              ) : entry.action === 'create' ? (
                <span className="text-white font-bold text-lg">+</span>
              ) : entry.action === 'revert' ? (
                <Undo2 size={18} className="text-white" />
              ) : (
                <RotateCcw size={18} className="text-white" />
              )}
            </div>

            {/* Middle Content */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              {/* Type Label & Time */}
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] gap-2">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <TypeIcon size={12} />
                  <span className="truncate">{TYPE_LABELS[entry.entityType] || entry.entityType}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-75">
                  <Clock size={10} />
                  <span>{formatTimestamp(entry.timestamp)}</span>
                </div>
              </div>

              {/* Name & Status */}
              <div className="flex items-center gap-2 flex-wrap pr-6 sm:pr-0">
                <span className={`
                  text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md flex-shrink-0
                  bg-gradient-to-r ${ACTION_COLORS[entry.action]} text-white
                `}>
                  {entry.isReverted ? 'Reverted' : ACTION_LABELS[entry.action]}
                </span>
                <span className="font-semibold text-[var(--text-primary)] text-sm truncate max-w-full">
                   {entry.entityName || entry.after?.name || entry.before?.name || entry.entityId}
                </span>
              </div>
              
              {/* Changes summary (Mobile optimized) */}
              {(entry.action === 'update' || entry.action === 'revert') && changedFields.length > 0 && (
                <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                  <span className="opacity-70">Modified: </span> 
                  {changedFields.map(c => c.field).join(', ')}
                </div>
              )}
            </div>
            
            {/* Chevron (Absolute right top for better hit area?) */}
            <div className="text-[var(--text-muted)]/50 self-start mt-1.5">
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-0 border-t border-[var(--glass-border)]/50">
                  {/* Action Buttons - Moved here for mobile optimization */}
                  <div className="flex items-center justify-end gap-2 mt-3 mb-2">
                     <span className="text-xs text-[var(--text-muted)] mr-auto">
                        {formatTime(entry.timestamp)}
                     </span>
                      {entry.canReapply ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReapply(entry);
                          }}
                          className="h-8 px-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1.5"
                        >
                          <Redo2 size={14} />
                          <span className="text-xs font-medium">Re-apply</span>
                        </button>
                      ) : entry.canRevert && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRevert(entry);
                          }}
                          className="h-8 px-3 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-lg hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1.5"
                        >
                          <ArrowLeft size={14} />
                          <span className="text-xs font-medium">Revert</span>
                        </button>
                      )}
                  </div>

                  <div className="space-y-2">
                    {entry.action === 'create' && entry.after && (
                      <div className="text-sm">
                        <div className="text-[var(--text-muted)] text-xs mb-1">Created with:</div>
                        <div className="bg-green-500/10 text-green-500 p-2 rounded text-xs font-mono overflow-auto max-h-40 custom-scrollbar">
                          <pre>{JSON.stringify(entry.after, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                    
                    {entry.action === 'delete' && entry.before && (
                      <div className="text-sm">
                        <div className="text-[var(--text-muted)] text-xs mb-1">Deleted item:</div>
                        <div className="bg-red-500/10 text-red-500 p-2 rounded text-xs font-mono overflow-auto max-h-40 custom-scrollbar">
                          <pre>{JSON.stringify(entry.before, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                    
                    {(entry.action === 'update' || entry.action === 'revert') && changedFields.map((change, idx) => (
                      <ChangeDetail 
                        key={idx}
                        label={change.field}
                        before={change.before}
                        after={change.after}
                      />
                    ))}
                  </div>

                  {entry.isCurrent && (
                     <div className="mt-2 pt-2 border-t border-[var(--glass-border)]/20 flex justify-end">
                      <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        Current Version
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
});

export function HistoryView({ onRevert, onReapply }) {
  const { getHistory, canUndo, clearHistory, deleteEntry } = useHistory();
  const [confirmClear, setConfirmClear] = useState(false);
  const historyEntries = getHistory();
  
  // Reset confirmation state after 3 seconds if not clicked
  useEffect(() => {
    let timeout;
    if (confirmClear) {
      timeout = setTimeout(() => setConfirmClear(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [confirmClear]);
  
  // Group entries by date
  const groupedHistory = historyEntries.reduce((groups, entry) => {
    const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].unshift(entry); // Most recent first within each group
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedHistory).sort((a, b) => 
    new Date(b) - new Date(a)
  );

  const handleClearClick = () => {
    if (confirmClear) {
      clearHistory();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <p className="text-sm text-[var(--text-muted)]">
          {historyEntries.length} change{historyEntries.length !== 1 ? 's' : ''} recorded
          {canUndo && <span className="ml-2 hidden sm:inline">• ⌘Z to undo</span>}

        </p>
        
        {historyEntries.length > 0 && (
          <button
            onClick={handleClearClick}
            className={`
              h-9 px-4 rounded-xl transition-all flex items-center gap-2 border shadow-sm
              ${confirmClear 
                ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' 
                : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-muted)] hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10'}
            `}
            title="Clear History"
          >
            <Trash2 size={15} />
            <span className="text-sm font-medium whitespace-nowrap">
              {confirmClear ? "Confirm Clear All" : "Clear History"}
            </span>
          </button>
        )}
      </div>

      {/* History List */}
      <div className="flex-1 overflow-auto custom-scrollbar overflow-x-hidden">
        {historyEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[var(--glass-bg-hover)] flex items-center justify-center mb-4">
              <History size={28} className="text-[var(--text-muted)]" />
            </div>
            <h4 className="text-lg font-medium text-[var(--text-secondary)]">No changes yet</h4>
            <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs">
              Your edit history will appear here. Create, update, or delete items to see changes.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date}>
                <h4 className="text-sm font-medium text-[var(--text-muted)] mb-3 sticky top-0 bg-[var(--bg-app)]/95 backdrop-blur-md py-2 z-20">
                  {date}
                </h4>
                <div className="space-y-2">
                  {groupedHistory[date].map(entry => (
                    <HistoryEntry 
                      key={entry.id} 
                      entry={entry} 
                      onRevert={onRevert}
                      onReapply={onReapply}
                      onDelete={deleteEntry}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
