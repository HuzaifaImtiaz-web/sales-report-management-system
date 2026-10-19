import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Toast from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { settingsService } from '../../services/settingsService';
import { CreateBusinessYearModal } from '../Targets/Targets';
import ConfirmDialog from '../../components/common/dialogs/ConfirmDialog';
import EnterprisePasswordInput from '../../components/common/EnterprisePasswordInput';
import { validatePassword } from '../../utils/passwordPolicy';
import {
  FiBriefcase, FiImage, FiMail, FiPhone, FiMapPin,
  FiCalendar, FiSun, FiMoon, FiMonitor, FiSettings,
  FiFileText, FiUser, FiLock, FiDatabase,
  FiDownloadCloud, FiInfo, FiCheck, FiX, FiEdit, FiLoader,
  FiActivity, FiAlertTriangle, FiFolder, FiRefreshCw, FiKey, FiShield,
  FiCode, FiCpu
} from 'react-icons/fi';

import CompanyLogo from '../../components/common/CompanyLogo';
import logoImg from '../../assets/logos/Himmel-Logo.png';
import { APP_VERSION } from '../../utils/version';

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
    name: 'Himmel Pharmaceutical',
    logo: logoImg,
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
    username: user?.username || '',
    fullName: user?.fullName || '',
    role: user?.role || ''
  });

  useEffect(() => {
    if (user) {
      setAccountInfo({
        username: user.username,
        fullName: user.fullName,
        role: user.role
      });
    }
  }, [user]);

  // Edit Profile / Password Forms
  const [profileForm, setProfileForm] = useState({ ...accountInfo });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Security Center Form States
  const [usernameForm, setUsernameForm] = useState({ currentPassword: '', newUsername: '' });
  const [recoveryPasswordForm, setRecoveryPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [recoveryPinForm, setRecoveryPinForm] = useState({ currentAuth: '', newPin: '', confirmPin: '' });

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    if (!usernameForm.newUsername.trim() || usernameForm.newUsername.trim().length < 3) {
      setToast({ message: 'Username must be at least 3 characters.', type: 'error' });
      return;
    }
    try {
      if (window.api?.auth?.changeUsername) {
        const res = await window.api.auth.changeUsername({
          currentPassword: usernameForm.currentPassword,
          newUsername: usernameForm.newUsername.trim()
        });
        if (res && res.success) {
          setToast({ message: 'Username updated successfully.', type: 'success' });
          setUsernameForm({ currentPassword: '', newUsername: '' });
          setAccountInfo((prev) => ({ ...prev, username: usernameForm.newUsername.trim() }));
        } else {
          setToast({ message: res?.error || 'Failed to update username.', type: 'error' });
        }
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleUpdateRecoveryPassword = async (e) => {
    e.preventDefault();
    const policy = validatePassword(recoveryPasswordForm.newPassword);
    if (!policy.isValid) {
      setToast({ message: 'New recovery password does not meet requirements.', type: 'error' });
      return;
    }
    if (recoveryPasswordForm.newPassword !== recoveryPasswordForm.confirmPassword) {
      setToast({ message: 'Recovery passwords do not match.', type: 'error' });
      return;
    }

    try {
      if (window.api?.auth?.changeRecoveryPassword) {
        const res = await window.api.auth.changeRecoveryPassword({
          currentPassword: recoveryPasswordForm.currentPassword,
          newPassword: recoveryPasswordForm.newPassword
        });
        if (res && res.success) {
          setToast({ message: 'Emergency Recovery Password updated successfully.', type: 'success' });
          setRecoveryPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
          setToast({ message: res?.error || 'Failed to update recovery password.', type: 'error' });
        }
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleUpdateRecoveryPin = async (e) => {
    e.preventDefault();
    if (!/^\d{6,8}$/.test(recoveryPinForm.newPin)) {
      setToast({ message: 'Recovery PIN must be 6 to 8 numeric digits.', type: 'error' });
      return;
    }
    if (recoveryPinForm.newPin !== recoveryPinForm.confirmPin) {
      setToast({ message: 'Recovery PINs do not match.', type: 'error' });
      return;
    }

    try {
      if (window.api?.auth?.changeRecoveryPin) {
        const res = await window.api.auth.changeRecoveryPin({
          currentAuth: recoveryPinForm.currentAuth,
          newPin: recoveryPinForm.newPin
        });
        if (res && res.success) {
          setToast({ message: 'Emergency Recovery PIN updated successfully.', type: 'success' });
          setRecoveryPinForm({ currentAuth: '', newPin: '', confirmPin: '' });
        } else {
          setToast({ message: res?.error || 'Failed to update recovery PIN.', type: 'error' });
        }
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  // Production / Admin Settings States
  const [appConfig, setAppConfig] = useState({ mode: 'production', version: APP_VERSION, dbVersion: APP_VERSION });
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [integrityReport, setIntegrityReport] = useState(null);
  const [backupHistory, setBackupHistory] = useState([]);
  // Backup download / restore: { mode: 'download' | 'restore', file } while the password box is open.
  const [backupAuth, setBackupAuth] = useState(null);
  const [backupPassword, setBackupPassword] = useState('');
  const restoreInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const [runningHealthCheck, setRunningHealthCheck] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);

  const loadProductionData = async () => {
    if (!window.api || !window.api.production) return;
    try {
      const configRes = await window.api.production.getConfig();
      if (configRes && configRes.success) {
        setAppConfig(configRes.data);
      }

      const mainRes = await window.api.settings.getByKey('maintenance_mode');
      if (mainRes && mainRes.success && mainRes.data) {
        setMaintenanceMode(mainRes.data.value === 'true');
      }

      const diagRes = await window.api.production.getDiagnostics();
      if (diagRes && diagRes.success && diagRes.data) {
        const diagData = diagRes.data.diagnostics || diagRes.data;
        setDiagnostics(diagData);
      }

      const histRes = await window.api.production.getBackupHistory();
      if (histRes && histRes.success) {
        setBackupHistory(histRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load production configuration:', err);
    }
  };

  useEffect(() => {
    if (user && user.role === 'Admin') {
      loadProductionData();
    }
  }, [user]);

  const reloadBackupHistory = async () => {
    const histRes = await window.api.production.getBackupHistory();
    if (histRes && histRes.success) setBackupHistory(histRes.data || []);
  };

  // A backup holds every business record, so the server asks for the administrator's password again.
  const handleCreateBackup = () => {
    setBackupPassword('');
    setBackupAuth({ mode: 'download' });
  };

  const [showYearSwitchConfirm, setShowYearSwitchConfirm] = useState(false);
  const [targetYearSwitch, setTargetYearSwitch] = useState(null);

  const handleBrowseRestore = () => {
    if (restoreInputRef.current) {
      restoreInputRef.current.value = '';
      restoreInputRef.current.click();
    }
  };

  const handleRestoreFileChosen = (e) => {
    const chosen = e.target.files && e.target.files[0];
    if (!chosen) return;
    setBackupPassword('');
    setBackupAuth({ mode: 'restore', file: chosen });
  };

  const handleBackupAuthSubmit = async (e) => {
    e.preventDefault();
    if (!backupAuth || !backupPassword) return;
    const password = backupPassword;
    setBackupPassword('');

    if (backupAuth.mode === 'download') {
      setCreatingBackup(true);
      try {
        const res = await window.api.production.downloadBackup(password);
        if (res && res.success) {
          setBackupAuth(null);
          setToast({ message: `Backup downloaded: ${res.data?.fileName || ''}`, type: 'success' });
          reloadBackupHistory();
        } else {
          setToast({ message: res?.error || 'Backup failed.', type: 'error' });
        }
      } catch (err) {
        setToast({ message: err.message, type: 'error' });
      } finally {
        setCreatingBackup(false);
      }
      return;
    }

    setRestoringBackup(true);
    setToast({ message: 'Restoring database backup, please wait...', type: 'info' });
    try {
      const res = await window.api.production.restoreBackup(backupAuth.file, password);
      if (res && res.success) {
        setBackupAuth(null);
        setToast({ message: 'Restore successful! Reloading the app...', type: 'success' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setToast({ message: res?.error || 'Restore failed.', type: 'error' });
        setRestoringBackup(false);
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
      setRestoringBackup(false);
    }
  };

  const handleRunHealthCheck = async () => {
    setRunningHealthCheck(true);
    try {
      if (window.api && window.api.production) {
        const res = await window.api.production.runIntegrityCheck();
        if (res && res.success) {
          setIntegrityReport(res.data);
          if (res.data?.healthy) {
            setToast({ message: 'Database integrity check passed successfully!', type: 'success' });
          } else {
            setToast({ message: 'Integrity check failed. Some issues were found.', type: 'error' });
          }
        } else {
          setToast({ message: res?.error || 'Integrity check failed.', type: 'error' });
        }
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setRunningHealthCheck(false);
    }
  };

  // Load settings data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        if (window.api && window.api.production && window.api.production.getConfig) {
          const configRes = await window.api.production.getConfig();
          if (configRes && configRes.success && configRes.data) {
            setAppConfig(prev => ({ ...prev, ...configRes.data }));
          }
        }

        const company = await settingsService.getCompanyInfo();
        setCompanyInfo(company);

        const by = await settingsService.getBusinessYear();
        setBusinessYear(by);

        const years = await settingsService.getExistingYears();
        setExistingYears(years);

        const prefs = await settingsService.getExportPreferences();
        setExportPreferences(prefs);

        const account = await settingsService.getAccountInfo();
        const merged = {
          ...account,
          username: user?.username || account.username,
          fullName: account.fullName || user?.fullName || '',
          role: user?.role || account.role
        };
        setAccountInfo(merged);
        setProfileForm(merged);
      } catch (err) {
        console.error('Failed to load settings data:', err);
      }
    };
    loadData();

    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleCompanySave = async (e) => {
    e.preventDefault();
    try {
      await settingsService.saveCompanyInfo(companyInfo);
      setToast({ message: 'Company information updated successfully.', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to save company information.', type: 'error' });
    }
  };

  const handleLogoChange = () => {
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
      logoInputRef.current.click();
    }
  };

  // The logo is stored as an image data URL (no third-party image hosts, nothing that can run code).
  const handleLogoFileChosen = (e) => {
    const chosen = e.target.files && e.target.files[0];
    if (!chosen) return;
    if (!/^image\/(png|jpeg|webp)$/.test(chosen.type)) {
      setToast({ message: 'Choose a PNG, JPG or WebP image.', type: 'error' });
      return;
    }
    if (chosen.size > 1024 * 1024) {
      setToast({ message: 'The logo must be 1 MB or smaller.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => handleConfirmLogoChange(String(reader.result || ''));
    reader.onerror = () => setToast({ message: 'Could not read that image.', type: 'error' });
    reader.readAsDataURL(chosen);
  };

  const handleConfirmLogoChange = async (newLogo) => {
    setShowLogoPrompt(false);
    if (newLogo && newLogo.trim() !== '') {
      const updatedCompany = { ...companyInfo, logo: newLogo.trim() };
      try {
        await settingsService.saveCompanyInfo(updatedCompany);
        setCompanyInfo(updatedCompany);
        setToast({ message: 'Company logo updated successfully.', type: 'success' });
      } catch (err) {
        setToast({ message: err.message || 'Failed to update logo.', type: 'error' });
      }
    }
  };

  const handleExportPrefsSave = async () => {
    try {
      await settingsService.saveExportPreferences(exportPreferences);
      setToast({ message: 'Export preferences saved.', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to save preferences.', type: 'error' });
    }
  };

  const handleCreateBusinessYear = async (newYearVal, copyPrevious) => {
    const startYear = newYearVal.split('-')[0];
    const endYear = newYearVal.split('-')[1];

    const newYear = {
      value: newYearVal,
      startDate: `${startYear}-07-01`,
      endDate: `${endYear}-06-30`
    };

    try {
      await settingsService.saveBusinessYear(newYear);
      const updatedYears = await settingsService.getExistingYears();
      setExistingYears(updatedYears);
      setBusinessYear(newYear);
      setIsYearModalOpen(false);
      setToast({
        message: `Business Year ${newYearVal} created successfully ${copyPrevious ? '(copied previous targets)' : ''}.`,
        type: 'success'
      });
    } catch (err) {
      setToast({ message: err.message || 'Failed to create business year', type: 'error' });
    }
  };

  const handleSwitchBusinessYear = (yearValue) => {
    setTargetYearSwitch(yearValue);
    setShowYearSwitchConfirm(true);
  };

  const handleConfirmSwitchBusinessYear = async () => {
    setShowYearSwitchConfirm(false);
    if (!targetYearSwitch) return;
    const yearValue = targetYearSwitch;

    try {
      const startYear = yearValue.split('-')[0];
      const endYear = yearValue.split('-')[1];

      const newYearObj = {
        value: yearValue,
        startDate: `${startYear}-07-01`,
        endDate: `${endYear}-06-30`
      };

      await settingsService.saveBusinessYear(newYearObj);
      setBusinessYear(newYearObj);
      setToast({ message: `Active business year changed to ${yearValue}.`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to change business year', type: 'error' });
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await settingsService.saveAccountInfo(profileForm);
      setAccountInfo({ ...profileForm });
      setIsEditProfileOpen(false);
      setToast({ message: 'Profile information updated successfully.', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to save profile.', type: 'error' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ message: 'New passwords do not match.', type: 'error' });
      return;
    }

    const policy = validatePassword(passwordForm.newPassword, { username: user?.username });
    if (!policy.isValid) {
      setToast({ message: `New password: ${policy.errors[0]}`, type: 'error' });
      return;
    }

    try {
      if (window.api && window.api.auth) {
        const res = await window.api.auth.changePassword({
          oldPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        });

        if (res && res.success) {
          setToast({ message: 'Password updated successfully.', type: 'success' });
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setIsChangePasswordOpen(false);
        } else {
          setToast({ message: res?.error || 'Failed to update password.', type: 'error' });
        }
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  // Sections shown one at a time; every card keeps its own logic.
  const SECTIONS = [
    { id: 'company', label: 'Company', hint: 'Details, logo, business year' },
    { id: 'preferences', label: 'Preferences', hint: 'Appearance and exports' },
    { id: 'security', label: 'Account & security', hint: 'Password, recovery' },
    { id: 'system', label: 'Backups & system', hint: 'Backups, diagnostics' },
    { id: 'about', label: 'About', hint: 'Version and support' },
  ];
  const [section, setSection] = useState('company');
  const sectionCls = (id) => (section === id ? '' : 'hidden');

  return (
    <DashboardLayout pageTitle="Settings">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-550 font-medium mt-1">
            Manage application preferences and system configuration.
          </p>
        </div>

        {loading ? (
          /* Premium Loading Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-enterprise p-5 space-y-4">
                <div className="h-4 bg-gray-150 dark:bg-brand-navy rounded w-1/3" />
                <div className="space-y-2">
                  <div className="h-8 bg-gray-100 dark:bg-gray-805/50 rounded w-full" />
                  <div className="h-8 bg-gray-100 dark:bg-gray-805/50 rounded w-full" />
                  <div className="h-8 bg-gray-100 dark:bg-gray-805/50 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
          <nav aria-label="Settings sections" className="w-full lg:w-60 flex-none flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0 lg:sticky lg:top-0">
            {SECTIONS.map(({ id, label, hint }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                aria-current={section === id ? 'page' : undefined}
                className={`flex-none text-left rounded-lg px-3.5 py-2.5 transition-colors ${
                  section === id
                    ? 'bg-brand-tint text-brand-primary dark:bg-brand-primary/20 dark:text-red-200'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                }`}
              >
                <span className={`block text-sm ${section === id ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                <span className="hidden lg:block text-xs text-muted dark:text-gray-400 mt-0.5">{hint}</span>
              </button>
            ))}
          </nav>
          <div className="flex-1 min-w-0 w-full grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. Company Information */}
            <div className={`bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-enterprise shadow-soft p-5 flex flex-col justify-between ${sectionCls('company')}`}>
              <form onSubmit={handleCompanySave} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-brand-navyLine">
                  <FiBriefcase className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200">Company Information</h3>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="w-16 h-16 rounded-xl border border-gray-200 dark:border-brand-navyLine bg-gray-50 dark:bg-brand-navy overflow-hidden flex items-center justify-center relative group">
                    <img src={companyInfo.logo} alt="Company Logo" className="object-contain w-full h-full bg-white p-1" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleLogoChange}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-brand-navy hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 rounded-lg transition-colors inline-flex items-center gap-1.5"
                    >
                      <FiImage className="w-3.5 h-3.5" />
                      Change Logo
                    </button>
                    <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1">Upload a PNG, JPG or WebP image (1 MB at most).</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-brand-navy/50 border border-gray-200 dark:border-brand-navyLine rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Company Email</label>
                      <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
                        <input
                          type="email"
                          value={companyInfo.email}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-brand-navy/50 border border-gray-200 dark:border-brand-navyLine rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Company Phone</label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
                        <input
                          type="text"
                          value={companyInfo.phone}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-brand-navy/50 border border-gray-200 dark:border-brand-navyLine rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Company Address</label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-2.5 text-gray-500 w-3.5 h-3.5" />
                      <textarea
                        rows={2}
                        value={companyInfo.address}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-brand-navy/50 border border-gray-200 dark:border-brand-navyLine rounded-lg outline-none focus:ring-1 focus:ring-brand-primary resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Business Year */}
            <div className={`bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-enterprise shadow-soft p-5 flex flex-col justify-between ${sectionCls('company')}`}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-855">
                  <FiCalendar className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200">Business Year</h3>
                </div>

                <div className="bg-gray-50/50 dark:bg-brand-navy/25 p-4 rounded-xl border border-gray-200 dark:border-brand-navyLine space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Active Business Year</span>
                    <select
                      value={businessYear.value}
                      onChange={(e) => handleSwitchBusinessYear(e.target.value)}
                      className="text-xs font-semibold text-brand-primary bg-gray-50 dark:bg-brand-primary/10 border-0 px-2.5 py-1 rounded-md cursor-pointer outline-none focus:ring-1 focus:ring-brand-primary"
                    >
                      {existingYears.map((y) => (
                        <option key={y.value} value={y.value}>
                          {y.value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500">Start Date</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-200 mt-0.5">{businessYear.startDate}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500">End Date</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-200 mt-0.5">{businessYear.endDate}</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-550 leading-relaxed font-medium">
                  Adding a new business year sets the timeline boundaries for target allocation and records. Previous records remain linked.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setIsYearModalOpen(true)}
                  className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-semibold rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5"
                >
                  <FiCalendar className="w-3.5 h-3.5" />
                  Create New Business Year
                </button>
              </div>
            </div>

            {/* 3. Appearance */}
            <div className={`bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-enterprise shadow-soft p-5 ${sectionCls('preferences')}`}>
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-855 mb-4">
                <FiSun className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200">Appearance</h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Light Mode */}
                <button
                  onClick={() => setThemeMode('light')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${mode === 'light'
                      ? 'border-brand-primary bg-gray-50/15 dark:bg-brand-primary/10 text-brand-primary font-semibold shadow-sm'
                      : 'border-gray-200 dark:border-brand-navyLine text-gray-500 hover:bg-gray-50/50 dark:hover:bg-white/5'
                    }`}
                >
                  <FiSun className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-semibold">Light</span>
                </button>

                {/* Dark Mode */}
                <button
                  onClick={() => setThemeMode('dark')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${mode === 'dark'
                      ? 'border-brand-primary bg-gray-50/15 dark:bg-brand-primary/10 text-brand-primary font-semibold shadow-sm'
                      : 'border-gray-200 dark:border-brand-navyLine text-gray-500 hover:bg-gray-50/50 dark:hover:bg-white/5'
                    }`}
                >
                  <FiMoon className="w-5 h-5 text-gray-500" />
                  <span className="text-xs font-semibold">Dark</span>
                </button>

                {/* System Mode */}
                <button
                  onClick={() => setThemeMode('system')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${mode === 'system'
                      ? 'border-brand-primary bg-gray-50/15 dark:bg-brand-primary/10 text-brand-primary font-semibold shadow-sm'
                      : 'border-gray-200 dark:border-brand-navyLine text-gray-500 hover:bg-gray-50/50 dark:hover:bg-white/5'
                    }`}
                >
                  <FiMonitor className="w-5 h-5 text-gray-500" />
                  <span className="text-xs font-semibold">System</span>
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-500 mt-3 font-semibold italic text-center">
                Application theme updates immediately on selection.
              </p>
            </div>

            {/* 4. Export Preferences */}
            <div className={`bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-enterprise shadow-soft p-5 flex flex-col justify-between ${sectionCls('preferences')}`}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-855">
                  <FiSettings className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200">Export Preferences</h3>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Default Export Format</label>
                    <select
                      value={exportPreferences.defaultFormat}
                      onChange={(e) => setExportPreferences({ ...exportPreferences, defaultFormat: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-brand-navy/50 border border-gray-200 dark:border-brand-navyLine rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-brand-primary"
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
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Save Preferences
                </button>
              </div>
            </div>

            {/* 5. Account */}
            <div className={`bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-enterprise shadow-soft p-5 flex flex-col justify-between ${sectionCls('security')}`}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-855">
                  <FiUser className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200">Account</h3>
                </div>

                <div className="space-y-3 py-1 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-gray-500">Full Name</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-250 mt-0.5 capitalize">{accountInfo.fullName}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-gray-500">Username</span>
                    <p className="font-semibold text-gray-600 dark:text-gray-400 mt-0.5">{accountInfo.username}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-gray-500">Role</span>
                    <p className="font-semibold text-gray-600 dark:text-gray-400 mt-0.5 capitalize">{accountInfo.role}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="px-3.5 py-2 border border-gray-200 dark:border-brand-navyLine hover:bg-gray-50 dark:hover:bg-white/5 text-[11px] font-semibold text-gray-600 dark:text-gray-300 rounded-lg transition-colors cursor-pointer"
                >
                  Change Password
                </button>
              </div>
            </div>

            {/* 6. Enterprise Security Center */}
            <div className={`bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-enterprise shadow-soft p-5 md:col-span-2 space-y-6 ${sectionCls('security')}`}>
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-855">
                <FiShield className="w-4.5 h-4.5 text-brand-primary" />
                <h3 className="text-xs font-semibold text-gray-855 dark:text-gray-200">
                  Enterprise Security Center & Emergency Recovery
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Change Username */}
                <form onSubmit={handleUpdateUsername} className="p-4 bg-gray-50/50 dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-white">
                      <FiUser className="w-4 h-4 text-brand-primary" />
                      <span>Update Username</span>
                    </div>
                    <EnterprisePasswordInput
                      id="update-username-current-pw"
                      label="Current Account Password *"
                      value={usernameForm.currentPassword}
                      onChange={(e) => setUsernameForm({ ...usernameForm, currentPassword: e.target.value })}
                      required={true}
                      placeholder="Verify account password"
                    />
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        New Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={usernameForm.newUsername}
                        onChange={(e) => setUsernameForm({ ...usernameForm, newUsername: e.target.value })}
                        placeholder="e.g. sysadmin"
                        className="w-full px-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-100 bg-white dark:bg-brand-navy border border-gray-200 dark:border-brand-navyLine rounded-lg outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-brand-primary hover:bg-[#8F161A] text-white font-semibold text-xs rounded-lg transition-all shadow-xs cursor-pointer mt-2"
                  >
                    Save Username
                  </button>
                </form>

                {/* Card 2: Update Recovery Password */}
                <form onSubmit={handleUpdateRecoveryPassword} className="p-4 bg-gray-50/50 dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-white">
                      <FiKey className="w-4 h-4 text-brand-primary" />
                      <span>Recovery Password</span>
                    </div>
                    <EnterprisePasswordInput
                      id="sec-current-rec-pw"
                      label="Current Recovery Password *"
                      value={recoveryPasswordForm.currentPassword}
                      onChange={(e) => setRecoveryPasswordForm({ ...recoveryPasswordForm, currentPassword: e.target.value })}
                      required={true}
                      placeholder="Current recovery password"
                    />
                    <EnterprisePasswordInput
                      id="sec-new-rec-pw"
                      label="New Recovery Password *"
                      value={recoveryPasswordForm.newPassword}
                      onChange={(e) => setRecoveryPasswordForm({ ...recoveryPasswordForm, newPassword: e.target.value })}
                      showRules={true}
                      required={true}
                      placeholder="New strong password"
                    />
                    <EnterprisePasswordInput
                      id="sec-confirm-rec-pw"
                      label="Confirm Recovery Password *"
                      value={recoveryPasswordForm.confirmPassword}
                      onChange={(e) => setRecoveryPasswordForm({ ...recoveryPasswordForm, confirmPassword: e.target.value })}
                      confirmValue={recoveryPasswordForm.newPassword}
                      required={true}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-brand-primary hover:bg-[#8F161A] text-white font-semibold text-xs rounded-lg transition-all shadow-xs cursor-pointer mt-2"
                  >
                    Update Recovery Password
                  </button>
                </form>

                {/* Card 3: Update Recovery PIN */}
                <form onSubmit={handleUpdateRecoveryPin} className="p-4 bg-gray-50/50 dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-white">
                      <FiLock className="w-4 h-4 text-brand-primary" />
                      <span>Recovery PIN (6–8 Digits)</span>
                    </div>
                    <EnterprisePasswordInput
                      id="sec-current-pin-auth"
                      label="Current Auth (PW / PIN) *"
                      value={recoveryPinForm.currentAuth}
                      onChange={(e) => setRecoveryPinForm({ ...recoveryPinForm, currentAuth: e.target.value })}
                      required={true}
                      placeholder="Enter current PW or PIN"
                    />
                    <EnterprisePasswordInput
                      id="sec-new-pin"
                      label="New Recovery PIN *"
                      value={recoveryPinForm.newPin}
                      onChange={(e) => setRecoveryPinForm({ ...recoveryPinForm, newPin: e.target.value.replace(/\D/g, '') })}
                      isPin={true}
                      maxLength={8}
                      required={true}
                      placeholder="e.g. 8492"
                    />
                    <EnterprisePasswordInput
                      id="sec-confirm-pin"
                      label="Confirm Recovery PIN *"
                      value={recoveryPinForm.confirmPin}
                      onChange={(e) => setRecoveryPinForm({ ...recoveryPinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
                      confirmValue={recoveryPinForm.newPin}
                      isPin={true}
                      maxLength={8}
                      required={true}
                      placeholder="Re-enter PIN"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-brand-primary hover:bg-[#8F161A] text-white font-semibold text-xs rounded-lg transition-all shadow-xs cursor-pointer mt-2"
                  >
                    Update Recovery PIN
                  </button>
                </form>
              </div>
            </div>

            {/* 7. Data Management */}
            <div className={`bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-enterprise shadow-soft p-5 ${sectionCls('system')}`}>
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-855 mb-4">
                <FiDatabase className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200">Data Management</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Export Data Card */}
                <div
                  onClick={() => navigate('/export')}
                  className="border border-gray-200 dark:border-brand-navyLine rounded-xl p-4 hover:border-brand-primary/45 dark:hover:border-brand-primary/45 hover:bg-gray-50/5 dark:hover:bg-white/5 transition-all cursor-pointer flex gap-3 items-start"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                    <FiDownloadCloud className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-800 dark:text-white">Export Data</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 leading-normal">
                      Navigate to Export Center to extract custom records.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 8. Production Settings & Diagnostics (Admin Only) */}
            {user?.role === 'Admin' && (
              <div className={`bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-enterprise shadow-soft p-5 md:col-span-2 space-y-6 ${sectionCls('system')}`}>
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-855">
                  <div className="flex items-center gap-2">
                    <FiDatabase className="w-4.5 h-4.5 text-brand-primary" />
                    <h3 className="text-xs font-semibold text-gray-855 dark:text-gray-200">
                      Production Settings & Diagnostics
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        const targetVal = !maintenanceMode;
                        const res = await window.api.settings.save('maintenance_mode', targetVal ? 'true' : 'false', 'general');
                        if (!res || !res.success) {
                          setToast({ message: res?.error || 'Failed to change maintenance mode.', type: 'error' });
                          return;
                        }
                        setMaintenanceMode(targetVal);
                        setToast({
                          message: `Maintenance mode ${targetVal ? 'ENABLED' : 'DISABLED'}.`,
                          type: targetVal ? 'warning' : 'success'
                        });
                      }}
                      className={`px-3 py-1 text-xs font-semibold  rounded-lg transition-colors cursor-pointer ${
                        maintenanceMode
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200'
                      }`}
                    >
                      {maintenanceMode ? 'Maintenance Mode: ON' : 'Maintenance Mode: OFF'}
                    </button>
                    <span className={`text-xs font-semibold  px-2.5 py-1 rounded-md ${
                      appConfig.mode === 'production'
                        ? 'text-emerald-500 bg-emerald-500/10'
                        : 'text-amber-500 bg-amber-500/10'
                    }`}>
                      {appConfig.mode} Mode
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Backup and Restore Controls */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                      <FiDownloadCloud className="w-3.5 h-3.5" />
                      Backup & Restore
                    </h4>

                    <div className="bg-gray-50/50 dark:bg-brand-navy/25 p-4 rounded-xl border border-gray-200 dark:border-brand-navyLine space-y-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        A backup is a compressed copy of all business data, downloaded to this device. Keep backups somewhere safe.
                        Restoring one replaces the business data for every user. Login accounts are not part of backups.
                      </p>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          disabled={creatingBackup}
                          onClick={handleCreateBackup}
                          className="flex-1 px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark disabled:bg-brand-primary/60 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {creatingBackup ? (
                            <FiLoader className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FiDownloadCloud className="w-3.5 h-3.5" />
                          )}
                          Backup Now
                        </button>

                        <button
                          type="button"
                          onClick={handleBrowseRestore}
                          className="flex-1 px-4 py-2 border border-gray-200 dark:border-brand-navyLine hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <FiRefreshCw className="w-3.5 h-3.5" />
                          Restore from File
                        </button>
                        <input
                          ref={restoreInputRef}
                          type="file"
                          accept=".json,.gz,application/json,application/gzip"
                          className="hidden"
                          onChange={handleRestoreFileChosen}
                        />
                      </div>
                    </div>

                    {/* Backup history (from the audit trail) */}
                    <div>
                      <span className="block text-[11px] font-semibold text-gray-500 mb-2">
                        Recent Backups & Restores
                      </span>
                      <div className="border border-gray-200 dark:border-brand-navyLine rounded-xl overflow-hidden max-h-48 overflow-y-auto overflow-x-auto">
                        {backupHistory.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-500 font-medium italic">
                            No backups yet.
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-brand-navy/40 border-b border-gray-200 dark:border-brand-navyLine text-xs font-semibold text-gray-500">
                                <th className="px-4 py-2.5">When</th>
                                <th className="px-4 py-2.5">Action</th>
                                <th className="px-4 py-2.5">By</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-600 dark:text-gray-300">
                              {backupHistory.map((b) => (
                                <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                                  <td className="px-4 py-2 whitespace-nowrap">{b.performedAt}</td>
                                  <td className="px-4 py-2">{b.action}</td>
                                  <td className="px-4 py-2">{b.performedBy}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* System Health and Diagnostics */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                      <FiActivity className="w-3.5 h-3.5" />
                      Diagnostics & System Health
                    </h4>

                    {diagnostics && diagnostics.server ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50/50 dark:bg-brand-navy/25 border border-gray-200 dark:border-brand-navyLine rounded-xl space-y-1">
                          <span className="text-[11px] font-semibold text-gray-500">Database Status</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${diagnostics.databaseAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                              {diagnostics.databaseAvailable ? 'ONLINE' : 'OFFLINE'}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50/50 dark:bg-brand-navy/25 border border-gray-200 dark:border-brand-navyLine rounded-xl space-y-1">
                          <span className="text-[11px] font-semibold text-gray-500">Database Size</span>
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{diagnostics.databaseSize}</p>
                        </div>

                        <div className="p-3 bg-gray-50/50 dark:bg-brand-navy/25 border border-gray-200 dark:border-brand-navyLine rounded-xl space-y-1">
                          <span className="text-[11px] font-semibold text-gray-500">Records</span>
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                            {diagnostics.counts ? `${diagnostics.counts.orders} orders · ${diagnostics.counts.products} products · ${diagnostics.counts.users} users` : '—'}
                          </p>
                        </div>

                        <div className="p-3 bg-gray-50/50 dark:bg-brand-navy/25 border border-gray-200 dark:border-brand-navyLine rounded-xl space-y-1">
                          <span className="text-[11px] font-semibold text-gray-500">Engine</span>
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate" title={diagnostics.databaseEngine}>
                            {diagnostics.databaseEngine}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50/50 dark:bg-brand-navy/25 border border-gray-200 dark:border-brand-navyLine rounded-xl text-center text-xs text-gray-500 italic">
                        Diagnostics loading...
                      </div>
                    )}

                    {/* Database Health Checker */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-gray-500">
                          Integrity Checker
                        </span>
                        <button
                          type="button"
                          disabled={runningHealthCheck}
                          onClick={handleRunHealthCheck}
                          className="px-3 py-1 bg-brand-primary hover:bg-brand-primaryDark disabled:bg-brand-primary/60 text-white text-xs font-semibold rounded transition-colors inline-flex items-center gap-1"
                        >
                          {runningHealthCheck ? (
                            <FiLoader className="w-3 h-3 animate-spin" />
                          ) : (
                            <FiDatabase className="w-3.5 h-3.5" />
                          )}
                          Run Health Check
                        </button>
                      </div>

                      {integrityReport ? (
                        <div className="bg-gray-50/40 dark:bg-brand-navy/15 border border-gray-200 dark:border-brand-navyLine rounded-xl p-3.5 space-y-2.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-gray-500 dark:text-gray-455">Overall Health</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              integrityReport.healthy
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-red-500/15 text-red-500'
                            }`}>
                              {integrityReport.healthy ? 'HEALTHY' : 'ISSUES DETECTED'}
                            </span>
                          </div>

                          <div className="space-y-1.5 pt-1 border-t border-gray-200 dark:border-brand-navyLine">
                            {integrityReport.reports.map((r, idx) => (
                              <div key={idx} className="flex items-start justify-between gap-4 text-xs font-medium leading-normal">
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-gray-700 dark:text-gray-300">{r.check}</p>
                                  <p className="text-gray-500 dark:text-gray-555">{r.message}</p>
                                </div>
                                <span className={`font-semibold shrink-0 ${r.status === 'PASS' ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {r.status}
                                </span>
                              </div>
                            ))}
                          </div>

                          {integrityReport.audit && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-brand-navyLine space-y-2">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Table Row Audit & Integrity</p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left border-collapse">
                                  <thead>
                                    <tr className="text-gray-500 dark:text-gray-500 font-semibold border-b border-gray-200 dark:border-brand-navyLine">
                                      <th className="py-1">Table</th>
                                      <th className="py-1 text-center">Total</th>
                                      <th className="py-1 text-center">Active/Done</th>
                                      <th className="py-1 text-center">Inactive/Pend</th>
                                      <th className="py-1 text-right">Orphaned</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
                                    {Object.entries(integrityReport.audit).map(([table, meta]) => (
                                      <tr key={table} className="text-gray-600 dark:text-gray-300 hover:bg-gray-100/20">
                                        <td className="py-1 font-semibold capitalize">{table.replace('_', ' ')}</td>
                                        <td className="py-1 text-center font-mono font-medium">{meta.total}</td>
                                        <td className="py-1 text-center font-mono font-medium text-green-600 dark:text-green-500">{meta.active}</td>
                                        <td className="py-1 text-center font-mono font-medium text-amber-600 dark:text-amber-500">{meta.inactive}</td>
                                        <td className="py-1 text-right font-mono font-semibold">
                                          {meta.orphaned > 0 ? (
                                            <span className="text-red-500 bg-red-500/10 px-1 py-0.5 rounded text-[11px]">
                                              {meta.orphaned}
                                            </span>
                                          ) : (
                                            <span className="text-green-600 dark:text-green-500">0</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-500 border border-dashed border-gray-200 dark:border-brand-navyLine rounded-xl font-medium italic">
                          Click "Run Health Check" to perform structural database audits.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. About Application & Developer Information */}
            <div className={`bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-enterprise shadow-soft p-6 md:col-span-2 space-y-6 select-none ${sectionCls('about')}`}>

              {/* Header with Himmel Logo & Main App Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-gray-200 dark:border-brand-navyLine">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 shrink-0 inline-flex items-center justify-center">
                    <CompanyLogo className="h-10 w-auto object-contain drop-shadow-sm" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                      Himmel Pharmaceutical Sales Management System
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                      Enterprise Sales &amp; Distribution Management Platform
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-[11px] font-semibold bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-red-400 rounded-full border border-brand-primary/20">
                    v{appConfig.version || APP_VERSION}
                  </span>
                  <span className="px-3 py-1 text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                    Stable Release
                  </span>
                </div>
              </div>

              {/* Application Details & Description Card */}
              <div className="bg-gray-50/60 dark:bg-brand-navy/25 p-4 rounded-xl border border-gray-200 dark:border-brand-navyLine space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                  <FiInfo className="w-4 h-4 text-brand-primary" />
                  <span>Application Information</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
                  Enterprise Pharmaceutical Sales &amp; Distribution Management System designed for managing Products, Doctors, Institutions, Areas, Team Members, Sales, Orders, Reporting, Analytics, Business Year Management, and Enterprise Backup &amp; Recovery.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-3 border-t border-gray-200 dark:border-brand-navyLine/60 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-gray-500 block">Application Name</span>
                    <p className="font-semibold text-gray-800 dark:text-white mt-0.5">Himmel Pharmaceutical Sales Management System</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-gray-500 block">Version</span>
                    <p className="font-semibold text-gray-800 dark:text-white mt-0.5">v{appConfig.version || APP_VERSION}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-gray-500 block">Release Channel</span>
                    <p className="font-semibold text-gray-800 dark:text-white mt-0.5">Production</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-gray-500 block">Build Type</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Stable Release</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-gray-500 block">Build Date</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{appConfig.buildDate || '2026-08-01'}</p>
                  </div>
                </div>
              </div>


              {/* Developer & System Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Developer Information Card */}
                <div className="bg-gray-50/60 dark:bg-brand-navy/25 p-4 rounded-xl border border-gray-200 dark:border-brand-navyLine space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 pb-2.5 border-b border-gray-200 dark:border-brand-navyLine mb-3">
                      <FiCode className="w-4 h-4 text-brand-primary" />
                      <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200">Developer Information</h3>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-brand-navyLine/40">
                        <span className="text-xs font-semibold text-gray-500">Developer</span>
                        <span className="font-semibold text-gray-900 dark:text-white">Huzaifa Imtiaz</span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-brand-navyLine/40">
                        <span className="text-xs font-semibold text-gray-500">Role</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Software Engineer</span>
                      </div>

                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs font-semibold text-gray-500">Copyright</span>
                        <span className="font-semibold text-gray-600 dark:text-gray-400">© 2026 Huzaifa Imtiaz</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-gray-500 dark:text-gray-500 font-semibold italic text-center border-t border-gray-200 dark:border-brand-navyLine/40">
                    All Rights Reserved.
                  </div>
                </div>

                {/* System Information Card */}
                <div className="bg-gray-50/60 dark:bg-brand-navy/25 p-4 rounded-xl border border-gray-200 dark:border-brand-navyLine space-y-3">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-gray-200 dark:border-brand-navyLine">
                    <FiCpu className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200">System Information</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block">App Version</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">v{appConfig.version || APP_VERSION}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block">React</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">v{appConfig.reactVersion || '18.3.1'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block">Database Engine</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{appConfig.dbEngine || 'PostgreSQL (Cloud)'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block">Platform</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{appConfig.platform || 'Web'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block">Server</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 break-all">{appConfig.cloudServer || window.location.origin}</span>
                    </div>
                  </div>
                </div>

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
          <div className="bg-white dark:bg-brand-navyCard border dark:border-brand-navyLine rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-brand-navyLine bg-brand-navy">
              <div className="flex items-center gap-3">
                <FiUser className="w-5 h-5 text-white" />
                <h2 className="text-sm font-semibold text-white">Edit Profile</h2>
              </div>
              <button onClick={() => setIsEditProfileOpen(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <FiX className="w-4 h-4 text-white/80" />
              </button>
            </div>
            <form onSubmit={handleProfileSave}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Username</label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-brand-navy/80 border border-gray-200 dark:border-brand-navyLine rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-brand-navy/80 border border-gray-200 dark:border-brand-navyLine rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-brand-navyLine bg-gray-50/50 dark:bg-brand-navy/30 flex justify-end gap-2 rounded-b-enterprise">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-brand-navy border border-gray-250 dark:border-brand-navyLine rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-semibold rounded-lg transition-colors"
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
          <div className="bg-white dark:bg-brand-navyCard border dark:border-brand-navyLine rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-brand-navyLine bg-brand-navy">
              <div className="flex items-center gap-3">
                <FiLock className="w-5 h-5 text-white" />
                <h2 className="text-sm font-semibold text-white">Change Password</h2>
              </div>
              <button onClick={() => setIsChangePasswordOpen(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <FiX className="w-4 h-4 text-white/80" />
              </button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="p-6 space-y-4">
                <EnterprisePasswordInput
                  id="settings-change-current-pw"
                  label="Current Password *"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required={true}
                  placeholder="Enter current password"
                />
                <EnterprisePasswordInput
                  id="settings-change-new-pw"
                  label="New Password *"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  showRules={true}
                  required={true}
                  placeholder="Enter new strong password"
                />
                <EnterprisePasswordInput
                  id="settings-change-confirm-pw"
                  label="Confirm New Password *"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  confirmValue={passwordForm.newPassword}
                  required={true}
                  placeholder="Re-enter new password"
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-brand-navyLine bg-gray-50/50 dark:bg-brand-navy/30 flex justify-end gap-2 rounded-b-enterprise">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-500 bg-white dark:bg-brand-navy border border-gray-250 dark:border-brand-navyLine rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backup download / restore: confirm with the administrator's password */}
      {backupAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <form
            onSubmit={handleBackupAuthSubmit}
            className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-brand-navyLine rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <FiShield className="w-5 h-5 text-brand-primary" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                {backupAuth.mode === 'download' ? 'Download Backup' : 'Restore Backup'}
              </h3>
            </div>
            {backupAuth.mode === 'restore' ? (
              <p className="text-xs text-red-600 dark:text-red-400 font-semibold leading-relaxed">
                CRITICAL WARNING: restoring "{backupAuth.file?.name}" replaces all business data in the shared database for
                EVERY user. This cannot be undone. Download a fresh backup first if you are unsure.
              </p>
            ) : (
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                The backup contains every business record. It will be saved to this device as a compressed file.
              </p>
            )}
            <EnterprisePasswordInput
              id="backup-password"
              name="backup-password"
              label="Your Password"
              autoComplete="current-password"
              value={backupPassword}
              onChange={(e) => setBackupPassword(e.target.value)}
              required={true}
              disabled={creatingBackup || restoringBackup}
            />
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setBackupAuth(null); setBackupPassword(''); }}
                disabled={creatingBackup || restoringBackup}
                className="flex-1 py-2.5 border border-gray-200 dark:border-brand-navyLine text-gray-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!backupPassword || creatingBackup || restoringBackup}
                className={`flex-1 py-2.5 text-white text-xs font-semibold  rounded-xl transition-all shadow-md disabled:opacity-60 ${
                  backupAuth.mode === 'restore' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-primary hover:bg-brand-primaryDark'
                }`}
              >
                {creatingBackup || restoringBackup ? 'Please wait...' : backupAuth.mode === 'restore' ? 'Restore' : 'Download'}
              </button>
            </div>
          </form>
        </div>
      )}

      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleLogoFileChosen}
      />

      {/* Switch Business Year Confirm Dialog */}
      <ConfirmDialog
        open={showYearSwitchConfirm}
        title="Switch Business Year"
        message={`Are you sure you want to change the active Business Year to ${targetYearSwitch}? This will affect new target allocations and order date boundary checks.`}
        confirmText="Switch Year"
        cancelText="Cancel"
        confirmVariant="warning"
        onConfirm={handleConfirmSwitchBusinessYear}
        onCancel={() => setShowYearSwitchConfirm(false)}
      />
    </DashboardLayout>
  );
};

export default Settings;


