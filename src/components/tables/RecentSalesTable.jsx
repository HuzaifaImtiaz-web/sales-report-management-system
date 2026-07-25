import React from 'react';
import { useNavigate } from 'react-router-dom';

const StatusBadge = ({ status }) => {
  const styles = {
    Completed: 'bg-green-50 dark:bg-green-900/30 text-feedback-success border-green-100 dark:border-green-800/50',
    Approved: 'bg-green-50 dark:bg-green-900/30 text-feedback-success border-green-100 dark:border-green-800/50',
    Pending: 'bg-amber-50 dark:bg-amber-900/30 text-feedback-warning border-amber-100 dark:border-amber-800/50',
    Cancelled: 'bg-red-50 dark:bg-red-900/30 text-feedback-error border-red-100 dark:border-red-800/50',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 border rounded-md text-[10px] font-bold ${styles[status] || 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-150 dark:border-gray-700'}`}>
      {status}
    </span>
  );
};

const RecentSalesTable = ({ recentSales = [] }) => {
  const navigate = useNavigate();

  // Limit to first 6 sales
  const displayedSales = recentSales.slice(0, 6);

  return (
    <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden transition-all duration-250 hover:shadow-premium dark:hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">Recent Sales</h3>
          <p className="text-[10px] text-gray-405 dark:text-gray-500 font-bold mt-1 uppercase tracking-wider">Latest sales records from database</p>
        </div>
        <button 
          onClick={() => navigate('/orders')}
          className="text-xs font-bold text-brand-primary hover:text-brand-primaryDark transition-colors"
        >
          View All →
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs" aria-label="Recent sales history">
          <thead>
            <tr className="bg-gray-55 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              {['Date', 'PO Number', 'Doctor', 'Area', 'Products', 'Status'].map((h) => (
                <th key={h} className="text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50 font-semibold text-gray-700 dark:text-gray-300">
            {displayedSales.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400 font-bold">
                  No recent sales found in database.
                </td>
              </tr>
            ) : (
              displayedSales.map((row) => {
                const productList = row.items && row.items.length > 0
                  ? row.items.map(item => item.productName || `Product #${item.productId}`).join(', ')
                  : 'No items';

                // Format date nicely
                let formattedDate = row.poDate;
                try {
                  const d = new Date(row.poDate);
                  if (!isNaN(d.getTime())) {
                    formattedDate = d.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
                  }
                } catch (e) {}

                return (
                  <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap font-medium">{formattedDate}</td>
                    <td className="px-5 py-3.5 text-gray-900 dark:text-white whitespace-nowrap font-mono text-[10px] font-bold">{row.poNumber}</td>
                    <td className="px-5 py-3.5 text-gray-805 dark:text-gray-200 whitespace-nowrap">{row.doctorName || 'N/A'}</td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{row.area}</td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 truncate max-w-[200px]" title={productList}>{productList}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap"><StatusBadge status={row.status} /></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentSalesTable;
