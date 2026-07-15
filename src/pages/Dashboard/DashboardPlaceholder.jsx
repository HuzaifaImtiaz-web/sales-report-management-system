import React from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import WelcomeCard from '../../components/cards/WelcomeCard';
import StatisticsGrid from '../../components/layout/StatisticsGrid';
import ChartSection from '../../components/charts/ChartSection';
import RecentSalesTable from '../../components/tables/RecentSalesTable';
import QuickActions from '../../components/layout/QuickActions';
import NotificationPanel from '../../components/layout/NotificationPanel';

const DashboardPlaceholder = () => {
  return (
    <DashboardLayout pageTitle="Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in items-start">
        
        {/* Main Content Area (Left/Center Column) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Row 1: Welcome Greeting */}
          <WelcomeCard />

          {/* Row 2: Statistics Grid (Total Products, Doctors, Areas, Team Members, Sales, Targets) */}
          <StatisticsGrid />

          {/* Row 3: Recharts Charts (Monthly Sales Bar Chart + Target Donut Chart) */}
          <ChartSection />

          {/* Row 4: Recent Sales Table */}
          <RecentSalesTable />

          {/* Row 5: Quick Actions (Forms placeholder trigger cards) */}
          <QuickActions />
        </div>

        {/* Right Panel Section */}
        <div className="lg:col-span-1">
          <NotificationPanel />
        </div>

      </div>
    </DashboardLayout>
  );
};

export default DashboardPlaceholder;
