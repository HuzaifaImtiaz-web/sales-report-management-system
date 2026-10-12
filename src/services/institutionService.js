const mapToFrontend = (i) => {
  if (!i) return null;
  return {
    ...i,
    area: i.areaName
  };
};

export const institutionService = {
  getAllInstitutions: async () => {
    const res = await window.api.institutions.getAll();
    if (res.success) return res.data.map(mapToFrontend);
    throw new Error(res.error || 'Failed to fetch institutions');
  },

  getInstitutionById: async (id) => {
    const res = await window.api.institutions.getById(id);
    if (res.success) return mapToFrontend(res.data);
    throw new Error(res.error || 'Failed to fetch institution');
  },

  saveInstitution: async (institution) => {
    const res = await window.api.institutions.save(institution);
    if (res.success) return mapToFrontend(res.data);
    throw new Error(res.error || 'Failed to save institution');
  },

  deleteInstitution: async (id) => {
    const res = await window.api.institutions.delete(id);
    if (res.success) return institutionService.getAllInstitutions();
    throw new Error(res.error || 'Failed to delete institution');
  }
};
