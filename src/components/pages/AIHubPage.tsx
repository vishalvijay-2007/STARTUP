import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lightbulb,
  FileText,
  Search,
  TrendingUp,
  Target,
  UserCheck,
  ShieldAlert,
  ClipboardList,
  Compass,
  MessageSquare,
  Copy,
  Check,
  RotateCcw,
  Bot,
  Download,
  History,
  Trash2,
  AlertTriangle,
  Flame,
  ArrowRight,
  BarChart,
  IndianRupee,
  Rocket,
  SlidersHorizontal,
} from 'lucide-react';
import { Startup, User, AIStartupAnalysisRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AIHubPageProps {
  startups: Startup[];
  mentors: User[];
}

export const AIHubPage: React.FC<AIHubPageProps> = ({ startups, mentors }) => {
  const { user } = useAuth();
  const [selectedModule, setSelectedModule] = useState<string>('startup_assistant');
  const [selectedStartupId, setSelectedStartupId] = useState<string>(startups[0]?.id || '');
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [aiOutput, setAiOutput] = useState<string>('');
  const [structuredAnalysis, setStructuredAnalysis] = useState<AIStartupAnalysisRecord | null>(null);
  const [activeAnalysisSection, setActiveAnalysisSection] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCategory, setErrorCategory] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.5-flash-lite');
  const [activeProvider, setActiveProvider] = useState<string>('Google Gemini API');

  // Optional custom startup parameters toggle so founders can refine business model / target customers / competitors
  const [showContextTuner, setShowContextTuner] = useState<boolean>(false);
  const [customBusinessModel, setCustomBusinessModel] = useState<string>('B2B Enterprise SaaS & Annual Subscription');
  const [customTargetCustomers, setCustomTargetCustomers] = useState<string>('Mid-to-large enterprises and high-growth Indian digital businesses');
  const [customCompetitors, setCustomCompetitors] = useState<string>('Legacy enterprise vendors and regional point-solutions');

  // History modal / drawer state
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [savedAnalyses, setSavedAnalyses] = useState<AIStartupAnalysisRecord[]>([]);

  const selectedStartup = startups.find((s) => s.id === selectedStartupId) || startups[0];

  useEffect(() => {
    if (!selectedStartupId && startups[0]?.id) {
      setSelectedStartupId(startups[0].id);
    }
  }, [startups, selectedStartupId]);

  const modules = [
    {
      id: 'startup_assistant',
      name: 'AI Startup Assistant',
      desc: 'Interactive co-pilot for pitch preparation, customer discovery, and tactical questions.',
      icon: Bot,
      defaultPrompt: 'How can we structure our enterprise pilot contracts to accelerate our path to seed funding?',
    },
    {
      id: 'business_idea',
      name: 'AI Business Idea Generator',
      desc: 'Formulate, validate, and stress-test high-potential tech startup ideas with ICP analysis.',
      icon: Lightbulb,
      defaultPrompt: 'Autonomous maritime shipping route optimization using edge AI ocean sensors.',
    },
    {
      id: 'business_plan',
      name: 'AI Business Plan Generator',
      desc: 'Generate comprehensive Lean Canvas, value propositions, and unit economics models.',
      icon: FileText,
      defaultPrompt: 'Generate a Lean Canvas with CAC/LTV benchmarks and 6-month growth milestones.',
    },
    {
      id: 'market_research',
      name: 'AI Market Research Assistant',
      desc: 'Rigorous TAM, SAM, SOM calculations and competitor differentiation matrix.',
      icon: Search,
      defaultPrompt: 'Analyze total addressable market for edge AI clinical ICU telemetry in India and global markets.',
    },
    {
      id: 'growth_strategy',
      name: 'AI Growth Recommendations',
      desc: 'Customer acquisition channels, B2B outbound sequences, and pilot expansion playbooks.',
      icon: TrendingUp,
      defaultPrompt: 'Formulate a 90-day cold outreach and channel partnership strategy to secure 10 enterprise pilots.',
    },
    {
      id: 'progress_analysis',
      name: 'AI Progress Analysis',
      desc: 'Audit execution velocity, milestone bottlenecks, and sprint recommendations.',
      icon: Target,
      defaultPrompt: 'Analyze our current milestone completion rate and identify top execution risks.',
    },
    {
      id: 'milestone_suggestions',
      name: 'AI Milestone Suggestions',
      desc: 'Stage-tailored, weighted milestone goals for fundraising and MVP traction.',
      icon: Compass,
      defaultPrompt: 'Suggest 5 weighted milestones for our next 90 days before institutional seed fundraising.',
    },
    {
      id: 'mentor_recommendation',
      name: 'AI Mentor Recommendation',
      desc: 'Match startup needs with ideal advisor profiles and formulate a 4-session advisory syllabus.',
      icon: UserCheck,
      defaultPrompt: 'Match our startup with the best mentor background and draft a coaching curriculum.',
    },
    {
      id: 'risk_analysis',
      name: 'AI Startup Risk Analysis',
      desc: '360° vulnerability audit across legal, compliance, model drift, and runway risks.',
      icon: ShieldAlert,
      defaultPrompt: 'Audit potential regulatory, data security, and procurement risks for our enterprise offering.',
    },
    {
      id: 'report_generator',
      name: 'AI Progress Report Generator',
      desc: 'Compile an investor-ready executive incubation report and board memorandum.',
      icon: ClipboardList,
      defaultPrompt: 'Generate an executive progress memo summarizing our Q1 achievements, pilot metrics, and seed targets.',
    },
    {
      id: 'admin_insights',
      name: 'AI Admin Ecosystem Insights',
      desc: 'Incubator portfolio health, mentor engagement trends, and cohort acceleration patterns.',
      icon: Sparkles,
      defaultPrompt: 'Evaluate overall cohort momentum and recommend resource allocations for at-risk ventures.',
    },
    {
      id: 'mentor_feedback_assistant',
      name: 'AI Mentor Feedback Assistant',
      desc: 'Helps mentors formulate constructive, high-impact coaching critiques and action items.',
      icon: MessageSquare,
      defaultPrompt: 'Convert these rough notes into structured founder feedback: "Strong product demo, but needs clearer pricing."',
    },
  ];

  const currentModule = modules.find((m) => m.id === selectedModule) || modules[0];

  // Fetch analysis history
  const fetchAnalysisHistory = async () => {
    try {
      const res = await fetch(`/api/ai/startup-analysis/history?founderId=${encodeURIComponent(user?.id || '')}`);
      if (res.ok) {
        const data = await res.json();
        setSavedAnalyses(data);
      }
    } catch (e) {
      console.error('Failed to load analysis history', e);
    }
  };

  useEffect(() => {
    fetchAnalysisHistory();
  }, [user?.id]);

  // Main generation handler with duplicate prevention and smart error handling
  const handleRunAi = async (forceRefresh = false) => {
    if (isLoading) return; // Prevent duplicate concurrent requests
    setIsLoading(true);
    setErrorMsg(null);
    setErrorCategory(null);
    setAiOutput('');
    setStructuredAnalysis(null);

    const promptToUse = inputPrompt.trim() || currentModule.defaultPrompt;

    try {
      if (selectedModule === 'startup_assistant') {
        // Deep 7-Section Comprehensive Startup Analysis
        const res = await fetch('/api/ai/startup-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || '',
            'x-user-role': user?.role || 'Founder',
          },
          body: JSON.stringify({
            founderId: user?.id,
            userRole: user?.role || 'Founder',
            startupId: selectedStartup?.id,
            startupName: selectedStartup?.name,
            prompt: promptToUse,
            forceRefresh,
            startupData: {
              ...selectedStartup,
              businessModel: customBusinessModel,
              targetCustomers: customTargetCustomers,
              competitors: customCompetitors,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          if (data.errorCategory) setErrorCategory(data.errorCategory);
          throw new Error(data.error || 'Failed to generate comprehensive startup analysis.');
        }

        setStructuredAnalysis(data.analysis);
        setAiOutput(data.analysis.fullMarkdown || '');
        if (data.modelUsed) setActiveModel(data.modelUsed);
        if (data.providerUsed) setActiveProvider(data.providerUsed);
        fetchAnalysisHistory();
      } else {
        // Other 11 Incubation Capabilities
        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || '',
            'x-user-role': user?.role || 'Founder',
          },
          body: JSON.stringify({
            feature: selectedModule,
            prompt: promptToUse,
            userId: user?.id,
            userRole: user?.role || 'Founder',
            forceRefresh,
            context: {
              startupName: selectedStartup?.name,
              industry: selectedStartup?.industry,
              stage: selectedStartup?.stage,
              description: selectedStartup?.description,
              businessModel: customBusinessModel,
              targetCustomers: customTargetCustomers,
              competitors: customCompetitors,
              revenue: selectedStartup?.monthlyRevenue,
              fundingRequired: selectedStartup?.fundingRequired,
              fundingRaised: selectedStartup?.fundingRaised,
              progress: selectedStartup?.progress,
              mentorsList: mentors.map((m) => `${m.name} (${m.expertise?.join(', ') || 'Advisor'})`),
            },
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          if (data.errorCategory) setErrorCategory(data.errorCategory);
          throw new Error(data.error || 'Failed to generate AI insights.');
        }
        setAiOutput(data.text || '');
        if (data.modelUsed) setActiveModel(data.modelUsed);
        if (data.providerUsed) setActiveProvider(data.providerUsed);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'AI service encountered an unexpected error. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy output to clipboard
  const handleCopy = () => {
    const textToCopy = structuredAnalysis?.fullMarkdown || aiOutput;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export / Download Analysis as Markdown
  const handleDownloadAnalysis = () => {
    const content = structuredAnalysis?.fullMarkdown || aiOutput;
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedStartup?.name || 'startup'}_ai_incubation_analysis_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Delete analysis from history
  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/ai/startup-analysis/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedAnalyses((prev) => prev.filter((a) => a.id !== id));
        if (structuredAnalysis?.id === id) {
          setStructuredAnalysis(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header matching Screenshot 11 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#6355F4] uppercase">
            GEMINI AI INTELLIGENCE ENGINE
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            AI Incubation Hub
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            12 specialized intelligence tools to accelerate founder decisions, mentor coaching, and portfolio outcomes.
          </p>
        </div>

        {savedAnalyses.length > 0 && (
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            <History className="w-4 h-4 text-[#6355F4]" />
            <span>Analysis Vault ({savedAnalyses.length})</span>
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Column: Module Selector Tabs (4 cols) matching Screenshot 11 */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-3 border border-gray-100 shadow-xs space-y-1 max-h-72 lg:max-h-[820px] overflow-y-auto">
          <p className="px-3 py-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
            CHOOSE AI CAPABILITY
          </p>
          {modules.map((mod) => {
            const Icon = mod.icon;
            const isSelected = selectedModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => {
                  setSelectedModule(mod.id);
                  setInputPrompt('');
                  setAiOutput('');
                  setStructuredAnalysis(null);
                  setErrorMsg(null);
                  setErrorCategory(null);
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#6355F4] text-white shadow-md shadow-purple-500/20'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-purple-50 text-[#6355F4]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold leading-tight truncate">{mod.name}</p>
                  <p
                    className={`text-[10px] mt-0.5 line-clamp-1 ${
                      isSelected ? 'text-purple-100' : 'text-gray-400'
                    }`}
                  >
                    {mod.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Execution Workspace & Live Response (8 cols) matching Screenshot 11 */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {/* Prompt card matching Screenshot 11 */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-100 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">{currentModule.name}</h3>
                <p className="text-xs text-gray-400">{currentModule.desc}</p>
              </div>

              {/* Startup Context Selector matching Screenshot 11 */}
              <div className="flex items-center gap-2 flex-wrap">
                {startups.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 font-semibold shrink-0">Context:</span>
                    <select
                      value={selectedStartupId}
                      onChange={(e) => setSelectedStartupId(e.target.value)}
                      className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 font-medium cursor-pointer max-w-full truncate"
                    >
                      {startups.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowContextTuner((prev) => !prev)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-gray-600 cursor-pointer"
                  title="Customize Business Model, Target Customers & Competitors"
                >
                  <SlidersHorizontal className="w-3 h-3 text-[#6355F4]" />
                  <span>Parameters</span>
                </button>
              </div>
            </div>

            {/* Optional Context Parameters Drawer */}
            {showContextTuner && (
              <div className="mb-4 p-4 rounded-2xl bg-purple-50/50 border border-purple-100 grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                    Business & Revenue Model
                  </label>
                  <input
                    type="text"
                    value={customBusinessModel}
                    onChange={(e) => setCustomBusinessModel(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                    Target Customers (ICP)
                  </label>
                  <input
                    type="text"
                    value={customTargetCustomers}
                    onChange={(e) => setCustomTargetCustomers(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                    Key Competitors
                  </label>
                  <input
                    type="text"
                    value={customCompetitors}
                    onChange={(e) => setCustomCompetitors(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700">
                Prompt / Specific Requirements
              </label>
              <textarea
                rows={3}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={currentModule.defaultPrompt}
                className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4] focus:bg-white transition-all leading-relaxed"
              />

              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setInputPrompt(currentModule.defaultPrompt)}
                  className="text-[11px] text-[#6355F4] hover:underline font-semibold cursor-pointer"
                >
                  Use sample prompt
                </button>

                {/* Primary "Generate Analysis" Button matching Screenshot 11 */}
                <button
                  onClick={() => handleRunAi(false)}
                  disabled={isLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Generating Strategic Analysis...' : 'Generate Analysis'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Smart Error Banner with Error Category & Retry Button */}
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-red-800">AI Analysis Request Failed</p>
                    {errorCategory && (
                      <span className="text-[10px] font-mono bg-red-100 text-red-700 px-2 py-0.5 rounded-md">
                        {errorCategory}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-red-700 mt-0.5">{errorMsg}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRunAi(true)}
                disabled={isLoading}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
              >
                Retry Analysis
              </button>
            </div>
          )}

          {/* AI Response Output Card matching Screenshot 11 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs min-h-[340px] flex flex-col justify-between">
            <div>
              {/* Output Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-gray-800">Gemini Intelligence Output</span>
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-mono">
                    {activeModel}
                  </span>
                  <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
                    {activeProvider}
                  </span>
                </div>

                {(aiOutput || structuredAnalysis) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunAi(true)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#6355F4] px-2.5 py-1 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                      title="Regenerate fresh analysis with same prompt"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Regenerate</span>
                    </button>

                    <button
                      onClick={handleDownloadAnalysis}
                      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#6355F4] px-2.5 py-1 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                      title="Download Analysis report as markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export</span>
                    </button>

                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#6355F4] px-2.5 py-1 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6355F4] flex items-center justify-center mb-3 animate-spin">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-gray-800">
                    Synthesizing comprehensive startup intelligence for {selectedStartup?.name || 'your venture'}...
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Evaluating business model, market opportunity, competitor moat, INR financials, risks, and 90-day roadmap
                  </p>
                </div>
              ) : structuredAnalysis ? (
                /* STRUCTURED 7-SECTION STARTUP ASSISTANT DISPLAY */
                <div className="space-y-6">
                  {/* Section Navigator Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-100">
                    {[
                      { id: 'all', label: 'Complete 360°' },
                      { id: 'overview', label: 'A. Overview & Readiness' },
                      { id: 'business', label: 'B. Business & SWOT' },
                      { id: 'market', label: 'C. Market Analysis' },
                      { id: 'product', label: 'D. Product Roadmap' },
                      { id: 'growth', label: 'E. GTM & Scaling' },
                      { id: 'funding', label: 'F. Funding & Capital' },
                      { id: 'action', label: 'G. Action Plan & KPIs' },
                    ].map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => setActiveAnalysisSection(sec.id)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all ${
                          activeAnalysisSection === sec.id
                            ? 'bg-[#6355F4] text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {sec.label}
                      </button>
                    ))}
                  </div>

                  {/* Section A: Startup Overview & Assessment */}
                  {(activeAnalysisSection === 'all' || activeAnalysisSection === 'overview') && (
                    <div className="p-5 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Rocket className="w-4 h-4 text-[#6355F4]" />
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                            Section A: Startup Overview & Readiness
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-purple-200 shadow-2xs">
                          <span className="text-[10px] font-semibold text-gray-500">Readiness Score:</span>
                          <span className="text-xs font-extrabold text-[#6355F4]">
                            {structuredAnalysis.overview.readinessScore}/10
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
                        <p>
                          <strong>Executive Summary:</strong> {structuredAnalysis.overview.summary}
                        </p>
                        <p>
                          <strong>Value Proposition & Moat:</strong> {structuredAnalysis.overview.valueProposition}
                        </p>
                        <p>
                          <strong>Stage Readiness:</strong> {structuredAnalysis.overview.stageReadiness}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Section B: Business Analysis & SWOT */}
                  {(activeAnalysisSection === 'all' || activeAnalysisSection === 'business') && (
                    <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
                      <div className="flex items-center gap-2">
                        <BarChart className="w-4 h-4 text-[#6355F4]" />
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                          Section B: Business Model & SWOT Analysis
                        </h4>
                      </div>

                      <div className="text-xs text-gray-700 leading-relaxed">
                        <p>
                          <strong>Core Business Model:</strong> {structuredAnalysis.businessAnalysis.businessModel}
                        </p>
                        <div className="mt-2">
                          <strong>Revenue Generation Streams:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-0.5 text-gray-600">
                            {structuredAnalysis.businessAnalysis.revenueOpportunities.map((rev, i) => (
                              <li key={i}>{rev}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* SWOT Matrix 2x2 */}
                      <div className="grid sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                          <p className="text-[11px] font-bold text-emerald-800 uppercase mb-1">Strengths (Internal)</p>
                          <ul className="space-y-1 text-[11px] text-emerald-950">
                            {structuredAnalysis.businessAnalysis.swot.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-emerald-600 font-bold">&bull;</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                          <p className="text-[11px] font-bold text-amber-800 uppercase mb-1">Weaknesses (Internal)</p>
                          <ul className="space-y-1 text-[11px] text-amber-950">
                            {structuredAnalysis.businessAnalysis.swot.weaknesses.map((w, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-amber-600 font-bold">&bull;</span>
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                          <p className="text-[11px] font-bold text-blue-800 uppercase mb-1">
                            Opportunities (External)
                          </p>
                          <ul className="space-y-1 text-[11px] text-blue-950">
                            {structuredAnalysis.businessAnalysis.swot.opportunities.map((o, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-blue-600 font-bold">&bull;</span>
                                <span>{o}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                          <p className="text-[11px] font-bold text-rose-800 uppercase mb-1">
                            Risks & Threats (External)
                          </p>
                          <ul className="space-y-1 text-[11px] text-rose-950">
                            {structuredAnalysis.businessAnalysis.swot.threats.map((t, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-rose-600 font-bold">&bull;</span>
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section C: Market Analysis */}
                  {(activeAnalysisSection === 'all' || activeAnalysisSection === 'market') && (
                    <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-[#6355F4]" />
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                          Section C: Market Opportunity, Target Customers & Competitor Analysis
                        </h4>
                      </div>

                      <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
                        <p>
                          <strong>Target Market & ICP:</strong> {structuredAnalysis.marketAnalysis.targetMarket}
                        </p>
                        <p>
                          <strong>Competitor Analysis & Moat:</strong>{' '}
                          {structuredAnalysis.marketAnalysis.competitorAnalysis}
                        </p>
                        <p>
                          <strong>Market Positioning:</strong> {structuredAnalysis.marketAnalysis.marketPositioning}
                        </p>
                        <div className="mt-2">
                          <strong>Customer Acquisition Channels:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-0.5 text-gray-600">
                            {structuredAnalysis.marketAnalysis.customerAcquisition.map((ca, i) => (
                              <li key={i}>{ca}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section D: Product Development */}
                  {(activeAnalysisSection === 'all' || activeAnalysisSection === 'product') && (
                    <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#6355F4]" />
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                          Section D: Product Development & Roadmap
                        </h4>
                      </div>

                      <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
                        <p>
                          <strong>MVP Recommendations:</strong>{' '}
                          {structuredAnalysis.productDevelopment.mvpRecommendations}
                        </p>

                        <div className="grid sm:grid-cols-2 gap-3 pt-2">
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-[11px] font-bold text-gray-800 mb-1">Roadmap Milestones:</p>
                            <ul className="space-y-1 text-[11px] text-gray-600">
                              {structuredAnalysis.productDevelopment.roadmap.map((rm, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-[#6355F4] font-bold">&rarr;</span>
                                  <span>{rm}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-[11px] font-bold text-gray-800 mb-1">Feature Prioritization:</p>
                            <ul className="space-y-1 text-[11px] text-gray-600">
                              {structuredAnalysis.productDevelopment.featurePrioritization.map((fp, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-emerald-500 font-bold">&#10003;</span>
                                  <span>{fp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section E: Business Growth & Scaling */}
                  {(activeAnalysisSection === 'all' || activeAnalysisSection === 'growth') && (
                    <div className="p-5 rounded-2xl bg-purple-50/30 border border-purple-100 space-y-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#6355F4]" />
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                          Section E: Business Growth Strategy & GTM Playbook
                        </h4>
                      </div>

                      <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
                        <p>
                          <strong>Go-To-Market (GTM) Strategy:</strong> {structuredAnalysis.businessGrowth.gtmStrategy}
                        </p>
                        <div className="grid sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <strong>Strategic Partnerships:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-0.5 text-gray-600">
                              {structuredAnalysis.businessGrowth.partnerships.map((p, i) => (
                                <li key={i}>{p}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <strong>Scaling Playbook:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-0.5 text-gray-600">
                              {structuredAnalysis.businessGrowth.scalingRecommendations.map((sr, i) => (
                                <li key={i}>{sr}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section F: Funding & Financial Guidance */}
                  {(activeAnalysisSection === 'all' || activeAnalysisSection === 'funding') && (
                    <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-[#6355F4]" />
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                            Section F: Funding Readiness & Financial Planning (INR ₹)
                          </h4>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          {structuredAnalysis.fundingGuidance.targetValuationOrAsk}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
                        <p>
                          <strong>Investment Readiness:</strong>{' '}
                          {structuredAnalysis.fundingGuidance.investmentReadiness}
                        </p>
                        <p>
                          <strong>Financial Planning & Runway:</strong>{' '}
                          {structuredAnalysis.fundingGuidance.financialPlanning}
                        </p>
                        <div className="mt-2">
                          <strong>Recommended Capital Instruments:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-0.5 text-gray-600">
                            {structuredAnalysis.fundingGuidance.fundingOptions.map((fo, i) => (
                              <li key={i}>{fo}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section G: Personalized Action Plan */}
                  {(activeAnalysisSection === 'all' || activeAnalysisSection === 'action') && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50/60 border border-purple-200/80 space-y-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#6355F4]" />
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                          Section G: Personalized Action Plan & Milestones
                        </h4>
                      </div>

                      <div className="grid md:grid-cols-3 gap-3">
                        <div className="p-3.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                          <p className="text-[11px] font-bold text-rose-600 uppercase mb-1.5 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5" />
                            <span>Immediate (Next 7 Days)</span>
                          </p>
                          <ul className="space-y-1.5 text-[11px] text-gray-700">
                            {structuredAnalysis.actionPlan.immediatePriorities.map((item, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-rose-500 font-bold">&bull;</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                          <p className="text-[11px] font-bold text-[#6355F4] uppercase mb-1.5">
                            Short-Term (Next 30 Days)
                          </p>
                          <ul className="space-y-1.5 text-[11px] text-gray-700">
                            {structuredAnalysis.actionPlan.shortTermGoals.map((item, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-[#6355F4] font-bold">&bull;</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                          <p className="text-[11px] font-bold text-indigo-600 uppercase mb-1.5">
                            Mid-Term (Next 90 Days)
                          </p>
                          <ul className="space-y-1.5 text-[11px] text-gray-700">
                            {structuredAnalysis.actionPlan.midTermGoals.map((item, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-indigo-500 font-bold">&bull;</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* North star KPIs */}
                      <div className="p-3.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                        <p className="text-[11px] font-bold text-gray-700 uppercase mb-1">
                          Key Performance Indicators (KPIs) to Track:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {structuredAnalysis.actionPlan.kpis.map((kpi, idx) => (
                            <span
                              key={idx}
                              className="text-xs font-semibold bg-purple-50 text-[#6355F4] px-2.5 py-1 rounded-lg border border-purple-200"
                            >
                              {kpi}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : aiOutput ? (
                /* Standard Markdown output for the other 11 capabilities */
                <div className="prose prose-sm max-w-none text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                  {aiOutput}
                </div>
              ) : (
                /* Initial empty state matching Screenshot 11 */
                <div className="py-20 flex flex-col items-center justify-center text-center text-gray-400">
                  <Bot className="w-10 h-10 mb-2 text-gray-300" />
                  <p className="text-xs font-medium">Select a capability and click Generate Analysis.</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 max-w-sm">
                    Responses are generated live by {activeProvider} with full incubator context.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Vault / History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#6355F4]" />
                <h3 className="text-base font-bold text-gray-900">AI Incubation Guidance Vault</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {savedAnalyses.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="text-xs">No saved analyses yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedAnalyses.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => {
                      setStructuredAnalysis(rec);
                      setSelectedModule('startup_assistant');
                      if (rec.modelUsed) setActiveModel(rec.modelUsed);
                      if (rec.providerUsed) setActiveProvider(rec.providerUsed);
                      setShowHistoryModal(false);
                    }}
                    className="p-4 rounded-2xl border border-gray-200 hover:border-purple-300 bg-gray-50/50 hover:bg-white transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-900">{rec.startupName}</span>
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                          Readiness: {rec.overview.readinessScore}/10
                        </span>
                        {rec.modelUsed && (
                          <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                            {rec.modelUsed}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1">Prompt: "{rec.prompt}"</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-mono">
                        {new Date(rec.createdAt).toLocaleDateString()} {new Date(rec.createdAt).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => handleDeleteHistoryItem(rec.id, e)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete from vault"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ArrowRight className="w-4 h-4 text-[#6355F4]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
