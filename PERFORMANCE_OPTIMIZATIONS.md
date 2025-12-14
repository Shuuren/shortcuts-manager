# Performance Optimizations

This document summarizes the performance optimizations implemented in the Shortcuts Manager application.

## Summary

The refactoring focuses on making the app feel extremely fast, responsive, and smooth without changing user-visible behavior. Key areas addressed:

1. **Component Refactoring** - Breaking down the monolithic `App.jsx`
2. **Data Caching & Loading** - LocalStorage caching with instant hydration
3. **Optimistic Updates** - Immediate UI feedback for CRUD operations
4. **Memoization** - React.memo and useMemo for expensive computations
5. **Debounced Search** - Reducing unnecessary filter operations
6. **List Virtualization** - Ready for large datasets (library installed)
7. **Performance Measurement** - Dev-only debugging utilities

---

## 1. Component Architecture Refactoring

### New Files Created

#### `/src/hooks/useShortcutsStore.js`
Centralized data management hook that handles:
- All shortcut/group/app state management
- Fetching from `/api/shortcuts`
- CRUD operations with optimistic updates
- Client-side caching with localStorage
- Background data refresh
- Integration with HistoryContext for logging changes

Key features:
- **Cache-first loading**: Loads from localStorage immediately, then syncs with server
- **24-hour cache validity**: Automatic cache expiration
- **Per-user cache keys**: Separate cache for different users/roles
- **Rollback on error**: Reverts optimistic updates if API fails

#### `/src/pages/` - Page Container Components
Memoized page containers that handle view-specific filtering:
- `LeaderPage.jsx` - Leader Key view with memoized shortcut filtering
- `RaycastPage.jsx` - Raycast view with memoized command filtering
- `SystemPage.jsx` - System view with memoized shortcut filtering
- `AppsPage.jsx` - Apps Library with memoized app filtering
- `HistoryPage.jsx` - History view wrapper
- `ExportPage.jsx` - Export Manager wrapper
- `index.js` - Barrel export

#### `/src/utils/perf.js`
Development-only performance measurement utilities:
- `mark()` / `measure()` - Custom timing marks
- `countRender()` - Component render counting
- `useRenderTracker()` - Hook to track renders
- `trackRouteChange()` - Route navigation timing
- `measureFirstViewRender()` - First paint timing

**Enable by setting** `VITE_DEBUG_PERF=true` in `.env`

#### `/src/components/ui/VirtualizedList.jsx`
Ready-to-use list virtualization components:
- `VirtualizedList` - Basic virtualized list
- `VirtualizedGrid` - Grid layout virtualization
- `SmartList` - Automatic virtualization for lists > 50 items

Uses `@tanstack/react-virtual` for windowing.

---

## 2. App.jsx Refactoring

**Before**: ~1000+ lines monolithic component  
**After**: ~670 lines lean application shell

The refactored `App.jsx` now only handles:
- Route management (URL-based tab switching)
- Theme management
- Global keyboard shortcuts (undo/redo)
- Modal state management
- Wiring data store with page components

All data fetching, caching, and CRUD logic moved to `useShortcutsStore`.

---

## 3. Data Loading & Caching Strategy

### Cache Flow
```
App Start
    ↓
Check localStorage cache
    ↓
├── Cache exists? → Render immediately with cached data
│   └── Background fetch → Compare & update if changed
│
└── No cache? → Show loading → Fetch → Render → Cache
```

### Cache Key Format
```
shortcuts_cache_{userId}_{role}_v1
```
Guest users use: `shortcuts_cache_guest_v1`

---

## 4. React.memo Optimizations

Wrapped with `React.memo` for render optimization:

### Layout Component
- `Layout` - Main layout container

### View Components (icons & helpers)
- `LeaderView`: `AppIcon`, `GenericCategoryIcon`, `LeaderKeyIcon`
- `RaycastView`: `HyperIcon`, `AppIcon`, `KeyVisual`
- `SystemView`: `HyperIcon`, `AppIcon`, `KeyVisual`
- `AppsView`: `AppIcon`, `LinkBadge`
- `HistoryView`: `ChangeDetail`, `HistoryEntry`

### UI Components
- `SearchBar` - With debounced input

---

## 5. Debounced Search

`SearchBar.jsx` now includes:
- **Local state** for immediate UI responsiveness
- **200ms debounce** before triggering parent filter callback
- **Instant clear** button (no debounce on clear)

This prevents expensive filter operations from running on every keystroke.

---

## 6. useMemo Optimizations

Memoized expensive computations:
- Filtered shortcut lists per view (in page components)
- App lookup maps (appMap)
- Grouped shortcuts by category
- Export data object

---

## 7. useCallback Optimizations

Stable callback references for:
- All CRUD handlers
- Tab change handler
- Theme toggle
- Search handler
- Undo/Redo handlers

---

## 8. List Virtualization (Ready)

Installed `@tanstack/react-virtual` and created reusable components.

To enable virtualization in a view:
```jsx
import { SmartList } from '../components/ui/VirtualizedList';

<SmartList
  items={shortcuts}
  renderItem={(item, index) => <ShortcutCard {...item} />}
  estimateSize={80}
  threshold={50}  // Only virtualize if > 50 items
/>
```

---

## 9. Backend Optimizations (Verified)

The backend already has:
- ✅ `compression` middleware enabled for all responses
- ✅ Efficient MongoDB queries with `findOne`
- ✅ Proper indexing on `userId`
- ✅ Image proxy with timeout (10s) and abort controller

---

## 10. Animation Optimizations

Framer Motion animations are kept minimal:
- Mount/unmount transitions only
- `AnimatePresence` for modal transitions
- No per-item animations on large lists during scroll

---

## Performance Measurement

### Enable Debug Mode
Add to `.env`:
```
VITE_DEBUG_PERF=true
```

### Available Metrics
- App start to first render time
- Route change to render complete
- Component render counts
- List render item counts

### Console Output
```
[Perf] App starting...
[Perf] First view (leader) rendered: 245.23ms
[Perf] Route change leader -> raycast
[Perf] Route raycast fully rendered: 12.45ms
[Perf] LeaderView rendered: 1 times
```

---

## Bundle Analysis

After optimizations:
```
dist/assets/index.css          48.64 kB │ gzip:  8.66 kB
dist/assets/react-vendor.js    11.21 kB │ gzip:  4.02 kB
dist/assets/ui-utils.js        40.71 kB │ gzip: 13.56 kB
dist/assets/framer.js         115.95 kB │ gzip: 38.35 kB
dist/assets/index.js          331.55 kB │ gzip: 91.38 kB
```

Total JS (gzipped): ~147 kB

---

## Migration Notes

### Breaking Changes
None - all changes are internal implementation details.

### New Dependencies
- `@tanstack/react-virtual` - List virtualization

### New Environment Variables
- `VITE_DEBUG_PERF` - Enable performance logging

---

## Future Optimization Opportunities

1. **Virtual Scrolling in Views**: Enable VirtualizedList for LeaderView tree traversal
2. **Web Worker for Filtering**: Move search filtering to a web worker for large datasets
3. **IndexedDB Cache**: Migrate from localStorage to IndexedDB for larger cache capacity
4. **Dynamic Imports**: Code-split views for faster initial load
5. **Service Worker**: Add offline caching for static assets
