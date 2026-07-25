const INITIAL_REPORTS_DATA = [
  {
    id: 1,
    poNumber: 'PO-2026-001',
    poDate: '2026-01-10',
    doctorId: 1,
    area: 'Lahore Gulberg',
    teamMemberId: 1,
    status: 'Completed',
    remarks: 'Urgent delivery requested.',
    items: [
      { productId: 1, quantity: 200, rate: 450 },
      { productId: 3, quantity: 150, rate: 380 }
    ]
  },
  {
    id: 2,
    poNumber: 'PO-2026-002',
    poDate: '2026-01-25',
    doctorId: 2,
    area: 'Karachi Clifton',
    teamMemberId: 2,
    status: 'Completed',
    remarks: 'Routine restocking order.',
    items: [
      { productId: 6, quantity: 300, rate: 520 },
      { productId: 10, quantity: 80, rate: 1350 }
    ]
  },
  {
    id: 3,
    poNumber: 'PO-2026-003',
    poDate: '2026-02-12',
    doctorId: 3,
    area: 'Islamabad F-10',
    teamMemberId: 3,
    status: 'Completed',
    remarks: '',
    items: [
      { productId: 7, quantity: 120, rate: 1100 },
      { productId: 2, quantity: 400, rate: 120 }
    ]
  },
  {
    id: 4,
    poNumber: 'PO-2026-004',
    poDate: '2026-02-28',
    doctorId: 4,
    area: 'Faisalabad Civil Lines',
    teamMemberId: 4,
    status: 'Pending',
    remarks: 'Payment terms pending approval.',
    items: [
      { productId: 8, quantity: 250, rate: 670 }
    ]
  },
  {
    id: 5,
    poNumber: 'PO-2026-005',
    poDate: '2026-03-15',
    doctorId: 5,
    area: 'Peshawar University Road',
    teamMemberId: 5,
    status: 'Completed',
    remarks: '',
    items: [
      { productId: 9, quantity: 150, rate: 850 },
      { productId: 5, quantity: 500, rate: 90 }
    ]
  },
  {
    id: 6,
    poNumber: 'PO-2026-006',
    poDate: '2026-03-29',
    doctorId: 6,
    area: 'Multan Cantt',
    teamMemberId: 1,
    status: 'Completed',
    remarks: 'First order from this hospital.',
    items: [
      { productId: 1, quantity: 100, rate: 450 },
      { productId: 4, quantity: 120, rate: 950 }
    ]
  },
  {
    id: 7,
    poNumber: 'PO-2026-007',
    poDate: '2026-04-05',
    doctorId: 7,
    area: 'Sialkot Saddar',
    teamMemberId: 2,
    status: 'Completed',
    remarks: '',
    items: [
      { productId: 2, quantity: 600, rate: 120 },
      { productId: 6, quantity: 200, rate: 520 }
    ]
  },
  {
    id: 8,
    poNumber: 'PO-2026-008',
    poDate: '2026-04-20',
    doctorId: 1,
    area: 'Lahore Gulberg',
    teamMemberId: 3,
    status: 'Pending',
    remarks: 'Awaiting stock clearance.',
    items: [
      { productId: 7, quantity: 180, rate: 1100 }
    ]
  },
  {
    id: 9,
    poNumber: 'PO-2026-009',
    poDate: '2026-05-11',
    doctorId: 2,
    area: 'Karachi Clifton',
    teamMemberId: 4,
    status: 'Completed',
    remarks: '',
    items: [
      { productId: 3, quantity: 250, rate: 380 },
      { productId: 10, quantity: 110, rate: 1350 }
    ]
  },
  {
    id: 10,
    poNumber: 'PO-2026-050',
    poDate: '2026-05-27',
    doctorId: 3,
    area: 'Islamabad F-10',
    teamMemberId: 5,
    status: 'Completed',
    remarks: '',
    items: [
      { productId: 5, quantity: 800, rate: 90 },
      { productId: 8, quantity: 150, rate: 670 }
    ]
  },
  {
    id: 11,
    poNumber: 'PO-2026-051',
    poDate: '2026-06-12',
    doctorId: 4,
    area: 'Faisalabad Civil Lines',
    teamMemberId: 1,
    status: 'Completed',
    remarks: 'Special discount applied.',
    items: [
      { productId: 6, quantity: 220, rate: 490 }
    ]
  },
  {
    id: 12,
    poNumber: 'PO-2026-052',
    poDate: '2026-06-25',
    doctorId: 5,
    area: 'Peshawar University Road',
    teamMemberId: 2,
    status: 'Completed',
    remarks: '',
    items: [
      { productId: 1, quantity: 300, rate: 450 },
      { productId: 7, quantity: 90, rate: 1100 }
    ]
  },
  {
    id: 13,
    poNumber: 'PO-2026-053',
    poDate: '2026-07-02',
    doctorId: 6,
    area: 'Multan Cantt',
    teamMemberId: 3,
    status: 'Pending',
    remarks: '',
    items: [
      { productId: 2, quantity: 350, rate: 120 }
    ]
  },
  {
    id: 14,
    poNumber: 'PO-2026-054',
    poDate: '2026-07-14',
    doctorId: 7,
    area: 'Sialkot Saddar',
    teamMemberId: 4,
    status: 'Completed',
    remarks: 'Direct delivery at clinic.',
    items: [
      { productId: 10, quantity: 150, rate: 1350 },
      { productId: 9, quantity: 80, rate: 850 }
    ]
  }
];

export const reportService = {
  getDashboardSummaryData: async (filters) => {
    if (window.api && window.api.reports) {
      const res = await window.api.reports.getDashboardSummaryData(filters);
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch dashboard summary');
    }
    // Fallback: mock summary metrics
    return {
      totalSales: 894000,
      totalOrders: 14,
      averageOrderValue: 63857.14,
      targetAchievementPercent: 78,
      targetQty: 130000,
      actualQty: 102000,
      targetValue: 80000000,
      actualValue: 62400000
    };
  },

  getSalesTrendData: async (filters) => {
    if (window.api && window.api.reports) {
      const res = await window.api.reports.getSalesTrendData(filters);
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch sales trend');
    }
    return [
      { month: 'Jan', orders: 2, sales: 157000 },
      { month: 'Feb', orders: 2, sales: 228000 },
      { month: 'Mar', orders: 2, sales: 172000 },
      { month: 'Apr', orders: 2, sales: 270000 },
      { month: 'May', orders: 2, sales: 295000 },
      { month: 'Jun', orders: 2, sales: 206000 },
      { month: 'Jul', orders: 2, sales: 149500 }
    ];
  },

  getTargetAchievementData: async (filters) => {
    if (window.api && window.api.reports) {
      const res = await window.api.reports.getTargetAchievementData(filters);
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch target achievements');
    }
    return [
      { teamMemberName: 'Ahmed Shah', productName: 'Amoxicillin 500mg', targetQty: 30000, targetValue: 13500000, actualQty: 25000, actualValue: 11250000, qtyAchievementPercent: 83, valueAchievementPercent: 83 },
      { teamMemberName: 'Zainab Fatima', productName: 'Amoxicillin 500mg', targetQty: 20000, targetValue: 9000000, actualQty: 18000, actualValue: 8100000, qtyAchievementPercent: 90, valueAchievementPercent: 90 },
      { teamMemberName: 'Usman Ali', productName: 'Metformin 850mg', targetQty: 80000, targetValue: 30400000, actualQty: 59000, actualValue: 22420000, qtyAchievementPercent: 74, valueAchievementPercent: 74 }
    ];
  },

  getTeamContributionData: async (filters) => {
    if (window.api && window.api.reports) {
      const res = await window.api.reports.getTeamContributionData(filters);
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch team contribution');
    }
    return [
      { teamMemberName: 'Ahmed Shah', role: 'Medical Representative', totalOrders: 3, completedOrders: 3, totalSalesValue: 231500, averageOrderValue: 77166.67 },
      { teamMemberName: 'Zainab Fatima', role: 'Territory Manager', totalOrders: 3, completedOrders: 3, totalSalesValue: 391000, averageOrderValue: 130333.33 },
      { teamMemberName: 'Usman Ali', role: 'Area Sales Manager', totalOrders: 3, completedOrders: 2, totalSalesValue: 271600, averageOrderValue: 90533.33 }
    ];
  },

  getProductPerformanceData: async (filters) => {
    if (window.api && window.api.reports) {
      const res = await window.api.reports.getProductPerformanceData(filters);
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch product performance');
    }
    return [
      { productName: 'Lipitor 10mg', totalQty: 180, totalSales: 171000 },
      { productName: 'Augmentin 625mg', totalQty: 390, totalSales: 429000 },
      { productName: 'Metformin 850mg', totalQty: 400, totalSales: 152000 }
    ];
  },

  getReportsData: async (filters) => {
    if (window.api && window.api.reports) {
      const res = await window.api.reports.getReportsData(filters);
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch reports data');
    }
    const saved = localStorage.getItem('himmel_reports_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse reports data', e);
      }
    }
    return INITIAL_REPORTS_DATA;
  },

  saveReportsDataList: async (reports) => {
    if (window.api && window.api.reports) {
      throw new Error('Save reports list not supported over IPC');
    }
    localStorage.setItem('himmel_reports_data', JSON.stringify(reports));
    return reports;
  }
};
