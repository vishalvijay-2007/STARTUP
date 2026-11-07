import React, { useState } from 'react';
import { Users2, Plus, Sparkles, Calendar, IndianRupee, X } from 'lucide-react';
import { Cohort, Startup } from '../../types';
import { formatINR } from '../../utils/currency';

interface CohortsPageProps {
  cohorts: Cohort[];
  startups: Startup[];
  onAddCohort: (data: Partial<Cohort>) => Promise<void>;
}

export const CohortsPage: React.FC<CohortsPageProps> = ({ cohorts, startups, onAddCohort }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-10-15');
  const [targetFunding, setTargetFunding] = useState('50000000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSubmitting(true);
    await onAddCohort({
      name,
      code,
      description,
      startDate,
      endDate,
      targetFunding: Number(targetFunding),
    });
    setIsSubmitting(false);
    setIsAddModalOpen(false);
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header matching Screenshot 5 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#6355F4] uppercase">
            WORKSPACE
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">Cohorts</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Organize programs, dates, and participating startups.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add cohort</span>
        </button>
      </div>

      {cohorts.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-gray-100 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6355F4] flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No cohorts yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 mb-6">
            Add your first cohort to start building your workspace data.
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
          {cohorts.map((cohort) => {
            const cohortStartups = startups.filter((s) => s.cohortId === cohort.id);
            return (
              <div
                key={cohort.id}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        {cohort.code}
                      </span>
                      <h4 className="text-base font-bold text-gray-900 mt-2">{cohort.name}</h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cohort.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : cohort.status === 'Upcoming'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {cohort.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                    {cohort.description}
                  </p>

                  <div className="space-y-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" /> Duration
                      </span>
                      <span className="font-medium text-gray-800">
                        {cohort.startDate} to {cohort.endDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5 text-gray-400" /> Target Capital
                      </span>
                      <span className="font-medium text-gray-800">
                        {formatINR(cohort.targetFunding)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">
                    {cohortStartups.length || cohort.startupsCount} Startups Enrolled
                  </span>
                  <span className="text-purple-600 font-bold text-[11px]">
                    {cohort.mentorsCount || 6} Mentors
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Cohort Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add New Cohort</h3>
                <p className="text-xs text-gray-500">Launch a new incubation batch</p>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cohort Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer 2026 DeepTech Batch"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Program Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. S26-DEEP"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cohort goals, focus areas, and milestone deliverables..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#6355F4] hover:bg-[#5244E0] text-white font-semibold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer mt-2"
              >
                {isSubmitting ? 'Saving cohort...' : 'Create Cohort'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
