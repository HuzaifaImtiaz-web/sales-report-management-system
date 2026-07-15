import React from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

export const evaluateRules = (password = '') => {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+=\-[\]{}:;'"|\\,.<>?/`~]/.test(password),
  };
};

const PasswordStrength = ({ value = '' }) => {
  const rules = evaluateRules(value);
  
  // Compute overall score
  const passedCount = Object.values(rules).filter(Boolean).length;
  
  let strengthLabel = 'Very Weak';
  let strengthColor = 'bg-red-400';
  let textColor = 'text-red-500';

  if (value.length === 0) {
    strengthLabel = 'Empty';
    strengthColor = 'bg-gray-200';
    textColor = 'text-gray-400';
  } else if (passedCount === 5) {
    strengthLabel = 'Strong';
    strengthColor = 'bg-feedback-success';
    textColor = 'text-feedback-success';
  } else if (passedCount >= 3) {
    strengthLabel = 'Medium';
    strengthColor = 'bg-feedback-warning';
    textColor = 'text-feedback-warning';
  }

  const requirements = [
    { key: 'minLength', label: '8 characters minimum' },
    { key: 'hasUpper', label: 'At least one uppercase letter' },
    { key: 'hasLower', label: 'At least one lowercase letter' },
    { key: 'hasNumber', label: 'At least one number (0–9)' },
    { key: 'hasSpecial', label: 'At least one special character' },
  ];

  return (
    <div className="mt-3.5 space-y-3.5">
      {/* Strength indicator bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-gray-500 uppercase tracking-wider">Password Strength</span>
          <span className={`${textColor} font-bold`}>{strengthLabel}</span>
        </div>
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strengthColor}`}
            style={{ width: `${value.length === 0 ? 0 : (passedCount / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Rules list */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs font-medium text-gray-500" aria-label="Password rules">
        {requirements.map((req) => {
          const isPassed = rules[req.key];
          return (
            <li
              key={req.key}
              className={`flex items-center gap-1.5 transition-colors duration-200 ${
                isPassed ? 'text-feedback-success font-semibold' : value.length > 0 ? 'text-gray-400' : 'text-gray-450'
              }`}
            >
              {isPassed ? (
                <FiCheck className="w-4 h-4 text-feedback-success flex-shrink-0" />
              ) : (
                <FiX className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              )}
              <span>{req.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrength;
