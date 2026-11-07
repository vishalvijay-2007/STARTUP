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
  Download,
  IndianRupee,
} from 'lucide-react';
import { formatINR } from '../../utils/currency';
import { BrandLogo } from '../common/BrandLogo';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Startup, Cohort, MentorSession, Milestone } from '../../types';

interface AnalyticsPageProps {
  startups: Startup[];
  cohorts: Cohort[];
  sessions: MentorSession[];
  milestones: Milestone[];
  mentorsCount: number;
  resourceUtilization: number;
  avgProgress: number;
  onRefresh: () => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  startups,
  cohorts,
  sessions,
  milestones,
  mentorsCount,
  resourceUtilization,
  avgProgress,
  onRefresh,
}) => {
  const activeStartupsCount = startups.filter((s) => s.status === 'active').length;
  const activeCohortsCount = cohorts.filter((c) => c.status === 'Active').length;
  const sessionsCompletedCount = sessions.filter((s) => s.status === 'Completed').length;
  const openMilestonesCount = milestones.filter((m) => m.status !== 'completed').length;

  const totalFundingRequired = startups.reduce((acc, s) => acc + (s.fundingRequired || 0), 0);
  const totalFundingRaised = startups.reduce((acc, s) => acc + (s.fundingRaised || 0), 0);
  const totalMonthlyRevenue = startups.reduce((acc, s) => acc + (s.monthlyRevenue || 0), 0);

  const statCards = [
    { title: 'Total startups', value: startups.length, icon: Building2, iconBg: 'bg-purple-50 text-[#6355F4]' },
    { title: 'Active startups', value: activeStartupsCount, icon: TrendingUp, iconBg: 'bg-blue-50 text-blue-600' },
    { title: 'Mentors', value: mentorsCount, icon: UserPlus, iconBg: 'bg-emerald-50 text-emerald-600' },
    { title: 'Active cohorts', value: activeCohortsCount, icon: Users, iconBg: 'bg-amber-50 text-amber-600' },
    { title: 'Sessions completed', value: sessionsCompletedCount, icon: CalendarCheck, iconBg: 'bg-teal-50 text-teal-600' },
    { title: 'Open milestones', value: openMilestonesCount, icon: Flag, iconBg: 'bg-rose-50 text-rose-600' },
    { title: 'Resource utilization', value: `${resourceUtilization}%`, icon: BarChart2, iconBg: 'bg-orange-50 text-orange-600' },
    { title: 'Average progress', value: `${avgProgress}%`, icon: Clock, iconBg: 'bg-indigo-50 text-indigo-600' },
  ];

  // Chart data: Startup progress distribution
  const progressChartData = startups.map((s) => ({
    name: s.name.length > 14 ? s.name.substring(0, 12) + '...' : s.name,
    progress: s.progress,
    revenue: s.monthlyRevenue,
  }));

  // Category breakdown of milestones
  const categoryCountMap: Record<string, number> = {};
  milestones.forEach((m) => {
    categoryCountMap[m.category] = (categoryCountMap[m.category] || 0) + 1;
  });

  const categoryChartData = Object.entries(categoryCountMap).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#6355F4', '#38BDF8', '#10B981', '#F59E0B', '#EC4899'];

  const monthlyGrowthData = [
    { month: 'Jun', startups: 1, sessions: 2 },
    { month: 'Jul', startups: 2, sessions: 4 },
    { month: 'Aug', startups: 4, sessions: 8 },
    { month: 'Sep', startups: 6, sessions: 14 },
    { month: 'Oct', startups: 7, sessions: 19 },
    { month: 'Nov', startups: startups.length + 6, sessions: 25 },
  ];

  return (
    <div className="space-y-6">
      {/* Header matching Screenshot 9 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <BrandLogo variant="badge" className="mb-1.5" />
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Analytics & reports
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            A live view of startup progress, mentoring activity, and resources.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh data</span>
        </button>
      </div>

      {/* 8 Stat Cards in 2 rows of 4 matching Screenshot 9 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Portfolio Financial Overview (INR ₹) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50/70 to-white rounded-2xl p-5 border border-purple-100 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-[#6355F4]/10 text-[#6355F4] flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-700">Total Portfolio Target Capital</p>
              <p className="text-[10px] text-gray-400">Aggregated goal across all ventures</p>
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight mt-1">
            {formatINR(totalFundingRequired)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/70 to-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-700">Total Capital Raised</p>
              <p className="text-[10px] text-gray-400">Secured institutional & angel funding</p>
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 tracking-tight mt-1">
            {formatINR(totalFundingRaised)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50/70 to-white rounded-2xl p-5 border border-blue-100 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-700">Portfolio Monthly Revenue (MRR)</p>
              <p className="text-[10px] text-gray-400">Combined monthly recurring revenue</p>
            </div>
          </div>
          <p className="text-2xl font-extrabold text-blue-700 tracking-tight mt-1">
            {formatINR(totalMonthlyRevenue)}
          </p>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Progress by Startup */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900">Startup Progress (%)</h3>
            <p className="text-[11px] text-gray-400">Milestone execution across current portfolio</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any) => [`${value}%`, 'Progress']}
                />
                <Bar dataKey="progress" fill="#6355F4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Recurring Revenue by Startup (INR ₹) */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900">Monthly Revenue by Startup (INR ₹)</h3>
            <p className="text-[11px] text-gray-400">Monthly recurring commercial revenue in Indian Rupees</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => {
                    if (val >= 10000000) return `₹${val / 10000000}Cr`;
                    if (val >= 100000) return `₹${val / 100000}L`;
                    if (val >= 1000) return `₹${val / 1000}k`;
                    return `₹${val}`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any) => [formatINR(value), 'Monthly Revenue']}
                />
                <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incubation Monthly Velocity */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900">Incubation Growth & Sessions</h3>
            <p className="text-[11px] text-gray-400">Active ventures and completed touchpoints</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke="#6355F4"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6355F4' }}
                />
                <Line
                  type="monotone"
                  dataKey="startups"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#38BDF8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
