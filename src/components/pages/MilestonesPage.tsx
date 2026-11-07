import React, { useState } from 'react';
import { CheckSquare, Plus, Sparkles, Calendar, CheckCircle2, Clock, Trash2, X } from 'lucide-react';
import { Milestone, Startup } from '../../types';

interface MilestonesPageProps {
  milestones: Milestone[];
  startups: Startup[];
  onAddMilestone: (data: Partial<Milestone>) => Promise<void>;
  onToggleMilestone: (id: string, completed: boolean) => Promise<void>;
}

export const MilestonesPage: React.FC<MilestonesPageProps> = ({
  milestones,
  startups,
  onAddMilestone,
  onToggleMilestone,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [startupId, setStartupId] = useState(startups[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Milestone['category']>('Product');
  const [weight, setWeight] = useState('8');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setIsSubmitting(true);
    await onAddMilestone({
      startupId,
      title,
      description,
      category,
      weight: Number(weight),
      dueDate,
    });
    setIsSubmitting(false);
    setIsAddModalOpen(false);
    setTitle('');
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
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Milestones & tasks
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track weighted outcomes, deadlines, and startup progress.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add milestone</span>
        </button>
      </div>

      {milestones.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-gray-100 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6355F4] flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No milestones & tasks yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 mb-6">
            Add your first milestone to start building your workspace data.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Add record
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => {
            const isDone = m.status === 'completed';
            return (
              <div
                key={m.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                  isDone
                    ? 'bg-gray-50/60 border-gray-200/80 opacity-80'
                    : 'bg-white border-gray-100 shadow-xs hover:border-purple-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggleMilestone(m.id, !isDone)}
                  className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isDone
                      ? 'bg-[#6355F4] border-[#6355F4] text-white'
                      : 'border-gray-300 hover:border-[#6355F4] bg-white text-transparent'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <h4
                      className={`text-sm font-bold ${
                        isDone ? 'line-through text-gray-400' : 'text-gray-900'
                      }`}
                    >
                      {m.title}
                    </h4>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#6355F4]">
                        Weight: {m.weight}/10
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {m.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">{m.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400">
                    <span className="font-semibold text-gray-600">Startup: {m.startupName}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" /> Due: {m.dueDate}
                    </span>
                    {isDone && (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Milestone Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Milestone</h3>
                <p className="text-xs text-gray-500">Define a weighted goal and deliverable</p>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Milestone Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Close Seed Round Lead Investor or Deploy Beta"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Startup</label>
                <select
                  value={startupId}
                  onChange={(e) => setStartupId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                >
                  {startups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Acceptance criteria and deliverables..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  >
                    <option value="Product">Product</option>
                    <option value="Fundraising">Fundraising</option>
                    <option value="Traction">Traction</option>
                    <option value="Legal">Legal</option>
                    <option value="Hiring">Hiring</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Weight (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
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
                {isSubmitting ? 'Adding...' : 'Create Milestone'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
