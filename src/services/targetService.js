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

const mapToFrontend = (t) => {
  if (!t) return null;
  return {
    ...t,
    businessYear: t.yearName,
    annualTarget: t.annualTargetQty
  };
};

export const targetService = {
  getAllTargets: async () => {
    if (window.api && window.api.targets) {
      const res = await window.api.targets.getAll();
      if (res.success) return res.data.map(mapToFrontend);
      throw new Error(res.error || 'Failed to fetch targets');
    }
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
    if (window.api && window.api.targets) {
      const res = await window.api.targets.getById(id);
      if (res.success) return mapToFrontend(res.data);
      throw new Error(res.error || 'Failed to fetch target');
    }
    const list = await targetService.getAllTargets();
    return list.find(t => t.id === Number(id)) || null;
  },

  saveTargetsList: async (targets) => {
    if (window.api && window.api.targets) {
      throw new Error('Bulk list save not supported over IPC; use individual saves.');
    }
    localStorage.setItem('himmel_targets', JSON.stringify(targets));
    return targets;
  },

  saveTarget: async (target) => {
    if (window.api && window.api.targets) {
      // Resolve businessYearId if missing
      let businessYearId = target.businessYearId;
      if (!businessYearId && target.businessYear) {
        const yearsRes = await window.api.targets.getActiveBusinessYears();
        if (yearsRes.success) {
          const match = yearsRes.data.find(y => y.value === target.businessYear);
          if (match) businessYearId = match.id;
        }
      }
      
      const payload = {
        ...target,
        businessYearId: businessYearId || 1, // Fallback to first if not resolved
        annualTargetQty: Number(target.annualTarget)
      };

      const res = await window.api.targets.save(payload);
      if (res.success) {
        window.dispatchEvent(new CustomEvent('himmel-db-change'));
        return mapToFrontend(res.data);
      }
      throw new Error(res.error || 'Failed to save target');
    }
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
    window.dispatchEvent(new CustomEvent('himmel-db-change'));
    return newList;
  },

  deleteTarget: async (id) => {
    if (window.api && window.api.targets) {
      const res = await window.api.targets.delete(id);
      if (res.success) {
        window.dispatchEvent(new CustomEvent('himmel-db-change'));
        return targetService.getAllTargets();
      }
      throw new Error(res.error || 'Failed to delete target');
    }
    const list = await targetService.getAllTargets();
    const newList = list.filter(t => t.id !== Number(id));
    localStorage.setItem('himmel_targets', JSON.stringify(newList));
    window.dispatchEvent(new CustomEvent('himmel-db-change'));
    return newList;
  },

  getBusinessYears: async () => {
    if (window.api && window.api.targets) {
      const res = await window.api.targets.getActiveBusinessYears();
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch business years');
    }
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
    if (window.api && window.api.targets) {
      throw new Error('Save business years not supported over IPC');
    }
    localStorage.setItem('businessYears', JSON.stringify(years));
    return years;
  }
};
