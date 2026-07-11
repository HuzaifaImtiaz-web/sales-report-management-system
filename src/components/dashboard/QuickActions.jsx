import React from 'react';
import { FiPlusCircle, FiPackage, FiUserPlus, FiFileText } from 'react-icons/fi';
import QuickActionCard from './QuickActionCard';

const ACTIONS = [
  {
    icon: FiPlusCircle,
    iconBg: 'bg-red-50 group-hover:bg-red-100',
    iconColor: 'text-brand-primary',
    label: 'New Sale',
    desc: 'Record a new sales transaction',
  },
  {
    icon: FiPackage,
    iconBg: 'bg-blue-50 group-hover:bg-blue-100',
    iconColor: 'text-blue-500',
    label: 'Add Product',
    desc: 'Register a new pharmaceutical product',
  },
  {
    icon: FiUserPlus,
    iconBg: 'bg-purple-50 group-hover:bg-purple-100',
    iconColor: 'text-purple-500',
    label: 'Add Doctor',
    desc: 'Add a doctor to your network',
  },
  {
    icon: FiFileText,
    iconBg: 'bg-green-50 group-hover:bg-green-100',
    iconColor: 'text-feedback-success',
    label: 'Generate Report',
    desc: 'Export sales & target reports',
  },
];

const QuickActions = () => {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ACTIONS.map((action) => (
          <QuickActionCard key={action.label} {...action} />
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
