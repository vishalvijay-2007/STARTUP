import React, { useState } from 'react';
import {
  Rocket,
  Users,
  Shield,
  TrendingUp,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Target,
  BarChart2,
  Layers,
  ChevronDown,
  Building2,
  Lock,
  FileCheck2,
  Activity,
  Briefcase,
  HelpCircle,
  Mail,
  ArrowUpRight,
  Globe,
  SlidersHorizontal,
  Sparkles,
  BookOpen,
  Bot,
  Clock,
  Send,
  Check,
  MapPin,
  LogOut,
  GraduationCap,
  BrainCircuit,
  MessageSquare,
  Award,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { BrandLogo } from '../common/BrandLogo';

interface LandingPageProps {
  onGoToLogin: (role?: UserRole) => void;
  onGoToRegister: (role?: UserRole) => void;
  onEnterWorkspace: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onEnterWorkspace,
}) => {
  const { user, logout } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    organization: '',
    role: 'founder',
    message: '',
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Active AI tab preview in AI Hub section
  const [activeAiTab, setActiveAiTab] = useState<number>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Ensure Sign In opens the real authentication page
  const handleSignIn = (role?: UserRole) => {
    setIsMobileMenuOpen(false);
    onGoToLogin(role);
  };

  // Ensure Get Started opens the real registration/authentication page
  const handleGetStarted = (role?: UserRole) => {
    setIsMobileMenuOpen(false);
    onGoToRegister(role);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setTimeout(() => {
      setContactSubmitting(false);
      setContactSubmitted(true);
    }, 700);
  };

  const navLinks = [
    { label: 'About', href: '#about', id: 'about' },
    { label: 'Platform Features', href: '#features', id: 'features' },
    { label: 'User Roles', href: '#roles', id: 'roles' },
    { label: 'How It Works', href: '#how-it-works', id: 'how-it-works' },
    { label: 'AI Incubation Suite', href: '#ai-hub', id: 'ai-hub' },
    { label: 'Courses & Learning', href: '#courses', id: 'courses' },
    { label: 'FAQ', href: '#faq', id: 'faq' },
    { label: 'Contact', href: '#contact', id: 'contact' },
  ];

  const aiCapabilities = [
    {
      id: 'assistant',
      title: 'AI Startup Assistant',
      desc: 'Interactive co-pilot for pitch preparation, customer discovery, and tactical execution.',
      samplePrompt: 'Analyze our pilot clinic onboarding velocity and recommend terms for our ₹5 Crore Seed round.',
      responseMetrics: {
        score: '8.4/10',
        scoreLabel: 'Velocity Score',
        targetCap: '₹40 - ₹50 Crores SAFE post-money valuation',
        immediateAction: 'Convert clinic letters of intent into paid multi-year license contracts before VC partner pitch.',
      },
    },
    {
      id: 'canvas',
      title: 'AI Business Model Canvas',
      desc: 'Formulate, validate, and stress-test high-growth lean business models.',
      samplePrompt: 'Generate a Lean Business Model Canvas for an AI workflow automation tool targeting legal ops teams.',
      responseMetrics: {
        score: '9.1/10',
        scoreLabel: 'Viability Index',
        targetCap: 'Target ACV: ₹20,00,000/yr with 82% gross margins',
        immediateAction: 'Focus customer interviews on mid-tier corporate legal departments experiencing matter management bottlenecks.',
      },
    },
    {
      id: 'tam',
      title: 'TAM/SAM/SOM Analysis',
      desc: 'Rigorous market sizing calculations and competitive moat benchmarking.',
      samplePrompt: 'Calculate TAM, SAM, and SOM for a specialty vertical SaaS solution for commercial EV fleet operators in India.',
      responseMetrics: {
        score: '₹1.15 Lakh Cr',
        scoreLabel: 'Estimated TAM',
        targetCap: 'SAM: ₹22,500 Cr (Fleet operators) | SOM: ₹1,500 Cr (Year 1-3 capture)',
        immediateAction: 'Prioritize telematics API integration to reduce buyer implementation cycles under 14 days.',
      },
    },
    {
      id: 'gtm',
      title: 'Growth & GTM Playbook',
      desc: 'Customer acquisition channel prioritization, B2B outbound sequences, and CAC models.',
      samplePrompt: 'Recommend high-converting B2B cold outbound sequencing and channel strategy for B2B cybersecurity software.',
      responseMetrics: {
        score: '3.8x',
        scoreLabel: 'Projected LTV:CAC',
        targetCap: 'Channel mix: 45% LinkedIn Account-Based Marketing, 35% Cold Email, 20% Founder-Led Demos',
        immediateAction: 'Launch pilot sandbox proof-of-concept offer targeting CISOs at companies with 200-1000 employees.',
      },
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-purple-100 selection:text-purple-900">
      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3 xl:gap-6">
          {/* Far Left: Brand Logo */}
          <div className="flex items-center shrink-0">
            <BrandLogo
              variant="navbar"
              size="md"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="shrink-0 cursor-pointer"
            />
          </div>

          {/* Center: 8 Navigation Links in Exact Required Order
              1. About
              2. Platform Features
              3. User Roles
              4. How It Works
              5. AI Incubation Suite
              6. Courses & Learning
              7. FAQ
              8. Contact
          */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center justify-center flex-1 gap-2.5 xl:gap-5 2xl:gap-6 text-[11px] xl:text-xs font-semibold text-slate-600 uppercase tracking-wider"
          >
            {navLinks.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.id)}
                className="hover:text-[#6355F4] transition-colors whitespace-nowrap py-1.5"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Far Right: Authentication Buttons in Exact Order
              9. Sign In (Secondary Button)
              10. Get Started (Primary Purple Button)
          */}
          <div className="hidden lg:flex items-center justify-end gap-2.5 xl:gap-3 shrink-0">
            {/* 9. Sign In - Secondary Button */}
            <button
              type="button"
              onClick={() => handleSignIn()}
              className="px-4 py-2.5 rounded-xl border border-gray-200 hover:border-[#6355F4]/40 bg-white hover:bg-purple-50/60 text-slate-700 hover:text-[#6355F4] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
            >
              Sign In
            </button>

            {/* 10. Get Started - Primary Purple Button */}
            <button
              type="button"
              onClick={() => handleGetStarted()}
              className="bg-[#6355F4] hover:bg-[#5244E0] active:scale-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-purple-500/25 transition-all cursor-pointer whitespace-nowrap"
            >
              Get Started
            </button>
          </div>

          {/* Mobile & Tablet Hamburger Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl border border-gray-200 text-gray-700 hover:text-[#6355F4] hover:bg-purple-50 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-gray-900" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Hamburger Drawer Menu with Exact Same 10 Ordered Items */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/98 backdrop-blur-lg border-b border-gray-200 px-4 sm:px-6 pt-3 pb-6 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-1 text-sm font-semibold text-gray-700">
              {navLinks.map((item, idx) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className="px-3.5 py-2.5 rounded-xl hover:bg-purple-50 hover:text-[#6355F4] transition-colors flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] text-gray-400 font-mono">0{idx + 1}</span>
                </a>
              ))}

              {/* 9. Sign In & 10. Get Started */}
              <div className="pt-3 mt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 9. Sign In (Secondary Button) */}
                <button
                  type="button"
                  onClick={() => handleSignIn()}
                  className="w-full py-2.5 px-4 text-center text-xs font-bold text-slate-700 hover:text-[#6355F4] bg-white hover:bg-purple-50 border border-gray-200 hover:border-[#6355F4]/40 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                >
                  Sign In
                </button>

                {/* 10. Get Started (Primary Purple Button) */}
                <button
                  type="button"
                  onClick={() => handleGetStarted()}
                  className="w-full py-3 px-4 bg-[#6355F4] hover:bg-[#5244E0] active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 text-center transition-all cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 1. Professional Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-24 sm:pb-28 overflow-hidden bg-radial from-purple-50/70 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-purple-200 bg-purple-50/80 text-[#6355F4] text-[11px] sm:text-xs font-bold mb-6 sm:mb-8 max-w-full">
            <span className="w-2 h-2 rounded-full bg-[#6355F4] animate-pulse shrink-0" />
            <span className="truncate sm:whitespace-normal">Centralized Startup Incubation & Cohort Management System</span>
          </div>

          <h1 className="text-fluid-hero font-extrabold text-gray-900 tracking-tight max-w-5xl mx-auto leading-tight">
            Empowering Startups.{' '}
            <span className="text-[#6355F4] block sm:inline">Connecting Mentors.</span>{' '}
            Accelerating Growth.
          </h1>

          <p className="mt-5 sm:mt-6 text-sm sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-normal">
            A unified startup management platform designed to help incubators manage startup cohorts,
            track founder progress, strengthen mentor engagement, and optimize resources — all in one
            place.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4">
            {user ? (
              <button
                onClick={onEnterWorkspace}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#6355F4] hover:bg-[#5244E0] active:scale-95 text-white text-sm font-bold px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl shadow-xl shadow-purple-500/25 transition-all cursor-pointer"
              >
                Go to {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            ) : (
              <button
                onClick={() => handleGetStarted()}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#6355F4] hover:bg-[#5244E0] active:scale-95 text-white text-sm font-bold px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl shadow-xl shadow-purple-500/25 transition-all cursor-pointer"
              >
                Get Started <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            )}

            <button
              onClick={scrollToFeatures}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 text-sm font-bold px-7 py-3.5 sm:py-4 rounded-2xl border border-gray-200 shadow-xs transition-all cursor-pointer"
            >
              Explore Platform
            </button>
          </div>

          {/* Interactive Realistic Incubator Dashboard Preview Mockup */}
          <div className="mt-12 sm:mt-16 rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-gray-200/70 to-gray-100/40 border border-gray-200 shadow-2xl max-w-5xl mx-auto text-left">
            <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
              {/* Browser Mock Header */}
              <div className="h-10 bg-gray-50 flex items-center px-3 sm:px-4 gap-2 border-b border-gray-200">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="mx-auto bg-white px-2.5 sm:px-4 py-1 rounded-lg border border-gray-200 text-[10px] sm:text-[11px] text-gray-500 font-mono flex items-center gap-1.5 shadow-2xs min-w-0 max-w-full">
                  <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">https://app.startupincubator.io/workspace/dashboard</span>
                </div>
              </div>

              {/* Realistic Dashboard Preview UI */}
              <div className="p-4 sm:p-8 bg-slate-50/50 space-y-5 sm:space-y-6">
                {/* Metrics Row */}
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-xs">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Active Startups
                    </p>
                    <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">14</p>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">
                      +3 joined this batch
                    </span>
                  </div>
                  <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-xs">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Mentoring Touchpoints
                    </p>
                    <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">148</p>
                    <span className="text-[10px] text-purple-600 font-bold mt-1 inline-block">
                      4.9/5.0 avg mentor rating
                    </span>
                  </div>
                  <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-xs">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Milestone Velocity
                    </p>
                    <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">84%</p>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">
                      On-schedule delivery
                    </span>
                  </div>
                  <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-xs">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Resources Allocated
                    </p>
                    <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">₹2,00,00,000</p>
                    <span className="text-[10px] text-blue-600 font-bold mt-1 inline-block">
                      AWS, GCP & Legal Credits
                    </span>
                  </div>
                </div>

                {/* Cohorts & Mentorship Preview Grid */}
                <div className="grid md:grid-cols-3 gap-5">
                  <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Incubation Cohorts Overview</h4>
                        <p className="text-[11px] text-gray-400">Current batch milestone completions</p>
                      </div>
                      <span className="text-[11px] font-bold text-[#6355F4] bg-purple-50 px-2.5 py-1 rounded-lg">
                        Active Portfolios
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-gray-800">Winter 2026 Tech Batch (8 Teams)</span>
                          <span className="text-[#6355F4]">68% Progress</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#6355F4] rounded-full" style={{ width: '68%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-gray-800">Spring 2026 AI Frontier Cohort (4 Teams)</span>
                          <span className="text-purple-600">42% Progress</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: '42%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-gray-800">Fall 2025 Seed Sprint Batch (Graduated)</span>
                          <span className="text-emerald-600">100% Completed</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">Upcoming Mentorship</h4>
                      <p className="text-[11px] text-gray-400 mb-3">Live verified touchpoints</p>

                      <div className="space-y-2.5">
                        <div className="p-2.5 bg-purple-50/60 rounded-xl border border-purple-100 text-xs">
                          <p className="font-bold text-gray-900">PulseAI Diagnostics</p>
                          <p className="text-[11px] text-purple-700">Dr. Sarah Chen · FDA 510(k) Review</p>
                          <span className="text-[10px] text-gray-400 mt-1 block">Friday at 2:00 PM</span>
                        </div>
                        <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                          <p className="font-bold text-gray-900">GreenLogix Supply</p>
                          <p className="text-[11px] text-gray-600">Elena Rostova · Cold Outreach ICP</p>
                          <span className="text-[10px] text-gray-400 mt-1 block">Tuesday at 4:00 PM</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => (user ? onEnterWorkspace() : handleSignIn())}
                      className="mt-4 w-full py-2 bg-[#6355F4] text-white rounded-xl text-xs font-bold hover:bg-[#5244E0] transition-colors cursor-pointer"
                    >
                      {user ? 'Enter Your Workspace' : 'Access Live Workspace'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Capability Strip */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-bold text-slate-600 max-w-4xl mx-auto border-t border-purple-100/60 pt-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Founder-Mentor Matching</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6355F4]" />
              <span>Enterprise-Grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Real-Time Workspace Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Indian Rupee (INR ₹) Native</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. About Our Platform Section */}
      <section id="about" className="scroll-mt-20 py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6355F4]">
              ABOUT OUR PLATFORM
            </span>
            <div className="mt-2 mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#6355F4] text-xs font-semibold border border-purple-100">
              <MapPin className="w-3.5 h-3.5" />
              <span>Headquartered in Chennai, Tamil Nadu, India</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mt-1">
              The Purpose-Built Operating System for Startup Incubators
            </h2>
            <p className="text-base text-gray-500 mt-3 leading-relaxed">
              Startup incubation has outgrown scattered spreadsheets, manual scheduling threads, and disconnected
              document folders. Our platform provides a single institutional source of truth for founders, mentors,
              and program directors.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50/70 border border-gray-100 hover:border-purple-200 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#6355F4] flex items-center justify-center mb-5">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Quantified Founder Velocity</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Replace vague status updates with milestone tracking, target revenue KPIs, and real-time sprint execution metrics.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50/70 border border-gray-100 hover:border-purple-200 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">High-Accountability Advisory</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Mentors schedule 1:1 touchpoints, access startup context ahead of time, and document feedback with ratings and action items.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50/70 border border-gray-100 hover:border-purple-200 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Full Cohort Lifecycle</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Orchestrate multiple batches simultaneously from intake application through curriculum, mentoring, and Demo Day.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50/70 border border-gray-100 hover:border-purple-200 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-5">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Integrated Gemini AI Suite</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Empower founders with instant AI market analysis, TAM calculations, milestone suggesters, and automated course recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Platform Features Section (8 Required Features) */}
      <section id="features" className="scroll-mt-20 py-24 bg-gray-50/70 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6355F4]">
              COMPREHENSIVE SAAS PLATFORM
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mt-2">
              Everything Incubators Need to Scale
            </h2>
            <p className="text-base text-gray-500 mt-3 leading-relaxed">
              Engineered specifically for startup incubators, accelerators, and venture studios to manage
              founders, coordinate mentors, track cohorts, and measure real progress.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:border-purple-200 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6355F4] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Startup Progress Tracking</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Monitor milestone delivery velocity, quantitative KPIs, and product launch roadmaps across all
                enrolled startups in real time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:border-purple-200 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Mentor Engagement Management</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Coordinate 1:1 advisory touchpoints, track hours contributed, review session agendas, and collect
                systematic evaluations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:border-purple-200 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Cohort Management</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Organize startups into structured incubation batches with custom start dates, graduation milestones,
                and targeted fundraising goals.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:border-purple-200 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Startup Performance Analytics</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Aggregate real-time metrics on capital required, funding raised, monthly recurring revenue, and
                lifecycle stage progression.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:border-purple-200 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Resource Utilization</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Manage incubator perks, cloud credits (AWS, Google Cloud), legal services, and workspace access with
                transparent request workflows.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:border-purple-200 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Founder & Mentor Collaboration</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Facilitate direct meeting scheduling with Google Meet links, structured pre-reads, meeting notes, and
                action item tracking.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:border-purple-200 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Incubation Activity Monitoring</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Full immutable platform audit logs tracking sign-ins, profile edits, session reviews, mentor approvals,
                and milestone completions.
              </p>
            </div>

            {/* Feature 8 */}
            <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:border-purple-200 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Centralized Admin Management</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Grant role-based authorization, approve mentor applications, pair mentors to founder teams, and
                export complete cohort reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. User Roles Section (Founder, Mentor, Admin) */}
      <section id="roles" className="scroll-mt-20 py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6355F4]">
              THREE INDEPENDENT ROLES
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mt-2">
              Tailored Portals for Every Stakeholder
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Independent role-based authorization ensuring data security, personalized dashboards, and seamless communication.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Founder Card */}
            <div className="bg-slate-50/70 rounded-3xl p-8 border border-gray-100 hover:border-purple-300 hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#6355F4] flex items-center justify-center mb-6">
                  <Rocket className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6355F4] bg-purple-50 px-2 py-0.5 rounded-md">
                    Founder Role
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Founders</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-6 font-normal">
                  Empowering founders to manage startup records, track weighted milestones, schedule 1:1 mentor touchpoints, and unlock AI acceleration.
                </p>

                <div className="space-y-2.5 text-xs text-gray-600 mb-8">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Real-time milestone progress tracking</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Interactive AI Startup Strategy Assistant</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Direct mentor booking & session logs</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>₹75 Lakhs+ Cloud & Legal perk requests</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Curated courses & AI syllabus generation</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => (user ? onEnterWorkspace() : handleSignIn('founder'))}
                className="w-full py-3.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-bold transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {user?.role === 'founder' ? 'Open Founder Dashboard' : 'Explore Founder Portal'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mentor Card */}
            <div className="bg-slate-50/70 rounded-3xl p-8 border border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    Mentor Role
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Mentors</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-6 font-normal">
                  Structured advisory workflows. Review assigned startup milestones, schedule touchpoints with video links, and provide actionable feedback.
                </p>

                <div className="space-y-2.5 text-xs text-gray-600 mb-8">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Vetted application & approval workflow</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Assigned portfolio oversight & telemetry</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Session note documentation & evaluations</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Advisory bio and domain expertise profile</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Historical session log & ratings archive</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => (user ? onEnterWorkspace() : handleSignIn('mentor'))}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {user?.role === 'mentor' ? 'Open Mentor Dashboard' : 'Explore Mentor Portal'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Admin Card */}
            <div className="bg-slate-50/70 rounded-3xl p-8 border border-gray-100 hover:border-violet-300 hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
                    Admin Role
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Admin Command Center</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-6 font-normal">
                  Full incubation lifecycle governance. Approve mentors, launch cohorts, match founders to advisors, review resource usage, and export CSV reports.
                </p>

                <div className="space-y-2.5 text-xs text-gray-600 mb-8">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                    <span>Mentor application approval / rejection</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                    <span>Cohort management & batch assignments</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                    <span>Resource allocation & credit approvals</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                    <span>Aggregated analytics & CSV export</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                    <span>Institutional audit trail & user governance</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => (user ? onEnterWorkspace() : handleSignIn('admin'))}
                className="w-full py-3.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold transition-all shadow-md shadow-violet-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {user?.role === 'admin' ? 'Open Admin Command' : 'Explore Admin Command'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Courses & Learning Section */}
      <section id="courses" className="scroll-mt-20 py-24 bg-gray-50/70 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6355F4]">
              INCUBATOR FOUNDER CURRICULUM
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mt-2">
              Courses & Learning Hub
            </h2>
            <p className="text-base text-gray-500 mt-3 leading-relaxed">
              Curated masterclasses and tactical knowledge modules engineered for early-stage founders.
              Features our real-time <strong className="text-purple-700 font-semibold">Suggest with AI</strong> engine to generate custom learning roadmaps.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Course 1 */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md bg-purple-50 text-[#6355F4]">
                    Fundraising
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">8 Lessons</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Seed Fundraising & SAFE Term Sheets</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Master post-money valuation caps, investor dilution calculations, and high-converting pitch deck narrative mechanics.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">Advanced</span>
                <span className="text-[#6355F4] font-bold">Included</span>
              </div>
            </div>

            {/* Course 2 */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md bg-blue-50 text-blue-600">
                    Sales & GTM
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">6 Lessons</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">B2B Go-To-Market & Pilot Traction</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Executing founder-led outbound campaigns, closing paid commercial pilot agreements, and securing LOIs.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">Intermediate</span>
                <span className="text-blue-600 font-bold">Included</span>
              </div>
            </div>

            {/* Course 3 */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600">
                    Product
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">10 Lessons</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Product-Market Fit & Prototyping</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Conducting unbiased customer discovery interviews, running validation tests, and determining genuine retention signals.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">Foundational</span>
                <span className="text-emerald-600 font-bold">Included</span>
              </div>
            </div>

            {/* Course 4 */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md bg-amber-50 text-amber-600">
                    Finance
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">7 Lessons</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Unit Economics & Runway Modeling</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Calculate true gross margins, LTV/CAC ratios, churn dynamics, and engineer runway models before meeting angel investors.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">Intermediate</span>
                <span className="text-amber-600 font-bold">Included</span>
              </div>
            </div>
          </div>

          {/* AI Course Suggester Highlight Banner */}
          <div className="bg-gradient-to-r from-[#1B1046] via-[#2A186C] to-[#1B1046] rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Real AI Integration · Suggest with AI Feature</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Need a Personalized Founder Curriculum?
              </h3>
              <p className="mt-2 text-sm text-purple-100/80 leading-relaxed">
                Founders can tap the <strong>Suggest with AI</strong> button in the workspace to input their startup stage, industry, and immediate growth roadblocks. Our Gemini AI backend builds bespoke lesson outlines, recommended reading, and milestone tie-ins within seconds.
              </p>
            </div>

            <button
              onClick={() => (user ? onEnterWorkspace() : handleSignIn('founder'))}
              className="shrink-0 flex items-center gap-2 bg-[#6355F4] hover:bg-[#5244E0] active:scale-95 text-white text-xs font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-purple-500/30 transition-all cursor-pointer"
            >
              <span>Explore Courses in Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. AI Incubation Hub Section (Gemini 3.8 Flash Intelligence) */}
      <section id="ai-hub" className="scroll-mt-20 py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6355F4]">
              POWERED BY GEMINI 3.8 FLASH & 3.1 FLASH-LITE
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mt-2">
              12 Dedicated AI Modules for Startup Acceleration
            </h2>
            <p className="text-base text-gray-500 mt-3 leading-relaxed">
              Every prompt connects directly to our secure server-side Gemini AI engine. No mock results — generate real market models, GTM strategies, and risk analysis in seconds.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Capability Selectors */}
            <div className="lg:col-span-5 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Choose AI Capability
              </p>

              {aiCapabilities.map((cap, idx) => (
                <div
                  key={cap.id}
                  onClick={() => setActiveAiTab(idx)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeAiTab === idx
                      ? 'bg-purple-50/70 border-[#6355F4] shadow-sm ring-1 ring-[#6355F4]'
                      : 'bg-white border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        activeAiTab === idx ? 'bg-[#6355F4] text-white' : 'bg-purple-100 text-[#6355F4]'
                      }`}
                    >
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{cap.title}</h4>
                      <p className="text-[11px] text-gray-500 line-clamp-1">{cap.desc}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <button
                  onClick={() => (user ? onEnterWorkspace() : handleSignIn())}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  <span>Launch All 12 AI Tools in Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Column: Interactive Gemini Simulation Card Matching Screenshot */}
            <div className="lg:col-span-7 bg-[#1B1046] text-white rounded-3xl p-5 sm:p-8 shadow-2xl border border-purple-900/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {aiCapabilities[activeAiTab].title}
                      </h4>
                      <p className="text-[11px] text-purple-200/70">
                        {aiCapabilities[activeAiTab].desc}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active Model: gemini-3.8-flash
                  </span>
                </div>

                {/* Prompt Box */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
                    Founder Prompt:
                  </p>
                  <p className="text-xs sm:text-sm text-purple-50 font-mono leading-relaxed">
                    "{aiCapabilities[activeAiTab].samplePrompt}"
                  </p>
                </div>

                {/* Live Output */}
                <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/60 border border-purple-500/20 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-purple-300 font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      Gemini Intelligence Output
                    </span>
                    <span className="text-[10px] text-purple-300/80 font-mono">Response Latency: 184ms</span>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm text-purple-100">
                    <p className="leading-relaxed">
                      <strong className="text-purple-300">✦ {aiCapabilities[activeAiTab].responseMetrics.scoreLabel}: </strong>
                      {aiCapabilities[activeAiTab].responseMetrics.score}
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-purple-300">✦ Valuation / Target Benchmark: </strong>
                      {aiCapabilities[activeAiTab].responseMetrics.targetCap}
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-purple-300">✦ Immediate Tactical Action: </strong>
                      {aiCapabilities[activeAiTab].responseMetrics.immediateAction}
                    </p>
                  </div>
                </div>

                {/* Interactive Action */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-purple-200/60">
                    Dual model failover configured with 15s race condition protection.
                  </span>
                  <button
                    onClick={() => (user ? onEnterWorkspace() : handleSignIn())}
                    className="flex items-center gap-1.5 text-purple-300 hover:text-white font-bold cursor-pointer"
                  >
                    <span>Try in Sandbox</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. How It Works Section (4 Simple Steps) */}
      <section id="how-it-works" className="scroll-mt-20 py-24 bg-gray-50/70 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6355F4]">
              SIMPLE FOUR-STEP PROCESS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mt-2">
              How It Works
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              From onboarding to Demo Day: a streamlined methodology for startup incubation excellence.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6355F4] flex items-center justify-center font-extrabold text-sm mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Register your account</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Founders, mentors, and administrators create secure, role-verified profiles with password protection or
                Google authentication.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6355F4] flex items-center justify-center font-extrabold text-sm mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Create or join a cohort</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Incubators establish seasonal batches with targeted funding, start dates, and structured development
                milestones.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6355F4] flex items-center justify-center font-extrabold text-sm mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Connect with Mentors</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Administrators match startups with verified domain advisors for 1:1 sessions, strategic feedback, and
                fundraising guidance.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6355F4] flex items-center justify-center font-extrabold text-sm mb-4">
                04
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Track & measure outcomes</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Monitor real-time progress percentages, evaluate mentor engagement scores, and export institutional
                reports for stakeholders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Platform Capabilities Banner */}
      <section id="capabilities" className="py-20 bg-[#140D36] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-purple-300">100%</p>
              <p className="text-xs font-bold text-white mt-2">Full-Stack SaaS</p>
              <p className="text-[11px] text-purple-200/70 mt-1 max-w-xs mx-auto">
                Real backend & database integration with no hardcoded mocks
              </p>
            </div>
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-purple-300">3</p>
              <p className="text-xs font-bold text-white mt-2">Independent User Roles</p>
              <p className="text-[11px] text-purple-200/70 mt-1 max-w-xs mx-auto">
                Founder, Mentor, and Admin workflows with strict access controls
              </p>
            </div>
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-purple-300">12</p>
              <p className="text-xs font-bold text-white mt-2">Integrated AI Capabilities</p>
              <p className="text-[11px] text-purple-200/70 mt-1 max-w-xs mx-auto">
                Real-time Gemini models for courses, TAM, milestones, and GTM
              </p>
            </div>
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-purple-300">&lt; 200ms</p>
              <p className="text-xs font-bold text-white mt-2">Server Response Latency</p>
              <p className="text-[11px] text-purple-200/70 mt-1 max-w-xs mx-auto">
                High-performance Node & Vite stack ready for active cohorts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Contact Section */}
      <section id="contact" className="scroll-mt-20 py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6355F4]">
              GET IN TOUCH
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mt-2">
              Contact Incubation Office
            </h2>
            <p className="text-base text-gray-500 mt-3 leading-relaxed">
              Have questions about deploying our platform for your accelerator, incubator, or university venture fund? Reach out to our operations team.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Contact Details */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-gray-100 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Incubator Operations Office</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    We support incubator program directors, managing directors, and founder cohorts globally.
                  </p>
                </div>

                <div className="space-y-4 text-xs text-gray-600">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6355F4] flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Direct Support Email</p>
                      <a href="mailto:support@startupincubator.io" className="text-[#6355F4] hover:underline">
                        support@startupincubator.io
                      </a>
                      <p className="text-[11px] text-gray-400 mt-0.5">Average reply time: under 2 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6355F4] flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Innovation Hub Headquarters</p>
                      <p className="text-gray-600 font-medium">Chennai, Tamil Nadu, India</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6355F4] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Operating Hours</p>
                      <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM IST</p>
                      <p className="text-gray-400 text-[11px]">24/7 automated platform monitoring</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-gray-200/80 shadow-lg">
              {contactSubmitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Inquiry Received</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Thank you for reaching out to the Startup Incubation Platform team. A program director will review your message and reply to <strong>{contactForm.email}</strong> shortly.
                  </p>
                  <button
                    onClick={() => {
                      setContactSubmitted(false);
                      setContactForm({
                        name: '',
                        email: '',
                        organization: '',
                        role: 'founder',
                        message: '',
                      });
                    }}
                    className="mt-4 text-xs font-bold text-[#6355F4] hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Send a Message</h3>
                  <p className="text-xs text-gray-500 mb-5">
                    Submit your inquiry below and connect with our platform architects.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="e.g. Alex Morgan"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#6355F4] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Work Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="alex@organization.com"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#6355F4] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Organization / Incubator Name
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.organization}
                        onChange={(e) => setContactForm({ ...contactForm, organization: e.target.value })}
                        placeholder="e.g. Mission Bay Ventures"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#6355F4] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Your Stakeholder Role
                      </label>
                      <select
                        value={contactForm.role}
                        onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#6355F4] transition-all"
                      >
                        <option value="founder">Startup Founder</option>
                        <option value="mentor">Industry Mentor</option>
                        <option value="director">Incubator Program Director</option>
                        <option value="investor">Angel / Venture Partner</option>
                        <option value="other">Other Inquiry</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Message / Requirements
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Tell us about your incubator program, cohort size, or specific features you'd like to explore..."
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#6355F4] transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="w-full py-3.5 bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{contactSubmitting ? 'Sending inquiry...' : 'Send Message to Incubation Office'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) */}
      <section id="faq" className="scroll-mt-20 py-24 bg-gray-50/70 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6355F4]">
              QUESTIONS & ANSWERS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mt-2">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Clear answers regarding platform setup, role permissions, and incubation operations.
            </p>
          </div>

          <div className="space-y-3.5">
            {[
              {
                q: 'How does the platform separate founder, mentor, and administrator access?',
                a: 'The platform implements strict role-based access control (RBAC). When registering or logging in, users select their role and are authenticated against server-verified records. Founders access startup metrics and mentor booking; mentors access assigned founder advisory touchpoints; administrators govern the entire incubator portfolio.',
              },
              {
                q: 'Can an incubator manage multiple cohorts simultaneously?',
                a: 'Yes. Administrators can create unlimited cohorts with distinct start dates, completion targets, target funding goals, and assigned startups and mentors. Milestone progress is aggregated both by cohort and across the entire incubator.',
              },
              {
                q: 'How do mentors schedule sessions and provide feedback?',
                a: 'Mentors view their assigned startups in the Mentor Dashboard, schedule touchpoints with direct meeting links, and submit written feedback alongside a 1–5 star performance rating upon session completion. This creates a documented record of founder execution.',
              },
              {
                q: 'How are administrative accounts authorized?',
                a: 'To maintain enterprise security, administrative registration requires an authorized root invitation key (or pre-authorized administrative email). This ensures public visitors cannot register unauthorized management accounts.',
              },
              {
                q: 'How does resource utilization tracking work?',
                a: 'The platform maintains a catalog of available perks (e.g. AWS credits, Google Cloud credits, Stripe processing credits, legal consults). Founders submit requests with justifications, and administrators approve or deny them in one click.',
              },
              {
                q: 'Can users sign in with their Google accounts?',
                a: 'Yes. The platform supports Google authentication for Founders, Mentors, and Administrators, linking verified Google profiles directly to real database records and role-specific dashboards.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-gray-900 cursor-pointer hover:bg-gray-50/50"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === idx ? 'rotate-180 text-[#6355F4]' : ''}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-gray-600 leading-relaxed border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-radial from-purple-50/80 via-white to-white border-t border-gray-100 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Ready to upgrade your incubation operations?
          </h2>
          <p className="mt-4 text-base text-gray-600 max-w-2xl mx-auto">
            Join forward-thinking startup incubators, mentors, and founders utilizing a centralized system to build,
            connect, and scale.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {user ? (
              <button
                onClick={onEnterWorkspace}
                className="flex items-center gap-2 bg-[#6355F4] hover:bg-[#5244E0] text-white text-sm font-bold px-8 py-3.5 rounded-2xl shadow-xl shadow-purple-500/25 cursor-pointer transition-all"
              >
                Open {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleGetStarted()}
                  className="flex items-center gap-2 bg-[#6355F4] hover:bg-[#5244E0] text-white text-sm font-bold px-8 py-3.5 rounded-2xl shadow-xl shadow-purple-500/25 cursor-pointer transition-all"
                >
                  Get Started Now <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSignIn()}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 text-sm font-bold px-7 py-3.5 rounded-2xl border border-gray-200 shadow-xs cursor-pointer transition-all"
                >
                  Sign In to Workspace
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 9. Professional Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="min-[420px]:col-span-2">
              <BrandLogo variant="dark" size="md" className="mb-4" />
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
                The centralized startup incubation and cohort management SaaS platform. Coordinating founders,
                vetted mentors, and program directors from cohort kickoff to demo day.
              </p>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#6355F4]" />
                  <a href="mailto:support@startupincubator.io" className="hover:text-white transition-colors">
                    support@startupincubator.io
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#6355F4]" />
                  <span>Chennai, Tamil Nadu, India</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">Platform</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="#about" className="hover:text-white transition-colors">
                    About Platform
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Startup Tracking
                  </a>
                </li>
                <li>
                  <a href="#roles" className="hover:text-white transition-colors">
                    User Roles
                  </a>
                </li>
                <li>
                  <a href="#courses" className="hover:text-white transition-colors">
                    Courses & Learning
                  </a>
                </li>
                <li>
                  <a href="#ai-hub" className="hover:text-white transition-colors">
                    AI Incubation Suite
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">User Portals</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button
                    onClick={() => (user ? onEnterWorkspace() : handleSignIn('founder'))}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Founder Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (user ? onEnterWorkspace() : handleSignIn('mentor'))}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Mentor Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (user ? onEnterWorkspace() : handleSignIn('admin'))}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Admin Command
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (user ? onEnterWorkspace() : handleGetStarted())}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    New Registration
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">Organization</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Platform FAQ
                  </a>
                </li>
                <li>
                  <span className="text-slate-500">Security & Privacy</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© 2026 Startup Incubation Platform • Chennai, Tamil Nadu, India. All rights reserved.</p>
            <p>Designed for startup incubators, accelerators, and venture studios.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
