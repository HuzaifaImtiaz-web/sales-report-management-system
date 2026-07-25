import React, { useState, useEffect } from 'react';
import CompanyLogo from './CompanyLogo';
import { FiCheckCircle, FiAlertTriangle, FiRefreshCw, FiFolder, FiPower } from 'react-icons/fi';

const INIT_STEPS = [
  { id: 1, label: 'Creating folders' },
  { id: 2, label: 'Initializing database' },
  { id: 3, label: 'Loading configuration' },
  { id: 4, label: 'Creating administrator account' },
  { id: 5, label: 'Finalizing setup' }
];

const SystemInitScreen = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [statusText, setStatusText] = useState('Preparing Application...');
  const [error, setError] = useState(null);
  const [isDone, setIsDone] = useState(false);

  const startInitialization = async () => {
    setError(null);
    setCompletedSteps([]);
    setCurrentStep(1);
    setStatusText('Preparing Application...');

    let unsubscribe = null;

    if (window.api && window.api.system && typeof window.api.system.onInitProgress === 'function') {
      unsubscribe = window.api.system.onInitProgress((prog) => {
        if (prog) {
          if (prog.step && prog.step <= 5) {
            setCurrentStep(prog.step);
            if (prog.done) {
              setCompletedSteps((prev) => Array.from(new Set([...prev, prog.step])));
            }
          }
          if (prog.text) {
            setStatusText(prog.text);
          }
          if (prog.complete) {
            setIsDone(true);
            setStatusText('System Ready');
            setCompletedSteps([1, 2, 3, 4, 5]);
            setTimeout(() => {
              if (typeof onComplete === 'function') {
                onComplete();
              }
            }, 800);
          }
        }
      });
    }

    try {
      if (window.api && window.api.system && typeof window.api.system.startInitialization === 'function') {
        const res = await window.api.system.startInitialization();
        if (res && res.success) {
          setIsDone(true);
          setStatusText('System Ready');
          setCompletedSteps([1, 2, 3, 4, 5]);
          setTimeout(() => {
            if (typeof onComplete === 'function') {
              onComplete();
            }
          }, 800);
        }
      } else {
        // Fallback for browser / non-electron dev mode simulation
        for (let i = 1; i <= 5; i++) {
          await new Promise((r) => setTimeout(r, 300));
          setCurrentStep(i);
          setCompletedSteps((prev) => [...prev, i]);
        }
        setIsDone(true);
        setStatusText('System Ready');
        setTimeout(() => {
          if (typeof onComplete === 'function') {
            onComplete();
          }
        }, 500);
      }
    } catch (err) {
      setError(err.message || 'Unable to initialize database.');
    } finally {
      if (unsubscribe) unsubscribe();
    }
  };

  useEffect(() => {
    startInitialization();
  }, []);

  const handleRetry = () => {
    startInitialization();
  };

  const handleOpenLogFolder = async () => {
    if (window.api && window.api.system && typeof window.api.system.openLogFolder === 'function') {
      try {
        await window.api.system.openLogFolder();
      } catch (e) {
        console.error('Failed to open log folder:', e);
      }
    }
  };

  const handleExitApp = async () => {
    if (window.api && window.api.system && typeof window.api.system.exitApp === 'function') {
      try {
        await window.api.system.exitApp();
      } catch (e) {
        console.error('Failed to exit app:', e);
      }
    }
  };

  const progressPercent = Math.min(100, Math.round((completedSteps.length / 5) * 100));

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-red-950 text-white select-none overflow-y-auto">
      {/* Top Spacer */}
      <div className="pt-8"></div>

      {/* Main Container */}
      <div className="flex flex-col items-center max-w-lg w-full mx-auto px-6 py-8 text-center z-10">
        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl mb-4">
          <CompanyLogo className="h-14 w-14 mx-auto text-white drop-shadow-md" />
        </div>
        <h1 className="text-xl font-black tracking-widest uppercase text-white">
          Himmel Pharmaceutical
        </h1>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-400 mt-1">
          Sales Management System
        </p>

        {!error ? (
          <div className="w-full mt-8 bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-xl">
            <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-300 mb-4">
              Preparing Application...
            </h2>

            {/* Checklist */}
            <div className="space-y-3 text-left mb-6">
              {INIT_STEPS.map((s) => {
                const isCompleted = completedSteps.includes(s.id);
                const isCurrent = currentStep === s.id && !isCompleted;
                return (
                  <div key={s.id} className="flex items-center space-x-3">
                    {isCompleted ? (
                      <FiCheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <div className="h-5 w-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-slate-700 shrink-0" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        isCompleted
                          ? 'text-emerald-300 font-semibold'
                          : isCurrent
                          ? 'text-white font-bold animate-pulse'
                          : 'text-slate-500'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-red-500 transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                <span>{statusText}</span>
                <span>{progressPercent}%</span>
              </div>
            </div>

            {isDone && (
              <div className="mt-4 p-2 bg-emerald-950/60 border border-emerald-700/50 rounded-lg text-emerald-400 text-xs font-bold tracking-wider uppercase animate-bounce">
                ✔ System Ready — Launching...
              </div>
            )}
          </div>
        ) : (
          /* Error State */
          <div className="w-full mt-6 bg-red-950/90 backdrop-blur-md rounded-2xl p-6 border border-red-800 shadow-2xl text-left">
            <div className="flex items-center space-x-3 text-red-400 mb-4">
              <FiAlertTriangle className="h-7 w-7 shrink-0" />
              <div>
                <h2 className="text-base font-bold uppercase tracking-wider text-white">
                  Application Initialization Failed
                </h2>
                <p className="text-xs text-red-300">An error occurred during system setup.</p>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-lg border border-red-900/50 mb-4">
              <span className="text-[11px] font-bold uppercase text-red-400 block mb-1">
                Reason:
              </span>
              <p className="text-xs text-slate-200 font-mono break-all">{error}</p>
            </div>

            <div className="mb-6">
              <span className="text-[11px] font-bold uppercase text-slate-300 block mb-2">
                Possible Causes:
              </span>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>Folder permission denied</li>
                <li>Disk space full</li>
                <li>Database file locked by another process</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-red-900/40">
              <button
                onClick={handleRetry}
                className="flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
              >
                <FiRefreshCw className="h-4 w-4" />
                <span>Retry</span>
              </button>
              <button
                onClick={handleOpenLogFolder}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <FiFolder className="h-4 w-4" />
                <span>Open Log Folder</span>
              </button>
              <button
                onClick={handleExitApp}
                className="flex items-center space-x-2 px-4 py-2 bg-red-900/60 hover:bg-red-900 text-red-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <FiPower className="h-4 w-4" />
                <span>Exit</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full text-center pb-6 text-[10px] uppercase font-bold text-slate-500 tracking-widest z-10">
        Himmel Pharmaceutical Sales System — First Run Experience
      </div>
    </div>
  );
};

export default SystemInitScreen;
