/**
 * ShortcutCheckerPage - Container component for Shortcut Checker view
 * 
 * Handles:
 * - Passing shortcut data to the checker view
 * - Navigation callback for clicking on conflict results
 */

import { memo } from 'react';
import { ShortcutCheckerView } from '../components/views/ShortcutCheckerView';

export const ShortcutCheckerPage = memo(function ShortcutCheckerPage({
  raycastShortcuts,
  systemShortcuts,
  onNavigate
}) {
  return (
    <ShortcutCheckerView 
      raycastShortcuts={raycastShortcuts}
      systemShortcuts={systemShortcuts}
      onNavigate={onNavigate}
    />
  );
});
