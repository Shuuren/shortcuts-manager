import { memo } from 'react';
import { twMerge } from 'tailwind-merge';

export const GlassPanel = memo(function GlassPanel({ children, className, ...props }) {
  return (
    <div 
      className={twMerge('glass-panel p-6', className)} 
      {...props}
    >
      {children}
    </div>
  );
});

export const GlassCard = memo(function GlassCard({ children, className, onClick, ...props }) {
  return (
    <div 
      onClick={onClick}
      className={twMerge('glass-card p-4', className)} 
      {...props}
    >
      {children}
    </div>
  );
});
