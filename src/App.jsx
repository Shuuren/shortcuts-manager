import { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout } from './components/layout/Layout';
import { LeaderView } from './components/views/LeaderView';
import { RaycastView } from './components/views/RaycastView';
import { SystemView } from './components/views/SystemView';
import { AppsView } from './components/views/AppsView';
import { HistoryView } from './components/views/HistoryView';
import { ExportManager } from './components/ui/ExportManager';
import { SearchBar } from './components/ui/SearchBar';
import { ShortcutForm } from './components/ui/ShortcutForm';
import { GroupForm } from './components/ui/GroupForm';
import { AppForm } from './components/ui/AppForm';
import { UndoRedoHint } from './components/ui/UndoRedoHint';
import { useToast } from './components/ui/Toast';
import { useHistory } from './context/HistoryContext';
import { useAuth } from './context/AuthContext';

import { Plus } from 'lucide-react';
import { API_BASE } from './config/api';

function App() {
  const [activeTab, setActiveTab] = useState('leader');
  const { user, canEdit, token, loading: authLoading } = useAuth();
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'dark'; // Default to dark since that was the original design
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [data, setData] = useState({ 
    leaderShortcuts: [], 
    raycastShortcuts: [], 
    systemShortcuts: [],
    leaderGroups: [],
    apps: [],
    appsLibrary: []
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();
  const history = useHistory();
  
  // Shortcut CRUD Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState(null);
  
  // Group CRUD Modal state
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  
  // App CRUD Modal state
  const [isAppFormOpen, setIsAppFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);

  // Helper to get auth headers
  const getAuthHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  // Fetch data - includes auth token to get user-specific data
  const fetchData = useCallback(() => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    fetch(API_BASE, { headers })
      .then(res => res.json())
      .then(data => {
        // Handle apps vs appsLibrary compatibility
        const processedData = {
            ...data,
            apps: data.apps || data.appsLibrary || []
        };
        setData(processedData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch shortcuts:", err);
        setLoading(false);
      });
  }, [token]);

  // Refetch data when authentication changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Redirect from history tab when user logs out (loses edit permissions)
  useEffect(() => {
    if (!canEdit && activeTab === 'history') {
      setActiveTab('leader');
    }
  }, [canEdit, activeTab]);

  // Clear history when user changes (login/logout or switching accounts)
  useEffect(() => {
    // Use username as user ID, or null for unauthenticated
    history.setCurrentUser(user?.username || null);
  }, [user?.username, history]);

  // Get shortcut type based on active tab
  const getShortcutType = () => {
    switch (activeTab) {
      case 'leader': return 'leaderShortcuts';
      case 'raycast': return 'raycastShortcuts';
      case 'system': return 'systemShortcuts';
      default: return 'leaderShortcuts';
    }
  };

  // Helper to apply a change (used by both normal operations and undo/redo)
  const applyChange = useCallback(async (entityType, action, entityId, entityData) => {
    
    try {
      if (action === 'create') {
        await fetch(`${API_BASE}/${entityType}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(entityData)
        });
      } else if (action === 'update') {
        await fetch(`${API_BASE}/${entityType}/${entityId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(entityData)
        });
      } else if (action === 'delete') {
        await fetch(`${API_BASE}/${entityType}/${entityId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      }
      fetchData();
      return true;
    } catch (err) {
      console.error(`Failed to apply change:`, err);
      return false;
    }
  }, [getAuthHeaders, fetchData]);

  // Undo operation - marks the entry as reverted
  const handleUndo = useCallback(async () => {
    if (!history.canUndo || !canEdit) return;
    
    const entry = history.getUndoEntry();
    if (!entry || entry.isReverted) return;
    
    history.setUndoRedoFlag(true);
    
    try {
      let success = false;
      
      if (entry.action === 'create') {
        // Undo create = delete the item
        success = await applyChange(entry.entityType, 'delete', entry.entityId, null, true);
      } else if (entry.action === 'update') {
        // Undo update = restore previous values
        success = await applyChange(entry.entityType, 'update', entry.entityId, entry.before, true);
      } else if (entry.action === 'delete') {
        // Undo delete = recreate the item
        success = await applyChange(entry.entityType, 'create', null, entry.before, true);
      }
      
      if (success) {
        // Mark this entry as reverted instead of creating a new entry
        history.markAsReverted(entry.id);
        history.decrementIndex();
        toast.success('Undone - click Re-apply to restore');
      } else {
        toast.error('Failed to undo');
      }
    } finally {
      history.setUndoRedoFlag(false);
    }
  }, [history, toast, canEdit, applyChange]);

  // Redo operation
  const handleRedo = useCallback(async () => {
    if (!history.canRedo || !canEdit) return;
    
    const entry = history.getRedoEntry();
    if (!entry) return;
    
    history.setUndoRedoFlag(true);
    
    try {
      let success = false;
      
      if (entry.action === 'create') {
        // Redo create = recreate the item
        success = await applyChange(entry.entityType, 'create', null, entry.after, true);
      } else if (entry.action === 'update') {
        // Redo update = apply changes again
        success = await applyChange(entry.entityType, 'update', entry.entityId, entry.after, true);
      } else if (entry.action === 'delete') {
        // Redo delete = delete again
        success = await applyChange(entry.entityType, 'delete', entry.entityId, null, true);
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
  }, [history, toast, canEdit, applyChange]);

  // Revert a specific history entry (marks it as reverted, no new entry)
  const handleRevertToEntry = useCallback(async (entry) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    if (entry.isReverted) {
      // Entry is already reverted, nothing to do
      return;
    }
    
    history.setUndoRedoFlag(true);
    
    try {
      let success = false;
      
      if (entry.action === 'create') {
        // Revert create = delete the item
        success = await applyChange(entry.entityType, 'delete', entry.entityId, null, true);
      } else if (entry.action === 'update') {
        // Revert update = restore previous values
        success = await applyChange(entry.entityType, 'update', entry.entityId, entry.before, true);
      } else if (entry.action === 'delete') {
        // Revert delete = recreate the item
        success = await applyChange(entry.entityType, 'create', null, entry.before, true);
      }
      
      if (success) {
        // Mark this entry as reverted instead of creating a new entry
        history.markAsReverted(entry.id);
        toast.success(`Reverted: ${entry.entityName || 'Item'} - click Re-apply to restore`);
      } else {
        toast.error('Failed to revert change');
      }
    } finally {
      history.setUndoRedoFlag(false);
    }
  }, [history, toast, canEdit, applyChange]);

  // Re-apply a reverted history entry
  const handleReapply = useCallback(async (entry) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    if (!entry.isReverted) {
      // Entry is not reverted, nothing to re-apply
      return;
    }
    
    history.setUndoRedoFlag(true);
    
    try {
      let success = false;
      
      if (entry.action === 'create') {
        // Re-apply create = recreate the item
        success = await applyChange(entry.entityType, 'create', null, entry.after, true);
      } else if (entry.action === 'update') {
        // Re-apply update = apply the changes again
        success = await applyChange(entry.entityType, 'update', entry.entityId, entry.after, true);
      } else if (entry.action === 'delete') {
        // Re-apply delete = delete again
        success = await applyChange(entry.entityType, 'delete', entry.entityId, null, true);
      }
      
      if (success) {
        // Mark this entry as applied (not reverted)
        history.markAsApplied(entry.id);
        toast.success(`Re-applied: ${entry.entityName || 'Item'}`);
      } else {
        toast.error('Failed to re-apply change');
      }
    } finally {
      history.setUndoRedoFlag(false);
    }
  }, [history, toast, canEdit, applyChange]);

  // Keyboard shortcuts for undo/redo (for editors - admin and demo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only allow undo/redo for users who can edit
      if (!canEdit) return;
      
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      
      if (modKey && e.key === 'z') {
        if (e.shiftKey) {
          // Cmd+Shift+Z = Redo
          e.preventDefault();
          handleRedo();
        } else {
          // Cmd+Z = Undo
          e.preventDefault();
          handleUndo();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, canEdit]);

  // Shortcut CRUD Operations (admin only)
  const handleCreate = () => {
    if (!canEdit) {
      toast.error('Login required to create shortcuts');
      return;
    }
    setEditingShortcut(null);
    setIsFormOpen(true);
  };

  const handleEdit = (shortcut) => {
    if (!canEdit) {
      toast.error('Login required to edit shortcuts');
      return;
    }
    setEditingShortcut(shortcut);
    setIsFormOpen(true);
  };

  const handleSave = async (shortcutData) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    const type = getShortcutType();
    
    try {
      if (editingShortcut) {
        // Store before state for history
        const beforeState = { ...editingShortcut };
        
        const response = await fetch(`${API_BASE}/${type}/${editingShortcut.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(shortcutData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update');
        }
        
        const updatedItem = await response.json();

        // Optimistic Update
        setData(prev => ({
          ...prev,
          [type]: prev[type].map(item => item.id === updatedItem.id ? updatedItem : item)
        }));
        
        // Add to history
        history.addChange({
          action: 'update',
          entityType: type,
          entityId: editingShortcut.id,
          entityName: shortcutData.name || shortcutData.action || editingShortcut.name,
          before: beforeState,
          after: { ...beforeState, ...shortcutData }
        });
        
        toast.success('Shortcut updated successfully!');
      } else {
        const response = await fetch(`${API_BASE}/${type}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(shortcutData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create');
        }
        
        const newItem = await response.json();
        
        // Optimistic Update
        setData(prev => ({
          ...prev,
          [type]: [...prev[type], newItem]
        }));
        
        // Add to history
        history.addChange({
          action: 'create',
          entityType: type,
          entityId: newItem.id,
          entityName: shortcutData.name || shortcutData.action,
          before: null,
          after: newItem
        });
        
        toast.success('Shortcut created successfully!');
      }
      // fetchData(); // Removed to rely on optimistic update, avoiding race conditions
    } catch (err) {
      console.error('Failed to save shortcut:', err);
      toast.error(err.message || 'Failed to save shortcut. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    const type = getShortcutType();
    
    // Find the item to store for history
    const itemToDelete = data[type]?.find(item => item.id === id);
    
    try {
      const response = await fetch(`${API_BASE}/${type}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }
      
      // Optimistic Update
      setData(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item.id !== id)
      }));

      // Add to history
      if (itemToDelete) {
        history.addChange({
          action: 'delete',
          entityType: type,
          entityId: id,
          entityName: itemToDelete.name || itemToDelete.action,
          before: itemToDelete,
          after: null
        });
      }
      
      // fetchData();
      toast.success('Shortcut deleted successfully!');
    } catch (err) {
      console.error('Failed to delete shortcut:', err);
      toast.error(err.message || 'Failed to delete shortcut. Please try again.');
    }
  };

  // Group CRUD Operations
  const handleEditGroup = (group) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    setEditingGroup(group);
    setIsGroupFormOpen(true);
  };

  const handleCreateGroup = () => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    setEditingGroup(null);
    setIsGroupFormOpen(true);
  };

  const handleSaveGroup = async (groupData) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    try {
      if (editingGroup) {
        const beforeState = { ...editingGroup };
        
        const response = await fetch(`${API_BASE}/leaderGroups/${editingGroup.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(groupData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update');
        }
        
        const updatedGroup = await response.json();

        // Optimistic Update
        setData(prev => ({
            ...prev,
            leaderGroups: prev.leaderGroups.map(g => g.id === updatedGroup.id ? updatedGroup : g)
        }));
        
        history.addChange({
          action: 'update',
          entityType: 'leaderGroups',
          entityId: editingGroup.id,
          entityName: groupData.name || editingGroup.name,
          before: beforeState,
          after: { ...beforeState, ...groupData }
        });
        
        toast.success('Group updated successfully!');
      } else {
        const response = await fetch(`${API_BASE}/leaderGroups`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(groupData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create');
        }
        
        const newGroup = await response.json();

        // Optimistic Update
        setData(prev => ({
            ...prev,
            leaderGroups: [...prev.leaderGroups, newGroup]
        }));
        
        history.addChange({
          action: 'create',
          entityType: 'leaderGroups',
          entityId: newGroup.id,
          entityName: groupData.name,
          before: null,
          after: newGroup
        });
        
        toast.success('Group created successfully!');
      }
      // fetchData();
    } catch (err) {
      console.error('Failed to save group:', err);
      toast.error(err.message || 'Failed to save group. Please try again.');
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    const groupToDelete = data.leaderGroups?.find(g => g.id === id);
    
    try {
      const response = await fetch(`${API_BASE}/leaderGroups/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }
      
      // Optimistic Update
      setData(prev => ({
         ...prev,
         leaderGroups: prev.leaderGroups.filter(g => g.id !== id)
      }));

      if (groupToDelete) {
        history.addChange({
          action: 'delete',
          entityType: 'leaderGroups',
          entityId: id,
          entityName: groupToDelete.name,
          before: groupToDelete,
          after: null
        });
      }
      
      // fetchData();
      toast.success('Group deleted successfully!');
    } catch (err) {
      console.error('Failed to delete group:', err);
      toast.error(err.message || 'Failed to delete group. Please try again.');
    }
  };

  // App CRUD Operations
  const handleEditApp = (app) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    setEditingApp(app);
    setIsAppFormOpen(true);
  };

  const handleCreateApp = () => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    setEditingApp(null);
    setIsAppFormOpen(true);
  };

  const handleSaveApp = async (appData) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    try {
      if (editingApp) {
        const beforeState = { ...editingApp };
        
        const response = await fetch(`${API_BASE}/apps/${editingApp.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(appData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update');
        }
        const updatedApp = await response.json();

        // Optimistic Update
        setData(prev => ({
            ...prev,
            apps: prev.apps.map(a => a.id === updatedApp.id ? updatedApp : a)
        }));
        
        history.addChange({
          action: 'update',
          entityType: 'apps',
          entityId: editingApp.id,
          entityName: appData.name || editingApp.name,
          before: beforeState,
          after: { ...beforeState, ...appData }
        });
        
        toast.success('App updated successfully!');
      } else {
        const response = await fetch(`${API_BASE}/apps`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(appData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create');
        }
        
        const newApp = await response.json();
        
        // Optimistic Update
        setData(prev => ({
            ...prev,
            apps: [...prev.apps, newApp]
        }));
        
        history.addChange({
          action: 'create',
          entityType: 'apps',
          entityId: newApp.id,
          entityName: appData.name,
          before: null,
          after: newApp
        });
        
        toast.success('App added to library!');
      }
      // fetchData();
    } catch (err) {
      console.error('Failed to save app:', err);
      toast.error(err.message || 'Failed to save app. Please try again.');
    }
  };

  const handleDeleteApp = async (id) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    const appToDelete = data.apps?.find(a => a.id === id);
    
    try {
      const response = await fetch(`${API_BASE}/apps/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }
      
      // Optimistic Update
      setData(prev => ({
          ...prev,
          apps: prev.apps.filter(a => a.id !== id)
      }));

      if (appToDelete) {
        history.addChange({
          action: 'delete',
          entityType: 'apps',
          entityId: id,
          entityName: appToDelete.name,
          before: appToDelete,
          after: null
        });
      }
      
      // fetchData();
      toast.success('App removed from library!');
    } catch (err) {
      console.error('Failed to delete app:', err);
      toast.error(err.message || 'Failed to delete app. Please try again.');
    }
  };

  // Handle editing a shortcut from the App form (linked shortcuts panel)
  const handleEditShortcutFromApp = (shortcut, shortcutType) => {
    if (!canEdit) {
      toast.error('Login required');
      return;
    }
    
    // Close app form first
    setIsAppFormOpen(false);
    setEditingApp(null);
    
    // Switch to the appropriate tab
    const tabMap = {
      'leaderShortcuts': 'leader',
      'raycastShortcuts': 'raycast',
      'systemShortcuts': 'system'
    };
    const targetTab = tabMap[shortcutType] || 'leader';
    setActiveTab(targetTab);
    
    // Highlight the shortcut in the view
    setHighlightedShortcutId(shortcut.id);
    
    // Reset highlight after a delay so it doesn't persist forever
    setTimeout(() => {
        setHighlightedShortcutId(null);
    }, 3000);
    
    // Open the form after a slight delay
    setTimeout(() => {
      setEditingShortcut(shortcut);
      setIsFormOpen(true);
    }, 100);
  };

  // Filter Logic
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const lowerQ = searchQuery.toLowerCase();

    const matches = (item) => {
      // Search specific text fields that are user-facing
      const textFields = [
        item.name,
        item.action,
        item.commandName,
        item.app,
        item.appOrContext, // Critical for System Shortcuts
        item.extension,    // Critical for Raycast
        item.category,
        item.aliasText,
        item.keys,
        item.notes
      ];

      const textMatch = textFields.some(val => 
        val && typeof val === 'string' && val.toLowerCase().includes(lowerQ)
      );

      // Search sequence (joined) - e.g. "vc" matches "Leader v c"
      const sequenceMatch = item.sequence && Array.isArray(item.sequence) && 
        item.sequence.join('').toLowerCase().includes(lowerQ);

      // Search tags
      const tagMatch = item.tags && Array.isArray(item.tags) && 
        item.tags.some(t => t.toLowerCase().includes(lowerQ));

      return textMatch || sequenceMatch || tagMatch;
    };

    return {
        ...data,
        leaderShortcuts: data.leaderShortcuts.filter(matches),
        raycastShortcuts: data.raycastShortcuts.filter(matches),
        systemShortcuts: data.systemShortcuts.filter(matches),
        apps: (data.apps || data.appsLibrary || []).filter(matches),
    };
  }, [data, searchQuery]);

  // Handle highlighting shortcuts from App Library
  const [highlightedShortcutId, setHighlightedShortcutId] = useState(null);

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onSearch={setSearchQuery}
      user={user}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      <div className="h-full relative">
        {loading || authLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] animate-pulse gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--text-muted)]/20"></div>
                <div>Loading shortcuts...</div>
            </div>
        ) : (
          <>
            <div className={`h-full ${activeTab === 'leader' ? 'block' : 'hidden'}`}>
                <LeaderView 
                    shortcuts={filteredData.leaderShortcuts} 
                    groups={data.leaderGroups}
                    apps={data.apps} // Pass apps for icon lookup
                    searchQuery={searchQuery}
                    onEdit={handleEdit}
                    onEditGroup={handleEditGroup}
                    onCreateGroup={handleCreateGroup}
                    highlightedShortcutId={highlightedShortcutId}
                />
            </div>
            
            <div className={`h-full ${activeTab === 'raycast' ? 'block' : 'hidden'}`}>
                <RaycastView 
                    shortcuts={filteredData.raycastShortcuts} 
                    apps={data.apps} // Pass apps for icon lookup  
                    searchQuery={searchQuery}
                    onEdit={handleEdit}
                    highlightedShortcutId={highlightedShortcutId}
                />
            </div>
            
            <div className={`h-full ${activeTab === 'system' ? 'block' : 'hidden'}`}>
                <SystemView 
                    shortcuts={filteredData.systemShortcuts} 
                    apps={data.apps} // Pass apps for icon lookup
                    onEdit={handleEdit}
                    onEditGroup={() => {
                        // System groups are virtual, can't be edited yet
                        toast.error("System categories cannot be edited yet.");
                    }}
                    highlightedShortcutId={highlightedShortcutId}
                />
            </div>
            
            <div className={`h-full ${activeTab === 'apps' ? 'block' : 'hidden'}`}>
                <AppsView 
                    apps={filteredData.apps} 
                    onEdit={handleEditApp}
                    onCreate={handleCreateApp}
                />
            </div>

            <div className={`h-full ${activeTab === 'export' ? 'block' : 'hidden'}`}>
                <ExportManager 
                    shortcuts={data}
                />
            </div>

            <div className={`h-full ${activeTab === 'history' ? 'block' : 'hidden'}`}>
                <HistoryView 
                    onRevert={handleRevertToEntry}
                    onReapply={handleReapply}
                />
            </div>
          </>
        )}

        {/* Global Floating Action Button for adding shortcuts */}
        {canEdit && activeTab !== 'apps' && activeTab !== 'history' && activeTab !== 'export' && (
            <button
                onClick={handleCreate}
                className="absolute bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-50"
                title="Add Shortcut"
            >
                <Plus size={24} />
            </button>
        )}

        {/* Floating Action Button for adding apps in App Library */}
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
            apps={data.apps} 
        />
        
        <GroupForm 
            isOpen={isGroupFormOpen} 
            onClose={() => setIsGroupFormOpen(false)} 
            group={editingGroup}
            onSave={handleSaveGroup}
            onDelete={editingGroup ? () => handleDeleteGroup(editingGroup.id) : undefined}
            existingGroups={data.leaderGroups} 
        />

        <AppForm 
            isOpen={isAppFormOpen}
            onClose={() => setIsAppFormOpen(false)}
            app={editingApp}
            shortcuts={data} 
            onSave={handleSaveApp}
            onDelete={editingApp ? () => handleDeleteApp(editingApp.id) : undefined}
            onEditShortcut={handleEditShortcutFromApp}
        />
      </div>
    </Layout>
  );
}

export default App;
