import React from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  pageSize = 25,
  totalRecords = 0,
  onPageChange,
  onPageSizeChange
}) {
  if (totalRecords === 0) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-[#0f172a] border-t border-gray-150 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
      {/* Records Summary & Page Size Select */}
      <div className="flex items-center gap-4">
        <span>
          Showing <strong className="text-gray-900 dark:text-white font-bold">{startRecord}</strong> to{' '}
          <strong className="text-gray-900 dark:text-white font-bold">{endRecord}</strong> of{' '}
          <strong className="text-gray-900 dark:text-white font-bold">{totalRecords.toLocaleString()}</strong> records
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-gray-400">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
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
          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <FiChevronsLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous Page"
          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1 font-bold text-gray-800 dark:text-gray-200">
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Next Page"
          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title="Last Page"
          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <FiChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
