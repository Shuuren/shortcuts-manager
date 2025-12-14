/**
 * AppsPage - Container component for Apps Library view
 * 
 * Handles:
 * - Memoized filtering of apps based on search query
 * - Passing data and callbacks to AppsView
 */

import { useMemo, memo } from 'react';
import { AppsView } from '../components/views/AppsView';

export const AppsPage = memo(function AppsPage({
  apps,
  searchQuery,
  onEdit,
  onCreate
}) {
  // Memoized filtering - only recalculate when dependencies change
  const filteredApps = useMemo(() => {
    if (!searchQuery) return apps;
    
    const lowerQ = searchQuery.toLowerCase();
    
    return apps.filter(app => {
      const textFields = [
        app.name,
        app.category,
        app.notes
      ];

      const textMatch = textFields.some(val => 
        val && typeof val === 'string' && val.toLowerCase().includes(lowerQ)
      );

      const tagMatch = app.tags && Array.isArray(app.tags) && 
        app.tags.some(t => t.toLowerCase().includes(lowerQ));

      return textMatch || tagMatch;
    });
  }, [apps, searchQuery]);

  return (
    <AppsView 
      apps={filteredApps}
      onEdit={onEdit}
      onCreate={onCreate}
    />
  );
});
