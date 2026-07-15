import React from 'react';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalRecords,
  startIndex,
  endIndex,
  pageSize,
  onPageSizeChange
}) => {
  if (totalRecords === 0) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-55/50 dark:bg-gray-800/10">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
          Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{startIndex + 1}–{Math.min(endIndex, totalRecords)}</span> of{' '}
          <span className="font-semibold text-gray-700 dark:text-gray-300">{totalRecords}</span> records
        </p>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
                onPageChange(1); // Reset to first page when page size changes
              }}
              className="px-1.5 py-1 text-xs font-semibold text-gray-750 dark:text-gray-250 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          Previous
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              currentPage === p
                ? 'bg-brand-primary text-white shadow-sm'
                : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
