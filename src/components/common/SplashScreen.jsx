import React, { useState, useEffect } from 'react';
import CompanyLogo from './CompanyLogo';
import markImg from '../../assets/logos/Himmel-Mark.png';
import { useAuth } from '../../context/AuthContext';

// Loading page (approved design "Option C · Watermark, whole mark", 30 Oct 2026): shown while the
// web app checks who is signed in, and closed as soon as that check answers (no fixed delay).
const SLOW_AFTER_MS = 6000;

const SplashScreen = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      setFadeOut(true);
      const done = setTimeout(() => onComplete(), 300);
      return () => clearTimeout(done);
    }
    const slow = setTimeout(() => setIsSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(slow);
  }, [onComplete, isLoading]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-brand-navy text-ink dark:text-white select-none transition-opacity duration-300 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <main className="relative flex-1 flex items-center justify-center px-6 overflow-hidden">
        {/* The round Himmel mark, printed faintly like a watermark on company paper */}
        <img
          src={markImg}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-5 bottom-5 w-[180px] h-[180px] sm:right-10 sm:bottom-8 sm:w-[300px] sm:h-[300px] opacity-[0.06] dark:opacity-20"
        />

        <div className="relative flex flex-col items-center text-center">
          <CompanyLogo className="h-[50px] sm:h-16 w-auto" />
          <span className="w-12 h-0.5 bg-brand-primary mt-[22px] mb-3.5" aria-hidden="true" />
          <p className="text-[13px] font-medium uppercase tracking-[0.22em] text-muted dark:text-gray-400">Sales System</p>

          <div role="status" aria-live="polite" className="mt-[34px] flex flex-col items-center gap-3">
            <div className="relative w-[180px] h-0.5 overflow-hidden bg-[#ECEEF2] dark:bg-[#1E2944]" aria-hidden="true">
              <div className="absolute inset-y-0 left-0 w-[35%] bg-brand-primary animate-loading-line motion-reduce:animate-none" />
            </div>
            <p className="font-['Inter'] text-[13px] text-muted dark:text-gray-400 max-w-[32ch]">
              {isSlow ? 'Still connecting. This can take a moment on a slow connection.' : 'Opening Himmel Sales System'}
            </p>
          </div>
        </div>
      </main>

      <footer className="relative flex flex-col sm:flex-row items-center sm:justify-between gap-0.5 px-5 py-3.5 sm:px-8 sm:py-4 border-t border-line dark:border-brand-navyLine font-['Inter'] text-xs text-muted dark:text-gray-400">
        <span>Himmel Pharmaceuticals (Pvt) Ltd</span>
        <span>Secure connection</span>
      </footer>
    </div>
  );
};

export default SplashScreen;
