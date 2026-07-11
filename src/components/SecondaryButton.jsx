import React from 'react';

const SecondaryButton = ({ children, type = 'button', ...props }) => {
  return (
    <button
      type={type}
      className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-50 text-gray-700 hover:bg-gray-100 font-semibold text-sm rounded-enterprise border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-250 focus:ring-offset-2 active:bg-gray-150"
      {...props}
    >
      <span>{children}</span>
    </button>
  );
};

export default SecondaryButton;
