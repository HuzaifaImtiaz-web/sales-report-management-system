import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiZap, FiX, FiCheckCircle } from 'react-icons/fi';
import UpdateCenter from './UpdateCenter';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';

export default function AutoUpdateNotifier() {
  const { isDirty } = useUnsavedChanges();
  const [updateState, setUpdateState] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Initial silent check on startup after 3 seconds
    const timer = setTimeout(() => {
      if (window.api && window.api.updater) {
        window.api.updater.checkForUpdates(true).catch(() => {});
      }
    }, 3000);

    let unsubscribe = null;
    if (window.api && window.api.updater) {
      unsubscribe = window.api.updater.onStatusChanged((status) => {
        setUpdateState(status);
      });
    }

    return () => {
      clearTimeout(timer);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  if (!updateState || dismissed) return null;

  // Show floating notification badge if update is available or ready
  const isAvailable = updateState.status === 'available';
  const isDownloaded = updateState.status === 'downloaded';

  if (!isAvailable && !isDownloaded) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 max-w-sm w-full bg-white dark:bg-[#0f172a] border border-crimson-200/80 dark:border-crimson-800/60 rounded-enterprise shadow-2xl p-4 animate-slide-up select-none">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-crimson-50 dark:bg-crimson-950/50 border border-crimson-200/50 dark:border-crimson-800/40 text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
              {isDownloaded ? <FiCheckCircle className="w-5 h-5 text-emerald-500" /> : <FiZap className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                {isDownloaded ? 'Update Ready to Install' : `Version ${updateState.updateInfo?.version || '1.1.0'} Available`}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                {isDownloaded 
                  ? 'A new system update has been downloaded in the background and is ready to apply.'
                  : 'A new enterprise release is available for your system.'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Details
          </button>
          {isDownloaded ? (
            <button
              onClick={() => {
                if (isDirty) {
                  setShowModal(true);
                } else if (window.api && window.api.updater) {
                  window.api.updater.installUpdate();
                }
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <FiRefreshCw className="w-3.5 h-3.5" /> Restart & Install
            </button>
          ) : (
            <button
              onClick={() => {
                if (window.api && window.api.updater) {
                  window.api.updater.downloadUpdate();
                }
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primaryDark rounded-lg shadow-sm transition-colors"
            >
              Download
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <UpdateCenter isOpen={showModal} onClose={() => setShowModal(false)} isInline={false} />
      )}
    </>
  );
}
