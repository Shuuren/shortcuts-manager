/**
 * Performance measurement utilities for development
 * 
 * Enable by setting VITE_DEBUG_PERF=true in environment
 */

const DEBUG_PERF = import.meta.env.VITE_DEBUG_PERF === 'true';

// Store performance marks
const marks = {};
const renderCounts = {};

/**
 * Mark the start of a performance measurement
 */
export function mark(name) {
  if (!DEBUG_PERF) return;
  marks[name] = performance.now();
}

/**
 * Measure time since a previous mark
 */
export function measure(name, markName) {
  if (!DEBUG_PERF) return;
  
  const startTime = marks[markName];
  if (startTime === undefined) {
    console.warn(`[Perf] No mark found: ${markName}`);
    return;
  }
  
  const duration = performance.now() - startTime;
  console.log(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
  
  return duration;
}

/**
 * Count renders for a component (call in useEffect)
 */
export function countRender(componentName) {
  if (!DEBUG_PERF) return;
  
  if (!renderCounts[componentName]) {
    renderCounts[componentName] = 0;
  }
  renderCounts[componentName]++;
  
  console.log(`[Perf] ${componentName} rendered: ${renderCounts[componentName]} times`);
}

/**
 * Get all render counts
 */
export function getRenderCounts() {
  if (!DEBUG_PERF) return {};
  return { ...renderCounts };
}

/**
 * Reset render counts
 */
export function resetRenderCounts() {
  if (!DEBUG_PERF) return;
  Object.keys(renderCounts).forEach(key => delete renderCounts[key]);
}

/**
 * Log performance stats to console
 */
export function logPerfStats() {
  if (!DEBUG_PERF) return;
  
  console.group('[Perf] Performance Stats');
  console.table(getRenderCounts());
  console.groupEnd();
}

/**
 * Hook to track component render performance
 */
export function useRenderTracker(componentName) {
  if (!DEBUG_PERF) return;
  
  // Track on every render
  countRender(componentName);
}

/**
 * Hook to measure time to first render
 */
export function useFirstRenderTime(componentName) {
  if (!DEBUG_PERF) return;
  
  const mountTime = performance.now();
  
  // This runs after first paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const renderTime = performance.now() - mountTime;
      console.log(`[Perf] First render ${componentName}: ${renderTime.toFixed(2)}ms`);
    });
  });
}

/**
 * Mark app start time (call in main.jsx)
 */
export function markAppStart() {
  if (!DEBUG_PERF) return;
  mark('app-start');
  console.log('[Perf] App starting...');
}

/**
 * Measure time from app start to first view render
 */
export function measureFirstViewRender(viewName) {
  if (!DEBUG_PERF) return;
  measure(`First view (${viewName}) rendered`, 'app-start');
}

/**
 * Track route change performance
 */
let lastRouteChange = 0;
export function trackRouteChange(from, to) {
  if (!DEBUG_PERF) return;
  
  const now = performance.now();
  if (lastRouteChange > 0) {
    const timeSinceLastChange = now - lastRouteChange;
    console.log(`[Perf] Route change ${from} -> ${to} (${timeSinceLastChange.toFixed(2)}ms since last)`);
  } else {
    console.log(`[Perf] Route change ${from} -> ${to}`);
  }
  lastRouteChange = now;
  mark(`route-${to}`);
}

/**
 * Measure route change completion
 */
export function measureRouteComplete(routeName) {
  if (!DEBUG_PERF) return;
  measure(`Route ${routeName} fully rendered`, `route-${routeName}`);
}

/**
 * Log list render stats
 */
export function logListRender(listName, itemCount) {
  if (!DEBUG_PERF) return;
  console.log(`[Perf] ${listName}: ${itemCount} items rendered`);
}

// Export DEBUG flag for conditional logging
export { DEBUG_PERF };
