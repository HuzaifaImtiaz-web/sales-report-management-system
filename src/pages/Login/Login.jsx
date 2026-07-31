import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import CompanyLogo from '../../components/common/CompanyLogo';
import { FiLock, FiUser, FiAlertCircle, FiSun, FiMoon } from 'react-icons/fi';

import EmergencyRecoveryModal from '../../components/auth/EmergencyRecoveryModal';
import FirstLoginSecurityWizard from '../../components/auth/FirstLoginSecurityWizard';
import EnterprisePasswordInput from '../../components/common/EnterprisePasswordInput';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const { login, isAuthenticated, isLoading, sessionExpiredMsg, setSessionExpiredMsg } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const usernameRef = useRef(null);

  // Focus states
  const [usernameFocused, setUsernameFocused] = useState(false);

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

  if (isAuthenticated && !isLoading && !isWizardOpen) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setError('');
    if (setSessionExpiredMsg) {
      setSessionExpiredMsg(null);
    }

    // Input Validation
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
        let pendingWizard = false;
        try {
          if (window.api?.auth?.getSecurityStatus) {
            const secStatus = await window.api.auth.getSecurityStatus();
            if (secStatus && secStatus.isFirstLoginPending) {
              pendingWizard = true;
            }
          }
        } catch (sErr) {}

        if (pendingWizard) {
          setIsWizardOpen(true);
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        let errMsg = res.error || 'Incorrect username or password.';
        if (errMsg.toLowerCase().includes('lock')) {
          setError('Your account has been temporarily locked due to too many failed attempts. Please try again in 15 minutes.');
        } else if (errMsg.toLowerCase().includes('disabled')) {
          setError('Your account is disabled. Please contact your system administrator.');
        } else {
          setError('Incorrect username or password.');
        }
      }
    } catch (err) {
      setError('An unexpected connection error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWizardComplete = () => {
    setIsWizardOpen(false);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0B132B] transition-colors duration-300 font-sans overflow-hidden">
      
      {/* LEFT PANEL: Branding & Graphic Section (40%) */}
      <div className="hidden lg:flex w-[40%] relative bg-gradient-to-br from-[#801317] via-[#A91D22] to-[#600D10] text-white p-12 flex-col justify-between overflow-hidden shadow-2xl">
        {/* Molecule network SVG decoration */}
        <div className="absolute inset-0 opacity-15 pointer-events-none z-0">
          <svg className="w-full h-full" viewBox="0 0 400 800" xmlns="http://www.w3.org/2000/svg">
            {/* Grid structure lines */}
            <line x1="50" y1="100" x2="150" y2="180" stroke="white" strokeWidth="1.5" />
            <line x1="150" y1="180" x2="100" y2="300" stroke="white" strokeWidth="1.5" />
            <line x1="100" y1="300" x2="250" y2="350" stroke="white" strokeWidth="1.5" />
            <line x1="250" y1="350" x2="320" y2="250" stroke="white" strokeWidth="1.5" />
            <line x1="250" y1="350" x2="200" y2="500" stroke="white" strokeWidth="1.5" />
            <line x1="200" y1="500" x2="80" y2="550" stroke="white" strokeWidth="1.5" />
            <line x1="200" y1="500" x2="300" y2="650" stroke="white" strokeWidth="1.5" />
            
            {/* Hexagonal Node connection circles */}
            <circle cx="50" cy="100" r="6" fill="white" />
            <circle cx="150" cy="180" r="8" fill="white" className="animate-pulse" />
            <circle cx="100" cy="300" r="5" fill="white" />
            <circle cx="250" cy="350" r="9" fill="white" />
            <circle cx="320" cy="250" r="6" fill="white" />
            <circle cx="200" cy="500" r="8" fill="white" />
            <circle cx="80" cy="550" r="5" fill="white" />
            <circle cx="300" cy="650" r="7" fill="white" />
            
            {/* Scientific hexagons */}
            <polygon points="120,420 150,400 180,420 180,450 150,470 120,450" fill="none" stroke="white" strokeWidth="1" />
            <polygon points="260,120 280,105 300,120 300,140 280,155 260,140" fill="none" stroke="white" strokeWidth="1" opacity="0.7" />
          </svg>
        </div>

        {/* Brand Header */}
        <div className="z-10 flex items-center gap-3">
          <CompanyLogo className="h-8 w-auto max-w-[36px]" />
          <div>
            <h2 className="text-sm font-extrabold tracking-[0.25em] uppercase leading-none">Himmel</h2>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-white/70 uppercase mt-1">Pharmaceutical</p>
          </div>
        </div>

        {/* Mid Branding Statement */}
        <div className="z-10 my-auto pr-6 space-y-4">
          <h1 className="text-3xl font-black uppercase tracking-wider leading-tight">
            Sales & Order<br />Management
          </h1>
          <div className="h-1 w-12 bg-white/40 rounded-full"></div>
          <p className="text-xs text-white/80 leading-relaxed font-medium">
            Secure offline-first database platform built exclusively for commercial medicine records, analytical targets, and order compliance pipelines.
          </p>
        </div>

        {/* Footer Info */}
        <div className="z-10 space-y-1">
          <p className="text-[10px] font-bold tracking-widest text-white/70 uppercase">
            v1.0.2 — Enterprise Desktop
          </p>
          <p className="text-[9px] text-white/50 font-medium">
            © {new Date().getFullYear()} Himmel Pharmaceutical. All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: Form Section (60% or 100% on Mobile/Tablet) */}
      <div className="flex-1 flex flex-col justify-between p-8 lg:p-12 relative">
        
        {/* Top bar with theme toggle */}
        <div className="flex justify-between items-center">
          <div className="lg:hidden flex items-center gap-2">
            <CompanyLogo className="h-7 w-7" />
            <span className="text-xs font-black tracking-widest uppercase text-gray-800 dark:text-white">Himmel</span>
          </div>
          <div className="hidden lg:block"></div>
          
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-gray-150 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-600 dark:text-gray-300 transition-all duration-200 cursor-pointer shadow-sm"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
          </button>
        </div>

        {/* Centered Login Box */}
        <div className="w-full max-w-sm mx-auto my-auto space-y-7 py-8">
          <div>
            <h1 className="text-2xl font-black text-gray-850 dark:text-white tracking-wide uppercase">
              Welcome Back
            </h1>
            <p className="text-xs text-gray-450 dark:text-slate-400 font-medium mt-1.5">
              Enter your corporate credentials to access your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            
            {/* Status & Error Display Card */}
            {error && (
              <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-xl text-xs font-semibold border border-red-100 dark:border-red-900/30 animate-shake">
                <FiAlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {sessionExpiredMsg && !error && (
              <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-955/20 text-amber-650 dark:text-amber-400 rounded-xl text-xs font-semibold border border-amber-100 dark:border-amber-900/30">
                <FiAlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{sessionExpiredMsg}</span>
              </div>
            )}

            {/* Username Input Container */}
            <div className="space-y-1 relative">
              <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                usernameFocused
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-900 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#0f172a]/30'
              }`}>
                <div className="pl-3.5 text-gray-400 dark:text-slate-500">
                  <FiUser className="w-4 h-4" />
                </div>
                {/* Float-label wrapper */}
                <div className="relative flex-grow">
                  <input
                    id="username"
                    type="text"
                    required
                    disabled={isSubmitting}
                    ref={usernameRef}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setUsernameFocused(true)}
                    onBlur={() => setUsernameFocused(false)}
                    placeholder=" "
                    className="no-global-focus block w-full px-3 py-3.5 text-xs font-semibold text-gray-800 dark:text-white bg-transparent outline-none pt-5 pb-1.5 placeholder-transparent border-0 focus:border-0 focus:ring-0"
                  />
                  <label
                    htmlFor="username"
                    className={`absolute left-3 top-3.5 pointer-events-none text-xs font-bold text-gray-400 dark:text-slate-500 transition-all duration-200 uppercase tracking-wider origin-top-left ${
                      username || usernameFocused
                        ? 'transform -translate-y-3.5 scale-75 text-blue-500 dark:text-blue-400'
                        : ''
                    }`}
                  >
                    Username
                  </label>
                </div>
              </div>
            </div>

            {/* Password Input Container */}
            <div className="space-y-1">
              <EnterprisePasswordInput
                id="password"
                name="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={true}
                disabled={isSubmitting}
                placeholder="••••••••"
              />
            </div>

            {/* Remember Me & Help */}
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
              <label className="flex items-center gap-2 cursor-pointer text-gray-505 dark:text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-250 text-brand-primary focus:ring-brand-primary/20 w-3.5 h-3.5 cursor-pointer dark:border-[#2A375E] dark:bg-[#0B132B]"
                />
                Remember Me
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3.5 bg-brand-primary hover:bg-[#8F161A] active:bg-[#7D1115] disabled:bg-[#A91D22]/60 text-white font-bold text-xs tracking-[0.15em] uppercase rounded-xl transition-all shadow-md hover:shadow-brand-primary/10 cursor-pointer disabled:cursor-not-allowed select-none"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                'Login'
              )}
            </button>

            {/* Emergency Recovery Link */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setIsRecoveryOpen(true)}
                className="text-xs font-bold text-gray-500 hover:text-brand-primary dark:text-slate-400 dark:hover:text-red-400 transition-colors uppercase tracking-wider cursor-pointer underline"
              >
                Emergency Recovery
              </button>
            </div>
          </form>
        </div>

        {/* Emergency Recovery Modal */}
        <EmergencyRecoveryModal
          isOpen={isRecoveryOpen}
          onClose={() => setIsRecoveryOpen(false)}
        />

        {/* First Login Security Setup Wizard */}
        <FirstLoginSecurityWizard
          isOpen={isWizardOpen}
          onComplete={handleWizardComplete}
        />

        {/* Small version label for smaller screens */}
        <div className="lg:hidden text-center text-[10px] font-bold text-gray-450 dark:text-slate-500 tracking-widest uppercase">
          v1.0.2 — Enterprise Desktop
        </div>
      </div>
    </div>
  );
};

export default Login;

