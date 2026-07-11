import React, { useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import Navbar from '../components/dashboard/Navbar';

const DashboardLayout = ({ pageTitle = 'Dashboard', children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-lightGray font-sans">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar pageTitle={pageTitle} onMenuClick={() => setMobileOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-5 sm:p-7" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
