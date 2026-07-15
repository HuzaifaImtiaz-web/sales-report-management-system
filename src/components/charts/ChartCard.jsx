import React from 'react';

const ChartCard = ({ title, subtitle, children }) => {
  return (
    <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 sm:p-6 transition-all duration-250 hover:shadow-premium dark:hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)]">
      <div className="mb-5">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">{title}</h3>
        {subtitle && <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-1 uppercase tracking-wider">{subtitle}</p>}
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
