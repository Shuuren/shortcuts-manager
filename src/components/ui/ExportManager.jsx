import { useState } from 'react';
import { Download, Check, LayoutGrid, Zap, Monitor, FileText } from 'lucide-react';
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
    return `| ${keys} | ${shortcut.commandName || ''} | ${shortcut.category || ''} | ${shortcut.notes || ''} |`;
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
    { 
      id: 'leader', 
      label: 'Leader Key', 
      icon: LayoutGrid,
      description: 'Complex sequence-based shortcuts',
      color: 'from-purple-500 to-pink-500', 
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20'
    },
    { 
      id: 'raycast', 
      label: 'Raycast', 
      icon: Zap,
      description: 'Quick launcher commands & scripts',
      color: 'from-orange-500 to-red-500', 
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20'
    },
    { 
      id: 'system', 
      label: 'System', 
      icon: Monitor,
      description: 'Global macOS system hotkeys',
      color: 'from-blue-500 to-cyan-500', 
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
  ];

  return (

    <div className="h-full w-full flex flex-col items-center p-4 sm:p-6 lg:p-12 !pb-32 overflow-y-auto">
      <div className="w-full max-w-6xl flex-1 flex flex-col">
        
        {/* Header */}
        <div className="text-center mb-4 flex-none">
          <p className="text-sm text-[var(--text-secondary)]">Select the collections you want to include in your markdown export</p>
        </div>

        {/* Dynamic Flex Selection */}
        <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6 w-full mb-4">
          {typeOptions.map(option => {
            const isSelected = selectedTypes[option.id];
            const Icon = option.icon;
            const count = getShortcutCount(option.id);
            
            return (
              <motion.button
                key={option.id}
                onClick={() => toggleType(option.id)}
                className={`
                  relative overflow-hidden group flex flex-row lg:flex-col items-center lg:items-start 
                  p-4 sm:p-5 lg:p-8 rounded-2xl lg:rounded-3xl border-2 transition-all duration-300
                  flex-1 w-full text-left min-h-[100px]
                  ${isSelected
                    ? `${option.bg} ${option.border}`.replace('border-opacity-20', '') + ` ring-2 lg:ring-4 ring-offset-2 lg:ring-offset-4 ring-offset-[var(--bg-primary)] ring-${option.color.split('-')[1]}-400/30`
                    : 'bg-[var(--glass-panel)] border-[var(--glass-border)] opacity-80 hover:opacity-100 hover:border-[var(--text-muted)]'
                  }
                  ${isSelected ? '' : 'grayscale-[0.5] hover:grayscale-0'}
                `}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Background Gradient Blob */}
                {isSelected && (
                  <div className={`absolute -right-6 -bottom-6 lg:-right-20 lg:-bottom-20 w-32 h-32 lg:w-64 lg:h-64 rounded-full blur-2xl lg:blur-3xl opacity-20 bg-gradient-to-br ${option.color}`} />
                )}

                {/* Icon */}
                <div className={`
                  p-3 rounded-xl lg:rounded-2xl transition-colors shrink-0 mr-4 lg:mr-0 lg:mb-auto
                  ${isSelected ? 'bg-white/20 dark:bg-black/20 text-[var(--text-primary)]' : 'bg-[var(--glass-border)] text-[var(--text-muted)]'}
                `}>
                  <Icon className="w-6 h-6 lg:w-8 lg:h-8" />
                </div>

                {/* Content */}
                <div className="flex-1 z-10 min-w-0 lg:w-full flex flex-col justify-center lg:justify-end h-full">
                  <div className="flex items-center gap-2 lg:block lg:mb-1">
                    <h3 className={`font-bold text-lg lg:text-3xl truncate ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {option.label}
                    </h3>
                    
                    {/* Badge - Visible on Mobile/Tablet/Split View */}
                    <span className={`lg:hidden text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${isSelected ? 'bg-white/20 text-current' : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'}`}>
                      {count}
                    </span>
                  </div>
                  
                  <p className="text-sm lg:text-base text-[var(--text-muted)] leading-relaxed line-clamp-2 mt-0.5 lg:mt-2">
                    {option.description}
                  </p>

                  {/* Desktop Count Footer */}
                  <div className="hidden lg:flex w-full pt-6 mt-auto border-t border-[var(--text-muted)]/10 justify-between items-end z-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Items</span>
                    <span className={`text-4xl font-bold tracking-tight ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                      {count}
                    </span>
                  </div>
                </div>

                {/* Checkbox */}
                <div className={`
                  ml-4 lg:ml-0 lg:absolute lg:top-8 lg:right-8
                  w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center transition-all shrink-0
                  ${isSelected
                    ? `bg-gradient-to-br ${option.color} text-white shadow-lg`
                    : 'border-2 border-[var(--text-muted)]'
                  }
                `}>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-3.5 h-3.5 lg:w-[18px] lg:h-[18px]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </div>
        
        {/* Footer / Action Area */}
        <div className="glass-panel p-4 lg:p-8 rounded-2xl lg:rounded-3xl flex flex-row items-center justify-between gap-4 border border-[var(--glass-border)] bg-[var(--glass-bg)]/50 backdrop-blur-xl flex-none">
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="p-2 lg:p-4 bg-[var(--surface-highlight)] rounded-xl lg:rounded-2xl shrink-0">
              <FileText className="w-5 h-5 lg:w-8 lg:h-8 text-[var(--text-secondary)]" />
            </div>
            <div className="text-left">
              <div className="text-[10px] lg:text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Total</div>
              <div className="text-xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">
                {getTotalSelected()}
              </div>
            </div>
          </div>

          <motion.button
            onClick={handleExport}
            disabled={getTotalSelected() === 0}
            className={`
              flex flex-1 sm:flex-none items-center gap-2 lg:gap-3 py-3 lg:py-5 px-6 lg:px-10 rounded-xl lg:rounded-2xl font-bold text-sm lg:text-xl shadow-xl
              transition-all duration-200 justify-center
              ${getTotalSelected() > 0
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:shadow-emerald-500/25 hover:-translate-y-1'
                : 'bg-[var(--surface-highlight)] text-[var(--text-muted)] cursor-not-allowed'
              }
            `}
            whileTap={getTotalSelected() > 0 ? { scale: 0.98 } : {}}
          >
            {exportStatus === 'success' ? (
              <>
                <Check className="w-4 h-4 lg:w-6 lg:h-6" />
                <span className="whitespace-nowrap">Saved</span>
              </>
            ) : exportStatus === 'error' ? (
              <span className="whitespace-nowrap">Select Items</span>
            ) : (
              <>
                <Download className="w-4 h-4 lg:w-6 lg:h-6" />
                <span className="whitespace-nowrap">Export</span>
              </>
            )}
          </motion.button>
        </div>

      </div>
    </div>
  );
}
