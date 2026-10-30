import React, { useState, useRef, useEffect, memo } from 'react';
import { FiMenu, FiChevronDown, FiMoon, FiSun, FiLogOut } from 'react-icons/fi';
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
    <header className="bg-white/90 dark:bg-brand-navyCard/90 backdrop-blur border-b border-line dark:border-brand-navyLine flex items-center justify-between gap-3 px-4 sm:px-6 h-16 flex-shrink-0 z-20 sticky top-0 transition-colors duration-200">
      <div className="flex items-center gap-3">
        {/* Hamburger menu button */}
        <button
          onClick={onMenuClick}
          className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-ink dark:hover:text-white transition-colors"
          aria-label="Toggle navigation menu"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        {/* Company logo — visible only on mobile when sidebar is hidden */}
        <div className="md:hidden shrink-0 inline-flex items-center">
          <CompanyLogo className="h-7 w-auto" />
        </div>

        <div className="hidden sm:block">
          <h1 className="text-lg font-semibold text-ink dark:text-white leading-tight">{title}</h1>
          <p className="text-xs text-muted dark:text-gray-400 mt-0.5">{getFinancialYear()}</p>
        </div>
      </div>

      {/* Global Search Component */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Dark Mode"
          className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-line dark:border-brand-navyLine text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
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
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-brand-navy dark:bg-brand-primary flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-ink dark:text-gray-100 leading-none capitalize">
                {username}
              </p>
              <p className="text-xs text-muted dark:text-gray-400 mt-1 leading-none truncate max-w-[120px]">
                {user?.role || 'Guest'}
              </p>
            </div>
            <FiChevronDown className={`w-4 h-4 text-muted dark:text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-brand-navyCard border border-line dark:border-brand-navyLine rounded-xl shadow-premium overflow-hidden z-50 animate-slide-up">
              <div className="px-4 py-3 border-b border-line dark:border-brand-navyLine">
                <p className="text-sm font-semibold text-ink dark:text-white truncate capitalize">
                  {username}
                </p>
                <p className="text-xs text-muted dark:text-gray-400 truncate mt-0.5">{user?.role || 'Guest'}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium cursor-pointer"
                >
                  <FiLogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
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
    </header>
  );
};

export default memo(Navbar);
