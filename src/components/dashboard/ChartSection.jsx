import React from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Tooltip as PieTooltip,
} from 'recharts';
import ChartCard from './ChartCard';

const MONTHLY_SALES = [
  { month: 'Aug', sales: 38 },
  { month: 'Sep', sales: 52 },
  { month: 'Oct', sales: 61 },
  { month: 'Nov', sales: 45 },
  { month: 'Dec', sales: 70 },
  { month: 'Jan', sales: 58 },
  { month: 'Feb', sales: 64 },
  { month: 'Mar', sales: 80 },
  { month: 'Apr', sales: 75 },
  { month: 'May', sales: 90 },
  { month: 'Jun', sales: 82 },
  { month: 'Jul', sales: 95 },
];

const TARGET_DATA = [
  { name: 'Achieved', value: 74 },
  { name: 'Remaining', value: 26 },
];

const DONUT_COLORS = ['#A91D22', '#E5E7EB'];

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-enterprise shadow-premium px-3 py-2 text-xs">
      <p className="font-bold text-gray-800 dark:text-gray-100 mb-1">{label}</p>
      <p className="text-brand-primary font-bold">{payload[0].value}K Sales</p>
    </div>
  );
};

const DonutTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-enterprise shadow-premium px-3 py-2 text-xs">
      <p className="font-bold text-gray-850 dark:text-gray-100">{payload[0].name}</p>
      <p className="font-bold" style={{ color: payload[0].payload.fill }}>{payload[0].value}%</p>
    </div>
  );
};

const ChartSection = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Bar Chart Card */}
      <div className="lg:col-span-2">
        <ChartCard title="Monthly Sales Overview" subtitle="Volume (in thousands) — FY 2025–26">
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_SALES} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
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
                    data={TARGET_DATA}
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
                    {TARGET_DATA.map((entry, index) => (
                      <Cell key={entry.name} fill={DONUT_COLORS[index]} />
                    ))}
                  </Pie>
                  <PieTooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-gray-900 dark:text-white leading-none">74%</span>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-1">Achieved</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5 border-t border-gray-50 dark:border-gray-800 pt-3 text-[11px] font-semibold">
            {TARGET_DATA.map((entry, index) => (
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
