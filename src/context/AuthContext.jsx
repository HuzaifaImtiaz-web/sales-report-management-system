import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local or session storage for mock logged-in session
    const saved = localStorage.getItem('himmel_portal_user') || sessionStorage.getItem('himmel_portal_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('himmel_portal_user');
        sessionStorage.removeItem('himmel_portal_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (email) => {
    const mockUser = {
      email,
      name: email.split('@')[0],
    };
    setUser(mockUser);
  };

  const logout = () => {
    localStorage.removeItem('himmel_portal_user');
    sessionStorage.removeItem('himmel_portal_user');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
