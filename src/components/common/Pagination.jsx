import React, { useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

const PAGE_SIZES = [10, 25, 50, 100];

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  pageSize = 25,
  totalRecords = 0,
  onPageChange,
  onPageSizeChange
}) {
  // A shorter list (a new search or filter, a bigger page size) must not leave the view on a page
  // past the end, which would show an empty table.
  useEffect(() => {
    if (onPageChange && totalRecords > 0 && totalPages >= 1 && currentPage > totalPages) onPageChange(totalPages);
  }, [currentPage, totalPages, totalRecords, onPageChange]);

  if (totalRecords === 0) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-brand-navyCard border-t border-gray-200 dark:border-brand-navyLine text-xs text-gray-600 dark:text-gray-400">
      {/* Records Summary & Page Size Select */}
      <div className="flex items-center gap-4">
        <span>
          Showing <strong className="text-gray-900 dark:text-white font-semibold">{startRecord}</strong> to{' '}
          <strong className="text-gray-900 dark:text-white font-semibold">{endRecord}</strong> of{' '}
          <strong className="text-gray-900 dark:text-white font-semibold">{totalRecords.toLocaleString()}</strong> records
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-gray-500">Per page:</span>
            <select
              value={pageSize}
              aria-label="Rows per page"
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                if (onPageChange) onPageChange(1);
              }}
              className="px-2 py-1 bg-gray-50 dark:bg-brand-navy border border-gray-200 dark:border-brand-navyLine rounded-lg text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
            >
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First Page"
          aria-label="First Page"
          className="p-1.5 rounded-lg border border-gray-200 dark:border-brand-navyLine hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <FiChevronsLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous Page"
          aria-label="Previous Page"
          className="p-1.5 rounded-lg border border-gray-200 dark:border-brand-navyLine hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1 font-semibold text-gray-800 dark:text-gray-200">
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Next Page"
          aria-label="Next Page"
          className="p-1.5 rounded-lg border border-gray-200 dark:border-brand-navyLine hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title="Last Page"
          aria-label="Last Page"
          className="p-1.5 rounded-lg border border-gray-200 dark:border-brand-navyLine hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <FiChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
