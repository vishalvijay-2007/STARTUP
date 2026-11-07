import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  LayoutGrid,
  Shield,
  Bell,
  Palette,
  Lock,
  Building,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  UserPlus,
  Copy,
  Check,
  Smartphone,
  Laptop,
  Globe,
  Clock,
  Key,
  ShieldCheck,
  FileText,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar, DEFAULT_AVATAR_PATH, resolveAvatarSrc } from '../common/UserAvatar';
import {
  NotificationPreferences,
  AppearancePreferences,
  PrivacyPreferences,
  WorkspaceSettings,
  SessionInfo,
  LoginHistoryItem,
} from '../../types';

type SettingsTab = 'account' | 'security' | 'notifications' | 'appearance' | 'privacy' | 'workspace' | 'profile';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Account Settings State
  const [name, setName] = useState(user?.name || 'vishal');
  const [username, setUsername] = useState(user?.username || 'vijaynisha123');
  const [email, setEmail] = useState(user?.email || 'vijaynisha123@gmail.com');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [bio, setBio] = useState(user?.bio || 'Founder building next-gen AI diagnostic and startup intelligence tools.');
  const [title, setTitle] = useState(user?.title || 'Founder & CEO');
  const [company, setCompany] = useState(user?.company || 'PulseAI Diagnostics');
  const [avatar, setAvatar] = useState(
    user?.avatar ? resolveAvatarSrc(user.avatar) : DEFAULT_AVATAR_PATH
  );
  const [language, setLanguage] = useState(user?.language || 'English (US)');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC+05:30');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');

  // 2. Security Settings State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled ?? false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('JBSWY3DPEHPK3PXP');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [isLoggingOutOthers, setIsLoggingOutOthers] = useState(false);

  // 3. Notifications Settings State
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailNotifications: true,
    mentorSessionReminders: true,
    milestoneUpdates: true,
    resourceAnnouncements: false,
    workspaceActivity: true,
    importantAccountAlerts: true,
    courseRecommendations: true,
    aiAnalysisUpdates: true,
    inAppNotifications: true,
    marketingAnnouncements: false,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // 4. Appearance Settings State
  const [appearance, setAppearance] = useState<AppearancePreferences>({
    theme: 'light',
    themeColor: '#6355F4',
    sidebarMode: 'expanded',
    fontSize: 'normal',
  });
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);

  // 5. Privacy Settings State
  const [privacy, setPrivacy] = useState<PrivacyPreferences>({
    profileVisibility: 'workspace',
    workspaceActivityVisibility: true,
    contactInfoVisibility: false,
    dataSharingAI: true,
    twoFactorEnforced: false,
  });
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);

  // 6. Workspace Settings State
  const [workspace, setWorkspace] = useState<WorkspaceSettings>({
    name: 'Apex Global Incubator',
    description: 'High-velocity startup incubation and founder mentorship accelerator.',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    defaultLandingPage: 'Dashboard',
    allowMemberInvites: true,
  });
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'founder' | 'mentor' | 'admin'>('founder');
  const [isInviting, setIsInviting] = useState(false);

  // Show Toast
  const triggerToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch initial full settings from backend
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    fetch(`/api/settings?userId=${encodeURIComponent(user.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.user) {
            setName(data.user.name || user.name);
            setUsername(data.user.username || user.username);
            setEmail(data.user.email || user.email);
            setPhone(data.user.phone || '+91 98765 43210');
            setBio(data.user.bio || user.bio || '');
            setTitle(data.user.title || user.title || '');
            setCompany(data.user.company || user.company || '');
            if (data.user.avatar) setAvatar(data.user.avatar);
            if (data.user.language) setLanguage(data.user.language);
            if (data.user.timezone) setTimezone(data.user.timezone);
            setTwoFactorEnabled(!!data.user.twoFactorEnabled);
          }
          if (data.security) {
            if (data.security.activeSessions) setActiveSessions(data.security.activeSessions);
            if (data.security.loginHistory) setLoginHistory(data.security.loginHistory);
          }
          if (data.notifications) setNotifications(data.notifications);
          if (data.appearance) {
            setAppearance(data.appearance);
            applyAppearanceToDom(data.appearance);
          }
          if (data.privacy) setPrivacy(data.privacy);
          if (data.workspace?.settings) {
            setWorkspace(data.workspace.settings);
          }
          if (data.workspace?.members) {
            setWorkspaceMembers(data.workspace.members);
          }
        }
      })
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setIsLoading(false));
  }, [user]);

  // Apply appearance changes live
  const applyAppearanceToDom = (appPrefs: AppearancePreferences) => {
    const isDark =
      appPrefs.theme === 'dark' ||
      (appPrefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (appPrefs.fontSize === 'small') {
      document.documentElement.style.fontSize = '14px';
    } else if (appPrefs.fontSize === 'large') {
      document.documentElement.style.fontSize = '17px';
    } else {
      document.documentElement.style.fontSize = '15px';
    }
    document.documentElement.style.setProperty('--color-primary', appPrefs.themeColor || '#6355F4');
  };

  // 1. Save Account
  const handleSaveAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setIsSavingAccount(true);
    try {
      const res = await fetch('/api/settings/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name,
          email,
          username,
          phone,
          bio,
          title,
          company,
          avatar,
          language,
          timezone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        triggerToast('error', data.error || 'Failed to update account information.');
      } else {
        await updateProfile({
          name,
          email,
          username,
          phone,
          bio,
          title,
          company,
          avatar,
          language,
          timezone,
        });
        triggerToast('success', 'Account preferences and profile saved successfully.');
      }
    } catch {
      triggerToast('error', 'Network error while updating account.');
    } finally {
      setIsSavingAccount(false);
    }
  };

  // Account Deactivation
  const handleDeactivate = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/settings/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, reason: deactivateReason }),
      });
      if (res.ok) {
        setShowDeactivateModal(false);
        triggerToast('success', 'Account deactivated. Signing out...');
        setTimeout(() => logout(), 2000);
      }
    } catch {
      triggerToast('error', 'Failed to deactivate account.');
    }
  };

  // 2. Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 8) {
      triggerToast('error', 'New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('error', 'New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        triggerToast('error', data.error || 'Password update failed.');
      } else {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        triggerToast('success', 'Password updated successfully! Your account is secure.');
      }
    } catch {
      triggerToast('error', 'Network error while updating password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Toggle 2FA
  const handleToggle2FA = async (enabled: boolean) => {
    if (!user) return;
    try {
      const res = await fetch('/api/settings/2fa/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, enabled }),
      });
      const data = await res.json();
      if (res.ok) {
        setTwoFactorEnabled(data.twoFactorEnabled);
        if (data.backupCodes) setBackupCodes(data.backupCodes);
        if (data.secretKey) setTwoFactorSecret(data.secretKey);
        triggerToast(
          'success',
          enabled ? 'Two-Factor Authentication enabled. Save your backup codes.' : 'Two-Factor Authentication disabled.'
        );
      }
    } catch {
      triggerToast('error', 'Failed to toggle 2FA.');
    }
  };

  // Terminate other sessions
  const handleLogoutOthers = async () => {
    if (!user) return;
    setIsLoggingOutOthers(true);
    try {
      const res = await fetch('/api/settings/sessions/logout-others', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveSessions(data.activeSessions);
        triggerToast('success', 'Successfully logged out of all other devices.');
      }
    } catch {
      triggerToast('error', 'Failed to terminate other sessions.');
    } finally {
      setIsLoggingOutOthers(false);
    }
  };

  // 3. Save Notifications
  const handleSaveNotifications = async () => {
    if (!user) return;
    setIsSavingNotifications(true);
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, preferences: notifications }),
      });
      if (res.ok) {
        triggerToast('success', 'Notification preferences saved successfully.');
      } else {
        triggerToast('error', 'Failed to save notifications.');
      }
    } catch {
      triggerToast('error', 'Network error saving notification preferences.');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // 4. Save Appearance
  const handleSaveAppearance = async (newPrefs?: AppearancePreferences) => {
    if (!user) return;
    const toSave = newPrefs || appearance;
    setIsSavingAppearance(true);
    applyAppearanceToDom(toSave);
    try {
      const res = await fetch('/api/settings/appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, preferences: toSave }),
      });
      if (res.ok) {
        triggerToast('success', 'Appearance preferences applied and saved.');
      } else {
        triggerToast('error', 'Failed to save appearance settings.');
      }
    } catch {
      triggerToast('error', 'Network error saving appearance settings.');
    } finally {
      setIsSavingAppearance(false);
    }
  };

  // 5. Save Privacy
  const handleSavePrivacy = async () => {
    if (!user) return;
    setIsSavingPrivacy(true);
    try {
      const res = await fetch('/api/settings/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, preferences: privacy }),
      });
      if (res.ok) {
        triggerToast('success', 'Privacy preferences saved successfully.');
      } else {
        triggerToast('error', 'Failed to save privacy preferences.');
      }
    } catch {
      triggerToast('error', 'Network error saving privacy preferences.');
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  // 6. Save Workspace Settings
  const handleSaveWorkspace = async () => {
    if (!user) return;
    setIsSavingWorkspace(true);
    try {
      const res = await fetch('/api/settings/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, settings: workspace }),
      });
      if (res.ok) {
        triggerToast('success', 'Workspace settings saved successfully.');
      } else {
        triggerToast('error', 'Failed to update workspace settings.');
      }
    } catch {
      triggerToast('error', 'Network error saving workspace settings.');
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  // Invite Member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteEmail) return;
    setIsInviting(true);
    try {
      const res = await fetch('/api/settings/workspace/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowInviteModal(false);
        setInviteEmail('');
        triggerToast('success', `Invitation successfully dispatched to ${inviteEmail}.`);
        if (data.member) {
          setWorkspaceMembers((prev) => [data.member, ...prev]);
        }
      } else {
        triggerToast('error', data.error || 'Failed to send invitation.');
      }
    } catch {
      triggerToast('error', 'Network error sending workspace invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  // Password strength calculator
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: 'None', color: 'bg-gray-200' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const pwStrength = getPasswordStrength(newPassword);

  // Exact tabs order specified by user prompt:
  // 1. Account, 2. Security, 3. Notifications, 4. Appearance, 5. Privacy, 6. Workspace
  const settingsTabs = [
    { id: 'account' as const, label: 'Account', desc: 'Configure your account preferences.', icon: LayoutGrid },
    { id: 'security' as const, label: 'Security', desc: 'Manage password and account security.', icon: Shield },
    { id: 'notifications' as const, label: 'Notifications', desc: 'Control how you receive updates.', icon: Bell },
    { id: 'appearance' as const, label: 'Appearance', desc: 'Customize your workspace appearance.', icon: Palette },
    { id: 'privacy' as const, label: 'Privacy', desc: 'Review your privacy preferences.', icon: Lock },
    { id: 'workspace' as const, label: 'Workspace', desc: 'Manage workspace-related preferences.', icon: Building },
  ];

  const currentTabObj = settingsTabs.find((t) => t.id === activeTab) || settingsTabs[0];

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold border transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-gray-400 hover:text-gray-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header matching Screenshots */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#6355F4] uppercase">
            WORKSPACE PREFERENCES
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">Settings</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your account security, notification channels, visual appearance, and incubation workspace.
          </p>
        </div>

        {/* Top right user pill & Help button */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-full bg-white border border-gray-200 shadow-2xs">
            <div className="w-6 h-6 rounded-full bg-purple-100 text-[#6355F4] font-bold flex items-center justify-center text-xs shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'V'}
            </div>
            <div className="text-[11px] font-semibold text-gray-700 truncate">
              <span>{user?.name || 'vishal'}</span>
              <span className="text-gray-400 font-normal ml-1 capitalize">({user?.role || 'Founder'})</span>
            </div>
          </div>

          <button
            onClick={() => triggerToast('success', 'Enterprise incubator help desk is online 24/7.')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span>Help & Support</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Settings Container matching Screenshots */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-xs">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column: Compact Horizontal Tab Bar on Mobile/Tablet (< lg) + Sticky Vertical Tab List on Desktop (lg+) */}
          <div className="lg:col-span-4 min-w-0">
            {/* Mobile & Tablet Compact Horizontal Scrollable Tabs (< lg) */}
            <div className="lg:hidden space-y-3 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#6355F4] text-white shadow-sm shadow-purple-500/20'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/70'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Sticky Vertical Tab List in Exact Required Order (lg+) */}
            <div className="hidden lg:block lg:sticky lg:top-6 space-y-2">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-start gap-3.5 p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-purple-50/70 border border-purple-200 text-[#6355F4]'
                        : 'hover:bg-gray-50 border border-transparent text-gray-600'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 transition-all ${
                        isActive ? 'bg-[#6355F4] text-white shadow-xs' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">{tab.label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{tab.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Tab Content */}
          <div className="lg:col-span-8 lg:border-l lg:border-gray-100 lg:pl-8 min-h-[500px] min-w-0">
            {/* Tab Header Banner */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100 mb-6">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#6355F4] uppercase">
                  {currentTabObj.label.toUpperCase()}
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight mt-0.5">
                  {currentTabObj.label}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" /> Secure
              </span>
            </div>

            {/* TAB 1: ACCOUNT SETTINGS */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* Visual Avatar Banner */}
                <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    <UserAvatar
                      src={avatar}
                      alt={name}
                      size="xl"
                      shape="rounded-square"
                      border={true}
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{name}</h4>
                      <p className="text-xs text-gray-400 font-mono truncate">@{username}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full capitalize">
                          {user?.role || 'Founder'}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Active Account
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-xs transition-colors text-center">
                      Upload Real Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setAvatar(reader.result);
                                updateProfile({ avatar: reader.result });
                                triggerToast('success', 'Profile photo updated successfully.');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    {avatar !== DEFAULT_AVATAR_PATH && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatar(DEFAULT_AVATAR_PATH);
                          updateProfile({ avatar: DEFAULT_AVATAR_PATH });
                          triggerToast('success', 'Reset to default illustrated avatar.');
                        }}
                        className="px-3.5 py-2 sm:py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors"
                      >
                        Reset Avatar
                      </button>
                    )}
                  </div>
                </div>

                {/* Account Cards Grid matching Screenshot 2 */}
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Left Card: Account Information */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-gray-200/80 bg-white space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                      Account information
                    </h4>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3.5 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#6355F4]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#6355F4]"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-semibold text-gray-500">Account status</span>
                      <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Right Card: Workspace Preferences */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-gray-200/80 bg-white space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                      Workspace preferences
                    </h4>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Preferred language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#6355F4]"
                      >
                        <option value="English (US)">English (US)</option>
                        <option value="English (UK)">English (UK)</option>
                        <option value="Hindi (IN)">Hindi (IN) - हिन्दी</option>
                        <option value="Spanish (ES)">Spanish (ES) - Español</option>
                        <option value="German (DE)">German (DE) - Deutsch</option>
                        <option value="French (FR)">French (FR) - Français</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Time zone</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#6355F4]"
                      >
                        <option value="UTC+05:30">UTC+05:30 (India Standard Time - IST)</option>
                        <option value="UTC+00:00">UTC+00:00 (Greenwich Mean Time - GMT)</option>
                        <option value="UTC-05:00">UTC-05:00 (Eastern Time - EST)</option>
                        <option value="UTC-08:00">UTC-08:00 (Pacific Time - PST)</option>
                        <option value="UTC+01:00">UTC+01:00 (Central European Time - CET)</option>
                        <option value="UTC+08:00">UTC+08:00 (Singapore / Hong Kong Time)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Additional Personal Details Form */}
                <div className="p-4 sm:p-5 rounded-2xl border border-gray-200/80 bg-white space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                    Personal & Startup Details
                  </h4>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Full name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Phone number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Job Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Startup / Venture</label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Bio & Vision</label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                      placeholder="Brief description about your background, startup focus, and goals..."
                    />
                  </div>
                </div>

                {/* Account Deactivation Option */}
                <div className="p-4 rounded-2xl border border-red-100 bg-red-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-red-900">Deactivate Account</h5>
                    <p className="text-[11px] text-red-600 mt-0.5">
                      Temporarily pause your access, notifications, and cohort mentorship assignments.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeactivateModal(true)}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-red-200 hover:bg-red-100/50 text-red-700 text-xs font-semibold transition-all cursor-pointer shrink-0"
                  >
                    Deactivate
                  </button>
                </div>

                {/* Actions Row: Save Changes & Sign out matching Screenshot */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleSaveAccount()}
                    disabled={isSavingAccount}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSavingAccount && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSavingAccount ? 'Saving...' : 'Save Changes'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: SECURITY SETTINGS */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Password Updates Notice Card matching Screenshot 3 */}
                <div className="p-5 rounded-2xl border border-gray-200/80 bg-gray-50/40 space-y-1.5">
                  <h4 className="text-sm font-bold text-gray-900">Password updates</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Update your password regularly to keep your incubator venture and sensitive fundraising data safe.
                    Passwords must contain at least 8 characters, including letters and numbers.
                  </p>
                </div>

                {/* Password Form matching Screenshot 3 */}
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Current password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4] pr-16"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-800"
                        >
                          {showCurrentPw ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">New password</label>
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4] pr-16"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-800"
                        >
                          {showNewPw ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Confirm new password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4] pr-16"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-800"
                        >
                          {showConfirmPw ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="flex flex-col justify-end pb-1 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600">
                          <span>Password Strength:</span>
                          <span
                            className={
                              pwStrength.score >= 3
                                ? 'text-emerald-600 font-bold'
                                : pwStrength.score === 2
                                ? 'text-amber-600 font-bold'
                                : 'text-red-500 font-bold'
                            }
                          >
                            {pwStrength.label}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${pwStrength.color} transition-all duration-300`}
                            style={{ width: `${(pwStrength.score / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Buttons matching Screenshot 3: Update password button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="px-6 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {isUpdatingPassword && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isUpdatingPassword ? 'Verifying...' : 'Update password'}</span>
                    </button>
                  </div>
                </form>

                {/* Two-Factor Authentication Card */}
                <div className="p-5 rounded-2xl border border-gray-200/80 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#6355F4] flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Two-Factor Authentication (2FA)</h4>
                        <p className="text-xs text-gray-500">
                          Add an extra layer of security when logging into your incubation portal.
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggle2FA(!twoFactorEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        twoFactorEnabled ? 'bg-[#6355F4]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {twoFactorEnabled && (
                    <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-purple-900">Authenticator Secret Key</p>
                          <p className="text-xs font-mono text-purple-700 bg-white px-2 py-1 rounded-md border border-purple-200 inline-block mt-1">
                            {twoFactorSecret}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(twoFactorSecret);
                            setCopiedCode(true);
                            setTimeout(() => setCopiedCode(false), 2000);
                          }}
                          className="flex items-center gap-1 text-xs text-[#6355F4] font-semibold hover:underline"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode ? 'Copied' : 'Copy Key'}</span>
                        </button>
                      </div>

                      {backupCodes.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-700 mb-1.5">Backup Recovery Codes:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {backupCodes.map((code, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] font-mono bg-white border border-gray-200 rounded px-2 py-1 text-center font-semibold text-gray-700"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Active Sessions Card */}
                <div className="p-5 rounded-2xl border border-gray-200/80 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Active Sessions</h4>
                      <p className="text-xs text-gray-500">
                        Devices currently signed in to your startup incubation portal.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogoutOthers}
                      disabled={isLoggingOutOthers}
                      className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {isLoggingOutOthers && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>Logout other devices</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {activeSessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600">
                            {sess.device.toLowerCase().includes('mobile') ||
                            sess.device.toLowerCase().includes('safari') ? (
                              <Smartphone className="w-4 h-4" />
                            ) : (
                              <Laptop className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-gray-900">{sess.device}</p>
                              {sess.current && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  Current Device
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {sess.location} • IP {sess.ip} • {sess.lastActive}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Login Activity History */}
                <div className="p-5 rounded-2xl border border-gray-200/80 bg-white space-y-3">
                  <h4 className="text-sm font-bold text-gray-900">Recent Login Activity</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                          <th className="pb-2">Date & Time</th>
                          <th className="pb-2">Device</th>
                          <th className="pb-2">IP Address</th>
                          <th className="pb-2">Location</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-gray-700">
                        {loginHistory.slice(0, 4).map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="py-2.5 font-mono text-[11px]">
                              {new Date(item.timestamp).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </td>
                            <td className="py-2.5">{item.device}</td>
                            <td className="py-2.5 font-mono text-[11px]">{item.ip}</td>
                            <td className="py-2.5">{item.location}</td>
                            <td className="py-2.5 text-right">
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Sign out matching Screenshot 3 */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: NOTIFICATIONS SETTINGS */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {/* 10 Working Notification Cards matching Screenshot 4 */}
                {[
                  {
                    key: 'emailNotifications' as const,
                    title: 'Email notifications',
                    desc: 'Receive helpful updates in your inbox.',
                  },
                  {
                    key: 'mentorSessionReminders' as const,
                    title: 'Mentor session reminders',
                    desc: 'Get nudges before important sessions.',
                  },
                  {
                    key: 'milestoneUpdates' as const,
                    title: 'Milestone updates',
                    desc: 'Track progress on startup milestones.',
                  },
                  {
                    key: 'resourceAnnouncements' as const,
                    title: 'Resource announcements',
                    desc: 'Hear about workspace resources and availability.',
                  },
                  {
                    key: 'workspaceActivity' as const,
                    title: 'Workspace activity',
                    desc: 'See product updates and collaboration events.',
                  },
                  {
                    key: 'importantAccountAlerts' as const,
                    title: 'Important account alerts',
                    desc: 'Critical security and account status updates.',
                  },
                  {
                    key: 'courseRecommendations' as const,
                    title: 'Course recommendations',
                    desc: 'AI-driven course suggestions based on your startup stage.',
                  },
                  {
                    key: 'aiAnalysisUpdates' as const,
                    title: 'AI Analysis updates',
                    desc: 'Instant alerts when startup diagnostics or growth reports finish.',
                  },
                  {
                    key: 'inAppNotifications' as const,
                    title: 'In-app notifications',
                    desc: 'Real-time alerts inside your incubation workspace.',
                  },
                  {
                    key: 'marketingAnnouncements' as const,
                    title: 'Platform announcements',
                    desc: 'Product releases, feature spotlights, and events.',
                  },
                ].map((item) => {
                  const isChecked = !!notifications[item.key];
                  return (
                    <div
                      key={item.key}
                      className="p-5 rounded-2xl border border-gray-200/80 bg-white flex items-center justify-between transition-all hover:border-purple-200"
                    >
                      <div className="pr-4">
                        <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>

                      {/* Custom Purple Toggle Switch matching Screenshot 4 */}
                      <button
                        type="button"
                        onClick={() =>
                          setNotifications((prev) => ({
                            ...prev,
                            [item.key]: !isChecked,
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isChecked ? 'bg-[#6355F4]' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isChecked ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}

                {/* Actions Row: Save Preferences & Sign out matching Screenshot 4 */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleSaveNotifications}
                    disabled={isSavingNotifications}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSavingNotifications && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSavingNotifications ? 'Saving...' : 'Save Preferences'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: APPEARANCE SETTINGS */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* Visual Theme Selector Cards matching Screenshot 5 */}
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Light Theme Card */}
                  <div
                    onClick={() => {
                      const updated = { ...appearance, theme: 'light' as const };
                      setAppearance(updated);
                      handleSaveAppearance(updated);
                    }}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      appearance.theme === 'light'
                        ? 'border-[#6355F4] ring-2 ring-purple-100 bg-white'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {/* Wireframe Mockup Graphic matching Screenshot 5 */}
                    <div className="w-full h-24 bg-[#F8F9FD] rounded-xl border border-gray-200 p-2.5 space-y-2 mb-4">
                      <div className="w-full h-3 bg-purple-100/70 rounded-md" />
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-10 bg-purple-100/50 rounded-lg" />
                        <div className="h-10 bg-purple-100/50 rounded-lg" />
                        <div className="h-10 bg-purple-100/50 rounded-lg" />
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">Light theme</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Default dashboard appearance with a calm workspace feel.
                    </p>
                  </div>

                  {/* System Theme Card matching Screenshot 5 */}
                  <div
                    onClick={() => {
                      const updated = { ...appearance, theme: 'system' as const };
                      setAppearance(updated);
                      handleSaveAppearance(updated);
                    }}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      appearance.theme === 'system'
                        ? 'border-[#6355F4] ring-2 ring-purple-100 bg-white'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {/* Wireframe Mockup Graphic matching Screenshot 5 */}
                    <div className="w-full h-24 bg-[#F8F9FD] rounded-xl border border-gray-200 p-2.5 space-y-2 mb-4">
                      <div className="w-full h-3 bg-gray-200/70 rounded-md" />
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-10 bg-gray-200/60 rounded-lg" />
                        <div className="h-10 bg-gray-200/60 rounded-lg" />
                        <div className="h-10 bg-gray-200/60 rounded-lg" />
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">System theme</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Follow the operating system preference automatically across mobile and desktop.
                    </p>
                  </div>
                </div>

                {/* Dark Theme Option */}
                <div
                  onClick={() => {
                    const updated = { ...appearance, theme: 'dark' as const };
                    setAppearance(updated);
                    handleSaveAppearance(updated);
                  }}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    appearance.theme === 'dark'
                      ? 'border-[#6355F4] ring-2 ring-purple-100 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4
                        className={`text-sm font-bold ${
                          appearance.theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        Dark mode
                      </h4>
                      <p
                        className={`text-xs mt-0.5 ${
                          appearance.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        Deep contrast aesthetic designed for late-night incubation coding sessions.
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        appearance.theme === 'dark'
                          ? 'bg-purple-900 text-purple-200 border border-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {appearance.theme === 'dark' ? 'Selected' : 'Select'}
                    </span>
                  </div>
                </div>

                {/* Accent Color Palette Selector */}
                <div className="p-5 rounded-2xl border border-gray-200/80 bg-white space-y-3">
                  <h4 className="text-sm font-bold text-gray-900">Theme Colour Selection</h4>
                  <p className="text-xs text-gray-500">
                    Choose an accent color to personalize your incubator controls and badges.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    {[
                      { name: 'Incubator Purple', hex: '#6355F4' },
                      { name: 'Ocean Blue', hex: '#2563EB' },
                      { name: 'Emerald Green', hex: '#059669' },
                      { name: 'Rose Red', hex: '#E11D48' },
                      { name: 'Amber Gold', hex: '#D97706' },
                    ].map((c) => {
                      const isSelected = appearance.themeColor === c.hex;
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => {
                            const updated = { ...appearance, themeColor: c.hex };
                            setAppearance(updated);
                            handleSaveAppearance(updated);
                          }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            isSelected ? 'ring-3 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sidebar & Font Size Configuration */}
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Sidebar Appearance */}
                  <div className="p-5 rounded-2xl border border-gray-200/80 bg-white space-y-3">
                    <h4 className="text-sm font-bold text-gray-900">Sidebar Appearance</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'expanded' as const, label: 'Expanded' },
                        { id: 'compact' as const, label: 'Compact' },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => {
                            const updated = { ...appearance, sidebarMode: mode.id };
                            setAppearance(updated);
                            handleSaveAppearance(updated);
                          }}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            appearance.sidebarMode === mode.id
                              ? 'border-[#6355F4] bg-purple-50 text-[#6355F4]'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div className="p-5 rounded-2xl border border-gray-200/80 bg-white space-y-3">
                    <h4 className="text-sm font-bold text-gray-900">Workspace Font Size</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'small' as const, label: 'Small' },
                        { id: 'normal' as const, label: 'Normal' },
                        { id: 'large' as const, label: 'Large' },
                      ].map((sz) => (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => {
                            const updated = { ...appearance, fontSize: sz.id };
                            setAppearance(updated);
                            handleSaveAppearance(updated);
                          }}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            appearance.fontSize === sz.id
                              ? 'border-[#6355F4] bg-purple-50 text-[#6355F4]'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Sign out matching Screenshot 5 */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: PRIVACY SETTINGS */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                {/* Profile Visibility & Workspace Activity Cards matching Screenshot 6 */}
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Left: Profile Visibility Dropdown matching Screenshot 6 */}
                  <div className="p-5 rounded-2xl border border-gray-200/80 bg-white space-y-2">
                    <label className="block text-sm font-bold text-gray-900">
                      Profile visibility
                    </label>
                    <select
                      value={privacy.profileVisibility}
                      onChange={(e) =>
                        setPrivacy((prev) => ({
                          ...prev,
                          profileVisibility: e.target.value as any,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#6355F4] cursor-pointer"
                    >
                      <option value="workspace">Visible to workspace members</option>
                      <option value="public">Public to entire platform</option>
                      <option value="mentors_only">Only visible to mentors & admins</option>
                      <option value="private">Private (only me)</option>
                    </select>
                  </div>

                  {/* Right: Workspace Activity Visibility Toggle matching Screenshot 6 */}
                  <div className="p-5 rounded-2xl border border-gray-200/80 bg-white flex items-center justify-between">
                    <div className="pr-3">
                      <h4 className="text-sm font-bold text-gray-900">Workspace activity visibility</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Show your recent activity to members in this workspace.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPrivacy((prev) => ({
                          ...prev,
                          workspaceActivityVisibility: !prev.workspaceActivityVisibility,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        privacy.workspaceActivityVisibility ? 'bg-[#6355F4]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          privacy.workspaceActivityVisibility ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Privacy Information Card matching Screenshot 6 */}
                <div className="p-5 rounded-2xl border border-gray-200/80 bg-white space-y-2">
                  <h4 className="text-sm font-bold text-gray-900">Privacy information</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Workspace privacy settings are synchronized with our enterprise database and enforced by
                    role-based security access controls. Only authorized incubator members and mentors can inspect
                    your venture progress.
                  </p>
                </div>

                {/* Additional Privacy Controls */}
                <div className="p-5 rounded-2xl border border-gray-200/80 bg-white space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                    Data Sharing & Compliance
                  </h4>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">Share contact with assigned mentors</p>
                      <p className="text-[11px] text-gray-500">Allow mentors to view your direct phone and email.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPrivacy((prev) => ({
                          ...prev,
                          contactInfoVisibility: !prev.contactInfoVisibility,
                        }))
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        privacy.contactInfoVisibility ? 'bg-[#6355F4]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          privacy.contactInfoVisibility ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">Anonymized analytics for AI suggestions</p>
                      <p className="text-[11px] text-gray-500">
                        Help refine course recommendations and startup milestone benchmarks.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPrivacy((prev) => ({
                          ...prev,
                          dataSharingAI: !prev.dataSharingAI,
                        }))
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        privacy.dataSharingAI ? 'bg-[#6355F4]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          privacy.dataSharingAI ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>



                {/* Actions Row: Save Preferences & Sign out matching Screenshot 6 */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSavePrivacy}
                      disabled={isSavingPrivacy}
                      className="px-6 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {isSavingPrivacy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isSavingPrivacy ? 'Saving...' : 'Save Privacy Preferences'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPrivacyPolicyModal(true)}
                      className="text-xs text-gray-500 hover:text-[#6355F4] font-semibold underline"
                    >
                      View Privacy Policy
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 6: WORKSPACE SETTINGS */}
            {activeTab === 'workspace' && (
              <div className="space-y-6">
                {/* Workspace Defaults Card matching Screenshot 7 */}
                <div className="p-5 rounded-2xl border border-gray-200/80 bg-white space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                    Workspace defaults
                  </h4>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Workspace name matching Screenshot 7 */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Workspace name
                      </label>
                      <input
                        type="text"
                        value={workspace.name}
                        onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                      />
                    </div>

                    {/* Default landing page matching Screenshot 7 */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Default landing page
                      </label>
                      <select
                        value={workspace.defaultLandingPage}
                        onChange={(e) =>
                          setWorkspace({ ...workspace, defaultLandingPage: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4] cursor-pointer"
                      >
                        <option value="Dashboard">Dashboard</option>
                        <option value="Startups">Startups & Ventures</option>
                        <option value="Courses & Learning">Courses & Learning</option>
                        <option value="AI Incubation Suite">AI Incubation Suite</option>
                        <option value="Mentorship">Mentorship</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Workspace Description
                    </label>
                    <textarea
                      rows={2}
                      value={workspace.description}
                      onChange={(e) => setWorkspace({ ...workspace, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                    />
                  </div>
                </div>

                {/* Workspace Members & Collaboration */}
                <div className="p-5 rounded-2xl border border-gray-200/80 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Workspace Members</h4>
                      <p className="text-xs text-gray-500">
                        Collaborators and founders currently active in this incubator workspace.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Invite Member</span>
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                    {workspaceMembers.map((member) => (
                      <div key={member.id} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={member.avatar}
                            alt={member.name}
                            size="sm"
                            shape="circle"
                            border={true}
                          />
                          <div>
                            <p className="text-xs font-bold text-gray-900">{member.name}</p>
                            <p className="text-[11px] text-gray-400">{member.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              member.role === 'admin'
                                ? 'bg-rose-100 text-rose-700'
                                : member.role === 'mentor'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {member.role}
                          </span>
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                            Active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Role Permissions Matrix */}
                <div className="p-5 rounded-2xl border border-gray-200/80 bg-white space-y-3">
                  <h4 className="text-sm font-bold text-gray-900">Member Roles & Permissions</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                          <th className="pb-2">Capability</th>
                          <th className="pb-2 text-center">Founder</th>
                          <th className="pb-2 text-center">Mentor</th>
                          <th className="pb-2 text-center">Admin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-gray-700">
                        <tr>
                          <td className="py-2">Manage Startup Profile</td>
                          <td className="py-2 text-center text-emerald-600">✓</td>
                          <td className="py-2 text-center text-gray-400">-</td>
                          <td className="py-2 text-center text-emerald-600">✓</td>
                        </tr>
                        <tr>
                          <td className="py-2">Book Mentorship Sessions</td>
                          <td className="py-2 text-center text-emerald-600">✓</td>
                          <td className="py-2 text-center text-emerald-600">✓</td>
                          <td className="py-2 text-center text-emerald-600">✓</td>
                        </tr>
                        <tr>
                          <td className="py-2">Access AI Incubation Tools</td>
                          <td className="py-2 text-center text-emerald-600">✓</td>
                          <td className="py-2 text-center text-emerald-600">✓</td>
                          <td className="py-2 text-center text-emerald-600">✓</td>
                        </tr>
                        <tr>
                          <td className="py-2">Edit Platform & Workspace Settings</td>
                          <td className="py-2 text-center text-gray-400">-</td>
                          <td className="py-2 text-center text-gray-400">-</td>
                          <td className="py-2 text-center text-emerald-600">✓</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Actions Row: Save Changes & Sign out matching Screenshot 7 */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleSaveWorkspace}
                    disabled={isSavingWorkspace}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSavingWorkspace && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSavingWorkspace ? 'Saving...' : 'Save Workspace Changes'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 7: PROFILE SETTINGS (PRESERVED) */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 flex items-center gap-4">
                  <UserAvatar
                    src={avatar}
                    alt={name}
                    size="xl"
                    shape="rounded-square"
                    border={true}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 leading-tight">{name}</h4>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">@{username}</p>
                    <span className="inline-block text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full capitalize mt-1.5">
                      {user?.role || 'Founder'}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSaveAccount} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role</label>
                      <input
                        type="text"
                        value={user?.role || 'founder'}
                        readOnly
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 capitalize cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Bio</label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="submit"
                        disabled={isSavingAccount}
                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                      >
                        {isSavingAccount ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={logout}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Deactivate Account */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Deactivate Account</h3>
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to temporarily deactivate your account? Your venture metrics, enrolled courses, and
              mentor links will be paused until you sign back in.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason for leaving (Optional)
              </label>
              <input
                type="text"
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="e.g. Taking a founder sabbatical..."
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-red-400"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL: Privacy Policy */}
      {showPrivacyPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#6355F4]" />
                <h3 className="text-base font-bold text-gray-900">Incubator Privacy Policy</h3>
              </div>
              <button
                onClick={() => setShowPrivacyPolicyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-600 space-y-3 leading-relaxed">
              <p>
                <strong>1. Data Confidentiality:</strong> All startup intellectual property, cap tables, pitch decks,
                and financial estimates entered into this incubation management suite remain the exclusive property of
                the founding team.
              </p>
              <p>
                <strong>2. Mentor Sharing:</strong> Mentor notes, cohort assignments, and meeting reminders are only
                accessible to designated advisors bound by formal non-disclosure agreements.
              </p>
              <p>
                <strong>3. AI Intelligence:</strong> Machine learning recommendations and course matching utilize
                secure sandboxed prompts. No proprietary venture data is sold or trained on external public LLMs.
              </p>
              <p>
                <strong>4. Security & Retention:</strong> All passwords and sensitive tokens are hashed using SHA-256
                cryptography. Active sessions and device telemetry are retained for 90 days for breach prevention.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPrivacyPolicyModal(false)}
                className="px-5 py-2 bg-[#6355F4] text-white rounded-xl text-xs font-semibold"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Invite Workspace Member */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleInviteMember}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#6355F4]" />
                <span>Invite Workspace Member</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Collaborator Email Address
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="founder@venture.com"
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6355F4]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6355F4]"
              >
                <option value="founder">Founder (Access to Startup tools & AI Suite)</option>
                <option value="mentor">Mentor (Mentorship sessions & Cohort review)</option>
                <option value="admin">Admin (Full workspace administration)</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isInviting}
                className="px-5 py-2 bg-[#6355F4] hover:bg-[#5244E0] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                {isInviting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Send Invitation</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
