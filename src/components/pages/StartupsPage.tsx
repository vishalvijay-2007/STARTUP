import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Sparkles,
  ExternalLink,
  Users,
  Target,
  IndianRupee,
  TrendingUp,
  X,
  Trash2,
  Edit,
} from 'lucide-react';
import { Startup, Cohort, User } from '../../types';
import { formatINR } from '../../utils/currency';

interface StartupsPageProps {
  startups: Startup[];
  cohorts: Cohort[];
  mentors: User[];
  onAddStartup: (startupData: Partial<Startup>) => Promise<void>;
  onDeleteStartup: (id: string) => Promise<void>;
}

export const StartupsPage: React.FC<StartupsPageProps> = ({
  startups,
  cohorts,
  mentors,
  onAddStartup,
  onDeleteStartup,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStartupDetails, setSelectedStartupDetails] = useState<Startup | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('HealthTech & AI');
  const [stage, setStage] = useState<Startup['stage']>('MVP');
  const [businessModel, setBusinessModel] = useState<Startup['businessModel']>('B2B SaaS');
  const [cohortId, setCohortId] = useState(cohorts[0]?.id || '');
  const [mentorId, setMentorId] = useState(mentors[0]?.id || '');
  const [fundingRequired, setFundingRequired] = useState('5000000');
  const [fundingRaised, setFundingRaised] = useState('1500000');
  const [monthlyRevenue, setMonthlyRevenue] = useState('250000');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSubmitting(true);
    await onAddStartup({
      name,
      tagline,
      description,
      industry,
      stage,
      businessModel,
      cohortId,
      mentorId,
      fundingRequired: Number(fundingRequired),
      fundingRaised: Number(fundingRaised),
      monthlyRevenue: Number(monthlyRevenue),
      website,
    });
    setIsSubmitting(false);
    setIsAddModalOpen(false);
    setName('');
    setTagline('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header matching Screenshot 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#6355F4] uppercase">
            WORKSPACE
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">Startups</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your portfolio and keep founder teams on track.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add startup</span>
        </button>
      </div>

      {/* Content */}
      {startups.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-gray-100 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6355F4] flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No startups yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 mb-6">
            Add your first startup to start building your workspace data.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Add record
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {startups.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-purple-100 text-[#6355F4] font-bold flex items-center justify-center text-sm shrink-0">
                      {s.name[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 leading-tight">{s.name}</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">{s.industry}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#6355F4] shrink-0">
                    {s.stage}
                  </span>
                </div>

                <p className="text-xs text-gray-600 line-clamp-2 mb-4">{s.description || s.tagline}</p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-[#6355F4]">{s.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#6355F4] to-[#8A79FF] h-full rounded-full"
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50/70 rounded-xl mb-4 text-[11px]">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Monthly Revenue</span>
                    <span className="font-bold text-gray-800">{formatINR(s.monthlyRevenue)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Funding Target</span>
                    <span className="font-bold text-gray-800">{formatINR(s.fundingRequired)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                <span className="text-[11px] text-gray-500 truncate max-w-[150px]">
                  Mentor: {s.mentorName || 'Unassigned'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedStartupDetails(s)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#6355F4] hover:bg-purple-50 transition-colors"
                    title="View details"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteStartup(s.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete startup"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Startup Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add New Startup</h3>
                <p className="text-xs text-gray-500">Register a venture in the incubator workspace</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Startup Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. PulseAI Diagnostics"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">One-Line Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Real-time predictive ICU diagnostics powered by edge AI"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the product, technology moat, and clinical problem..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  >
                    <option value="Ideation">Ideation</option>
                    <option value="MVP">MVP</option>
                    <option value="Early Traction">Early Traction</option>
                    <option value="Scaling">Scaling</option>
                    <option value="Series A">Series A</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Funding (₹)</label>
                  <input
                    type="number"
                    value={fundingRequired}
                    onChange={(e) => setFundingRequired(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Revenue (₹)</label>
                  <input
                    type="number"
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Cohort</label>
                  <select
                    value={cohortId}
                    onChange={(e) => setCohortId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  >
                    <option value="">-- No Cohort --</option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Mentor</label>
                  <select
                    value={mentorId}
                    onChange={(e) => setMentorId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  >
                    <option value="">-- No Mentor --</option>
                    {mentors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#6355F4] hover:bg-[#5244E0] text-white font-semibold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer mt-2"
              >
                {isSubmitting ? 'Saving record...' : 'Create Startup Record'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Startup Details Slide-over modal */}
      {selectedStartupDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#6355F4]">
                  {selectedStartupDetails.stage}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{selectedStartupDetails.name}</h3>
                <p className="text-xs text-gray-500">{selectedStartupDetails.industry}</p>
              </div>
              <button
                onClick={() => setSelectedStartupDetails(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-gray-600 leading-relaxed">{selectedStartupDetails.description}</p>

              <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl">
                <div>
                  <span className="text-gray-400 block text-[10px]">Founder</span>
                  <span className="font-bold text-gray-800">{selectedStartupDetails.founderName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Assigned Mentor</span>
                  <span className="font-bold text-[#6355F4]">
                    {selectedStartupDetails.mentorName || 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Funding Raised</span>
                  <span className="font-bold text-gray-800">
                    {formatINR(selectedStartupDetails.fundingRaised)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Funding Goal</span>
                  <span className="font-bold text-gray-800">
                    {formatINR(selectedStartupDetails.fundingRequired)}
                  </span>
                </div>
              </div>

              {selectedStartupDetails.teamMembers && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">Team Members</h4>
                  <div className="space-y-1.5">
                    {selectedStartupDetails.teamMembers.map((tm, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 text-[11px]">
                        <span className="font-semibold text-gray-800">{tm.name}</span>
                        <span className="text-gray-500">{tm.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
