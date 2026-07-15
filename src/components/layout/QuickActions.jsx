import React from 'react';
import {
  FiPlusCircle, FiPackage, FiUserPlus, FiFileText,
  FiDownload, FiClipboard, FiHome
} from 'react-icons/fi';
import QuickActionCard from '../cards/QuickActionCard';

const ACTIONS = [
  {
    icon: FiPlusCircle,
    iconBg: 'bg-red-50 dark:bg-red-950/20 group-hover:bg-red-100 dark:group-hover:bg-red-900/30',
    iconColor: 'text-brand-primary',
    label: 'New Sale',
    desc: 'Record a new sales transaction',
    path: '/sales'
  },
  {
    icon: FiPackage,
    iconBg: 'bg-blue-50 dark:bg-blue-950/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30',
    iconColor: 'text-blue-500',
    label: 'Add Product',
    desc: 'Register a new pharmaceutical product',
    path: '/products'
  },
  {
    icon: FiUserPlus,
    iconBg: 'bg-purple-50 dark:bg-purple-950/20 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30',
    iconColor: 'text-purple-500',
    label: 'Add Doctor',
    desc: 'Add a doctor to your network',
    path: '/doctors'
  },
  {
    icon: FiHome,
    iconBg: 'bg-teal-50 dark:bg-teal-950/20 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30',
    iconColor: 'text-teal-500',
    label: 'Institutions',
    desc: 'Manage medical centers & clinics',
    path: '/institutions'
  },
  {
    icon: FiClipboard,
    iconBg: 'bg-orange-50 dark:bg-orange-950/20 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30',
    iconColor: 'text-orange-500',
    label: 'Orders',
    desc: 'Track and manage purchase orders',
    path: '/orders'
  },
  {
    icon: FiFileText,
    iconBg: 'bg-green-50 dark:bg-green-950/20 group-hover:bg-green-100 dark:group-hover:bg-green-900/30',
    iconColor: 'text-feedback-success',
    label: 'Generate Report',
    desc: 'Export sales & target reports',
    path: '/reports'
  },
  {
    icon: FiDownload,
    iconBg: 'bg-amber-50 dark:bg-amber-950/20 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30',
    iconColor: 'text-amber-500',
    label: 'Export Center',
    desc: 'Filter and export sales records',
    path: '/export'
  }
];

const QuickActions = () => {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {ACTIONS.map((action) => (
          <QuickActionCard key={action.label} {...action} />
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
