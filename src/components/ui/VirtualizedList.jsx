/**
 * VirtualizedList component for efficient rendering of large lists
 * 
 * Uses @tanstack/react-virtual for windowing
 */

import { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

/**
 * VirtualizedList - Renders only visible items plus a buffer
 * 
 * @param {Array} items - Array of items to render
 * @param {Function} renderItem - Function that returns JSX for each item. Receives (item, index, virtualRow)
 * @param {number} estimateSize - Estimated height of each item in pixels
 * @param {string} className - Additional CSS classes for the container
 * @param {number} overscan - Number of items to render above/below the visible area (default: 5)
 */
export const VirtualizedList = memo(function VirtualizedList({
  items,
  renderItem,
  estimateSize = 80,
  className = '',
  overscan = 5
}) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-y-auto custom-scrollbar ${className}`}
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item, virtualRow.index, virtualRow)}
            </div>
          );
        })}
      </div>
    </div>
  );
});

/**
 * VirtualizedGrid - Virtualized grid layout
 * 
 * @param {Array} items - Array of items to render
 * @param {Function} renderItem - Function that returns JSX for each item
 * @param {number} rowHeight - Height of each row in pixels
 * @param {number} columns - Number of columns
 * @param {string} className - Additional CSS classes
 * @param {number} gap - Gap between items in pixels
 */
export const VirtualizedGrid = memo(function VirtualizedGrid({
  items,
  renderItem,
  rowHeight = 120,
  columns = 2,
  className = '',
  gap = 16,
  overscan = 3
}) {
  const parentRef = useRef(null);
  
  // Calculate number of rows
  const rowCount = Math.ceil(items.length / columns);
  
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight + gap,
    overscan,
  });

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-y-auto custom-scrollbar ${className}`}
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const rowStartIndex = virtualRow.index * columns;
          const rowItems = items.slice(rowStartIndex, rowStartIndex + columns);
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
              }}
            >
              {rowItems.map((item, colIndex) => (
                <div key={item.id || rowStartIndex + colIndex}>
                  {renderItem(item, rowStartIndex + colIndex)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
});

/**
 * Simple wrapper that decides whether to virtualize based on item count
 * Falls back to a regular list for small counts to avoid overhead
 */
export const SmartList = memo(function SmartList({
  items,
  renderItem,
  threshold = 50,
  estimateSize = 80,
  className = '',
  ...props
}) {
  // For small lists, just render normally
  if (items.length < threshold) {
    return (
      <div className={`overflow-y-auto custom-scrollbar ${className}`}>
        {items.map((item, index) => (
          <div key={item.id || index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }
  
  // For large lists, use virtualization
  return (
    <VirtualizedList
      items={items}
      renderItem={renderItem}
      estimateSize={estimateSize}
      className={className}
      {...props}
    />
  );
});
