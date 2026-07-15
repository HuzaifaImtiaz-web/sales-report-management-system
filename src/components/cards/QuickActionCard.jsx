import React from 'react';
import { Link } from 'react-router-dom';

const QuickActionCard = ({ icon: Icon, iconBg = 'bg-gray-50', iconColor = 'text-gray-500', label, desc, path }) => {
  if (path) {
    return (
      <Link
        to={path}
        className="group flex flex-col items-start gap-3.5 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-enterprise shadow-soft p-4 sm:p-5 text-left transition-all duration-200 hover:shadow-premium dark:hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 w-full cursor-pointer"
      >
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center transition-colors duration-200 flex-shrink-0 group-hover:scale-105`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-none">{label}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-medium leading-relaxed">{desc}</p>
        </div>
        <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider mt-auto pt-2 flex items-center gap-1">
          Open module &rarr;
        </span>
      </Link>
    );
  }

  return (
    <button
      disabled
      title="Coming soon"
      className="group flex flex-col items-start gap-3.5 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-enterprise shadow-soft p-4 sm:p-5 text-left transition-all duration-200 hover:shadow-premium dark:hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 cursor-not-allowed w-full"
    >
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center transition-colors duration-200 flex-shrink-0 group-hover:scale-105`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-none">{label}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-medium leading-relaxed">{desc}</p>
      </div>
      <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-wider mt-auto pt-2">Coming soon</span>
    </button>
  );
};

export default QuickActionCard;
