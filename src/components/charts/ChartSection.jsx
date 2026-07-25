import React from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts';
import ChartCard from './ChartCard';

const DONUT_COLORS = ['#A91D22', '#E5E7EB'];

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-enterprise shadow-premium px-3 py-2 text-xs">
      <p className="font-bold text-gray-800 dark:text-gray-100 mb-1">{label}</p>
      <p className="text-brand-primary font-bold">Rs {payload[0].value.toLocaleString()}K Sales</p>
    </div>
  );
};

const DonutTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-enterprise shadow-premium px-3 py-2 text-xs">
      <p className="font-bold text-gray-855 dark:text-gray-100">{payload[0].name}</p>
      <p className="font-bold" style={{ color: payload[0].payload.fill }}>{payload[0].value}%</p>
    </div>
  );
};

const ChartSection = ({ salesTrend = [], targetProgress = 0 }) => {
  const formattedSales = salesTrend && salesTrend.length > 0
    ? salesTrend.map(t => {
        // Parse month name from strftime YYYY-MM
        let label = t.month;
        try {
          const parts = t.month.split('-');
          if (parts.length === 2) {
            const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
            label = date.toLocaleString('default', { month: 'short' });
          }
        } catch (e) {}
        return {
          month: label,
          sales: Math.round(t.sales / 1000) // divide by 1000 for K
        };
      })
    : [
        { month: 'Jul', sales: 0 },
        { month: 'Aug', sales: 0 },
        { month: 'Sep', sales: 0 },
        { month: 'Oct', sales: 0 },
        { month: 'Nov', sales: 0 },
        { month: 'Dec', sales: 0 }
      ];

  const targetData = [
    { name: 'Achieved', value: targetProgress },
    { name: 'Remaining', value: Math.max(0, 100 - targetProgress) }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Bar Chart Card */}
      <div className="lg:col-span-2">
        <ChartCard title="Monthly Sales Overview" subtitle="Volume (in thousands PKR)">
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedSales} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: '#F9FAFB' }} />
                <Bar dataKey="sales" fill="#A91D22" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Donut Chart Card */}
      <ChartCard title="Product Target Progress" subtitle="Annual achievement goal status">
        <div className="flex flex-col justify-between h-60">
          <div className="flex flex-col items-center justify-center relative">
            <div className="w-36 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={targetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {targetData.map((entry, index) => (
                      <Cell key={entry.name} fill={DONUT_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-gray-900 dark:text-white leading-none">{targetProgress}%</span>
                <span className="text-[9px] text-gray-400 dark:text-gray-550 font-bold uppercase tracking-wider mt-1">Achieved</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5 border-t border-gray-50 dark:border-gray-800 pt-3 text-[11px] font-semibold">
            {targetData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: DONUT_COLORS[index] }} />
                  <span className="text-gray-500 dark:text-gray-400">{entry.name}</span>
                </div>
                <span className="text-gray-800 dark:text-gray-200 font-bold">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>
    </div>
  );
};

export default ChartSection;
