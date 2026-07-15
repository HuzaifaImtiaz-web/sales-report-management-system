import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiArrowRight } from 'react-icons/fi';
import Logo from '../../components/common/Logo';
import AuthCard from '../../components/cards/AuthCard';
import InputField from '../../components/forms/InputField';
import PasswordField from '../../components/forms/PasswordField';
import Checkbox from '../../components/forms/Checkbox';
import PrimaryButton from '../../components/ui/PrimaryButton';
import Toast from '../../components/common/Toast';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Extract navigation success messages (e.g., from successful Sign Up)
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMsg(location.state.successMessage);
      // Clear location state to prevent toast on reload
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);

    // Update AuthContext state so AuthGuard sees isAuthenticated = true
    login(data.identifier);

    // Persist mock session across page refreshes
    if (data.rememberMe) {
      localStorage.setItem('himmel_portal_user', JSON.stringify({ email: data.identifier }));
    } else {
      sessionStorage.setItem('himmel_portal_user', JSON.stringify({ email: data.identifier }));
    }

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-lightGray font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {successMsg && (
          <Toast message={successMsg} type="success" onClose={() => setSuccessMsg('')} />
        )}

        <AuthCard>
          <div className="flex flex-col items-center mb-8">
            <Logo />
            <h1 className="text-xl font-bold text-gray-900 mt-6 leading-none">Welcome Back</h1>
            <p className="text-xs text-gray-450 mt-2 font-medium">Please sign in to access your sales portal</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            
            <InputField
              label="Username or Email"
              id="identifier"
              type="text"
              placeholder="e.g., sales.rep@himmel.com"
              icon={FiMail}
              error={errors.identifier}
              {...register('identifier', {
                required: 'Username or email address is required',
              })}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-primary hover:text-brand-primaryDark transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <PasswordField
                id="password"
                placeholder="Enter password"
                error={errors.password}
                {...register('password', {
                  required: 'Password is required',
                })}
              />
            </div>

            <Checkbox
              label="Remember Me"
              id="rememberMe"
              {...register('rememberMe')}
            />

            <div className="pt-2">
              <PrimaryButton loading={loading} disabled={loading}>
                Sign In
              </PrimaryButton>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center">
            <p className="text-xs font-medium text-gray-450 mb-3">Don&apos;t have an account yet?</p>
            <Link to="/signup" className="w-full">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1.5 px-5 py-3 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 font-bold text-xs rounded-enterprise transition-all duration-200"
              >
                <span>Create New Account</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

        </AuthCard>
      </div>
    </div>
  );
};

export default Login;
