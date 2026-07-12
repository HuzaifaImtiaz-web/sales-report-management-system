import React from 'react';
import { useRoutes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { routes } from './routes/routes';

function App() {
  const routing = useRoutes(routes);

  return (
    <ThemeProvider>
      <AuthProvider>
        {routing}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
