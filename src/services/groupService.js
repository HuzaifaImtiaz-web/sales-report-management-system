const INITIAL_GROUPS = [
  {
    id: 1,
    code: 'GRP-0001',
    name: 'Cardiovascular',
    description: 'Cardiovascular medications, statins, and blood pressure regulators.',
    totalProducts: 12,
    status: 'Active'
  },
  {
    id: 2,
    code: 'GRP-0002',
    name: 'Antibiotics',
    description: 'Broad-spectrum and narrow-spectrum antibacterial treatments.',
    totalProducts: 8,
    status: 'Active'
  },
  {
    id: 3,
    code: 'GRP-0003',
    name: 'Analgesics',
    description: 'Pain relief, NSAIDs, and anti-inflammatory medications.',
    totalProducts: 15,
    status: 'Active'
  },
  {
    id: 4,
    code: 'GRP-0004',
    name: 'Antidiabetics',
    description: 'Oral hypoglycemics, insulin sensitizers, and diabetes control agents.',
    totalProducts: 6,
    status: 'Active'
  },
  {
    id: 5,
    code: 'GRP-0005',
    name: 'Respiratory',
    description: 'Inhalers, bronchodilators, and chronic asthma control drugs.',
    totalProducts: 5,
    status: 'Inactive'
  },
  {
    id: 6,
    code: 'GRP-0006',
    name: 'Vitamins & Supplements',
    description: 'Multivitamins, mineral complexes, and general wellness supplements.',
    totalProducts: 20,
    status: 'Active'
  },
  {
    id: 7,
    code: 'GRP-0007',
    name: 'Gastrointestinal',
    description: 'Proton pump inhibitors, antacids, antiemetics, and digestive enzymes.',
    totalProducts: 9,
    status: 'Active'
  }
];

const generateCode = (id) => `GRP-${String(id).padStart(4, '0')}`;

export const groupService = {
  getAllGroups: async () => {
    const saved = localStorage.getItem('groups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse groups', e);
      }
    }
    return INITIAL_GROUPS;
  },

  getGroupById: async (id) => {
    const list = await groupService.getAllGroups();
    return list.find(g => g.id === Number(id)) || null;
  },

  saveGroupsList: async (groups) => {
    localStorage.setItem('groups', JSON.stringify(groups));
    return groups;
  },

  saveGroup: async (group) => {
    const list = await groupService.getAllGroups();
    let newList;
    if (group.id) {
      newList = list.map(g => g.id === group.id ? group : g);
    } else {
      const maxId = list.length > 0 ? Math.max(...list.map(g => g.id)) : 0;
      const newId = maxId + 1;
      const newGroup = {
        ...group,
        id: newId,
        code: generateCode(newId),
        totalProducts: group.totalProducts || 0
      };
      newList = [newGroup, ...list];
    }
    localStorage.setItem('groups', JSON.stringify(newList));
    return newList;
  },

  deleteGroup: async (id) => {
    const list = await groupService.getAllGroups();
    const newList = list.filter(g => g.id !== Number(id));
    localStorage.setItem('groups', JSON.stringify(newList));
    return newList;
  }
};
