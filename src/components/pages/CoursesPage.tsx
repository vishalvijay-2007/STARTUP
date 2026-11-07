import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  RotateCcw,
  BookOpen,
  Clock,
  CheckCircle2,
  X,
  ExternalLink,
  BookmarkPlus,
  Check,
  Award,
  History,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  ListChecks,
} from 'lucide-react';
import { Course, CourseRecommendationItem, CourseRecommendationRun, EnrolledCourse, Startup } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface CoursesPageProps {
  courses: Course[];
  startups?: Startup[];
  onAddCourse: (course: Partial<Course>) => Promise<void>;
  onRefresh: () => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ courses, startups = [], onAddCourse, onRefresh }) => {
  const { user } = useAuth();

  // Tab state: 'catalog' | 'my-learning' | 'history'
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-learning' | 'history'>('catalog');

  // Suggest with AI Modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiErrorCategory, setAiErrorCategory] = useState<string | null>(null);
  const [activeAiModel, setActiveAiModel] = useState<string>('gemini-3.5-flash-lite');
  const [activeAiProvider, setActiveAiProvider] = useState<string>('Google Gemini API');

  // Founder context inputs for AI recommendation
  const founderStartup = startups.find((s) => s.founderId === user?.id) || startups[0];
  const [startupName, setStartupName] = useState(founderStartup?.name || 'PulseAI Diagnostics');
  const [industry, setIndustry] = useState(founderStartup?.industry || 'HealthTech & AI');
  const [stage, setStage] = useState<string>(founderStartup?.stage || 'Early Traction');
  const [experience, setExperience] = useState('First-time founder');
  const [skills, setSkills] = useState('Technical background, needs enterprise sales and institutional fundraising mastery');
  const [interests, setInterests] = useState('B2B GTM, investor pitch formulation, healthcare compliance');
  const [learningGoals, setLearningGoals] = useState('Prepare for ₹5 Crore Seed round and close enterprise pilot contracts');

  // Current AI recommendations
  const [recommendedCourses, setRecommendedCourses] = useState<CourseRecommendationItem[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // User's enrolled courses and history
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [historyRuns, setHistoryRuns] = useState<CourseRecommendationRun[]>([]);
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Selected details modal
  const [selectedCourseDetails, setSelectedCourseDetails] = useState<Course | null>(null);
  const [selectedRecommendationDetails, setSelectedRecommendationDetails] = useState<CourseRecommendationItem | null>(null);

  // Manual course form state
  const [manualTitle, setManualTitle] = useState('AI for Founders');
  const [manualCategory, setManualCategory] = useState('Technology');
  const [manualDescription, setManualDescription] = useState(
    'A practical hands-on curriculum covering modern generative AI foundation models, prompt engineering, server-side security architectures, and scalable inference economics.'
  );
  const [manualDuration, setManualDuration] = useState('8');
  const [manualFileName, setManualFileName] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Sync founder startup context when startups list updates
  useEffect(() => {
    const matched = startups.find((s) => s.founderId === user?.id) || startups[0];
    if (matched) {
      setStartupName((prev) => (prev === 'PulseAI Diagnostics' ? matched.name : prev));
      setIndustry((prev) => (prev === 'HealthTech & AI' ? matched.industry : prev));
      setStage((prev) => (prev === 'Early Traction' ? matched.stage : prev));
    }
  }, [startups, user?.id]);

  // Load user's enrolled courses
  const fetchMyCourses = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/ai/my-courses?userId=${encodeURIComponent(user.id)}`);
      if (res.ok) {
        const data = await res.json();
        setEnrolledCourses(data);
      }
    } catch (e) {
      console.error('Failed to load enrolled courses', e);
    }
  };

  // Load recommendation history
  const fetchHistory = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/ai/course-recommendations/history?founderId=${encodeURIComponent(user.id)}`);
      if (res.ok) {
        const data: CourseRecommendationRun[] = await res.json();
        setHistoryRuns(data);
        if (data.length > 0 && recommendedCourses.length === 0) {
          setRecommendedCourses(data[0].recommendations || []);
          if (data[0].modelUsed) setActiveAiModel(data[0].modelUsed);
          if (data[0].providerUsed) setActiveAiProvider(data[0].providerUsed);
        }
      }
    } catch (e) {
      console.error('Failed to load recommendation history', e);
    }
  };

  useEffect(() => {
    fetchMyCourses();
    fetchHistory();
  }, [user?.id]);

  // Handle "Suggest with AI" click
  const handleOpenAiModal = () => {
    setShowAiModal(true);
    setAiError(null);
    setAiErrorCategory(null);
  };

  // Generate recommendations via real server endpoint with duplicate prevention
  const handleGenerateRecommendations = async (forceRefresh = false) => {
    if (isAiGenerating) return; // Prevent duplicate concurrent requests
    setIsAiGenerating(true);
    setAiError(null);
    setAiErrorCategory(null);
    try {
      const res = await fetch('/api/ai/course-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || 'Founder',
        },
        body: JSON.stringify({
          founderId: user?.id,
          founderName: user?.name,
          userRole: user?.role || 'Founder',
          startupName,
          industry,
          stage,
          experience,
          skills,
          interests,
          learningGoals,
          forceRefresh,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errorCategory) {
          setAiErrorCategory(data.errorCategory);
        }
        throw new Error(data.error || 'Failed to generate recommendations from Gemini AI.');
      }

      setRecommendedCourses(data.recommendations || []);
      if (data.modelUsed) setActiveAiModel(data.modelUsed);
      if (data.providerUsed) setActiveAiProvider(data.providerUsed);
      fetchHistory();
    } catch (err: any) {
      setAiError(err.message || 'AI service temporarily unavailable. Please try again.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Save recommended course to personal learning list
  const handleSaveToMyLearning = async (item: CourseRecommendationItem, addToCatalog = false) => {
    if (!user?.id) return;
    setSavingCourseId(item.id);
    try {
      const res = await fetch('/api/ai/save-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          course: item,
          addToIncubatorCatalog: addToCatalog,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccessMsg(`"${item.title}" saved to your Learning List!`);
        setTimeout(() => setSavedSuccessMsg(null), 3500);
        await fetchMyCourses();
        if (addToCatalog) {
          onRefresh();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCourseId(null);
    }
  };

  // Update progress for enrolled course
  const handleUpdateProgress = async (id: string, newProgress: number) => {
    try {
      const res = await fetch(`/api/ai/my-courses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress }),
      });
      if (res.ok) {
        setEnrolledCourses((prev) =>
          prev.map((c) => (c.id === id ? { ...c, progress: newProgress, completed: newProgress === 100 } : c))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle complete for enrolled course
  const handleToggleComplete = async (id: string, currentCompleted: boolean) => {
    const nextCompleted = !currentCompleted;
    try {
      const res = await fetch(`/api/ai/my-courses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: nextCompleted, progress: nextCompleted ? 100 : 50 }),
      });
      if (res.ok) {
        setEnrolledCourses((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, completed: nextCompleted, progress: nextCompleted ? 100 : 50 } : c
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit manual course form
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle) return;
    setIsSubmittingManual(true);
    await onAddCourse({
      title: manualTitle,
      category: manualCategory,
      description: manualDescription,
      durationHours: Number(manualDuration) || 8,
      fileName: manualFileName,
    });
    setIsSubmittingManual(false);
    setManualTitle('');
    setManualDescription('');
  };

  // Filter recommendations by category
  const categories = [
    'All',
    'Technical',
    'Entrepreneurship',
    'Business Management',
    'Marketing & Sales',
    'Finance & Fundraising',
    'Product Development',
    'Leadership',
  ];
  const filteredRecommendations =
    selectedCategoryFilter === 'All'
      ? recommendedCourses
      : recommendedCourses.filter((c) => c.category === selectedCategoryFilter);

  const completedCount = enrolledCourses.filter((c) => c.completed).length;
  const avgEnrollmentProgress = enrolledCourses.length
    ? Math.round(enrolledCourses.reduce((acc, c) => acc + (c.progress || 0), 0) / enrolledCourses.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header matching Screenshot 10 with primary Suggest with AI Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#6355F4] uppercase">
            LEARNING PROGRAMS
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Courses & learning
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Create practical learning paths, get personalized AI curricula, and track founder completion.
          </p>
        </div>

        {/* Primary "Suggest with AI" Button matching Screenshot 10 */}
        <button
          type="button"
          onClick={handleOpenAiModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#6355F4] text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-[#6355F4]" />
          <span>Suggest with AI</span>
        </button>
      </div>

      {savedSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* Tabs navigation: Catalog | My Enrolled Learning | History */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-gray-100 pb-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'catalog'
              ? 'bg-[#6355F4] text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span>Course Catalog ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('my-learning')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'my-learning'
              ? 'bg-[#6355F4] text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 shrink-0" />
          <span>My Learning & Progress ({enrolledCourses.length})</span>
          {enrolledCourses.length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'my-learning' ? 'bg-white/25 text-white' : 'bg-purple-100 text-[#6355F4]'
              }`}
            >
              {avgEnrollmentProgress}%
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'history'
              ? 'bg-[#6355F4] text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <History className="w-3.5 h-3.5 shrink-0" />
          <span>AI Recommendation History ({historyRuns.length})</span>
        </button>
      </div>

      {/* TAB 1: CATALOG & ADD COURSE (Matches Screenshot 10 Layout + Live AI Recommendations Section) */}
      {activeTab === 'catalog' && (
        <div className="space-y-8">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-start">
            {/* Left Column: Add a new course card */}
            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-gray-100 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Add a new course</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Build a learning resource for your founders.</p>
                </div>

                {/* Secondary quick Suggest with AI button */}
                <button
                  type="button"
                  onClick={handleOpenAiModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#6355F4] text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Suggest with AI</span>
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Course title</label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="AI for Founders"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4] focus:ring-1 focus:ring-[#6355F4]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
                  <input
                    type="text"
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    placeholder="Technology"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4] focus:ring-1 focus:ring-[#6355F4]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                  <textarea
                    rows={4}
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    placeholder="Describe the learning module"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4] focus:ring-1 focus:ring-[#6355F4] leading-relaxed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={manualDuration}
                    onChange={(e) => setManualDuration(e.target.value)}
                    placeholder="8"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4] focus:ring-1 focus:ring-[#6355F4]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Course resource (optional, max 10 MB)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="course-file"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setManualFileName(e.target.files[0].name);
                        }
                      }}
                      className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border file:border-gray-200 file:text-xs file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="w-full bg-[#6355F4] hover:bg-[#5244E0] text-white font-semibold text-xs py-3 rounded-xl shadow-md shadow-purple-500/20 transition-all cursor-pointer mt-3"
                >
                  {isSubmittingManual ? 'Saving Course...' : 'Publish Course Resource'}
                </button>
              </form>
            </div>

            {/* Right Column: Saved courses card matching Screenshot 10 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs min-h-[460px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Saved courses</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{courses.length} learning resources</p>
                  </div>

                  <button
                    onClick={onRefresh}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>

                {courses.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6355F4] flex items-center justify-center mb-3">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">No courses saved yet</h4>
                    <p className="text-xs text-gray-400 max-w-xs mt-1">
                      Click "Suggest with AI" to generate a complete tailored curriculum in seconds.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="p-4 rounded-2xl border border-gray-100 hover:border-purple-200 bg-gray-50/50 hover:bg-white transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6355F4] flex items-center justify-center shrink-0">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-gray-900">{course.title}</h4>
                              <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                {course.category}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" /> {course.durationHours} hrs
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                          {course.description}
                        </p>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">
                            Instructor: <strong className="text-gray-700">{course.instructor}</strong>
                          </span>
                          <button
                            onClick={() => setSelectedCourseDetails(course)}
                            className="font-bold text-[#6355F4] hover:underline cursor-pointer"
                          >
                            View Syllabus &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personalized AI Course Recommendations displayed directly on the Courses Page when generated */}
          {recommendedCourses.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#6355F4] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-gray-900">
                        AI Personalized Course Recommendations ({recommendedCourses.length})
                      </h3>
                      <span className="text-[10px] font-mono bg-purple-50 text-[#6355F4] border border-purple-200 px-2 py-0.5 rounded-md">
                        {activeAiProvider} &bull; {activeAiModel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Tailored for <strong>{startupName}</strong> ({industry} &bull; {stage}) &bull; Role:{' '}
                      <strong>{user?.role || 'Founder'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAiModal}
                    className="px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#6355F4] text-xs font-bold transition-all cursor-pointer"
                  >
                    Customize Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateRecommendations(true)}
                    disabled={isAiGenerating}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                    <span>{isAiGenerating ? 'Regenerating...' : 'Regenerate AI Path'}</span>
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-gray-50/60 hover:bg-white rounded-2xl p-5 border border-gray-200 hover:border-purple-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-[#6355F4]">
                          {course.category}
                        </span>
                        <span className="text-[10px] text-gray-500 font-semibold">
                          {course.difficulty} &bull; {course.duration}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-gray-900 leading-snug mb-1.5">{course.title}</h4>

                      {course.description && (
                        <p className="text-xs text-gray-600 leading-relaxed mb-2.5">{course.description}</p>
                      )}

                      <div className="p-2.5 bg-purple-50/70 rounded-xl mb-3 border border-purple-100">
                        <p className="text-[10px] font-bold text-purple-900 uppercase mb-0.5">Why Recommended:</p>
                        <p className="text-[11px] text-purple-900/90 leading-relaxed">{course.whyRecommended}</p>
                      </div>

                      {course.objectives && course.objectives.length > 0 && (
                        <div className="mb-3 space-y-1">
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Learning Objectives:</p>
                          {course.objectives.slice(0, 2).map((obj, idx) => (
                            <p key={idx} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                              <span className="text-[#6355F4] font-bold">&bull;</span>
                              <span>{obj}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {course.suggestedNextSteps && course.suggestedNextSteps.length > 0 && (
                        <div className="mb-3 space-y-1">
                          <p className="text-[10px] font-bold text-emerald-700 uppercase">Suggested Next Steps:</p>
                          {course.suggestedNextSteps.slice(0, 2).map((step, idx) => (
                            <p key={idx} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                              <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{step}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-200/70 flex items-center justify-between gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRecommendationDetails(course)}
                        className="text-xs text-[#6355F4] hover:underline font-bold cursor-pointer"
                      >
                        Full Details
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveToMyLearning(course, true)}
                        disabled={savingCourseId === course.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>{savingCourseId === course.id ? 'Saving...' : 'Save Course'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ENROLLED LEARNING & PROGRESS TRACKER */}
      {activeTab === 'my-learning' && (
        <div className="space-y-6">
          {/* Progress summary banner */}
          <div className="bg-gradient-to-r from-[#6355F4] to-[#8075f7] rounded-3xl p-6 sm:p-7 text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-purple-200">
                  FOUNDER LEARNING JOURNEY
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight mt-0.5">
                  Track Your Mastery & Skill Growth
                </h2>
                <p className="text-xs text-purple-100 mt-1 max-w-xl">
                  {completedCount} of {enrolledCourses.length} courses completed. Advance your competencies in tech, sales, and fundraising.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-6 shrink-0">
                <div>
                  <p className="text-[10px] text-purple-200 font-bold uppercase">Average Progress</p>
                  <p className="text-2xl font-extrabold mt-0.5">{avgEnrollmentProgress}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#6355F4] flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Your learning list is empty</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-6">
                Click "Suggest with AI" to generate customized curricula based on your startup's stage and skill goals.
              </p>
              <button
                onClick={handleOpenAiModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-bold shadow-md shadow-purple-500/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Suggest Courses with AI</span>
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {enrolledCourses.map((c) => (
                <div
                  key={c.id}
                  className={`bg-white rounded-3xl p-6 border transition-all ${
                    c.completed ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-100 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-[#6355F4]">
                      {c.category}
                    </span>
                    <button
                      onClick={() => handleToggleComplete(c.id, c.completed)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border cursor-pointer transition-all ${
                        c.completed
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{c.completed ? 'Completed' : 'Mark Complete'}</span>
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1">{c.title}</h3>
                  {c.whyRecommended && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                      {c.whyRecommended}
                    </p>
                  )}

                  {/* Skills learned badges */}
                  {c.skillsLearned && c.skillsLearned.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {c.skillsLearned.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Progress bar & slider */}
                  <div className="space-y-1.5 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">Learning Progress</span>
                      <span className="font-bold text-[#6355F4]">{c.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          c.completed ? 'bg-emerald-500' : 'bg-[#6355F4]'
                        }`}
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={c.progress}
                      onChange={(e) => handleUpdateProgress(c.id, Number(e.target.value))}
                      className="w-full accent-[#6355F4] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 text-xs">
                    <span className="text-gray-400 text-[11px]">Est: {c.duration || '6 hours'}</span>
                    {c.url && (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#6355F4] hover:underline font-bold text-xs"
                      >
                        <span>Access Material</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RECOMMENDATION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">AI Recommendation Runs</h3>
              <p className="text-xs text-gray-400">
                Past personalized curricula generated by {activeAiProvider}.
              </p>
            </div>
            <button
              onClick={handleOpenAiModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate New Recommendations</span>
            </button>
          </div>

          {historyRuns.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-gray-800">No previous recommendations recorded</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Use the "Suggest with AI" feature to generate your first curriculum.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyRuns.map((run) => (
                <div key={run.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">
                          {run.startupName || 'Startup'} &bull; {run.stage || 'Incubation'}
                        </h4>
                        {run.modelUsed && (
                          <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                            {run.modelUsed}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Focus: {run.learningGoals || 'Seed preparation'}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {new Date(run.createdAt).toLocaleDateString()}{' '}
                      {new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {run.recommendations.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#6355F4]">
                              {item.category}
                            </span>
                            <span className="text-[10px] text-gray-500 font-semibold">{item.duration}</span>
                          </div>
                          <h5 className="text-xs font-bold text-gray-900 leading-tight mb-1">{item.title}</h5>
                          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                            {item.description || item.whyRecommended}
                          </p>
                        </div>
                        <div className="pt-2 mt-2 border-t border-gray-200/60 flex items-center justify-between">
                          <button
                            onClick={() => setSelectedRecommendationDetails(item)}
                            className="text-[11px] text-[#6355F4] hover:underline font-bold cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleSaveToMyLearning(item)}
                            className="text-[11px] text-gray-600 hover:text-[#6355F4] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI-POWERED COURSE RECOMMENDATION MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#6355F4] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900">
                      AI Course & Curriculum Recommendations
                    </h3>
                    <span className="text-[10px] font-mono bg-purple-50 text-[#6355F4] border border-purple-200 px-2 py-0.5 rounded-md">
                      {activeAiProvider} ({activeAiModel})
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Personalized for your role ({user?.role || 'Founder'}), startup industry, skill level, and stage.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Founder Context Form */}
            <div className="mt-5 space-y-4">
              <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-[#6355F4]" />
                    <span className="text-xs font-bold text-[#6355F4]">
                      Founder & Startup Learning Profile
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    Role: {user?.role || 'Founder'}
                  </span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Startup Name
                    </label>
                    <input
                      type="text"
                      value={startupName}
                      onChange={(e) => setStartupName(e.target.value)}
                      placeholder="e.g. PulseAI Diagnostics"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#6355F4]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. HealthTech, AI, B2B SaaS"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#6355F4]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Incubation Stage
                    </label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#6355F4]"
                    >
                      <option value="Ideation">Ideation</option>
                      <option value="Validation">Validation</option>
                      <option value="MVP">MVP</option>
                      <option value="Early Traction">Early Traction</option>
                      <option value="Scaling">Scaling</option>
                      <option value="Series A">Series A</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Founder Experience & Background
                    </label>
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. Technical founder, First-time founder"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#6355F4]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Skills Gaps to Bridge
                    </label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="e.g. Enterprise sales, venture fundraising, pricing"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#6355F4]"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Primary Goal & Desired Learning Outcomes
                  </label>
                  <input
                    type="text"
                    value={learningGoals}
                    onChange={(e) => setLearningGoals(e.target.value)}
                    placeholder="e.g. Prepare for ₹5 Crore Seed round and secure initial 5 hospital pilots"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#6355F4]"
                  />
                </div>

                <div className="mt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => handleGenerateRecommendations(false)}
                    disabled={isAiGenerating}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${isAiGenerating ? 'animate-spin' : ''}`} />
                    <span>
                      {isAiGenerating
                        ? 'Generating Personalized AI Curricula...'
                        : 'Generate AI Course Recommendations'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Loading Indicator */}
              {isAiGenerating && (
                <div className="p-6 bg-purple-50/40 border border-purple-100 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-2xl bg-[#6355F4]/10 text-[#6355F4] flex items-center justify-center mb-2.5 animate-spin">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-gray-900">
                    Synthesizing personalized courses & next steps for {startupName}...
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Analyzing role ({user?.role || 'Founder'}), stage ({stage}), and skill gaps via {activeAiProvider}.
                  </p>
                </div>
              )}

              {/* Smart Error Banner with Retry Action */}
              {aiError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-red-800">AI Recommendation Error</p>
                        {aiErrorCategory && (
                          <span className="text-[10px] font-mono bg-red-100 text-red-700 px-2 py-0.5 rounded-md">
                            {aiErrorCategory}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-red-700 mt-0.5">{aiError}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerateRecommendations(true)}
                    disabled={isAiGenerating}
                    className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Retry Now
                  </button>
                </div>
              )}

              {/* Step 2: Recommendations Results */}
              {recommendedCourses.length > 0 && !isAiGenerating && (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Recommended Courses for {startupName} ({recommendedCourses.length})
                      </h4>
                      <p className="text-xs text-gray-500">
                        Tailored across technical, business, marketing, fundraising, and leadership disciplines.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGenerateRecommendations(true)}
                      disabled={isAiGenerating}
                      className="flex items-center gap-1.5 text-xs text-[#6355F4] hover:underline font-bold cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Request New Recommendations</span>
                    </button>
                  </div>

                  {/* Category filter pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all cursor-pointer ${
                          selectedCategoryFilter === cat
                            ? 'bg-[#6355F4] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Course Cards Grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredRecommendations.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-purple-300 shadow-2xs flex flex-col justify-between transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#6355F4]">
                              {course.category}
                            </span>
                            <span className="text-[10px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-md">
                              {course.difficulty} &bull; {course.duration}
                            </span>
                          </div>

                          <h5 className="text-sm font-bold text-gray-900 leading-snug mb-1.5">
                            {course.title}
                          </h5>

                          {course.description && (
                            <p className="text-xs text-gray-600 leading-relaxed mb-3">
                              {course.description}
                            </p>
                          )}

                          <div className="p-3 bg-purple-50/60 rounded-xl mb-3 border border-purple-100/60">
                            <p className="text-[11px] font-semibold text-purple-900 mb-0.5">
                              Why this is recommended:
                            </p>
                            <p className="text-[11px] text-purple-800/90 leading-relaxed">
                              {course.whyRecommended}
                            </p>
                          </div>

                          {/* Skills badges */}
                          <div className="mb-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                              Skills You'll Master:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {course.skillsLearned.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Objectives list */}
                          <div className="mb-3 space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">
                              Learning Objectives:
                            </p>
                            {course.objectives.slice(0, 2).map((obj, i) => (
                              <p key={i} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                                <span className="text-[#6355F4] font-bold">&bull;</span>
                                <span>{obj}</span>
                              </p>
                            ))}
                          </div>

                          {/* Suggested Next Steps list */}
                          {course.suggestedNextSteps && course.suggestedNextSteps.length > 0 && (
                            <div className="mb-3 space-y-1 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                              <p className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                                <ListChecks className="w-3 h-3" />
                                <span>Suggested Next Steps:</span>
                              </p>
                              {course.suggestedNextSteps.slice(0, 2).map((step, i) => (
                                <p key={i} className="text-[11px] text-emerald-950 flex items-start gap-1.5">
                                  <span className="text-emerald-600 font-bold">{i + 1}.</span>
                                  <span>{step}</span>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRecommendationDetails(course)}
                            className="text-xs text-[#6355F4] hover:underline font-bold cursor-pointer"
                          >
                            Full Syllabus
                          </button>

                          <div className="flex items-center gap-2">
                            {course.url && (
                              <a
                                href={course.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl text-gray-500 hover:text-[#6355F4] hover:bg-purple-50 transition-colors"
                                title="Open provider resource"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleSaveToMyLearning(course, true)}
                              disabled={savingCourseId === course.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              <BookmarkPlus className="w-3.5 h-3.5" />
                              <span>
                                {savingCourseId === course.id ? 'Saving...' : 'Save to My Learning'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Course Syllabus Modal */}
      {selectedCourseDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#6355F4]">
                  {selectedCourseDetails.category}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{selectedCourseDetails.title}</h3>
                <p className="text-xs text-gray-500">Instructor: {selectedCourseDetails.instructor}</p>
              </div>
              <button
                onClick={() => setSelectedCourseDetails(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-600">
              <div className="p-4 bg-gray-50 rounded-2xl leading-relaxed whitespace-pre-wrap">
                {selectedCourseDetails.description}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-700">
                  Total Duration: {selectedCourseDetails.durationHours} hours
                </span>
                <button
                  onClick={() => setSelectedCourseDetails(null)}
                  className="bg-[#6355F4] text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Close Syllabus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendation Details Modal */}
      {selectedRecommendationDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-[#6355F4]">
                  {selectedRecommendationDetails.category} &bull; {selectedRecommendationDetails.difficulty}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">
                  {selectedRecommendationDetails.title}
                </h3>
                <p className="text-xs text-gray-500">
                  Providers: {selectedRecommendationDetails.platforms.join(', ')}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecommendationDetails(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedRecommendationDetails.description && (
              <p className="text-xs text-gray-700 leading-relaxed">
                {selectedRecommendationDetails.description}
              </p>
            )}

            <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-100">
              <p className="text-xs font-bold text-[#6355F4] mb-1">Why Recommended For You:</p>
              <p className="text-xs text-purple-950 leading-relaxed">
                {selectedRecommendationDetails.whyRecommended}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-700 mb-1.5">Key Skills Learned:</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedRecommendationDetails.skillsLearned.map((s, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-700 mb-1.5">Learning Objectives:</p>
              <ul className="space-y-1.5 text-xs text-gray-600">
                {selectedRecommendationDetails.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedRecommendationDetails.suggestedNextSteps &&
              selectedRecommendationDetails.suggestedNextSteps.length > 0 && (
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-800 mb-1.5">Suggested Next Steps:</p>
                  <ul className="space-y-1.5 text-xs text-emerald-950">
                    {selectedRecommendationDetails.suggestedNextSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-500">
                Duration: {selectedRecommendationDetails.duration}
              </span>

              <div className="flex items-center gap-2">
                {selectedRecommendationDetails.url && (
                  <a
                    href={selectedRecommendationDetails.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50"
                  >
                    <span>Open Provider</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => {
                    handleSaveToMyLearning(selectedRecommendationDetails, true);
                    setSelectedRecommendationDetails(null);
                  }}
                  className="bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  Save to My Learning
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
