import React from 'react';
import {
  RotateCcw,
  Building2,
  TrendingUp,
  UserPlus,
  Users,
  CalendarCheck,
  Flag,
  BarChart2,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Calendar,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { Startup, MentorSession, Cohort, Milestone } from '../../types';
import { formatINR } from '../../utils/currency';
import { BrandLogo } from '../common/BrandLogo';
import { SvgRocketIcon, SvgRupeeSymbol } from '../common/SvgIcons';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../common/UserAvatar';

interface FounderDashboardProps {
  startups: Startup[];
  sessions: MentorSession[];
  cohorts: Cohort[];
  milestones: Milestone[];
  mentorsCount: number;
  resourceUtilization: number;
  avgProgress: number;
  onRefresh: () => void;
  onNavigate: (tab: any) => void;
  onOpenAddStartup: () => void;
  onOpenAddSession: () => void;
}

export const FounderDashboard: React.FC<FounderDashboardProps> = ({
  startups,
  sessions,
  cohorts,
  milestones,
  mentorsCount,
  resourceUtilization,
  avgProgress,
  onRefresh,
  onNavigate,
  onOpenAddStartup,
  onOpenAddSession,
}) => {
  const { user } = useAuth();
  const activeStartupsCount = startups.filter((s) => s.status === 'active').length;
  const activeCohortsCount = cohorts.filter((c) => c.status === 'Active').length;
  const sessionsCompletedCount = sessions.filter((s) => s.status === 'Completed').length;
  const openMilestonesCount = milestones.filter((m) => m.status !== 'completed').length;
  const upcomingSessions = sessions.filter((s) => s.status === 'Scheduled');

  // Stat cards matching Screenshot 3 exactly
  const statCards = [
    {
      title: 'Total startups',
      value: startups.length,
      icon: Building2,
      iconBg: 'bg-purple-50 text-[#6355F4]',
    },
    {
      title: 'Active startups',
      value: activeStartupsCount,
      icon: TrendingUp,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Mentors',
      value: mentorsCount,
      icon: UserPlus,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Active cohorts',
      value: activeCohortsCount,
      icon: Users,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Sessions completed',
      value: sessionsCompletedCount,
      icon: CalendarCheck,
      iconBg: 'bg-teal-50 text-teal-600',
    },
    {
      title: 'Open milestones',
      value: openMilestonesCount,
      icon: Flag,
      iconBg: 'bg-rose-50 text-rose-600',
    },
    {
      title: 'Resource utilization',
      value: `${resourceUtilization}%`,
      icon: BarChart2,
      iconBg: 'bg-orange-50 text-orange-600',
    },
    {
      title: 'Average progress',
      value: `${avgProgress}%`,
      icon: Clock,
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header matching Screenshot 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <BrandLogo variant="badge" className="mb-1.5" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Founder Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            A live view of startup progress, mentoring activity, and resources.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-2xl border border-gray-200 shadow-2xs">
            <UserAvatar
              src={user?.avatar}
              alt={user?.name || 'Founder'}
              size="sm"
              shape="rounded-square"
              border={true}
              statusBadge="active"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-gray-900 leading-tight">{user?.name || 'vishal'}</p>
              <p className="text-[10px] text-[#6355F4] font-semibold">{user?.company || 'PulseAI Diagnostics'}</p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Refresh data</span>
          </button>
        </div>
      </div>

      {/* SVG Feature Banner */}
      <div className="bg-gradient-to-r from-[#6355F4] to-[#4F3FD9] rounded-3xl p-5 sm:p-6 text-white shadow-lg shadow-purple-500/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[11px] sm:text-xs font-bold text-purple-100 mb-3 border border-white/20">
            <SvgRocketIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Chennai Incubation Hub • Indian Rupees (INR ₹)</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black tracking-tight leading-snug">
            Scale your venture with institutional mentoring & AI co-pilots
          </h2>
          <p className="text-xs sm:text-sm text-purple-100 mt-2 leading-relaxed">
            Monitor real-time startup valuations, cash runways, and mentor advisories with institutional reliability.
          </p>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-4 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
              <SvgRupeeSymbol className="w-3.5 h-3.5 text-emerald-300 shrink-0" /> INR Seed Funding
            </span>
            <span className="inline-flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-300 shrink-0" /> Vetted Mentorship
            </span>
          </div>
        </div>
        <div className="relative z-10 shrink-0 w-36 h-28 hidden sm:flex items-center justify-center">
          <img
            src="/assets/svg/rocket-launch.svg"
            alt="Rocket Launch"
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        </div>
      </div>

      {/* 8 Stat Cards in 2 rows of 4 matching Screenshot 3 */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] font-semibold text-gray-500 mt-3 truncate">{card.title}</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-0.5">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* 2x2 Grid Section matching Screenshot 2 & 3 */}
      <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
        {/* Card 1: Startup Progress */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Startup progress</h3>
                <p className="text-[11px] text-gray-400">Milestone completion by startup</p>
              </div>
              <button
                onClick={() => onNavigate('startups')}
                className="text-xs font-semibold text-[#6355F4] hover:underline flex items-center gap-1 shrink-0"
              >
                View startups &rarr;
              </button>
            </div>

            {startups.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#6355F4] flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">No startup data yet</h4>
                <p className="text-xs text-gray-500 max-w-xs mt-1 mb-4">
                  Add a startup and milestones to see real progress here.
                </p>
                <button
                  onClick={onOpenAddStartup}
                  className="bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Add your first startup
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {startups.map((s) => (
                  <div key={s.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-xs text-gray-900 truncate">{s.name}</span>
                      <span className="text-xs font-bold text-[#6355F4] shrink-0">{s.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#6355F4] to-[#8A79FF] h-full rounded-full transition-all duration-500"
                        style={{ width: `${s.progress}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2 text-[10px] text-gray-500">
                      <span>Stage: {s.stage} • Target: <strong className="text-gray-700 font-semibold">{formatINR(s.fundingRequired)}</strong></span>
                      <span>Mentor: {s.mentorName || 'Unassigned'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Upcoming Sessions */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Upcoming sessions</h3>
                <p className="text-[11px] text-gray-400">Scheduled mentor touchpoints</p>
              </div>
              <button
                onClick={() => onNavigate('sessions')}
                className="text-xs font-semibold text-[#6355F4] hover:underline flex items-center gap-1 shrink-0"
              >
                See all &rarr;
              </button>
            </div>

            {upcomingSessions.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#6355F4] flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Nothing scheduled</h4>
                <p className="text-xs text-gray-500 max-w-xs mt-1 mb-4">
                  Schedule a mentor session to keep your startups moving.
                </p>
                <button
                  onClick={onOpenAddSession}
                  className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  View sessions
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h5 className="font-bold text-xs text-gray-900">{session.title}</h5>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          With {session.mentorName} • {session.startupName}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full shrink-0">
                        {session.date} at {session.time}
                      </span>
                    </div>
                    {session.meetingLink && (
                      <a
                        href={session.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-[#6355F4] font-semibold hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Join Meeting Link
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Recently added startups */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Recently added startups</h3>
                <p className="text-[11px] text-gray-400">Your latest workspace activity</p>
              </div>
              <button
                onClick={() => onNavigate('startups')}
                className="text-xs font-semibold text-[#6355F4] hover:underline flex items-center gap-1 shrink-0"
              >
                View all &rarr;
              </button>
            </div>

            {startups.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#6355F4] flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Welcome to your workspace</h4>
                <p className="text-xs text-gray-500 max-w-xs mt-1 mb-4">
                  Create your first startup record to begin tracking your cohort.
                </p>
                <button
                  onClick={onOpenAddStartup}
                  className="bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Add startup
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {startups.slice(0, 2).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => onNavigate('startups')}
                    className="p-3.5 rounded-xl border border-gray-100 hover:border-purple-200 bg-white transition-all cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6355F4] font-bold flex items-center justify-center text-xs shrink-0">
                        {s.name[0]}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs text-gray-900 truncate">{s.name}</h5>
                        <p className="text-[10px] text-gray-500 truncate">{s.tagline}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full shrink-0">
                      {s.industry}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Incubation at a glance */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Incubation at a glance</h3>
                <p className="text-[11px] text-gray-400">Program portfolio summary</p>
              </div>
            </div>

            <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2.5 sm:gap-3 my-4">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-medium">All cohorts</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{cohorts.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-medium">Active mentors</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{mentorsCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-medium">Open milestones</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{openMilestonesCount}</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('analytics')}
              className="w-full mt-2 py-2.5 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Explore analytics &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
