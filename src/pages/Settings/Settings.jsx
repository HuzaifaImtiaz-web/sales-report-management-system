import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Toast from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { CreateBusinessYearModal } from '../ProductTargets/ProductTargets';
import {
  FiBriefcase, FiImage, FiMail, FiPhone, FiMapPin,
  FiCalendar, FiSun, FiMoon, FiMonitor, FiSettings,
  FiFileText, FiUser, FiLock, FiDatabase, FiUploadCloud,
  FiDownloadCloud, FiInfo, FiCheck, FiX, FiEdit, FiLoader
} from 'react-icons/fi';

const Settings = () => {
  const navigate = useNavigate();
  const { mode, setThemeMode } = useTheme();
  const { user } = useAuth();

  // Page States
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal States
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Form States
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Himmel Pharmaceuticals',
    logo: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=150&auto=format&fit=crop&q=60',
    email: 'info@himmelpharma.com',
    phone: '+92 (21) 111-HIMMEL',
    address: 'Plot 42, Sector 23, Korangi Industrial Area, Karachi, Pakistan'
  });

  const [businessYear, setBusinessYear] = useState({
    value: '2025-2026',
    startDate: '2025-07-01',
    endDate: '2026-06-30'
  });

  const [existingYears, setExistingYears] = useState([
    { value: '2025-2026', label: '1 July 2025 – 30 June 2026' },
    { value: '2024-2025', label: '1 July 2024 – 30 June 2025' },
    { value: '2023-2024', label: '1 July 2023 – 30 June 2024' }
  ]);

  const [exportPreferences, setExportPreferences] = useState({
    defaultFormat: 'excel',
    includeLogo: true,
    includeSummary: true,
    includeCharts: true
  });

  const [accountInfo, setAccountInfo] = useState({
    username: user?.name || 'admin_himmel',
    email: user?.email || 'admin@himmelpharma.com',
    fullName: 'System Administrator'
  });

  // Edit Profile / Password Forms
  const [profileForm, setProfileForm] = useState({ ...accountInfo });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Simulate loading skeleton on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleCompanySave = (e) => {
    e.preventDefault();
    setToast({ message: 'Company information updated successfully.', type: 'success' });
  };

  const handleLogoChange = () => {
    const newLogo = prompt('Enter image URL for Company Logo:', companyInfo.logo);
    if (newLogo && newLogo.trim() !== '') {
      setCompanyInfo({ ...companyInfo, logo: newLogo.trim() });
      setToast({ message: 'Logo URL updated successfully.', type: 'success' });
    }
  };

  const handleExportPrefsSave = () => {
    setToast({ message: 'Export preferences saved.', type: 'success' });
  };

  const handleCreateBusinessYear = (newYearVal, copyPrevious) => {
    const startYear = newYearVal.split('-')[0];
    const endYear = newYearVal.split('-')[1];
    
    const newYear = {
      value: newYearVal,
      startDate: `${startYear}-07-01`,
      endDate: `${endYear}-06-30`
    };

    setBusinessYear(newYear);
    setExistingYears([
      { value: newYearVal, label: `1 July ${startYear} – 30 June ${endYear}` },
      ...existingYears
    ]);
    setIsYearModalOpen(false);
    setToast({
      message: `Business Year ${newYearVal} created successfully ${copyPrevious ? '(copied previous targets)' : ''}.`,
      type: 'success'
    });
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    setAccountInfo({ ...profileForm });
    setIsEditProfileOpen(false);
    setToast({ message: 'Profile information updated successfully.', type: 'success' });
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsChangePasswordOpen(false);
    setToast({ message: 'Password updated successfully.', type: 'success' });
  };

  return (
    <DashboardLayout pageTitle="Settings">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
            Settings
          </h1>
          <p className="text-xs text-gray-450 dark:text-gray-550 font-medium mt-1">
            Manage application preferences and system configuration.
          </p>
        </div>

        {loading ? (
          /* Premium Loading Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-5 space-y-4">
                <div className="h-4 bg-gray-150 dark:bg-gray-800 rounded w-1/3" />
                <div className="space-y-2">
                  <div className="h-8 bg-gray-100 dark:bg-gray-805/50 rounded w-full" />
                  <div className="h-8 bg-gray-100 dark:bg-gray-805/50 rounded w-full" />
                  <div className="h-8 bg-gray-100 dark:bg-gray-805/50 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Company Information */}
            <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 flex flex-col justify-between">
              <form onSubmit={handleCompanySave} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-850">
                  <FiBriefcase className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider">Company Information</h3>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="w-16 h-16 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden flex items-center justify-center relative group">
                    <img src={companyInfo.logo} alt="Company Logo" className="object-cover w-full h-full" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleLogoChange}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-bold text-gray-700 dark:text-gray-300 rounded-lg transition-colors inline-flex items-center gap-1.5"
                    >
                      <FiImage className="w-3.5 h-3.5" />
                      Change Logo
                    </button>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">Accepts PNG, JPG or Unsplash image links.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Company Email</label>
                      <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                        <input
                          type="email"
                          value={companyInfo.email}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Company Phone</label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                        <input
                          type="text"
                          value={companyInfo.phone}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Company Address</label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-2.5 text-gray-400 w-3.5 h-3.5" />
                      <textarea
                        rows={2}
                        value={companyInfo.address}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Business Year */}
            <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-855">
                  <FiCalendar className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider">Business Year</h3>
                </div>

                <div className="bg-gray-50/50 dark:bg-gray-800/25 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Active Business Year</span>
                    <span className="text-xs font-extrabold text-brand-primary bg-sky-50 dark:bg-brand-primary/10 px-2.5 py-1 rounded-md">
                      {businessYear.value}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Start Date</p>
                      <p className="font-semibold text-gray-750 dark:text-gray-200 mt-0.5">{businessYear.startDate}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">End Date</p>
                      <p className="font-semibold text-gray-750 dark:text-gray-200 mt-0.5">{businessYear.endDate}</p>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 dark:text-gray-550 leading-relaxed font-medium">
                  Adding a new business year sets the timeline boundaries for target allocation and records. Previous records remain linked.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setIsYearModalOpen(true)}
                  className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5"
                >
                  <FiCalendar className="w-3.5 h-3.5" />
                  Create New Business Year
                </button>
              </div>
            </div>

            {/* 3. Appearance */}
            <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-855 mb-4">
                <FiSun className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider">Appearance</h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Light Mode */}
                <button
                  onClick={() => setThemeMode('light')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    mode === 'light'
                      ? 'border-brand-primary bg-sky-50/15 dark:bg-brand-primary/10 text-brand-primary font-bold shadow-sm'
                      : 'border-gray-150 dark:border-gray-750 text-gray-500 hover:bg-gray-55/50 dark:hover:bg-gray-800/40'
                  }`}
                >
                  <FiSun className="w-5 h-5 text-amber-500" />
                  <span className="text-[10px] uppercase tracking-wider font-bold">Light</span>
                </button>

                {/* Dark Mode */}
                <button
                  onClick={() => setThemeMode('dark')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    mode === 'dark'
                      ? 'border-brand-primary bg-sky-50/15 dark:bg-brand-primary/10 text-brand-primary font-bold shadow-sm'
                      : 'border-gray-150 dark:border-gray-750 text-gray-500 hover:bg-gray-55/50 dark:hover:bg-gray-800/40'
                  }`}
                >
                  <FiMoon className="w-5 h-5 text-indigo-500" />
                  <span className="text-[10px] uppercase tracking-wider font-bold">Dark</span>
                </button>

                {/* System Mode */}
                <button
                  onClick={() => setThemeMode('system')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    mode === 'system'
                      ? 'border-brand-primary bg-sky-50/15 dark:bg-brand-primary/10 text-brand-primary font-bold shadow-sm'
                      : 'border-gray-150 dark:border-gray-750 text-gray-500 hover:bg-gray-55/50 dark:hover:bg-gray-800/40'
                  }`}
                >
                  <FiMonitor className="w-5 h-5 text-teal-500" />
                  <span className="text-[10px] uppercase tracking-wider font-bold">System</span>
                </button>
              </div>

              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 font-semibold italic text-center">
                Application theme updates immediately on selection.
              </p>
            </div>

            {/* 4. Export Preferences */}
            <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-855">
                  <FiSettings className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider">Export Preferences</h3>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Default Export Format</label>
                    <select
                      value={exportPreferences.defaultFormat}
                      onChange={(e) => setExportPreferences({ ...exportPreferences, defaultFormat: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-brand-primary"
                    >
                      <option value="excel">Excel (.xlsx)</option>
                      <option value="pdf">PDF File</option>
                      <option value="ppt">PowerPoint (.pptx)</option>
                    </select>
                  </div>

                  <div className="space-y-2 pt-1.5">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={exportPreferences.includeLogo}
                        onChange={(e) => setExportPreferences({ ...exportPreferences, includeLogo: e.target.checked })}
                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 w-3.5 h-3.5"
                      />
                      Include Company Logo
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={exportPreferences.includeSummary}
                        onChange={(e) => setExportPreferences({ ...exportPreferences, includeSummary: e.target.checked })}
                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 w-3.5 h-3.5"
                      />
                      Include Summary
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={exportPreferences.includeCharts}
                        onChange={(e) => setExportPreferences({ ...exportPreferences, includeCharts: e.target.checked })}
                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 w-3.5 h-3.5"
                      />
                      Include Charts
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleExportPrefsSave}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  Save Preferences
                </button>
              </div>
            </div>

            {/* 5. Account */}
            <div className="bg-white dark:bg-[#0f172a] border border-gray-155 dark:border-gray-800 rounded-enterprise shadow-soft p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-855">
                  <FiUser className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider">Account</h3>
                </div>

                <div className="space-y-3 py-1 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Username</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{accountInfo.username}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Email</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{accountInfo.email}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-[11px] font-bold text-gray-650 dark:text-gray-300 rounded-lg transition-colors"
                >
                  Change Password
                </button>
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="px-3.5 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* 6. Data Management */}
            <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-855 mb-4">
                <FiDatabase className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider">Data Management</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Import Data Card */}
                <div
                  onClick={() => navigate('/import')}
                  className="border border-gray-150 dark:border-gray-750 rounded-xl p-4 hover:border-brand-primary/45 dark:hover:border-brand-primary/45 hover:bg-sky-50/5 dark:hover:bg-sky-950/5 transition-all cursor-pointer flex gap-3 items-start"
                >
                  <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-500 flex items-center justify-center shrink-0">
                    <FiUploadCloud className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">Import Data</h4>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 leading-normal">
                      Import existing sales data from Excel (.xlsx, .xls) directly.
                    </p>
                  </div>
                </div>

                {/* Export Data Card */}
                <div
                  onClick={() => navigate('/export')}
                  className="border border-gray-150 dark:border-gray-750 rounded-xl p-4 hover:border-brand-primary/45 dark:hover:border-brand-primary/45 hover:bg-sky-50/5 dark:hover:bg-sky-950/5 transition-all cursor-pointer flex gap-3 items-start"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                    <FiDownloadCloud className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">Export Data</h4>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 leading-normal">
                      Navigate to Export Center to extract custom records.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. About */}
            <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 md:col-span-2">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-855 mb-4">
                <FiInfo className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider">About Application</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium py-1">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Application Name</span>
                  <p className="font-bold text-gray-800 dark:text-white mt-0.5">Himmel Sales System</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Version</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">v1.4.2</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Developer Info</span>
                  <p className="font-semibold text-gray-805 dark:text-gray-200 mt-0.5">Enterprise Systems Group</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Copyright</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-300 mt-0.5">© 2026 Himmel Pharma</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* CREATE BUSINESS YEAR MODAL */}
      {isYearModalOpen && (
        <CreateBusinessYearModal
          onClose={() => setIsYearModalOpen(false)}
          onCreate={handleCreateBusinessYear}
          existingYears={existingYears}
        />
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-navy to-[#162040]">
              <div className="flex items-center gap-3">
                <FiUser className="w-5 h-5 text-white" />
                <h2 className="text-sm font-bold text-white">Edit Profile</h2>
              </div>
              <button onClick={() => setIsEditProfileOpen(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <FiX className="w-4 h-4 text-white/80" />
              </button>
            </div>
            <form onSubmit={handleProfileSave}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-55 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-55 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-end gap-2 rounded-b-enterprise">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Save profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-navy to-[#162040]">
              <div className="flex items-center gap-3">
                <FiLock className="w-5 h-5 text-white" />
                <h2 className="text-sm font-bold text-white">Change Password</h2>
              </div>
              <button onClick={() => setIsChangePasswordOpen(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <FiX className="w-4 h-4 text-white/80" />
              </button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-55 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-55 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-55 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-end gap-2 rounded-b-enterprise">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-450 bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Settings;
