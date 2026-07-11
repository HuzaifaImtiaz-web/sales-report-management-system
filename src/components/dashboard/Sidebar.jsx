import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiPackage, FiUsers, FiMapPin, FiUserCheck,
  FiLayers, FiTrendingUp, FiTarget, FiBarChart2,
  FiUploadCloud, FiSettings, FiLogOut, FiChevronLeft,
  FiChevronRight, FiUser,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import CompanyLogo from '../common/CompanyLogo';

const NAV_ITEMS = [
  { label: 'Dashboard',        icon: FiGrid,         path: '/dashboard'        },
  { label: 'Products',         icon: FiPackage,      path: '/products'         },
  { label: 'Doctors',          icon: FiUsers,        path: '/doctors'          },
  { label: 'Areas',            icon: FiMapPin,       path: '/areas'            },
  { label: 'Team Members',     icon: FiUserCheck,    path: '/team'             },
  { label: 'Groups',           icon: FiLayers,       path: '/groups'           },
  { label: 'Sales',            icon: FiTrendingUp,   path: '/sales'            },
  { label: 'Product Targets',  icon: FiTarget,       path: '/targets'          },
  { label: 'Reports',          icon: FiBarChart2,    path: '/reports'          },
  { label: 'Import Data',      icon: FiUploadCloud,  path: '/import'           },
  { label: 'Settings',         icon: FiSettings,     path: '/settings'         },
];

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className={`flex items-center gap-3 px-5 py-4 border-b border-white/10 ${collapsed ? 'justify-center px-3' : ''}`}>
        <CompanyLogo
          className={`flex-shrink-0 object-contain transition-all duration-300 ${collapsed ? 'h-7 w-7' : 'h-8 w-auto max-w-[36px]'}`}
          aria-label="Himmel Pharmaceuticals"
        />
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-none tracking-wide">Himmel</p>
            <p className="text-white/50 text-xs mt-0.5 font-medium leading-none">Pharmaceuticals</p>
          </div>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5" aria-label="Sidebar navigation">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={label}
            to={path}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
              ${isActive
                ? 'bg-brand-primary text-white shadow-sm font-semibold'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
              }
              ${collapsed ? 'justify-center px-3' : ''}`
            }
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Footer User Details */}
      <div className="border-t border-white/10 px-2 py-3 space-y-1">
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 rounded-full bg-brand-primary/30 border border-white/20 flex items-center justify-center flex-shrink-0">
            <FiUser className="w-3.5 h-3.5 text-white/80" />
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-white text-xs font-semibold leading-none truncate capitalize">
                {user?.name || user?.email?.split('@')[0] || 'Huzaifa'}
              </p>
              <p className="text-white/45 text-[10px] mt-0.5 truncate">{user?.email || 'huzaifa@himmel.com'}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            text-white/50 hover:bg-white/10 hover:text-white transition-all duration-150
            disabled:opacity-50 ${collapsed ? 'justify-center' : ''}`}
        >
          {loggingOut ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white/70 rounded-full animate-spin flex-shrink-0" />
          ) : (
            <FiLogOut className="w-4 h-4 flex-shrink-0" />
          )}
          {!collapsed && <span>{loggingOut ? 'Signing out…' : 'Sign Out'}</span>}
        </button>
      </div>

      {/* Collapse Toggle trigger (Desktop only) */}
      <button
        onClick={onToggle}
        className="hidden md:flex items-center justify-center h-8 w-8 rounded-lg bg-white/10
          hover:bg-white/20 text-white/60 hover:text-white transition-all duration-150
          absolute -right-4 top-20 border border-white/10 shadow-md"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden md:flex flex-col relative bg-brand-navy flex-shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/50 z-30 animate-fade-in" onClick={onMobileClose} />
          <aside className="md:hidden fixed left-0 top-0 h-full w-60 bg-brand-navy z-40 flex flex-col animate-slide-up shadow-2xl">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
