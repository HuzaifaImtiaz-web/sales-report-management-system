import React, { useEffect, useRef } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiXCircle, FiHelpCircle } from 'react-icons/fi';

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary', // 'primary' | 'danger' | 'warning' | 'success'
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const confirmBtnRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      const timer = setTimeout(() => {
        if (confirmVariant === 'danger' && cancelBtnRef.current) {
          cancelBtnRef.current.focus();
        } else if (confirmBtnRef.current) {
          confirmBtnRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !loading && onCancel) {
          e.preventDefault();
          onCancel();
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
  }, [open, confirmVariant, loading, onCancel]);

  if (!open) return null;

  const getVariantStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return {
          icon: <FiXCircle className="w-6 h-6 text-red-500" />,
          iconBg: 'bg-red-100 dark:bg-red-950/50',
          confirmBtn: 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-red-500/20',
        };
      case 'warning':
        return {
          icon: <FiAlertTriangle className="w-6 h-6 text-amber-500" />,
          iconBg: 'bg-amber-100 dark:bg-amber-950/50',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-amber-500/20',
        };
      case 'success':
        return {
          icon: <FiCheckCircle className="w-6 h-6 text-emerald-500" />,
          iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-500/20',
        };
      default:
        return {
          icon: <FiHelpCircle className="w-6 h-6 text-brand-primary" />,
          iconBg: 'bg-brand-primary/10 dark:bg-brand-primary/20',
          confirmBtn: 'bg-brand-primary hover:bg-[#8F161A] text-white shadow-md hover:shadow-brand-primary/20',
        };
    }
  };

  const variant = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl shrink-0 ${variant.iconBg}`}>
              {variant.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="confirm-dialog-title" className="text-base font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                {title}
              </h3>
              <div id="confirm-dialog-desc" className="text-xs text-gray-600 dark:text-slate-300 font-medium mt-1.5 leading-relaxed">
                {message}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50/80 dark:bg-slate-900/80 border-t border-gray-100 dark:border-gray-800">
          {cancelText && (
            <button
              ref={cancelBtnRef}
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 ${variant.confirmBtn}`}
          >
            {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
