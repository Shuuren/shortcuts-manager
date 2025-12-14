import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const HistoryContext = createContext();

const MAX_HISTORY_SIZE = 100; // Maximum number of history entries to keep
const HISTORY_STORAGE_KEY = 'shortcuts_manager_history';
const HISTORY_INDEX_KEY = 'shortcuts_manager_history_index';
const HISTORY_USER_KEY = 'shortcuts_manager_history_user';

// Helper to save history to localStorage
const saveHistoryToStorage = (history, index, userId) => {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    localStorage.setItem(HISTORY_INDEX_KEY, String(index));
    if (userId !== undefined) {
      localStorage.setItem(HISTORY_USER_KEY, userId || '');
    }
  } catch (e) {
    console.error('Failed to save history to localStorage:', e);
  }
};

export function HistoryProvider({ children }) {
  // Initialize from localStorage using lazy initialization
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load history from localStorage:', e);
    }
    return [];
  });
  
  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      const storedIndex = localStorage.getItem(HISTORY_INDEX_KEY);
      if (storedIndex !== null) {
        return parseInt(storedIndex, 10);
      }
      // If no stored index but we have history, set to end
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        return history.length - 1;
      }
    } catch (e) {
      console.error('Failed to load history index from localStorage:', e);
    }
    return -1;
  });
  
  const [isUndoRedoInProgress, setIsUndoRedoInProgress] = useState(false);
  
  // Track if any CRUD activity has happened in this session
  // This prevents the undo/redo tooltip from showing on page refresh when history exists from previous sessions
  const [hasSessionActivity, setHasSessionActivity] = useState(false);
  
  // Track the current user to clear history when user changes
  // Initialize from localStorage so we remember who the history belongs to
  const [currentUserId, setCurrentUserId] = useState(() => {
    try {
      const stored = localStorage.getItem(HISTORY_USER_KEY);
      return stored || null;
    } catch {
      return null;
    }
  });
  
  // Track if this is the initial render to avoid unnecessary saves
  const hasInitialized = useRef(false);

  // Persist history to localStorage whenever it changes
  useEffect(() => {
    // Skip the very first render (initial load from localStorage)
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }
    saveHistoryToStorage(history, currentIndex);
  }, [history, currentIndex]);

  // Add a new change to history
  const addChange = useCallback((change) => {
    if (isUndoRedoInProgress) return;
    
    // Mark that we have session activity (for showing undo/redo tooltip)
    setHasSessionActivity(true);

    setHistory(prev => {
      // Remove any "future" entries if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      
      const newEntry = {
        id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ...change
      };
      
      const updated = [...newHistory, newEntry];
      
      // Limit history size
      if (updated.length > MAX_HISTORY_SIZE) {
        return updated.slice(-MAX_HISTORY_SIZE);
      }
      return updated;
    });
    
    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, MAX_HISTORY_SIZE - 1);
      return newIndex;
    });
  }, [currentIndex, isUndoRedoInProgress]);

  // Check if undo is available
  const canUndo = currentIndex >= 0;
  
  // Check if redo is available
  const canRedo = currentIndex < history.length - 1;

  // Get the entry to undo
  const getUndoEntry = useCallback(() => {
    if (!canUndo) return null;
    return history[currentIndex];
  }, [canUndo, currentIndex, history]);

  // Get the entry to redo
  const getRedoEntry = useCallback(() => {
    if (!canRedo) return null;
    return history[currentIndex + 1];
  }, [canRedo, currentIndex, history]);

  // Move index backward (for undo)
  const decrementIndex = useCallback(() => {
    setCurrentIndex(prev => Math.max(-1, prev - 1));
  }, []);

  // Move index forward (for redo)
  const incrementIndex = useCallback(() => {
    setCurrentIndex(prev => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  // Mark an entry as reverted (for undo/revert operations)
  const markAsReverted = useCallback((entryId) => {
    setHistory(prev => prev.map(entry => 
      entry.id === entryId ? { ...entry, isReverted: true } : entry
    ));
  }, []);

  // Mark an entry as applied (for re-apply operations)
  const markAsApplied = useCallback((entryId) => {
    setHistory(prev => prev.map(entry => 
      entry.id === entryId ? { ...entry, isReverted: false } : entry
    ));
  }, []);

  // Get all history entries
  const getHistory = useCallback(() => {
    return history.map((entry, index) => ({
      ...entry,
      isCurrent: index === currentIndex,
      canRevert: index <= currentIndex && !entry.isReverted,
      canReapply: entry.isReverted === true
    }));
  }, [history, currentIndex]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  // Set flag for undo/redo operations
  const setUndoRedoFlag = useCallback((flag) => {
    setIsUndoRedoInProgress(flag);
  }, []);

  // Set the current user - clears history when user changes
  const setCurrentUser = useCallback((userId) => {
    const normalizedUserId = userId || null;
    const normalizedCurrentUserId = currentUserId || null;
    
    // Only clear history if the user actually changed (not on initial load with same user)
    if (normalizedUserId !== normalizedCurrentUserId) {
      // User changed, clear history and save new user ID
      setHistory([]);
      setCurrentIndex(-1);
      setCurrentUserId(normalizedUserId);
      // Save the new user ID to localStorage
      saveHistoryToStorage([], -1, normalizedUserId);
    }
  }, [currentUserId]);

  return (
    <HistoryContext.Provider value={{
      history,
      currentIndex,
      addChange,
      canUndo,
      canRedo,
      getUndoEntry,
      getRedoEntry,
      decrementIndex,
      incrementIndex,
      markAsReverted,
      markAsApplied,
      getHistory,
      clearHistory,
      isUndoRedoInProgress,
      setUndoRedoFlag,
      hasSessionActivity,
      setCurrentUser,
      deleteEntry: (entryId) => {
        setHistory(prev => {
          const indexToDelete = prev.findIndex(entry => entry.id === entryId);
          if (indexToDelete === -1) return prev;

          setCurrentIndex(curr => {
            if (indexToDelete <= curr) {
              return Math.max(-1, curr - 1);
            }
            return curr;
          });

          return prev.filter(entry => entry.id !== entryId);
        });
      }
    }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}
