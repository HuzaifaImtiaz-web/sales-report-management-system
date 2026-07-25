import React, { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiPlus, FiCheck } from 'react-icons/fi';

/**
 * Hybrid Combo Box component.
 * Supports selecting existing options or typing new values with auto-creation support.
 */
export default function HybridComboBox({
  value = '',
  onChange,
  onAddNew,
  options = [],
  placeholder = 'Type or select...',
  disabled = false,
  error = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const containerRef = useRef(null);

  // Normalize options array into [{ label, value }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { label: opt.name || opt.label || String(opt.id), value: opt.name || opt.value || String(opt.id) };
    }
    return { label: String(opt), value: String(opt) };
  });

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchingOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(inputValue.toLowerCase().trim())
  );

  const exactMatch = normalizedOptions.find(
    (opt) => opt.label.toLowerCase() === inputValue.trim().toLowerCase()
  );

  const handleSelect = (val) => {
    setInputValue(val);
    setIsOpen(false);
    if (onChange) onChange(val);
  };

  const handleCreateNew = () => {
    const newTrimmed = inputValue.trim();
    if (!newTrimmed) return;
    setInputValue(newTrimmed);
    setIsOpen(false);
    if (onAddNew) {
      onAddNew(newTrimmed);
    }
    if (onChange) {
      onChange(newTrimmed);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    if (onChange) onChange(val);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          disabled={disabled}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full pl-3 pr-8 py-2 text-xs font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border rounded-lg outline-none transition-all duration-150 ${
            error
              ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800/40' : ''}`}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="absolute right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <FiChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 animate-fade-in">
          {matchingOptions.length > 0 ? (
            matchingOptions.map((opt) => {
              const isSelected = opt.value.toLowerCase() === inputValue.trim().toLowerCase();
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 flex items-center justify-between transition-colors"
                >
                  <span>{opt.label}</span>
                  {isSelected && <FiCheck className="w-3.5 h-3.5 text-brand-primary" />}
                </button>
              );
            })
          ) : (
            <div className="p-2 text-center text-xs text-gray-400 font-medium">
              No matching existing options
            </div>
          )}

          {/* Show Create New option if typed string doesn't match an existing option */}
          {inputValue.trim().length > 0 && !exactMatch && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full px-3 py-2 text-left text-xs font-bold text-brand-primary hover:bg-brand-primary/10 flex items-center gap-1.5 transition-colors border-t border-gray-100 dark:border-gray-800"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>Create "{inputValue.trim()}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
