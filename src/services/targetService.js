const mapToFrontend = (t) => {
  if (!t) return null;
  return {
    ...t,
    businessYear: t.yearName,
    annualTarget: t.annualTargetQty
  };
};

export const targetService = {
  getAllTargets: async () => {
    const res = await window.api.targets.getAll();
    if (res.success) return res.data.map(mapToFrontend);
    throw new Error(res.error || 'Failed to fetch targets');
  },

  getTargetById: async (id) => {
    const res = await window.api.targets.getById(id);
    if (res.success) return mapToFrontend(res.data);
    throw new Error(res.error || 'Failed to fetch target');
  },

  saveTarget: async (target) => {
    // Resolve businessYearId from the year label when the form only has the label.
    let businessYearId = target.businessYearId;
    if (!businessYearId && target.businessYear) {
      const yearsRes = await window.api.targets.getActiveBusinessYears();
      if (yearsRes.success) {
        const match = yearsRes.data.find((y) => y.value === target.businessYear);
        if (match) businessYearId = match.id;
      }
    }
    if (!businessYearId) {
      // Saving under some other year by default would put the target in the wrong year's figures.
      throw new Error('Choose a business year for this target.');
    }

    const payload = {
      ...target,
      businessYearId,
      annualTargetQty: Number(target.annualTarget)
    };

    const res = await window.api.targets.save(payload);
    if (res.success) {
      window.dispatchEvent(new CustomEvent('himmel-db-change'));
      return mapToFrontend(res.data);
    }
    throw new Error(res.error || 'Failed to save target');
  },

  deleteTarget: async (id) => {
    const res = await window.api.targets.delete(id);
    if (res.success) {
      window.dispatchEvent(new CustomEvent('himmel-db-change'));
      return targetService.getAllTargets();
    }
    throw new Error(res.error || 'Failed to delete target');
  },

  getBusinessYears: async () => {
    const res = await window.api.targets.getActiveBusinessYears();
    if (res.success) return res.data;
    throw new Error(res.error || 'Failed to fetch business years');
  },

  // Creates the year in the database (1 July – 30 June); targets copied from the year before or set to 0.
  createBusinessYear: async (yearName, copyPreviousTargets) => {
    const res = await window.api.targets.createBusinessYear({ yearName, copyPreviousTargets: Boolean(copyPreviousTargets) });
    if (!res.success) throw new Error(res.error || 'Failed to create the business year');
    window.dispatchEvent(new CustomEvent('himmel-db-change'));
    return res.data;
  }
};
