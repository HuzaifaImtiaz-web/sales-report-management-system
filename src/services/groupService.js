export const groupService = {
  getAllDivisions: async () => {
    const res = await window.api.divisions.getAll();
    if (res.success) return res.data;
    throw new Error(res.error || 'Failed to fetch divisions');
  },

  getAllGroups: async () => {
    const res = await window.api.categories.getAll();
    if (res.success) return res.data;
    throw new Error(res.error || 'Failed to fetch categories');
  },

  getGroupById: async (id) => {
    const res = await window.api.categories.getById(id);
    if (res.success) return res.data;
    throw new Error(res.error || 'Failed to fetch category');
  },

  saveGroup: async (group) => {
    const res = await window.api.categories.save(group);
    if (res.success) return res.data;
    throw new Error(res.error || 'Failed to save category');
  },

  deleteGroup: async (id) => {
    const res = await window.api.categories.delete(id);
    if (res.success) return groupService.getAllGroups();
    throw new Error(res.error || 'Failed to delete category');
  }
};
