/**
 * RaycastPage - Container component for Raycast view
 * 
 * Handles:
 * - Memoized filtering of shortcuts based on search query
 * - Passing data and callbacks to RaycastView
 */

import { useMemo, memo } from 'react';
import { RaycastView } from '../components/views/RaycastView';

export const RaycastPage = memo(function RaycastPage({
  shortcuts,
  apps,
  searchQuery,
  onEdit,
  onEditGroup,
  highlightedShortcutId
}) {
  // Memoized filtering - only recalculate when dependencies change
  const filteredShortcuts = useMemo(() => {
    if (!searchQuery) return shortcuts;
    
    const lowerQ = searchQuery.toLowerCase();
    
    return shortcuts.filter(item => {
      const textFields = [
        item.commandName,
        item.extension,
        item.aliasText,
        item.keys,
        item.notes
      ];

      const textMatch = textFields.some(val => 
        val && typeof val === 'string' && val.toLowerCase().includes(lowerQ)
      );

      const tagMatch = item.tags && Array.isArray(item.tags) && 
        item.tags.some(t => t.toLowerCase().includes(lowerQ));

      return textMatch || tagMatch;
    });
  }, [shortcuts, searchQuery]);

  return (
    <RaycastView 
      shortcuts={filteredShortcuts}
      apps={apps}
      onEdit={onEdit}
      onEditGroup={onEditGroup}
      highlightedShortcutId={highlightedShortcutId}
    />
  );
});
