/**
 * ExportPage - Container component for Export Manager view
 * 
 * A thin wrapper that simply renders ExportManager
 */

import { memo } from 'react';
import { ExportManager } from '../components/ui/ExportManager';

export const ExportPage = memo(function ExportPage({ shortcuts }) {
  return (
    <ExportManager shortcuts={shortcuts} />
  );
});
