import React, { useState, useRef, useEffect, memo } from 'react';
import { FiBell, FiMenu, FiChevronDown, FiUser, FiSettings, FiLogOut, FiCalendar, FiMoon, FiSun } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import CompanyLogo from '../common/CompanyLogo';
import { useTitle } from '../../layouts/DashboardLayout';

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { open, setOpen, ref } = useDropdown();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logout();
    navigate('/login');
  };

  const username = user?.name || user?.email?.split('@')[0] || 'Huzaifa';

  const initials = username
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
        <CompanyLogo className="md:hidden h-7 w-auto object-contain" />

        <div>
          <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-none">{title}</h1>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-1 uppercase tracking-wider">{getFinancialYear()}</p>
        </div>
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
          className="relative p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
        </button>

        {/* Notification Bell Icon */}
        <button
          aria-label="Notifications"
          className="relative p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <FiBell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-primary border-2 border-white dark:border-[#0f172a]" />
        </button>

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
              <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-none capitalize">
                {username}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 leading-none truncate max-w-[120px]">
                {user?.email || 'huzaifa@himmel.com'}
              </p>
            </div>
            <FiChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-premium overflow-hidden z-50 animate-slide-up">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate capitalize">
                  {username}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{user?.email || 'huzaifa@himmel.com'}</p>
              </div>
              <div className="py-1">
                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-not-allowed opacity-50 font-semibold">
                  <FiUser className="w-4 h-4 text-gray-400" />
                  My Profile
                </button>
                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-not-allowed opacity-50 font-semibold">
                  <FiSettings className="w-4 h-4 text-gray-400" />
                  Settings
                </button>
                <hr className="my-1 border-gray-100 dark:border-gray-800" />
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-feedback-error hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50"
                >
                  {loggingOut ? (
                    <div className="w-4 h-4 border-2 border-red-200 border-t-feedback-error rounded-full animate-spin" />
                  ) : (
                    <FiLogOut className="w-4 h-4" />
                  )}
                  {loggingOut ? 'Signing out…' : 'Sign Out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default memo(Navbar);
