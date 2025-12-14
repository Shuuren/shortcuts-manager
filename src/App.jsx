/**
 * App.jsx - Lean Application Shell
 * 
 * Responsibilities:
 * - Route management (tab switching via URL)
 * - Theme management
 * - Global keyboard shortcuts (undo/redo)
 * - Modal state management
 * - Wiring up data store with views
 */

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Layout } from './components/layout/Layout';
import { ShortcutForm } from './components/ui/ShortcutForm';
import { GroupForm } from './components/ui/GroupForm';
import { AppForm } from './components/ui/AppForm';
import { UndoRedoHint } from './components/ui/UndoRedoHint';
import { useHistory } from './context/HistoryContext';
import { useAuth } from './context/AuthContext';
import { useShortcutsStore } from './hooks/useShortcutsStore';
import { useToast } from './components/ui/Toast';
import { Plus } from 'lucide-react';

// Page components (memoized containers)
import { LeaderPage, RaycastPage, SystemPage, AppsPage, HistoryPage, ExportPage } from './pages';

// Performance utilities
import { markAppStart, trackRouteChange, measureFirstViewRender, DEBUG_PERF } from './utils/perf';

// Mark app start for performance tracking
if (DEBUG_PERF) {
  markAppStart();
}

// ============= Route Configuration =============

const ROUTE_MAP = {
  '/': 'leader',
  '/leader': 'leader',
  '/leaderkey': 'leader',
  '/raycast': 'raycast',
  '/system': 'system',
  '/apps': 'apps',
  '/export': 'export',
  '/history': 'history',
};

// Get initial tab from URL path
const getInitialTab = () => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.toLowerCase();
    return ROUTE_MAP[path] || 'leader';
  }
  return 'leader';
};

// ============= Loading Skeleton =============

const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] animate-pulse gap-4">
      <div className="w-12 h-12 rounded-xl bg-[var(--text-muted)]/20"></div>
      <div>Loading shortcuts...</div>
    </div>
  );
});

// ============= Main App Component =============

function App() {
  // ---- Route State ----
  const [activeTab, setActiveTab] = useState(getInitialTab);
  
  // ---- Auth & Permissions ----
  const { user, canEdit, loading: authLoading } = useAuth();
  
  // ---- Data Store ----
  const store = useShortcutsStore();
  const toast = useToast();
  const history = useHistory();
  
  // ---- Theme State ----
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'dark';
  });

  // ---- Modal State ----
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isAppFormOpen, setIsAppFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  
  // ---- Highlight State ----
  const [highlightedShortcutId, setHighlightedShortcutId] = useState(null);
  
  // ---- Search State ----
  const [searchQuery, setSearchQuery] = useState('');

  // ============= Effects =============

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event) => {
      const newTab = event.state?.tab || ROUTE_MAP[window.location.pathname.toLowerCase()] || 'leader';
      setActiveTab(newTab);
      if (DEBUG_PERF) trackRouteChange('popstate', newTab);
    };

    window.addEventListener('popstate', handlePopState);
    
    // Set initial history state
    const currentTab = getInitialTab();
    const currentPath = currentTab === 'leader' ? '/' : `/${currentTab}`;
    window.history.replaceState({ tab: currentTab }, '', currentPath);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!canEdit) return;
      
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      
      if (modKey && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });  // No deps - uses stable functions from outer scope

  // Performance: measure first view render
  useEffect(() => {
    if (!store.loading && DEBUG_PERF) {
      measureFirstViewRender(activeTab);
    }
  }, [store.loading, activeTab]);

  // ============= Handlers =============

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const handleTabChange = useCallback((newTab) => {
    if (DEBUG_PERF) trackRouteChange(activeTab, newTab);
    setActiveTab(newTab);
    const newPath = newTab === 'leader' ? '/' : `/${newTab}`;
    window.history.pushState({ tab: newTab }, '', newPath);
  }, [activeTab]);

  // Redirect from history tab when user loses edit permissions
  useEffect(() => {
    if (!canEdit && activeTab === 'history') {
      handleTabChange('leader');
    }
  }, [canEdit, activeTab, handleTabChange]);

  // Get shortcut type for current tab
  const getShortcutType = useCallback(() => {
    return store.getShortcutType(activeTab);
  }, [activeTab, store]);

  // ---- Shortcut CRUD ----
  const handleCreate = useCallback(() => {
    if (!canEdit) {
      toast.error('Login required to create shortcuts');
      return;
    }
    setEditingShortcut(null);
    setIsFormOpen(true);
  }, [canEdit, toast]);

  const handleEdit = useCallback((shortcut) => {
    if (!canEdit) {
      toast.error('Login required to edit shortcuts');
      return;
    }
    setEditingShortcut(shortcut);
    setIsFormOpen(true);
  }, [canEdit, toast]);

  const handleSave = useCallback(async (shortcutData) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    const type = getShortcutType();
    
    try {
      if (editingShortcut) {
        await store.updateShortcut(editingShortcut.id, shortcutData, type);
      } else {
        await store.createShortcut(shortcutData, type);
      }
      setIsFormOpen(false);
      setEditingShortcut(null);
    } catch {
      // Error is already handled by store
    }
  }, [canEdit, editingShortcut, getShortcutType, store, toast]);

  const handleDelete = useCallback(async (id) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    const type = getShortcutType();
    
    try {
      await store.deleteShortcut(id, type);
      setIsFormOpen(false);
      setEditingShortcut(null);
    } catch {
      // Error is already handled by store
    }
  }, [canEdit, getShortcutType, store, toast]);

  // ---- Group CRUD ----
  const handleEditGroup = useCallback((group) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    setEditingGroup(group);
    setIsGroupFormOpen(true);
  }, [canEdit, toast]);

  const handleCreateGroup = useCallback(() => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    setEditingGroup(null);
    setIsGroupFormOpen(true);
  }, [canEdit, toast]);

  const handleSaveGroup = useCallback(async (groupData) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    try {
      if (editingGroup) {
        await store.updateGroup(editingGroup.id, groupData);
      } else {
        await store.createGroup(groupData);
      }
      setIsGroupFormOpen(false);
      setEditingGroup(null);
    } catch {
      // Error is already handled by store
    }
  }, [canEdit, editingGroup, store, toast]);

  const handleDeleteGroup = useCallback(async (id) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    try {
      await store.deleteGroup(id);
      setIsGroupFormOpen(false);
      setEditingGroup(null);
    } catch {
      // Error is already handled by store
    }
  }, [canEdit, store, toast]);

  // ---- App CRUD ----
  const handleEditApp = useCallback((app) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    setEditingApp(app);
    setIsAppFormOpen(true);
  }, [canEdit, toast]);

  const handleCreateApp = useCallback(() => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    setEditingApp(null);
    setIsAppFormOpen(true);
  }, [canEdit, toast]);

  const handleSaveApp = useCallback(async (appData) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    try {
      if (editingApp) {
        await store.updateApp(editingApp.id, appData);
      } else {
        await store.createApp(appData);
      }
      setIsAppFormOpen(false);
      setEditingApp(null);
    } catch {
      // Error is already handled by store
    }
  }, [canEdit, editingApp, store, toast]);

  const handleDeleteApp = useCallback(async (id) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    try {
      await store.deleteApp(id);
      setIsAppFormOpen(false);
      setEditingApp(null);
    } catch {
      // Error is already handled by store
    }
  }, [canEdit, store, toast]);

  // ---- Edit shortcut from App form ----
  const handleEditShortcutFromApp = useCallback((shortcut, shortcutType) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    setIsAppFormOpen(false);
    setEditingApp(null);
    
    const tabMap = {
      'leaderShortcuts': 'leader',
      'raycastShortcuts': 'raycast',
      'systemShortcuts': 'system'
    };
    const targetTab = tabMap[shortcutType] || 'leader';
    handleTabChange(targetTab);
    
    setHighlightedShortcutId(shortcut.id);
    setTimeout(() => setHighlightedShortcutId(null), 3000);
    
    setTimeout(() => {
      setEditingShortcut(shortcut);
      setIsFormOpen(true);
    }, 100);
  }, [canEdit, handleTabChange, toast]);

  // ---- Undo/Redo ----
  const handleUndo = useCallback(async () => {
    if (!history.canUndo || !canEdit) return;
    
    const entry = history.getUndoEntry();
    if (!entry || entry.isReverted) return;
    
    history.setUndoRedoFlag(true);
    
    try {
      let success = false;
      
      if (entry.action === 'create') {
        success = await store.applyChange(entry.entityType, 'delete', entry.entityId, null);
      } else if (entry.action === 'update') {
        success = await store.applyChange(entry.entityType, 'update', entry.entityId, entry.before);
      } else if (entry.action === 'delete') {
        success = await store.applyChange(entry.entityType, 'create', null, entry.before);
      }
      
      if (success) {
        history.markAsReverted(entry.id);
        history.decrementIndex();
        toast.success('Undone - click Re-apply to restore');
      } else {
        toast.error('Failed to undo');
      }
    } finally {
      history.setUndoRedoFlag(false);
    }
  }, [history, toast, canEdit, store]);

  const handleRedo = useCallback(async () => {
    if (!history.canRedo || !canEdit) return;
    
    const entry = history.getRedoEntry();
    if (!entry) return;
    
    history.setUndoRedoFlag(true);
    
    try {
      let success = false;
      
      if (entry.action === 'create') {
        success = await store.applyChange(entry.entityType, 'create', null, entry.after);
      } else if (entry.action === 'update') {
        success = await store.applyChange(entry.entityType, 'update', entry.entityId, entry.after);
      } else if (entry.action === 'delete') {
        success = await store.applyChange(entry.entityType, 'delete', entry.entityId, null);
      }
      
      if (success) {
        history.incrementIndex();
        toast.success('Redo successful');
      } else {
        toast.error('Failed to redo');
      }
    } finally {
      history.setUndoRedoFlag(false);
    }
  }, [history, toast, canEdit, store]);

  // ---- History Actions ----
  const handleRevertToEntry = useCallback(async (entry) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    if (entry.isReverted) return;
    
    history.setUndoRedoFlag(true);
    
    try {
      let success = false;
      
      if (entry.action === 'create') {
        success = await store.applyChange(entry.entityType, 'delete', entry.entityId, null);
      } else if (entry.action === 'update') {
        success = await store.applyChange(entry.entityType, 'update', entry.entityId, entry.before);
      } else if (entry.action === 'delete') {
        success = await store.applyChange(entry.entityType, 'create', null, entry.before);
      }
      
      if (success) {
        history.markAsReverted(entry.id);
        toast.success(`Reverted: ${entry.entityName || 'Item'} - click Re-apply to restore`);
      } else {
        toast.error('Failed to revert change');
      }
    } finally {
      history.setUndoRedoFlag(false);
    }
  }, [history, toast, canEdit, store]);

  const handleReapply = useCallback(async (entry) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    if (!entry.isReverted) return;
    
    history.setUndoRedoFlag(true);
    
    try {
      let success = false;
      
      if (entry.action === 'create') {
        success = await store.applyChange(entry.entityType, 'create', null, entry.after);
      } else if (entry.action === 'update') {
        success = await store.applyChange(entry.entityType, 'update', entry.entityId, entry.after);
      } else if (entry.action === 'delete') {
        success = await store.applyChange(entry.entityType, 'delete', entry.entityId, null);
      }
      
      if (success) {
        history.markAsApplied(entry.id);
        toast.success(`Re-applied: ${entry.entityName || 'Item'}`);
      } else {
        toast.error('Failed to re-apply change');
      }
    } finally {
      history.setUndoRedoFlag(false);
    }
  }, [history, toast, canEdit, store]);

  // ============= Computed Values =============

  // Memoized data object for ExportPage
  const exportData = useMemo(() => ({
    leaderShortcuts: store.leaderShortcuts,
    raycastShortcuts: store.raycastShortcuts,
    systemShortcuts: store.systemShortcuts,
    leaderGroups: store.leaderGroups,
    apps: store.apps
  }), [store.leaderShortcuts, store.raycastShortcuts, store.systemShortcuts, store.leaderGroups, store.apps]);

  // ============= Render =============

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={handleTabChange}
      onSearch={setSearchQuery}
      searchQuery={searchQuery}
      user={user}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      <div className="h-full relative">
        {store.loading || authLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Leader View */}
            <div className={`h-full ${activeTab === 'leader' ? 'block' : 'hidden'}`}>
              <LeaderPage 
                shortcuts={store.leaderShortcuts}
                groups={store.leaderGroups}
                apps={store.apps}
                searchQuery={searchQuery}
                onEdit={handleEdit}
                onEditGroup={handleEditGroup}
                onCreateGroup={handleCreateGroup}
                highlightedShortcutId={highlightedShortcutId}
              />
            </div>
            
            {/* Raycast View */}
            <div className={`h-full ${activeTab === 'raycast' ? 'block' : 'hidden'}`}>
              <RaycastPage 
                shortcuts={store.raycastShortcuts}
                apps={store.apps}
                searchQuery={searchQuery}
                onEdit={handleEdit}
                onEditGroup={handleEditGroup}
                highlightedShortcutId={highlightedShortcutId}
              />
            </div>
            
            {/* System View */}
            <div className={`h-full ${activeTab === 'system' ? 'block' : 'hidden'}`}>
              <SystemPage 
                shortcuts={store.systemShortcuts}
                apps={store.apps}
                searchQuery={searchQuery}
                onEdit={handleEdit}
                onEditGroup={handleEditGroup}
                highlightedShortcutId={highlightedShortcutId}
              />
            </div>
            
            {/* Apps View */}
            <div className={`h-full ${activeTab === 'apps' ? 'block' : 'hidden'}`}>
              <AppsPage 
                apps={store.apps}
                searchQuery={searchQuery}
                onEdit={handleEditApp}
                onCreate={handleCreateApp}
              />
            </div>

            {/* Export View */}
            <div className={`h-full ${activeTab === 'export' ? 'block' : 'hidden'}`}>
              <ExportPage shortcuts={exportData} />
            </div>

            {/* History View */}
            <div className={`h-full ${activeTab === 'history' ? 'block' : 'hidden'}`}>
              <HistoryPage 
                onRevert={handleRevertToEntry}
                onReapply={handleReapply}
              />
            </div>
          </>
        )}

        {/* Floating Action Button for shortcuts */}
        {canEdit && activeTab !== 'apps' && activeTab !== 'history' && activeTab !== 'export' && (
          <button
            onClick={handleCreate}
            className="absolute bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-50"
            title="Add Shortcut"
          >
            <Plus size={24} />
          </button>
        )}

        {/* Floating Action Button for apps */}
        {canEdit && activeTab === 'apps' && (
          <button
            onClick={handleCreateApp}
            className="absolute bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-50"
            title="Add App"
          >
            <Plus size={24} />
          </button>
        )}

        {/* Undo/Redo Hint Widget */}
        {canEdit && (activeTab === 'leader' || activeTab === 'raycast' || activeTab === 'system' || activeTab === 'apps' || activeTab === 'history') && (
          <UndoRedoHint 
            canUndo={history.canUndo}
            canRedo={history.canRedo}
            historyLength={history.history.length}
            activeTab={activeTab}
            hasRecentActivity={history.hasSessionActivity}
          />
        )}

        {/* Modals */}
        <ShortcutForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          shortcut={editingShortcut}
          shortcutType={getShortcutType()} 
          onSave={handleSave}
          onDelete={editingShortcut ? () => handleDelete(editingShortcut.id) : undefined}
          apps={store.apps} 
        />
        
        <GroupForm 
          isOpen={isGroupFormOpen} 
          onClose={() => setIsGroupFormOpen(false)} 
          group={editingGroup}
          onSave={handleSaveGroup}
          onDelete={editingGroup ? () => handleDeleteGroup(editingGroup.id) : undefined}
          existingGroups={store.leaderGroups} 
        />

        <AppForm 
          isOpen={isAppFormOpen}
          onClose={() => setIsAppFormOpen(false)}
          app={editingApp}
          shortcuts={exportData} 
          onSave={handleSaveApp}
          onDelete={editingApp ? () => handleDeleteApp(editingApp.id) : undefined}
          onEditShortcut={handleEditShortcutFromApp}
        />
      </div>
    </Layout>
  );
}

export default App;
