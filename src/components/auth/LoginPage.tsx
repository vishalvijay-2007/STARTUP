import React, { useState } from 'react';
import { Sparkles, Home, UserPlus, ShieldCheck, Eye, EyeOff, ArrowRight, CheckCircle2, Lock, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, User } from '../../types';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { BrandLogo } from '../common/BrandLogo';

interface LoginPageProps {
  onSuccess: (user: User) => void;
  onSwitchToRegister: (role?: UserRole) => void;
  onGoToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onSwitchToRegister,
  onGoToLanding,
}) => {
  const { login, loginWithGoogle } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('founder');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username.trim()) {
      setErrorMessage('Please enter your username or email address.');
      return;
    }

    setIsLoading(true);
    const result = await login(username.trim(), password, selectedRole);
    setIsLoading(false);

    if (result.success && result.user) {
      onSuccess(result.user);
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleGoogleSubmit = async (customEmail?: string) => {
    setIsLoading(true);
    setErrorMessage('');
    const emailToUse = customEmail || customGoogleEmail || (selectedRole === 'admin' ? 'admin@startupincubator.io' : selectedRole === 'mentor' ? 'sarah.chen@stanford.edu' : 'vishalvijay135@gmail.com');
    const result = await loginWithGoogle(selectedRole, emailToUse, undefined, adminKey);
    setIsLoading(false);
    setIsGoogleModalOpen(false);

    if (result.success && result.user) {
      onSuccess(result.user);
    } else {
      setErrorMessage(result.error || 'Google authentication failed.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F8FAFC]">
      {/* Left Column matching Screenshot 1 */}
      <div className="md:w-1/2 bg-[#1B1046] text-white p-6 sm:p-12 lg:p-20 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-violet-800/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Tag Pill */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <BrandLogo variant="dark" size="md" onClick={onGoToLanding} />

          {onGoToLanding && (
            <button
              onClick={onGoToLanding}
              className="text-xs text-purple-200 hover:text-white transition-colors flex items-center gap-1 font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
            >
              Public Landing Page <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 my-8 sm:my-14 md:my-auto max-w-lg">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-sans">
            Build. Connect. <br />
            Grow.
          </h1>
          <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-purple-100/90 leading-relaxed font-normal">
            One workspace for founders, mentors, and incubator admins to turn ambitious ideas into meaningful progress.
          </p>

          {/* Three Feature Pills from Screenshot 1 */}
          <div className="mt-6 sm:mt-8 flex flex-wrap gap-2">
            <span className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20 bg-white/10 text-white/95 text-xs font-medium backdrop-blur-xs">
              Startup Growth
            </span>
            <span className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20 bg-white/10 text-white/95 text-xs font-medium backdrop-blur-xs">
              Expert Mentorship
            </span>
            <span className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20 bg-white/10 text-white/95 text-xs font-medium backdrop-blur-xs">
              Milestone Tracking
            </span>
          </div>
        </div>

        {/* Bottom Tagline */}
        <div className="relative z-10 pt-4">
          <p className="text-xs text-purple-200/70 font-medium">Empowering the next generation of startups.</p>
        </div>
      </div>

      {/* Right Column matching Screenshot 1 */}
      <div className="md:w-1/2 flex items-center justify-center p-4 sm:p-10 lg:p-16 bg-[#F8FAFC]">
        <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl border border-gray-100">
          {/* Header */}
          <div className="mb-6">
            <BrandLogo variant="badge" className="mb-2" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">Welcome back</h2>
            <p className="text-xs text-gray-500 mt-1.5">
              Sign in to manage your {selectedRole} workspace and continue making progress.
            </p>
          </div>

          {/* 3 Dedicated Role Selector Cards (Founder / Mentor / Admin) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-5">
            {/* Founder Card */}
            <button
              type="button"
              onClick={() => handleRoleSelect('founder')}
              className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                selectedRole === 'founder'
                  ? 'border-[#6355F4] bg-purple-50/50 ring-1 ring-[#6355F4]'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                <Home className={`w-3.5 h-3.5 shrink-0 ${selectedRole === 'founder' ? 'text-[#6355F4]' : 'text-gray-500'}`} />
                <span className={`text-[11px] sm:text-xs font-bold truncate ${selectedRole === 'founder' ? 'text-[#6355F4]' : 'text-gray-800'}`}>
                  Founder
                </span>
              </div>
              <p className="text-[9px] text-gray-500 leading-tight">Manage startup</p>
            </button>

            {/* Mentor Card */}
            <button
              type="button"
              onClick={() => handleRoleSelect('mentor')}
              className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                selectedRole === 'mentor'
                  ? 'border-[#6355F4] bg-purple-50/50 ring-1 ring-[#6355F4]'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                <UserPlus className={`w-3.5 h-3.5 shrink-0 ${selectedRole === 'mentor' ? 'text-[#6355F4]' : 'text-gray-500'}`} />
                <span className={`text-[11px] sm:text-xs font-bold truncate ${selectedRole === 'mentor' ? 'text-[#6355F4]' : 'text-gray-800'}`}>
                  Mentor
                </span>
              </div>
              <p className="text-[9px] text-gray-500 leading-tight">Advisory hub</p>
            </button>

            {/* Admin Card */}
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                selectedRole === 'admin'
                  ? 'border-[#6355F4] bg-purple-50/50 ring-1 ring-[#6355F4]'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${selectedRole === 'admin' ? 'text-[#6355F4]' : 'text-gray-500'}`} />
                <span className={`text-[11px] sm:text-xs font-bold truncate ${selectedRole === 'admin' ? 'text-[#6355F4]' : 'text-gray-800'}`}>
                  Admin
                </span>
              </div>
              <p className="text-[9px] text-gray-500 leading-tight">Governance</p>
            </button>
          </div>

          {errorMessage && (
            <div
              className={`mb-4 p-3.5 rounded-2xl text-xs font-medium leading-relaxed flex items-start gap-2.5 ${
                errorMessage.includes('under review')
                  ? 'bg-amber-50/90 border border-amber-200 text-amber-800'
                  : errorMessage.includes('rejected') || errorMessage.includes('suspended')
                  ? 'bg-red-50/90 border border-red-200 text-red-700'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}
            >
              {errorMessage.includes('under review') ? (
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : errorMessage.includes('rejected') || errorMessage.includes('suspended') ? (
                <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                {errorMessage.includes('under review') && (
                  <p className="font-bold text-amber-900 mb-0.5">Application Under Review</p>
                )}
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Username or Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={`e.g. ${selectedRole === 'founder' ? 'vijaynisha123' : selectedRole === 'mentor' ? 'sarahchen' : 'admin'}`}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#6355F4] focus:ring-1 focus:ring-[#6355F4] transition-all"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs font-semibold text-[#6355F4] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#6355F4] focus:ring-1 focus:ring-[#6355F4] transition-all pr-14"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6355F4] hover:text-[#5244E0] transition-colors cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#6355F4] hover:bg-[#5244E0] active:scale-[0.99] text-white font-semibold text-sm py-3 rounded-xl shadow-md shadow-purple-500/25 transition-all mt-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? 'Signing in...' : `Sign in as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400 font-medium">or</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleGoogleSubmit()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-200/90 text-gray-700 text-xs font-semibold py-2.5 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {isLoading ? 'Authenticating...' : `Continue with Google (${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)})`}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(true)}
                className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                Choose specific Google account / passkey
              </button>
            </div>
          </div>

          {/* Create account link */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <span>New to the platform? </span>
            <button
              onClick={() => onSwitchToRegister(selectedRole)}
              className="font-bold text-[#6355F4] hover:underline cursor-pointer"
            >
              Create an account
            </button>
          </div>
        </div>
      </div>

      {/* Google Authentication Dialog */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Sign in with Google</h3>
                <p className="text-[11px] text-gray-500 capitalize">Role: {selectedRole} Dashboard</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Authenticate your verified Google profile to access the <strong>{selectedRole}</strong> workspace directly.
            </p>

            <div className="space-y-2 mb-4">
              <button
                type="button"
                onClick={() =>
                  handleGoogleSubmit(
                    selectedRole === 'admin'
                      ? 'admin@startupincubator.io'
                      : selectedRole === 'mentor'
                      ? 'sarah.chen@stanford.edu'
                      : 'vishalvijay135@gmail.com'
                  )
                }
                className="w-full p-2.5 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/40 text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-bold text-gray-900 block">
                    {selectedRole === 'admin'
                      ? 'admin@startupincubator.io'
                      : selectedRole === 'mentor'
                      ? 'sarah.chen@stanford.edu'
                      : 'vishalvijay135@gmail.com'}
                  </span>
                  <span className="text-[10px] text-gray-400 capitalize">
                    {selectedRole === 'admin' ? 'Incubator Director' : selectedRole === 'mentor' ? 'Dr. Sarah Chen' : 'vishal'} (Verified)
                  </span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-[#6355F4]" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Or sign in with any custom Google account:
              </label>
              <input
                type="email"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                placeholder="your.name@gmail.com"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Any visitor can sign in with their Google email to register or log in directly.
              </p>
            </div>

            {selectedRole === 'admin' && (
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Admin Passkey Authorization
                </label>
                <input
                  type="text"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="ADMIN2026"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-mono"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleGoogleSubmit()}
                className="flex-1 py-2 rounded-xl bg-[#6355F4] text-white text-xs font-semibold hover:bg-[#5244E0]"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Password Reset Dialog */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccess={() => {
          setIsForgotPasswordOpen(false);
          setErrorMessage('');
        }}
      />
    </div>
  );
};
