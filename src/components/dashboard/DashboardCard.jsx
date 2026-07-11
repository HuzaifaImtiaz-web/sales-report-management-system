import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

const DashboardCard = ({ icon: Icon, iconBg = 'bg-gray-50', iconColor = 'text-gray-500', title, value, trend, trendDir = 'neutral', sub }) => {
  const TrendIcon = trendDir === 'up' ? FiTrendingUp : trendDir === 'down' ? FiTrendingDown : FiMinus;

  const trendColor =
    trendDir === 'up'
      ? 'text-feedback-success bg-green-50'
      : trendDir === 'down'
      ? 'text-feedback-error bg-red-50'
      : 'text-gray-400 bg-gray-100';

  return (
    <div className="bg-white border border-gray-150 rounded-enterprise shadow-soft p-5 hover:shadow-premium hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-gray-900 tracking-tight leading-none">{value}</p>
      <h4 className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-wide">{title}</h4>
      {sub && <p className="text-[10px] text-gray-400 mt-1 font-semibold">{sub}</p>}
    </div>
  );
};

export default DashboardCard;
