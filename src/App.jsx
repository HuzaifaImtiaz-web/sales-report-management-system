import React from 'react';
import { useRoutes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { routes } from './routes/routes';

function App() {
  const routing = useRoutes(routes);

  return (
    <AuthProvider>
      {routing}
    </AuthProvider>
  );
}

export default App;
