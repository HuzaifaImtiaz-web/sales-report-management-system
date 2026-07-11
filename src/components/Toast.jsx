import React, { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';

const Toast = ({ message, type = 'success', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: 'bg-green-50 border-green-200 text-feedback-success',
    error: 'bg-red-50 border-red-200 text-feedback-error',
  };

  const Icon = type === 'success' ? FiCheckCircle : FiAlertCircle;

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 px-4 py-3 border rounded-enterprise text-sm font-semibold shadow-soft animate-fade-in ${styles[type] || styles.success}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close notification"
          className="text-gray-400 hover:text-gray-650 transition-colors p-0.5 rounded"
        >
          <FiX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Toast;
