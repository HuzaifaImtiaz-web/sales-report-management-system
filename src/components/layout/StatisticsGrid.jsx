import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPackage, FiUsers, FiMapPin, FiUserCheck,
  FiTrendingUp, FiTarget, FiClipboard,
} from 'react-icons/fi';
import DashboardCard from '../cards/DashboardCard';

const StatisticsGrid = ({
  productsCount = 0,
  doctorsCount = 0,
  areasCount = 0,
  teamCount = 0,
  totalSales = 0,
  targetProgress = 0,
  totalOrders = 0
}) => {
  const navigate = useNavigate();

  const stats = [
    {
      icon: FiPackage,
      iconBg: 'bg-blue-50 dark:bg-blue-900/30',
      iconColor: 'text-blue-500',
      title: 'Total Products',
      value: productsCount.toString(),
      trend: 'Database',
      trendDir: 'neutral',
      sub: 'All registered products',
      onClick: () => navigate('/products')
    },
    {
      icon: FiUsers,
      iconBg: 'bg-purple-50 dark:bg-purple-900/30',
      iconColor: 'text-purple-500',
      title: 'Total Doctors',
      value: doctorsCount.toString(),
      trend: 'Database',
      trendDir: 'neutral',
      sub: 'All medical practitioners',
      onClick: () => navigate('/doctors')
    },
    {
      icon: FiMapPin,
      iconBg: 'bg-amber-50 dark:bg-amber-900/30',
      iconColor: 'text-amber-500',
      title: 'Total Areas',
      value: areasCount.toString(),
      trend: 'Database',
      trendDir: 'neutral',
      sub: 'All operational areas',
      onClick: () => navigate('/areas')
    },
    {
      icon: FiUserCheck,
      iconBg: 'bg-teal-50 dark:bg-teal-900/30',
      iconColor: 'text-teal-500',
      title: 'Total Team Members',
      value: teamCount.toString(),
      trend: 'Database',
      trendDir: 'neutral',
      sub: 'Active reps and managers',
      onClick: () => navigate('/team')
    },
    {
      icon: FiTrendingUp,
      iconBg: 'bg-red-50 dark:bg-red-900/30',
      iconColor: 'text-brand-primary',
      title: 'Total Sales (PKR)',
      value: `Rs ${totalSales.toLocaleString()}`,
      trend: 'Real-time',
      trendDir: 'up',
      sub: 'Cumulative sales value',
      onClick: () => navigate('/reports')
    },
    {
      icon: FiTarget,
      iconBg: 'bg-green-50 dark:bg-green-900/30',
      iconColor: 'text-feedback-success',
      title: 'Target Progress',
      value: `${targetProgress}%`,
      trend: 'Real-time',
      trendDir: 'up',
      sub: 'Achievement of goal',
      onClick: () => navigate('/targets')
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((s) => (
        <DashboardCard key={s.title} {...s} />
      ))}
      {/* Purchase Orders Card */}
      <DashboardCard
        icon={FiClipboard}
        iconBg="bg-orange-50 dark:bg-orange-900/30"
        iconColor="text-orange-500"
        title="Purchase Orders"
        value={totalOrders.toString()}
        trend="Active tracker"
        trendDir="neutral"
        sub="Track all orders"
        onClick={() => navigate('/orders')}
      />
    </div>
  );
};

export default StatisticsGrid;
