import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { hasPermission as checkHasPermission } from '../services/permissionService';

const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // Default 15 minutes
const WARNING_WINDOW_MS = 60 * 1000; // 60 seconds warning window

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(null);

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
      setSessionExpiredMsg(msg || 'Your session has expired. Please log in again.');
    };

    const handleSessionExpiredEvent = (e) => {
      const msg = e.detail?.message;
      handleSessionExpired(msg);
    };

    window.addEventListener('session-expired', handleSessionExpiredEvent);

    const checkSession = async () => {
      try {
        if (window.api && window.api.auth) {
          const res = await window.api.auth.getCurrentUser();
          if (res && res.success && res.data) {
            setUser(res.data.user);
            setIsAuthenticated(true);
            setLoginTime(res.data.loginTimestamp || new Date().toISOString());
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // Web Mode Fallback
          const webSession = localStorage.getItem('himmel_web_session');
          if (webSession) {
            try {
              const parsed = JSON.parse(webSession);
              setUser(parsed);
              setIsAuthenticated(true);
              setLoginTime(new Date().toISOString());
            } catch (e) {
              localStorage.removeItem('himmel_web_session');
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
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
      if (window.api && window.api.auth) {
        const res = await window.api.auth.login({ username, password });
        if (res && res.success && res.data) {
          setUser(res.data.user);
          setIsAuthenticated(true);
          setLoginTime(new Date().toISOString());
          setLastActivity(Date.now());
          setShowInactivityWarning(false);
          return { success: true };
        } else {
          return { success: false, error: res?.error || 'Authentication failed.' };
        }
      } else {
        // Web / Browser mode authentication
        const cleanUser = (username || '').trim();

        // Check maintenance mode in web mode
        const isMaintenance = localStorage.getItem('himmel_maintenance_mode') === 'true';
        if (isMaintenance && cleanUser.toLowerCase() !== 'admin') {
          return { success: false, error: 'System is under maintenance. Please contact Administrator.' };
        }

        if (cleanUser.toLowerCase() === 'admin' && password === 'Password123!') {
          const userObj = {
            id: 1,
            username: 'admin',
            fullName: 'System Administrator',
            role: 'Admin',
            isActive: true
          };
          localStorage.setItem('himmel_web_session', JSON.stringify(userObj));
          setUser(userObj);
          setIsAuthenticated(true);
          setLoginTime(new Date().toISOString());
          setLastActivity(Date.now());
          setShowInactivityWarning(false);
          return { success: true };
        }

        // Check saved web users
        const webUsers = JSON.parse(localStorage.getItem('himmel_web_users') || '[]');
        const found = webUsers.find(
          (u) => u.username.toLowerCase() === cleanUser.toLowerCase() && u.password === password
        );

        if (found) {
          if (found.isActive === false) {
            return { success: false, error: 'Your account is disabled. Please contact your system administrator.' };
          }
          const userObj = {
            id: found.id || 2,
            username: found.username,
            fullName: found.fullName || found.username,
            role: found.role || 'Sales Representative',
            isActive: true
          };
          localStorage.setItem('himmel_web_session', JSON.stringify(userObj));
          setUser(userObj);
          setIsAuthenticated(true);
          setLoginTime(new Date().toISOString());
          setLastActivity(Date.now());
          setShowInactivityWarning(false);
          return { success: true };
        }

        return { success: false, error: 'Incorrect username or password.' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = async (msg) => {
    setIsLoading(true);
    try {
      if (window.api && window.api.auth) {
        await window.api.auth.logout();
      } else {
        localStorage.removeItem('himmel_web_session');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      setShowInactivityWarning(false);
      if (msg) {
        setSessionExpiredMsg(msg);
      }
    }
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
    handleStayLoggedIn
  };

  return (
    <AuthContext.Provider value={value}>
      {children}

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
