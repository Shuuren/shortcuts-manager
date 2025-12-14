/**
 * LeaderPage - Container component for Leader Key view
 * 
 * Handles:
 * - Memoized filtering of shortcuts based on search query
 * - Passing data and callbacks to LeaderView
 */

import { useMemo, memo } from 'react';
import { LeaderView } from '../components/views/LeaderView';

export const LeaderPage = memo(function LeaderPage({
  shortcuts,
  groups,
  apps,
  searchQuery,
  onEdit,
  onEditGroup,
  onCreateGroup,
  highlightedShortcutId
}) {
  // Memoized filtering - only recalculate when dependencies change
  const filteredShortcuts = useMemo(() => {
    if (!searchQuery) return shortcuts;
    
    const lowerQ = searchQuery.toLowerCase();
    
    return shortcuts.filter(item => {
      // Search specific text fields that are user-facing
      const textFields = [
        item.name,
        item.action,
        item.app,
        item.notes
      ];

      const textMatch = textFields.some(val => 
        val && typeof val === 'string' && val.toLowerCase().includes(lowerQ)
      );

      // Search sequence (joined) - e.g. "vc" matches "Leader v c"
      const sequenceMatch = item.sequence && Array.isArray(item.sequence) && 
        item.sequence.join('').toLowerCase().includes(lowerQ);

      // Search tags
      const tagMatch = item.tags && Array.isArray(item.tags) && 
        item.tags.some(t => t.toLowerCase().includes(lowerQ));

      return textMatch || sequenceMatch || tagMatch;
    });
  }, [shortcuts, searchQuery]);

  return (
    <LeaderView 
      shortcuts={filteredShortcuts} 
      groups={groups}
      apps={apps}
      searchQuery={searchQuery}
      onEdit={onEdit}
      onEditGroup={onEditGroup}
      onCreateGroup={onCreateGroup}
      highlightedShortcutId={highlightedShortcutId}
    />
  );
});
