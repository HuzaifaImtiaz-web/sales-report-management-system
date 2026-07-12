import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

const StatCard = ({ icon, iconBg, iconColor, title, value, trend, trendDir = 'neutral', sub }) => {
  const TrendIcon = trendDir === 'up' ? FiTrendingUp : trendDir === 'down' ? FiTrendingDown : FiMinus;

  const trendColor =
    trendDir === 'up'
      ? 'text-feedback-success bg-green-50 dark:bg-green-900/30'
      : trendDir === 'down'
      ? 'text-feedback-error bg-red-50 dark:bg-red-900/30'
      : 'text-gray-400 bg-gray-150 dark:bg-gray-800';

  return (
    <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-5 hover:shadow-premium dark:hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <span className={`${iconColor} text-xl`}>{icon}</span>
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          {trend}
        </span>
      </div>

      <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">{value}</p>
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-wide">{title}</p>
      {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 font-medium">{sub}</p>}
    </div>
  );
};

export default StatCard;
