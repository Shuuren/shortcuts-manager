import { useState } from 'react';
import { Download, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ExportManager({ shortcuts }) {
  const [selectedTypes, setSelectedTypes] = useState({
    leader: true,
    raycast: true,
    system: true,
  });
  const [exportStatus, setExportStatus] = useState(null);

  const toggleType = (type) => {
    setSelectedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const formatLeaderShortcut = (shortcut) => {
    const sequence = shortcut.sequence?.join(' → ') || '';
    return `| ${sequence} | ${shortcut.action || ''} | ${shortcut.category || ''} | ${shortcut.notes || ''} |`;
  };

  const formatRaycastShortcut = (shortcut) => {
    const keys = shortcut.keys || shortcut.aliasText || 'N/A';
    return `| ${keys} | ${shortcut.commandName || ''} | ${shortcut.extension || ''} | ${shortcut.notes || ''} |`;
  };

  const formatSystemShortcut = (shortcut) => {
    const keys = shortcut.keys || 'N/A';
    return `| ${keys} | ${shortcut.action || ''} | ${shortcut.category || ''} | ${shortcut.notes || ''} |`;
  };

  const generateMarkdown = () => {
    let markdown = `# Keyboard Shortcuts Reference\n\n`;
    markdown += `*Exported on ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}*\n\n`;

    // Leader Key shortcuts
    if (selectedTypes.leader && shortcuts.leaderShortcuts?.length > 0) {
      markdown += `## Leader Key Shortcuts\n\n`;
      markdown += `| Sequence | Action | Category | Notes |\n`;
      markdown += `|----------|--------|----------|-------|\n`;
      shortcuts.leaderShortcuts.forEach(shortcut => {
        markdown += formatLeaderShortcut(shortcut) + '\n';
      });
      markdown += '\n';
    }

    // Raycast shortcuts
    if (selectedTypes.raycast && shortcuts.raycastShortcuts?.length > 0) {
      markdown += `## Raycast Shortcuts\n\n`;
      markdown += `| Keys/Alias | Command | Extension | Notes |\n`;
      markdown += `|------------|---------|-----------|-------|\n`;
      shortcuts.raycastShortcuts.forEach(shortcut => {
        markdown += formatRaycastShortcut(shortcut) + '\n';
      });
      markdown += '\n';
    }

    // System shortcuts
    if (selectedTypes.system && shortcuts.systemShortcuts?.length > 0) {
      markdown += `## System Shortcuts\n\n`;
      markdown += `| Keys | Action | Category | Notes |\n`;
      markdown += `|------|--------|----------|-------|\n`;
      shortcuts.systemShortcuts.forEach(shortcut => {
        markdown += formatSystemShortcut(shortcut) + '\n';
      });
      markdown += '\n';
    }

    return markdown;
  };

  const handleExport = () => {
    const hasSelection = Object.values(selectedTypes).some(v => v);
    if (!hasSelection) {
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 2000);
      return;
    }

    const markdown = generateMarkdown();
    
    // Create blob and download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shortcuts-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportStatus('success');
    setTimeout(() => setExportStatus(null), 2000);
  };

  const getShortcutCount = (type) => {
    switch (type) {
      case 'leader':
        return shortcuts.leaderShortcuts?.length || 0;
      case 'raycast':
        return shortcuts.raycastShortcuts?.length || 0;
      case 'system':
        return shortcuts.systemShortcuts?.length || 0;
      default:
        return 0;
    }
  };

  const getTotalSelected = () => {
    let total = 0;
    if (selectedTypes.leader) total += getShortcutCount('leader');
    if (selectedTypes.raycast) total += getShortcutCount('raycast');
    if (selectedTypes.system) total += getShortcutCount('system');
    return total;
  };

  const typeOptions = [
    { id: 'leader', label: 'Leader Key', color: 'from-purple-500 to-pink-500' },
    { id: 'raycast', label: 'Raycast', color: 'from-orange-500 to-red-500' },
    { id: 'system', label: 'System', color: 'from-blue-500 to-cyan-500' },
  ];

  return (
    <div className="h-full flex flex-col">

      {/* Selection Options */}
      <div className="flex-1">
        <p className="text-sm text-[var(--text-secondary)] mb-4">Select shortcut types to export:</p>
        
        <div className="space-y-3">
          {typeOptions.map(option => (
            <motion.button
              key={option.id}
              onClick={() => toggleType(option.id)}
              className={`
                w-full flex items-center gap-4 p-4 rounded-xl border transition-all
                ${selectedTypes[option.id] 
                  ? option.id === 'leader' ? 'border-purple-500/50 bg-purple-500/10' :
                    option.id === 'raycast' ? 'border-orange-500/50 bg-orange-500/10' :
                    'border-blue-500/50 bg-blue-500/10'
                  : 'border-[var(--glass-border)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)]'
                }
              `}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Checkbox */}
              <div className={`
                w-6 h-6 rounded-lg flex items-center justify-center transition-all
                ${selectedTypes[option.id]
                  ? `bg-gradient-to-br ${option.color}`
                  : 'border-2 border-[var(--text-muted)]'
                }
              `}>
                <AnimatePresence>
                  {selectedTypes[option.id] && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check size={14} className="text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Label */}
              <div className="flex-1 text-left">
                <span className="font-medium text-[var(--text-primary)]">{option.label}</span>
              </div>

              {/* Count Badge */}
              <span className={`
                px-2.5 py-1 rounded-lg text-xs font-medium
                ${selectedTypes[option.id]
                  ? `bg-gradient-to-br ${option.color} text-white`
                  : 'bg-[var(--glass-bg-hover)] text-[var(--text-muted)]'
                }
              `}>
                {getShortcutCount(option.id)} shortcuts
              </span>
            </motion.button>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">Total to export:</span>
            <span className="font-semibold text-[var(--text-primary)]">{getTotalSelected()} shortcuts</span>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="mt-6">
        <motion.button
          onClick={handleExport}
          disabled={getTotalSelected() === 0}
          className={`
            w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium
            transition-all duration-200
            ${getTotalSelected() > 0
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600'
              : 'bg-[var(--glass-bg)] text-[var(--text-muted)] cursor-not-allowed'
            }
          `}
          whileHover={getTotalSelected() > 0 ? { scale: 1.02 } : {}}
          whileTap={getTotalSelected() > 0 ? { scale: 0.98 } : {}}
        >
          {exportStatus === 'success' ? (
            <>
              <Check size={18} />
              <span>Exported Successfully!</span>
            </>
          ) : exportStatus === 'error' ? (
            <span>Please select at least one type</span>
          ) : (
            <>
              <Download size={18} />
              <span>Export as Markdown</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
