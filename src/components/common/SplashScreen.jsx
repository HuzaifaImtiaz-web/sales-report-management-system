import React, { useState, useEffect } from 'react';
import CompanyLogo from './CompanyLogo';
import { useAuth } from '../../context/AuthContext';
import { APP_VERSION_FULL_LABEL } from '../../utils/version';

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing application...');
  const [fadeOut, setFadeOut] = useState(false);
  const { isLoading } = useAuth();

  useEffect(() => {
    if (progress < 25) {
      setStatus('Initializing application secure module...');
    } else if (progress < 50) {
      setStatus('Verifying local database connection...');
    } else if (progress < 75) {
      setStatus('Checking user session authorization...');
    } else if (progress < 100) {
      setStatus('Loading user configurations...');
    } else {
      setStatus('System Ready');
    }
  }, [progress]);

  useEffect(() => {
    let timer;
    const startProgress = () => {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            // Wait until both simulated progress and actual auth loading have finished
            if (!isLoading) {
              setTimeout(() => {
                setFadeOut(true);
                setTimeout(() => {
                  onComplete();
                }, 600); // Wait for transition duration
              }, 400);
            }
            return 100;
          }
          // Natural feeling progression increments
          const increment = Math.floor(Math.random() * 10) + 5; 
          return Math.min(prev + increment, 100);
        });
      }, 100 + Math.random() * 100);
    };

    startProgress();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [onComplete, isLoading]);

  // If progress is 100% but auth check is still pending, hold progress at 99% until loading is finished
  useEffect(() => {
    if (progress === 100 && isLoading) {
      setProgress(99);
    }
  }, [isLoading, progress]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col justify-between bg-gradient-to-br from-white to-gray-50 dark:from-[#0B132B] dark:to-[#111A36] transition-all duration-700 ease-in-out select-none ${
        fadeOut ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Abstract background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(169,29,34,0.04),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(169,29,34,0.06),rgba(255,255,255,0))] pointer-events-none z-0"></div>

      {/* Top Spacer */}
      <div></div>

      {/* Main Brand Content */}
      <div className="flex flex-col items-center max-w-md w-full mx-auto px-8 text-center z-10">
        <div className="mb-6 transform hover:scale-103 transition-transform duration-300">
          <div className="p-4 bg-white dark:bg-white rounded-2xl shadow-premium border border-gray-100 dark:border-gray-200 inline-block">
            <CompanyLogo className="h-16 w-auto mx-auto object-contain drop-shadow-sm" />
          </div>
          <h2 className="text-xl font-black tracking-[0.25em] uppercase text-gray-800 dark:text-white leading-none mt-5">
            Himmel
          </h2>
          <p className="text-xs font-bold tracking-[0.22em] uppercase text-brand-primary mt-1.5">
            Pharmaceutical
          </p>
        </div>

        <h1 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-gray-400 dark:text-slate-400 mb-10">
          Sales Management System
        </h1>

        {/* Loading Progress Section */}
        <div className="w-full max-w-xs space-y-4">
          <div className="relative w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-brand-primary to-[#C1272D] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
            <span className="animate-pulse">{status}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="w-full text-center pb-8 z-10 space-y-1.5">
        <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 tracking-[0.2em] uppercase">
          {APP_VERSION_FULL_LABEL}
        </p>
        <p className="text-[8px] font-bold text-gray-400/80 dark:text-slate-550/80 uppercase tracking-wider">
          © {new Date().getFullYear()} Himmel Pharmaceutical. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;

