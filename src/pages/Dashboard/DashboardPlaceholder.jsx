import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Toast from '../../components/common/Toast';
import { analyticsService } from '../../services/analyticsService';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  FiDollarSign, FiFileText, FiClock, FiCheckCircle, FiPackage,
  FiUser, FiActivity, FiCalendar, FiMapPin, FiAward,
  FiPlusCircle, FiArrowRight, FiTrendingUp, FiTrendingDown,
  FiBriefcase, FiUsers, FiSettings
} from 'react-icons/fi';

const DashboardPlaceholder = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // States for analytics metrics
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    activeProducts: 0,
    activeDoctors: 0,
    activeInstitutions: 0,
    activeRepresentatives: 0,
    currentBusinessYear: 'N/A',
    revenueGrowthDirection: 'up',
    revenueGrowthPercent: 0
  });

  const [monthlySales, setMonthlySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [areaPerformance, setAreaPerformance] = useState([]);
  const [repPerformance, setRepPerformance] = useState([]);
  const [targetProgress, setTargetProgress] = useState({
    target: 0,
    achieved: 0,
    remaining: 0,
    percent: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);

  const defaultSummary = {
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    activeProducts: 0,
    activeDoctors: 0,
    activeInstitutions: 0,
    activeRepresentatives: 0,
    currentBusinessYear: 'N/A',
    revenueGrowthDirection: 'up',
    revenueGrowthPercent: 0
  };

  const defaultTargetProgress = {
    target: 0,
    achieved: 0,
    remaining: 0,
    percent: 0
  };

  // Fetch all analytics data
  const loadDashboardData = async () => {
    try {
      const [
        summaryRes,
        monthlyRes,
        productsRes,
        areasRes,
        repsRes,
        targetRes,
        ordersRes
      ] = await Promise.all([
        analyticsService.getDashboardSummary().catch(err => { console.error(err); return defaultSummary; }),
        analyticsService.getMonthlySales().catch(err => { console.error(err); return []; }),
        analyticsService.getTopProducts().catch(err => { console.error(err); return []; }),
        analyticsService.getAreaPerformance().catch(err => { console.error(err); return []; }),
        analyticsService.getRepresentativePerformance().catch(err => { console.error(err); return []; }),
        analyticsService.getTargetProgress().catch(err => { console.error(err); return defaultTargetProgress; }),
        analyticsService.getRecentOrders().catch(err => { console.error(err); return []; })
      ]);

      setSummary(summaryRes && typeof summaryRes === 'object' ? { ...defaultSummary, ...summaryRes } : defaultSummary);
      setMonthlySales(Array.isArray(monthlyRes) ? monthlyRes : []);
      setTopProducts(Array.isArray(productsRes) ? productsRes : []);
      setAreaPerformance(Array.isArray(areasRes) ? areasRes : []);
      setRepPerformance(Array.isArray(repsRes) ? repsRes : []);
      setTargetProgress(targetRes && typeof targetRes === 'object' ? { ...defaultTargetProgress, ...targetRes } : defaultTargetProgress);
      setRecentOrders(Array.isArray(ordersRes) ? ordersRes : []);
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      setToast({ message: 'Failed to load live analytics data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Listen to changes in orders, products, areas, etc.
    const handleDbChange = () => {
      loadDashboardData();
    };
    window.addEventListener('himmel-db-change', handleDbChange);

    return () => {
      window.removeEventListener('himmel-db-change', handleDbChange);
    };
  }, []);

  if (loading) {
    return (
      <DashboardLayout pageTitle="Dashboard">
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Loading Executive Analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Target progress bar color calculator
  const getProgressColorClass = (percent) => {
    if (percent >= 80) return 'bg-emerald-500';
    if (percent >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getProgressTextClass = (percent) => {
    if (percent >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30';
    if (percent >= 50) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30';
    return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30';
  };

  // KPI card formatters
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <DashboardLayout pageTitle="Executive Dashboard">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="space-y-6 pb-12">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink dark:text-white">
              Welcome back
            </h2>
            <p className="text-sm text-muted dark:text-gray-400 mt-1">
              Here is how sales are going in business year <span className="font-semibold text-ink dark:text-white">{summary.currentBusinessYear}</span>.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-brand-navyCard border border-line dark:border-brand-navyLine px-3.5 py-2 rounded-lg">
            <FiCalendar className="text-brand-primary w-4 h-4" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active year: {summary.currentBusinessYear}
            </span>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Revenue */}
          <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-500">Revenue</span>
              <div className="p-1.5 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-500 dark:text-gray-400">
                <FiDollarSign className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-ink dark:text-white mt-3 truncate">
              {formatCurrency(summary.totalRevenue)}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-xs font-semibold">
              {summary.revenueGrowthPercent > 0 ? (
                <>
                  {summary.revenueGrowthDirection === 'up' ? (
                    <FiTrendingUp className="text-emerald-500 w-3 h-3" />
                  ) : (
                    <FiTrendingDown className="text-rose-500 w-3 h-3" />
                  )}
                  <span className={summary.revenueGrowthDirection === 'up' ? 'text-emerald-500' : 'text-rose-500'}>
                    {summary.revenueGrowthPercent}%
                  </span>
                  <span className="text-gray-500 dark:text-gray-500 font-medium">vs last month</span>
                </>
              ) : (
                <span className="text-gray-500 dark:text-gray-500 font-medium">No prior comparison</span>
              )}
            </div>
          </div>

          {/* Orders */}
          <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-500">Total Orders</span>
              <div className="p-1.5 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-500 dark:text-gray-400500">
                <FiFileText className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mt-3">
              {summary.totalOrders}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-medium">
              Registered sales operations
            </p>
          </div>

          {/* Pending Orders */}
          <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-500">Pending Orders</span>
              <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-500">
                <FiClock className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mt-3">
              {summary.pendingOrders}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-medium">
              Awaiting manager approval
            </p>
          </div>

          {/* Completed Orders */}
          <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-500">Completed</span>
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-500">
                <FiCheckCircle className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mt-3">
              {summary.completedOrders}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-medium">
              Completed transactions
            </p>
          </div>

          {/* Active Products */}
          <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-500">Products</span>
              <div className="p-1.5 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-500 dark:text-gray-400500">
                <FiPackage className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mt-3">
              {summary.activeProducts}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-medium">
              Active items in catalog
            </p>
          </div>

          {/* Active Doctors */}
          <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-500">Active Doctors</span>
              <div className="p-1.5 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-rose-500">
                <FiUser className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mt-3">
              {summary.activeDoctors}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-medium">
              Prescribing practitioners
            </p>
          </div>

          {/* Active Institutions */}
          <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-500">Institutions</span>
              <div className="p-1.5 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-500 dark:text-gray-400500">
                <FiBriefcase className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mt-3">
              {summary.activeInstitutions}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-medium">
              Active medical institutions
            </p>
          </div>

          {/* Active Representatives */}
          <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-500">Reps</span>
              <div className="p-1.5 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-500 dark:text-gray-400500">
                <FiUsers className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mt-3">
              {summary.activeRepresentatives}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-medium">
              Field representatives
            </p>
          </div>

          {/* Target Progress Status Card */}
          <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-250 col-span-2 group relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-500">Target Achievement</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getProgressTextClass(targetProgress.percent)}`}>
                {targetProgress.percent}% Achieved
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2.5">
              <div>
                <p className="text-[11px] font-semibold text-gray-500">Target</p>
                <p className="text-xs font-semibold text-gray-800 dark:text-white mt-0.5">{formatCurrency(targetProgress.target)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500">Achieved</p>
                <p className="text-xs font-semibold text-brand-primary mt-0.5">{formatCurrency(targetProgress.achieved)}</p>
              </div>
            </div>

            <div className="w-full bg-gray-100 dark:bg-brand-navy h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${getProgressColorClass(targetProgress.percent)}`}
                style={{ width: `${Math.min(100, targetProgress.percent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Charts & Target Achievement Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Monthly Sales Trend */}
          <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-2xl p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-brand-navyLine pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <FiActivity className="text-brand-primary w-4 h-4" />
                  <h3 className="text-xs font-semibold text-gray-800 dark:text-white">
                    Monthly Sales Trend
                  </h3>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-500 font-semibold italic">
                  Business Year: {summary.currentBusinessYear}
                </span>
              </div>

              {monthlySales.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[220px]">
                  <p className="text-xs text-gray-500 dark:text-gray-500 font-semibold">No sales data available for this business year.</p>
                </div>
              ) : (
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 9, fontWeight: 600 }} 
                        stroke="#6B7280" 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 9, fontWeight: 600 }} 
                        stroke="#6B7280" 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                      />
                      <Tooltip 
                        contentStyle={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: 'rgba(255, 255, 255, 0.95)'
                        }}
                        formatter={(v) => [formatCurrency(v), 'Revenue']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#A91D22" 
                        strokeWidth={2.5} 
                        dot={{ r: 3.5, strokeWidth: 1 }} 
                        activeDot={{ r: 5 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* 2. Target Progress Circular/Card */}
          <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-gray-200 dark:border-brand-navyLine pb-3 mb-4">
                <FiAward className="text-brand-primary w-4 h-4" />
                <h3 className="text-xs font-semibold text-gray-800 dark:text-white">
                  Target Progress breakdown
                </h3>
              </div>

              <div className="flex flex-col items-center py-2">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {/* SVG circular track */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="64" cy="64" r="50" 
                      className="stroke-gray-100 dark:stroke-gray-800 fill-none" 
                      strokeWidth="8"
                    />
                    <circle 
                      cx="64" cy="64" r="50" 
                      className={`fill-none transition-all duration-1000 ${
                        targetProgress.percent >= 80 ? 'stroke-emerald-500' :
                        targetProgress.percent >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'
                      }`} 
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - Math.min(100, targetProgress.percent) / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-semibold text-gray-800 dark:text-white">
                      {targetProgress.percent}%
                    </span>
                    <span className="text-[8px] font-semibold text-gray-500">
                      Completed
                    </span>
                  </div>
                </div>

                <div className="w-full space-y-2 mt-4 text-xs font-semibold">
                  <div className="flex justify-between items-center bg-gray-50/50 dark:bg-brand-navy/30 p-2 rounded-lg border border-gray-200 dark:border-brand-navyLine">
                    <span className="text-gray-500 dark:text-gray-500">Target allocation:</span>
                    <span className="text-gray-700 dark:text-gray-200">{formatCurrency(targetProgress.target)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50/50 dark:bg-brand-navy/30 p-2 rounded-lg border border-gray-200 dark:border-brand-navyLine">
                    <span className="text-gray-500 dark:text-gray-500">Achieved sales:</span>
                    <span className="text-brand-primary">{formatCurrency(targetProgress.achieved)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50/50 dark:bg-brand-navy/30 p-2 rounded-lg border border-gray-200 dark:border-brand-navyLine">
                    <span className="text-gray-500 dark:text-gray-500">Remaining to target:</span>
                    <span className="text-rose-500">{formatCurrency(targetProgress.remaining)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products & Area performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products Bar Chart */}
          <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-brand-navyLine pb-3 mb-4">
              <FiPackage className="text-brand-primary w-4 h-4" />
              <h3 className="text-xs font-semibold text-gray-800 dark:text-white">
                Top 10 Product Sales
              </h3>
            </div>

            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[220px]">
                <p className="text-xs text-gray-500 font-semibold">No product sales recorded yet.</p>
              </div>
            ) : (
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" className="dark:stroke-gray-700" />
                    <XAxis type="number" tick={{ fontSize: 9, fontWeight: 600 }} stroke="#6B7280" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 9, fontWeight: 600 }} 
                      stroke="#6B7280" 
                      width={90}
                    />
                    <Tooltip 
                      contentStyle={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        borderRadius: '8px'
                      }}
                      formatter={(v) => [v, 'Quantity Sold']}
                    />
                    <Bar dataKey="quantity" fill="#A91D22" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#A91D22' : '#D9777A'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Area performance Chart */}
          <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-brand-navyLine pb-3 mb-4">
              <FiMapPin className="text-brand-primary w-4 h-4" />
              <h3 className="text-xs font-semibold text-gray-800 dark:text-white">
                Area Performance breakdown
              </h3>
            </div>

            {areaPerformance.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[220px]">
                <p className="text-xs text-gray-500 font-semibold">No area sales recorded yet.</p>
              </div>
            ) : (
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={areaPerformance} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" className="dark:stroke-gray-700" />
                    <XAxis type="number" tick={{ fontSize: 9, fontWeight: 600 }} stroke="#6B7280" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 9, fontWeight: 600 }} 
                      stroke="#6B7280" 
                      width={90}
                    />
                    <Tooltip 
                      contentStyle={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        borderRadius: '8px'
                      }}
                      formatter={(v) => [formatCurrency(v), 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#A91D22" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {areaPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#A91D22' : '#D9777A'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Representative Leaderboard & Recent Orders Table */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Representative Leaderboard */}
          <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-gray-200 dark:border-brand-navyLine pb-3 mb-4">
                <FiUsers className="text-brand-primary w-4 h-4" />
                <h3 className="text-xs font-semibold text-gray-800 dark:text-white">
                  Top Representatives Leaderboard
                </h3>
              </div>

              {repPerformance.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[220px]">
                  <p className="text-xs text-gray-500 font-semibold">No rep performance data recorded.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {repPerformance.map((rep, idx) => (
                    <div 
                      key={rep.name} 
                      className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-805/30 border border-gray-200 dark:border-brand-navyLine rounded-xl hover:shadow-soft transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${
                          idx === 0 ? 'bg-amber-100 text-amber-600' :
                          idx === 1 ? 'bg-slate-200 text-slate-600' :
                          idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{rep.name}</p>
                          <p className="text-[11px] text-gray-500 font-semibold">{rep.orders} Orders · {rep.quantity} Products</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-brand-primary">
                        {formatCurrency(rep.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-2xl p-5 shadow-sm xl:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-gray-200 dark:border-brand-navyLine pb-3 mb-4">
                <FiFileText className="text-brand-primary w-4 h-4" />
                <h3 className="text-xs font-semibold text-gray-800 dark:text-white">
                  Recent Sales Operations
                </h3>
              </div>

              {recentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[220px]">
                  <p className="text-xs text-gray-500 font-semibold">No recent orders found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-brand-navyLine text-gray-500">
                        <th className="py-2.5 font-semibold">Order No</th>
                        <th className="py-2.5 font-semibold">Date</th>
                        <th className="py-2.5 font-semibold">Doctor</th>
                        <th className="py-2.5 font-semibold">Institution</th>
                        <th className="py-2.5 font-semibold">Representative</th>
                        <th className="py-2.5 font-semibold">Area</th>
                        <th className="py-2.5 font-semibold">Status</th>
                        <th className="py-2.5 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-850">
                      {recentOrders.map((order) => (
                        <tr 
                          key={order.id} 
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="hover:bg-gray-50/55 dark:hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <td className="py-2 text-brand-primary font-semibold">{order.orderNumber}</td>
                          <td className="py-2 text-gray-500">{order.orderDate}</td>
                          <td className="py-2 max-w-[100px] truncate">{order.doctorName || 'N/A'}</td>
                          <td className="py-2 max-w-[100px] truncate">{order.institutionName || 'N/A'}</td>
                          <td className="py-2 max-w-[100px] truncate">{order.representativeName || 'N/A'}</td>
                          <td className="py-2">{order.areaName || 'N/A'}</td>
                          <td className="py-2">
                            <span className={
                              order.status === 'Completed' ? 'badge-success' :
                              order.status === 'Approved' ? 'badge-neutral' :
                              order.status === 'Cancelled' ? 'badge-error' :
                              'badge-pending'
                            }>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-2 text-right font-semibold">{formatCurrency(order.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Quick Actions */}
        <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-brand-navyLine pb-3 mb-4">
            <FiPlusCircle className="text-brand-primary w-4 h-4" />
            <h3 className="text-xs font-semibold text-gray-800 dark:text-white">
              Quick Actions Shortcuts
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <button 
              onClick={() => navigate('/orders/new')}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-brand-navyLine rounded-xl hover:border-brand-primary hover:bg-gray-50/15 dark:hover:bg-brand-primary/5 transition-all text-center gap-2 group"
            >
              <div className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-full text-brand-primary transition-transform">
                <FiPlusCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Create Order</span>
            </button>

            <button 
              onClick={() => navigate('/products')}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-brand-navyLine rounded-xl hover:border-brand-primary hover:bg-gray-50/15 dark:hover:bg-brand-primary/5 transition-all text-center gap-2 group"
            >
              <div className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-full text-gray-500 transition-transform">
                <FiPackage className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Add Product</span>
            </button>

            <button 
              onClick={() => navigate('/doctors')}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-brand-navyLine rounded-xl hover:border-brand-primary hover:bg-gray-50/15 dark:hover:bg-brand-primary/5 transition-all text-center gap-2 group"
            >
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-full text-rose-500 transition-transform">
                <FiUser className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Add Doctor</span>
            </button>

            <button 
              onClick={() => navigate('/institutions')}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-brand-navyLine rounded-xl hover:border-brand-primary hover:bg-gray-50/15 dark:hover:bg-brand-primary/5 transition-all text-center gap-2 group"
            >
              <div className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-full text-gray-500 transition-transform">
                <FiBriefcase className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Add Institution</span>
            </button>

            <button 
              onClick={() => navigate('/reports')}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-brand-navyLine rounded-xl hover:border-brand-primary hover:bg-gray-50/15 dark:hover:bg-brand-primary/5 transition-all text-center gap-2 group"
            >
              <div className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-full text-gray-500 transition-transform">
                <FiFileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Reports Center</span>
            </button>

            <button 
              onClick={() => navigate('/settings')}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-brand-navyLine rounded-xl hover:border-brand-primary hover:bg-gray-50/15 dark:hover:bg-brand-primary/5 transition-all text-center gap-2 group"
            >
              <div className="p-2.5 bg-gray-50 dark:bg-brand-navy/30 rounded-full text-gray-500 transition-transform">
                <FiSettings className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPlaceholder;
