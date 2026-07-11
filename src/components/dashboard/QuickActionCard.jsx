import React from 'react';

const QuickActionCard = ({ icon: Icon, iconBg = 'bg-gray-50', iconColor = 'text-gray-500', label, desc }) => {
  return (
    <button
      disabled
      title="Coming soon"
      className="group flex flex-col items-start gap-3.5 bg-white border border-gray-150 rounded-enterprise shadow-soft p-4 sm:p-5 text-left transition-all duration-200 hover:shadow-premium hover:-translate-y-0.5 cursor-not-allowed w-full"
    >
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center transition-colors duration-200 flex-shrink-0 group-hover:scale-105`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-800 leading-none">{label}</p>
        <p className="text-[10px] text-gray-400 mt-2 font-medium leading-relaxed">{desc}</p>
      </div>
      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mt-auto pt-2">Coming soon</span>
    </button>
  );
};

export default QuickActionCard;
