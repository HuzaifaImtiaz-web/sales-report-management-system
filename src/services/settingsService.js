import logoImg from '../assets/logos/Himmel-Logo.png';

const getVal = async (key, fallback) => {
  const res = await window.api.settings.getByKey(key);
  if (res.success && res.data) {
    try {
      return JSON.parse(res.data.value);
    } catch (e) {
      return res.data.value;
    }
  }
  return fallback;
};

const setVal = async (key, value, group = 'General') => {
  const strVal = typeof value === 'string' ? value : JSON.stringify(value);
  const res = await window.api.settings.save(key, strVal, group);
  if (res.success) {
    window.dispatchEvent(new CustomEvent('himmel-db-change'));
    return value;
  }
  throw new Error(res.error || `Failed to save setting ${key}`);
};

// Only images may be used as the company logo (shown with <img>, and allowed by the
// Content-Security-Policy as data: URLs).
const isSafeLogo = (logo) => typeof logo === 'string' && /^(data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,|\/|\.\/|assets\/|blob:)/i.test(logo);

export const settingsService = {
  getCompanyInfo: async () => {
    const company = await getVal('himmel_company_info', {
      name: 'Himmel Pharmaceutical',
      logo: logoImg,
      email: 'info@himmelpharma.com',
      phone: '+92 (21) 111-HIMMEL',
      address: 'Plot 42, Sector 23, Korangi Industrial Area, Karachi, Pakistan'
    });
    if (company && typeof company === 'object' && !isSafeLogo(company.logo)) {
      company.logo = logoImg;
    }
    return company;
  },

  saveCompanyInfo: async (info) => {
    if (info && info.logo && !isSafeLogo(info.logo)) {
      throw new Error('The logo must be an image file (PNG, JPG, GIF, WebP or SVG).');
    }
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
      username: '',
      email: '',
      fullName: ''
    });
  },

  saveAccountInfo: async (info) => {
    return setVal('himmel_account_info', info, 'Account');
  }
};
