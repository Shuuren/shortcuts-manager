import { createContext, useContext, useState, useCallback } from 'react';

const HistoryContext = createContext();

const MAX_HISTORY_SIZE = 100; // Maximum number of history entries to keep

export function HistoryProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isUndoRedoInProgress, setIsUndoRedoInProgress] = useState(false);
  
  // Track the current user to clear history when user changes
  const [currentUserId, setCurrentUserId] = useState(null);

  // Add a new change to history
  const addChange = useCallback((change) => {
    if (isUndoRedoInProgress) return;

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
    if (userId !== currentUserId) {
      // User changed, clear history
      setHistory([]);
      setCurrentIndex(-1);
      setCurrentUserId(userId);
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
