import React, { useState, useRef, useEffect, memo } from 'react';
import { FiBell, FiMenu, FiChevronDown, FiUser, FiSettings, FiCalendar, FiMoon, FiSun, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';
import { useTitle } from '../../layouts/DashboardLayout';
import CompanyLogo from '../common/CompanyLogo';
import GlobalSearch from '../common/GlobalSearch';
import NotificationDropdown from '../common/NotificationDropdown';
import ConfirmDialog from '../common/dialogs/ConfirmDialog';

const getFinancialYear = () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return month >= 6 ? `FY ${year}–${year + 1}` : `FY ${year - 1}–${year}`;
};

const formatDate = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const useDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return { open, setOpen, ref };
};

const Navbar = ({ onMenuClick }) => {
  const { title } = useTitle();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { open, setOpen, ref } = useDropdown();
  const { confirmNavigation } = useUnsavedChanges();
  const navigate = useNavigate();

  const username = user?.fullName || user?.username || 'Guest';

  const initials = username
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    confirmNavigation(() => {
      setShowLogoutConfirm(true);
    });
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    setOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-white dark:bg-[#0f172a] border-b border-gray-150 dark:border-gray-800 shadow-soft flex items-center justify-between px-4 sm:px-6 h-16 flex-shrink-0 z-20 sticky top-0 transition-colors duration-200">
      <div className="flex items-center gap-3">
        {/* Hamburger menu button */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-gray-505 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="Toggle navigation menu"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        {/* Company logo — visible only on mobile when sidebar is hidden */}
        <div className="md:hidden p-1 bg-white rounded-lg shadow-sm border border-gray-150 shrink-0 inline-flex items-center justify-center">
          <CompanyLogo className="h-6 w-auto object-contain" />
        </div>

        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-none">{title}</h1>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-1 uppercase tracking-wider">{getFinancialYear()}</p>
        </div>
      </div>

      {/* Global Search Component */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-4">
        {/* Current Date Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 select-none transition-colors duration-200">
          <FiCalendar className="w-4 h-4 text-brand-primary" />
          <span>{formatDate()}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Dark Mode"
          className="relative p-2.5 rounded-lg text-gray-505 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
        </button>

        {/* Notification Dropdown Component */}
        <NotificationDropdown />

        {/* Profile Dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-gray-850 dark:text-gray-100 leading-none capitalize">
                {username}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 leading-none truncate max-w-[120px]">
                {user?.role || 'Guest'}
              </p>
            </div>
            <FiChevronDown className={`w-4 h-4 text-gray-405 dark:text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-premium overflow-hidden z-50 animate-slide-up">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate capitalize">
                  {username}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{user?.role || 'Guest'}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-semibold cursor-pointer"
                >
                  <FiLogOut className="w-4 h-4 text-red-500" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
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
    </header>
  );
};

export default memo(Navbar);
