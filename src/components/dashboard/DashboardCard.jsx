import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

const DashboardCard = ({ icon: Icon, iconBg = 'bg-gray-50', iconColor = 'text-gray-500', title, value, trend, trendDir = 'neutral', sub, onClick }) => {
  const TrendIcon = trendDir === 'up' ? FiTrendingUp : trendDir === 'down' ? FiTrendingDown : FiMinus;

  const trendColor =
    trendDir === 'up'
      ? 'text-feedback-success bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800/50'
      : trendDir === 'down'
      ? 'text-feedback-error bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50'
      : 'text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-150 dark:border-gray-700';

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-5 transition-all duration-200 group
        hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.08),0_4px_14px_-2px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.3)]
        hover:-translate-y-1 hover:border-gray-200 dark:hover:border-gray-700
        ${onClick ? 'cursor-pointer select-none' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:shadow-sm`}>
          <Icon className={`w-5 h-5 ${iconColor} transition-transform duration-200`} />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>

      <p className="text-[1.6rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{value}</p>
      <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-widest">{title}</h4>
      {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 font-medium">{sub}</p>}
      {onClick && (
        <p className="text-[10px] text-brand-primary font-bold mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 tracking-wide">
          View Details →
        </p>
      )}
    </div>
  );
};

export default DashboardCard;
