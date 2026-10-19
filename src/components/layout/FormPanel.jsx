import React, { createContext, useContext, useEffect, useRef } from 'react';
import { FiX, FiArrowLeft } from 'react-icons/fi';
import DashboardLayout from '../../layouts/DashboardLayout';
import Toast from '../common/Toast';

const PanelContext = createContext(false);

// Route element: the list page stays visible and the add/edit/view form slides in from the right.
export function WithFormPanel({ list, children }) {
  return (
    <>
      {list}
      <PanelContext.Provider value={true}>{children}</PanelContext.Provider>
    </>
  );
}

const Spinner = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
  </div>
);

// Frame for a record form: a side panel when opened from a list (WithFormPanel), otherwise a full page.
export function FormShell({ title, description, loading = false, onClose, toast, onToastClose, children }) {
  const inPanel = useContext(PanelContext);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!inPanel) return undefined;
    // Start typing straight away: focus the first field once the panel is open.
    const timer = setTimeout(() => {
      const first = panelRef.current?.querySelector('input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
      if (first) first.focus();
    }, 50);
    const onKey = (e) => {
      if (e.key === 'Escape' && onClose && !document.querySelector('[data-dialog-open="true"]')) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
    };
  }, [inPanel, loading, onClose]);

  const toastEl = toast ? <Toast message={toast.message} type={toast.type} onClose={onToastClose} /> : null;

  if (inPanel) {
    return (
      <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="form-panel-title">
        <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={onClose} aria-hidden="true" />
        <aside
          ref={panelRef}
          className="relative w-full sm:max-w-2xl h-full flex flex-col bg-white dark:bg-brand-navyCard border-l border-line dark:border-brand-navyLine shadow-premium animate-slide-in-right"
        >
          <header className="flex items-start justify-between gap-4 px-5 sm:px-6 py-5 border-b border-line dark:border-brand-navyLine">
            <div className="min-w-0">
              <h2 id="form-panel-title" className="text-lg font-semibold text-ink dark:text-white">{title}</h2>
              {description && <p className="text-sm text-muted dark:text-gray-400 mt-0.5">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex-none w-10 h-10 inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-ink dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <FiX className="w-5 h-5" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6">
            {toastEl}
            {loading ? <Spinner /> : children}
          </div>
        </aside>
      </div>
    );
  }

  return (
    <DashboardLayout pageTitle={title}>
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-12">
        {toastEl}
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Back"
              className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-line dark:border-brand-navyLine text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <FiArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold text-ink dark:text-white">{title}</h1>
            {description && <p className="text-sm text-muted dark:text-gray-400 mt-0.5">{description}</p>}
          </div>
        </div>
        <div className="card p-6 sm:p-8">
          {loading ? <Spinner /> : children}
        </div>
      </div>
    </DashboardLayout>
  );
}
