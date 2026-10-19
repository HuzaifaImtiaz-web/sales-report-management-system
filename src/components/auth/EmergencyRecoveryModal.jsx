import React, { useState, useEffect } from 'react';
import { FiLock, FiShield, FiUserCheck, FiUserX, FiKey, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import EnterprisePasswordInput from '../common/EnterprisePasswordInput';
import { validatePassword } from '../../utils/passwordPolicy';

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

  // Every check happens on the server; a successful one opens a short recovery session there.
  const handleVerifyAuth = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (authMode === 'password' && !recoveryPassword) {
      setPasswordError('Emergency recovery password is required.');
      return;
    }
    if (authMode === 'pin' && !/^\d{4,8}$/.test(recoveryPin)) {
      setPasswordError('Recovery PIN must be 4 to 8 numeric digits.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = authMode === 'password'
        ? await window.api.recovery.verifyPassword(recoveryPassword)
        : await window.api.auth.verifyRecoveryPin(recoveryPin);
      if (res && res.success) {
        setRecoveryPassword('');
        setRecoveryPin('');
        setStep(2);
        fetchUsers();
      } else {
        setPasswordError(res?.error || (authMode === 'password' ? 'Invalid emergency recovery password.' : 'Invalid recovery PIN.'));
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
      const res = await window.api.recovery.getUsers();
      if (res && res.success) {
        setUsers(res.data || []);
      } else {
        showToast(res?.error || 'Failed to load user list', 'error');
        if (/expired/i.test(res?.error || '')) setStep(1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load user list', 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const targetStatus = !user.isActive;
      const res = await window.api.recovery.toggleStatus({ username: user.username, targetStatus });
      if (res && res.success) {
        showToast(`User '${user.username}' successfully ${targetStatus ? 'enabled' : 'disabled'}.`, 'success');
        fetchUsers();
      } else {
        showToast(res?.error || 'Failed to update user status.', 'error');
        if (/expired/i.test(res?.error || '')) setStep(1);
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

    const policy = validatePassword(newPassword, { username: resetModalUser.username });
    if (!policy.isValid) {
      setResetError(policy.errors[0] || 'New password does not meet security requirements.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('New password and confirm password do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await window.api.recovery.resetPassword({
        username: resetModalUser.username,
        newPassword,
        confirmPassword
      });
      if (res && res.success) {
        showToast(`Password for user '${resetModalUser.username}' successfully reset.`, 'success');
        setResetModalUser(null);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setResetError(res?.error || 'Failed to reset password.');
      }
    } catch (err) {
      setResetError(err.message || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-brand-navyLine rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transition-all duration-300">
        
        {/* Header Bar */}
        <div className="bg-brand-primary text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FiShield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">
                Emergency Recovery Mode
              </h2>
              <p className="text-xs text-white/80 font-medium">
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
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
                  className="text-[11px] font-semibold text-brand-primary dark:text-red-400 hover:underline cursor-pointer"
                >
                  {authMode === 'password' ? 'Use Recovery PIN Instead' : 'Use Recovery Password Instead'}
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-gray-200 dark:border-brand-navyLine text-gray-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-3 bg-brand-primary hover:bg-[#8F161A] text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
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
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                  Account Recovery Control Panel
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Manage account statuses and reset passwords for system users.
                </p>
              </div>
              <button
                onClick={fetchUsers}
                className="px-3 py-1.5 border border-gray-200 dark:border-brand-navyLine text-xs font-semibold text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Refresh List
              </button>
            </div>

            {/* Users Table */}
            <div className="border border-gray-200 dark:border-brand-navyLine rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-brand-navyCard border-b border-gray-200 dark:border-brand-navyLine text-xs font-semibold text-gray-500">
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
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        Loading system accounts...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id || user.username}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-3.5 font-semibold text-gray-800 dark:text-white">{user.username}</td>
                        <td className="p-3.5 text-gray-600 dark:text-slate-300">{user.fullName}</td>
                        <td className="p-3.5 text-gray-500 dark:text-slate-400">{user.role}</td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold  ${
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
                            className={`px-3 py-1.5 text-[11px] font-semibold  rounded-lg transition-colors cursor-pointer ${
                              user.isActive
                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-200'
                                : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200'
                            }`}
                          >
                            {user.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleOpenResetModal(user)}
                            className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-400 hover:bg-gray-200 transition-colors cursor-pointer inline-flex items-center gap-1"
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
                className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Recovery Mode
              </button>
            </div>
          </div>
        )}

        {/* SUB-MODAL: Reset User Password */}
        {resetModalUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-brand-navyLine rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-brand-navyLine pb-3">
                <div className="flex items-center gap-2">
                  <FiKey className="w-5 h-5 text-brand-primary dark:text-red-400" />
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                    Reset User Password
                  </h4>
                </div>
                <button
                  onClick={() => setResetModalUser(null)}
                  className="text-gray-500 hover:text-gray-600 dark:hover:text-white"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-brand-navyCard p-3 rounded-xl text-xs space-y-1">
                <p className="font-semibold text-gray-800 dark:text-white">Target Account: {resetModalUser.username}</p>
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
                    className="flex-1 py-2.5 border border-gray-200 dark:border-brand-navyLine text-gray-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 py-2.5 bg-brand-primary hover:bg-[#8F161A] text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
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
