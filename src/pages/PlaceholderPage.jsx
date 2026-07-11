import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

const PlaceholderPage = ({ title }) => {
  return (
    <DashboardLayout pageTitle={title}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white border border-gray-150 rounded-enterprise p-8 text-center shadow-soft animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-6">
          <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-none">{title} Module</h2>
        <p className="text-sm font-semibold text-gray-450 mt-3 max-w-sm leading-relaxed">
          This section is currently under development as a high-fidelity frontend mockup. Full database integration and reports will be added soon.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default PlaceholderPage;
