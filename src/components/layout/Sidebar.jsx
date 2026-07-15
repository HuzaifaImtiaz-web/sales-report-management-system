import React, { useState, useRef, useEffect, memo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiPackage, FiUsers, FiMapPin, FiUserCheck,
  FiLayers, FiTrendingUp, FiTarget, FiBarChart2,
  FiUploadCloud, FiDownloadCloud, FiSettings, FiLogOut,
  FiUser, FiClipboard,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import CompanyLogo from '../common/CompanyLogo';

const NAV_ITEMS = [
  { label: 'Dashboard',              icon: FiGrid,        path: '/dashboard'        },
  { label: 'Products',               icon: FiPackage,     path: '/products'         },
  { label: 'Doctors',                icon: FiUsers,       path: '/doctors'          },
  { label: 'Institutions',           icon: FiClipboard,   path: '/institutions'     },
  { label: 'Areas',                  icon: FiMapPin,      path: '/areas'            },
  { label: 'Team Members',           icon: FiUserCheck,   path: '/team'             },
  { label: 'Groups',                 icon: FiLayers,      path: '/groups'           },
  { label: 'Sales',                  icon: FiTrendingUp,  path: '/sales'            },
  { label: 'Orders',                 icon: FiClipboard,   path: '/orders'           },
  { label: 'Product Targets',        icon: FiTarget,      path: '/targets'          },
  { label: 'Reports',                icon: FiBarChart2,   path: '/reports'          },
  { label: 'Import Data',            icon: FiUploadCloud, path: '/import'           },
  { label: 'Export Center',          icon: FiDownloadCloud, path: '/export'         },
  { label: 'Settings',               icon: FiSettings,    path: '/settings'         },
];

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef(null);
  const [hoveredItem, setHoveredItem] = useState(null);


  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logout();
    navigate('/login');
  };

  const handleMouseEnter = (e, label) => {
    if (collapsed && containerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setHoveredItem({
        label,
        top: rect.top - containerRect.top + rect.height / 2
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const SidebarContent = ({ forceExpanded }) => {
    const isCollapsed = forceExpanded ? false : collapsed;
    const navRef = useRef(null);

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

    return (
      <div className="flex flex-col h-full relative" ref={forceExpanded ? null : containerRef}>
        {/* Brand Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b border-white/10 ${isCollapsed ? 'justify-center px-3' : ''}`}>
          <CompanyLogo
            className={`flex-shrink-0 object-contain transition-all duration-300 ${isCollapsed ? 'h-7 w-7' : 'h-8 w-auto max-w-[36px]'}`}
            aria-label="Himmel Pharmaceuticals"
          />
          <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>
            <p className="text-white font-bold text-sm leading-none tracking-wide whitespace-nowrap">Himmel</p>
            <p className="text-white/50 text-xs mt-0.5 font-medium leading-none whitespace-nowrap">Pharmaceuticals</p>
          </div>
        </div>

        {/* Nav Menu */}
        <nav
          ref={navRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5"
          aria-label="Sidebar navigation"
        >
          {NAV_ITEMS.map(({ label, icon: Icon, path, badge }) => (
            <NavLink
              key={label}
              to={path}
              onClick={onMobileClose}
              onMouseEnter={(e) => handleMouseEnter(e, label)}
              onMouseLeave={handleMouseLeave}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-visible
                ${isActive
                  ? 'bg-brand-primary text-white shadow-md font-semibold'
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
                      ${isActive ? 'bg-white/20 text-white' : 'bg-orange-500/80 text-white group-hover:bg-orange-400'}
                      transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0 pointer-events-none px-0 py-0' : 'max-w-[50px] opacity-100'}`}>
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Footer User Details */}
        <div className="border-t border-white/10 px-2 py-3 space-y-1">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-brand-primary/30 border border-white/20 flex items-center justify-center flex-shrink-0">
              <FiUser className="w-3.5 h-3.5 text-white/80" />
            </div>
            <div className={`flex-1 overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>
              <p className="text-white text-xs font-semibold leading-none truncate capitalize">
                {user?.name || user?.email?.split('@')[0] || 'Huzaifa'}
              </p>
              <p className="text-white/45 text-[10px] mt-0.5 truncate">{user?.email || 'huzaifa@himmel.com'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-white/50 hover:bg-white/10 hover:text-white transition-all duration-150
              disabled:opacity-50 ${isCollapsed ? 'justify-center' : ''}`}
          >
            {loggingOut ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white/70 rounded-full animate-spin flex-shrink-0" />
            ) : (
              <FiLogOut className="w-4 h-4 flex-shrink-0" />
            )}
            <span className={`transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 overflow-hidden' : ''}`}>
              {loggingOut ? 'Signing out…' : 'Sign Out'}
            </span>
          </button>
        </div>

        {/* Tooltip when collapsed */}
        {isCollapsed && hoveredItem && (
          <div
            className="absolute left-full pl-2.5 z-55 pointer-events-none transition-all duration-200"
            style={{
              top: `${hoveredItem.top}px`,
              transform: 'translateY(-50%)'
            }}
          >
            <div className="px-2.5 py-1 bg-gray-900 border border-white/10 text-white text-xs font-semibold rounded-md shadow-lg whitespace-nowrap animate-fade-in">
              {hoveredItem.label}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop/Tablet Sidebar */}
      <aside
        className={`hidden md:flex flex-col relative bg-brand-navy flex-shrink-0 transition-all duration-300 ease-in-out h-full ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/50 z-30 animate-fade-in" onClick={onMobileClose} />
          <aside className="md:hidden fixed left-0 top-0 h-full w-60 bg-brand-navy z-40 flex flex-col animate-slide-up shadow-2xl">
            <SidebarContent forceExpanded={true} />
          </aside>
        </>
      )}
    </>
  );
};

export default memo(Sidebar);
