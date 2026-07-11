import React, { useState } from 'react';

const ACTIVITY = [
  { id: 1, date: '11 Jul 2026', po: 'PO-2026-0847', doctor: 'Dr. Ayesha Khan', area: 'Lahore Central', member: 'Bilal Ahmed', status: 'Delivered' },
  { id: 2, date: '11 Jul 2026', po: 'PO-2026-0846', doctor: 'Dr. Hamid Raza', area: 'Karachi South', member: 'Sara Malik', status: 'Pending' },
  { id: 3, date: '10 Jul 2026', po: 'PO-2026-0845', doctor: 'Dr. Nadia Siddiqui', area: 'Islamabad F-10', member: 'Usman Ali', status: 'Delivered' },
  { id: 4, date: '10 Jul 2026', po: 'PO-2026-0844', doctor: 'Dr. Farhan Latif', area: 'Rawalpindi', member: 'Hira Qureshi', status: 'Processing' },
  { id: 5, date: '09 Jul 2026', po: 'PO-2026-0843', doctor: 'Dr. Saima Riaz', area: 'Faisalabad', member: 'Kamran Shah', status: 'Delivered' },
  { id: 6, date: '09 Jul 2026', po: 'PO-2026-0842', doctor: 'Dr. Tariq Mehmood', area: 'Multan', member: 'Zara Hussain', status: 'Cancelled' },
  { id: 7, date: '08 Jul 2026', po: 'PO-2026-0841', doctor: 'Dr. Rabia Fatima', area: 'Peshawar', member: 'Asad Mirza', status: 'Delivered' },
  { id: 8, date: '08 Jul 2026', po: 'PO-2026-0840', doctor: 'Dr. Imran Baig', area: 'Quetta', member: 'Madiha Nawaz', status: 'Pending' },
];

const StatusBadge = ({ status }) => {
  const styles = {
    Delivered: 'bg-green-50 text-feedback-success border-green-100',
    Pending: 'bg-amber-50 text-feedback-warning border-amber-100',
    Processing: 'bg-blue-50 text-blue-550 border-blue-100',
    Cancelled: 'bg-red-50 text-feedback-error border-red-100',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 border rounded-md text-[10px] font-bold ${styles[status] || 'bg-gray-50 text-gray-500 border-gray-150'}`}>
      {status}
    </span>
  );
};

const RecentActivityTable = () => {
  const [page, setPage] = useState(0);
  const PER_PAGE = 5;
  const total = ACTIVITY.length;
  const pages = Math.ceil(total / PER_PAGE);
  const rows = ACTIVITY.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <div className="bg-white border border-gray-100 rounded-enterprise shadow-soft overflow-hidden">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Recent Activity</h3>
          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Latest sales entries across areas</p>
        </div>
        <button disabled className="text-xs font-bold text-brand-primary opacity-50 cursor-not-allowed hover:text-brand-primaryDark transition-colors">
          View All →
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs" aria-label="Recent activity entries">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-100">
              {['Date', 'PO Number', 'Doctor', 'Area', 'Team Member', 'Status'].map((h) => (
                <th key={h} className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 font-semibold text-gray-700">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap font-medium">{row.date}</td>
                <td className="px-5 py-3.5 text-gray-900 whitespace-nowrap font-mono text-[10px] font-bold">{row.po}</td>
                <td className="px-5 py-3.5 text-gray-800 whitespace-nowrap">{row.doctor}</td>
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{row.area}</td>
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{row.member}</td>
                <td className="px-5 py-3.5 whitespace-nowrap"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-t border-gray-100 bg-gray-50/30">
          <p className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">
            Showing <span className="text-gray-700">{page * PER_PAGE + 1}–{Math.min(page * PER_PAGE + PER_PAGE, total)}</span> of {total}
          </p>
          <div className="flex items-center gap-1.5 font-bold">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-[10px] uppercase tracking-wider rounded-lg border border-gray-250 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(Math.min(pages - 1, page + 1))}
              disabled={page === pages - 1}
              className="px-3 py-1.5 text-[10px] uppercase tracking-wider rounded-lg border border-gray-250 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentActivityTable;
