import React, { useState } from 'react';
import {
  Users,
  CalendarCheck,
  Sparkles,
  Clock,
  ExternalLink,
  Star,
  AlertCircle,
  User as UserIcon,
  Briefcase,
  Mail,
  Phone,
  Award,
  X,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Startup, MentorSession, Milestone, User } from '../../types';
import { formatINR } from '../../utils/currency';
import { BrandLogo } from '../common/BrandLogo';
import { SvgShieldVerified } from '../common/SvgIcons';
import { UserAvatar } from '../common/UserAvatar';

interface MentorDashboardProps {
  startups: Startup[];
  sessions: MentorSession[];
  milestones: Milestone[];
  onNavigate: (tab: any) => void;
  onOpenScheduleSession: (mentor?: User) => void;
  onAddSession?: (data: Partial<MentorSession>) => Promise<void>;
  onSubmitFeedback: (sessionId: string, feedback: string, rating: number) => void;
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({
  startups,
  sessions,
  onNavigate,
  onOpenScheduleSession,
  onAddSession,
}) => {
  const { user, logout, switchRole } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Session booking form state
  const [selectedStartupId, setSelectedStartupId] = useState(startups[0]?.id || '');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionAgenda, setSessionAgenda] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionTime, setSessionTime] = useState('14:00');
  const [sessionDuration, setSessionDuration] = useState('45');
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);

  const isPending = user?.status === 'pending';
  const isLeft = user?.status === 'left';
  const isSuspended = user?.status === 'suspended';
  const isRejected = user?.status === 'rejected';

  // Enforce Requirement 3 & 5: Only ACTIVE Mentors should have normal Mentor Dashboard access.
  if (isLeft || isSuspended || isRejected || isPending) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-lg text-center space-y-6">
          <div
            className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
              isLeft
                ? 'bg-slate-100 text-slate-700'
                : isSuspended || isRejected
                ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                isLeft
                  ? 'bg-slate-200 text-slate-800'
                  : isSuspended || isRejected
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              Account Status: {user?.status?.toUpperCase()}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {isLeft
                ? 'Mentor Account Offboarded — Access Revoked'
                : isSuspended
                ? 'Mentor Account Suspended'
                : isRejected
                ? 'Mentor Application Not Approved'
                : 'Mentor Application Pending Admin Approval'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
              {isLeft
                ? `Your Mentor account (${user?.name}) has been officially marked as LEFT by the Incubator Administration. Active Mentor Dashboard operations, cohort assignments, and session scheduling have been revoked.`
                : isSuspended
                ? `Your Mentor account (${user?.name}) is currently suspended. Only ACTIVE mentors are permitted to access the Mentor Dashboard and protected APIs.`
                : isRejected
                ? `Your Mentor application was not approved. ${user?.rejectionReason ? `Reason: ${user.rejectionReason}` : ''}`
                : 'Your Mentor application is currently awaiting Admin verification. Dashboard access will unlock automatically upon approval.'}
            </p>
          </div>

          {isLeft && user?.offboardingDetails && (
            <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                Official Offboarding Record
              </p>
              <div className="grid sm:grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Last Working Date</span>
                  <span className="font-bold text-slate-900">{user.offboardingDetails.lastWorkingDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Processed By</span>
                  <span className="font-bold text-slate-900">{user.offboardingDetails.offboardedBy}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Reason for Leaving</span>
                <span className="font-semibold text-slate-800">{user.offboardingDetails.reason}</span>
              </div>
              {user.offboardingDetails.reassignedToMentorName && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Responsibilities Reassigned To</span>
                  <span className="font-bold text-[#6355F4]">{user.offboardingDetails.reassignedToMentorName}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => switchRole('admin')}
              className="px-5 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
            >
              Switch to Admin Dashboard
            </button>
            <button
              onClick={logout}
              className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter assigned startups
  const assignedStartups = startups.filter(
    (s) => s.mentorId === user?.id || s.mentorName?.toLowerCase().includes(user?.name?.toLowerCase() || '')
  );

  const displayStartups = assignedStartups.length > 0 ? assignedStartups : startups;
  const mySessions = sessions.filter(
    (s) => s.mentorId === user?.id || s.mentorName?.toLowerCase().includes(user?.name?.toLowerCase() || '')
  );
  const completedSessions = mySessions.filter((s) => s.status === 'Completed');
  const scheduledSessions = mySessions.filter((s) => s.status === 'Scheduled');

  const handleOpenBookingForm = () => {
    if (onAddSession) {
      setSelectedStartupId(displayStartups[0]?.id || startups[0]?.id || '');
      setIsScheduleModalOpen(true);
    } else {
      onOpenScheduleSession(user || undefined);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim()) return;
    if (onAddSession) {
      setIsSubmittingSession(true);
      try {
        await onAddSession({
          startupId: selectedStartupId || displayStartups[0]?.id || startups[0]?.id,
          mentorId: user?.id,
          title: sessionTitle.trim(),
          agenda: sessionAgenda.trim(),
          date: sessionDate,
          time: sessionTime,
          durationMinutes: Number(sessionDuration) || 45,
        });
        setSessionTitle('');
        setSessionAgenda('');
        setIsScheduleModalOpen(false);
      } finally {
        setIsSubmittingSession(false);
      }
    } else {
      onOpenScheduleSession(user || undefined);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Mentor Profile Card */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <BrandLogo variant="badge" className="mb-1.5" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Mentor Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Welcome back, {user?.name}. Track your assigned founder teams, host 1:1 sessions, and log advisory guidance.
          </p>
        </div>

        {/* Mentor Profile Card with [ View Profile ] [ Schedule Mentoring Session ] */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 w-full xl:w-auto">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar
              src={user?.avatar}
              alt={user?.name || 'Dr. Sarah Chen'}
              size="md"
              shape="circle"
              border={true}
              statusBadge="active"
            />
            <div className="text-left min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight truncate">
                {user?.name || 'Dr. Sarah Chen'}
              </p>
              <p className="text-xs text-[#6355F4] font-semibold mt-0.5 truncate">
                {user?.title || 'Venture Partner & Tech Mentor'}
              </p>
            </div>
          </div>

          {/* Exact Button Order: 1. View Profile (Secondary Outlined) | 2. Schedule Mentoring Session (Primary Purple) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-white hover:bg-purple-50/70 text-gray-800 hover:text-[#6355F4] border border-gray-200 hover:border-[#6355F4]/40 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#6355F4] shrink-0" />
              <span>View Profile</span>
            </button>

            <button
              type="button"
              onClick={handleOpenBookingForm}
              className="h-10 px-4 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-md shadow-purple-500/20 inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 shrink-0" />
              <span>Schedule Mentoring Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* SVG Mentor Verification & Hub Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-[#2E2084] rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6355F4]/30 rounded-full text-[11px] sm:text-xs font-bold text-purple-200 mb-2 border border-purple-400/30">
            <SvgShieldVerified className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Accredited Incubator Advisory Panel</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Incubator Mentorship & Portfolio Advisory
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Your guidance steers early-stage founders towards product-market fit, unit economics in INR, and successful seed rounds.
          </p>
        </div>
        <div className="shrink-0 w-28 h-28 hidden sm:flex items-center justify-center">
          <img
            src="/assets/svg/mentor-shield.svg"
            alt="Mentor Shield"
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        </div>
      </div>

      {/* Mentor KPI Cards */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#6355F4] flex items-center justify-center mb-3">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold text-gray-400">Assigned Startups</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{displayStartups.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold text-gray-400">Sessions Completed</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{completedSessions.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold text-gray-400">Upcoming Touchpoints</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{scheduledSessions.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Star className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold text-gray-400">Founder Satisfaction</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-0.5">4.9 / 5.0</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left 2 Cols: Assigned Startups */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Your Mentees & Startups</h3>
                <p className="text-[11px] text-gray-400">Real-time execution velocity and milestones</p>
              </div>
              <button
                onClick={() => onNavigate('startups')}
                className="text-xs font-semibold text-[#6355F4] hover:underline cursor-pointer"
              >
                View all startups &rarr;
              </button>
            </div>

            <div className="space-y-4">
              {displayStartups.map((startup) => (
                <div
                  key={startup.id}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:border-purple-200 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6355F4] font-bold flex items-center justify-center text-sm">
                        {startup.name[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{startup.name}</h4>
                        <p className="text-[11px] text-gray-500">
                          Founder: {startup.founderName} • {startup.industry}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#6355F4]">
                        {startup.stage}
                      </span>
                      <span className="text-xs font-extrabold text-gray-800">
                        {startup.progress}% Progress
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-3">{startup.description}</p>

                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className="bg-gradient-to-r from-[#6355F4] to-[#8A79FF] h-full rounded-full"
                      style={{ width: `${startup.progress}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-gray-100 text-xs gap-2">
                    <span className="text-gray-500 text-[11px]">
                      Funding Goal: {formatINR(startup.fundingRequired)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStartupId(startup.id);
                          setIsScheduleModalOpen(true);
                        }}
                        className="text-xs font-bold text-[#6355F4] hover:underline cursor-pointer"
                      >
                        Schedule 1:1 Session
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Upcoming Sessions & Feedback */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Scheduled Touchpoints</h3>
            <p className="text-[11px] text-gray-400 mb-4">Upcoming 1:1 advisory sessions</p>

            {scheduledSessions.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No sessions scheduled.</p>
            ) : (
              <div className="space-y-3">
                {scheduledSessions.map((session) => (
                  <div key={session.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div className="flex items-start justify-between">
                      <h5 className="font-bold text-xs text-gray-900">{session.title}</h5>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        {session.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">{session.startupName}</p>
                    {session.meetingLink && (
                      <a
                        href={session.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#6355F4] font-semibold hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Join Google Meet
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Mentoring Coach Assistant Widget */}
          <div className="bg-gradient-to-tr from-purple-900 to-indigo-900 rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-200">
                AI Mentoring Assistant
              </h4>
            </div>
            <p className="text-xs text-purple-100/90 leading-relaxed mb-4">
              Need help structuring your critique or formulating high-impact milestones for your founder team?
            </p>
            <button
              onClick={() => onNavigate('ai-insights')}
              className="w-full bg-white text-[#6355F4] hover:bg-purple-50 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Open AI Feedback Coach &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: VIEW MENTOR PROFILE */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-3.5">
                <UserAvatar
                  src={user?.avatar}
                  alt={user?.name || 'Dr. Sarah Chen'}
                  size="lg"
                  shape="circle"
                  border={true}
                  statusBadge="active"
                />
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                    {user?.name || 'Dr. Sarah Chen'}
                  </h3>
                  <p className="text-xs font-semibold text-[#6355F4]">
                    {user?.title || 'Venture Partner & Tech Mentor'}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {user?.company || 'Horizon Ventures'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Experience</span>
                  <span className="font-extrabold text-gray-900 text-sm flex items-center gap-1 mt-0.5">
                    <Award className="w-3.5 h-3.5 text-[#6355F4]" />
                    {user?.yearsExperience || 15} Years
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Rating</span>
                  <span className="font-extrabold text-gray-900 text-sm flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    4.9 / 5.0
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Assigned Startups</span>
                  <span className="font-extrabold text-gray-900 text-sm flex items-center gap-1 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                    {displayStartups.length} Ventures
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50/70 rounded-2xl space-y-2 text-gray-700 border border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </span>
                  <span className="font-semibold text-gray-900">{user?.email || 'sarah.chen@stanford.edu'}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Phone
                  </span>
                  <span className="font-semibold text-gray-900">{user?.phone || '+91 98765 43211'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Biography & Advisory Focus
                </h4>
                <p className="p-3.5 bg-gray-50 rounded-2xl text-gray-700 leading-relaxed border border-gray-100">
                  {user?.bio ||
                    'Ex-VP AI Engineering at Google Cloud, Venture Partner, 15+ years scaling B2B & DeepTech SaaS.'}
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Areas of Expertise
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(user?.expertise && user.expertise.length > 0
                    ? user.expertise
                    : ['AI / ML Architecture', 'B2B SaaS Scaling', 'Series A Fundraising', 'Product Strategy']
                  ).map((exp, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 text-[#6355F4] font-semibold text-[11px]"
                    >
                      {exp}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  onNavigate('settings');
                }}
                className="h-10 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Edit Profile Settings</span>
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    handleOpenBookingForm();
                  }}
                  className="h-10 px-4 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-md shadow-purple-500/20 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Schedule Mentoring Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SCHEDULE MENTORING SESSION FORM */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Schedule Mentoring Session</h3>
                <p className="text-xs text-gray-500">
                  Book a 1:1 session with {user?.name || 'Dr. Sarah Chen'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mentor</label>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                  <UserAvatar
                    src={user?.avatar}
                    alt={user?.name || 'Dr. Sarah Chen'}
                    size="sm"
                    shape="circle"
                    border={true}
                    statusBadge="active"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{user?.name || 'Dr. Sarah Chen'}</p>
                    <p className="text-[10px] text-[#6355F4] font-semibold">
                      {user?.title || 'Venture Partner & Tech Mentor'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Startup</label>
                <select
                  value={selectedStartupId}
                  onChange={(e) => setSelectedStartupId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                >
                  {startups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.industry})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Session Title</label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Pitch Deck Review & Valuation Strategy"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Agenda & Prep</label>
                <textarea
                  rows={3}
                  value={sessionAgenda}
                  onChange={(e) => setSessionAgenda(e.target.value)}
                  placeholder="Topics to discuss, unit economics review, questions for mentor..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSession}
                  className="h-10 px-5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white font-semibold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingSession ? 'Scheduling...' : 'Confirm Session Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
