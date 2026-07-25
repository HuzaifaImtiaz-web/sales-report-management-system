import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Toast from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  FiUserPlus, FiUserCheck, FiUserMinus, FiShield,
  FiSearch, FiLock, FiUnlock, FiCheckCircle, FiXCircle, FiKey, FiEdit, FiFilter,
  FiTrash2, FiAlertTriangle
} from 'react-icons/fi';
import EnterprisePasswordInput from '../../components/common/EnterprisePasswordInput';

const UserManagement = () => {
  const { user, hasPermission } = useAuth();
  const { addNotification } = useNotifications();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create User Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'Sales Representative'
  });

  // Edit User Modal State
  const [editTargetUser, setEditTargetUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    role: 'Sales Representative'
  });

  // Password Reset Modal State
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetConfirmPasswordVal, setResetConfirmPasswordVal] = useState('');

  // Delete User Confirmation State
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    if (deleteTargetUser.username.toLowerCase() === 'admin') {
      setToast({ message: 'The primary system administrator account cannot be deleted.', type: 'error' });
      setDeleteTargetUser(null);
      return;
    }

    try {
      if (window.api && window.api.auth) {
        const res = await window.api.auth.deleteUser(deleteTargetUser.username);
        if (res && res.success !== false) {
          setToast({ message: `User account '${deleteTargetUser.username}' deleted successfully.`, type: 'success' });
          addNotification({ title: 'User Deleted', message: `Account '${deleteTargetUser.username}' was permanently removed.`, type: 'warning' });
          setDeleteTargetUser(null);
          loadUsers();
        } else {
          setToast({ message: res?.error || 'Failed to delete user.', type: 'error' });
        }
      } else {
        // Web fallback
        const storedWebUsers = JSON.parse(localStorage.getItem('himmel_web_users') || '[]');
        const updated = storedWebUsers.filter(u => u.username.toLowerCase() !== deleteTargetUser.username.toLowerCase());
        localStorage.setItem('himmel_web_users', JSON.stringify(updated));
        setToast({ message: `User account '${deleteTargetUser.username}' deleted successfully.`, type: 'success' });
        setDeleteTargetUser(null);
        loadUsers();
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
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

  const loadUsers = async () => {
    try {
      if (window.api && window.api.auth) {
        const res = await window.api.auth.getAllUsers();
        if (res && res.success) {
          setUsers(res.data || []);
        } else {
          setToast({ message: res?.error || 'Failed to load users.', type: 'error' });
        }
      } else {
        // Web mode fallback
        const storedWebUsers = JSON.parse(localStorage.getItem('himmel_web_users') || '[]');
        const defaultAdmin = {
          id: 1,
          username: 'admin',
          fullName: 'System Administrator',
          role: 'Admin',
          isActive: true,
          failedAttempts: 0,
          lockedUntil: null,
          lastLogin: new Date().toISOString()
        };
        const existingAdmin = storedWebUsers.find(u => u.username.toLowerCase() === 'admin');
        setUsers(existingAdmin ? storedWebUsers : [defaultAdmin, ...storedWebUsers]);
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (!hasPermission('settings.users') && user?.role !== 'Admin') {
    return (
      <DashboardLayout pageTitle="Access Denied">
        <div className="flex h-[60vh] flex-col items-center justify-center text-center p-6">
          <FiXCircle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white uppercase tracking-wider">Access Denied</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-md">
            You do not have the required permissions to view the User Management screen. Please contact your system administrator if you believe this is an error.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setToast(null);

    if (newUser.fullName.trim().length < 2) {
      setToast({ message: 'Full name must be at least 2 characters.', type: 'error' });
      return;
    }
    if (newUser.username.trim().length < 3) {
      setToast({ message: 'Username must be at least 3 characters.', type: 'error' });
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    const policy = checkPasswordPolicy(newUser.password);
    if (!Object.values(policy).every(Boolean)) {
      setToast({ message: 'Password does not meet policy requirements.', type: 'error' });
      return;
    }

    try {
      if (window.api && window.api.auth) {
        const backendRole = newUser.role === 'Administrator' ? 'Admin' : newUser.role;
        const res = await window.api.auth.createUser({
          username: newUser.username.trim(),
          password: newUser.password,
          fullName: newUser.fullName.trim(),
          role: backendRole
        });

        if (res && res.success) {
          setToast({ message: `User account '${newUser.username}' created successfully.`, type: 'success' });
          addNotification({ title: 'User Created', message: `Account '${newUser.username}' created by admin.`, type: 'info' });
          setShowCreateModal(false);
          setNewUser({ fullName: '', username: '', password: '', confirmPassword: '', role: 'Sales Representative' });
          loadUsers();
        } else {
          setToast({ message: res?.error || 'Failed to create user.', type: 'error' });
        }
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleOpenEdit = (targetUser) => {
    setEditTargetUser(targetUser);
    setEditForm({
      fullName: targetUser.fullName,
      role: targetUser.role === 'Admin' ? 'Administrator' : targetUser.role
    });
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.fullName.trim()) return;

    try {
      if (window.api && window.api.auth) {
        const backendRole = editForm.role === 'Administrator' ? 'Admin' : editForm.role;
        const res = await window.api.auth.changeRole(editTargetUser.username, backendRole);
        if (res && res.success) {
          setToast({ message: `Updated details for '${editTargetUser.username}'.`, type: 'success' });
          setEditTargetUser(null);
          loadUsers();
        } else {
          setToast({ message: res?.error || 'Failed to update user details.', type: 'error' });
        }
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleToggleActive = async (targetUser) => {
    try {
      if (window.api && window.api.auth) {
        let res;
        if (targetUser.isActive) {
          res = await window.api.auth.disableUser(targetUser.username);
        } else {
          res = await window.api.auth.activateUser(targetUser.username);
        }

        if (res && res.success) {
          const statusText = targetUser.isActive ? 'disabled' : 'activated';
          setToast({ message: `User '${targetUser.username}' has been ${statusText}.`, type: 'success' });
          addNotification({ title: 'User Status Updated', message: `User '${targetUser.username}' was ${statusText}.`, type: 'warning' });
          loadUsers();
        } else {
          setToast({ message: res?.error || 'Operation failed.', type: 'error' });
        }
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleUnlockAccount = async (targetUser) => {
    try {
      if (window.api && window.api.recovery) {
        const res = await window.api.recovery.toggleStatus({ username: targetUser.username, targetStatus: true });
        if (res && res.success !== false) {
          setToast({ message: `Account '${targetUser.username}' unlocked successfully.`, type: 'success' });
          loadUsers();
        } else {
          setToast({ message: res?.error || 'Failed to unlock account.', type: 'error' });
        }
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (resetPasswordVal !== resetConfirmPasswordVal) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    const policy = checkPasswordPolicy(resetPasswordVal);
    if (!Object.values(policy).every(Boolean)) {
      setToast({ message: 'Password does not meet policy requirements.', type: 'error' });
      return;
    }

    try {
      if (window.api && window.api.auth) {
        const res = await window.api.auth.resetPassword({
          username: resetTargetUser.username,
          newPassword: resetPasswordVal
        });

        if (res && res.success) {
          setToast({ message: `Password reset successfully for '${resetTargetUser.username}'.`, type: 'success' });
          addNotification({ title: 'Password Reset', message: `Password reset for user '${resetTargetUser.username}'.`, type: 'info' });
          setResetTargetUser(null);
          setResetPasswordVal('');
          setResetConfirmPasswordVal('');
        } else {
          setToast({ message: res?.error || 'Failed to reset password.', type: 'error' });
        }
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());

    const isLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date();

    const matchesRole = roleFilter === 'ALL' || u.role.toLowerCase() === roleFilter.toLowerCase() || (roleFilter === 'Admin' && u.role === 'Administrator');
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.isActive && !isLocked) ||
      (statusFilter === 'DISABLED' && !u.isActive) ||
      (statusFilter === 'LOCKED' && isLocked);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const createPolicy = checkPasswordPolicy(newUser.password);
  const resetPolicy = checkPasswordPolicy(resetPasswordVal);

  return (
    <DashboardLayout pageTitle="User Management">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
              Enterprise User Administration
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-1">
              Central control panel for user provisioning, role assignments, security locks, and credential management.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-brand-primary hover:bg-[#8F161A] text-white text-xs font-bold rounded-xl transition-colors shadow-md inline-flex items-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <FiUserPlus className="w-4 h-4" />
            Create User Account
          </button>
        </div>

        {/* Search & Role/Status Filters Bar */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, username or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase">
              <FiFilter className="w-3.5 h-3.5" />
              Role:
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-200 outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Sales Representative">Sales Representative</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase ml-2">
              Status:
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-200 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
              <option value="LOCKED">Locked</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-900 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Last Login</th>
                  <th className="px-5 py-4">Failed Attempts</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400 font-semibold uppercase tracking-wider">
                      Loading system user directory...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400 font-semibold uppercase tracking-wider">
                      No user accounts match current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const displayRole = u.role === 'Admin' ? 'Administrator' : u.role;
                    const isLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date();

                    return (
                      <tr key={u.id || u.username} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-gray-800 dark:text-white capitalize">{u.fullName}</div>
                          <div className="text-[11px] text-gray-400 font-semibold">@{u.username}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                            {displayRole}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                              <FiLock className="w-3 h-3" />
                              Locked
                            </span>
                          ) : u.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                              <FiCheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                              <FiXCircle className="w-3 h-3" />
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-gray-500 dark:text-slate-400 font-medium text-[11px]">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            (u.failedAttempts || 0) > 0 ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' : 'text-gray-400'
                          }`}>
                            {u.failedAttempts || 0}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <FiEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setResetTargetUser(u)}
                            className="p-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <FiKey className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetUser(u)}
                            disabled={u.username.toLowerCase() === 'admin'}
                            className="p-1.5 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={u.username.toLowerCase() === 'admin' ? 'Primary Admin cannot be deleted' : 'Delete User'}
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                          {isLocked && (
                            <button
                              onClick={() => handleUnlockAccount(u)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
                            >
                              Unlock
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer ${
                              u.isActive
                                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {u.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 bg-brand-primary text-white">
              <div className="flex items-center gap-2">
                <FiUserPlus className="w-5 h-5" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Create Account</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-white/80 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="p-6 space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white outline-none"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Manager">Manager</option>
                    <option value="Sales Representative">Sales Representative</option>
                  </select>
                </div>
                <EnterprisePasswordInput
                  id="create-user-password"
                  label="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  showRules={true}
                  required={true}
                  placeholder="Enter strong password"
                />
                <EnterprisePasswordInput
                  id="create-user-confirm-password"
                  label="Confirm Password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                  confirmValue={newUser.password}
                  required={true}
                  placeholder="Re-enter password"
                />
              </div>
              <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-primary text-white text-xs font-bold uppercase rounded-xl">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 bg-brand-primary text-white">
              <div className="flex items-center gap-2">
                <FiEdit className="w-5 h-5" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Edit User @{editTargetUser.username}</h2>
              </div>
              <button onClick={() => setEditTargetUser(null)} className="text-white/80 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleEditUserSubmit}>
              <div className="p-6 space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white outline-none"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Manager">Manager</option>
                    <option value="Sales Representative">Sales Representative</option>
                  </select>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
                <button type="button" onClick={() => setEditTargetUser(null)} className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-primary text-white text-xs font-bold uppercase rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 bg-brand-primary text-white">
              <div className="flex items-center gap-2">
                <FiLock className="w-5 h-5" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Reset Password</h2>
              </div>
              <button onClick={() => setResetTargetUser(null)} className="text-white/80 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleResetPasswordSubmit}>
              <div className="p-6 space-y-4 text-xs font-semibold">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl text-xs">
                  Resetting password for user: <strong>@{resetTargetUser.username}</strong>
                </div>
                <EnterprisePasswordInput
                  id="reset-user-password"
                  label="New Password"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  showRules={true}
                  required={true}
                  placeholder="Enter strong password"
                />
                <EnterprisePasswordInput
                  id="reset-user-confirm-password"
                  label="Confirm New Password"
                  value={resetConfirmPasswordVal}
                  onChange={(e) => setResetConfirmPasswordVal(e.target.value)}
                  confirmValue={resetPasswordVal}
                  required={true}
                  placeholder="Re-enter password"
                />
              </div>
              <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
                <button type="button" onClick={() => setResetTargetUser(null)} className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-primary text-white text-xs font-bold uppercase rounded-xl">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 bg-rose-600 text-white">
              <div className="flex items-center gap-2">
                <FiTrash2 className="w-5 h-5" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Delete User Account</h2>
              </div>
              <button onClick={() => setDeleteTargetUser(null)} className="text-white/80 hover:text-white">&times;</button>
            </div>
            <div className="p-6 space-y-4 text-xs font-semibold">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900/50">
                <FiAlertTriangle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Permanent Action Warning</p>
                  <p className="text-xs text-red-600/90 dark:text-red-300/90 mt-1">
                    Are you sure you want to permanently delete user account <strong className="underline">@{deleteTargetUser.username}</strong> ({deleteTargetUser.fullName})?
                  </p>
                </div>
              </div>
              <p className="text-gray-500 dark:text-slate-400 text-xs">
                This action will remove their user record from the system authentication database. This action cannot be undone.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default UserManagement;
