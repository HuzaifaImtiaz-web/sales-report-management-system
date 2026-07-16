import React, { useState, useEffect } from 'react';
import CompanyLogo from './CompanyLogo';

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing application...');
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (progress < 25) {
      setStatus('Initializing application...');
    } else if (progress < 50) {
      setStatus('Loading settings...');
    } else if (progress < 75) {
      setStatus('Preparing database connection...');
    } else if (progress < 100) {
      setStatus('Preparing dashboard...');
    } else {
      setStatus('Ready');
    }
  }, [progress]);

  useEffect(() => {
    let timer;
    const startProgress = () => {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setTimeout(() => {
              setFadeOut(true);
              setTimeout(() => {
                onComplete();
              }, 500); // Matches the transition-opacity duration
            }, 300);
            return 100;
          }
          // Dynamic random increment to feel natural
          const increment = Math.floor(Math.random() * 8) + 4; // 4% to 12%
          return Math.min(prev + increment, 100);
        });
      }, 150 + Math.random() * 150); // Dynamic interval duration
    };

    startProgress();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-[#0B132B] transition-opacity duration-500 select-none ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center max-w-sm w-full px-8 text-center">
        {/* Logo and Brand */}
        <div className="mb-8 transform scale-110">
          <CompanyLogo className="h-20 w-20 mx-auto mb-4 drop-shadow-md" />
          <h2 className="text-lg font-bold tracking-[0.25em] uppercase text-gray-800 dark:text-white leading-none">
            Himmel
          </h2>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-primary mt-1.5">
            Pharmaceutical
          </p>
        </div>

        {/* System Title */}
        <h1 className="text-sm font-extrabold uppercase tracking-[0.1em] text-gray-900 dark:text-slate-100 mb-12">
          Sales Management System
        </h1>

        {/* Loading Indicator Container */}
        <div className="w-full space-y-3">
          {/* Progress Bar Track */}
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
            {/* Progress Bar Fill */}
            <div
              className="h-full bg-brand-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Loading status text */}
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest animate-pulse h-4">
            {status}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
