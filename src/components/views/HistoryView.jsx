import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
          <div className="flex-1">
            <span className="text-[var(--text-muted)] text-xs">From:</span>
            <div className="bg-red-500/10 text-red-400 px-2 py-1 rounded mt-0.5 break-all">
              {typeof before === 'object' ? JSON.stringify(before) : String(before) || '(empty)'}
            </div>
          </div>
        )}
        {after !== undefined && after !== null && (
          <div className="flex-1">
            <span className="text-[var(--text-muted)] text-xs">To:</span>
            <div className="bg-green-500/10 text-green-400 px-2 py-1 rounded mt-0.5 break-all">
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        glass-card overflow-hidden border-l-4
        ${entry.isCurrent ? 'ring-2 ring-blue-500/50' : ''}
        ${entry.isReverted ? 'opacity-60 bg-amber-500/5' : ''}
        ${entry.action === 'create' ? 'border-l-emerald-500' : ''}
        ${entry.action === 'update' ? 'border-l-blue-500' : ''}
        ${entry.action === 'delete' ? 'border-l-red-500' : ''}
        ${entry.action === 'revert' ? 'border-l-amber-500' : ''}
      `}
    >
      {/* Header */}
      <div 
        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-[var(--glass-bg-hover)] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Action badge */}
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center
          bg-gradient-to-br ${ACTION_COLORS[entry.action]}
        `}>
          {entry.action === 'delete' ? (
            <Trash2 size={18} className="text-white" />
          ) : entry.action === 'create' ? (
            <span className="text-white font-bold">+</span>
          ) : entry.action === 'revert' ? (
            <Undo2 size={18} className="text-white" />
          ) : (
            <RotateCcw size={18} className="text-white" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`
              text-xs font-medium px-2 py-0.5 rounded-full
              bg-gradient-to-r ${ACTION_COLORS[entry.action]} text-white
            `}>
              {entry.isReverted ? 'Reverted' : ACTION_LABELS[entry.action]}
            </span>
            <TypeIcon size={14} className="text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-muted)]">
              {TYPE_LABELS[entry.entityType] || entry.entityType}
            </span>
          </div>
          <div className="font-medium text-[var(--text-primary)] truncate mt-1">
            {entry.entityName || entry.after?.name || entry.before?.name || entry.entityId}
          </div>
          {(entry.action === 'update' || entry.action === 'revert') && changedFields.length > 0 && (
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              Changed: {changedFields.map(c => c.field).join(', ')}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-right flex-shrink-0">
          <div className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
            <Clock size={12} />
            {formatTimestamp(entry.timestamp)}
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {formatTime(entry.timestamp)}
          </div>
        </div>

        {/* Revert or Re-apply button */}
        {entry.canReapply ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReapply(entry);
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <Redo2 size={14} />
            Re-apply
          </button>
        ) : entry.canRevert && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRevert(entry);
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            Revert
          </button>
        )}

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry.id);
          }}
          className="p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Remove entry"
        >
          <X size={16} />
        </button>

        {/* Expand toggle */}
        <div className="text-[var(--text-muted)]">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-[var(--glass-border)]">
              <div className="mt-3 space-y-1">
                {entry.action === 'create' && entry.after && (
                  <div className="text-sm">
                    <div className="text-[var(--text-muted)] text-xs mb-1">Created with:</div>
                    <div className="bg-green-500/10 text-green-400 p-2 rounded text-xs font-mono overflow-auto max-h-40 custom-scrollbar">
                      <pre>{JSON.stringify(entry.after, null, 2)}</pre>
                    </div>
                  </div>
                )}
                
                {entry.action === 'delete' && entry.before && (
                  <div className="text-sm">
                    <div className="text-[var(--text-muted)] text-xs mb-1">Deleted item:</div>
                    <div className="bg-red-500/10 text-red-400 p-2 rounded text-xs font-mono overflow-auto max-h-40 custom-scrollbar">
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
                <div className="mt-3 flex items-center gap-2 text-xs text-blue-400">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  Current position in history
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
          {canUndo && <span className="ml-2">• ⌘Z to undo</span>}

        </p>
        
        {historyEntries.length > 0 && (
          <button
            onClick={handleClearClick}
            className={`
              px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1.5
              ${confirmClear 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'text-red-400 hover:bg-red-500/10'}
            `}
          >
            <Trash2 size={14} />
            {confirmClear ? "Are you sure?" : "Clear History"}
          </button>
        )}
      </div>

      {/* History List */}
      <div className="flex-1 overflow-auto custom-scrollbar">
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
                <h4 className="text-sm font-medium text-[var(--text-muted)] mb-3 sticky top-0 bg-[var(--bg-app)]/80 backdrop-blur-sm py-2 z-10">
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
