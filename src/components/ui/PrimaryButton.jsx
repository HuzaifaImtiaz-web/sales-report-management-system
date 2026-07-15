import React from 'react';

const PrimaryButton = ({ children, loading, disabled, type = 'submit', ...props }) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-primary text-white hover:bg-brand-primaryDark font-semibold text-sm rounded-enterprise shadow-soft transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/45 focus:ring-offset-2 disabled:bg-gray-150 disabled:text-gray-400 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none"
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default PrimaryButton;
