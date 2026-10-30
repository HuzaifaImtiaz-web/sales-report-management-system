async function call(method, filters, failure) {
  const res = await window.api.reports[method](filters);
  if (res.success) return res.data;
  throw new Error(res.error || failure);
}

export const reportService = {
  getDashboardSummaryData: (filters) => call('getDashboardSummaryData', filters, 'Failed to fetch dashboard summary'),
  getSalesTrendData: (filters) => call('getSalesTrendData', filters, 'Failed to fetch sales trend'),
  getTargetAchievementData: (filters) => call('getTargetAchievementData', filters, 'Failed to fetch target achievements'),
  getTeamContributionData: (filters) => call('getTeamContributionData', filters, 'Failed to fetch team contribution'),
  getProductPerformanceData: (filters) => call('getProductPerformanceData', filters, 'Failed to fetch product performance'),
  getReportsData: (filters) => call('getReportsData', filters, 'Failed to fetch reports data')
};
