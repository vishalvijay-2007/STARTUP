import React, { useState } from 'react';
import { Sparkles, Home, UserPlus, ShieldCheck, CheckCircle, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, User } from '../../types';
import { BrandLogo } from '../common/BrandLogo';

interface RegisterPageProps {
  onSuccess: (user: User) => void;
  onSwitchToLogin: (role?: UserRole) => void;
  onGoToLanding?: () => void;
  initialRole?: UserRole;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccess,
  onSwitchToLogin,
  onGoToLanding,
  initialRole = 'founder',
}) => {
  const { register, loginWithGoogle } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState('B2B SaaS, Product Strategy');
  const [adminKey, setAdminKey] = useState('');
  const [phone, setPhone] = useState('');
  const [yearsExperience, setYearsExperience] = useState('5');
  const [qualifications, setQualifications] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittedPending, setIsSubmittedPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !username.trim() || !password) {
      setErrorMessage('Please fill in all required fields including password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      username: username.trim(),
      password,
      role: selectedRole,
      adminKey: selectedRole === 'admin' ? adminKey.trim() : undefined,
      company: company || (selectedRole === 'founder' ? `${name}'s Startup` : 'Advisory'),
      title: title || (selectedRole === 'mentor' ? 'Industry Mentor' : 'Founder & CEO'),
      bio,
      phone,
      yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
      qualifications,
      startupName: selectedRole === 'founder' ? (company || `${name}'s Startup`) : undefined,
      industry: 'Technology',
      expertise: expertise.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setIsLoading(false);

    if (result.success && result.user) {
      onSuccess(result.user);
    } else if ((result as any).isPendingApproval) {
      setIsSubmittedPending(true);
    } else {
      setErrorMessage(result.error || 'Registration failed.');
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const defaultEmail =
      selectedRole === 'admin'
        ? 'admin@startupincubator.io'
        : selectedRole === 'mentor'
        ? (email || 'sarah.chen@stanford.edu')
        : (email || 'vishalvijay135@gmail.com');

    const defaultName =
      name ||
      (selectedRole === 'admin'
        ? 'Incubator Director'
        : selectedRole === 'mentor'
        ? 'Dr. Sarah Chen'
        : 'vishal');

    const result = await loginWithGoogle(selectedRole, email || defaultEmail, defaultName, adminKey);
    setIsLoading(false);

    if (result.success && result.user) {
      onSuccess(result.user);
    } else if ((result as any).isPendingApproval) {
      setIsSubmittedPending(true);
    } else {
      setErrorMessage(result.error || 'Google registration failed.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F8FAFC]">
      {/* Left Column matching theme */}
      <div className="md:w-1/2 bg-[#1B1046] text-white p-6 sm:p-12 lg:p-20 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <BrandLogo variant="dark" size="md" onClick={onGoToLanding} />

          {onGoToLanding && (
            <button
              onClick={onGoToLanding}
              className="text-xs text-purple-200 hover:text-white transition-colors flex items-center gap-1 font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
            >
              Public Landing <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="relative z-10 my-8 sm:my-12 md:my-auto max-w-lg">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Accelerate your startup journey.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-purple-100/90 leading-relaxed">
            Join an elite incubator network. Connect with world-class mentors, pitch to top venture funds, and track your metrics from MVP to Series A.
          </p>

          <div className="mt-6 sm:mt-8 space-y-3">
            <div className="flex items-center gap-3 text-xs text-purple-100/90">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full access to AI Startup Assistant & Growth Strategy Generator</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-purple-100/90">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct 1:1 scheduling with vetted Silicon Valley mentors</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-purple-100/90">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>₹75 Lakhs+ in perks & partner cloud credits</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-4">
          <p className="text-xs text-purple-200/70 font-medium">Empowering the next generation of startups.</p>
        </div>
      </div>

      {/* Right Column Registration Form */}
      <div className="md:w-1/2 flex items-center justify-center p-4 sm:p-10 lg:p-16 bg-[#F8FAFC]">
        <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl border border-gray-100">
          {isSubmittedPending ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-bold tracking-widest px-3 py-1 rounded-full bg-amber-100 text-amber-800 uppercase inline-block mb-3">
                APPLICATION UNDER REVIEW
              </span>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Application Received!
              </h2>
              <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                Your Mentor application is currently under review. You will receive access once the Admin approves your application.
              </p>

              <div className="mt-5 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left text-xs space-y-1.5 text-gray-600">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400 shrink-0">Applicant:</span>
                  <span className="font-semibold text-gray-900 truncate">{name}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400 shrink-0">Email:</span>
                  <span className="font-semibold text-gray-900 truncate">{email}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400 shrink-0">Role:</span>
                  <span className="font-bold text-[#6355F4]">Verified Mentor</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400 shrink-0">Status:</span>
                  <span className="font-bold text-amber-600">Pending Admin Verification</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={() => onSwitchToLogin('mentor')}
                  className="w-full bg-[#6355F4] hover:bg-[#5244E0] text-white font-semibold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Proceed to Sign In
                </button>
                {onGoToLanding && (
                  <button
                    type="button"
                    onClick={onGoToLanding}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Return to Homepage
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <BrandLogo variant="badge" className="mb-2" />
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
                  Create an account
                </h2>
                <p className="text-xs text-gray-500 mt-1.5">
                  Choose your role to get immediate access to your dedicated dashboard.
                </p>
              </div>

              {/* Role Selection (Founder / Mentor / Admin) */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setSelectedRole('founder')}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedRole === 'founder'
                      ? 'border-[#6355F4] bg-purple-50/50 ring-1 ring-[#6355F4]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                    <Home className={`w-3.5 h-3.5 shrink-0 ${selectedRole === 'founder' ? 'text-[#6355F4]' : 'text-gray-500'}`} />
                    <span className="text-[11px] sm:text-xs font-bold text-gray-900 truncate">Founder</span>
                  </div>
                  <p className="text-[9px] text-gray-500 leading-tight">Startups</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('mentor')}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedRole === 'mentor'
                      ? 'border-[#6355F4] bg-purple-50/50 ring-1 ring-[#6355F4]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                    <UserPlus className={`w-3.5 h-3.5 shrink-0 ${selectedRole === 'mentor' ? 'text-[#6355F4]' : 'text-gray-500'}`} />
                    <span className="text-[11px] sm:text-xs font-bold text-gray-900 truncate">Mentor</span>
                  </div>
                  <p className="text-[9px] text-gray-500 leading-tight">Advisor</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedRole === 'admin'
                      ? 'border-[#6355F4] bg-purple-50/50 ring-1 ring-[#6355F4]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                    <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${selectedRole === 'admin' ? 'text-[#6355F4]' : 'text-gray-500'}`} />
                    <span className="text-[11px] sm:text-xs font-bold text-gray-900 truncate">Admin</span>
                  </div>
                  <p className="text-[9px] text-gray-500 leading-tight">Director</p>
                </button>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium leading-relaxed">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vishal Vijay"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. vishal"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                    />
                  </div>
                </div>

                {selectedRole === 'admin' && (
                  <div>
                    <label className="block text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Admin Invitation Passkey
                    </label>
                    <input
                      type="text"
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      placeholder="ADMIN2026"
                      className="w-full px-3.5 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs text-gray-900 font-mono focus:outline-none focus:border-[#6355F4]"
                      required
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Default root authorization key: ADMIN2026</p>
                  </div>
                )}

                {selectedRole === 'mentor' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Firm</label>
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Horizon Ventures"
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Years Experience</label>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          value={yearsExperience}
                          onChange={(e) => setYearsExperience(e.target.value)}
                          placeholder="e.g. 8"
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Expertise Tags</label>
                      <input
                        type="text"
                        value={expertise}
                        onChange={(e) => setExpertise(e.target.value)}
                        placeholder="SaaS, AI, Fundraising"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Qualifications & Background</label>
                      <input
                        type="text"
                        value={qualifications}
                        onChange={(e) => setQualifications(e.target.value)}
                        placeholder="Ex-VP Product at ScaleUp, Angel Investor"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                      />
                    </div>
                  </>
                )}

                {selectedRole === 'founder' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Startup Name</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. PulseAI Diagnostics"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#6355F4] hover:bg-[#5244E0] text-white font-semibold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer mt-2 disabled:opacity-60"
                >
                  {isLoading
                    ? 'Creating account...'
                    : `Sign up as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
                </button>
              </form>

              {/* Google Sign up button */}
              <button
                type="button"
                onClick={handleGoogleRegister}
                disabled={isLoading}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
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
                Sign up with Google ({selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)})
              </button>

              <div className="mt-5 text-center text-xs text-gray-500">
                <span>Already have an account? </span>
                <button
                  onClick={() => onSwitchToLogin(selectedRole)}
                  className="font-bold text-[#6355F4] hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
