import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import CompanyLogo from '../../components/common/CompanyLogo';
import {
  FiLock, FiUser, FiAlertCircle, FiSun, FiMoon, FiEye, FiEyeOff,
  FiList, FiBarChart2, FiShield, FiKey
} from 'react-icons/fi';
import { APP_VERSION_LABEL } from '../../utils/version';

import EmergencyRecoveryModal from '../../components/auth/EmergencyRecoveryModal';

const FEATURES = [
  { icon: FiList, title: 'Quick sales entry', text: 'Record an order in three short steps, even from a phone.' },
  { icon: FiBarChart2, title: 'Live targets and reports', text: 'See progress by product, area and team member; download Excel, PDF or PowerPoint.' },
  { icon: FiShield, title: 'Secure by design', text: 'Encrypted connection, automatic sign-out and a full audit trail.' },
];

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  const { login, isAuthenticated, isLoading, sessionExpiredMsg, setSessionExpiredMsg } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const usernameRef = useRef(null);

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

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(username.trim(), password);
      if (res && res.success) {
        // The security setup wizard (administrators) opens on top of the app from AuthContext.
        navigate('/dashboard', { replace: true });
      } else {
        // Server messages are written for users (wrong password, locked account, maintenance,
        // too many attempts, connection problems), so show them as they are.
        const errMsg = res.error || 'Incorrect username or password.';
        setError(errMsg === 'Invalid username or password.' ? 'Incorrect username or password.' : errMsg);
      }
    } catch (err) {
      setError('An unexpected connection error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldBox = 'flex items-center gap-2.5 h-12 px-3.5 rounded-lg border border-line dark:border-brand-navyLine bg-white dark:bg-brand-navy text-muted dark:text-gray-400 focus-within:border-brand-primary focus-within:ring-4 focus-within:ring-brand-primary/10 transition-shadow';
  const fieldInput = 'no-global-focus flex-1 min-w-0 h-full bg-transparent border-0 outline-none text-[15px] text-ink dark:text-white placeholder:text-gray-400';

  return (
    <div className="flex flex-wrap min-h-screen bg-white dark:bg-brand-navy font-sans">

      {/* Left: brand panel */}
      <section className="relative overflow-hidden hidden lg:flex flex-1 basis-[480px] flex-col justify-between gap-12 bg-brand-primary text-white px-14 py-12">
        <div aria-hidden="true" className="absolute w-[520px] h-[520px] -right-[200px] -top-[160px] rounded-full border border-white/15" />
        <div aria-hidden="true" className="absolute w-[360px] h-[360px] -right-[120px] -top-[80px] rounded-full border border-white/15" />
        <div aria-hidden="true" className="absolute w-[420px] h-[420px] -left-[180px] -bottom-[220px] rounded-full bg-brand-primaryDark" />

        <div className="relative self-start bg-white rounded-2xl px-5 py-3.5">
          <CompanyLogo className="h-12 w-auto" />
        </div>

        <div className="relative max-w-[500px] space-y-7">
          <div className="space-y-3.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">Sales Management System</p>
            <h1 className="text-[38px] leading-tight font-semibold">Every order, target and report in one place.</h1>
            <p className="text-base leading-relaxed">Built for the Himmel sales team: works on any computer or phone, wherever you are.</p>
          </div>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5 items-start">
                <span className="flex-none w-10 h-10 rounded-[10px] bg-brand-primaryDark inline-flex items-center justify-center">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold">{title}</span>
                  <span className="block text-sm leading-relaxed">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex flex-wrap justify-between gap-3 text-[13px]">
          <span>© {new Date().getFullYear()} Himmel Pharmaceuticals Pvt Ltd</span>
          <span>{APP_VERSION_LABEL}</span>
        </div>
      </section>

      {/* Right: sign-in form */}
      <section className="flex-1 basis-[480px] flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <span className="lg:hidden inline-flex rounded-lg dark:bg-white dark:px-2 dark:py-1.5">
            <CompanyLogo className="h-9 w-auto" />
          </span>
          <span className="hidden lg:block" />
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-line dark:border-brand-navyLine text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
          </button>
        </div>

        <div className="w-full max-w-[400px] mx-auto my-auto py-10">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <h2 className="text-[28px] font-semibold text-ink dark:text-white">Welcome back</h2>
              <p className="text-[15px] text-muted dark:text-gray-400">Sign in to continue to Himmel Sales.</p>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-3 p-3.5 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50">
                <FiAlertCircle className="h-[18px] w-[18px] shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {sessionExpiredMsg && !error && (
              <div role="status" className="flex items-start gap-3 p-3.5 rounded-lg text-sm bg-[#FFF6D6] text-[#6B4E00] border border-[#FFE08A] dark:bg-yellow-950/30 dark:text-yellow-200 dark:border-yellow-900/50">
                <FiAlertCircle className="h-[18px] w-[18px] shrink-0 mt-0.5" />
                <span>{sessionExpiredMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-medium text-ink dark:text-gray-200">Username</label>
              <div className={fieldBox}>
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
                  placeholder="Your username"
                  className={fieldInput}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-ink dark:text-gray-200">Password</label>
                <button
                  type="button"
                  onClick={() => setIsRecoveryOpen(true)}
                  className="text-[13px] font-medium text-brand-primary hover:text-brand-primaryDark dark:text-brand-primaryBright"
                >
                  Forgot password?
                </button>
              </div>
              <div className={`${fieldBox} pr-1.5`}>
                <FiLock className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className={fieldInput}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="w-10 h-10 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-ink dark:hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff className="w-[18px] h-[18px]" /> : <FiEye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[50px] inline-flex justify-center items-center gap-2 rounded-lg bg-brand-primary hover:bg-brand-primaryDark disabled:opacity-60 text-white text-[15px] font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>

            <div className="flex items-center gap-3 text-[13px] text-muted dark:text-gray-400">
              <span className="flex-1 h-px bg-line dark:bg-brand-navyLine" />
              Administrators only
              <span className="flex-1 h-px bg-line dark:bg-brand-navyLine" />
            </div>

            <button
              type="button"
              onClick={() => setIsRecoveryOpen(true)}
              className="w-full h-[46px] inline-flex items-center justify-center gap-2 rounded-lg border border-line dark:border-brand-navyLine text-sm font-medium text-ink dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <FiKey className="w-4 h-4" aria-hidden="true" />
              Emergency account recovery
            </button>

            <div className="flex gap-3 items-start p-3.5 rounded-[10px] bg-brand-lightGray dark:bg-brand-navyCard border border-line dark:border-brand-navyLine text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">
              <FiShield className="w-[18px] h-[18px] shrink-0 mt-px text-feedback-success" aria-hidden="true" />
              <span>Secure connection. For your safety you are signed out after 30 minutes without activity.</span>
            </div>

            <p className="text-center text-[13px] text-muted dark:text-gray-400">Need an account? Ask your administrator.</p>
          </form>
        </div>

        <p className="lg:hidden text-center text-xs text-muted dark:text-gray-400">{APP_VERSION_LABEL}</p>

        <EmergencyRecoveryModal
          isOpen={isRecoveryOpen}
          onClose={() => setIsRecoveryOpen(false)}
        />
      </section>
    </div>
  );
};

export default Login;
