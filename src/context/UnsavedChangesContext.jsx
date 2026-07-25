import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const UnsavedChangesContext = createContext(null);

export const useUnsavedChanges = () => {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error('useUnsavedChanges must be used inside UnsavedChangesProvider');
  }
  return context;
};

export const UnsavedChangesProvider = ({ children }) => {
  const [isDirty, setIsDirty] = useState(false);
  const onSaveRef = useRef(null);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const setOnSave = useCallback((cb) => {
    onSaveRef.current = cb;
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. If you leave now, your changes will be lost.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const confirmNavigation = (action) => {
    if (isDirty) {
      setPendingNavigation(() => action);
    } else {
      action();
    }
  };

  const handleSave = async () => {
    if (onSaveRef.current) {
      const success = await onSaveRef.current();
      if (success !== false) {
        setIsDirty(false);
        const nav = pendingNavigation;
        setPendingNavigation(null);
        if (nav) nav();
      } else {
        setPendingNavigation(null);
      }
    }
  };

  const handleDiscard = () => {
    setIsDirty(false);
    const nav = pendingNavigation;
    setPendingNavigation(null);
    if (nav) nav();
  };

  const handleCancel = () => {
    setPendingNavigation(null);
  };

  const resetUnsavedChanges = () => {
    setIsDirty(false);
    setPendingNavigation(null);
    onSaveRef.current = null;
  };

  return (
    <UnsavedChangesContext.Provider value={{ isDirty, setIsDirty, confirmNavigation, setOnSave, resetUnsavedChanges }}>
      {children}
      {pendingNavigation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in select-none">
          <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Unsaved Changes</h2>
                <p className="text-[11px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">You have unsaved changes. If you leave now, your changes will be lost.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-enterprise">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-805 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-55 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscard}
                className="px-4 py-2 text-xs font-bold text-white bg-feedback-error rounded-lg hover:bg-red-650 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </UnsavedChangesContext.Provider>
  );
};
