import React, { useState } from 'react';
import { FiShield, FiCheckCircle, FiLock, FiKey, FiUser, FiArrowRight } from 'react-icons/fi';
import EnterprisePasswordInput from '../common/EnterprisePasswordInput';
import { validatePassword } from '../../utils/passwordPolicy';

const FirstLoginSecurityWizard = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState(1);

  // Form fields
  const [newUsername, setNewUsername] = useState('admin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [confirmRecoveryPassword, setConfirmRecoveryPassword] = useState('');

  const [recoveryPin, setRecoveryPin] = useState('');
  const [confirmRecoveryPin, setConfirmRecoveryPin] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validateStep2 = () => {
    setError('');
    if (!newUsername.trim() || newUsername.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return false;
    }
    const policy = validatePassword(newPassword);
    if (!policy.isValid) {
      setError('New password does not meet security requirements.');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    setError('');
    const policy = validatePassword(recoveryPassword);
    if (!policy.isValid) {
      setError('Recovery password does not meet security requirements.');
      return false;
    }
    if (recoveryPassword !== confirmRecoveryPassword) {
      setError('Recovery passwords do not match.');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    setError('');
    if (!/^\d{4,8}$/.test(recoveryPin)) {
      setError('Recovery PIN must be 4 to 8 numeric digits.');
      return false;
    }
    if (recoveryPin !== confirmRecoveryPin) {
      setError('Recovery PINs do not match.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    } else if (step === 3) {
      if (validateStep3()) setStep(4);
    } else if (step === 4) {
      if (validateStep4()) handleSubmitFinal();
    }
  };

  const handleSubmitFinal = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      if (window.api?.auth?.completeFirstLoginWizard) {
        const res = await window.api.auth.completeFirstLoginWizard({
          newUsername: newUsername.trim(),
          newPassword,
          recoveryPassword,
          recoveryPin
        });
        if (res && res.success) {
          setStep(5);
        } else {
          setError(res?.error || 'Failed to complete security setup.');
        }
      } else {
        setStep(5);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during security setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#801317] via-[#A91D22] to-[#600D10] text-white p-6 relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl">
              <FiShield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold uppercase tracking-wider">
                First-Time Security Setup
              </h2>
              <p className="text-xs text-white/80 font-medium">
                Mandatory enterprise security initialization
              </p>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center gap-1.5 mt-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  step >= i ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* STEP 1: Welcome & Default Notice */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl space-y-2">
                <div className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">
                  ⚠️ Default Credentials Detected
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                  You are currently logged in with default administrator credentials:
                </p>
                <div className="text-xs font-mono bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/40 text-gray-800 dark:text-gray-200">
                  Username: <span className="font-bold text-amber-600">admin</span> | Password: <span className="font-bold text-amber-600">Password123!</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  For corporate data compliance, you must update your login credentials and establish recovery parameters before accessing the system.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Change Username & Password */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                <FiUser className="w-4 h-4 text-brand-primary" />
                <span>Step 1 of 3 — Corporate Login Credentials</span>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  New Admin Username *
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. sysadmin"
                  className="w-full px-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-brand-primary"
                />
              </div>

              <EnterprisePasswordInput
                id="wizard-new-password"
                label="New Admin Password *"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                showRules={true}
                placeholder="Enter new strong password"
              />

              <EnterprisePasswordInput
                id="wizard-confirm-password"
                label="Confirm New Admin Password *"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                confirmValue={newPassword}
                placeholder="Re-enter new password"
              />
            </div>
          )}

          {/* STEP 3: Create Recovery Password */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                <FiKey className="w-4 h-4 text-brand-primary" />
                <span>Step 2 of 3 — Emergency Recovery Password</span>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                The Recovery Password authorizes offline administrative unlock and password resets in emergency scenarios.
              </p>

              <EnterprisePasswordInput
                id="wizard-recovery-password"
                label="New Recovery Password *"
                value={recoveryPassword}
                onChange={(e) => setRecoveryPassword(e.target.value)}
                showRules={true}
                placeholder="Enter emergency recovery password"
              />

              <EnterprisePasswordInput
                id="wizard-confirm-recovery-password"
                label="Confirm Recovery Password *"
                value={confirmRecoveryPassword}
                onChange={(e) => setConfirmRecoveryPassword(e.target.value)}
                confirmValue={recoveryPassword}
                placeholder="Re-enter recovery password"
              />
            </div>
          )}

          {/* STEP 4: Create Recovery PIN */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                <FiLock className="w-4 h-4 text-brand-primary" />
                <span>Step 3 of 3 — Recovery PIN</span>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                The Recovery PIN is a 4-to-8 digit numeric code used to authorize resetting the Recovery Password if forgotten.
              </p>

              <EnterprisePasswordInput
                id="wizard-recovery-pin"
                label="New Recovery PIN (4–8 Digits) *"
                value={recoveryPin}
                onChange={(e) => setRecoveryPin(e.target.value.replace(/\D/g, ''))}
                isPin={true}
                maxLength={8}
                placeholder="e.g. 8492"
              />

              <EnterprisePasswordInput
                id="wizard-confirm-recovery-pin"
                label="Confirm Recovery PIN *"
                value={confirmRecoveryPin}
                onChange={(e) => setConfirmRecoveryPin(e.target.value.replace(/\D/g, ''))}
                confirmValue={recoveryPin}
                isPin={true}
                maxLength={8}
                placeholder="Re-enter PIN"
              />
            </div>
          )}

          {/* STEP 5: Success Screen */}
          {step === 5 && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <FiCheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-wider">
                  System Secured Successfully
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Your administrator credentials, emergency recovery password, and PIN have been encrypted and saved.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-150 dark:border-gray-800 flex justify-end gap-2">
          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-primary hover:bg-[#8F161A] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{step === 4 ? (isSubmitting ? 'Saving...' : 'Finish Setup') : 'Next Step'}</span>
              <FiArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onComplete}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
            >
              Continue to Dashboard
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default FirstLoginSecurityWizard;
