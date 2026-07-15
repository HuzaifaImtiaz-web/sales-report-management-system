import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail } from 'react-icons/fi';
import Logo from '../../components/common/Logo';
import AuthCard from '../../components/cards/AuthCard';
import InputField from '../../components/forms/InputField';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';
import Toast from '../../components/common/Toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    // Simulate recovery request
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setSuccess(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-lightGray font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {success && (
          <Toast
            message="If this email exists, a password reset link has been sent."
            type="success"
            duration={null} // Keep persistent
          />
        )}

        <AuthCard>
          <div className="flex flex-col items-center mb-6">
            <Logo />
            <h1 className="text-xl font-bold text-gray-900 mt-6 leading-none">Reset Password</h1>
            <p className="text-xs text-gray-450 mt-2 font-medium">Enter your email to receive a recovery link</p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <InputField
                label="Email Address"
                id="email"
                type="email"
                placeholder="e.g., sales.rep@himmel.com"
                icon={FiMail}
                error={errors.email}
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Enter a valid email address',
                  },
                })}
              />

              <div className="pt-2">
                <PrimaryButton loading={loading} disabled={loading}>
                  Send Reset Link
                </PrimaryButton>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-100 rounded-enterprise p-4 text-xs font-semibold text-gray-500 leading-relaxed text-center">
                Please check your inbox. If you are verifying this flow as an administrator, you can view the Success landing page directly below.
              </div>
              <PrimaryButton type="button" onClick={() => navigate('/reset-success')}>
                Preview Success Screen
              </PrimaryButton>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100">
            <Link to="/login">
              <SecondaryButton>
                Back to Login
              </SecondaryButton>
            </Link>
          </div>

        </AuthCard>
      </div>
    </div>
  );
};

export default ForgotPassword;
