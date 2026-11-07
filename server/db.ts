import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export function hashPassword(password: string): string {
  const salt = 'incubator_salt_2026';
  return crypto.createHash('sha256').update(salt + password).digest('hex');
}

export function verifyPassword(password: string, hash?: string): boolean {
  if (!hash) return true;
  return hashPassword(password) === hash;
}

export interface MentorOffboardingDetails {
  reason: string;
  lastWorkingDate: string;
  notes?: string;
  offboardedAt: string;
  offboardedBy: string;
  reassignedToMentorId?: string;
  reassignedToMentorName?: string;
  previousStartups?: { id: string; name: string; industry?: string }[];
  previousCohorts?: { id: string; name: string; code?: string }[];
  previousUpcomingSessionsCount?: number;
}

export interface MentorAuditHistoryItem {
  id: string;
  action: 'OFFBOARDED' | 'REACTIVATED' | 'SUSPENDED' | 'APPROVED' | 'EDITED' | 'REASSIGNED';
  statusAfter: 'active' | 'pending' | 'suspended' | 'rejected' | 'left';
  reason?: string;
  lastWorkingDate?: string;
  notes?: string;
  reassignedToMentorName?: string;
  performedBy: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  passwordHash?: string;
  role: 'founder' | 'mentor' | 'admin';
  avatar?: string;
  phone?: string;
  status: 'active' | 'pending' | 'suspended' | 'rejected' | 'left';
  bio?: string;
  company?: string;
  title?: string;
  expertise?: string[];
  yearsExperience?: number;
  linkedIn?: string;
  joiningDate?: string;
  assignedCohorts?: string[];
  offboardingDetails?: MentorOffboardingDetails;
  offboardingHistory?: MentorAuditHistoryItem[];
  sessionVersion?: number;
  startupName?: string;
  startupIndustry?: string;
  rejectionReason?: string;
  lastLogin?: string;
  language?: string;
  timezone?: string;
  twoFactorEnabled?: boolean;
  notificationPreferences?: any;
  appearancePreferences?: any;
  privacyPreferences?: any;
  workspacePreferences?: any;
  activeSessions?: any[];
  loginHistory?: any[];
  resetToken?: string;
  resetTokenExpires?: string;
  createdAt: string;
}

export interface MentorApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  title: string;
  company: string;
  yearsExperience: number;
  expertise: string[];
  qualifications?: string;
  bio?: string;
  linkedIn?: string;
  avatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Startup {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo?: string;
  industry: string;
  stage: 'Ideation' | 'MVP' | 'Early Traction' | 'Scaling' | 'Series A';
  businessModel: 'B2B SaaS' | 'B2C' | 'Marketplace' | 'DeepTech' | 'Fintech' | 'Healthtech';
  founderId: string;
  founderName: string;
  founderEmail: string;
  teamMembers: { name: string; role: string; email?: string }[];
  cohortId?: string;
  cohortName?: string;
  mentorId?: string;
  mentorName?: string;
  fundingRequired: number;
  fundingRaised: number;
  monthlyRevenue: number;
  progress: number; // 0 - 100
  website?: string;
  pitchDeckUrl?: string;
  status: 'active' | 'graduated' | 'inactive';
  createdAt: string;
}

export interface Cohort {
  id: string;
  name: string;
  code: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Upcoming' | 'Completed';
  targetFunding: number;
  startupsCount: number;
  mentorsCount: number;
  createdAt: string;
}

export interface MentorSession {
  id: string;
  startupId: string;
  startupName: string;
  mentorId: string;
  mentorName: string;
  title: string;
  agenda: string;
  date: string;
  time: string;
  durationMinutes: number;
  meetingLink?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
  feedback?: string;
  rating?: number;
  actionItems?: string[];
  createdAt: string;
}

export interface Milestone {
  id: string;
  startupId: string;
  startupName: string;
  title: string;
  description: string;
  category: 'Product' | 'Fundraising' | 'Traction' | 'Legal' | 'Hiring';
  weight: number; // 1 - 10
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  completedAt?: string;
  assignedTo?: string;
  createdAt: string;
}

export interface Resource {
  id: string;
  name: string;
  category: 'Cloud Credits' | 'Legal & IP' | 'Coworking & Labs' | 'Prototyping' | 'Marketing & PR';
  provider: string;
  description: string;
  valueAmount: number;
  totalUnits: number;
  availableUnits: number;
  eligibility: string;
  accessUrl?: string;
  createdAt: string;
}

export interface ResourceRequest {
  id: string;
  resourceId: string;
  resourceName: string;
  startupId: string;
  startupName: string;
  founderId: string;
  founderName: string;
  quantity: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  decisionNotes?: string;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  description: string;
  durationHours: number;
  modulesCount: number;
  instructor: string;
  fileName?: string;
  enrolledCount: number;
  status: 'Published' | 'Draft';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'all' | 'unread' | 'important' | 'mentorship' | 'milestones' | 'resources' | 'system' | 'approval';
  title: string;
  message: string;
  isRead: boolean;
  isImportant: boolean;
  timestamp: string;
  link?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface CourseRecommendationItem {
  id: string;
  title: string;
  category: 'Technical' | 'Entrepreneurship' | 'Business Management' | 'Marketing & Sales' | 'Finance & Fundraising' | 'Product Development' | 'Leadership';
  description?: string;
  whyRecommended: string;
  skillsLearned: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  objectives: string[];
  suggestedNextSteps?: string[];
  platforms: string[];
  url: string;
  saved?: boolean;
}

export interface CourseRecommendationRun {
  id: string;
  founderId: string;
  founderName: string;
  startupName?: string;
  industry?: string;
  stage?: string;
  skillsGap?: string;
  interests?: string;
  experience?: string;
  learningGoals?: string;
  recommendations: CourseRecommendationItem[];
  modelUsed?: string;
  providerUsed?: string;
  createdAt: string;
}

export interface EnrolledCourse {
  id: string;
  userId: string;
  title: string;
  category: string;
  whyRecommended?: string;
  skillsLearned?: string[];
  difficulty?: string;
  duration?: string;
  objectives?: string[];
  platforms?: string[];
  url?: string;
  completed: boolean;
  progress: number; // 0 - 100
  enrolledAt: string;
  completedAt?: string;
}

export interface AIStartupAnalysisRecord {
  id: string;
  founderId: string;
  startupId: string;
  startupName: string;
  industry?: string;
  stage?: string;
  prompt: string;
  modelUsed?: string;
  providerUsed?: string;
  overview: {
    summary: string;
    valueProposition: string;
    stageReadiness: string;
    readinessScore: number; // 1 - 10
  };
  businessAnalysis: {
    businessModel: string;
    revenueOpportunities: string[];
    swot: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
  };
  marketAnalysis: {
    targetMarket: string;
    competitorAnalysis: string;
    marketPositioning: string;
    customerAcquisition: string[];
  };
  productDevelopment: {
    mvpRecommendations: string;
    roadmap: string[];
    featurePrioritization: string[];
    uxImprovements: string[];
  };
  businessGrowth: {
    gtmStrategy: string;
    partnerships: string[];
    scalingRecommendations: string[];
  };
  fundingGuidance: {
    investmentReadiness: string;
    fundingOptions: string[];
    financialPlanning: string;
    targetValuationOrAsk: string;
  };
  actionPlan: {
    immediatePriorities: string[]; // next 7 days
    shortTermGoals: string[]; // next 30 days
    midTermGoals: string[]; // next 90 days
    kpis: string[]; // Key Performance Indicators
  };
  fullMarkdown: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  startups: Startup[];
  cohorts: Cohort[];
  sessions: MentorSession[];
  milestones: Milestone[];
  resources: Resource[];
  resourceRequests: ResourceRequest[];
  courses: Course[];
  notifications: NotificationItem[];
  activityLogs: ActivityLog[];
  courseRecommendations: CourseRecommendationRun[];
  userEnrolledCourses: EnrolledCourse[];
  aiStartupAnalyses: AIStartupAnalysisRecord[];
  mentorApplications?: MentorApplication[];
  workspaceSettings?: {
    name: string;
    description: string;
    logo: string;
    defaultLandingPage: string;
    allowMemberInvites: boolean;
    updatedAt: string;
  };
}

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(process.cwd(), 'data');
const DB_FILE = process.env.DB_FILE ? path.resolve(process.env.DB_FILE) : path.join(DATA_DIR, 'db.json');

function getInitialData(): DatabaseSchema {
  return {
    courseRecommendations: [],
    userEnrolledCourses: [],
    aiStartupAnalyses: [],
    users: [
      {
        id: 'usr_founder_vishal',
        name: 'vishal',
        email: 'vishalvijay135@gmail.com',
        username: 'vijaynisha123',
        passwordHash: hashPassword('password123'),
        role: 'founder',
        avatar: '/assets/default-avatar.png',
        status: 'active',
        bio: 'Founder building next-gen AI startup tools & healthcare diagnostics.',
        title: 'Founder & CEO',
        company: 'PulseAI Diagnostics',
        createdAt: '2026-01-10T10:00:00Z',
      },
      {
        id: 'usr_admin_1',
        name: 'Incubator Director',
        email: 'admin@startupincubator.io',
        username: 'admin',
        passwordHash: hashPassword('password123'),
        role: 'admin',
        avatar: '/assets/default-avatar.png',
        status: 'active',
        bio: 'Managing Partner & Program Director at Global Venture Studio.',
        title: 'Program Director',
        company: 'Apex Incubator',
        createdAt: '2025-11-01T08:00:00Z',
      },
      {
        id: 'usr_mentor_sarah',
        name: 'Dr. Sarah Chen',
        email: 'sarah.chen@stanford.edu',
        username: 'sarahchen',
        passwordHash: hashPassword('password123'),
        role: 'mentor',
        avatar: '/assets/default-avatar.png',
        phone: '+91 98201 44510',
        status: 'active',
        bio: 'Ex-VP AI Engineering at Google Cloud, Venture Partner, 15+ years scaling B2B & DeepTech SaaS.',
        title: 'Venture Partner & Tech Mentor',
        company: 'Horizon Ventures',
        expertise: ['B2B SaaS', 'AI & Machine Learning', 'Product Strategy', 'Series A Pitching'],
        yearsExperience: 16,
        linkedIn: 'https://linkedin.com/in/sarahchen-ai',
        joiningDate: '2025-12-01T09:00:00Z',
        assignedCohorts: ['coh_w26', 'coh_s26'],
        offboardingHistory: [
          {
            id: 'aud_sarah_1',
            action: 'APPROVED',
            statusAfter: 'active',
            notes: 'Onboarded as Lead Technical & AI Venture Partner.',
            performedBy: 'Incubator Director',
            timestamp: '2025-12-01T09:00:00Z',
          },
        ],
        createdAt: '2025-12-01T09:00:00Z',
      },
      {
        id: 'usr_mentor_marcus',
        name: 'Marcus Aurelius',
        email: 'marcus.a@ventures.co',
        username: 'marcus_a',
        passwordHash: hashPassword('password123'),
        role: 'mentor',
        avatar: '/assets/default-avatar.png',
        phone: '+91 98112 77890',
        status: 'pending',
        bio: 'FinTech angel investor & former founder of ReguFlow (acquired 2024). Specializing in compliance and enterprise banking.',
        title: 'Angel Investor & Fintech Advisor',
        company: 'Aurelius Capital',
        expertise: ['FinTech', 'LegalTech', 'Fundraising', 'Go-To-Market'],
        yearsExperience: 12,
        linkedIn: 'https://linkedin.com/in/marcusaurelius-ventures',
        joiningDate: '2026-11-01T14:20:00Z',
        assignedCohorts: [],
        createdAt: '2026-11-01T14:20:00Z',
      },
      {
        id: 'usr_mentor_elena',
        name: 'Elena Rostova',
        email: 'elena@growthmatrix.io',
        username: 'elenar',
        passwordHash: hashPassword('password123'),
        role: 'mentor',
        avatar: '/assets/default-avatar.png',
        phone: '+91 97400 88219',
        status: 'active',
        bio: 'Growth Marketing Architect, helped 24+ startups reach $1M+ ARR with zero paid ads.',
        title: 'Head of Growth',
        company: 'Growth Matrix',
        expertise: ['Product-Led Growth', 'B2B Sales', 'Customer Acquisition', 'Metrics & CAC'],
        yearsExperience: 10,
        linkedIn: 'https://linkedin.com/in/elenarostova',
        joiningDate: '2026-01-05T11:00:00Z',
        assignedCohorts: ['coh_w26'],
        offboardingHistory: [
          {
            id: 'aud_elena_1',
            action: 'APPROVED',
            statusAfter: 'active',
            notes: 'Approved for GTM & Enterprise Sales mentorship.',
            performedBy: 'Incubator Director',
            timestamp: '2026-01-05T11:00:00Z',
          },
        ],
        createdAt: '2026-01-05T11:00:00Z',
      },
      {
        id: 'usr_mentor_rajesh',
        name: 'Dr. Rajesh Iyer',
        email: 'rajesh.iyer@deeptechlabs.in',
        username: 'rajeshiyer',
        passwordHash: hashPassword('password123'),
        role: 'mentor',
        avatar: '/assets/default-avatar.png',
        phone: '+91 98450 61230',
        status: 'left',
        bio: 'Former Principal Cloud Architect & DeepTech Advisor. Guided 14 cohort startups through seed architecture reviews.',
        title: 'Principal Cloud & Systems Advisor',
        company: 'DeepTech Labs India',
        expertise: ['Cloud Architecture', 'Distributed Systems', 'DevSecOps', 'Edge Computing'],
        yearsExperience: 18,
        linkedIn: 'https://linkedin.com/in/rajeshiyer-cloud',
        joiningDate: '2025-07-10T09:00:00Z',
        assignedCohorts: [],
        offboardingDetails: {
          reason: 'Transitioned to full-time Chief Technology Officer role at a Series C portfolio company.',
          lastWorkingDate: '2026-09-30',
          notes: 'Completed full handover of PulseAI Diagnostics technical architecture mentorship to Dr. Sarah Chen. Eligible for future reactivation as guest partner.',
          offboardedAt: '2026-09-30T17:30:00Z',
          offboardedBy: 'Incubator Director',
          reassignedToMentorId: 'usr_mentor_sarah',
          reassignedToMentorName: 'Dr. Sarah Chen',
          previousStartups: [{ id: 'stp_1', name: 'PulseAI Diagnostics', industry: 'HealthTech & AI' }],
          previousCohorts: [{ id: 'coh_f25', name: 'Fall 2025 Seed Sprint Batch', code: 'F25-SPRINT' }],
          previousUpcomingSessionsCount: 1,
        },
        offboardingHistory: [
          {
            id: 'aud_rajesh_2',
            action: 'OFFBOARDED',
            statusAfter: 'left',
            reason: 'Transitioned to full-time Chief Technology Officer role at a Series C portfolio company.',
            lastWorkingDate: '2026-09-30',
            notes: 'Completed full handover of PulseAI Diagnostics technical architecture mentorship to Dr. Sarah Chen.',
            reassignedToMentorName: 'Dr. Sarah Chen',
            performedBy: 'Incubator Director',
            timestamp: '2026-09-30T17:30:00Z',
          },
          {
            id: 'aud_rajesh_1',
            action: 'APPROVED',
            statusAfter: 'active',
            notes: 'Joined Fall 2025 Seed Sprint Batch advisory board.',
            performedBy: 'Incubator Director',
            timestamp: '2025-07-10T09:00:00Z',
          },
        ],
        createdAt: '2025-07-10T09:00:00Z',
      },
      {
        id: 'usr_mentor_vikram',
        name: 'Vikramaditya Rao',
        email: 'vikram.rao@cybervance.in',
        username: 'vikramrao',
        passwordHash: hashPassword('password123'),
        role: 'mentor',
        avatar: '/assets/default-avatar.png',
        phone: '+91 99001 33421',
        status: 'suspended',
        bio: 'Cybersecurity & Enterprise Compliance Advisor for SaaS and FinTech ventures.',
        title: 'Partner, Security & Compliance',
        company: 'CyberVance Advisory',
        expertise: ['Cybersecurity', 'SOC 2 & ISO 27001', 'Enterprise Risk', 'Cloud Governance'],
        yearsExperience: 14,
        linkedIn: 'https://linkedin.com/in/vikramadityarao',
        joiningDate: '2026-02-15T10:00:00Z',
        assignedCohorts: [],
        offboardingHistory: [
          {
            id: 'aud_vikram_2',
            action: 'SUSPENDED',
            statusAfter: 'suspended',
            reason: 'Temporarily paused due to conflict-of-interest review during external fund audit.',
            performedBy: 'Incubator Director',
            timestamp: '2026-10-15T11:00:00Z',
          },
          {
            id: 'aud_vikram_1',
            action: 'APPROVED',
            statusAfter: 'active',
            notes: 'Approved as Security & Compliance Advisor.',
            performedBy: 'Incubator Director',
            timestamp: '2026-02-15T10:00:00Z',
          },
        ],
        createdAt: '2026-02-15T10:00:00Z',
      }
    ],
    startups: [
      {
        id: 'stp_1',
        name: 'PulseAI Diagnostics',
        tagline: 'Real-time multi-modal medical diagnostics powered by edge AI',
        description: 'PulseAI builds ultra-fast edge inference models for clinics and ICUs to detect cardio-respiratory failure 4 hours in advance with 96% precision.',
        logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=150&auto=format&fit=crop&q=80',
        industry: 'HealthTech & AI',
        stage: 'Early Traction',
        businessModel: 'B2B SaaS',
        founderId: 'usr_founder_vishal',
        founderName: 'vishal',
        founderEmail: 'vishalvijay135@gmail.com',
        teamMembers: [
          { name: 'Vishal Vijay', role: 'Founder & CEO', email: 'vishalvijay135@gmail.com' },
          { name: 'Dr. Michael Vance', role: 'Chief Medical Officer' },
          { name: 'Priya Sharma', role: 'Lead ML Architect' }
        ],
        cohortId: 'coh_w26',
        cohortName: 'Winter 2026 Tech Batch',
        mentorId: 'usr_mentor_sarah',
        mentorName: 'Dr. Sarah Chen',
        fundingRequired: 750000,
        fundingRaised: 250000,
        monthlyRevenue: 18500,
        progress: 68,
        website: 'https://pulseai.health',
        pitchDeckUrl: 'https://pulseai.health/deck.pdf',
        status: 'active',
        createdAt: '2026-01-15T12:00:00Z',
      },
      {
        id: 'stp_2',
        name: 'GreenLogix Supply',
        tagline: 'Autonomous zero-carbon logistics routing for maritime fleets',
        description: 'Using ocean current algorithms and dynamic weather routing to reduce bunker fuel consumption and emissions by up to 22% for commercial ships.',
        logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop&q=80',
        industry: 'ClimateTech & Supply Chain',
        stage: 'MVP',
        businessModel: 'B2B SaaS',
        founderId: 'usr_founder_vishal',
        founderName: 'vishal',
        founderEmail: 'vishalvijay135@gmail.com',
        teamMembers: [
          { name: 'Vishal Vijay', role: 'Founder' },
          { name: 'Liam Zhang', role: 'Naval Systems Lead' }
        ],
        cohortId: 'coh_w26',
        cohortName: 'Winter 2026 Tech Batch',
        mentorId: 'usr_mentor_elena',
        mentorName: 'Elena Rostova',
        fundingRequired: 500000,
        fundingRaised: 120000,
        monthlyRevenue: 6200,
        progress: 45,
        website: 'https://greenlogix.io',
        pitchDeckUrl: 'https://greenlogix.io/pitch.pdf',
        status: 'active',
        createdAt: '2026-02-01T09:30:00Z',
      }
    ],
    cohorts: [
      {
        id: 'coh_w26',
        name: 'Winter 2026 Tech Batch',
        code: 'W26-TECH',
        description: 'Intensive 16-week deep-tech and enterprise SaaS incubation cohort focused on product validation, enterprise pilot contracts, and seed round preparation.',
        startDate: '2026-01-05',
        endDate: '2026-05-15',
        status: 'Active',
        targetFunding: 5000000,
        startupsCount: 8,
        mentorsCount: 6,
        createdAt: '2025-12-01T08:00:00Z',
      },
      {
        id: 'coh_s26',
        name: 'Spring 2026 AI Frontier Cohort',
        code: 'S26-AIF',
        description: 'Flagship incubation program specifically dedicated to generative AI foundation models, multi-agent workflows, and AI infrastructure startups.',
        startDate: '2026-04-01',
        endDate: '2026-08-30',
        status: 'Upcoming',
        targetFunding: 8000000,
        startupsCount: 4,
        mentorsCount: 5,
        createdAt: '2026-02-10T08:00:00Z',
      },
      {
        id: 'coh_f25',
        name: 'Fall 2025 Seed Sprint Batch',
        code: 'F25-SPRINT',
        description: 'Successfully graduated batch of 12 startups; raised a combined $9.4M in institutional seed capital.',
        startDate: '2025-08-15',
        endDate: '2025-12-20',
        status: 'Completed',
        targetFunding: 6000000,
        startupsCount: 12,
        mentorsCount: 9,
        createdAt: '2025-07-01T08:00:00Z',
      }
    ],
    sessions: [
      {
        id: 'ses_1',
        startupId: 'stp_1',
        startupName: 'PulseAI Diagnostics',
        mentorId: 'usr_mentor_sarah',
        mentorName: 'Dr. Sarah Chen',
        title: 'Regulatory & FDA 510(k) Roadmap Strategy',
        agenda: 'Review medical clinical trial protocol, discuss software as medical device (SaMD) documentation and prep for FDA pre-submission Q-sub meeting.',
        date: '2026-11-06',
        time: '14:00',
        durationMinutes: 45,
        meetingLink: 'https://meet.google.com/xyz-qwer-vnm',
        status: 'Scheduled',
        notes: 'Pre-read materials sent to mentor: clinical trial summary v2.1 and risk mitigation matrix.',
        createdAt: '2026-11-01T09:00:00Z',
      },
      {
        id: 'ses_2',
        startupId: 'stp_1',
        startupName: 'PulseAI Diagnostics',
        mentorId: 'usr_mentor_sarah',
        mentorName: 'Dr. Sarah Chen',
        title: 'Series Seed Pitch Deck & Investor Term Sheet Review',
        agenda: 'Reviewed investor deck slide-by-slide. Focused on unit economics, TAM justification, and customer pilot conversion pipeline.',
        date: '2026-10-24',
        time: '11:00',
        durationMinutes: 60,
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        status: 'Completed',
        notes: 'Strong presentation. Recommended clarifying the reimbursement CPT code pathway and sharpening competitor matrix.',
        feedback: 'Vishal has tremendous domain command. Team is moving fast. Ready for Tier 1 healthtech angels.',
        rating: 5,
        actionItems: ['Update CPT code slide', 'Refine pilot contract terms with Memorial Hospital', 'Send data room invite to mentor'],
        createdAt: '2026-10-20T10:00:00Z',
      },
      {
        id: 'ses_3',
        startupId: 'stp_2',
        startupName: 'GreenLogix Supply',
        mentorId: 'usr_mentor_elena',
        mentorName: 'Elena Rostova',
        title: 'Maritime Pilot Pipeline & Enterprise Cold Outreach',
        agenda: 'Define ideal customer profile (ICP) for cargo ship charterers in Northern Europe and test response rates on personalized LinkedIn outreach.',
        date: '2026-11-10',
        time: '16:00',
        durationMinutes: 45,
        meetingLink: 'https://meet.google.com/iop-jklm-ert',
        status: 'Scheduled',
        notes: 'Reviewing 10 enterprise pilot targets and draft pitch deck.',
        createdAt: '2026-11-02T08:00:00Z',
      },
      {
        id: 'ses_hist_1',
        startupId: 'stp_1',
        startupName: 'PulseAI Diagnostics',
        mentorId: 'usr_mentor_rajesh',
        mentorName: 'Dr. Rajesh Iyer',
        title: 'Edge AI Telemetry & Kubernetes Cluster Hardening',
        agenda: 'Evaluated zero-trust hospital edge gateway architecture and latency benchmarks for ICU telemetry pipelines.',
        date: '2026-08-18',
        time: '15:00',
        durationMinutes: 60,
        meetingLink: 'https://meet.google.com/raj-edge-k8s',
        status: 'Completed',
        notes: 'Architecture validated for sub-25ms inference latency across 3 hospital nodes.',
        feedback: 'Outstanding engineering rigor. The edge failover mechanism is production-ready for clinical environments.',
        rating: 5,
        actionItems: ['Document failover SLA for hospital IT', 'Hand over architecture notes to Dr. Sarah Chen'],
        createdAt: '2026-08-12T10:00:00Z',
      }
    ],
    milestones: [
      {
        id: 'mls_1',
        startupId: 'stp_1',
        startupName: 'PulseAI Diagnostics',
        title: 'Deploy Edge Inference Engine to 3 Pilot Clinics',
        description: 'Install low-latency edge inference appliances at partner hospital wards and connect live telemetry feed.',
        category: 'Product',
        weight: 9,
        dueDate: '2026-11-20',
        status: 'in-progress',
        createdAt: '2026-01-20T10:00:00Z',
      },
      {
        id: 'mls_2',
        startupId: 'stp_1',
        startupName: 'PulseAI Diagnostics',
        title: 'HIPAA & SOC 2 Type 1 Compliance Certification',
        description: 'Complete third-party security audit and obtain clean SOC 2 Type 1 report for enterprise healthcare customers.',
        category: 'Legal',
        weight: 8,
        dueDate: '2026-10-30',
        status: 'completed',
        completedAt: '2026-10-28T16:00:00Z',
        createdAt: '2026-01-20T10:00:00Z',
      },
      {
        id: 'mls_3',
        startupId: 'stp_1',
        startupName: 'PulseAI Diagnostics',
        title: 'Close $750k Seed Round Lead Investor',
        description: 'Secure signed term sheet for minimum $500k from institutional lead VC.',
        category: 'Fundraising',
        weight: 10,
        dueDate: '2026-12-15',
        status: 'in-progress',
        createdAt: '2026-01-20T10:00:00Z',
      },
      {
        id: 'mls_4',
        startupId: 'stp_2',
        startupName: 'GreenLogix Supply',
        title: 'Complete Rotterdam Sea Harbor Algorithm Trial',
        description: 'Simulate 12 live vessel voyages across North Sea to validate real-world fuel reduction of 15% minimum.',
        category: 'Traction',
        weight: 7,
        dueDate: '2026-11-25',
        status: 'pending',
        createdAt: '2026-02-10T10:00:00Z',
      }
    ],
    resources: [
      {
        id: 'res_1',
        name: 'Google Cloud for Startups ($100k Credits)',
        category: 'Cloud Credits',
        provider: 'Google Cloud Platform',
        description: 'Up to $100,000 in GCP cloud credits over 2 years, including Gemini API access, BigQuery, Vertex AI, and technical mentorship.',
        valueAmount: 100000,
        totalUnits: 25,
        availableUnits: 14,
        eligibility: 'All active incubator startups in seed or pre-seed stage with active deployment.',
        accessUrl: 'https://cloud.google.com/startup',
        createdAt: '2025-11-01T08:00:00Z',
      },
      {
        id: 'res_2',
        name: 'Enterprise Legal Formation & IP Advisory Pack',
        category: 'Legal & IP',
        provider: 'Gunderson Dettmer LLP',
        description: 'Free Delaware C-Corp incorporation, founder IP assignment agreements, stock vesting templates, and 3 hours of patent attorney counsel.',
        valueAmount: 8500,
        totalUnits: 30,
        availableUnits: 18,
        eligibility: 'Founders without prior institutional incorporation.',
        accessUrl: 'https://gunder.com',
        createdAt: '2025-11-01T08:00:00Z',
      },
      {
        id: 'res_3',
        name: 'Dedicated Private Coworking Desks & Lab Access',
        category: 'Coworking & Labs',
        provider: 'Founders Hub Downtown',
        description: '4 dedicated ergonomic desks, high-speed fiber internet, private conference rooms, 3D printers, and prototyping lab equipment.',
        valueAmount: 4800,
        totalUnits: 15,
        availableUnits: 6,
        eligibility: 'Active cohort participants located in metropolitan area.',
        createdAt: '2025-11-01T08:00:00Z',
      },
      {
        id: 'res_4',
        name: 'Stripe Atlas & $20,000 Fee-Free Processing',
        category: 'Cloud Credits',
        provider: 'Stripe',
        description: 'Waived incorporation fee, bank account setup, and zero processing fees on first $20,000 in gross transaction volume.',
        valueAmount: 2000,
        totalUnits: 50,
        availableUnits: 38,
        eligibility: 'New startups accepting online card payments.',
        createdAt: '2025-11-01T08:00:00Z',
      }
    ],
    resourceRequests: [
      {
        id: 'rq_1',
        resourceId: 'res_1',
        resourceName: 'Google Cloud for Startups ($100k Credits)',
        startupId: 'stp_1',
        startupName: 'PulseAI Diagnostics',
        founderId: 'usr_founder_vishal',
        founderName: 'vishal',
        quantity: 1,
        reason: 'Scaling our Gemini 3.8 Flash fine-tuning and hosting high-throughput clinical model endpoints on Cloud Run.',
        status: 'approved',
        requestedAt: '2026-01-22T14:00:00Z',
        decisionNotes: 'Approved by Incubator Director. Cloud voucher codes dispatched.',
      }
    ],
    courses: [
      {
        id: 'crs_1',
        title: 'AI for Founders: From Zero to Scaled Product',
        category: 'Technology',
        description: 'A hands-on, practical curriculum covering model selection, prompt architecture, server-side security, cost economics, and building AI moat.',
        durationHours: 8,
        modulesCount: 6,
        instructor: 'Dr. Sarah Chen',
        enrolledCount: 18,
        status: 'Published',
        createdAt: '2026-01-12T10:00:00Z',
      },
      {
        id: 'crs_2',
        title: 'Mastering the Seed Round Pitch Deck',
        category: 'Fundraising',
        description: 'Learn the exact 12-slide formula that secured $45M+ in venture capital. Includes financial modeling templates and real partner meeting recordings.',
        durationHours: 6,
        modulesCount: 5,
        instructor: 'Incubator Director',
        enrolledCount: 24,
        status: 'Published',
        createdAt: '2026-01-20T10:00:00Z',
      },
      {
        id: 'crs_3',
        title: 'Enterprise B2B Sales & Pilot Contracting',
        category: 'Go-to-Market',
        description: 'How early stage founders can close $50k-$250k enterprise pilots with healthcare, finance, and industrial customers without an enterprise sales team.',
        durationHours: 5,
        modulesCount: 4,
        instructor: 'Elena Rostova',
        enrolledCount: 14,
        status: 'Published',
        createdAt: '2026-02-05T10:00:00Z',
      }
    ],
    notifications: [
      {
        id: 'notif_1',
        userId: 'usr_founder_vishal',
        type: 'mentorship',
        title: 'Upcoming Mentoring Session with Dr. Sarah Chen',
        message: 'Your strategy session "Regulatory & FDA 510(k) Roadmap" is scheduled for Nov 6, 2026 at 2:00 PM.',
        isRead: false,
        isImportant: true,
        timestamp: '2026-11-02T04:15:00Z',
      },
      {
        id: 'notif_2',
        userId: 'usr_founder_vishal',
        type: 'resources',
        title: 'Resource Request Approved: Google Cloud Credits',
        message: 'Your allocation of $100,000 in GCP credits has been officially approved. Check your inbox for the activation tokens.',
        isRead: false,
        isImportant: true,
        timestamp: '2026-11-01T15:30:00Z',
      },
      {
        id: 'notif_3',
        userId: 'usr_founder_vishal',
        type: 'milestones',
        title: 'Milestone Completed: HIPAA & SOC 2 Certification',
        message: 'Congratulations! Milestone "HIPAA & SOC 2 Type 1 Compliance" was marked completed. Startup progress increased to 68%.',
        isRead: true,
        isImportant: false,
        timestamp: '2026-10-28T16:05:00Z',
      },
      {
        id: 'notif_4',
        userId: 'usr_admin_1',
        type: 'approval',
        title: 'New Mentor Application: Marcus Aurelius',
        message: 'Marcus Aurelius (Fintech investor) submitted a mentor registration request awaiting your approval.',
        isRead: false,
        isImportant: true,
        timestamp: '2026-11-01T14:21:00Z',
      }
    ],
    activityLogs: [
      {
        id: 'act_1',
        userId: 'usr_founder_vishal',
        userName: 'vishal',
        role: 'Founder',
        action: 'Updated Milestone',
        details: 'Completed HIPAA & SOC 2 Type 1 Certification',
        timestamp: '2026-10-28T16:00:00Z',
      },
      {
        id: 'act_2',
        userId: 'usr_admin_1',
        userName: 'Incubator Director',
        role: 'Admin',
        action: 'Resource Approved',
        details: 'Approved $100k GCP credits for PulseAI Diagnostics',
        timestamp: '2026-10-29T10:15:00Z',
      },
      {
        id: 'act_3',
        userId: 'usr_mentor_sarah',
        userName: 'Dr. Sarah Chen',
        role: 'Mentor',
        action: 'Submitted Feedback',
        details: 'Provided session feedback & evaluation for PulseAI Diagnostics',
        timestamp: '2026-10-24T12:05:00Z',
      }
    ]
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = getInitialData();
    this.load();
  }

  private load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        try {
          this.data = JSON.parse(raw);
        } catch {
          this.data = getInitialData();
        }

        const initial = getInitialData();

        // Migrate any legacy Unsplash avatars to default-avatar.png and ensure mentor offboarding fields
        if (this.data.users) {
          for (const u of this.data.users) {
            if (u.avatar && u.avatar.includes('images.unsplash.com/photo-')) {
              u.avatar = '/assets/default-avatar.png';
            }
            if (u.role === 'mentor') {
              if (!u.joiningDate) u.joiningDate = u.createdAt;
              if (!u.phone) u.phone = '+91 98201 44510';
              if (!u.assignedCohorts) {
                u.assignedCohorts = u.status === 'active' ? ['coh_w26'] : [];
              }
              if (!u.offboardingHistory) {
                u.offboardingHistory = [
                  {
                    id: 'aud_' + u.id,
                    action: 'APPROVED',
                    statusAfter: u.status,
                    notes: 'Initial mentor record.',
                    performedBy: 'Incubator Director',
                    timestamp: u.createdAt,
                  },
                ];
              }
            }
          }

          // Ensure seed offboarded mentor (Dr. Rajesh Iyer) and suspended mentor (Vikramaditya Rao) exist in existing DB
          for (const seedMentor of initial.users.filter((u) => u.id === 'usr_mentor_rajesh' || u.id === 'usr_mentor_vikram')) {
            if (!this.data.users.some((u) => u.id === seedMentor.id)) {
              this.data.users.push(seedMentor);
            }
          }
        }

        if (this.data.sessions) {
          for (const seedSession of initial.sessions.filter((s) => s.id === 'ses_hist_1')) {
            if (!this.data.sessions.some((s) => s.id === seedSession.id)) {
              this.data.sessions.push(seedSession);
            }
          }
        }

        if (!this.data.courseRecommendations) this.data.courseRecommendations = [];
        if (!this.data.userEnrolledCourses) this.data.userEnrolledCourses = [];
        if (!this.data.aiStartupAnalyses) this.data.aiStartupAnalyses = [];
        if (!this.data.mentorApplications) {
          this.data.mentorApplications = [];
          const pendingMentors = (this.data.users || []).filter((u) => u.role === 'mentor' && u.status === 'pending');
          for (const m of pendingMentors) {
            this.data.mentorApplications.push({
              id: 'app_' + m.id,
              userId: m.id,
              name: m.name,
              email: m.email,
              phone: m.phone || '+91 98765 43210',
              title: m.title || 'Senior Industry Advisor',
              company: m.company || 'Venture Advisory',
              yearsExperience: m.yearsExperience || 8,
              expertise: m.expertise || ['B2B SaaS', 'Scaling', 'Fundraising'],
              qualifications: 'MBA, 8+ years executive startup coaching & venture leadership',
              bio: m.bio || 'Advising early-stage founders on product-market fit and revenue acceleration.',
              linkedIn: m.linkedIn || 'https://linkedin.com/in/' + m.username,
              avatar: m.avatar || '/assets/default-avatar.png',
              status: 'pending',
              createdAt: m.createdAt || new Date().toISOString(),
            });
          }
          this.save();
        } else {
          for (const a of this.data.mentorApplications) {
            if (a.avatar && a.avatar.includes('images.unsplash.com/photo-')) {
              a.avatar = '/assets/default-avatar.png';
            }
          }
        }
        this.save();
      }
    } catch (err) {
      console.error('Failed to load database from file, using initial data', err);
      this.data = getInitialData();
      this.save();
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file', err);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }
}

export const db = new Database();
