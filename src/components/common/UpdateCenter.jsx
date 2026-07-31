import React, { useState, useEffect } from 'react';
import { 
  FiRefreshCw, 
  FiDownload, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiInfo, 
  FiArrowUpRight, 
  FiClock, 
  FiX, 
  FiZap, 
  FiShield 
} from 'react-icons/fi';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';

import CompanyLogo from './CompanyLogo';
import { APP_VERSION } from '../../utils/version';

export default function UpdateCenter({ isOpen = true, onClose, isInline = false }) {
  const { isDirty } = useUnsavedChanges();
  const [statusState, setStatusState] = useState({
    currentVersion: APP_VERSION,
    updateChannel: 'Stable',
    lastChecked: null,
    status: 'idle', // idle, checking, available, downloading, downloaded, not-available, error
    updateInfo: null,
    progress: {
      percent: 0,
      sizeFormatted: '0 MB / 0 MB',
      speedFormatted: '0 MB/s',
      remainingFormatted: '0 seconds'
    },
    error: null
  });

  const [activeTab, setActiveTab] = useState('highlights'); // highlights, raw
  const [dirtyWarning, setDirtyWarning] = useState(false);

  useEffect(() => {
    // Initial fetch of status
    if (window.api && window.api.updater) {
      window.api.updater.getStatus().then(res => {
        if (res && res.data) {
          setStatusState(res.data);
        } else if (res && res.status) {
          setStatusState(res);
        }
      }).catch(() => {});

      const unsubscribe = window.api.updater.onStatusChanged((data) => {
        if (data) setStatusState(data);
      });

      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, []);

  const handleCheckForUpdates = async () => {
    setDirtyWarning(false);
    if (window.api && window.api.updater) {
      try {
        await window.api.updater.checkForUpdates(false);
      } catch (e) {
        console.error('Check for updates error:', e);
      }
    }
  };

  const handleDownload = async () => {
    if (window.api && window.api.updater) {
      try {
        await window.api.updater.downloadUpdate();
      } catch (e) {
        console.error('Download update error:', e);
      }
    }
  };

  const handleInstall = async () => {
    if (isDirty) {
      setDirtyWarning(true);
      return;
    }
    if (window.api && window.api.updater) {
      try {
        await window.api.updater.installUpdate();
      } catch (e) {
        console.error('Install update error:', e);
      }
    }
  };

  const handleCancelDownload = async () => {
    if (window.api && window.api.updater) {
      try {
        await window.api.updater.cancelDownload();
      } catch (e) {}
    }
  };

  if (!isInline && !isOpen) return null;

  const content = (
    <div className={`bg-white dark:bg-[#0f172a] ${isInline ? 'rounded-xl border border-gray-200 dark:border-gray-800 p-6' : 'rounded-enterprise shadow-2xl border border-gray-200 dark:border-gray-800 max-w-2xl w-full select-none'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-150 shrink-0 inline-flex items-center justify-center">
            <CompanyLogo className="w-7 h-7 object-contain drop-shadow-sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Enterprise Update Center</h2>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-crimson-100/80 dark:bg-crimson-900/40 text-brand-primary rounded-full">
                {statusState.updateChannel || 'Stable'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Current Version: <span className="font-semibold text-gray-700 dark:text-gray-300">v{statusState.currentVersion}</span>
              {statusState.lastChecked && (
                <span className="ml-3 text-[11px] text-gray-400">
                  Last Checked: {new Date(statusState.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
        </div>

        {!isInline && onClose && (
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Body Content based on Update State */}
      <div className="p-6 space-y-5">

        {/* 1. CHECKING STATE */}
        {statusState.status === 'checking' && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-crimson-200 border-t-brand-primary animate-spin mb-4" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Checking for Updates...</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
              Connecting securely to update servers to verify system version and release signatures.
            </p>
          </div>
        )}

        {/* 2. NOT AVAILABLE / UP TO DATE STATE */}
        {(statusState.status === 'not-available' || (statusState.status === 'idle' && !statusState.updateInfo)) && (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 dark:bg-gray-850/30 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <FiCheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">You're using the latest version</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Himmel Pharmaceutical System v{statusState.currentVersion} is completely up to date.
            </p>
            <button
              onClick={handleCheckForUpdates}
              className="mt-4 px-4 py-2 text-xs font-bold text-brand-primary bg-crimson-50 dark:bg-crimson-950/40 hover:bg-crimson-100 dark:hover:bg-crimson-900/60 border border-crimson-200/60 dark:border-crimson-800/40 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <FiRefreshCw className="w-3.5 h-3.5" /> Check For Updates
            </button>
          </div>
        )}

        {/* 3. ERROR STATE */}
        {statusState.status === 'error' && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-red-900 dark:text-red-200 uppercase tracking-wider">Update Check Failed</h4>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">{statusState.error || 'Internet unavailable or update server offline.'}</p>
                <button
                  onClick={handleCheckForUpdates}
                  className="mt-3 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" /> Retry Update Check
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. UPDATE AVAILABLE STATE */}
        {statusState.status === 'available' && statusState.updateInfo && (
          <div className="space-y-4">
            {/* Banner */}
            <div className="p-4 bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-transparent border border-brand-primary/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold">
                  <FiZap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Version {statusState.updateInfo.version} Available
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Release Date: {statusState.updateInfo.releaseDate} • Download Size: <span className="font-semibold text-gray-700 dark:text-gray-300">{statusState.updateInfo.downloadSize}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isInline && onClose && (
                  <button
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Later
                  </button>
                )}
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primaryDark rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <FiDownload className="w-4 h-4" /> Download Update
                </button>
              </div>
            </div>

            {/* What's New Release Notes */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-gray-50/40 dark:bg-gray-850/20">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100/60 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FiInfo className="w-3.5 h-3.5 text-brand-primary" /> What's New
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab('highlights')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${activeTab === 'highlights' ? 'bg-white dark:bg-gray-700 text-brand-primary shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    Highlights
                  </button>
                  <button
                    onClick={() => setActiveTab('raw')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${activeTab === 'raw' ? 'bg-white dark:bg-gray-700 text-brand-primary shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    Release Notes
                  </button>
                </div>
              </div>

              <div className="p-4 max-h-56 overflow-y-auto custom-scrollbar text-xs">
                {activeTab === 'highlights' ? (
                  <div className="space-y-3">
                    {statusState.updateInfo.notes?.improvements?.length > 0 && (
                      <div>
                        <h5 className="font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 uppercase text-[10px] tracking-wider">Improvements & Enhancements</h5>
                        <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                          {statusState.updateInfo.notes.improvements.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-brand-primary font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {statusState.updateInfo.notes?.fixedBugs?.length > 0 && (
                      <div>
                        <h5 className="font-bold text-blue-600 dark:text-blue-400 mb-1.5 uppercase text-[10px] tracking-wider">Fixed Bugs</h5>
                        <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                          {statusState.updateInfo.notes.fixedBugs.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-blue-500 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {statusState.updateInfo.notes?.knownIssues?.length > 0 && (
                      <div>
                        <h5 className="font-bold text-amber-600 dark:text-amber-400 mb-1.5 uppercase text-[10px] tracking-wider">Known Issues</h5>
                        <ul className="space-y-1 text-gray-500 dark:text-gray-400">
                          {statusState.updateInfo.notes.knownIssues.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-500 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
                    {statusState.updateInfo.notes?.rawMarkdown || 'Standard maintenance release.'}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. DOWNLOADING STATE */}
        {statusState.status === 'downloading' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiDownload className="w-4 h-4 text-brand-primary animate-bounce" /> Downloading Update...
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Downloading Himmel Sales Management v{statusState.updateInfo?.version || '1.1.0'}
                </p>
              </div>
              <button
                onClick={handleCancelDownload}
                className="px-3 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-brand-primary">{statusState.progress?.percent || 0}% Completed</span>
                <span className="text-gray-600 dark:text-gray-300">{statusState.progress?.sizeFormatted || '0 MB / 215 MB'}</span>
              </div>

              <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-300/40 dark:border-gray-700">
                <div 
                  className="h-full bg-gradient-to-r from-brand-primary to-crimson-500 rounded-full transition-all duration-300"
                  style={{ width: `${statusState.progress?.percent || 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <FiZap className="w-3 h-3 text-amber-500" /> Speed: <span className="font-semibold text-gray-700 dark:text-gray-300">{statusState.progress?.speedFormatted || '3.2 MB/s'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <FiClock className="w-3 h-3 text-brand-primary" /> Remaining: <span className="font-semibold text-gray-700 dark:text-gray-300">{statusState.progress?.remainingFormatted || '1 minute'}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 6. DOWNLOADED / READY TO INSTALL STATE */}
        {statusState.status === 'downloaded' && (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <FiShield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                    Update Ready to Install
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Himmel Sales Management v{statusState.updateInfo?.version || '1.1.0'} is verified and ready.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isInline && onClose && (
                  <button
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Later
                  </button>
                )}
                <button
                  onClick={handleInstall}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <FiRefreshCw className="w-4 h-4" /> Restart & Install Now
                </button>
              </div>
            </div>

            {/* Unsaved Changes Guard Warning */}
            {dirtyWarning && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200 font-medium">
                <FiAlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Finish your work before updating. Please save or discard your open unsaved form changes first.</span>
              </div>
            )}

            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-lg text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <FiShield className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>100% Data Preservation Guaranteed: Your database, backups, settings, reports, and logs will remain completely untouched.</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      {content}
    </div>
  );
}


