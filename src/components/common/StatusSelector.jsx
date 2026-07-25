import React from 'react';

/**
 * Standardized Status Selector UI/UX component matching the Target module standard.
 * Fully compatible with Light Mode and Dark Mode.
 */
export default function StatusSelector({
  options = ['All', 'Active', 'Inactive'],
  value = 'All',
  onChange,
  className = '',
  size = 'md'
}) {
  // Normalize value (empty string maps to 'All')
  const activeValue = !value || value === '' ? 'All' : value;

  const sizeClasses = size === 'sm' 
    ? 'px-2.5 py-1 text-[11px]' 
    : 'px-3 py-1.5 text-xs';

  return (
    <div className={`flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {options.map((option) => {
        const optionKey = typeof option === 'object' ? option.value : option;
        const optionLabel = typeof option === 'object' ? option.label : option;
        const isSelected = activeValue === optionKey || (activeValue === 'All' && optionKey === '');

        return (
          <button
            key={optionKey}
            type="button"
            onClick={() => {
              if (onChange) {
                onChange(optionKey);
              }
            }}
            className={`${sizeClasses} font-bold rounded-md transition-all duration-150 ${
              isSelected
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm border border-gray-200/50 dark:border-gray-600/50'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
            }`}
          >
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}
