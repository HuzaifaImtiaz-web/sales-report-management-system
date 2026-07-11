import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

const InputField = React.forwardRef(({ label, id, type = 'text', error, placeholder, icon: Icon, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          ref={ref}
          type={type}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-enterprise text-gray-900 placeholder-gray-400 text-sm font-sans transition-all duration-200 focus:border-gray-400 focus:ring-0 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400 ${
            Icon ? 'pl-10' : ''
          } ${error ? 'border-feedback-error focus:border-feedback-error' : ''}`}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-feedback-error">
          <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error.message}
        </p>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;
