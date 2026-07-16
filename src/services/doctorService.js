const INITIAL_DOCTORS = [
  {
    id: 1,
    code: 'DOC-0001',
    name: 'Dr. Ayesha Khan',
    specialty: 'Cardiologist',
    hospital: 'Mayo Hospital',
    area: 'Lahore Central',
    city: 'Lahore',
    mobile: '03001234567',
    email: 'ayesha.khan@gmail.com',
    address: 'Room 12, Cardiology Ward, Mayo Hospital, Lahore',
    notes: 'Preferred meeting time: Tuesday morning. High prescription volume.',
    status: 'Active'
  },
  {
    id: 2,
    code: 'DOC-0002',
    name: 'Dr. Hamid Raza',
    specialty: 'General Physician',
    hospital: 'Jinnah Hospital',
    area: 'Karachi South',
    city: 'Karachi',
    mobile: '03217654321',
    email: 'hamid.raza@yahoo.com',
    address: 'Clinic Annex, Near Main Gate, Jinnah Hospital, Karachi',
    notes: 'Likes product brochures printed. Discuss cardiometabolic drugs.',
    status: 'Active'
  },
  {
    id: 3,
    code: 'DOC-0003',
    name: 'Dr. Nadia Siddiqui',
    specialty: 'Pediatrician',
    hospital: 'Shifa International',
    area: 'Islamabad F-10',
    city: 'Islamabad',
    mobile: '03339876543',
    email: 'nadia.siddiqui@shifa.com',
    address: 'Consultant Clinic 4, Shifa International Hospital, Islamabad',
    notes: 'Very strict schedule. Keep detailings under 5 minutes.',
    status: 'Active'
  },
  {
    id: 4,
    code: 'DOC-0004',
    name: 'Dr. Farhan Latif',
    specialty: 'Orthopedic',
    hospital: 'Holy Family Hospital',
    area: 'Rawalpindi',
    city: 'Rawalpindi',
    mobile: '03124567890',
    email: 'farhan.latif@hotmail.com',
    address: 'Department of Orthopedics, Holy Family Hospital, Rawalpindi',
    notes: 'Focus on joint pain and calcium supplement products.',
    status: 'Inactive'
  },
  {
    id: 5,
    code: 'DOC-0005',
    name: 'Dr. Saima Riaz',
    specialty: 'Gynecologist',
    hospital: 'Faisalabad Institute of Cardiology',
    area: 'Faisalabad',
    city: 'Faisalabad',
    mobile: '03451122334',
    email: 'saima.riaz@gmail.com',
    address: 'Consultancy Plaza, Block C, Faisalabad',
    notes: 'Often busy in operations. Contact assistant prior to visit.',
    status: 'Active'
  },
  {
    id: 6,
    code: 'DOC-0006',
    name: 'Dr. Tariq Mehmood',
    specialty: 'Dermatologist',
    hospital: 'Nishtar Hospital',
    area: 'Multan',
    city: 'Multan',
    mobile: '03229988776',
    email: 'tariq.mehmood@nishtar.edu.pk',
    address: 'Skin Clinic, Nishtar Road, Multan',
    notes: 'Interested in anti-allergic range and topical creams.',
    status: 'Active'
  },
  {
    id: 7,
    code: 'DOC-0007',
    name: 'Dr. Bilal Aslam',
    specialty: 'Neurologist',
    hospital: 'Lady Reading Hospital',
    area: 'Peshawar',
    city: 'Peshawar',
    mobile: '03015554433',
    email: 'bilal.aslam@lrh.gov.pk',
    address: 'Neurology Department, Lady Reading Hospital, Peshawar',
    notes: 'Interested in neuroprotective formulas.',
    status: 'Inactive'
  }
];

const generateCode = (id) => `DOC-${String(id).padStart(4, '0')}`;

export const doctorService = {
  getAllDoctors: async () => {
    const saved = localStorage.getItem('doctors');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse doctors', e);
      }
    }
    return INITIAL_DOCTORS;
  },

  getDoctorById: async (id) => {
    const list = await doctorService.getAllDoctors();
    return list.find(d => d.id === Number(id)) || null;
  },

  saveDoctorsList: async (doctors) => {
    localStorage.setItem('doctors', JSON.stringify(doctors));
    return doctors;
  },

  saveDoctor: async (doctor) => {
    const list = await doctorService.getAllDoctors();
    let newList;
    if (doctor.id) {
      newList = list.map(d => d.id === doctor.id ? doctor : d);
    } else {
      const maxId = list.length > 0 ? Math.max(...list.map(d => d.id)) : 0;
      const newId = maxId + 1;
      const newDoctor = {
        ...doctor,
        id: newId,
        code: generateCode(newId)
      };
      newList = [newDoctor, ...list];
    }
    localStorage.setItem('doctors', JSON.stringify(newList));
    return newList;
  },

  deleteDoctor: async (id) => {
    const list = await doctorService.getAllDoctors();
    const newList = list.filter(d => d.id !== Number(id));
    localStorage.setItem('doctors', JSON.stringify(newList));
    return newList;
  }
};
