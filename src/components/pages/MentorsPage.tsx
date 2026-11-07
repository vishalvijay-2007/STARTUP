import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  Star,
  ExternalLink,
  CalendarCheck,
  User as UserIcon,
  Award,
  Briefcase,
  Mail,
  Phone,
  X,
} from 'lucide-react';
import { User, Startup, MentorSession } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

interface MentorsPageProps {
  mentors: User[];
  startups?: Startup[];
  onOpenScheduleSession: (mentor?: User) => void;
  onAddSession?: (data: Partial<MentorSession>) => Promise<void>;
  onAddMentor: (mentorData: Partial<User>) => Promise<void>;
}

export const MentorsPage: React.FC<MentorsPageProps> = ({
  mentors,
  startups = [],
  onOpenScheduleSession,
  onAddSession,
  onAddMentor,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingMentor, setViewingMentor] = useState<User | null>(null);
  const [bookingMentor, setBookingMentor] = useState<User | null>(null);

  // Add Mentor Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [expertise, setExpertise] = useState('B2B SaaS, DeepTech');
  const [yearsExperience, setYearsExperience] = useState('12');
  const [bio, setBio] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Session Booking Form state
  const [selectedStartupId, setSelectedStartupId] = useState(startups[0]?.id || '');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionAgenda, setSessionAgenda] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionTime, setSessionTime] = useState('14:00');
  const [sessionDuration, setSessionDuration] = useState('45');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsSubmitting(true);
    await onAddMentor({
      name,
      email,
      username: email.split('@')[0],
      title,
      company,
      role: 'mentor',
      status: 'active',
      expertise: expertise.split(',').map((s) => s.trim()),
      yearsExperience: Number(yearsExperience),
      bio,
      linkedIn,
    });
    setIsSubmitting(false);
    setIsAddModalOpen(false);
    setName('');
    setEmail('');
    setTitle('');
    setCompany('');
  };

  const handleOpenBookingForMentor = (mentor: User) => {
    if (onAddSession) {
      setBookingMentor(mentor);
      setSelectedStartupId(startups[0]?.id || '');
    } else {
      onOpenScheduleSession(mentor);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingMentor || !sessionTitle.trim()) return;
    if (onAddSession) {
      setIsBookingSubmitting(true);
      try {
        await onAddSession({
          startupId: selectedStartupId || startups[0]?.id,
          mentorId: bookingMentor.id,
          title: sessionTitle.trim(),
          agenda: sessionAgenda.trim(),
          date: sessionDate,
          time: sessionTime,
          durationMinutes: Number(sessionDuration) || 45,
        });
        setSessionTitle('');
        setSessionAgenda('');
        setBookingMentor(null);
      } finally {
        setIsBookingSubmitting(false);
      }
    } else {
      onOpenScheduleSession(bookingMentor);
      setBookingMentor(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#6355F4] uppercase">
            WORKSPACE
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">Mentors</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Maintain mentor profiles, expertise, and availability.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add mentor</span>
        </button>
      </div>

      {mentors.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-gray-100 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6355F4] flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No mentors yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 mb-6">
            Add your first mentor to start building your workspace data.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Add record
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Mentor Photo, Name, Designation & Company */}
                <div className="flex items-start gap-3.5 mb-4">
                  <UserAvatar
                    src={mentor.avatar}
                    alt={mentor.name}
                    size="md"
                    shape="circle"
                    border={true}
                    statusBadge="active"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                        {mentor.name}
                      </h4>
                      <span className="text-[11px] text-gray-600 flex items-center gap-1 font-semibold shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> 4.9
                      </span>
                    </div>
                    <p className="text-xs text-[#6355F4] font-semibold mt-0.5 truncate">
                      {mentor.title || 'Venture Partner & Tech Mentor'}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {mentor.company || 'Incubator Advisory Network'}
                    </p>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-xs text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                  {mentor.bio}
                </p>

                {/* Expertise tags */}
                {mentor.expertise && mentor.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {mentor.expertise.map((exp, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Exact Button Order: 1. View Profile (Secondary Outlined) | 2. Schedule Mentoring Session (Primary Purple) */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setViewingMentor(mentor)}
                  className="sm:flex-1 h-10 px-3.5 rounded-xl bg-white hover:bg-purple-50/70 text-gray-800 hover:text-[#6355F4] border border-gray-200 hover:border-[#6355F4]/40 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#6355F4] shrink-0" />
                  <span>View Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenBookingForMentor(mentor)}
                  className="sm:flex-[1.35] h-10 px-3.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-md shadow-purple-500/20 inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Schedule Mentoring Session</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: VIEW MENTOR PROFILE */}
      {viewingMentor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-3.5">
                <UserAvatar
                  src={viewingMentor.avatar}
                  alt={viewingMentor.name}
                  size="lg"
                  shape="circle"
                  border={true}
                  statusBadge="active"
                />
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                    {viewingMentor.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#6355F4]">
                    {viewingMentor.title || 'Venture Partner & Tech Mentor'}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {viewingMentor.company || 'Incubator Advisory Network'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingMentor(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">
                    Experience
                  </span>
                  <span className="font-extrabold text-gray-900 text-sm flex items-center gap-1 mt-0.5">
                    <Award className="w-3.5 h-3.5 text-[#6355F4]" />
                    {viewingMentor.yearsExperience || 12} Years
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
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">
                    Assigned Startups
                  </span>
                  <span className="font-extrabold text-gray-900 text-sm flex items-center gap-1 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                    {startups.filter((s) => s.mentorId === viewingMentor.id).length} Ventures
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50/70 rounded-2xl space-y-2 text-gray-700 border border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </span>
                  <span className="font-semibold text-gray-900">{viewingMentor.email}</span>
                </div>
                {viewingMentor.phone && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone
                    </span>
                    <span className="font-semibold text-gray-900">{viewingMentor.phone}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Biography & Advisory Focus
                </h4>
                <p className="p-3.5 bg-gray-50 rounded-2xl text-gray-700 leading-relaxed border border-gray-100">
                  {viewingMentor.bio || 'Experienced startup mentor and venture partner.'}
                </p>
              </div>

              {viewingMentor.expertise && viewingMentor.expertise.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Areas of Expertise
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingMentor.expertise.map((exp, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 text-[#6355F4] font-semibold text-[11px]"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewingMentor.linkedIn && (
                <div className="pt-1">
                  <a
                    href={viewingMentor.linkedIn}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#6355F4] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View LinkedIn Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setViewingMentor(null)}
                className="h-10 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = viewingMentor;
                  setViewingMentor(null);
                  handleOpenBookingForMentor(target);
                }}
                className="h-10 px-4 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-md shadow-purple-500/20 inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Schedule Mentoring Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SCHEDULE MENTORING SESSION FOR SELECTED MENTOR */}
      {bookingMentor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Schedule Mentoring Session</h3>
                <p className="text-xs text-gray-500">
                  Book a 1:1 session with {bookingMentor.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingMentor(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Selected Mentor
                </label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                  <UserAvatar
                    src={bookingMentor.avatar}
                    alt={bookingMentor.name}
                    size="sm"
                    shape="circle"
                    border={true}
                    statusBadge="active"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{bookingMentor.name}</p>
                    <p className="text-[10px] text-[#6355F4] font-semibold">
                      {bookingMentor.title || 'Venture Partner & Tech Mentor'}
                    </p>
                  </div>
                </div>
              </div>

              {startups.length > 0 && (
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
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Session Title
                </label>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Agenda & Prep
                </label>
                <textarea
                  rows={3}
                  value={sessionAgenda}
                  onChange={(e) => setSessionAgenda(e.target.value)}
                  placeholder="Topics to discuss, unit economics review, questions for advisor..."
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Duration (min)
                  </label>
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
                  onClick={() => setBookingMentor(null)}
                  className="h-10 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBookingSubmitting}
                  className="h-10 px-5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white font-semibold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isBookingSubmitting ? 'Scheduling...' : 'Confirm Session Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Mentor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Mentor Profile</h3>
                <p className="text-xs text-gray-500">Register an expert advisor or investor</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mentor Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Chen"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@stanford.edu"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Title / Designation
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Venture Partner"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Firm / Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Horizon Ventures"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Expertise Tags
                </label>
                <input
                  type="text"
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                  placeholder="AI, B2B SaaS, HealthTech, Series A"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bio & Experience
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ex-VP Engineering, Angel investor, seed advisor..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#6355F4] hover:bg-[#5244E0] text-white font-semibold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer mt-2"
              >
                {isSubmitting ? 'Saving...' : 'Add Mentor Profile'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
