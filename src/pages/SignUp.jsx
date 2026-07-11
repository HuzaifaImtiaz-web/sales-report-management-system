import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiMail, FiCheckSquare } from 'react-icons/fi';
import Logo from '../components/Logo';
import AuthCard from '../components/AuthCard';
import InputField from '../components/InputField';
import PasswordField from '../components/PasswordField';
import PasswordStrength, { evaluateRules } from '../components/PasswordStrength';
import PrimaryButton from '../components/PrimaryButton';

const SignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordVal = watch('password') || '';
  const confirmPasswordVal = watch('confirmPassword') || '';

  // Determine if password satisfies all criteria
  const passwordRules = evaluateRules(passwordVal);
  const allRulesPass = Object.values(passwordRules).every(Boolean);

  // Form submission handler
  const onSubmit = async (data) => {
    if (!allRulesPass || data.password !== data.confirmPassword) return;

    setLoading(true);
    // Simulate signup request
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);

    // Redirect to login with success message
    navigate('/login', {
      state: { successMessage: 'Account created successfully. Please sign in.' },
    });
  };

  // Button disabled calculation
  const isSubmitDisabled = !isValid || !allRulesPass || passwordVal !== confirmPasswordVal || loading;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-lightGray font-sans">
      <div className="w-full max-w-md space-y-6">
        <AuthCard>
          <div className="flex flex-col items-center mb-6">
            <Logo />
            <h1 className="text-xl font-bold text-gray-900 mt-6 leading-none">Create Account</h1>
            <p className="text-xs text-gray-450 mt-2 font-medium">Join the Himmel pharmaceuticals portal</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            
            <InputField
              label="Full Name"
              id="fullName"
              placeholder="e.g., Jane Doe"
              icon={FiUser}
              error={errors.fullName}
              {...register('fullName', {
                required: 'Full name is required',
              })}
            />

            <InputField
              label="Username"
              id="username"
              placeholder="e.g., jane_doe"
              icon={FiCheckSquare}
              error={errors.username}
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' },
              })}
            />

            <InputField
              label="Email Address"
              id="email"
              type="email"
              placeholder="e.g., jane.doe@himmel.com"
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

            <div>
              <PasswordField
                label="Password"
                id="password"
                placeholder="Enter strong password"
                error={errors.password}
                {...register('password', {
                  required: 'Password is required',
                })}
              />
              <PasswordStrength value={passwordVal} />
            </div>

            <PasswordField
              label="Confirm Password"
              id="confirmPassword"
              placeholder="Retype password"
              error={
                confirmPasswordVal && passwordVal !== confirmPasswordVal
                  ? { message: 'Passwords do not match' }
                  : errors.confirmPassword
              }
              {...register('confirmPassword', {
                required: 'Confirm your password',
                validate: (val) => val === passwordVal || 'Passwords do not match',
              })}
            />

            <div className="pt-3">
              <PrimaryButton loading={loading} disabled={isSubmitDisabled}>
                Create Account
              </PrimaryButton>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 flex justify-center text-xs">
            <span className="text-gray-450 mr-1.5 font-medium">Already have an account?</span>
            <Link to="/login" className="font-bold text-brand-primary hover:text-brand-primaryDark transition-colors">
              Sign In
            </Link>
          </div>

        </AuthCard>
      </div>
    </div>
  );
};

export default SignUp;
