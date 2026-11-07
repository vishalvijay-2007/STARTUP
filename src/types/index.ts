export type UserRole = 'founder' | 'mentor' | 'admin';

export type MentorAccountStatus = 'active' | 'pending' | 'suspended' | 'rejected' | 'left';

export interface MentorOffboardingDetails {
  reason: string;
  lastWorkingDate: string;
  notes?: string;
  additionalNotes?: string;
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
  statusAfter: MentorAccountStatus;
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
  role: UserRole;
  avatar?: string;
  phone?: string;
  status: MentorAccountStatus;
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
  notificationPreferences?: NotificationPreferences;
  appearancePreferences?: AppearancePreferences;
  privacyPreferences?: PrivacyPreferences;
  activeSessions?: SessionInfo[];
  loginHistory?: LoginHistoryItem[];
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

export interface NotificationPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  startupUpdates?: boolean;
  mentorMessages?: boolean;
  meetingReminders?: boolean;
  mentorSessionReminders?: boolean;
  milestoneUpdates?: boolean;
  courseRecommendations?: boolean;
  aiAnalysisUpdates?: boolean;
  platformAnnouncements?: boolean;
  marketingAnnouncements?: boolean;
  resourceAnnouncements?: boolean;
  workspaceActivity?: boolean;
  accountAlerts?: boolean;
  importantAccountAlerts?: boolean;
  [key: string]: boolean | undefined;
}

export interface AppearancePreferences {
  theme: 'light' | 'dark' | 'system';
  themeColor: string; // hex color code
  sidebarMode: 'expanded' | 'compact' | 'auto';
  fontSize: 'small' | 'normal' | 'large';
}

export interface PrivacyPreferences {
  profileVisibility: 'workspace' | 'public' | 'mentors_only' | 'private';
  showPersonalInfo?: boolean;
  showEmail?: boolean;
  contactInfoVisibility?: boolean;
  workspaceActivityVisibility: boolean;
  allowDataSharing?: boolean;
  dataSharingAI?: boolean;
  twoFactorEnforced?: boolean;
  [key: string]: any;
}

export interface WorkspaceSettings {
  name: string;
  description: string;
  logo: string;
  defaultLandingPage: string;
  allowMemberInvites: boolean;
  updatedAt?: string;
}

export interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  current?: boolean;
}

export interface LoginHistoryItem {
  id: string;
  timestamp: string;
  ip: string;
  device: string;
  location: string;
  status: 'Success' | 'Failed';
}

