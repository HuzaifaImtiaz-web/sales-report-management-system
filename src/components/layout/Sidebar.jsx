import React, { useState, useRef, useEffect, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiPackage, FiUsers, FiMapPin, FiUserCheck,
  FiLayers, FiTrendingUp, FiTarget, FiBarChart2,
  FiDownloadCloud, FiSettings, FiShield,
  FiClipboard, FiChevronUp, FiLogOut, FiHome, FiShoppingBag
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';
import ConfirmDialog from '../common/dialogs/ConfirmDialog';
import CompanyLogo from '../common/CompanyLogo';

// Menu grouped by purpose. Items a role may not use are left out (the server checks them too).
const getNavGroups = (user, hasPermission) => {
  const role = user?.role;
  const can = (permission) => Boolean(hasPermission && hasPermission(permission));

  const groups = [
    { label: null, items: [{ label: 'Dashboard', icon: FiGrid, path: '/dashboard' }] },
    {
      label: 'Sales',
      items: [
        { label: 'Sales Entry', icon: FiTrendingUp, path: '/orders/new' },
        // The order list lives at /sales; a single order opens at /orders/:id
        { label: 'Orders', icon: FiShoppingBag, path: '/sales', match: /^\/(sales|orders\/(?!new)[^/]+)/ },
        { label: 'Targets', icon: FiTarget, path: '/targets' },
      ],
    },
    {
      label: 'Master data',
      items: [
        { label: 'Products', icon: FiPackage, path: '/products' },
        { label: 'Doctors', icon: FiUsers, path: '/doctors' },
        { label: 'Institutions', icon: FiHome, path: '/institutions' },
        { label: 'Areas', icon: FiMapPin, path: '/areas' },
        { label: 'Groups', icon: FiLayers, path: '/groups' },
        { label: 'Team Members', icon: FiUserCheck, path: '/team' },
      ],
    },
    {
      label: 'Reports',
      items: [
        { label: 'Reports', icon: FiBarChart2, path: '/reports' },
        ...(can('reports.export') ? [{ label: 'Export Center', icon: FiDownloadCloud, path: '/export' }] : []),
      ],
    },
    {
      label: 'System',
      items: [
        ...(role === 'Admin' || can('settings.users') ? [{ label: 'Users', icon: FiUsers, path: '/users' }] : []),
        ...(role === 'Admin' || can('audit.view') ? [{ label: 'Audit Trail', icon: FiShield, path: '/audit-logs' }] : []),
        { label: 'Settings', icon: FiSettings, path: '/settings' },
      ],
    },
  ];
  return groups.filter((group) => group.items.length > 0);
};

const SidebarContent = ({
  collapsed,
  forceExpanded,
  user,
  logout,
  hasPermission,
  navigate,
  confirmNavigation,
  isDirty,
  onMobileClose,
  handleMouseEnter,
  handleMouseLeave
}) => {
  const isCollapsed = forceExpanded ? false : collapsed;
  const navRef = useRef(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isDropdownClick = dropdownRef.current && dropdownRef.current.contains(event.target);
      const isButtonClick = buttonRef.current && buttonRef.current.contains(event.target);
      if (!isDropdownClick && !isButtonClick) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const savedScrollTop = sessionStorage.getItem('sidebar-scroll-top');
    if (savedScrollTop && navRef.current) {
      const timer = setTimeout(() => {
        if (navRef.current) {
          navRef.current.scrollTop = parseInt(savedScrollTop, 10);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isCollapsed]);

  const handleScroll = (e) => {
    sessionStorage.setItem('sidebar-scroll-top', String(e.currentTarget.scrollTop));
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleDirectLogout = (e) => {
    if (e) e.stopPropagation();
    confirmNavigation(() => {
      setShowLogoutConfirm(true);
    });
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    setProfileMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const navGroups = getNavGroups(user, hasPermission);
  const { pathname } = useLocation();
  const isItemActive = ({ path, match }) => (match ? match.test(pathname) : pathname === path || pathname.startsWith(`${path}/`));

  const initials = user?.fullName
    ? user.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Logo */}
      <div className={`flex-shrink-0 flex items-center h-16 border-b border-line dark:border-brand-navyLine ${isCollapsed ? 'justify-center px-2' : 'px-5'}`}>
        {isCollapsed ? (
          <span className="w-10 h-10 rounded-lg bg-white border border-line dark:border-transparent inline-flex items-center justify-center overflow-hidden">
            <CompanyLogo className="h-8 w-auto max-w-none object-left object-cover" style={{ width: 32, objectPosition: 'left center' }} aria-label="Himmel Pharmaceuticals" />
          </span>
        ) : (
          <span className="inline-flex items-center rounded-lg dark:bg-white dark:px-2.5 dark:py-1.5">
            <CompanyLogo className="h-9 w-auto" />
          </span>
        )}
      </div>

      {/* Menu (scrolls on its own) */}
      <nav
        ref={navRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-5"
        aria-label="Main menu"
      >
        {navGroups.map((group) => (
          <div key={group.label || 'main'} className="space-y-0.5">
            {group.label && !isCollapsed && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted dark:text-gray-400">
                {group.label}
              </p>
            )}
            {group.label && isCollapsed && <div className="mx-3 mb-2 border-t border-line dark:border-brand-navyLine" />}
            {group.items.map((item) => {
              const { label, icon: Icon, path } = item;
              const isActive = isItemActive(item);
              return (
              <Link
                key={label}
                to={path}
                onClick={(e) => {
                  if (isDirty) {
                    e.preventDefault();
                    confirmNavigation(() => {
                      if (onMobileClose) onMobileClose();
                      navigate(path);
                    });
                  } else if (onMobileClose) {
                    onMobileClose();
                  }
                }}
                onMouseEnter={(e) => handleMouseEnter(e, label)}
                onMouseLeave={handleMouseLeave}
                aria-label={isCollapsed ? label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150
                  ${isActive
                    ? 'bg-brand-tint text-brand-primary font-semibold dark:bg-brand-primary/20 dark:text-red-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-ink dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : ''}`
                }
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true" />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Signed-in user */}
      <div className="flex-shrink-0 border-t border-line dark:border-brand-navyLine relative">
        <div
          ref={buttonRef}
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left cursor-pointer ${isCollapsed ? 'justify-center px-2' : ''}`}
          aria-haspopup="true"
          aria-expanded={profileMenuOpen}
        >
          <div className="w-9 h-9 rounded-full bg-brand-navy dark:bg-brand-primary flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold">
            {initials}
          </div>

          {!isCollapsed && (
            <>
              <div className="flex-grow min-w-0 pr-1">
                <p className="text-sm font-semibold text-ink dark:text-white leading-tight truncate capitalize">
                  {user?.fullName || user?.username || 'Guest'}
                </p>
                <p className="text-xs text-muted dark:text-gray-400 mt-0.5 truncate">
                  {user?.role || 'Guest'}
                </p>
              </div>

              <div className="flex-shrink-0 flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={handleDirectLogout}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-muted hover:text-ink dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <FiLogOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-muted hover:text-ink dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
                  title="Account options"
                  aria-label="Account options"
                >
                  <FiChevronUp className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {profileMenuOpen && (
          <div
            ref={dropdownRef}
            className={`absolute bottom-[72px] bg-white dark:bg-brand-navyCard border border-line dark:border-brand-navyLine rounded-xl shadow-premium py-1.5 z-50 text-sm text-gray-700 dark:text-gray-200 animate-slide-up ${
              isCollapsed ? 'left-2 w-52' : 'left-3 right-3'
            }`}
          >
            <div className="px-4 py-2 border-b border-line dark:border-brand-navyLine">
              <p className="font-semibold text-ink dark:text-white capitalize truncate">{user?.fullName || user?.username}</p>
              <p className="text-xs text-muted dark:text-gray-400">{user?.role}</p>
            </div>
            <button
              onClick={() => {
                setProfileMenuOpen(false);
                confirmNavigation(() => navigate('/settings'));
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2.5"
            >
              <FiSettings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={() => {
                setProfileMenuOpen(false);
                confirmNavigation(() => {
                  setShowLogoutConfirm(true);
                });
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-700 dark:text-red-400 font-medium transition-colors flex items-center gap-2.5 border-t border-line dark:border-brand-navyLine"
            >
              <FiLogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Sign out?"
        message="You will need to sign in again to continue."
        confirmText="Sign out"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const { confirmNavigation, isDirty } = useUnsavedChanges();
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleMouseEnter = (e, label) => {
    if (collapsed && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredItem({
        label,
        top: rect.top + rect.height / 2
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const shared = {
    user,
    logout,
    hasPermission,
    navigate,
    confirmNavigation,
    isDirty,
    onMobileClose,
    handleMouseEnter,
    handleMouseLeave
  };

  return (
    <>
      {/* Computer and tablet */}
      <aside
        className={`hidden md:flex flex-col relative bg-white dark:bg-brand-navyCard border-r border-line dark:border-brand-navyLine flex-shrink-0 transition-[width] duration-300 ease-in-out h-full ${collapsed ? 'w-[72px]' : 'w-64'}`}
      >
        <SidebarContent collapsed={collapsed} {...shared} />
      </aside>

      {/* Phone: slide-in menu */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/40 z-30 animate-fade-in" onClick={onMobileClose} />
          <aside className="md:hidden fixed left-0 top-0 h-full w-72 max-w-[85vw] bg-white dark:bg-brand-navyCard z-40 flex flex-col animate-fade-in shadow-premium">
            <SidebarContent collapsed={collapsed} forceExpanded={true} {...shared} />
          </aside>
        </>
      )}

      {/* Name of the hovered item while the menu is collapsed to icons */}
      {collapsed && hoveredItem && (
        <div
          className="fixed pl-2.5 z-[55] pointer-events-none"
          style={{
            left: '72px',
            top: `${hoveredItem.top}px`,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="px-2.5 py-1 bg-ink text-white text-xs font-medium rounded-md shadow-premium whitespace-nowrap animate-fade-in">
            {hoveredItem.label}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(Sidebar);
