/**
 * useShortcutsStore - Centralized data management hook for shortcuts
 * 
 * Responsibilities:
 * - All shortcut/group/app state management
 * - Fetching from /api/shortcuts
 * - CRUD operations with optimistic updates
 * - Client-side caching with localStorage/IndexedDB
 * - Integration with HistoryContext for logging changes
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { API_BASE } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { useToast } from '../components/ui/Toast';

// Cache configuration
const CACHE_KEY_PREFIX = 'shortcuts_cache_';
const CACHE_VERSION = 1;

// Generate cache key based on user identity
const getCacheKey = (user) => {
  if (!user) return `${CACHE_KEY_PREFIX}guest_v${CACHE_VERSION}`;
  return `${CACHE_KEY_PREFIX}${user.id}_${user.role}_v${CACHE_VERSION}`;
};

// Load from localStorage cache
const loadFromCache = (cacheKey) => {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache is valid for 24 hours
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Failed to load from cache:', e);
  }
  return null;
};

// Save to localStorage cache
const saveToCache = (cacheKey, data) => {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Failed to save to cache:', e);
    // If storage is full, try to clear old caches
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_KEY_PREFIX))
        .forEach(k => localStorage.removeItem(k));
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e2) {
      console.warn('Failed to save even after clearing cache:', e2);
    }
  }
};

// Clear user-specific cache
const clearCache = (cacheKey) => {
  try {
    localStorage.removeItem(cacheKey);
  } catch (e) {
    console.warn('Failed to clear cache:', e);
  }
};

// Default empty state
const DEFAULT_DATA = {
  leaderShortcuts: [],
  raycastShortcuts: [],
  systemShortcuts: [],
  leaderGroups: [],
  apps: []
};

/**
 * Main hook for shortcuts data management
 */
export function useShortcutsStore() {
  const { user, token, loading: authLoading } = useAuth();
  const history = useHistory();
  const toast = useToast();
  
  // Data state
  const [data, setData] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track if initial fetch has been done
  const hasFetched = useRef(false);
  const currentCacheKey = useRef(null);
  
  // Get auth headers for API calls
  const getAuthHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);
  
  // Fetch data from server
  const fetchFromServer = useCallback(async () => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(API_BASE, { headers });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const serverData = await response.json();
      
      // Normalize data structure
      const normalizedData = {
        leaderShortcuts: serverData.leaderShortcuts || [],
        raycastShortcuts: serverData.raycastShortcuts || [],
        systemShortcuts: serverData.systemShortcuts || [],
        leaderGroups: serverData.leaderGroups || [],
        apps: serverData.apps || serverData.appsLibrary || []
      };
      
      return normalizedData;
    } catch (err) {
      console.error('Failed to fetch shortcuts:', err);
      throw err;
    }
  }, [token]);
  
  // Initialize data - first from cache, then fetch from server
  const initializeData = useCallback(async () => {
    const cacheKey = getCacheKey(user);
    currentCacheKey.current = cacheKey;
    
    // Try to load from cache first for instant render
    const cachedData = loadFromCache(cacheKey);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      
      // Then fetch fresh data in background
      fetchFromServer()
        .then(freshData => {
          // Only update if data has changed
          if (JSON.stringify(freshData) !== JSON.stringify(cachedData)) {
            setData(freshData);
            saveToCache(cacheKey, freshData);
          }
        })
        .catch(err => {
          // Silent fail - we already have cached data
          console.warn('Background fetch failed, using cached data:', err);
        });
    } else {
      // No cache, fetch immediately
      try {
        const freshData = await fetchFromServer();
        setData(freshData);
        saveToCache(cacheKey, freshData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    
    hasFetched.current = true;
  }, [user, fetchFromServer]);
  
  // Effect to initialize data when auth state changes
  useEffect(() => {
    if (!authLoading) {
      initializeData();
    }
  }, [authLoading, user?.id, initializeData]);
  
  // Refresh data from server
  const refresh = useCallback(async () => {
    try {
      const freshData = await fetchFromServer();
      setData(freshData);
      if (currentCacheKey.current) {
        saveToCache(currentCacheKey.current, freshData);
      }
      return freshData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchFromServer]);
  
  // Clear data and cache (for logout)
  const clearData = useCallback(() => {
    if (currentCacheKey.current) {
      clearCache(currentCacheKey.current);
    }
    setData(DEFAULT_DATA);
    hasFetched.current = false;
  }, []);
  
  // ============= CRUD Operations with Optimistic Updates =============
  
  // Helper to get shortcut type key
  const getShortcutType = useCallback((activeTab) => {
    switch (activeTab) {
      case 'leader': return 'leaderShortcuts';
      case 'raycast': return 'raycastShortcuts';
      case 'system': return 'systemShortcuts';
      default: return 'leaderShortcuts';
    }
  }, []);
  
  // Create shortcut
  const createShortcut = useCallback(async (shortcutData, type) => {
    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const optimisticItem = { ...shortcutData, id: tempId };
    
    setData(prev => ({
      ...prev,
      [type]: [...prev[type], optimisticItem]
    }));
    
    try {
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
      
      // Replace temp item with real item
      setData(prev => ({
        ...prev,
        [type]: prev[type].map(item => item.id === tempId ? newItem : item)
      }));
      
      // Update cache
      if (currentCacheKey.current) {
        setData(current => {
          saveToCache(currentCacheKey.current, current);
          return current;
        });
      }
      
      // Log to history
      history.addChange({
        action: 'create',
        entityType: type,
        entityId: newItem.id,
        entityName: shortcutData.name || shortcutData.action,
        before: null,
        after: newItem
      });
      
      toast.success('Shortcut created successfully!');
      return newItem;
    } catch (err) {
      // Rollback on failure
      setData(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item.id !== tempId)
      }));
      toast.error(err.message || 'Failed to create shortcut');
      throw err;
    }
  }, [getAuthHeaders, history, toast]);
  
  // Update shortcut
  const updateShortcut = useCallback(async (id, shortcutData, type) => {
    // Store previous state for rollback
    const previousData = data[type]?.find(item => item.id === id);
    if (!previousData) {
      throw new Error('Item not found');
    }
    
    // Optimistic update
    const updatedItem = { ...previousData, ...shortcutData };
    setData(prev => ({
      ...prev,
      [type]: prev[type].map(item => item.id === id ? updatedItem : item)
    }));
    
    try {
      const response = await fetch(`${API_BASE}/${type}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(shortcutData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }
      
      const serverItem = await response.json();
      
      // Update with server response
      setData(prev => ({
        ...prev,
        [type]: prev[type].map(item => item.id === id ? serverItem : item)
      }));
      
      // Update cache
      if (currentCacheKey.current) {
        setData(current => {
          saveToCache(currentCacheKey.current, current);
          return current;
        });
      }
      
      // Log to history
      history.addChange({
        action: 'update',
        entityType: type,
        entityId: id,
        entityName: shortcutData.name || shortcutData.action || previousData.name,
        before: previousData,
        after: serverItem
      });
      
      toast.success('Shortcut updated successfully!');
      return serverItem;
    } catch (err) {
      // Rollback on failure
      setData(prev => ({
        ...prev,
        [type]: prev[type].map(item => item.id === id ? previousData : item)
      }));
      toast.error(err.message || 'Failed to update shortcut');
      throw err;
    }
  }, [data, getAuthHeaders, history, toast]);
  
  // Delete shortcut
  const deleteShortcut = useCallback(async (id, type) => {
    // Store for rollback and history
    const itemToDelete = data[type]?.find(item => item.id === id);
    if (!itemToDelete) {
      throw new Error('Item not found');
    }
    
    // Optimistic update
    setData(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id)
    }));
    
    try {
      const response = await fetch(`${API_BASE}/${type}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }
      
      // Update cache
      if (currentCacheKey.current) {
        setData(current => {
          saveToCache(currentCacheKey.current, current);
          return current;
        });
      }
      
      // Log to history
      history.addChange({
        action: 'delete',
        entityType: type,
        entityId: id,
        entityName: itemToDelete.name || itemToDelete.action,
        before: itemToDelete,
        after: null
      });
      
      toast.success('Shortcut deleted successfully!');
    } catch (err) {
      // Rollback on failure
      setData(prev => ({
        ...prev,
        [type]: [...prev[type], itemToDelete]
      }));
      toast.error(err.message || 'Failed to delete shortcut');
      throw err;
    }
  }, [data, getAuthHeaders, history, toast]);
  
  // Create group
  const createGroup = useCallback(async (groupData) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticItem = { ...groupData, id: tempId };
    
    setData(prev => ({
      ...prev,
      leaderGroups: [...prev.leaderGroups, optimisticItem]
    }));
    
    try {
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
      
      setData(prev => ({
        ...prev,
        leaderGroups: prev.leaderGroups.map(g => g.id === tempId ? newGroup : g)
      }));
      
      if (currentCacheKey.current) {
        setData(current => {
          saveToCache(currentCacheKey.current, current);
          return current;
        });
      }
      
      history.addChange({
        action: 'create',
        entityType: 'leaderGroups',
        entityId: newGroup.id,
        entityName: groupData.name,
        before: null,
        after: newGroup
      });
      
      toast.success('Group created successfully!');
      return newGroup;
    } catch (err) {
      setData(prev => ({
        ...prev,
        leaderGroups: prev.leaderGroups.filter(g => g.id !== tempId)
      }));
      toast.error(err.message || 'Failed to create group');
      throw err;
    }
  }, [getAuthHeaders, history, toast]);
  
  // Update group
  const updateGroup = useCallback(async (id, groupData) => {
    const previousData = data.leaderGroups?.find(g => g.id === id);
    if (!previousData) {
      throw new Error('Group not found');
    }
    
    const updatedGroup = { ...previousData, ...groupData };
    setData(prev => ({
      ...prev,
      leaderGroups: prev.leaderGroups.map(g => g.id === id ? updatedGroup : g)
    }));
    
    try {
      const response = await fetch(`${API_BASE}/leaderGroups/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(groupData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }
      
      const serverGroup = await response.json();
      
      setData(prev => ({
        ...prev,
        leaderGroups: prev.leaderGroups.map(g => g.id === id ? serverGroup : g)
      }));
      
      if (currentCacheKey.current) {
        setData(current => {
          saveToCache(currentCacheKey.current, current);
          return current;
        });
      }
      
      history.addChange({
        action: 'update',
        entityType: 'leaderGroups',
        entityId: id,
        entityName: groupData.name || previousData.name,
        before: previousData,
        after: serverGroup
      });
      
      toast.success('Group updated successfully!');
      return serverGroup;
    } catch (err) {
      setData(prev => ({
        ...prev,
        leaderGroups: prev.leaderGroups.map(g => g.id === id ? previousData : g)
      }));
      toast.error(err.message || 'Failed to update group');
      throw err;
    }
  }, [data.leaderGroups, getAuthHeaders, history, toast]);
  
  // Delete group
  const deleteGroup = useCallback(async (id) => {
    const groupToDelete = data.leaderGroups?.find(g => g.id === id);
    if (!groupToDelete) {
      throw new Error('Group not found');
    }
    
    setData(prev => ({
      ...prev,
      leaderGroups: prev.leaderGroups.filter(g => g.id !== id)
    }));
    
    try {
      const response = await fetch(`${API_BASE}/leaderGroups/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }
      
      if (currentCacheKey.current) {
        setData(current => {
          saveToCache(currentCacheKey.current, current);
          return current;
        });
      }
      
      history.addChange({
        action: 'delete',
        entityType: 'leaderGroups',
        entityId: id,
        entityName: groupToDelete.name,
        before: groupToDelete,
        after: null
      });
      
      toast.success('Group deleted successfully!');
    } catch (err) {
      setData(prev => ({
        ...prev,
        leaderGroups: [...prev.leaderGroups, groupToDelete]
      }));
      toast.error(err.message || 'Failed to delete group');
      throw err;
    }
  }, [data.leaderGroups, getAuthHeaders, history, toast]);
  
  // Create app
  const createApp = useCallback(async (appData) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticItem = { ...appData, id: tempId };
    
    setData(prev => ({
      ...prev,
      apps: [...prev.apps, optimisticItem]
    }));
    
    try {
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
      
      setData(prev => ({
        ...prev,
        apps: prev.apps.map(a => a.id === tempId ? newApp : a)
      }));
      
      if (currentCacheKey.current) {
        setData(current => {
          saveToCache(currentCacheKey.current, current);
          return current;
        });
      }
      
      history.addChange({
        action: 'create',
        entityType: 'apps',
        entityId: newApp.id,
        entityName: appData.name,
        before: null,
        after: newApp
      });
      
      toast.success('App added to library!');
      return newApp;
    } catch (err) {
      setData(prev => ({
        ...prev,
        apps: prev.apps.filter(a => a.id !== tempId)
      }));
      toast.error(err.message || 'Failed to add app');
      throw err;
    }
  }, [getAuthHeaders, history, toast]);
  
  // Update app
  const updateApp = useCallback(async (id, appData) => {
    const previousData = data.apps?.find(a => a.id === id);
    if (!previousData) {
      throw new Error('App not found');
    }
    
    const updatedApp = { ...previousData, ...appData };
    setData(prev => ({
      ...prev,
      apps: prev.apps.map(a => a.id === id ? updatedApp : a)
    }));
    
    try {
      const response = await fetch(`${API_BASE}/apps/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(appData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }
      
      const serverApp = await response.json();
      
      setData(prev => ({
        ...prev,
        apps: prev.apps.map(a => a.id === id ? serverApp : a)
      }));
      
      if (currentCacheKey.current) {
        setData(current => {
          saveToCache(currentCacheKey.current, current);
          return current;
        });
      }
      
      history.addChange({
        action: 'update',
        entityType: 'apps',
        entityId: id,
        entityName: appData.name || previousData.name,
        before: previousData,
        after: serverApp
      });
      
      toast.success('App updated successfully!');
      return serverApp;
    } catch (err) {
      setData(prev => ({
        ...prev,
        apps: prev.apps.map(a => a.id === id ? previousData : a)
      }));
      toast.error(err.message || 'Failed to update app');
      throw err;
    }
  }, [data.apps, getAuthHeaders, history, toast]);
  
  // Delete app
  const deleteApp = useCallback(async (id) => {
    const appToDelete = data.apps?.find(a => a.id === id);
    if (!appToDelete) {
      throw new Error('App not found');
    }
    
    setData(prev => ({
      ...prev,
      apps: prev.apps.filter(a => a.id !== id)
    }));
    
    try {
      const response = await fetch(`${API_BASE}/apps/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }
      
      if (currentCacheKey.current) {
        setData(current => {
          saveToCache(currentCacheKey.current, current);
          return current;
        });
      }
      
      history.addChange({
        action: 'delete',
        entityType: 'apps',
        entityId: id,
        entityName: appToDelete.name,
        before: appToDelete,
        after: null
      });
      
      toast.success('App removed from library!');
    } catch (err) {
      setData(prev => ({
        ...prev,
        apps: [...prev.apps, appToDelete]
      }));
      toast.error(err.message || 'Failed to delete app');
      throw err;
    }
  }, [data.apps, getAuthHeaders, history, toast]);
  
  // Apply a change (used by undo/redo)
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
      
      // Refresh data after undo/redo
      await refresh();
      return true;
    } catch (err) {
      console.error('Failed to apply change:', err);
      return false;
    }
  }, [getAuthHeaders, refresh]);
  
  return {
    // State
    data,
    loading: loading || authLoading,
    error,
    
    // Data accessors
    leaderShortcuts: data.leaderShortcuts,
    raycastShortcuts: data.raycastShortcuts,
    systemShortcuts: data.systemShortcuts,
    leaderGroups: data.leaderGroups,
    apps: data.apps,
    
    // Control functions
    refresh,
    clearData,
    
    // Shortcut type helper
    getShortcutType,
    
    // CRUD operations
    createShortcut,
    updateShortcut,
    deleteShortcut,
    createGroup,
    updateGroup,
    deleteGroup,
    createApp,
    updateApp,
    deleteApp,
    
    // For undo/redo integration
    applyChange,
    getAuthHeaders
  };
}
