export const settingsService = {
  getCompanyInfo: async () => {
    const saved = localStorage.getItem('himmel_company_info');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      name: 'Himmel Pharmaceutical',
      logo: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=150&auto=format&fit=crop&q=60',
      email: 'info@himmelpharma.com',
      phone: '+92 (21) 111-HIMMEL',
      address: 'Plot 42, Sector 23, Korangi Industrial Area, Karachi, Pakistan'
    };
  },

  saveCompanyInfo: async (info) => {
    localStorage.setItem('himmel_company_info', JSON.stringify(info));
    return info;
  },

  getBusinessYear: async () => {
    const saved = localStorage.getItem('himmel_current_business_year');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      value: '2025-2026',
      startDate: '2025-07-01',
      endDate: '2026-06-30'
    };
  },

  saveBusinessYear: async (year) => {
    localStorage.setItem('himmel_current_business_year', JSON.stringify(year));
    return year;
  },

  getExistingYears: async () => {
    const saved = localStorage.getItem('businessYears');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { value: '2025-2026', label: '1 July 2025 – 30 June 2026' },
      { value: '2024-2025', label: '1 July 2024 – 30 June 2025' },
      { value: '2023-2024', label: '1 July 2023 – 30 June 2024' }
    ];
  },

  saveExistingYears: async (years) => {
    localStorage.setItem('businessYears', JSON.stringify(years));
    return years;
  },

  getExportPreferences: async () => {
    const saved = localStorage.getItem('himmel_export_preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      defaultFormat: 'excel',
      includeLogo: true,
      includeSummary: true,
      includeCharts: true
    };
  },

  saveExportPreferences: async (prefs) => {
    localStorage.setItem('himmel_export_preferences', JSON.stringify(prefs));
    return prefs;
  },

  getAccountInfo: async () => {
    const saved = localStorage.getItem('himmel_account_info');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      username: 'admin_himmel',
      email: 'admin@himmelpharma.com',
      fullName: 'System Administrator'
    };
  },

  saveAccountInfo: async (info) => {
    localStorage.setItem('himmel_account_info', JSON.stringify(info));
    return info;
  },

  changePassword: async (currentPassword, newPassword) => {
    // Mock changing password
    return true;
  }
};
