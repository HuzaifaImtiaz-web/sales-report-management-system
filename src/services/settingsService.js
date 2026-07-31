import logoImg from '../assets/logos/Himmel-Logo.png';

const getVal = async (key, fallback) => {
  if (window.api && window.api.settings) {
    const res = await window.api.settings.getByKey(key);
    if (res.success && res.data) {
      try {
        return JSON.parse(res.data.value);
      } catch (e) {
        return res.data.value;
      }
    }
  }
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return saved;
    }
  }
  return fallback;
};

const setVal = async (key, value, group = 'General') => {
  if (window.api && window.api.settings) {
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);
    const res = await window.api.settings.save(key, strVal, group);
    if (res.success) {
      window.dispatchEvent(new CustomEvent('himmel-db-change'));
      return value;
    }
    throw new Error(res.error || `Failed to save setting ${key}`);
  }
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('himmel-db-change'));
  return value;
};

export const settingsService = {
  getCompanyInfo: async () => {
    const company = await getVal('himmel_company_info', {
      name: 'Himmel Pharmaceutical',
      logo: logoImg,
      email: 'info@himmelpharma.com',
      phone: '+92 (21) 111-HIMMEL',
      address: 'Plot 42, Sector 23, Korangi Industrial Area, Karachi, Pakistan'
    });
    if (company && typeof company === 'object' && (!company.logo || company.logo.includes('unsplash'))) {
      company.logo = logoImg;
    }
    return company;
  },

  saveCompanyInfo: async (info) => {
    return setVal('himmel_company_info', info, 'Company');
  },

  getBusinessYear: async () => {
    return getVal('himmel_current_business_year', {
      value: '2025-2026',
      startDate: '2025-07-01',
      endDate: '2026-06-30'
    });
  },

  saveBusinessYear: async (year) => {
    return setVal('himmel_current_business_year', year, 'BusinessYear');
  },

  getExistingYears: async () => {
    return getVal('businessYears', [
      { value: '2025-2026', label: '1 July 2025 – 30 June 2026' },
      { value: '2024-2025', label: '1 July 2024 – 30 June 2025' },
      { value: '2023-2024', label: '1 July 2023 – 30 June 2024' }
    ]);
  },

  saveExistingYears: async (years) => {
    return setVal('businessYears', years, 'BusinessYear');
  },

  getExportPreferences: async () => {
    return getVal('himmel_export_preferences', {
      defaultFormat: 'excel',
      includeLogo: true,
      includeSummary: true,
      includeCharts: true
    });
  },

  saveExportPreferences: async (prefs) => {
    return setVal('himmel_export_preferences', prefs, 'Preferences');
  },

  getAccountInfo: async () => {
    return getVal('himmel_account_info', {
      username: 'admin_himmel',
      email: 'admin@himmelpharma.com',
      fullName: 'System Administrator'
    });
  },

  saveAccountInfo: async (info) => {
    return setVal('himmel_account_info', info, 'Account');
  },

  changePassword: async (currentPassword, newPassword) => {
    // Mock changing password
    return true;
  }
};
