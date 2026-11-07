import React, { useState } from 'react';
import { CalendarCheck, Plus, Sparkles, ExternalLink, Clock, MessageSquare, Star, X } from 'lucide-react';
import { MentorSession, Startup, User } from '../../types';

interface MentorSessionsPageProps {
  sessions: MentorSession[];
  startups: Startup[];
  mentors: User[];
  onAddSession: (data: Partial<MentorSession>) => Promise<void>;
  onCompleteSession: (id: string, feedback: string, rating: number) => Promise<void>;
}

export const MentorSessionsPage: React.FC<MentorSessionsPageProps> = ({
  sessions,
  startups,
  mentors,
  onAddSession,
  onCompleteSession,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeFeedbackModalSession, setActiveFeedbackModalSession] = useState<MentorSession | null>(null);

  const [startupId, setStartupId] = useState(startups[0]?.id || '');
  const [mentorId, setMentorId] = useState(mentors[0]?.id || '');
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setIsSubmitting(true);
    await onAddSession({
      startupId,
      mentorId,
      title,
      agenda,
      date,
      time,
      durationMinutes: Number(durationMinutes),
    });
    setIsSubmitting(false);
    setIsAddModalOpen(false);
    setTitle('');
    setAgenda('');
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFeedbackModalSession) return;
    setIsSubmitting(true);
    await onCompleteSession(activeFeedbackModalSession.id, feedback, rating);
    setIsSubmitting(false);
    setActiveFeedbackModalSession(null);
    setFeedback('');
  };

  return (
    <div className="space-y-6">
      {/* Header matching Screenshot 6 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#6355F4] uppercase">
            WORKSPACE
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Mentor sessions
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Plan and record meaningful mentor conversations.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add session</span>
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-gray-100 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6355F4] flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No mentor sessions yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 mb-6">
            Add your first session to start building your workspace data.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Add record
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1.5">
                  <h4 className="text-sm font-bold text-gray-900">{session.title}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      session.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : session.status === 'Scheduled'
                        ? 'bg-purple-100 text-[#6355F4]'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-2">
                  Startup: <strong className="text-gray-800">{session.startupName}</strong> • Mentor:{' '}
                  <strong className="text-[#6355F4]">{session.mentorName}</strong>
                </p>

                <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">{session.agenda}</p>

                {session.feedback && (
                  <div className="mt-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-purple-900">
                    <p className="font-bold text-[11px] text-[#6355F4] mb-0.5 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-[#6355F4]" /> Mentor Feedback ({session.rating}/5):
                    </p>
                    <p className="text-gray-700 italic">"{session.feedback}"</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                <div className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    {session.date} at {session.time} ({session.durationMinutes}m)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {session.meetingLink && session.status === 'Scheduled' && (
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-[#6355F4] bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Join Meet
                    </a>
                  )}

                  {session.status === 'Scheduled' && (
                    <button
                      onClick={() => setActiveFeedbackModalSession(session)}
                      className="text-xs font-semibold text-gray-700 hover:text-[#6355F4] bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
                    >
                      Log Feedback
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Session Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Schedule Mentor Session</h3>
                <p className="text-xs text-gray-500">Plan a 1:1 strategy touchpoint</p>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Session Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pitch Deck Review & Valuation Strategy"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Startup</label>
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mentor</label>
                  <select
                    value={mentorId}
                    onChange={(e) => setMentorId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  >
                    {mentors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Agenda & Prep</label>
                <textarea
                  rows={3}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="Topics to discuss, unit economics review, questions for advisor..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#6355F4] hover:bg-[#5244E0] text-white font-semibold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer mt-2"
              >
                {isSubmitting ? 'Scheduling...' : 'Confirm Session Booking'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Log Feedback Modal */}
      {activeFeedbackModalSession && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Submit Session Feedback</h3>
                <p className="text-xs text-gray-500">{activeFeedbackModalSession.title}</p>
              </div>
              <button
                onClick={() => setActiveFeedbackModalSession(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Overall Rating (1 - 5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-2 rounded-xl border border-gray-200 hover:border-purple-300 transition-colors"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Feedback & Action Items
                </label>
                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Summarize key takeaways, execution milestones, and advice for founder..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#6355F4] hover:bg-[#5244E0] text-white font-semibold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer mt-2"
              >
                {isSubmitting ? 'Saving...' : 'Mark Completed & Save Feedback'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
