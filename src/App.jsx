import React, { useState, useEffect } from 'react';
import { useRoutes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { UnsavedChangesProvider } from './context/UnsavedChangesContext';
import { NotificationProvider } from './context/NotificationContext';
import { routes } from './routes/routes';
import SplashScreen from './components/common/SplashScreen';
import SystemInitScreen from './components/common/SystemInitScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

import AutoUpdateNotifier from './components/common/AutoUpdateNotifier';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const routing = useRoutes(routes);

  return (
    <div key={isAuthenticated ? 'auth-active' : 'auth-inactive'} className="h-full w-full">
      {routing}
      {isAuthenticated && <AutoUpdateNotifier />}
    </div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showInitScreen, setShowInitScreen] = useState(false);

  useEffect(() => {
    const checkFirstRun = async () => {
      try {
        if (window.api && window.api.system && typeof window.api.system.checkFirstRun === 'function') {
          const isFirst = await window.api.system.checkFirstRun();
          if (isFirst) {
            setShowInitScreen(true);
          }
        }
      } catch (e) {
        console.error('Failed to check first run status:', e);
      }
    };
    checkFirstRun();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <UnsavedChangesProvider>
              {showInitScreen ? (
                <SystemInitScreen
                  onComplete={() => {
                    setShowInitScreen(false);
                    setShowSplash(false);
                  }}
                />
              ) : showSplash ? (
                <SplashScreen onComplete={() => setShowSplash(false)} />
              ) : (
                <AppContent />
              )}
            </UnsavedChangesProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

