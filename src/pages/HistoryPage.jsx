/**
 * HistoryPage - Container component for History view
 * 
 * A thin wrapper that simply renders HistoryView
 */

import { memo } from 'react';
import { HistoryView } from '../components/views/HistoryView';

export const HistoryPage = memo(function HistoryPage({ onRevert, onReapply }) {
  return (
    <HistoryView 
      onRevert={onRevert}
      onReapply={onReapply}
    />
  );
});
