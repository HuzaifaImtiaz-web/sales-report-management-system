import React, { useState, useEffect } from 'react';
import { FiLock, FiShield, FiUserCheck, FiUserX, FiKey, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import EnterprisePasswordInput from '../common/EnterprisePasswordInput';
import { validatePassword } from '../../utils/passwordPolicy';

const RECOVERY_PASSWORD_DEFAULT = 'Recovery@123';
const RECOVERY_PIN_DEFAULT = '1234';

const EmergencyRecoveryModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1 = Auth Check, 2 = Users List
  const [authMode, setAuthMode] = useState('password'); // 'password' | 'pin'

  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Reset Password Sub-Modal
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setAuthMode('password');
      setRecoveryPassword('');
      setRecoveryPin('');
      setPasswordError('');
      setUsers([]);
      setResetModalUser(null);
      setNotification(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleVerifyAuth = async (e) => {
    e.preventDefault();
    setPasswordError('');

    setIsVerifying(true);
    try {
      const api = window.api || window.electronAPI;

      if (authMode === 'password') {
        if (!recoveryPassword) {
          setPasswordError('Emergency recovery password is required.');
          setIsVerifying(false);
          return;
        }

        if (api && api.recovery) {
          const res = await api.recovery.verifyPassword(recoveryPassword);
          if (res && res.success !== false) {
            setStep(2);
            fetchUsers();
          } else {
            setPasswordError(res?.error || 'Invalid emergency recovery password.');
          }
        } else {
          if (recoveryPassword === RECOVERY_PASSWORD_DEFAULT) {
            setStep(2);
            fetchUsers();
          } else {
            setPasswordError('Invalid emergency recovery password.');
          }
        }
      } else {
        // PIN Mode
        if (!/^\d{4,8}$/.test(recoveryPin)) {
          setPasswordError('Recovery PIN must be 4 to 8 numeric digits.');
          setIsVerifying(false);
          return;
        }

        if (api && api.auth && api.auth.verifyRecoveryPin) {
          const res = await api.auth.verifyRecoveryPin(recoveryPin);
          if (res && res.success !== false) {
            setStep(2);
            fetchUsers();
          } else {
            setPasswordError(res?.error || 'Invalid recovery PIN.');
          }
        } else {
          if (recoveryPin === RECOVERY_PIN_DEFAULT) {
            setStep(2);
            fetchUsers();
          } else {
            setPasswordError('Invalid recovery PIN.');
          }
        }
      }
    } catch (err) {
      setPasswordError(err.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const api = window.api || window.electronAPI;
      if (api && api.recovery) {
        const res = await api.recovery.getUsers();
        if (res && res.success !== false) {
          setUsers(res.data || res || []);
        } else {
          showToast(res?.error || 'Failed to load user list', 'error');
        }
      } else {
        const storedWebUsers = JSON.parse(localStorage.getItem('himmel_web_users') || '[]');
        const defaultAdmin = {
          id: 1,
          username: 'admin',
          fullName: 'System Administrator',
          role: 'Admin',
          isActive: true,
          status: 'Enabled'
        };

        const existingAdmin = storedWebUsers.find((u) => u.username.toLowerCase() === 'admin');
        const list = existingAdmin ? storedWebUsers : [defaultAdmin, ...storedWebUsers];
        setUsers(
          list.map((u) => ({
            ...u,
            isActive: u.isActive !== false,
            status: u.isActive !== false ? 'Enabled' : 'Disabled'
          }))
        );
      }
    } catch (err) {
      showToast(err.message || 'Failed to load user list', 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const api = window.api || window.electronAPI;
      const targetStatus = !user.isActive;

      if (api && api.recovery) {
        const res = await api.recovery.toggleStatus({ username: user.username, targetStatus });
        if (res && res.success !== false) {
          const actionLabel = targetStatus ? 'enabled' : 'disabled';
          showToast(`User '${user.username}' successfully ${actionLabel}.`, 'success');
          fetchUsers();
        } else {
          showToast(res?.error || 'Failed to update user status.', 'error');
        }
      } else {
        const storedWebUsers = JSON.parse(localStorage.getItem('himmel_web_users') || '[]');
        const updatedList = users.map((u) =>
          u.username.toLowerCase() === user.username.toLowerCase()
            ? { ...u, isActive: targetStatus, status: targetStatus ? 'Enabled' : 'Disabled' }
            : u
        );
        setUsers(updatedList);
        localStorage.setItem('himmel_web_users', JSON.stringify(updatedList));
        showToast(`User '${user.username}' successfully ${targetStatus ? 'enabled' : 'disabled'}.`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update user status.', 'error');
    }
  };

  const handleOpenResetModal = (user) => {
    setResetModalUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError('');

    const policy = validatePassword(newPassword);
    if (!policy.isValid) {
      setResetError('New password does not meet security requirements.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('New password and confirm password do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const api = window.api || window.electronAPI;
      if (api && api.recovery) {
        const res = await api.recovery.resetPassword({
          username: resetModalUser.username,
          newPassword,
          confirmPassword
        });

        if (res && res.success !== false) {
          showToast(`Password for user '${resetModalUser.username}' successfully reset.`, 'success');
          setResetModalUser(null);
        } else {
          setResetError(res?.error || 'Failed to reset password.');
        }
      } else {
        showToast(`Password for user '${resetModalUser.username}' successfully reset.`, 'success');
        setResetModalUser(null);
      }
    } catch (err) {
      setResetError(err.message || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transition-all duration-300">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#801317] via-[#A91D22] to-[#600D10] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FiShield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide uppercase">
                Emergency Recovery Mode
              </h2>
              <p className="text-[10px] text-white/80 font-medium">
                Admin Account & Access Recovery Utility
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-white/80 hover:text-white"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {notification && (
          <div
            className={`p-3 text-xs font-semibold flex items-center gap-2 ${
              notification.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-b border-red-200 dark:border-red-900/40'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-900/40'
            }`}
          >
            {notification.type === 'error' ? (
              <FiAlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <FiCheckCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* STEP 1: Authentication Entry */}
        {step === 1 && (
          <div className="p-6 max-w-md mx-auto space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 text-brand-primary dark:text-red-400 flex items-center justify-center mx-auto mb-3">
                <FiLock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white uppercase">
                {authMode === 'password' ? 'Enter Recovery Password' : 'Enter Recovery PIN'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {authMode === 'password'
                  ? 'Please enter the emergency recovery password to authorize administrator access recovery.'
                  : 'Please enter your 4–8 digit numeric Recovery PIN to authorize access.'}
              </p>
            </div>

            <form onSubmit={handleVerifyAuth} className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100 dark:border-red-900/30">
                  <FiAlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {authMode === 'password' ? (
                <EnterprisePasswordInput
                  id="recovery-password-input"
                  label="Emergency Recovery Password"
                  value={recoveryPassword}
                  onChange={(e) => setRecoveryPassword(e.target.value)}
                  placeholder="Enter recovery password..."
                  required={true}
                />
              ) : (
                <EnterprisePasswordInput
                  id="recovery-pin-input"
                  label="Emergency Recovery PIN (4–8 Digits)"
                  value={recoveryPin}
                  onChange={(e) => setRecoveryPin(e.target.value.replace(/\D/g, ''))}
                  isPin={true}
                  maxLength={8}
                  placeholder="Enter recovery PIN..."
                  required={true}
                />
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'password' ? 'pin' : 'password');
                    setPasswordError('');
                  }}
                  className="text-[11px] font-bold text-brand-primary dark:text-red-400 hover:underline uppercase cursor-pointer"
                >
                  {authMode === 'password' ? 'Use Recovery PIN Instead' : 'Use Recovery Password Instead'}
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-slate-300 text-xs font-bold uppercase rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-3 bg-brand-primary hover:bg-[#8F161A] text-white text-xs font-bold uppercase rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? 'Verifying...' : 'Authenticate'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Emergency Recovery User Management */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-800 dark:text-white uppercase">
                  Account Recovery Control Panel
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Manage account statuses and reset passwords for system users.
                </p>
              </div>
              <button
                onClick={fetchUsers}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Refresh List
              </button>
            </div>

            {/* Users Table */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    <th className="p-3.5">Username</th>
                    <th className="p-3.5">Full Name</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-medium">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400">
                        Loading system accounts...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id || user.username}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-3.5 font-bold text-gray-800 dark:text-white">{user.username}</td>
                        <td className="p-3.5 text-gray-600 dark:text-slate-300">{user.fullName}</td>
                        <td className="p-3.5 text-gray-500 dark:text-slate-400">{user.role}</td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              user.isActive
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                                : 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {user.isActive ? <FiUserCheck className="w-3 h-3" /> : <FiUserX className="w-3 h-3" />}
                            {user.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`px-3 py-1.5 text-[11px] font-bold uppercase rounded-lg transition-colors cursor-pointer ${
                              user.isActive
                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-200'
                                : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200'
                            }`}
                          >
                            {user.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleOpenResetModal(user)}
                            className="px-3 py-1.5 text-[11px] font-bold uppercase rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <FiKey className="w-3 h-3" />
                            Reset Password
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
              >
                Close Recovery Mode
              </button>
            </div>
          </div>
        )}

        {/* SUB-MODAL: Reset User Password */}
        {resetModalUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <FiKey className="w-5 h-5 text-brand-primary dark:text-red-400" />
                  <h4 className="text-sm font-bold text-gray-800 dark:text-white uppercase">
                    Reset User Password
                  </h4>
                </div>
                <button
                  onClick={() => setResetModalUser(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl text-xs space-y-1">
                <p className="font-bold text-gray-800 dark:text-white">Target Account: {resetModalUser.username}</p>
                <p className="text-gray-500 dark:text-slate-400">
                  {resetModalUser.fullName} ({resetModalUser.role})
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                {resetError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium flex items-center gap-2">
                    <FiAlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <EnterprisePasswordInput
                  id="reset-modal-new-password"
                  label="New User Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  showRules={true}
                  placeholder="Enter strong password"
                />

                <EnterprisePasswordInput
                  id="reset-modal-confirm-password"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  confirmValue={newPassword}
                  placeholder="Re-enter new password"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-slate-300 text-xs font-bold uppercase rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 py-2.5 bg-brand-primary hover:bg-[#8F161A] text-white text-xs font-bold uppercase rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isResetting ? 'Saving...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EmergencyRecoveryModal;
