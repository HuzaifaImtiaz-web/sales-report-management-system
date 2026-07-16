const INITIAL_TARGETS = [
  {
    id: 1,
    businessYear: '2025-2026',
    productId: 1,
    annualTarget: 50000,
    areasDistribution: [
      {
        areaName: 'Lahore Central',
        percentage: 60,
        teamMembers: [
          { name: 'Ahmed Shah', percentage: 100 }
        ]
      },
      {
        areaName: 'Karachi South',
        percentage: 40,
        teamMembers: [
          { name: 'Zainab Fatima', percentage: 100 }
        ]
      }
    ],
    notes: 'Primary antibiotic focus for Q3 campaign.'
  },
  {
    id: 2,
    businessYear: '2025-2026',
    productId: 3,
    annualTarget: 80000,
    areasDistribution: [
      {
        areaName: 'Islamabad F-10',
        percentage: 100,
        teamMembers: [
          { name: 'Usman Ali', percentage: 100 }
        ]
      }
    ],
    notes: 'Annual contract target fulfilled.'
  }
];

const INITIAL_BUSINESS_YEARS = [
  { value: '2025-2026', label: '1 July 2025 – 30 June 2026' },
  { value: '2024-2025', label: '1 July 2024 – 30 June 2025' },
  { value: '2023-2024', label: '1 July 2023 – 30 June 2024' }
];

export const targetService = {
  getAllTargets: async () => {
    const saved = localStorage.getItem('himmel_targets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse targets', e);
      }
    }
    return INITIAL_TARGETS;
  },

  getTargetById: async (id) => {
    const list = await targetService.getAllTargets();
    return list.find(t => t.id === Number(id)) || null;
  },

  saveTargetsList: async (targets) => {
    localStorage.setItem('himmel_targets', JSON.stringify(targets));
    return targets;
  },

  saveTarget: async (target) => {
    const list = await targetService.getAllTargets();
    let newList;
    if (target.id) {
      newList = list.map(t => t.id === target.id ? target : t);
    } else {
      const maxId = list.length > 0 ? Math.max(...list.map(t => t.id)) : 0;
      const newTarget = {
        ...target,
        id: maxId + 1
      };
      newList = [newTarget, ...list];
    }
    localStorage.setItem('himmel_targets', JSON.stringify(newList));
    return newList;
  },

  deleteTarget: async (id) => {
    const list = await targetService.getAllTargets();
    const newList = list.filter(t => t.id !== Number(id));
    localStorage.setItem('himmel_targets', JSON.stringify(newList));
    return newList;
  },

  getBusinessYears: async () => {
    const saved = localStorage.getItem('businessYears');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse business years', e);
      }
    }
    return INITIAL_BUSINESS_YEARS;
  },

  saveBusinessYears: async (years) => {
    localStorage.setItem('businessYears', JSON.stringify(years));
    return years;
  }
};
