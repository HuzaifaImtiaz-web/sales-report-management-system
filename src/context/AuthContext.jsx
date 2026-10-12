import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { hasPermission as checkHasPermission } from '../services/permissionService';
import FirstLoginSecurityWizard from '../components/auth/FirstLoginSecurityWizard';

const AuthContext = createContext(null);

// Per-user data kept in this browser tab (notifications). Cleared on sign-out so the next person
// using a shared computer does not see it.
function clearLocalUserData() {
  try {
    sessionStorage.removeItem('himmel_notifications');
    localStorage.removeItem('himmel_notifications');
  } catch (e) {
    // Storage can be unavailable (private mode); nothing to clear then.
  }
  window.dispatchEvent(new CustomEvent('himmel-signed-out'));
}

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // Default 15 minutes
const WARNING_WINDOW_MS = 60 * 1000; // 60 seconds warning window

async function isSecuritySetupPending(user) {
  if (!user || user.role !== 'Admin') return false;
  try {
    const res = await window.api.auth.getSecurityStatus();
    return Boolean(res && res.success && res.data && res.data.isFirstLoginPending);
  } catch (e) {
    return false;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(null);
  // Administrators must finish the security setup (strong password, recovery password and PIN)
  // before using the app. Kept here, not in the login page: signing in remounts the screens.
  const [securitySetupPending, setSecuritySetupPending] = useState(false);

  // Session Telemetry & Inactivity States
  const [loginTime, setLoginTime] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const inactivityTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const updateActivity = () => {
    if (!showInactivityWarning) {
      setLastActivity(Date.now());
    }
  };

  // Listen for user activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
    };
  }, [isAuthenticated, showInactivityWarning]);

  // Inactivity Check Loop
  useEffect(() => {
    if (!isAuthenticated) {
      if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setShowInactivityWarning(false);
      return;
    }

    inactivityTimerRef.current = setInterval(() => {
      const inactiveDuration = Date.now() - lastActivity;
      if (inactiveDuration >= INACTIVITY_TIMEOUT_MS - WARNING_WINDOW_MS) {
        if (!showInactivityWarning) {
          setShowInactivityWarning(true);
          setSecondsRemaining(Math.max(1, Math.floor((INACTIVITY_TIMEOUT_MS - inactiveDuration) / 1000)));
        }
      }
    }, 5000);

    return () => {
      if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
    };
  }, [isAuthenticated, lastActivity, showInactivityWarning]);

  // Warning Countdown Loop
  useEffect(() => {
    if (showInactivityWarning) {
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            logoutUser('Your session expired due to inactivity.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showInactivityWarning]);

  const handleStayLoggedIn = () => {
    setLastActivity(Date.now());
    setShowInactivityWarning(false);
    setSecondsRemaining(60);
  };

  // Check current session on mount and set up event listener for session expiration
  useEffect(() => {
    const handleSessionExpired = (msg) => {
      setUser(null);
      setIsAuthenticated(false);
      clearLocalUserData();
      setSessionExpiredMsg(msg || 'Your session has expired. Please log in again.');
    };

    const handleSessionExpiredEvent = (e) => {
      const msg = e.detail?.message;
      handleSessionExpired(msg);
    };

    window.addEventListener('session-expired', handleSessionExpiredEvent);

    // The session cookie is HttpOnly, so the server says who (if anyone) is signed in.
    const checkSession = async () => {
      try {
        const res = await window.api.auth.getCurrentUser();
        if (res && res.success && res.data) {
          setSecuritySetupPending(await isSecuritySetupPending(res.data.user));
          setUser(res.data.user);
          setIsAuthenticated(true);
          setLoginTime(res.data.loginTimestamp || new Date().toISOString());
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      window.removeEventListener('session-expired', handleSessionExpiredEvent);
    };
  }, []);

  const loginUser = async (username, password) => {
    setIsLoading(true);
    try {
      const res = await window.api.auth.login({ username, password });
      if (res && res.success && res.data) {
        setSecuritySetupPending(await isSecuritySetupPending(res.data.user));
        setUser(res.data.user);
        setIsAuthenticated(true);
        setLoginTime(res.data.loginTimestamp || new Date().toISOString());
        setLastActivity(Date.now());
        setShowInactivityWarning(false);
        return { success: true };
      }
      return { success: false, error: res?.error || 'Authentication failed.' };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = async (msg) => {
    setIsLoading(true);
    try {
      await window.api.auth.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearLocalUserData();
      setSecuritySetupPending(false);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      setShowInactivityWarning(false);
      if (msg) {
        setSessionExpiredMsg(msg);
      }
    }
  };

  // The wizard changed the password (the server started a new session) and maybe the username.
  const handleSecuritySetupComplete = async () => {
    setSecuritySetupPending(false);
    const res = await window.api.auth.getCurrentUser();
    if (res && res.success && res.data) setUser(res.data.user);
  };

  const hasPermission = (permissionKey) => {
    if (!user) return false;
    return checkHasPermission(user.role, permissionKey);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login: loginUser,
    logout: logoutUser,
    hasPermission,
    setUser,
    setIsAuthenticated,
    sessionExpiredMsg,
    setSessionExpiredMsg,
    loginTime,
    lastActivity,
    showInactivityWarning,
    secondsRemaining,
    handleStayLoggedIn,
    securitySetupPending
  };

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* FIRST-LOGIN SECURITY SETUP (administrators, until completed) */}
      <FirstLoginSecurityWizard
        isOpen={isAuthenticated && securitySetupPending}
        onComplete={handleSecuritySetupComplete}
      />

      {/* INACTIVITY WARNING DIALOG */}
      {showInactivityWarning && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none animate-fade-in">
          <div className="bg-white dark:bg-[#0F172A] border border-amber-300 dark:border-amber-900/50 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-xl font-bold">
              ⏰
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white uppercase tracking-wide">
              Session Expiring Soon
            </h3>
            <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
              Your session will automatically expire due to inactivity in <strong className="text-amber-600 dark:text-amber-400 text-sm">{secondsRemaining} seconds</strong>.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => logoutUser('Logged out by user.')}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-slate-300 text-xs font-bold uppercase rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Logout
              </button>
              <button
                onClick={handleStayLoggedIn}
                className="flex-1 py-2.5 bg-brand-primary hover:bg-[#8F161A] text-white text-xs font-bold uppercase rounded-xl transition-all shadow-md cursor-pointer"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
