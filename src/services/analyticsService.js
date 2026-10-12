async function call(method, failure) {
  const res = await window.api.analytics[method]();
  if (res.success) return res.data;
  throw new Error(res.error || failure);
}

export const analyticsService = {
  getDashboardSummary: () => call('getDashboardSummary', 'Failed to fetch dashboard summary'),
  getMonthlySales: () => call('getMonthlySales', 'Failed to fetch monthly sales'),
  getTopProducts: () => call('getTopProducts', 'Failed to fetch top products'),
  getAreaPerformance: () => call('getAreaPerformance', 'Failed to fetch area performance'),
  getRepresentativePerformance: () => call('getRepresentativePerformance', 'Failed to fetch representative performance'),
  getTargetProgress: () => call('getTargetProgress', 'Failed to fetch target progress'),
  getRecentOrders: () => call('getRecentOrders', 'Failed to fetch recent orders')
};
