import React, { useState, useEffect, useRef } from 'react';
import { FiEdit3, FiXCircle } from 'react-icons/fi';

const PromptDialog = ({
  open,
  title,
  message,
  placeholder = 'Enter value...',
  defaultValue = '',
  confirmText = 'Submit',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  required = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (open) {
      setInputValue(defaultValue || '');
      setError('');
      previousFocusRef.current = document.activeElement;
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
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
  }, [open, defaultValue, loading, onCancel]);

  if (!open) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (required && !inputValue.trim()) {
      setError('This field is required.');
      return;
    }
    setError('');
    onConfirm(inputValue.trim());
  };

  const getVariantStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-red-500/20';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-amber-500/20';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-500/20';
      default:
        return 'bg-brand-primary hover:bg-[#8F161A] text-white shadow-md hover:shadow-brand-primary/20';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-dialog-title"
    >
      <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl shrink-0 bg-brand-primary/10 dark:bg-brand-primary/20">
                <FiEdit3 className="w-6 h-6 text-brand-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="prompt-dialog-title" className="text-base font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                  {title}
                </h3>
                {message && (
                  <p className="text-xs text-gray-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                    {message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (error) setError('');
                }}
                placeholder={placeholder}
                disabled={loading}
                className={`w-full px-4 py-3 rounded-xl border text-xs font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800/80 outline-none transition-all ${
                  error
                    ? 'border-red-500 ring-2 ring-red-500/20'
                    : 'border-gray-200 dark:border-gray-700 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                }`}
              />
              {error && (
                <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                  <FiXCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50/80 dark:bg-slate-900/80 border-t border-gray-100 dark:border-gray-800">
            {cancelText && (
              <button
                type="button"
                disabled={loading}
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {cancelText}
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 ${getVariantStyles()}`}
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromptDialog;
