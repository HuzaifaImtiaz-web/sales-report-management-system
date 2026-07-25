export const analyticsService = {
  getDashboardSummary: async () => {
    if (window.api && window.api.analytics) {
      const res = await window.api.analytics.getDashboardSummary();
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch dashboard summary');
    }
    return {
      totalRevenue: 0,
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      activeProducts: 0,
      activeDoctors: 0,
      activeInstitutions: 0,
      activeRepresentatives: 0,
      currentBusinessYear: '2025-2026',
      revenueGrowthDirection: 'up',
      revenueGrowthPercent: 0
    };
  },

  getMonthlySales: async () => {
    if (window.api && window.api.analytics) {
      const res = await window.api.analytics.getMonthlySales();
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch monthly sales');
    }
    return [];
  },

  getTopProducts: async () => {
    if (window.api && window.api.analytics) {
      const res = await window.api.analytics.getTopProducts();
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch top products');
    }
    return [];
  },

  getAreaPerformance: async () => {
    if (window.api && window.api.analytics) {
      const res = await window.api.analytics.getAreaPerformance();
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch area performance');
    }
    return [];
  },

  getRepresentativePerformance: async () => {
    if (window.api && window.api.analytics) {
      const res = await window.api.analytics.getRepresentativePerformance();
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch representative performance');
    }
    return [];
  },

  getTargetProgress: async () => {
    if (window.api && window.api.analytics) {
      const res = await window.api.analytics.getTargetProgress();
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch target progress');
    }
    return { target: 0, achieved: 0, remaining: 0, percent: 0 };
  },

  getRecentOrders: async () => {
    if (window.api && window.api.analytics) {
      const res = await window.api.analytics.getRecentOrders();
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch recent orders');
    }
    return [];
  }
};
