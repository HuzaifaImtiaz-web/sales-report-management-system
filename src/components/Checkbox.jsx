import React from 'react';

const Checkbox = React.forwardRef(({ label, id, ...props }, ref) => {
  return (
    <div className="flex items-center">
      <input
        id={id}
        ref={ref}
        type="checkbox"
        className="h-4.5 w-4.5 rounded text-brand-primary border-gray-300 focus:ring-brand-primary/45 focus:outline-none transition-colors duration-150 cursor-pointer"
        {...props}
      />
      {label && (
        <label htmlFor={id} className="ml-2 text-xs font-semibold text-gray-600 select-none cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
