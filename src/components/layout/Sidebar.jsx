import React, { useState, useRef, useEffect, memo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiPackage, FiUsers, FiMapPin, FiUserCheck,
  FiLayers, FiTrendingUp, FiTarget, FiBarChart2,
  FiDownloadCloud, FiSettings, FiShield,
  FiUser, FiClipboard, FiChevronUp, FiLogOut
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';
import ConfirmDialog from '../common/dialogs/ConfirmDialog';
import CompanyLogo from '../common/CompanyLogo';

const getNavItems = (user, hasPermission) => {
  const role = user?.role;
  const items = [
    { label: 'Dashboard', icon: FiGrid, path: '/dashboard' },
    { label: 'Products', icon: FiPackage, path: '/products' },
    { label: 'Doctors', icon: FiUsers, path: '/doctors' },
    { label: 'Institutions', icon: FiClipboard, path: '/institutions' },
    { label: 'Areas', icon: FiMapPin, path: '/areas' },
    { label: 'Team Members', icon: FiUserCheck, path: '/team' },
    { label: 'Groups', icon: FiLayers, path: '/groups' },
    { label: 'Sales', icon: FiTrendingUp, path: '/sales' },
    { label: 'Orders', icon: FiClipboard, path: '/orders' },
    { label: 'Targets', icon: FiTarget, path: '/targets' },
    { label: 'Reports', icon: FiBarChart2, path: '/reports' },
    { label: 'Export Center', icon: FiDownloadCloud, path: '/export' },
    { label: 'Settings', icon: FiSettings, path: '/settings' },
  ];
  if (role === 'Admin' || (hasPermission && hasPermission('audit.view'))) {
    items.push({ label: 'Audit Trail', icon: FiShield, path: '/audit-logs' });
  }
  if (role === 'Admin' || (hasPermission && hasPermission('settings.users'))) {
    items.push({ label: 'Users', icon: FiUsers, path: '/users' });
  }
  return items;
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

  const navItems = getNavItems(user, hasPermission);

  const initials = user?.fullName
    ? user.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Brand Header (Fixed) */}
      <div className={`flex-shrink-0 flex items-center gap-3 px-5 py-4 border-b border-white/10 ${isCollapsed ? 'justify-center px-3' : ''}`}>
        <CompanyLogo
          className={`flex-shrink-0 object-contain transition-all duration-300 ${isCollapsed ? 'h-7 w-7' : 'h-8 w-auto max-w-[36px]'}`}
          aria-label="Himmel Pharmaceutical"
        />
        <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>
          <p className="text-white font-bold text-sm leading-none tracking-wide whitespace-nowrap">Himmel</p>
          <p className="text-white/55 text-xs mt-0.5 font-medium leading-none whitespace-nowrap">Pharmaceutical</p>
        </div>
      </div>

      {/* Nav Menu (Scrolls Independently) */}
      <nav
        ref={navRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto py-4 px-2 space-y-0.5"
        aria-label="Sidebar navigation"
      >
        {navItems.map(({ label, icon: Icon, path, badge }) => (
          <NavLink
            key={label}
            to={path}
            onClick={(e) => {
              if (isDirty) {
                e.preventDefault();
                confirmNavigation(() => {
                  if (onMobileClose) onMobileClose();
                  navigate(path);
                });
              } else {
                if (onMobileClose) onMobileClose();
              }
            }}
            onMouseEnter={(e) => handleMouseEnter(e, label)}
            onMouseLeave={handleMouseLeave}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-visible
              ${isActive
                ? 'bg-white text-[#8B1418] shadow-md font-semibold'
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:translate-x-0.5'
              }
              ${isCollapsed ? 'justify-center px-3' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4.5 h-4.5 flex-shrink-0 transition-transform duration-200 ${!isActive ? 'group-hover:scale-110' : ''}`} />
                <span className={`truncate transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[200px] opacity-100'}`}>
                  {label}
                </span>
                {badge && (
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex-shrink-0
                    ${isActive ? 'bg-[#8B1418]/15 text-[#8B1418]' : 'bg-orange-500/80 text-white group-hover:bg-orange-400'}
                    transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0 pointer-events-none px-0 py-0' : 'max-w-[50px] opacity-100'}`}>
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Footer User Details (Fixed & Pinned) */}
      <div className="flex-shrink-0 border-t border-white/10 bg-black/25 relative">
        <div
          ref={buttonRef}
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-white/5 transition-all text-left cursor-pointer min-h-[88px] ${isCollapsed ? 'justify-center px-3' : ''}`}
          aria-haspopup="true"
          aria-expanded={profileMenuOpen}
        >
          <div className="w-8 h-8 rounded-full bg-white/20 border border-white/20 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-inner">
            {initials}
          </div>
          
          {!isCollapsed && (
            <>
              <div className="flex-grow min-w-0 pr-1">
                <p className="text-white text-xs font-bold leading-tight break-words capitalize">
                  {user?.fullName || user?.username || 'Guest'}
                </p>
                <p className="text-white/45 text-[10px] mt-1 font-semibold break-words leading-normal">
                  {user?.role || 'Guest'}
                </p>
              </div>
              
              <div className="flex-shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={handleDirectLogout}
                  className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
                  title="Logout"
                >
                  <FiLogOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
                  title="Account Options"
                >
                  <FiChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Menu Dropdown */}
        {profileMenuOpen && (
          <div
            ref={dropdownRef}
            className={`absolute bottom-[90px] bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-1.5 z-50 text-xs text-gray-700 dark:text-gray-200 animate-slide-up ${
              isCollapsed ? 'left-2 w-48' : 'left-3 right-3'
            }`}
          >
            <div className="px-3.5 py-2 border-b border-gray-100 dark:border-gray-800">
              <p className="font-bold text-gray-900 dark:text-white capitalize truncate">{user?.fullName || user?.username}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{user?.role}</p>
            </div>
            <button
              onClick={() => {
                setProfileMenuOpen(false);
                confirmNavigation(() => navigate('/settings'));
              }}
              className="w-full text-left px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors flex items-center gap-2"
            >
              <FiSettings className="w-3.5 h-3.5" />
              Settings
            </button>
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  confirmNavigation(() => {
                    setShowLogoutConfirm(true);
                  });
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-semibold transition-colors flex items-center gap-2 border-t border-gray-150 dark:border-gray-800"
              >
                <FiLogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>

        <ConfirmDialog
          open={showLogoutConfirm}
          title="Log Out Confirmation"
          message="Are you sure you want to log out of the system? Any unsaved active session context will be safely cleared."
          confirmText="Log Out"
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

  return (
    <>
      {/* Desktop/Tablet Sidebar */}
      <aside
        className={`hidden md:flex flex-col relative bg-gradient-to-br from-[#801317] via-[#A91D22] to-[#600D10] flex-shrink-0 transition-all duration-300 ease-in-out h-full ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <SidebarContent
          collapsed={collapsed}
          user={user}
          logout={logout}
          hasPermission={hasPermission}
          navigate={navigate}
          confirmNavigation={confirmNavigation}
          isDirty={isDirty}
          onMobileClose={onMobileClose}
          handleMouseEnter={handleMouseEnter}
          handleMouseLeave={handleMouseLeave}
        />
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/50 z-30 animate-fade-in" onClick={onMobileClose} />
          <aside className="md:hidden fixed left-0 top-0 h-full w-60 bg-gradient-to-br from-[#801317] via-[#A91D22] to-[#600D10] z-40 flex flex-col animate-slide-up shadow-2xl">
            <SidebarContent
              collapsed={collapsed}
              forceExpanded={true}
              user={user}
              logout={logout}
              hasPermission={hasPermission}
              navigate={navigate}
              confirmNavigation={confirmNavigation}
              isDirty={isDirty}
              onMobileClose={onMobileClose}
              handleMouseEnter={handleMouseEnter}
              handleMouseLeave={handleMouseLeave}
            />
          </aside>
        </>
      )}

      {/* Hover Tooltip (Shared/Global container to avoid absolute alignment issues) */}
      {collapsed && hoveredItem && (
        <div
          className="fixed pl-2.5 z-55 pointer-events-none transition-all duration-200"
          style={{
            left: '64px',
            top: `${hoveredItem.top}px`,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="px-2.5 py-1 bg-gray-900 border border-white/10 text-white text-xs font-semibold rounded-md shadow-lg whitespace-nowrap animate-fade-in">
            {hoveredItem.label}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(Sidebar);
