import React, { useState, createContext, useContext, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

export const LayoutContext = createContext(null);

// Separate context for page title state to prevent full layout re-renders on route navigation
const TitleContext = createContext(null);

export const useTitle = () => {
  const context = useContext(TitleContext);
  if (!context) {
    throw new Error('useTitle must be used inside a TitleProvider');
  }
  return context;
};

export const TitleProvider = ({ children }) => {
  const [title, setTitle] = useState('Dashboard');
  return (
    <TitleContext.Provider value={{ title, setTitle }}>
      {children}
    </TitleContext.Provider>
  );
};

const DashboardLayoutContent = ({ pageTitle = 'Dashboard', children }) => {
  const parentContext = useContext(LayoutContext);
  const { setTitle } = useTitle();

  // Sync child page's title up to the top-level context
  useEffect(() => {
    if (parentContext?.isNested && pageTitle) {
      setTitle(pageTitle);
    }
  }, [pageTitle, parentContext, setTitle]);

  // If this DashboardLayout is inside a parent layout, bypass wrapping and just render children
  if (parentContext?.isNested) {
    return <>{children}</>;
  }

  // Primary top-level DashboardLayout instance
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(true);
    } else {
      toggleCollapsed();
    }
  };

  const contextValue = {
    isNested: true,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className="flex h-screen overflow-hidden bg-brand-lightGray dark:bg-brand-navy font-sans transition-colors duration-200">
        <Sidebar
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Navbar onMenuClick={handleMenuClick} />
          
          <main className="flex-1 overflow-y-auto p-5 sm:p-7" id="main-content">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
};

const DashboardLayout = (props) => {
  const parentContext = useContext(LayoutContext);

  // If this is already inside a parent layout, just render content directly
  if (parentContext?.isNested) {
    return <DashboardLayoutContent {...props} />;
  }

  return (
    <TitleProvider>
      <DashboardLayoutContent {...props} />
    </TitleProvider>
  );
};

export default DashboardLayout;
