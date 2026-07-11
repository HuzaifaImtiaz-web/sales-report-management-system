import React from 'react';

const STATIC_SALES = [
  { id: 1, date: '11 Jul 2026', po: 'PO-2026-0847', doctor: 'Dr. Ayesha Khan', area: 'Lahore Central', products: 'Amoxicillin, Paracetamol', status: 'Delivered' },
  { id: 2, date: '11 Jul 2026', po: 'PO-2026-0846', doctor: 'Dr. Hamid Raza', area: 'Karachi South', products: 'Metformin, Lipitor', status: 'Pending' },
  { id: 3, date: '10 Jul 2026', po: 'PO-2026-0845', doctor: 'Dr. Nadia Siddiqui', area: 'Islamabad F-10', products: 'Ibuprofen, Omeprazole', status: 'Delivered' },
  { id: 4, date: '10 Jul 2026', po: 'PO-2026-0844', doctor: 'Dr. Farhan Latif', area: 'Rawalpindi', products: 'Augmentin, Azithromycin', status: 'Processing' },
  { id: 5, date: '09 Jul 2026', po: 'PO-2026-0843', doctor: 'Dr. Saima Riaz', area: 'Faisalabad', products: 'Crestor, Zoloft', status: 'Delivered' },
  { id: 6, date: '09 Jul 2026', po: 'PO-2026-0842', doctor: 'Dr. Tariq Mehmood', area: 'Multan', products: 'Panadol, Ventolin', status: 'Cancelled' },
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

const RecentSalesTable = () => {
  return (
    <div className="bg-white border border-gray-150 rounded-enterprise shadow-soft overflow-hidden transition-all duration-250 hover:shadow-premium">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Recent Sales</h3>
          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Latest sales records from reps</p>
        </div>
        <button disabled className="text-xs font-bold text-brand-primary opacity-50 cursor-not-allowed hover:text-brand-primaryDark transition-colors">
          View All →
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs" aria-label="Recent sales history">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-100">
              {['Date', 'PO Number', 'Doctor', 'Area', 'Products', 'Status'].map((h) => (
                <th key={h} className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 font-semibold text-gray-700">
            {STATIC_SALES.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap font-medium">{row.date}</td>
                <td className="px-5 py-3.5 text-gray-900 whitespace-nowrap font-mono text-[10px] font-bold">{row.po}</td>
                <td className="px-5 py-3.5 text-gray-800 whitespace-nowrap">{row.doctor}</td>
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{row.area}</td>
                <td className="px-5 py-3.5 text-gray-600 truncate max-w-[150px]">{row.products}</td>
                <td className="px-5 py-3.5 whitespace-nowrap"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentSalesTable;
