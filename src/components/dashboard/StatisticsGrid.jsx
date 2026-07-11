import React from 'react';
import {
  FiPackage, FiUsers, FiMapPin, FiUserCheck,
  FiTrendingUp, FiTarget,
} from 'react-icons/fi';
import DashboardCard from './DashboardCard';

const STATS = [
  {
    icon: FiPackage,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    title: 'Total Products',
    value: '125',
    trend: '+12%',
    trendDir: 'up',
    sub: '14 added this month',
  },
  {
    icon: FiUsers,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    title: 'Total Doctors',
    value: '250',
    trend: '+5%',
    trendDir: 'up',
    sub: '42 new this quarter',
  },
  {
    icon: FiMapPin,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    title: 'Total Areas',
    value: '40',
    trend: 'No change',
    trendDir: 'neutral',
    sub: 'Across 8 regions',
  },
  {
    icon: FiUserCheck,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-500',
    title: 'Total Team Members',
    value: '36',
    trend: '+2',
    trendDir: 'up',
    sub: '2 onboarded this month',
  },
  {
    icon: FiTrendingUp,
    iconBg: 'bg-red-50',
    iconColor: 'text-brand-primary',
    title: 'Total Sales Entries',
    value: '510',
    trend: '+18%',
    trendDir: 'up',
    sub: 'vs last month',
  },
  {
    icon: FiTarget,
    iconBg: 'bg-green-50',
    iconColor: 'text-feedback-success',
    title: 'Target Progress',
    value: '74%',
    trend: 'On track',
    trendDir: 'up',
    sub: '26% remaining to goal',
  },
];

const StatisticsGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {STATS.map((s) => (
        <DashboardCard key={s.title} {...s} />
      ))}
    </div>
  );
};

export default StatisticsGrid;
