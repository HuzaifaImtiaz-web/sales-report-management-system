const INITIAL_AREAS = [
  {
    id: 1,
    code: 'AREA-0001',
    name: 'Lahore Central',
    city: 'Lahore',
    region: 'Punjab',
    description: 'Main urban business district in Lahore. High customer density.',
    status: 'Active'
  },
  {
    id: 2,
    code: 'AREA-0002',
    name: 'Karachi South',
    city: 'Karachi',
    region: 'Sindh',
    description: 'Port and surrounding financial zone. Key market area.',
    status: 'Active'
  },
  {
    id: 3,
    code: 'AREA-0003',
    name: 'Islamabad F-10',
    city: 'Islamabad',
    region: 'Islamabad Capital Territory',
    description: 'Residential and commercial hub in F-10 and neighboring sectors.',
    status: 'Active'
  },
  {
    id: 4,
    code: 'AREA-0004',
    name: 'Rawalpindi Cantt',
    city: 'Rawalpindi',
    region: 'Punjab',
    description: 'Military cantonment and commercial markets in Rawalpindi.',
    status: 'Inactive'
  },
  {
    id: 5,
    code: 'AREA-0005',
    name: 'Faisalabad City',
    city: 'Faisalabad',
    region: 'Punjab',
    description: 'Industrial textile hub territory covering central markets.',
    status: 'Active'
  },
  {
    id: 6,
    code: 'AREA-0006',
    name: 'Multan Cantonment',
    city: 'Multan',
    region: 'Punjab',
    description: 'Southern Punjab zone servicing major public hospitals.',
    status: 'Active'
  },
  {
    id: 7,
    code: 'AREA-0007',
    name: 'Peshawar University',
    city: 'Peshawar',
    region: 'KPK',
    description: 'Educational and healthcare sector surrounding Peshawar University.',
    status: 'Inactive'
  }
];

const generateCode = (id) => `AREA-${String(id).padStart(4, '0')}`;

export const areaService = {
  getAllAreas: async () => {
    if (window.api && window.api.areas) {
      const res = await window.api.areas.getAll();
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch areas');
    }
    const saved = localStorage.getItem('areas');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse areas', e);
      }
    }
    return INITIAL_AREAS;
  },

  getAreaById: async (id) => {
    if (window.api && window.api.areas) {
      const res = await window.api.areas.getById(id);
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch area');
    }
    const list = await areaService.getAllAreas();
    return list.find(a => a.id === Number(id)) || null;
  },

  saveAreasList: async (areas) => {
    if (window.api && window.api.areas) {
      throw new Error('Bulk list save not supported over IPC; use individual saves.');
    }
    localStorage.setItem('areas', JSON.stringify(areas));
    return areas;
  },

  saveArea: async (area) => {
    if (window.api && window.api.areas) {
      const res = await window.api.areas.save(area);
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to save area');
    }
    const list = await areaService.getAllAreas();
    let newList;
    if (area.id) {
      newList = list.map(a => a.id === area.id ? area : a);
    } else {
      const maxId = list.length > 0 ? Math.max(...list.map(a => a.id)) : 0;
      const newId = maxId + 1;
      const newArea = {
        ...area,
        id: newId,
        code: generateCode(newId)
      };
      newList = [newArea, ...list];
    }
    localStorage.setItem('areas', JSON.stringify(newList));
    return newList;
  },

  deleteArea: async (id) => {
    if (window.api && window.api.areas) {
      const res = await window.api.areas.delete(id);
      if (res.success) {
        return areaService.getAllAreas();
      }
      throw new Error(res.error || 'Failed to delete area');
    }
    const list = await areaService.getAllAreas();
    const newList = list.filter(a => a.id !== Number(id));
    localStorage.setItem('areas', JSON.stringify(newList));
    return newList;
  }
};
