import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: 'Huzaifa',
    email: 'huzaifa@himmel.com',
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = () => {};
  const logout = () => {};

  const value = {
    user,
    isAuthenticated: true,
    isLoading: false,
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

