import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiCheck, FiX } from 'react-icons/fi';
import { validatePassword } from '../../utils/passwordPolicy';

const EnterprisePasswordInput = ({
  id,
  name,
  label,
  value = '',
  onChange,
  onBlur,
  placeholder = '••••••••',
  disabled = false,
  required = false,
  autoComplete = 'off',
  error = '',
  showRules = false,
  confirmValue = undefined,
  className = '',
  inputClassName = '',
  maxLength,
  isPin = false
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const policy = validatePassword(value);
  const isConfirming = confirmValue !== undefined;
  const isMatch = isConfirming && value !== '' && confirmValue === value;
  const isMismatch = isConfirming && confirmValue !== '' && confirmValue !== value;

  const toggleShow = (e) => {
    e.preventDefault();
    setShowPassword((prev) => !prev);
  };

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          inputMode={isPin ? 'numeric' : undefined}
          className={`w-full pr-10 pl-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border rounded-lg transition-all shadow-sm outline-none ${
            error
              ? 'border-red-500 ring-1 ring-red-500/20'
              : 'border-gray-200 dark:border-gray-700 focus:border-brand-primary dark:focus:border-red-500 focus:ring-1 focus:ring-brand-primary/20'
          } ${disabled ? 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed opacity-75' : ''} ${inputClassName}`}
        />
        <button
          type="button"
          tabIndex="-1"
          onClick={toggleShow}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-650 dark:hover:text-gray-200 transition-colors focus:outline-none"
        >
          {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
        </button>
      </div>

      {/* Direct Inline Error Message */}
      {error && (
        <div className="text-[11px] font-semibold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1">
          <FiX className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Confirmation Indicator */}
      {isConfirming && confirmValue !== '' && confirmValue !== undefined && (
        <div className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${isMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
          {isMatch ? (
            <>
              <FiCheck className="w-3.5 h-3.5 shrink-0" />
              <span>✓ Passwords Match</span>
            </>
          ) : isMismatch ? (
            <>
              <FiX className="w-3.5 h-3.5 shrink-0" />
              <span>Passwords Do Not Match</span>
            </>
          ) : null}
        </div>
      )}

      {/* Live Password Requirements Box */}
      {showRules && !isPin && (
        <div className="p-2.5 rounded-lg border border-gray-150 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-900/40 text-[11px] space-y-1 mt-2">
          <div className="font-extrabold uppercase tracking-wider text-[10px] text-gray-500 dark:text-gray-400 mb-1">
            Password Requirements
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10.5px]">
            <div className={`flex items-center gap-1.5 font-semibold ${policy.length ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {policy.length ? <FiCheck className="w-3.5 h-3.5 shrink-0" /> : <FiX className="w-3.5 h-3.5 shrink-0" />}
              <span>Minimum 8 characters</span>
            </div>
            <div className={`flex items-center gap-1.5 font-semibold ${policy.uppercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {policy.uppercase ? <FiCheck className="w-3.5 h-3.5 shrink-0" /> : <FiX className="w-3.5 h-3.5 shrink-0" />}
              <span>One uppercase letter</span>
            </div>
            <div className={`flex items-center gap-1.5 font-semibold ${policy.lowercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {policy.lowercase ? <FiCheck className="w-3.5 h-3.5 shrink-0" /> : <FiX className="w-3.5 h-3.5 shrink-0" />}
              <span>One lowercase letter</span>
            </div>
            <div className={`flex items-center gap-1.5 font-semibold ${policy.number ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {policy.number ? <FiCheck className="w-3.5 h-3.5 shrink-0" /> : <FiX className="w-3.5 h-3.5 shrink-0" />}
              <span>One number</span>
            </div>
            <div className={`flex items-center gap-1.5 font-semibold ${policy.special ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {policy.special ? <FiCheck className="w-3.5 h-3.5 shrink-0" /> : <FiX className="w-3.5 h-3.5 shrink-0" />}
              <span>One special character</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterprisePasswordInput;
