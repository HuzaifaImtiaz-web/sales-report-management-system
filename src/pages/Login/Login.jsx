import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import CompanyLogo from '../../components/common/CompanyLogo';
import {
  FiLock, FiUser, FiAlertCircle, FiSun, FiMoon, FiEye, FiEyeOff, FiArrowRight, FiArrowUp
} from 'react-icons/fi';
import { APP_VERSION_LABEL } from '../../utils/version';

import EmergencyRecoveryModal from '../../components/auth/EmergencyRecoveryModal';

// Sign-in page (approved design "Option A · Glass", 30 Oct 2026): a slow crimson and gold glow over
// the page, navy in dark mode, and one frosted card with only what is needed to sign in.

const Glow = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute w-[620px] h-[620px] -left-40 -top-52 rounded-full bg-brand-primary blur-[70px] opacity-[0.22] dark:opacity-55 animate-drift motion-reduce:animate-none" />
    <div
      className="absolute w-[520px] h-[520px] -right-36 -bottom-56 rounded-full bg-brand-secondary blur-[70px] opacity-[0.28] dark:opacity-40 animate-drift motion-reduce:animate-none"
      style={{ animationDuration: '22s', animationDelay: '-6s' }}
    />
    <div
      className="absolute w-[420px] h-[420px] right-[18%] -top-44 rounded-full bg-brand-primaryBright blur-[70px] opacity-20 dark:opacity-30 animate-drift motion-reduce:animate-none"
      style={{ animationDuration: '26s', animationDelay: '-11s' }}
    />
    {/* Faint dot grid, fading out towards the edges */}
    <div
      className="absolute inset-0 text-[rgba(20,22,28,0.09)] dark:text-white/[0.07]"
      style={{
        backgroundImage: 'radial-gradient(currentColor 1px, transparent 1.2px)',
        backgroundSize: '22px 22px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 75%)'
      }}
    />
  </div>
);

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  const { login, isAuthenticated, isLoading, sessionExpiredMsg, setSessionExpiredMsg } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    const animId = requestAnimationFrame(() => {
      if (usernameRef.current) {
        usernameRef.current.focus();
      }
    });

    return () => {
      cancelAnimationFrame(animId);
      if (setSessionExpiredMsg) {
        setSessionExpiredMsg(null);
      }
    };
  }, [setSessionExpiredMsg]);

  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setError('');
    if (setSessionExpiredMsg) {
      setSessionExpiredMsg(null);
    }

    const missing = { username: !username.trim(), password: !password };
    setFieldErrors(missing);
    if (missing.username || missing.password) {
      (missing.username ? usernameRef : passwordRef).current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(username.trim(), password);
      if (res && res.success) {
        // The security setup wizard (administrators) opens on top of the app from AuthContext.
        navigate('/dashboard', { replace: true });
      } else {
        // Server messages are written for users (wrong password or paused sign-in, maintenance,
        // too many attempts, connection problems), so show them as they are.
        setError(res.error || 'Username or password is incorrect.');
      }
    } catch (err) {
      setError('An unexpected connection error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkCapsLock = (e) => {
    if (e.getModifierState) setCapsLock(e.getModifierState('CapsLock'));
  };

  const fieldBox = (hasError) => `flex items-center gap-2.5 h-[50px] pl-3.5 pr-1.5 rounded-xl border bg-white dark:bg-[#0F1830] text-muted dark:text-gray-400 transition-shadow
    focus-within:border-brand-primary focus-within:ring-4 focus-within:ring-brand-primary/15 dark:focus-within:border-brand-primaryBright dark:focus-within:ring-brand-primaryBright/20
    ${hasError ? 'border-feedback-error' : 'border-line dark:border-brand-navyLine'}`;
  const fieldInput = "no-global-focus flex-1 min-w-0 h-full bg-transparent border-0 outline-none font-['Inter'] text-[15px] text-ink dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500";

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden bg-[#F7F6F4] dark:bg-brand-navy text-ink dark:text-white">
      <Glow />

      <header className="relative flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-6">
        <span className="inline-flex items-center">
          <CompanyLogo className="h-8 sm:h-9 w-auto" />
        </span>
        <button
          type="button"
          onClick={toggleTheme}
          className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-line dark:border-brand-navyLine bg-white/70 dark:bg-brand-navyCard/70 backdrop-blur text-muted dark:text-gray-300 hover:text-ink dark:hover:text-white transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <FiSun className="w-[18px] h-[18px]" /> : <FiMoon className="w-[18px] h-[18px]" />}
        </button>
      </header>

      <main className="relative flex-1 grid place-items-start sm:place-items-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-[440px] mx-auto rounded-3xl px-6 pt-8 pb-6 sm:px-10 sm:pt-10 sm:pb-8 backdrop-blur-xl backdrop-saturate-150
          bg-white/75 ring-1 ring-white shadow-[0_40px_80px_-30px_rgba(11,19,43,0.28)]
          dark:bg-[rgba(20,29,53,0.62)] dark:ring-white/10 dark:shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]" noValidate>
            <div>
              <h1 className="text-[28px] sm:text-[30px] leading-tight font-semibold tracking-tight">Welcome back</h1>
              <p className="mt-1.5 font-['Inter'] text-[15px] text-muted dark:text-gray-400">Sign in to Himmel Sales System</p>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2.5 p-3.5 rounded-xl font-['Inter'] text-[13.5px] leading-snug bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30">
                <FiAlertCircle className="h-[18px] w-[18px] shrink-0 mt-px" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {sessionExpiredMsg && !error && (
              <div role="status" className="flex items-start gap-2.5 p-3.5 rounded-xl font-['Inter'] text-[13.5px] leading-snug bg-[#FFF8DB] text-[#6B4E00] border border-[#FFE08A] dark:bg-yellow-400/10 dark:text-yellow-200 dark:border-yellow-400/30">
                <FiAlertCircle className="h-[18px] w-[18px] shrink-0 mt-px" aria-hidden="true" />
                <span>{sessionExpiredMsg}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="font-['Inter'] text-[13.5px] font-medium">Username</label>
              <div className={fieldBox(fieldErrors.username)}>
                <FiUser className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={100}
                  required
                  disabled={isSubmitting}
                  ref={usernameRef}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ayesha.khan"
                  aria-invalid={fieldErrors.username || undefined}
                  aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                  className={fieldInput}
                />
              </div>
              {fieldErrors.username && (
                <p id="username-error" className="font-['Inter'] text-[12.5px] text-feedback-error dark:text-red-400">Enter your username.</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <label htmlFor="password" className="font-['Inter'] text-[13.5px] font-medium">Password</label>
                <button
                  type="button"
                  onClick={() => setIsRecoveryOpen(true)}
                  className="font-['Inter'] text-[13px] font-medium text-brand-primary dark:text-[#F2777B] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className={fieldBox(fieldErrors.password)}>
                <FiLock className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={checkCapsLock}
                  onKeyDown={checkCapsLock}
                  placeholder="Your password"
                  aria-invalid={fieldErrors.password || undefined}
                  aria-describedby={[fieldErrors.password && 'password-error', capsLock && 'caps-lock'].filter(Boolean).join(' ') || undefined}
                  className={fieldInput}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="w-[38px] h-[38px] inline-flex items-center justify-center rounded-lg text-muted dark:text-gray-400 hover:text-ink dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff className="w-[18px] h-[18px]" /> : <FiEye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="font-['Inter'] text-[12.5px] text-feedback-error dark:text-red-400">Enter your password.</p>
              )}
              {capsLock && (
                <p id="caps-lock" className="flex items-center gap-1.5 font-['Inter'] text-[12.5px] text-[#B54708] dark:text-[#FDB022]">
                  <FiArrowUp className="w-3.5 h-3.5" aria-hidden="true" /> Caps Lock is on
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group h-[52px] inline-flex justify-center items-center gap-2.5 rounded-xl text-white text-[15px] font-semibold tracking-[0.01em]
                bg-[linear-gradient(180deg,#B9252B_0%,#A91D22_55%,#8B1418_100%)]
                shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_24px_-8px_rgba(169,29,34,0.6)]
                hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_14px_30px_-8px_rgba(169,29,34,0.75)]
                active:translate-y-px transition-shadow disabled:opacity-75 disabled:cursor-progress"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <FiArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-[3px] motion-reduce:transition-none" aria-hidden="true" />
                </>
              )}
            </button>

            <div className="flex flex-col items-center gap-1 font-['Inter'] text-[12.5px] text-muted dark:text-gray-400 text-center">
              <span className="inline-flex items-center gap-2">
                <span className="w-[7px] h-[7px] rounded-full bg-feedback-success shadow-[0_0_0_3px_rgba(22,163,74,0.18)]" aria-hidden="true" />
                Secure connection · signed out after 30 minutes idle
              </span>
              <span>Need an account? Ask your administrator.</span>
            </div>
          </form>
        </div>
      </main>

      <footer className="relative flex flex-col sm:flex-row items-center justify-between gap-1 px-5 pb-5 sm:px-8 sm:pb-6 font-['Inter'] text-xs text-muted dark:text-gray-400">
        <span>© {new Date().getFullYear()} Himmel Pharmaceuticals Pvt Ltd</span>
        <span>{APP_VERSION_LABEL}</span>
      </footer>

      <EmergencyRecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
      />
    </div>
  );
};

export default Login;
