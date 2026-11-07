import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  Code,
  Copy,
  Check,
  Download,
  Terminal,
  ShieldCheck,
  Server,
  Layers,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EndpointDoc {
  id: string;
  category: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  authRequired: boolean;
  allowedRoles: string[];
  description: string;
  headers: Record<string, string>;
  requestBody?: any;
  statusCodes: { code: number; label: string; desc: string }[];
  responseExample: any;
  bruFileName: string;
}

const API_ENDPOINTS: EndpointDoc[] = [
  // 01 - Authentication
  {
    id: 'auth-login',
    category: 'Authentication',
    name: 'User Login',
    method: 'POST',
    endpoint: '/api/auth/login',
    authRequired: false,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'Authenticate an existing user with email/username and password. Validates role permissions and status.',
    headers: { 'Content-Type': 'application/json' },
    requestBody: {
      username: 'vishal1232@gmail.com',
      password: 'Password123!',
      role: 'founder'
    },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'Authentication successful. Returns user profile and auth token.' },
      { code: 400, label: 'Bad Request', desc: 'Missing username or password fields.' },
      { code: 401, label: 'Unauthorized', desc: 'Invalid credentials provided.' },
      { code: 403, label: 'Forbidden', desc: 'Account pending mentor approval or suspended by Admin.' }
    ],
    responseExample: {
      success: true,
      user: {
        id: 'usr_founder_01',
        name: 'Vishal Kumar',
        email: 'vishal1232@gmail.com',
        role: 'founder',
        status: 'active',
        token: 'jwt_sample_token_founder'
      }
    },
    bruFileName: '01-Authentication/Login.bru'
  },
  {
    id: 'auth-register',
    category: 'Authentication',
    name: 'User Registration',
    method: 'POST',
    endpoint: '/api/auth/register',
    authRequired: false,
    allowedRoles: ['Guest'],
    description: 'Register a new Founder or Mentor account in the database.',
    headers: { 'Content-Type': 'application/json' },
    requestBody: {
      name: 'Aditi Sharma',
      email: 'aditi.sharma@example.in',
      password: 'Password123!',
      role: 'founder',
      startupName: 'AgroNext Dynamics',
      industry: 'AgriTech',
      phone: '+91 98765 43210'
    },
    statusCodes: [
      { code: 201, label: 'Created', desc: 'Account created successfully in database.' },
      { code: 400, label: 'Bad Request', desc: 'Validation failed or missing required fields.' },
      { code: 409, label: 'Conflict', desc: 'Email address already registered.' }
    ],
    responseExample: {
      success: true,
      message: 'Account created successfully',
      user: {
        id: 'usr_founder_02',
        name: 'Aditi Sharma',
        email: 'aditi.sharma@example.in',
        role: 'founder',
        status: 'active'
      }
    },
    bruFileName: '01-Authentication/Register.bru'
  },
  {
    id: 'auth-google',
    category: 'Authentication',
    name: 'Google OAuth SSO',
    method: 'POST',
    endpoint: '/api/auth/google',
    authRequired: false,
    allowedRoles: ['Guest'],
    description: 'Authenticate or auto-provision accounts via Google OAuth client token.',
    headers: { 'Content-Type': 'application/json' },
    requestBody: {
      credential: 'google_oauth_client_credential_token',
      role: 'founder'
    },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'Google sign-in verified and session created.' },
      { code: 400, label: 'Bad Request', desc: 'Invalid credential payload.' }
    ],
    responseExample: {
      success: true,
      user: {
        id: 'usr_google_01',
        name: 'Rohan Verma',
        email: 'rohan.verma@gmail.com',
        role: 'founder'
      }
    },
    bruFileName: '01-Authentication/Google-Auth.bru'
  },
  {
    id: 'auth-forgot-password',
    category: 'Authentication',
    name: 'Forgot Password Request',
    method: 'POST',
    endpoint: '/api/auth/forgot-password',
    authRequired: false,
    allowedRoles: ['Guest', 'Founder', 'Mentor', 'Admin'],
    description: 'Dispatch password recovery instructions and verification token.',
    headers: { 'Content-Type': 'application/json' },
    requestBody: { email: 'vishal1232@gmail.com' },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'Reset instructions dispatched.' },
      { code: 404, label: 'Not Found', desc: 'No account matching provided email.' }
    ],
    responseExample: {
      success: true,
      message: 'Password reset email sent with verification token.'
    },
    bruFileName: '01-Authentication/Forgot-Password.bru'
  },
  {
    id: 'auth-update-profile',
    category: 'Authentication',
    name: 'Update User Profile',
    method: 'POST',
    endpoint: '/api/auth/update-profile',
    authRequired: true,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'Update profile details (name, phone, bio) in the platform database.',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    requestBody: {
      name: 'Vishal Kumar',
      email: 'vishal1232@gmail.com',
      phone: '+91 94440 12345',
      bio: 'Building SaaS and AI solutions for Indian startups from Chennai.'
    },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'Profile updated in database.' },
      { code: 401, label: 'Unauthorized', desc: 'Authentication token missing or invalid.' }
    ],
    responseExample: {
      success: true,
      user: {
        id: 'usr_founder_01',
        name: 'Vishal Kumar',
        phone: '+91 94440 12345'
      }
    },
    bruFileName: '01-Authentication/Update-Profile.bru'
  },

  // 02 - Settings
  {
    id: 'settings-get',
    category: 'Settings',
    name: 'Get Current Settings',
    method: 'GET',
    endpoint: '/api/settings',
    authRequired: true,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'Fetch complete user configuration: account, security, notifications, appearance, privacy, workspace.',
    headers: { 'Authorization': 'Bearer {{authToken}}' },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'Settings payload returned.' },
      { code: 401, label: 'Unauthorized', desc: 'Missing authentication token.' }
    ],
    responseExample: {
      success: true,
      settings: {
        account: {
          username: 'vishal1232',
          email: 'vishal1232@gmail.com',
          language: 'en-IN',
          timezone: 'UTC+05:30',
          currency: 'INR (₹)'
        },
        security: { twoFactorEnabled: false, activeSessions: 1 },
        notifications: { emailNotifications: true, mentorReminders: true },
        appearance: { theme: 'light' },
        privacy: { profileVisibility: 'workspace' }
      }
    },
    bruFileName: '02-Settings/Get-Settings.bru'
  },
  {
    id: 'settings-change-password',
    category: 'Settings',
    name: 'Change Password',
    method: 'POST',
    endpoint: '/api/settings/change-password',
    authRequired: true,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'Verify current password and persist new hashed password.',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    requestBody: {
      currentPassword: 'Password123!',
      newPassword: 'BrandNewSecurePassword123!'
    },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'Password updated successfully.' },
      { code: 400, label: 'Bad Request', desc: 'Incorrect current password.' }
    ],
    responseExample: {
      success: true,
      message: 'Password successfully changed.'
    },
    bruFileName: '02-Settings/Change-Password.bru'
  },
  {
    id: 'settings-2fa',
    category: 'Settings',
    name: 'Toggle Two-Factor 2FA',
    method: 'POST',
    endpoint: '/api/settings/2fa/toggle',
    authRequired: true,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'Enable or disable two-factor authentication requirement.',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    requestBody: { enabled: true },
    statusCodes: [
      { code: 200, label: 'OK', desc: '2FA preference updated.' }
    ],
    responseExample: { success: true, twoFactorEnabled: true },
    bruFileName: '02-Settings/Toggle-2FA.bru'
  },
  {
    id: 'settings-export',
    category: 'Settings',
    name: 'Export Account Data',
    method: 'GET',
    endpoint: '/api/settings/export-data',
    authRequired: true,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'Export all account profile, activity logs, and startups in compliance with DPDP India regulations.',
    headers: { 'Authorization': 'Bearer {{authToken}}' },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'JSON dump file returned.' }
    ],
    responseExample: {
      user: { id: 'usr_founder_01', name: 'Vishal Kumar' },
      startups: [],
      exportedAt: '2026-11-06T10:00:00.000Z'
    },
    bruFileName: '02-Settings/Export-Account-Data.bru'
  },

  // 03 - Founders and Startups
  {
    id: 'startups-get',
    category: 'Founders & Startups',
    name: 'Get All Startups',
    method: 'GET',
    endpoint: '/api/startups',
    authRequired: true,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'Fetch startups and ventures with valuations, burn rates, and funding formatted in Indian Rupees (INR ₹).',
    headers: { 'Authorization': 'Bearer {{authToken}}' },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'List of startups returned.' }
    ],
    responseExample: [
      {
        id: 'stp_101',
        name: 'BharatMed HealthTech',
        industry: 'HealthTech',
        stage: 'Seed Stage',
        fundingRaisedINR: 8500000,
        valuationINR: 42000000,
        currency: 'INR',
        location: 'Chennai, Tamil Nadu, India'
      }
    ],
    bruFileName: '03-Founders-and-Startups/Get-Startups.bru'
  },
  {
    id: 'startups-create',
    category: 'Founders & Startups',
    name: 'Register New Startup',
    method: 'POST',
    endpoint: '/api/startups',
    authRequired: true,
    allowedRoles: ['Founder', 'Admin'],
    description: 'Register a new startup venture with financial figures in INR (₹).',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    requestBody: {
      name: 'KaapiPay FinTech',
      industry: 'FinTech',
      stage: 'Early Stage',
      pitch: 'UPI micro-payments for Indian retailers',
      fundingRaisedINR: 2500000,
      monthlyBurnINR: 180000,
      location: 'Chennai, Tamil Nadu, India'
    },
    statusCodes: [
      { code: 201, label: 'Created', desc: 'Startup created.' },
      { code: 400, label: 'Bad Request', desc: 'Missing required startup fields.' }
    ],
    responseExample: {
      success: true,
      startup: {
        id: 'stp_102',
        name: 'KaapiPay FinTech',
        fundingRaisedINR: 2500000,
        currency: 'INR'
      }
    },
    bruFileName: '03-Founders-and-Startups/Create-Startup.bru'
  },
  {
    id: 'milestones-get',
    category: 'Founders & Startups',
    name: 'Get Milestones Roadmap',
    method: 'GET',
    endpoint: '/api/milestones',
    authRequired: true,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'Retrieve milestone roadmap items with deadlines, grant budgets (INR), and completion status.',
    headers: { 'Authorization': 'Bearer {{authToken}}' },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'Milestones returned.' }
    ],
    responseExample: [
      {
        id: 'mls_1',
        title: 'Complete MVP Beta Launch in Chennai',
        completed: true,
        dueDate: '2026-12-15'
      }
    ],
    bruFileName: '03-Founders-and-Startups/Get-Milestones.bru'
  },

  // 04 - Mentors and Sessions
  {
    id: 'mentors-get',
    category: 'Mentors & Sessions',
    name: 'Get Approved Mentors',
    method: 'GET',
    endpoint: '/api/mentors',
    authRequired: true,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'List vetted incubator mentors with expertise domains, bios, and ratings.',
    headers: { 'Authorization': 'Bearer {{authToken}}' },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'Mentors array returned.' }
    ],
    responseExample: [
      {
        id: 'usr_mentor_1',
        name: 'Dr. Ramesh Sundaram',
        title: 'Senior FinTech Advisor',
        expertise: ['FinTech', 'Regulatory Compliance'],
        rating: 4.9
      }
    ],
    bruFileName: '04-Mentors-and-Sessions/Get-Mentors.bru'
  },
  {
    id: 'sessions-schedule',
    category: 'Mentors & Sessions',
    name: 'Schedule Mentorship Session',
    method: 'POST',
    endpoint: '/api/sessions',
    authRequired: true,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'Book a 1-on-1 advisory session between a startup founder and an approved mentor.',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    requestBody: {
      mentorId: 'usr_mentor_1',
      startupId: 'stp_101',
      topic: 'Financial Runway & Unit Economics in INR',
      scheduledAt: '2026-11-20T11:00:00.000Z',
      durationMinutes: 45
    },
    statusCodes: [
      { code: 201, label: 'Created', desc: 'Session booked and calendar event generated.' }
    ],
    responseExample: {
      success: true,
      session: {
        id: 'ses_2',
        topic: 'Financial Runway & Unit Economics in INR',
        status: 'scheduled'
      }
    },
    bruFileName: '04-Mentors-and-Sessions/Schedule-Session.bru'
  },

  // 05 - Admin and Approval
  {
    id: 'admin-stats',
    category: 'Admin & Approval',
    name: 'Admin Dashboard Stats',
    method: 'GET',
    endpoint: '/api/admin/dashboard/stats',
    authRequired: true,
    allowedRoles: ['Admin'],
    description: 'Aggregated incubation metrics: total founders, mentors, pending applications, active cohorts, and total funding in INR (₹).',
    headers: { 'Authorization': 'Bearer {{authToken}}' },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'Incubator stats returned.' },
      { code: 403, label: 'Forbidden', desc: 'Admin permissions required.' }
    ],
    responseExample: {
      totalFounders: 142,
      totalMentors: 38,
      pendingMentorApplications: 4,
      totalFundingINR: 125000000,
      currency: 'INR'
    },
    bruFileName: '05-Admin-and-Approval/Dashboard-Stats.bru'
  },
  {
    id: 'admin-founders',
    category: 'Admin & Approval',
    name: 'Founder Management Table',
    method: 'GET',
    endpoint: '/api/admin/founders',
    authRequired: true,
    allowedRoles: ['Admin'],
    description: 'Display all registered founders with startup details, registration date, status, and last login.',
    headers: { 'Authorization': 'Bearer {{authToken}}' },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'Founders table records returned.' },
      { code: 403, label: 'Forbidden', desc: 'Admin permissions required.' }
    ],
    responseExample: [
      {
        id: 'usr_founder_01',
        name: 'Vishal Kumar',
        email: 'vishal1232@gmail.com',
        phone: '+91 94440 12345',
        startupName: 'BharatMed HealthTech',
        status: 'active'
      }
    ],
    bruFileName: '05-Admin-and-Approval/Get-Founders.bru'
  },
  {
    id: 'admin-approve-mentor',
    category: 'Admin & Approval',
    name: 'Approve Mentor Application',
    method: 'POST',
    endpoint: '/api/admin/mentor-applications/:id/approve',
    authRequired: true,
    allowedRoles: ['Admin'],
    description: 'Approve a pending mentor application, activating the account and granting dashboard access.',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    requestBody: { notes: 'Approved for Chennai FinTech Cohort' },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'Mentor approved and activated.' },
      { code: 403, label: 'Forbidden', desc: 'Admin privileges required.' }
    ],
    responseExample: {
      success: true,
      message: 'Mentor application approved. Account is now active.'
    },
    bruFileName: '05-Admin-and-Approval/Approve-Mentor.bru'
  },
  {
    id: 'admin-toggle-status',
    category: 'Admin & Approval',
    name: 'Activate / Suspend Founder',
    method: 'POST',
    endpoint: '/api/admin/founders/:id/status',
    authRequired: true,
    allowedRoles: ['Admin'],
    description: 'Change user account status to "active" or "suspended".',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    requestBody: { status: 'active' },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'Status updated.' },
      { code: 403, label: 'Forbidden', desc: 'Admin privileges required.' }
    ],
    responseExample: { success: true, status: 'active' },
    bruFileName: '05-Admin-and-Approval/Toggle-Founder-Status.bru'
  },

  // 06 - AI and Learning
  {
    id: 'ai-courses',
    category: 'AI & Learning',
    name: 'AI Course Recommendations',
    method: 'POST',
    endpoint: '/api/ai/course-recommendations',
    authRequired: true,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'Leverage Google Gemini AI to analyze startup needs and recommend incubation courses in Indian market context.',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    requestBody: {
      industry: 'FinTech',
      startupStage: 'Seed Stage',
      learningGoals: 'Master RBI compliance and INR cash flow forecasting'
    },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'Recommended courses returned.' }
    ],
    responseExample: {
      success: true,
      courses: [
        {
          id: 'crs_rec_1',
          title: 'FinTech Compliance & RBI Master Directions',
          durationHours: 6,
          priceINR: 0
        }
      ]
    },
    bruFileName: '06-AI-and-Learning/Course-Recommendations.bru'
  },
  {
    id: 'ai-startup-analysis',
    category: 'AI & Learning',
    name: 'Run AI Startup Analysis',
    method: 'POST',
    endpoint: '/api/ai/startup-analysis',
    authRequired: true,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'Comprehensive AI business diagnosis evaluating cash runway, TAM, unit economics, and strategic growth in INR.',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    requestBody: {
      startupName: 'BharatMed HealthTech',
      industry: 'HealthTech',
      monthlyRevenueINR: 450000,
      monthlyBurnINR: 320000,
      runwayMonths: 14
    },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'SWOT and health score returned.' }
    ],
    responseExample: {
      success: true,
      analysis: {
        id: 'ana_101',
        healthScore: 84,
        strengths: ['14 months INR cash runway', 'High Tier-2 defensibility']
      }
    },
    bruFileName: '06-AI-and-Learning/Startup-Analysis.bru'
  },
  {
    id: 'ai-generate',
    category: 'AI & Learning',
    name: 'AI Startup Assistant',
    method: 'POST',
    endpoint: '/api/ai/generate',
    authRequired: true,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'Interactive AI Assistant for real-time incubation advice, pitch feedback, and INR financial analysis.',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    requestBody: {
      prompt: 'Summarize Section 80-IAC tax exemption benefits for Indian DPIIT startups.'
    },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'AI assistant generated guidance.' }
    ],
    responseExample: {
      success: true,
      result: 'DPIIT recognized startups can claim 100% tax deduction on profits...'
    },
    bruFileName: '06-AI-and-Learning/AI-Assistant-Generate.bru'
  },

  // 07 - Notifications and Resources
  {
    id: 'notif-get',
    category: 'Notifications & Resources',
    name: 'Get User Notifications',
    method: 'GET',
    endpoint: '/api/notifications',
    authRequired: true,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'Fetch real-time alerts, mentor confirmations, and milestone updates.',
    headers: { 'Authorization': 'Bearer {{authToken}}' },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'Notifications array returned.' }
    ],
    responseExample: [
      {
        id: 'notif_1',
        title: 'Mentor Session Confirmed',
        message: 'Dr. Ramesh Sundaram confirmed your session on Nov 12 at 2:00 PM IST.',
        read: false
      }
    ],
    bruFileName: '07-Notifications-and-Resources/Get-Notifications.bru'
  },
  {
    id: 'notif-mark-read',
    category: 'Notifications & Resources',
    name: 'Mark All Notifications Read',
    method: 'POST',
    endpoint: '/api/notifications/mark-all-read',
    authRequired: true,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'Mark all unread notifications as read.',
    headers: { 'Authorization': 'Bearer {{authToken}}' },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'All notifications marked read.' }
    ],
    responseExample: { success: true },
    bruFileName: '07-Notifications-and-Resources/Mark-All-Read.bru'
  },
  {
    id: 'resources-request',
    category: 'Notifications & Resources',
    name: 'Submit Resource Request',
    method: 'POST',
    endpoint: '/api/resources/request',
    authRequired: true,
    allowedRoles: ['Founder'],
    description: 'Request allocation of incubator hardware, cloud grants (INR), or meeting suites.',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    requestBody: {
      resourceId: 'res_1',
      startupId: 'stp_101',
      purpose: 'AI Model training for diagnostics',
      requestedQuantity: 1
    },
    statusCodes: [
      { code: 201, label: 'Created', desc: 'Resource request queued for review.' }
    ],
    responseExample: {
      success: true,
      message: 'Resource request submitted for review.'
    },
    bruFileName: '07-Notifications-and-Resources/Request-Resource.bru'
  },
  {
    id: 'analytics-get',
    category: 'Notifications & Resources',
    name: 'Get Platform Analytics',
    method: 'GET',
    endpoint: '/api/analytics',
    authRequired: true,
    allowedRoles: ['Founder', 'Mentor', 'Admin'],
    description: 'Incubator portfolio performance metrics in Indian Rupees (INR ₹).',
    headers: { 'Authorization': 'Bearer {{authToken}}' },
    statusCodes: [
      { code: 200, label: 'OK', desc: 'Analytics payload returned.' }
    ],
    responseExample: {
      currency: 'INR',
      locale: 'en-IN',
      totalFundingRaisedINR: 125000000,
      activeCohorts: 6
    },
    bruFileName: '07-Notifications-and-Resources/Get-Analytics.bru'
  }
];

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(API_ENDPOINTS[0].id);
  const [activeTab, setActiveTab] = useState<'docs' | 'curl' | 'bru'>('docs');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeEnv, setActiveEnv] = useState<'Local' | 'Production'>('Local');

  const categories = useMemo(() => {
    const set = new Set(API_ENDPOINTS.map((e) => e.category));
    return ['All', ...Array.from(set)];
  }, []);

  const filteredEndpoints = useMemo(() => {
    return API_ENDPOINTS.filter((ep) => {
      const matchesCat = selectedCategory === 'All' || ep.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const currentEndpoint = useMemo(() => {
    return (
      API_ENDPOINTS.find((e) => e.id === selectedEndpointId) ||
      filteredEndpoints[0] ||
      API_ENDPOINTS[0]
    );
  }, [selectedEndpointId, filteredEndpoints]);

  if (!isOpen) return null;

  const baseUrl =
    activeEnv === 'Local' ? 'http://localhost:3000' : 'https://startupincubation.chennai.in';

  const fullUrl = `${baseUrl}${currentEndpoint.endpoint}`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'POST':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PUT':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELETE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const generateCurl = () => {
    let cmd = `curl -X ${currentEndpoint.method} "${fullUrl}"`;
    if (currentEndpoint.headers) {
      Object.entries(currentEndpoint.headers).forEach(([k, v]) => {
        cmd += ` \\\n  -H "${k}: ${v}"`;
      });
    }
    if (currentEndpoint.requestBody) {
      cmd += ` \\\n  -d '${JSON.stringify(currentEndpoint.requestBody, null, 2)}'`;
    }
    return cmd;
  };

  const generateBruContent = () => {
    let content = `meta {\n  name: ${currentEndpoint.name}\n  type: http\n  seq: 1\n}\n\n`;
    content += `${currentEndpoint.method.toLowerCase()} {\n  url: {{baseUrl}}${currentEndpoint.endpoint}\n  body: ${currentEndpoint.requestBody ? 'json' : 'none'}\n  auth: ${currentEndpoint.authRequired ? 'bearer' : 'none'}\n}\n\n`;
    if (currentEndpoint.headers) {
      content += `headers {\n`;
      Object.entries(currentEndpoint.headers).forEach(([k, v]) => {
        content += `  ${k}: ${v}\n`;
      });
      content += `}\n\n`;
    }
    if (currentEndpoint.authRequired) {
      content += `auth:bearer {\n  token: {{authToken}}\n}\n\n`;
    }
    if (currentEndpoint.requestBody) {
      content += `body:json {\n${JSON.stringify(currentEndpoint.requestBody, null, 2)}\n}\n\n`;
    }
    content += `docs {\n  # ${currentEndpoint.name}\n  ${currentEndpoint.description}\n}`;
    return content;
  };

  const downloadBrunoArchive = () => {
    // Generate collection export json
    const collectionData = {
      name: 'Startup Incubation Platform API',
      version: '1.0.0',
      cliCommand: 'npx bru run bruno --env Local',
      environment: activeEnv,
      endpoints: API_ENDPOINTS.map((e) => ({
        name: e.name,
        category: e.category,
        method: e.method,
        endpoint: e.endpoint,
        bruFile: `bruno/${e.bruFileName}`,
        headers: e.headers,
        requestBody: e.requestBody,
        statusCodes: e.statusCodes,
        responseExample: e.responseExample
      }))
    };
    const blob = new Blob([JSON.stringify(collectionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bruno-startup-incubation-api.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <BrandLogo variant="navbar" size="sm" />
            <div className="h-6 w-px bg-slate-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-white bg-[#6355F4] px-2.5 py-1 rounded-md shadow-xs">
                Bruno API Docs
              </span>
              <span className="text-xs text-slate-500 hidden md:inline">
                53 endpoints • Indian Rupees (INR ₹) • REST
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Environment pill */}
            <div className="flex items-center bg-slate-200 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setActiveEnv('Local')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  activeEnv === 'Local' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Local (:3000)
              </button>
              <button
                onClick={() => setActiveEnv('Production')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  activeEnv === 'Production' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Prod (Chennai)
              </button>
            </div>

            <button
              onClick={downloadBrunoArchive}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#6355F4] bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 cursor-pointer"
              title="Download Bruno Collection Schema"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Bruno JSON</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
            {/* Search */}
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter APIs (e.g., auth, startup, mentor)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6355F4] focus:border-transparent text-slate-800"
                />
              </div>

              {/* Category selector */}
              <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar mt-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[11px] whitespace-nowrap px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                      selectedCategory === cat
                        ? 'bg-[#6355F4] text-white'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Endpoints List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredEndpoints.map((ep) => {
                const isSelected = ep.id === currentEndpoint.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => setSelectedEndpointId(ep.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-purple-100/70 border border-purple-300 text-slate-900 shadow-xs'
                        : 'hover:bg-slate-100 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${getMethodBadge(
                            ep.method
                          )}`}
                        >
                          {ep.method}
                        </span>
                        <span className="text-xs font-semibold truncate text-slate-800">
                          {ep.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{ep.endpoint}</p>
                    </div>
                    {isSelected && <ChevronRight className="w-4 h-4 text-[#6355F4] shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Bruno CLI instructions footer */}
            <div className="p-3 border-t border-slate-200 bg-white text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                <Terminal className="w-3.5 h-3.5 text-[#6355F4]" />
                <span>Run with Bruno CLI</span>
              </div>
              <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[10px] select-all">
                npx bru run bruno --env Local
              </code>
            </div>
          </div>

          {/* Main Details View */}
          <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
            {/* Title & Method */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-md border uppercase tracking-wider ${getMethodBadge(
                      currentEndpoint.method
                    )}`}
                  >
                    {currentEndpoint.method}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">{currentEndpoint.name}</h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                  <span className="font-semibold text-slate-400">Endpoint:</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[#6355F4] font-bold">
                    {currentEndpoint.endpoint}
                  </span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
                {currentEndpoint.authRequired ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5" /> Bearer Auth
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    Public API
                  </span>
                )}

                <div className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium">
                  Roles: {currentEndpoint.allowedRoles.join(', ')}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Overview & Purpose
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {currentEndpoint.description}
              </p>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                <span className="font-semibold">Bruno file:</span>
                <code className="text-[#6355F4] bg-white px-2 py-0.5 rounded border border-purple-200 font-mono">
                  bruno/{currentEndpoint.bruFileName}
                </code>
              </div>
            </div>

            {/* Tabs for Docs / cURL / Bruno (.bru) */}
            <div className="border-b border-slate-200 flex items-center gap-4">
              <button
                onClick={() => setActiveTab('docs')}
                className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'docs'
                    ? 'border-[#6355F4] text-[#6355F4]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Documentation & Schema
              </button>
              <button
                onClick={() => setActiveTab('curl')}
                className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'curl'
                    ? 'border-[#6355F4] text-[#6355F4]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                cURL Snippet
              </button>
              <button
                onClick={() => setActiveTab('bru')}
                className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'bru'
                    ? 'border-[#6355F4] text-[#6355F4]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Bruno File (.bru)
              </button>
            </div>

            {/* Tab: Documentation */}
            {activeTab === 'docs' && (
              <div className="space-y-6">
                {/* Headers */}
                {currentEndpoint.headers && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                      Request Headers
                    </h4>
                    <div className="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-xs">
                      {Object.entries(currentEndpoint.headers).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-purple-400">{k}:</span>
                          <span className="text-slate-300">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Request Body */}
                {currentEndpoint.requestBody && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Request Body (application/json)
                      </h4>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(currentEndpoint.requestBody, null, 2),
                            'body'
                          )
                        }
                        className="text-xs text-[#6355F4] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'body' ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy JSON
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                      {JSON.stringify(currentEndpoint.requestBody, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Status codes */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Response Status Codes
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentEndpoint.statusCodes.map((s) => (
                      <div
                        key={s.code}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5"
                      >
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            s.code < 300
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.code < 400
                              ? 'bg-blue-100 text-blue-800'
                              : s.code < 500
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {s.code}
                        </span>
                        <div className="text-xs">
                          <p className="font-bold text-slate-800">{s.label}</p>
                          <p className="text-slate-600">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Response Example */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Response Sample (200 OK)
                    </h4>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(currentEndpoint.responseExample, null, 2),
                          'resp'
                        )
                      }
                      className="text-xs text-[#6355F4] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'resp' ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Response
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-sky-300 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                    {JSON.stringify(currentEndpoint.responseExample, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Tab: cURL */}
            {activeTab === 'curl' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600">
                    Run this command in terminal to test against{' '}
                    <span className="font-semibold text-slate-900">{activeEnv}</span> backend:
                  </p>
                  <button
                    onClick={() => copyToClipboard(generateCurl(), 'curl')}
                    className="px-3 py-1.5 bg-[#6355F4] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-purple-700 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'curl' ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied Command
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy cURL
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {generateCurl()}
                </pre>
              </div>
            )}

            {/* Tab: Bruno .bru */}
            {activeTab === 'bru' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Bruno Specification File</p>
                    <p className="text-xs text-slate-500 font-mono">
                      Location: bruno/{currentEndpoint.bruFileName}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(generateBruContent(), 'bru')}
                    className="px-3 py-1.5 bg-[#6355F4] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-purple-700 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'bru' ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied .bru!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy .bru Content
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 text-purple-200 p-4 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {generateBruContent()}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsModal;
