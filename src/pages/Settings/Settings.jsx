import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Toast from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { settingsService } from '../../services/settingsService';
import { CreateBusinessYearModal } from '../Targets/Targets';
import ConfirmDialog from '../../components/common/dialogs/ConfirmDialog';
import PromptDialog from '../../components/common/dialogs/PromptDialog';
import UpdateCenter from '../../components/common/UpdateCenter';
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
    if (!/^\d{4,8}$/.test(recoveryPinForm.newPin)) {
      setToast({ message: 'Recovery PIN must be 4 to 8 numeric digits.', type: 'error' });
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
  const [backupSchedule, setBackupSchedule] = useState('daily');
  const [backupLocation, setBackupLocation] = useState('');
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
        setBackupHistory(histRes.data);
      }
      
      const scheduleRes = await window.api.settings.getByKey('backup_schedule');
      if (scheduleRes && scheduleRes.success && scheduleRes.data) {
        setBackupSchedule(scheduleRes.data.value);
      }
      const locationRes = await window.api.settings.getByKey('backup_location');
      if (locationRes && locationRes.success && locationRes.data) {
        setBackupLocation(locationRes.data.value);
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

  const handleScheduleChange = async (e) => {
    const newValue = e.target.value;
    setBackupSchedule(newValue);
    try {
      if (window.api && window.api.settings) {
        const res = await window.api.settings.save('backup_schedule', newValue, 'general');
        if (res && res.success) {
          setToast({ message: `Backup schedule updated to: ${newValue}`, type: 'success' });
        } else {
          setToast({ message: res?.error || 'Failed to update schedule.', type: 'error' });
        }
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleSelectFolder = async () => {
    try {
      if (window.api && window.api.production) {
        const selected = await window.api.production.selectFolder();
        if (selected) {
          setBackupLocation(selected);
          const res = await window.api.settings.save('backup_location', selected, 'general');
          if (res && res.success) {
            setToast({ message: 'Backup location updated.', type: 'success' });
          } else {
            setToast({ message: res?.error || 'Failed to save location.', type: 'error' });
          }
        }
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      if (window.api && window.api.production) {
        const res = await window.api.production.createBackup();
        if (res && res.success) {
          setToast({ message: `Database backup created successfully: ${res.fileName}`, type: 'success' });
          // Reload history & diagnostics
          const histRes = await window.api.production.getBackupHistory();
          if (histRes && histRes.success) setBackupHistory(histRes.data);
          const diagRes = await window.api.production.getDiagnostics();
          if (diagRes && diagRes.success) setDiagnostics(diagRes.data);
        } else {
          setToast({ message: res?.error || 'Backup failed.', type: 'error' });
        }
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setCreatingBackup(false);
    }
  };

  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreFilePath, setRestoreFilePath] = useState(null);
  const [showLogoPrompt, setShowLogoPrompt] = useState(false);
  const [showYearSwitchConfirm, setShowYearSwitchConfirm] = useState(false);
  const [targetYearSwitch, setTargetYearSwitch] = useState(null);

  const handleRestoreBackup = (filePath) => {
    setRestoreFilePath(filePath);
    setShowRestoreConfirm(true);
  };

  const handleConfirmRestoreBackup = async () => {
    setShowRestoreConfirm(false);
    if (!restoreFilePath) return;

    setRestoringBackup(true);
    setToast({ message: 'Restoring database backup, please wait...', type: 'info' });
    try {
      if (window.api && window.api.production) {
        const res = await window.api.production.restoreBackup(restoreFilePath);
        if (res && res.success) {
          setToast({ message: 'Restore successful! Relaunching application...', type: 'success' });
        } else {
          setToast({ message: res?.error || 'Restore failed.', type: 'error' });
          setRestoringBackup(false);
        }
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
      setRestoringBackup(false);
    }
  };

  const handleBrowseRestore = async () => {
    try {
      if (window.api && window.api.production) {
        const selected = await window.api.production.selectFile();
        if (selected) {
          handleRestoreBackup(selected);
        }
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleRunHealthCheck = async () => {
    setRunningHealthCheck(true);
    try {
      if (window.api && window.api.production) {
        const res = await window.api.production.runIntegrityCheck();
        if (res && res.success) {
          setIntegrityReport(res);
          if (res.healthy) {
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
        setAccountInfo(account);
        setProfileForm(account);
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
    setShowLogoPrompt(true);
  };

  const handleConfirmLogoChange = async (newLogo) => {
    setShowLogoPrompt(false);
    if (newLogo && newLogo.trim() !== '') {
      const updatedCompany = { ...companyInfo, logo: newLogo.trim() };
      try {
        await settingsService.saveCompanyInfo(updatedCompany);
        setCompanyInfo(updatedCompany);
        setToast({ message: 'Logo URL updated successfully.', type: 'success' });
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

  const checkPasswordPolicy = (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ message: 'New passwords do not match.', type: 'error' });
      return;
    }

    const policy = checkPasswordPolicy(passwordForm.newPassword);
    if (!Object.values(policy).every(Boolean)) {
      setToast({ message: 'New password does not meet the policy requirements.', type: 'error' });
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
                    <select
                      value={businessYear.value}
                      onChange={(e) => handleSwitchBusinessYear(e.target.value)}
                      className="text-xs font-bold text-brand-primary bg-sky-50 dark:bg-brand-primary/10 border-0 px-2.5 py-1 rounded-md cursor-pointer outline-none focus:ring-1 focus:ring-brand-primary"
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
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${mode === 'light'
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
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${mode === 'dark'
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
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${mode === 'system'
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
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Full Name</span>
                    <p className="font-bold text-gray-800 dark:text-gray-250 mt-0.5 capitalize">{accountInfo.fullName}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Username</span>
                    <p className="font-semibold text-gray-600 dark:text-gray-400 mt-0.5">{accountInfo.username}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Role</span>
                    <p className="font-semibold text-gray-600 dark:text-gray-400 mt-0.5 capitalize">{accountInfo.role}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-[11px] font-bold text-gray-650 dark:text-gray-300 rounded-lg transition-colors cursor-pointer"
                >
                  Change Password
                </button>
              </div>
            </div>

            {/* 6. Enterprise Security Center */}
            <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 md:col-span-2 space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-855">
                <FiShield className="w-4.5 h-4.5 text-brand-primary" />
                <h3 className="text-xs font-extrabold text-gray-855 dark:text-gray-200 uppercase tracking-wider">
                  Enterprise Security Center & Emergency Recovery
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Change Username */}
                <form onSubmit={handleUpdateUsername} className="p-4 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-800 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-white uppercase">
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
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        New Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={usernameForm.newUsername}
                        onChange={(e) => setUsernameForm({ ...usernameForm, newUsername: e.target.value })}
                        placeholder="e.g. sysadmin"
                        className="w-full px-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-brand-primary hover:bg-[#8F161A] text-white font-bold text-xs uppercase rounded-lg transition-all shadow-xs cursor-pointer mt-2"
                  >
                    Save Username
                  </button>
                </form>

                {/* Card 2: Update Recovery Password */}
                <form onSubmit={handleUpdateRecoveryPassword} className="p-4 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-800 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-white uppercase">
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
                    className="w-full py-2 bg-brand-primary hover:bg-[#8F161A] text-white font-bold text-xs uppercase rounded-lg transition-all shadow-xs cursor-pointer mt-2"
                  >
                    Update Recovery Password
                  </button>
                </form>

                {/* Card 3: Update Recovery PIN */}
                <form onSubmit={handleUpdateRecoveryPin} className="p-4 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-800 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-white uppercase">
                      <FiLock className="w-4 h-4 text-brand-primary" />
                      <span>Recovery PIN (4–8 Digits)</span>
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
                    className="w-full py-2 bg-brand-primary hover:bg-[#8F161A] text-white font-bold text-xs uppercase rounded-lg transition-all shadow-xs cursor-pointer mt-2"
                  >
                    Update Recovery PIN
                  </button>
                </form>
              </div>
            </div>

            {/* 7. Data Management */}
            <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-855 mb-4">
                <FiDatabase className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider">Data Management</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
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

            {/* 7. Auto Update & Version Lifecycle */}
            <div className="md:col-span-2">
              <UpdateCenter isInline={true} />
            </div>

            {/* 8. Production Settings & Diagnostics (Admin Only) */}
            {user?.role === 'Admin' && (
              <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 md:col-span-2 space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-855">
                  <div className="flex items-center gap-2">
                    <FiDatabase className="w-4.5 h-4.5 text-brand-primary" />
                    <h3 className="text-xs font-bold text-gray-855 dark:text-gray-200 uppercase tracking-wider">
                      Production Settings & Diagnostics
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        const targetVal = !maintenanceMode;
                        setMaintenanceMode(targetVal);
                        localStorage.setItem('himmel_maintenance_mode', targetVal ? 'true' : 'false');
                        if (window.api && window.api.settings) {
                          await window.api.settings.save('maintenance_mode', targetVal ? 'true' : 'false', 'general');
                        }
                        setToast({
                          message: `Maintenance mode ${targetVal ? 'ENABLED' : 'DISABLED'}.`,
                          type: targetVal ? 'warning' : 'success'
                        });
                      }}
                      className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg transition-colors cursor-pointer ${
                        maintenanceMode
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200'
                      }`}
                    >
                      {maintenanceMode ? 'Maintenance Mode: ON' : 'Maintenance Mode: OFF'}
                    </button>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md ${
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
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiDownloadCloud className="w-3.5 h-3.5" />
                      Backup & Restore
                    </h4>
                    
                    <div className="bg-gray-55/50 dark:bg-gray-800/25 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-4">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                          Backup Schedule
                        </label>
                        <select
                          value={backupSchedule}
                          onChange={handleScheduleChange}
                          className="w-full px-3 py-2 text-xs font-medium text-gray-750 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-brand-primary"
                        >
                          <option value="none">None (Disabled)</option>
                          <option value="daily">Daily (Every 24 Hours)</option>
                          <option value="weekly">Weekly (Every 7 Days)</option>
                          <option value="monthly">Monthly (Every 30 Days)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                          Backup Folder Location
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={backupLocation || 'Default UserData Directory'}
                            className="w-full px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg outline-none overflow-x-auto"
                          />
                          <button
                            type="button"
                            onClick={handleSelectFolder}
                            className="px-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors inline-flex items-center justify-center border border-gray-200 dark:border-gray-700 shrink-0"
                          >
                            <FiFolder className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          disabled={creatingBackup}
                          onClick={handleCreateBackup}
                          className="flex-1 px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark disabled:bg-brand-primary/60 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
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
                          className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-55 dark:hover:bg-gray-800 text-gray-750 dark:text-gray-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <FiRefreshCw className="w-3.5 h-3.5" />
                          Restore from File
                        </button>
                      </div>
                    </div>

                    {/* Local Backup History */}
                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Recent Local Backups
                      </span>
                      <div className="border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                        {backupHistory.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500 font-medium italic">
                            No backup files found.
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                <th className="px-4 py-2.5">Filename</th>
                                <th className="px-4 py-2.5">Size</th>
                                <th className="px-4 py-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-600 dark:text-gray-300">
                              {backupHistory.map((b, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                                  <td className="px-4 py-2 truncate max-w-xs" title={b.fileName}>
                                    {b.fileName}
                                  </td>
                                  <td className="px-4 py-2 shrink-0">
                                    {(b.sizeBytes / 1024 / 1024).toFixed(2)} MB
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <button
                                      type="button"
                                      disabled={restoringBackup}
                                      onClick={() => handleRestoreBackup(b.filePath)}
                                      className="px-2.5 py-1 text-[10px] font-bold bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded transition-colors"
                                    >
                                      Restore
                                    </button>
                                  </td>
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
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiActivity className="w-3.5 h-3.5" />
                      Diagnostics & System Health
                    </h4>
                    
                    {diagnostics && diagnostics.memoryUsage ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50/50 dark:bg-gray-800/25 border border-gray-100 dark:border-gray-800 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Database Status</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${diagnostics.databaseAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                              {diagnostics.databaseAvailable ? 'ONLINE' : 'OFFLINE'}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50/50 dark:bg-gray-800/25 border border-gray-100 dark:border-gray-800 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Disk Write Status</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${diagnostics.diskWrite === 'OK' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                              {diagnostics.diskWrite === 'OK' ? 'WRITE OK' : 'FAILED'}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50/50 dark:bg-gray-800/25 border border-gray-100 dark:border-gray-800 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Memory Heap Usage</span>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                              {diagnostics.memoryUsage.heapUsed} / {diagnostics.memoryUsage.heapTotal}
                            </span>
                            {diagnostics.memoryUsage.warning && (
                              <FiAlertTriangle className="w-3.5 h-3.5 text-amber-500" title="High memory usage warning" />
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50/50 dark:bg-gray-800/25 border border-gray-100 dark:border-gray-800 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Uptime</span>
                          <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                            {Math.floor(parseInt(diagnostics.uptime) / 3600)}h {Math.floor((parseInt(diagnostics.uptime) % 3600) / 60)}m
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50/50 dark:bg-gray-800/25 border border-gray-100 dark:border-gray-850 rounded-xl text-center text-xs text-gray-450 italic">
                        Diagnostics loading...
                      </div>
                    )}

                    {/* Database Health Checker */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                          Integrity Checker
                        </span>
                        <button
                          type="button"
                          disabled={runningHealthCheck}
                          onClick={handleRunHealthCheck}
                          className="px-3 py-1 bg-brand-primary hover:bg-brand-primaryDark disabled:bg-brand-primary/60 text-white text-[10px] font-bold rounded transition-colors inline-flex items-center gap-1"
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
                        <div className="bg-gray-55/40 dark:bg-gray-800/15 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-500 dark:text-gray-455">Overall Health</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              integrityReport.healthy 
                                ? 'bg-emerald-500/15 text-emerald-500' 
                                : 'bg-red-500/15 text-red-500'
                            }`}>
                              {integrityReport.healthy ? 'HEALTHY' : 'ISSUES DETECTED'}
                            </span>
                          </div>

                          <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-gray-800">
                            {integrityReport.reports.map((r, idx) => (
                              <div key={idx} className="flex items-start justify-between gap-4 text-[10px] font-medium leading-normal">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-gray-700 dark:text-gray-300">{r.check}</p>
                                  <p className="text-gray-400 dark:text-gray-555">{r.message}</p>
                                </div>
                                <span className={`font-bold shrink-0 ${r.status === 'PASS' ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {r.status}
                                </span>
                              </div>
                            ))}
                          </div>

                          {integrityReport.audit && (
                            <div className="mt-3 pt-3 border-t border-gray-150 dark:border-gray-850 space-y-2">
                              <p className="text-[10px] font-bold text-gray-405 dark:text-gray-400 uppercase tracking-wider">Table Row Audit & Integrity</p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-[10px] text-left border-collapse">
                                  <thead>
                                    <tr className="text-gray-405 dark:text-gray-450 font-bold border-b border-gray-100 dark:border-gray-800">
                                      <th className="py-1">Table</th>
                                      <th className="py-1 text-center">Total</th>
                                      <th className="py-1 text-center">Active/Done</th>
                                      <th className="py-1 text-center">Inactive/Pend</th>
                                      <th className="py-1 text-right">Orphaned</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
                                    {Object.entries(integrityReport.audit).map(([table, meta]) => (
                                      <tr key={table} className="text-gray-650 dark:text-gray-350 hover:bg-gray-100/20">
                                        <td className="py-1 font-semibold capitalize">{table.replace('_', ' ')}</td>
                                        <td className="py-1 text-center font-mono font-medium">{meta.total}</td>
                                        <td className="py-1 text-center font-mono font-medium text-green-600 dark:text-green-500">{meta.active}</td>
                                        <td className="py-1 text-center font-mono font-medium text-amber-600 dark:text-amber-500">{meta.inactive}</td>
                                        <td className="py-1 text-right font-mono font-bold">
                                          {meta.orphaned > 0 ? (
                                            <span className="text-red-500 bg-red-500/10 px-1 py-0.5 rounded text-[9px]">
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
                        <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl font-medium italic">
                          Click "Run Health Check" to perform structural database audits.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. About Application & Developer Information */}
            <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-6 md:col-span-2 space-y-6 select-none">
              
              {/* Header with Himmel Logo & Main App Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-150 shrink-0 inline-flex items-center justify-center">
                    <CompanyLogo className="h-10 w-auto object-contain drop-shadow-sm" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                      Himmel Pharmaceutical Sales Management System
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                      Enterprise Sales &amp; Distribution Management Platform
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-red-400 rounded-full border border-brand-primary/20">
                    v{appConfig.version || APP_VERSION}
                  </span>
                  <span className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                    Stable Release
                  </span>
                </div>
              </div>

              {/* Application Details & Description Card */}
              <div className="bg-gray-50/60 dark:bg-gray-800/25 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  <FiInfo className="w-4 h-4 text-brand-primary" />
                  <span>Application Information</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
                  Enterprise Pharmaceutical Sales &amp; Distribution Management System designed for managing Products, Doctors, Institutions, Areas, Team Members, Sales, Orders, Reporting, Analytics, Business Year Management, and Enterprise Backup &amp; Recovery.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-3 border-t border-gray-150 dark:border-gray-800/60 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Application Name</span>
                    <p className="font-bold text-gray-800 dark:text-white mt-0.5">Himmel Pharmaceutical Sales Management System</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Installed Version</span>
                    <p className="font-bold text-gray-800 dark:text-white mt-0.5">v{appConfig.version || APP_VERSION}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Release Channel</span>
                    <p className="font-bold text-gray-800 dark:text-white mt-0.5">Production</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Build Type</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Stable Release</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Build Date</span>
                    <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{appConfig.buildDate || '2026-08-01'}</p>
                  </div>
                </div>
              </div>


              {/* Developer & System Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Developer Information Card */}
                <div className="bg-gray-50/60 dark:bg-gray-800/25 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 pb-2.5 border-b border-gray-150 dark:border-gray-800 mb-3">
                      <FiCode className="w-4 h-4 text-brand-primary" />
                      <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider">Developer Information</h3>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/40">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Developer</span>
                        <span className="font-extrabold text-gray-900 dark:text-white">Huzaifa Imtiaz</span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/40">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">Software Engineer</span>
                      </div>

                      <div className="flex justify-between items-center py-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Copyright</span>
                        <span className="font-semibold text-gray-600 dark:text-gray-400">© 2026 Huzaifa Imtiaz</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-gray-400 dark:text-gray-500 font-semibold italic text-center border-t border-gray-100 dark:border-gray-800/40">
                    All Rights Reserved.
                  </div>
                </div>

                {/* System Information Card */}
                <div className="bg-gray-50/60 dark:bg-gray-800/25 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-gray-150 dark:border-gray-800">
                    <FiCpu className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider">System Information</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">App Version</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">v{appConfig.version || APP_VERSION}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Electron</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">v{appConfig.electronVersion || '42.0.1'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Node.js</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">v{appConfig.nodeVersion || '20.11.0'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Chromium</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">v{appConfig.chromeVersion || '124.0.0'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">React</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">v{appConfig.reactVersion || '18.3.1'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Database Engine</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{appConfig.dbEngine || 'SQLite (better-sqlite3)'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Platform</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{appConfig.platform || 'Windows (win32)'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Architecture</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{appConfig.arch || 'x64'}</span>
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

      {/* Database Restore Confirm Dialog */}
      <ConfirmDialog
        open={showRestoreConfirm}
        title="Restore Database Backup"
        message="CRITICAL WARNING: Are you sure you want to restore the database from this backup? This will replace all current data, log you out, and restart the application immediately."
        confirmText="Restore & Relaunch"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmRestoreBackup}
        onCancel={() => setShowRestoreConfirm(false)}
      />

      {/* Logo URL Prompt Dialog */}
      <PromptDialog
        open={showLogoPrompt}
        title="Update Company Logo"
        message="Enter the image URL for the Company Logo:"
        placeholder="https://example.com/logo.png"
        defaultValue={companyInfo.logo}
        confirmText="Update Logo"
        cancelText="Cancel"
        confirmVariant="primary"
        onConfirm={handleConfirmLogoChange}
        onCancel={() => setShowLogoPrompt(false)}
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


