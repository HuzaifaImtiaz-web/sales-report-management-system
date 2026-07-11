import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

const StatCard = ({ icon, iconBg, iconColor, title, value, trend, trendDir = 'neutral', sub }) => {
  const TrendIcon = trendDir === 'up' ? FiTrendingUp : trendDir === 'down' ? FiTrendingDown : FiMinus;

  const trendColor =
    trendDir === 'up'
      ? 'text-feedback-success bg-green-50'
      : trendDir === 'down'
      ? 'text-feedback-error bg-red-50'
      : 'text-gray-400 bg-gray-150';

  return (
    <div className="bg-white border border-gray-100 rounded-enterprise shadow-soft p-5 hover:shadow-premium hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <span className={`${iconColor} text-xl`}>{icon}</span>
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          {trend}
        </span>
      </div>

      <p className="text-xl font-bold text-gray-900 tracking-tight leading-none">{value}</p>
      <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-wide">{title}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{sub}</p>}
    </div>
  );
};

export default StatCard;
