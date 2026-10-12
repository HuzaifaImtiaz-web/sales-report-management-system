const mapToFrontend = (tm) => {
  if (!tm) return null;
  return {
    ...tm,
    designation: tm.role,
    mobile: tm.phone,
    area: tm.areaName
  };
};

export const teamMemberService = {
  getAllTeamMembers: async () => {
    const res = await window.api.teamMembers.getAll();
    if (res.success) return res.data.map(mapToFrontend);
    throw new Error(res.error || 'Failed to fetch team members');
  },

  getTeamMemberById: async (id) => {
    const res = await window.api.teamMembers.getById(id);
    if (res.success) return mapToFrontend(res.data);
    throw new Error(res.error || 'Failed to fetch team member');
  },

  saveTeamMember: async (member) => {
    const payload = {
      ...member,
      role: member.role || member.designation,
      phone: member.phone || member.mobile
    };
    const res = await window.api.teamMembers.save(payload);
    if (res.success) return mapToFrontend(res.data);
    throw new Error(res.error || 'Failed to save team member');
  },

  deleteTeamMember: async (id) => {
    const res = await window.api.teamMembers.delete(id);
    if (res.success) return teamMemberService.getAllTeamMembers();
    throw new Error(res.error || 'Failed to delete team member');
  }
};
