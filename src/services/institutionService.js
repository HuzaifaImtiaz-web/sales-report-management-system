const INITIAL_INSTITUTIONS = [
  {
    id: 1,
    code: 'INST-0001',
    name: 'Mayo Hospital',
    area: 'Lahore Central',
    city: 'Lahore',
    address: 'Nila Gumbad Chowk, Lahore, Punjab',
    contactPerson: 'Dr. Tariq Mahmood',
    contactNumber: '+92 300 1234567',
    notes: 'Largest tertiary care public sector hospital.',
    status: 'Active'
  },
  {
    id: 2,
    code: 'INST-0002',
    name: 'Jinnah Hospital',
    area: 'Karachi South',
    city: 'Karachi',
    address: 'Rafiqui Shaheed Road, Karachi, Sindh',
    contactPerson: 'Dr. Hamid Raza',
    contactNumber: '+92 321 9876543',
    notes: 'Major teaching hospital. High volume orders.',
    status: 'Active'
  },
  {
    id: 3,
    code: 'INST-0003',
    name: 'Shifa International',
    area: 'Islamabad F-10',
    city: 'Islamabad',
    address: 'H-8/4, Islamabad, Capital Territory',
    contactPerson: 'Dr. Nadia Siddiqui',
    contactNumber: '+92 333 5556667',
    notes: 'Premium private healthcare institution.',
    status: 'Active'
  },
  {
    id: 4,
    code: 'INST-0004',
    name: 'Holy Family Hospital',
    area: 'Rawalpindi Cantt',
    city: 'Rawalpindi',
    address: 'Asghar Mall Road, Rawalpindi, Punjab',
    contactPerson: 'Dr. Farhan Latif',
    contactNumber: '+92 345 4443322',
    notes: 'High demand for cardiac medicines.',
    status: 'Active'
  },
  {
    id: 5,
    code: 'INST-0005',
    name: 'FIC Faisalabad',
    area: 'Faisalabad City',
    city: 'Faisalabad',
    address: 'Sargodha Road, Faisalabad, Punjab',
    contactPerson: 'Dr. Saima Riaz',
    contactNumber: '+92 312 8889900',
    notes: 'Specialist institute for cardiac care.',
    status: 'Active'
  },
  {
    id: 6,
    code: 'INST-0006',
    name: 'Nishtar Hospital',
    area: 'Multan Cantonment',
    city: 'Multan',
    address: 'Nishtar Road, Multan, Punjab',
    contactPerson: 'Dr. Tariq Mehmood',
    contactNumber: '+92 301 7776655',
    notes: 'Main tertiary care center for South Punjab.',
    status: 'Inactive'
  }
];

const generateCode = (id) => `INST-${String(id).padStart(4, '0')}`;

const mapToFrontend = (i) => {
  if (!i) return null;
  return {
    ...i,
    area: i.areaName
  };
};

export const institutionService = {
  getAllInstitutions: async () => {
    if (window.api && window.api.institutions) {
      const res = await window.api.institutions.getAll();
      if (res.success) return res.data.map(mapToFrontend);
      throw new Error(res.error || 'Failed to fetch institutions');
    }
    const saved = localStorage.getItem('institutions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse institutions', e);
      }
    }
    return INITIAL_INSTITUTIONS;
  },

  getInstitutionById: async (id) => {
    if (window.api && window.api.institutions) {
      const res = await window.api.institutions.getById(id);
      if (res.success) return mapToFrontend(res.data);
      throw new Error(res.error || 'Failed to fetch institution');
    }
    const list = await institutionService.getAllInstitutions();
    return list.find(i => i.id === Number(id)) || null;
  },

  saveInstitutionsList: async (institutions) => {
    if (window.api && window.api.institutions) {
      throw new Error('Bulk list save not supported over IPC; use individual saves.');
    }
    localStorage.setItem('institutions', JSON.stringify(institutions));
    return institutions;
  },

  saveInstitution: async (institution) => {
    if (window.api && window.api.institutions) {
      const res = await window.api.institutions.save(institution);
      if (res.success) return mapToFrontend(res.data);
      throw new Error(res.error || 'Failed to save institution');
    }
    const list = await institutionService.getAllInstitutions();
    let newList;
    if (institution.id) {
      newList = list.map(i => i.id === institution.id ? institution : i);
    } else {
      const maxId = list.length > 0 ? Math.max(...list.map(i => i.id)) : 0;
      const newId = maxId + 1;
      const newInst = {
        ...institution,
        id: newId,
        code: generateCode(newId)
      };
      newList = [newInst, ...list];
    }
    localStorage.setItem('institutions', JSON.stringify(newList));
    return newList;
  },

  deleteInstitution: async (id) => {
    if (window.api && window.api.institutions) {
      const res = await window.api.institutions.delete(id);
      if (res.success) {
        return institutionService.getAllInstitutions();
      }
      throw new Error(res.error || 'Failed to delete institution');
    }
    const list = await institutionService.getAllInstitutions();
    const newList = list.filter(i => i.id !== Number(id));
    localStorage.setItem('institutions', JSON.stringify(newList));
    return newList;
  }
};
