import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import AuthCard from '../components/AuthCard';
import PrimaryButton from '../components/PrimaryButton';

const ResetSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-lightGray font-sans">
      <div className="w-full max-w-md space-y-6">
        <AuthCard>
          <div className="flex flex-col items-center text-center">
            <Logo />
            
            {/* Success Illustration Circle */}
            <div className="w-20 h-20 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-feedback-success shadow-soft my-8 animate-bounce">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-gray-900 leading-none">Password Reset Complete</h1>
            <p className="text-sm font-semibold text-gray-500 mt-3.5 max-w-[280px] leading-relaxed">
              Your password has been reset successfully. You can now access your account with your new credentials.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <PrimaryButton type="button" onClick={() => navigate('/login')}>
              Return to Login
            </PrimaryButton>
          </div>
        </AuthCard>
      </div>
    </div>
  );
};

export default ResetSuccess;
