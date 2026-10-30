import React, { useState, createContext, useContext, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiGrid, FiPlusCircle, FiShoppingBag, FiMenu } from 'react-icons/fi';
import { useUnsavedChanges } from '../context/UnsavedChangesContext';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

export const LayoutContext = createContext(null);

// Phones: the most used pages in a bar at the bottom; "More" opens the full menu.
const BOTTOM_ITEMS = [
  { label: 'Home', icon: FiGrid, path: '/dashboard', match: /^\/dashboard/ },
  { label: 'New sale', icon: FiPlusCircle, path: '/orders/new', match: /^\/orders\/new/ },
  { label: 'Orders', icon: FiShoppingBag, path: '/sales', match: /^\/(sales|orders\/(?!new)[^/]+)/ },
];

const BottomBar = ({ onMore }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isDirty, confirmNavigation } = useUnsavedChanges();
  const itemCls = (active) => `flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] text-[11px] font-medium ${
    active ? 'text-brand-primary dark:text-brand-primaryBright' : 'text-muted dark:text-gray-400'
  }`;

  return (
    <nav aria-label="Quick menu" className="md:hidden fixed bottom-0 inset-x-0 z-20 flex bg-white/95 dark:bg-brand-navyCard/95 backdrop-blur border-t border-line dark:border-brand-navyLine pb-[env(safe-area-inset-bottom)]">
      {BOTTOM_ITEMS.map(({ label, icon: Icon, path, match }) => {
        const active = match.test(pathname);
        return (
          <Link
            key={path}
            to={path}
            aria-current={active ? 'page' : undefined}
            onClick={(e) => {
              if (isDirty) {
                e.preventDefault();
                confirmNavigation(() => navigate(path));
              }
            }}
            className={itemCls(active)}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
      <button type="button" onClick={onMore} className={itemCls(false)}>
        <FiMenu className="w-5 h-5" aria-hidden="true" />
        More
      </button>
    </nav>
  );
};

// Separate context for page title state to prevent full layout re-renders on route navigation
const TitleContext = createContext(null);

export const useTitle = () => {
  const context = useContext(TitleContext);
  if (!context) {
    return { title: 'Dashboard', setTitle: () => {} };
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

  // The page's title is shown in the top bar and the browser tab (every page passes pageTitle).
  useEffect(() => {
    if (pageTitle) {
      setTitle(pageTitle);
      document.title = `${pageTitle} · Himmel Sales System`;
    }
  }, [pageTitle, setTitle]);

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
          
          <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-24 md:pb-8 lg:p-8" id="main-content">
            {children || <Outlet />}
          </main>
          <BottomBar onMore={() => setMobileOpen(true)} />
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
