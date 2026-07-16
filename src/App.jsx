import React, { useState } from 'react';
import { useRoutes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { routes } from './routes/routes';
import SplashScreen from './components/common/SplashScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const routing = useRoutes(routes);

  return (
    <ThemeProvider>
      <AuthProvider>
        {showSplash ? (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        ) : (
          routing
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

