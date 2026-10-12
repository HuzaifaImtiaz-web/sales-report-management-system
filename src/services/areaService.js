export const areaService = {
  getAllAreas: async () => {
    const res = await window.api.areas.getAll();
    if (res.success) return res.data;
    throw new Error(res.error || 'Failed to fetch areas');
  },

  getAreaById: async (id) => {
    const res = await window.api.areas.getById(id);
    if (res.success) return res.data;
    throw new Error(res.error || 'Failed to fetch area');
  },

  saveArea: async (area) => {
    const res = await window.api.areas.save(area);
    if (res.success) return res.data;
    throw new Error(res.error || 'Failed to save area');
  },

  deleteArea: async (id) => {
    const res = await window.api.areas.delete(id);
    if (res.success) return areaService.getAllAreas();
    throw new Error(res.error || 'Failed to delete area');
  }
};
