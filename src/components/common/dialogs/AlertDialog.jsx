import React, { useEffect, useRef } from 'react';
import { FiCheckCircle, FiInfo, FiAlertTriangle, FiXCircle } from 'react-icons/fi';

const AlertDialog = ({
  open,
  title,
  message,
  buttonText = 'OK',
  variant = 'info', // 'info' | 'success' | 'warning' | 'error'
  onClose,
}) => {
  const okBtnRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      const timer = setTimeout(() => {
        if (okBtnRef.current) okBtnRef.current.focus();
      }, 50);

      const handleKeyDown = (e) => {
        if ((e.key === 'Escape' || e.key === 'Enter') && onClose) {
          e.preventDefault();
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else if (previousFocusRef.current) {
      const el = previousFocusRef.current;
      previousFocusRef.current = null;
      requestAnimationFrame(() => {
        if (el && typeof el.focus === 'function') {
          el.focus();
        }
      });
    }
  }, [open, onClose]);

  if (!open) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          icon: <FiCheckCircle className="w-6 h-6 text-emerald-500" />,
          iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
          button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        };
      case 'warning':
        return {
          icon: <FiAlertTriangle className="w-6 h-6 text-amber-500" />,
          iconBg: 'bg-amber-100 dark:bg-amber-950/50',
          button: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      case 'error':
        return {
          icon: <FiXCircle className="w-6 h-6 text-red-500" />,
          iconBg: 'bg-red-100 dark:bg-red-950/50',
          button: 'bg-red-600 hover:bg-red-700 text-white',
        };
      default:
        return {
          icon: <FiInfo className="w-6 h-6 text-blue-500" />,
          iconBg: 'bg-blue-100 dark:bg-blue-950/50',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-desc"
    >
      <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl shrink-0 ${vStyles.iconBg}`}>
              {vStyles.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="alert-dialog-title" className="text-base font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                {title}
              </h3>
              <div id="alert-dialog-desc" className="text-xs text-gray-600 dark:text-slate-300 font-medium mt-1.5 leading-relaxed">
                {message}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 bg-gray-50/80 dark:bg-slate-900/80 border-t border-gray-100 dark:border-gray-800">
          <button
            ref={okBtnRef}
            type="button"
            onClick={onClose}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer ${vStyles.button}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;
