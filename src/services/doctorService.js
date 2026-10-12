const mapToFrontend = (d) => {
  if (!d) return null;
  return {
    ...d,
    mobile: d.phone,
    area: d.areaName
  };
};

export const doctorService = {
  getAllDoctors: async () => {
    const res = await window.api.doctors.getAll();
    if (res.success) return res.data.map(mapToFrontend);
    throw new Error(res.error || 'Failed to fetch doctors');
  },

  getDoctorById: async (id) => {
    const res = await window.api.doctors.getById(id);
    if (res.success) return mapToFrontend(res.data);
    throw new Error(res.error || 'Failed to fetch doctor');
  },

  saveDoctor: async (doctor) => {
    const payload = {
      ...doctor,
      phone: doctor.phone || doctor.mobile
    };
    const res = await window.api.doctors.save(payload);
    if (res.success) return mapToFrontend(res.data);
    throw new Error(res.error || 'Failed to save doctor');
  },

  deleteDoctor: async (id) => {
    const res = await window.api.doctors.delete(id);
    if (res.success) return doctorService.getAllDoctors();
    throw new Error(res.error || 'Failed to delete doctor');
  }
};
