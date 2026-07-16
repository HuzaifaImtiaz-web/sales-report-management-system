const INITIAL_TEAM = [
  {
    id: 1,
    code: 'EMP-0001',
    name: 'Ahmed Shah',
    designation: 'Medical Representative',
    area: 'Lahore Central',
    mobile: '03001234567',
    email: 'ahmed.shah@himmel.com',
    address: 'Flat 4, Street 10, Gulberg III, Lahore',
    joiningDate: '2024-01-15',
    notes: 'Handles major institutional accounts in Lahore Central. Top performer.',
    status: 'Active'
  },
  {
    id: 2,
    code: 'EMP-0002',
    name: 'Zainab Fatima',
    designation: 'Territory Manager',
    area: 'Karachi South',
    mobile: '03217654321',
    email: 'zainab.fatima@himmel.com',
    address: 'House 14B, Phase 5, DHA, Karachi',
    joiningDate: '2023-06-01',
    notes: 'Supervises all MRs in Karachi South. Experienced professional.',
    status: 'Active'
  },
  {
    id: 3,
    code: 'EMP-0003',
    name: 'Usman Ali',
    designation: 'Area Sales Manager',
    area: 'Islamabad F-10',
    mobile: '03339876543',
    email: 'usman.ali@himmel.com',
    address: 'Sector G-9/1, Islamabad',
    joiningDate: '2022-11-20',
    notes: 'Manages sales operations in the capital territory.',
    status: 'Active'
  },
  {
    id: 4,
    code: 'EMP-0004',
    name: 'Mariam Khan',
    designation: 'Medical Representative',
    area: 'Rawalpindi',
    mobile: '03124567890',
    email: 'mariam.khan@himmel.com',
    address: 'Saddar Road, Rawalpindi',
    joiningDate: '2024-03-10',
    notes: 'On medical leave. Previously handled Rawalpindi area.',
    status: 'Inactive'
  },
  {
    id: 5,
    code: 'EMP-0005',
    name: 'Bilal Siddiqui',
    designation: 'Medical Representative',
    area: 'Faisalabad',
    mobile: '03451122334',
    email: 'bilal.siddiqui@himmel.com',
    address: 'Peoples Colony No. 1, Faisalabad',
    joiningDate: '2024-02-01',
    notes: 'Responsible for private clinics in Faisalabad.',
    status: 'Active'
  },
  {
    id: 6,
    code: 'EMP-0006',
    name: 'Ayesha Malik',
    designation: 'Medical Representative',
    area: 'Multan',
    mobile: '03019876543',
    email: 'ayesha.malik@himmel.com',
    address: 'Boson Road, Multan',
    joiningDate: '2023-09-12',
    notes: 'Covers public hospital visits in Multan.',
    status: 'Active'
  },
  {
    id: 7,
    code: 'EMP-0007',
    name: 'Haris Rehman',
    designation: 'Territory Manager',
    area: 'Peshawar',
    mobile: '03115556677',
    email: 'haris.rehman@himmel.com',
    address: 'Hayatabad Phase 3, Peshawar',
    joiningDate: '2022-04-18',
    notes: 'Maintains relationships with distributors in KPK.',
    status: 'Inactive'
  }
];

const generateCode = (id) => `EMP-${String(id).padStart(4, '0')}`;

export const teamMemberService = {
  getAllTeamMembers: async () => {
    const saved = localStorage.getItem('team');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse team', e);
      }
    }
    return INITIAL_TEAM;
  },

  getTeamMemberById: async (id) => {
    const list = await teamMemberService.getAllTeamMembers();
    return list.find(t => t.id === Number(id)) || null;
  },

  saveTeamMembersList: async (team) => {
    localStorage.setItem('team', JSON.stringify(team));
    return team;
  },

  saveTeamMember: async (member) => {
    const list = await teamMemberService.getAllTeamMembers();
    let newList;
    if (member.id) {
      newList = list.map(t => t.id === member.id ? member : t);
    } else {
      const maxId = list.length > 0 ? Math.max(...list.map(t => t.id)) : 0;
      const newId = maxId + 1;
      const newMember = {
        ...member,
        id: newId,
        code: generateCode(newId)
      };
      newList = [newMember, ...list];
    }
    localStorage.setItem('team', JSON.stringify(newList));
    return newList;
  },

  deleteTeamMember: async (id) => {
    const list = await teamMemberService.getAllTeamMembers();
    const newList = list.filter(t => t.id !== Number(id));
    localStorage.setItem('team', JSON.stringify(newList));
    return newList;
  }
};
