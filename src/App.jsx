import React, { useState, useCallback } from 'react';
import { useRoutes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { UnsavedChangesProvider } from './context/UnsavedChangesContext';
import { NotificationProvider } from './context/NotificationContext';
import { routes } from './routes/routes';
import SplashScreen from './components/common/SplashScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const routing = useRoutes(routes);

  return (
    <div key={isAuthenticated ? 'auth-active' : 'auth-inactive'} className="h-full w-full">
      {routing}
    </div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const hideSplash = useCallback(() => setShowSplash(false), []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <UnsavedChangesProvider>
              {showSplash ? <SplashScreen onComplete={hideSplash} /> : <AppContent />}
            </UnsavedChangesProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
