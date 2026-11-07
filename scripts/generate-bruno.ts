import fs from 'fs';
import path from 'path';

interface BruEndpoint {
  folder: string;
  filename: string;
  name: string;
  seq: number;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  url: string;
  auth: 'none' | 'bearer';
  headers?: Record<string, string>;
  body?: any;
  docs: {
    description: string;
    authRequirement: string;
    allowedRoles: string[];
    requestParams?: string[];
    requestBodyFields?: string[];
    statusCodes: { code: number; description: string }[];
    responseExample: any;
  };
}

const endpoints: BruEndpoint[] = [
  // ---------------- 01 - Authentication ----------------
  {
    folder: '01-Authentication',
    filename: 'Login.bru',
    name: 'User Login',
    seq: 1,
    method: 'post',
    url: '{{baseUrl}}/api/auth/login',
    auth: 'none',
    headers: { 'Content-Type': 'application/json' },
    body: {
      username: 'vishal1232@gmail.com',
      password: 'Password123!',
      role: 'founder'
    },
    docs: {
      description: 'Authenticate an existing Founder, Mentor, or Admin with username/email and password.',
      authRequirement: 'Public (No authorization header required)',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      requestBodyFields: [
        '`username` (string, required) - Registered username or email address.',
        '`password` (string, required) - Plaintext password.',
        '`role` (string, optional) - Target dashboard role ("founder" | "mentor" | "admin").'
      ],
      statusCodes: [
        { code: 200, description: 'Authentication successful. Returns user object, token, and role.' },
        { code: 400, description: 'Missing username or required credentials.' },
        { code: 401, description: 'Invalid username or password.' },
        { code: 403, description: 'Account pending mentor approval or suspended by Admin.' },
        { code: 500, description: 'Internal server error.' }
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
      }
    }
  },
  {
    folder: '01-Authentication',
    filename: 'Register.bru',
    name: 'User Registration',
    seq: 2,
    method: 'post',
    url: '{{baseUrl}}/api/auth/register',
    auth: 'none',
    headers: { 'Content-Type': 'application/json' },
    body: {
      name: 'Aditi Sharma',
      email: 'aditi.sharma@example.in',
      password: 'Password123!',
      role: 'founder',
      startupName: 'AgroNext Dynamics',
      industry: 'AgriTech',
      phone: '+91 98765 43210'
    },
    docs: {
      description: 'Register a new Founder or Mentor account on the platform.',
      authRequirement: 'Public (No authorization header required)',
      allowedRoles: ['Guest'],
      requestBodyFields: [
        '`name` (string, required) - Full name of the user.',
        '`email` (string, required) - Unique email address.',
        '`password` (string, required) - Password (min 8 characters).',
        '`role` (string, required) - Role to register as: "founder" or "mentor".',
        '`startupName` (string, optional) - Required if registering as founder.',
        '`industry` (string, optional) - Industry category if founder.',
        '`phone` (string, optional) - Indian phone number (+91).'
      ],
      statusCodes: [
        { code: 201, description: 'Account registered successfully.' },
        { code: 400, description: 'Validation failed or missing required fields.' },
        { code: 409, description: 'Email address already registered.' },
        { code: 500, description: 'Internal server error.' }
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
      }
    }
  },
  {
    folder: '01-Authentication',
    filename: 'Google-Auth.bru',
    name: 'Google OAuth Single Sign-On',
    seq: 3,
    method: 'post',
    url: '{{baseUrl}}/api/auth/google',
    auth: 'none',
    headers: { 'Content-Type': 'application/json' },
    body: {
      credential: 'google_oauth_client_credential_token',
      role: 'founder'
    },
    docs: {
      description: 'Sign in or register automatically using a verified Google Account credential token.',
      authRequirement: 'Public (Google ID token / client payload)',
      allowedRoles: ['Guest'],
      requestBodyFields: [
        '`credential` (string, required) - Google ID token or OAuth response credential.',
        '`role` (string, optional) - Requested role if creating a new user.'
      ],
      statusCodes: [
        { code: 200, description: 'Google sign-in verified and session created.' },
        { code: 400, description: 'Invalid Google credential token.' },
        { code: 403, description: 'Account is currently suspended or awaiting approval.' },
        { code: 500, description: 'Internal server error.' }
      ],
      responseExample: {
        success: true,
        user: {
          id: 'usr_google_01',
          name: 'Rohan Verma',
          email: 'rohan.verma@gmail.com',
          role: 'founder',
          avatar: 'https://lh3.googleusercontent.com/a/sample-avatar'
        }
      }
    }
  },
  {
    folder: '01-Authentication',
    filename: 'Forgot-Password.bru',
    name: 'Forgot Password Request',
    seq: 4,
    method: 'post',
    url: '{{baseUrl}}/api/auth/forgot-password',
    auth: 'none',
    headers: { 'Content-Type': 'application/json' },
    body: {
      email: 'vishal1232@gmail.com'
    },
    docs: {
      description: 'Request a password reset link and verification token via email.',
      authRequirement: 'Public',
      allowedRoles: ['Guest', 'Founder', 'Mentor', 'Admin'],
      requestBodyFields: [
        '`email` (string, required) - Registered email address to receive reset instructions.'
      ],
      statusCodes: [
        { code: 200, description: 'Password reset link dispatched.' },
        { code: 404, description: 'No account matching provided email address.' },
        { code: 500, description: 'Email delivery failed.' }
      ],
      responseExample: {
        success: true,
        message: 'Password reset email sent with verification token.'
      }
    }
  },
  {
    folder: '01-Authentication',
    filename: 'Reset-Password.bru',
    name: 'Reset Password with Token',
    seq: 5,
    method: 'post',
    url: '{{baseUrl}}/api/auth/reset-password',
    auth: 'none',
    headers: { 'Content-Type': 'application/json' },
    body: {
      token: 'rst_tok_sample_123',
      newPassword: 'NewSecurePassword123!'
    },
    docs: {
      description: 'Set a new password using the token received in the forgot-password email.',
      authRequirement: 'Reset Token',
      allowedRoles: ['Guest'],
      requestBodyFields: [
        '`token` (string, required) - Reset token from verification email.',
        '`newPassword` (string, required) - New password satisfying complexity requirements.'
      ],
      statusCodes: [
        { code: 200, description: 'Password successfully updated.' },
        { code: 400, description: 'Invalid or expired reset token.' },
        { code: 500, description: 'Internal server error.' }
      ],
      responseExample: {
        success: true,
        message: 'Password reset completed successfully. You may now sign in.'
      }
    }
  },
  {
    folder: '01-Authentication',
    filename: 'Update-Profile.bru',
    name: 'Update User Profile',
    seq: 6,
    method: 'post',
    url: '{{baseUrl}}/api/auth/update-profile',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      name: 'Vishal Kumar',
      email: 'vishal1232@gmail.com',
      phone: '+91 94440 12345',
      bio: 'Building SaaS and AI solutions for Indian startups from Chennai.'
    },
    docs: {
      description: 'Update the authenticated user profile information in the database.',
      authRequirement: 'Bearer Token (Session authenticated)',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      requestBodyFields: [
        '`name` (string) - Full legal or display name.',
        '`email` (string) - Updated email address.',
        '`phone` (string) - Contact mobile number.',
        '`bio` (string) - Biography or background summary.'
      ],
      statusCodes: [
        { code: 200, description: 'Profile updated in database.' },
        { code: 401, description: 'Unauthorized or missing token.' },
        { code: 500, description: 'Database write error.' }
      ],
      responseExample: {
        success: true,
        user: {
          id: 'usr_founder_01',
          name: 'Vishal Kumar',
          email: 'vishal1232@gmail.com',
          phone: '+91 94440 12345',
          bio: 'Building SaaS and AI solutions for Indian startups from Chennai.'
        }
      }
    }
  },

  // ---------------- 02 - Settings ----------------
  {
    folder: '02-Settings',
    filename: 'Get-Settings.bru',
    name: 'Get Current Settings',
    seq: 1,
    method: 'get',
    url: '{{baseUrl}}/api/settings',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'Fetch all user settings: account, security, notifications, appearance, privacy, and workspace.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Settings returned successfully.' },
        { code: 401, description: 'Unauthorized request.' },
        { code: 500, description: 'Internal server error.' }
      ],
      responseExample: {
        success: true,
        settings: {
          account: {
            username: 'vishal1232',
            email: 'vishal1232@gmail.com',
            language: 'English (India)',
            timezone: 'Asia/Kolkata (IST +05:30)',
            currency: 'INR (₹)'
          },
          security: {
            twoFactorEnabled: false,
            activeSessions: 1
          },
          notifications: {
            emailNotifications: true,
            mentorReminders: true,
            milestoneUpdates: true,
            resourceAnnouncements: false,
            workspaceActivity: true
          },
          appearance: {
            theme: 'light',
            compactMode: false
          },
          privacy: {
            profileVisibility: 'workspace',
            workspaceActivityVisibility: true
          },
          workspace: {
            name: 'Chennai Innovation Incubator',
            plan: 'Pro Cohort',
            maxMembers: 20
          }
        }
      }
    }
  },
  {
    folder: '02-Settings',
    filename: 'Update-Account-Settings.bru',
    name: 'Update Account Settings',
    seq: 2,
    method: 'post',
    url: '{{baseUrl}}/api/settings/account',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      username: 'vishal1232',
      email: 'vishal1232@gmail.com',
      language: 'en-IN',
      timezone: 'UTC+05:30'
    },
    docs: {
      description: 'Persist account-level preferences including language and timezone.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      requestBodyFields: [
        '`username` (string) - Preferred handle.',
        '`email` (string) - Notification and login email.',
        '`language` (string) - Selected UI language locale.',
        '`timezone` (string) - User timezone (e.g. UTC+05:30 IST).'
      ],
      statusCodes: [
        { code: 200, description: 'Account settings updated.' },
        { code: 400, description: 'Invalid timezone or language format.' },
        { code: 401, description: 'Unauthorized.' }
      ],
      responseExample: {
        success: true,
        message: 'Account settings saved.'
      }
    }
  },
  {
    folder: '02-Settings',
    filename: 'Change-Password.bru',
    name: 'Change Password',
    seq: 3,
    method: 'post',
    url: '{{baseUrl}}/api/settings/change-password',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      currentPassword: 'Password123!',
      newPassword: 'BrandNewSecurePassword123!'
    },
    docs: {
      description: 'Change the account password by verifying current credentials.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      requestBodyFields: [
        '`currentPassword` (string, required) - Existing plaintext password for verification.',
        '`newPassword` (string, required) - New password.'
      ],
      statusCodes: [
        { code: 200, description: 'Password changed successfully.' },
        { code: 400, description: 'Current password verification failed.' },
        { code: 401, description: 'Unauthorized.' }
      ],
      responseExample: {
        success: true,
        message: 'Password successfully changed.'
      }
    }
  },
  {
    folder: '02-Settings',
    filename: 'Toggle-2FA.bru',
    name: 'Toggle Two-Factor Authentication',
    seq: 4,
    method: 'post',
    url: '{{baseUrl}}/api/settings/2fa/toggle',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      enabled: true
    },
    docs: {
      description: 'Enable or disable Two-Factor Authentication (2FA) for this account.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      requestBodyFields: [
        '`enabled` (boolean, required) - True to activate 2FA, false to deactivate.'
      ],
      statusCodes: [
        { code: 200, description: '2FA preference updated.' },
        { code: 401, description: 'Unauthorized.' }
      ],
      responseExample: {
        success: true,
        twoFactorEnabled: true,
        message: 'Two-factor authentication enabled.'
      }
    }
  },
  {
    folder: '02-Settings',
    filename: 'Logout-Other-Sessions.bru',
    name: 'Revoke Other Sessions',
    seq: 5,
    method: 'post',
    url: '{{baseUrl}}/api/settings/sessions/logout-others',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'Revoke all other active login tokens and sessions across other devices.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'All other sessions terminated.' },
        { code: 401, description: 'Unauthorized.' }
      ],
      responseExample: {
        success: true,
        message: 'All other active sessions have been logged out.'
      }
    }
  },
  {
    folder: '02-Settings',
    filename: 'Update-Notifications.bru',
    name: 'Update Notification Settings',
    seq: 6,
    method: 'post',
    url: '{{baseUrl}}/api/settings/notifications',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      emailNotifications: true,
      mentorReminders: true,
      milestoneUpdates: true,
      resourceAnnouncements: true,
      workspaceActivity: true
    },
    docs: {
      description: 'Configure granular notification triggers for email, mentors, and milestones.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      requestBodyFields: [
        '`emailNotifications` (boolean)',
        '`mentorReminders` (boolean)',
        '`milestoneUpdates` (boolean)',
        '`resourceAnnouncements` (boolean)',
        '`workspaceActivity` (boolean)'
      ],
      statusCodes: [
        { code: 200, description: 'Notification preferences updated.' },
        { code: 401, description: 'Unauthorized.' }
      ],
      responseExample: {
        success: true,
        message: 'Notification settings saved.'
      }
    }
  },
  {
    folder: '02-Settings',
    filename: 'Update-Appearance.bru',
    name: 'Update Appearance Settings',
    seq: 7,
    method: 'post',
    url: '{{baseUrl}}/api/settings/appearance',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      theme: 'light',
      density: 'comfortable'
    },
    docs: {
      description: 'Update theme mode (light, system) and dashboard layout styling.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Appearance preferences saved.' }
      ],
      responseExample: {
        success: true,
        theme: 'light'
      }
    }
  },
  {
    folder: '02-Settings',
    filename: 'Update-Privacy.bru',
    name: 'Update Privacy Settings',
    seq: 8,
    method: 'post',
    url: '{{baseUrl}}/api/settings/privacy',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      profileVisibility: 'workspace',
      workspaceActivityVisibility: true
    },
    docs: {
      description: 'Set profile visibility and team activity sharing preferences.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Privacy settings saved.' }
      ],
      responseExample: {
        success: true,
        message: 'Privacy settings saved.'
      }
    }
  },
  {
    folder: '02-Settings',
    filename: 'Export-Account-Data.bru',
    name: 'Export Account Data',
    seq: 9,
    method: 'get',
    url: '{{baseUrl}}/api/settings/export-data',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'Export all account activity, startups, and settings in compliance with data privacy regulations.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Account JSON dump payload returned.' },
        { code: 401, description: 'Unauthorized.' }
      ],
      responseExample: {
        user: { id: 'usr_founder_01', name: 'Vishal Kumar' },
        startups: [],
        exportedAt: '2026-11-06T10:00:00.000Z'
      }
    }
  },
  {
    folder: '02-Settings',
    filename: 'Deactivate-Account.bru',
    name: 'Deactivate Account',
    seq: 10,
    method: 'post',
    url: '{{baseUrl}}/api/settings/deactivate',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      reason: 'Taking a temporary sabbatical'
    },
    docs: {
      description: 'Temporarily deactivate the account while retaining startup and milestone records.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor'],
      statusCodes: [
        { code: 200, description: 'Account deactivated.' },
        { code: 401, description: 'Unauthorized.' }
      ],
      responseExample: {
        success: true,
        message: 'Your account has been deactivated.'
      }
    }
  },
  {
    folder: '02-Settings',
    filename: 'Request-Deletion.bru',
    name: 'Request Account Deletion',
    seq: 11,
    method: 'post',
    url: '{{baseUrl}}/api/settings/delete-request',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      confirmation: 'DELETE MY ACCOUNT'
    },
    docs: {
      description: 'Initiate a permanent 30-day compliance account deletion workflow.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor'],
      statusCodes: [
        { code: 200, description: 'Deletion request scheduled.' },
        { code: 400, description: 'Invalid confirmation phrase.' }
      ],
      responseExample: {
        success: true,
        message: 'Account deletion request queued for 30-day holding period.'
      }
    }
  },

  // ---------------- 03 - Founders and Startups ----------------
  {
    folder: '03-Founders-and-Startups',
    filename: 'Get-Startups.bru',
    name: 'Get All Startups',
    seq: 1,
    method: 'get',
    url: '{{baseUrl}}/api/startups',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'Retrieve startups filtered by current user or all startups for incubation admins.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Startups list in Indian Rupees (INR ₹) returned.' },
        { code: 401, description: 'Unauthorized.' }
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
          founderId: 'usr_founder_01',
          location: 'Chennai, Tamil Nadu, India'
        }
      ]
    }
  },
  {
    folder: '03-Founders-and-Startups',
    filename: 'Create-Startup.bru',
    name: 'Register New Startup',
    seq: 2,
    method: 'post',
    url: '{{baseUrl}}/api/startups',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      name: 'KaapiPay FinTech',
      industry: 'FinTech',
      stage: 'Early Stage',
      pitch: 'UPI-powered seamless micro-transactions for small retailers.',
      fundingRaisedINR: 2500000,
      monthlyBurnINR: 180000,
      location: 'Chennai, Tamil Nadu, India'
    },
    docs: {
      description: 'Create a new startup venture under the incubation program.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Admin'],
      requestBodyFields: [
        '`name` (string, required) - Startup legal or brand name.',
        '`industry` (string, required) - Domain sector (e.g. AgriTech, FinTech, HealthTech).',
        '`stage` (string, required) - Stage ("Idea", "Early Stage", "Seed", "Series A").',
        '`fundingRaisedINR` (number) - Total funding raised in Indian Rupees.',
        '`monthlyBurnINR` (number) - Monthly expenses/burn in Indian Rupees.'
      ],
      statusCodes: [
        { code: 201, description: 'Startup registered in database.' },
        { code: 400, description: 'Missing required parameters.' },
        { code: 401, description: 'Unauthorized.' }
      ],
      responseExample: {
        success: true,
        startup: {
          id: 'stp_102',
          name: 'KaapiPay FinTech',
          industry: 'FinTech',
          stage: 'Early Stage',
          currency: 'INR',
          fundingRaisedINR: 2500000
        }
      }
    }
  },
  {
    folder: '03-Founders-and-Startups',
    filename: 'Update-Startup.bru',
    name: 'Update Startup Details',
    seq: 3,
    method: 'put',
    url: '{{baseUrl}}/api/startups/:id',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      fundingRaisedINR: 5000000,
      stage: 'Seed Stage',
      monthlyBurnINR: 250000
    },
    docs: {
      description: 'Update valuation, funding, stage, or operational details of an incubated startup.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder (Owner)', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Startup successfully updated.' },
        { code: 404, description: 'Startup ID not found.' }
      ],
      responseExample: {
        success: true,
        message: 'Startup details updated.'
      }
    }
  },
  {
    folder: '03-Founders-and-Startups',
    filename: 'Delete-Startup.bru',
    name: 'Delete Startup',
    seq: 4,
    method: 'delete',
    url: '{{baseUrl}}/api/startups/:id',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'Remove a startup entry and archive associated records.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder (Owner)', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Startup deleted.' },
        { code: 403, description: 'Forbidden. Non-owners cannot delete.' },
        { code: 404, description: 'Startup not found.' }
      ],
      responseExample: {
        success: true,
        message: 'Startup deleted successfully.'
      }
    }
  },
  {
    folder: '03-Founders-and-Startups',
    filename: 'Get-Milestones.bru',
    name: 'Get Milestones',
    seq: 5,
    method: 'get',
    url: '{{baseUrl}}/api/milestones',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'Fetch the roadmap of milestones, deliverables, and completion status.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Milestones returned.' }
      ],
      responseExample: [
        {
          id: 'mls_1',
          title: 'Complete MVP Beta Launch in Chennai',
          dueDate: '2026-12-15',
          completed: true,
          startupId: 'stp_101',
          rewardBudgetINR: 500000
        }
      ]
    }
  },
  {
    folder: '03-Founders-and-Startups',
    filename: 'Create-Milestone.bru',
    name: 'Create Milestone',
    seq: 6,
    method: 'post',
    url: '{{baseUrl}}/api/milestones',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      title: 'Acquire First 100 Paying Indian Customers',
      description: 'Launch B2B sales outreach and convert free tier accounts.',
      dueDate: '2027-01-31',
      startupId: 'stp_101',
      budgetINR: 150000
    },
    docs: {
      description: 'Add a new roadmap milestone for tracking incubation progress.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 201, description: 'Milestone created.' },
        { code: 400, description: 'Missing required title or startup ID.' }
      ],
      responseExample: {
        success: true,
        milestone: {
          id: 'mls_2',
          title: 'Acquire First 100 Paying Indian Customers',
          completed: false
        }
      }
    }
  },
  {
    folder: '03-Founders-and-Startups',
    filename: 'Toggle-Milestone.bru',
    name: 'Toggle Milestone Status',
    seq: 7,
    method: 'put',
    url: '{{baseUrl}}/api/milestones/:id',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      completed: true
    },
    docs: {
      description: 'Toggle milestone completion status (completed / in-progress).',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Milestone status updated.' },
        { code: 404, description: 'Milestone ID not found.' }
      ],
      responseExample: {
        success: true,
        milestone: {
          id: 'mls_2',
          completed: true
        }
      }
    }
  },

  // ---------------- 04 - Mentors and Sessions ----------------
  {
    folder: '04-Mentors-and-Sessions',
    filename: 'Get-Mentors.bru',
    name: 'Get Mentors List',
    seq: 1,
    method: 'get',
    url: '{{baseUrl}}/api/mentors',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'List active approved mentors with expertise tags, bio, and availability.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'List of approved mentors returned.' },
        { code: 401, description: 'Unauthorized.' }
      ],
      responseExample: [
        {
          id: 'usr_mentor_1',
          name: 'Dr. Ramesh Sundaram',
          title: 'Senior FinTech Advisor',
          expertise: ['FinTech', 'Regulatory Compliance', 'Scale-up'],
          rating: 4.9,
          sessionsCompleted: 42
        }
      ]
    }
  },
  {
    folder: '04-Mentors-and-Sessions',
    filename: 'Assign-Mentor.bru',
    name: 'Assign Mentor to Startup',
    seq: 2,
    method: 'post',
    url: '{{baseUrl}}/api/mentors/assign',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      mentorId: 'usr_mentor_1',
      startupId: 'stp_101',
      notes: 'Mentoring on Series A fundraising and unit economics.'
    },
    docs: {
      description: 'Link an approved mentor to an incubated startup venture.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Admin'],
      statusCodes: [
        { code: 200, description: 'Mentor assigned successfully.' },
        { code: 403, description: 'Admin authorization required.' },
        { code: 404, description: 'Mentor or startup not found.' }
      ],
      responseExample: {
        success: true,
        message: 'Mentor assigned to startup.'
      }
    }
  },
  {
    folder: '04-Mentors-and-Sessions',
    filename: 'Get-Sessions.bru',
    name: 'Get Mentorship Sessions',
    seq: 3,
    method: 'get',
    url: '{{baseUrl}}/api/sessions',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'Get scheduled and completed mentorship 1-on-1 sessions.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Sessions list returned.' }
      ],
      responseExample: [
        {
          id: 'ses_1',
          mentorName: 'Dr. Ramesh Sundaram',
          startupName: 'BharatMed HealthTech',
          scheduledAt: '2026-11-12T14:00:00.000Z',
          status: 'confirmed',
          meetingLink: 'https://meet.google.com/xyz-abc-def'
        }
      ]
    }
  },
  {
    folder: '04-Mentors-and-Sessions',
    filename: 'Schedule-Session.bru',
    name: 'Schedule Mentorship Session',
    seq: 4,
    method: 'post',
    url: '{{baseUrl}}/api/sessions',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      mentorId: 'usr_mentor_1',
      startupId: 'stp_101',
      topic: 'Financial Model Review & INR Cash Runway',
      scheduledAt: '2026-11-20T11:00:00.000Z',
      durationMinutes: 45
    },
    docs: {
      description: 'Book a 1-on-1 advisory session between a founder and an approved mentor.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 201, description: 'Session created and calendar invite dispatched.' },
        { code: 400, description: 'Time conflict or missing params.' }
      ],
      responseExample: {
        success: true,
        session: {
          id: 'ses_2',
          topic: 'Financial Model Review & INR Cash Runway',
          status: 'scheduled'
        }
      }
    }
  },
  {
    folder: '04-Mentors-and-Sessions',
    filename: 'Update-Session.bru',
    name: 'Update Session Status or Feedback',
    seq: 5,
    method: 'put',
    url: '{{baseUrl}}/api/sessions/:id',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      status: 'completed',
      mentorNotes: 'Productive review. Cash runway is healthy at 18 months in INR.',
      rating: 5
    },
    docs: {
      description: 'Complete a session, submit mentor feedback, or reschedule.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Mentor', 'Founder', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Session updated.' },
        { code: 404, description: 'Session ID not found.' }
      ],
      responseExample: {
        success: true,
        message: 'Session status marked as completed.'
      }
    }
  },

  // ---------------- 05 - Admin and Approval ----------------
  {
    folder: '05-Admin-and-Approval',
    filename: 'Dashboard-Stats.bru',
    name: 'Admin Dashboard Stats',
    seq: 1,
    method: 'get',
    url: '{{baseUrl}}/api/admin/dashboard/stats',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'Fetch aggregated real-time metrics: active founders, mentors, pending applications, cohorts, and total funding in INR.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Admin'],
      statusCodes: [
        { code: 200, description: 'Dashboard stats object returned.' },
        { code: 403, description: 'Admin access required.' }
      ],
      responseExample: {
        totalFounders: 142,
        totalMentors: 38,
        pendingMentorApplications: 4,
        totalFundingINR: 125000000,
        currency: 'INR',
        activeCohorts: 6
      }
    }
  },
  {
    folder: '05-Admin-and-Approval',
    filename: 'Get-Founders.bru',
    name: 'Get All Registered Founders',
    seq: 2,
    method: 'get',
    url: '{{baseUrl}}/api/admin/founders',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'List all registered founders with startup details, registration date, status, and last login.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Admin'],
      statusCodes: [
        { code: 200, description: 'Founders table records returned.' },
        { code: 403, description: 'Admin access required.' }
      ],
      responseExample: [
        {
          id: 'usr_founder_01',
          name: 'Vishal Kumar',
          email: 'vishal1232@gmail.com',
          phone: '+91 94440 12345',
          startupName: 'BharatMed HealthTech',
          industry: 'HealthTech',
          status: 'active',
          registeredAt: '2026-10-15T08:30:00.000Z',
          lastLogin: '2026-11-06T09:45:00.000Z'
        }
      ]
    }
  },
  {
    folder: '05-Admin-and-Approval',
    filename: 'Get-Mentor-Applications.bru',
    name: 'Get Pending Mentor Applications',
    seq: 3,
    method: 'get',
    url: '{{baseUrl}}/api/admin/mentor-applications',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'List all mentor applications awaiting approval or review by incubator staff.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Admin'],
      statusCodes: [
        { code: 200, description: 'Pending applications array returned.' },
        { code: 403, description: 'Admin access required.' }
      ],
      responseExample: [
        {
          id: 'usr_mentor_app_1',
          name: 'Ananya Krishnan',
          email: 'ananya.k@iitm.ac.in',
          domain: 'DeepTech / AI',
          yearsExperience: 14,
          status: 'pending',
          appliedAt: '2026-11-04T12:00:00.000Z'
        }
      ]
    }
  },
  {
    folder: '05-Admin-and-Approval',
    filename: 'Approve-Mentor.bru',
    name: 'Approve Mentor Application',
    seq: 4,
    method: 'post',
    url: '{{baseUrl}}/api/admin/mentor-applications/:id/approve',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      notes: 'Approved. Assigned to DeepTech Chennai track.'
    },
    docs: {
      description: 'Approve a pending mentor application, activating their account and granting access to the Mentor Dashboard.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Admin'],
      statusCodes: [
        { code: 200, description: 'Mentor successfully approved and activated.' },
        { code: 403, description: 'Admin access required.' },
        { code: 404, description: 'Application not found.' }
      ],
      responseExample: {
        success: true,
        message: 'Mentor application approved. Account is now active.'
      }
    }
  },
  {
    folder: '05-Admin-and-Approval',
    filename: 'Reject-Mentor.bru',
    name: 'Reject Mentor Application',
    seq: 5,
    method: 'post',
    url: '{{baseUrl}}/api/admin/mentor-applications/:id/reject',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      reason: 'Domain focus does not align with current cohort requirements.'
    },
    docs: {
      description: 'Reject a pending mentor application with documented audit reason.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Admin'],
      statusCodes: [
        { code: 200, description: 'Application rejected.' },
        { code: 403, description: 'Admin access required.' }
      ],
      responseExample: {
        success: true,
        message: 'Mentor application marked as rejected.'
      }
    }
  },
  {
    folder: '05-Admin-and-Approval',
    filename: 'Toggle-Founder-Status.bru',
    name: 'Activate or Suspend Founder',
    seq: 6,
    method: 'post',
    url: '{{baseUrl}}/api/admin/founders/:id/status',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      status: 'active'
    },
    docs: {
      description: 'Activate or suspend a founder account with immediate authorization enforcement.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Admin'],
      requestBodyFields: [
        '`status` (string, required) - "active" or "suspended".'
      ],
      statusCodes: [
        { code: 200, description: 'Founder status updated.' },
        { code: 403, description: 'Admin privileges required.' }
      ],
      responseExample: {
        success: true,
        status: 'active',
        message: 'Founder account status changed.'
      }
    }
  },
  {
    folder: '05-Admin-and-Approval',
    filename: 'Toggle-Mentor-Status.bru',
    name: 'Activate or Suspend Mentor',
    seq: 7,
    method: 'post',
    url: '{{baseUrl}}/api/admin/mentors/:id/status',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      status: 'active'
    },
    docs: {
      description: 'Change an approved mentor status between active and suspended.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Admin'],
      statusCodes: [
        { code: 200, description: 'Mentor status changed.' },
        { code: 403, description: 'Admin access required.' }
      ],
      responseExample: {
        success: true,
        status: 'active'
      }
    }
  },
  {
    folder: '05-Admin-and-Approval',
    filename: 'Get-Activity-Logs.bru',
    name: 'Get Platform Activity Logs',
    seq: 8,
    method: 'get',
    url: '{{baseUrl}}/api/admin/activity',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'Audit log trail tracking logins, approvals, registrations, and milestones.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Admin'],
      statusCodes: [
        { code: 200, description: 'Activity logs array returned.' }
      ],
      responseExample: [
        {
          id: 'act_101',
          userName: 'Admin Office',
          role: 'admin',
          action: 'MENTOR_APPROVED',
          details: 'Approved Dr. Ramesh Sundaram for FinTech track',
          timestamp: '2026-11-06T09:12:00.000Z'
        }
      ]
    }
  },
  {
    folder: '05-Admin-and-Approval',
    filename: 'Get-Cohorts.bru',
    name: 'Get Cohorts',
    seq: 9,
    method: 'get',
    url: '{{baseUrl}}/api/cohorts',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'List incubation batches and cohorts with funding allocations and dates.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Cohorts list returned.' }
      ],
      responseExample: [
        {
          id: 'coh_2026_q4',
          name: 'Chennai Winter Cohort 2026',
          seedGrantINR: 1000000,
          startDate: '2026-11-01',
          status: 'in-progress'
        }
      ]
    }
  },
  {
    folder: '05-Admin-and-Approval',
    filename: 'Create-Cohort.bru',
    name: 'Create Incubation Cohort',
    seq: 10,
    method: 'post',
    url: '{{baseUrl}}/api/cohorts',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      name: 'Spring 2027 ScaleUp Batch',
      startDate: '2027-01-15',
      endDate: '2027-06-30',
      seedGrantINR: 1500000
    },
    docs: {
      description: 'Create a new incubation cohort program with grant funding in INR.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Admin'],
      statusCodes: [
        { code: 201, description: 'Cohort created.' },
        { code: 403, description: 'Admin access required.' }
      ],
      responseExample: {
        success: true,
        cohort: {
          id: 'coh_2027_q1',
          name: 'Spring 2027 ScaleUp Batch'
        }
      }
    }
  },

  // ---------------- 06 - AI and Learning ----------------
  {
    folder: '06-AI-and-Learning',
    filename: 'Course-Recommendations.bru',
    name: 'Generate AI Course Recommendations',
    seq: 1,
    method: 'post',
    url: '{{baseUrl}}/api/ai/course-recommendations',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      industry: 'FinTech',
      startupStage: 'Seed Stage',
      learningGoals: 'Master RBI digital lending guidelines and Indian unit economics.'
    },
    docs: {
      description: 'Leverage Google Gemini AI to analyze startup context and recommend tailored incubation courses.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Recommended courses returned with syllabus and rationale.' },
        { code: 500, description: 'AI generation error.' }
      ],
      responseExample: {
        success: true,
        courses: [
          {
            id: 'crs_rec_1',
            title: 'FinTech Compliance & RBI Master Directions',
            instructor: 'Vikram Sethi',
            difficulty: 'Intermediate',
            durationHours: 6,
            priceINR: 0,
            summary: 'Comprehensive guide to compliant NBFC & payment gateway operations in India.'
          }
        ]
      }
    }
  },
  {
    folder: '06-AI-and-Learning',
    filename: 'Course-History.bru',
    name: 'Get Recommendation History',
    seq: 2,
    method: 'get',
    url: '{{baseUrl}}/api/ai/course-recommendations/history',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'Fetch previous AI course recommendation runs generated for the user.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Admin'],
      statusCodes: [
        { code: 200, description: 'History array returned.' }
      ],
      responseExample: [
        {
          id: 'crun_101',
          query: 'FinTech RBI compliance',
          createdAt: '2026-11-05T14:20:00.000Z'
        }
      ]
    }
  },
  {
    folder: '06-AI-and-Learning',
    filename: 'Save-Course.bru',
    name: 'Enroll or Save Course',
    seq: 3,
    method: 'post',
    url: '{{baseUrl}}/api/ai/save-course',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      courseId: 'crs_rec_1',
      title: 'FinTech Compliance & RBI Master Directions',
      difficulty: 'Intermediate'
    },
    docs: {
      description: 'Save or enroll in an incubation learning course.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Course saved to user profile.' }
      ],
      responseExample: {
        success: true,
        message: 'Course saved to enrolled library.'
      }
    }
  },
  {
    folder: '06-AI-and-Learning',
    filename: 'Get-My-Courses.bru',
    name: 'Get Enrolled Courses',
    seq: 4,
    method: 'get',
    url: '{{baseUrl}}/api/ai/my-courses',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'List courses saved or enrolled by the authenticated founder.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'User enrolled courses list.' }
      ],
      responseExample: [
        {
          id: 'enr_1',
          courseTitle: 'FinTech Compliance & RBI Master Directions',
          progressPercent: 40,
          status: 'in-progress'
        }
      ]
    }
  },
  {
    folder: '06-AI-and-Learning',
    filename: 'Update-Course-Progress.bru',
    name: 'Update Course Progress',
    seq: 5,
    method: 'patch',
    url: '{{baseUrl}}/api/ai/my-courses/:id',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      progressPercent: 100,
      status: 'completed'
    },
    docs: {
      description: 'Update completion percentage or mark a course completed.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder'],
      statusCodes: [
        { code: 200, description: 'Progress updated.' }
      ],
      responseExample: {
        success: true,
        progressPercent: 100
      }
    }
  },
  {
    folder: '06-AI-and-Learning',
    filename: 'Startup-Analysis.bru',
    name: 'Run AI Startup Analysis',
    seq: 6,
    method: 'post',
    url: '{{baseUrl}}/api/ai/startup-analysis',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      startupName: 'BharatMed HealthTech',
      industry: 'HealthTech',
      monthlyRevenueINR: 450000,
      monthlyBurnINR: 320000,
      runwayMonths: 14,
      targetMarket: 'Tier-2 and Tier-3 hospitals across Tamil Nadu and South India'
    },
    docs: {
      description: 'Run comprehensive AI strategic assessment evaluating runway, TAM, threats, and Indian market product-market fit.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Detailed AI diagnosis, SWOT, and recommendations returned.' },
        { code: 500, description: 'AI generation error.' }
      ],
      responseExample: {
        success: true,
        analysis: {
          id: 'ana_101',
          healthScore: 84,
          strengths: ['Positive gross margin', 'High defensibility in Tier-2 Indian cities'],
          runwayAssessment: '14 months runway in INR provides adequate buffer for Seed extension.',
          actionItems: ['File patent with Indian Patent Office', 'Onboard 15 additional clinics']
        }
      }
    }
  },
  {
    folder: '06-AI-and-Learning',
    filename: 'Startup-Analysis-History.bru',
    name: 'Get Startup Analysis History',
    seq: 7,
    method: 'get',
    url: '{{baseUrl}}/api/ai/startup-analysis/history',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'List prior AI analyses generated for incubated ventures.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Analyses history list returned.' }
      ],
      responseExample: [
        {
          id: 'ana_101',
          startupName: 'BharatMed HealthTech',
          score: 84,
          createdAt: '2026-11-06T08:00:00.000Z'
        }
      ]
    }
  },
  {
    folder: '06-AI-and-Learning',
    filename: 'AI-Assistant-Generate.bru',
    name: 'AI Startup Assistant Chat/Generate',
    seq: 8,
    method: 'post',
    url: '{{baseUrl}}/api/ai/generate',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      prompt: 'Provide a breakdown of GST compliance and DPIIT Startup India tax exemption benefits in INR.',
      context: 'Chennai AgriTech startup in early scaling stage.'
    },
    docs: {
      description: 'Interactive AI Startup Assistant providing real-time strategic, financial (INR), and incubation advice.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'AI response stream or markdown text returned.' },
        { code: 500, description: 'AI engine failure.' }
      ],
      responseExample: {
        success: true,
        result: 'Under Section 80-IAC of the Income Tax Act, eligible DPIIT-recognized startups can claim a 100% tax holiday on profits for 3 consecutive years...'
      }
    }
  },

  // ---------------- 07 - Notifications and Resources ----------------
  {
    folder: '07-Notifications-and-Resources',
    filename: 'Get-Notifications.bru',
    name: 'Get User Notifications',
    seq: 1,
    method: 'get',
    url: '{{baseUrl}}/api/notifications',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'Retrieve alerts, meeting reminders, milestone progress, and incubation announcements.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Notifications list returned.' }
      ],
      responseExample: [
        {
          id: 'notif_1',
          title: 'Mentor Session Confirmed',
          message: 'Dr. Ramesh Sundaram confirmed your session on Nov 12 at 2:00 PM IST.',
          read: false,
          createdAt: '2026-11-06T09:00:00.000Z'
        }
      ]
    }
  },
  {
    folder: '07-Notifications-and-Resources',
    filename: 'Mark-Notification-Read.bru',
    name: 'Mark Notification Read',
    seq: 2,
    method: 'put',
    url: '{{baseUrl}}/api/notifications/:id/read',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'Mark a specific notification as read.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Notification marked read.' }
      ],
      responseExample: {
        success: true,
        read: true
      }
    }
  },
  {
    folder: '07-Notifications-and-Resources',
    filename: 'Mark-All-Read.bru',
    name: 'Mark All Notifications Read',
    seq: 3,
    method: 'post',
    url: '{{baseUrl}}/api/notifications/mark-all-read',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'Mark all pending notifications as read for current user.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'All notifications cleared.' }
      ],
      responseExample: {
        success: true,
        message: 'All notifications marked as read.'
      }
    }
  },
  {
    folder: '07-Notifications-and-Resources',
    filename: 'Get-Resources.bru',
    name: 'Get Incubation Resources',
    seq: 4,
    method: 'get',
    url: '{{baseUrl}}/api/resources',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'Browse available incubator hardware, cloud credits, 3D printers, meeting rooms, and legal templates.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Resources list returned.' }
      ],
      responseExample: [
        {
          id: 'res_1',
          name: 'Cloud Computing Credit Grant (₹2,50,000 value)',
          category: 'Cloud Credits',
          availableQuantity: 15,
          valueINR: 250000
        }
      ]
    }
  },
  {
    folder: '07-Notifications-and-Resources',
    filename: 'Request-Resource.bru',
    name: 'Submit Resource Request',
    seq: 5,
    method: 'post',
    url: '{{baseUrl}}/api/resources/request',
    auth: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{authToken}}'
    },
    body: {
      resourceId: 'res_1',
      startupId: 'stp_101',
      purpose: 'Training computer vision model for Chennai hospital diagnostics.',
      requestedQuantity: 1
    },
    docs: {
      description: 'Founder application to allocate incubator hardware or cloud grants.',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder'],
      statusCodes: [
        { code: 201, description: 'Resource request queued for Admin approval.' },
        { code: 400, description: 'Missing required parameters.' }
      ],
      responseExample: {
        success: true,
        message: 'Resource request submitted for review.'
      }
    }
  },
  {
    folder: '07-Notifications-and-Resources',
    filename: 'Get-Analytics.bru',
    name: 'Get Platform Financial Analytics',
    seq: 6,
    method: 'get',
    url: '{{baseUrl}}/api/analytics',
    auth: 'bearer',
    headers: {
      'Authorization': 'Bearer {{authToken}}'
    },
    docs: {
      description: 'Fetch aggregate incubator performance metrics formatted in Indian Rupees (INR ₹).',
      authRequirement: 'Bearer Token',
      allowedRoles: ['Founder', 'Mentor', 'Admin'],
      statusCodes: [
        { code: 200, description: 'Analytics object with INR totals and trends returned.' }
      ],
      responseExample: {
        currency: 'INR',
        locale: 'en-IN',
        totalFundingRaisedINR: 125000000,
        averageValuationINR: 35000000,
        cohortsActive: 6,
        monthlyGrowthPercent: 18.4
      }
    }
  }
];

function generateBruContent(ep: BruEndpoint): string {
  const parts: string[] = [];

  // Meta block
  parts.push(`meta {
  name: ${ep.name}
  type: http
  seq: ${ep.seq}
}`);

  // HTTP method block
  const methodUpper = ep.method;
  parts.push(`\n${methodUpper} {
  url: ${ep.url}
  body: ${ep.body ? 'json' : 'none'}
  auth: ${ep.auth}
}`);

  // Headers block if present
  if (ep.headers && Object.keys(ep.headers).length > 0) {
    const headerLines = Object.entries(ep.headers)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n');
    parts.push(`\nheaders {\n${headerLines}\n}`);
  }

  // Auth bearer block if required
  if (ep.auth === 'bearer') {
    parts.push(`\nauth:bearer {
  token: {{authToken}}
}`);
  }

  // JSON Body if present
  if (ep.body) {
    const formattedBody = JSON.stringify(ep.body, null, 2)
      .split('\n')
      .map((line) => '  ' + line)
      .join('\n');
    parts.push(`\nbody:json {\n${formattedBody}\n}`);
  }

  // Docs block with rich details
  const docs = ep.docs;
  let docsContent = `docs {
  # ${ep.name}
  ${docs.description}

  ### Authentication
  ${docs.authRequirement}

  ### Allowed Roles
  ${docs.allowedRoles.map((r) => `- ${r}`).join('\n')}
`;

  if (docs.requestBodyFields && docs.requestBodyFields.length > 0) {
    docsContent += `\n  ### Request Body Fields\n${docs.requestBodyFields.map((f) => `  - ${f}`).join('\n')}\n`;
  }

  docsContent += `\n  ### Response Status Codes\n${docs.statusCodes.map((s) => `  - \`${s.code}\` - ${s.description}`).join('\n')}\n`;

  docsContent += `\n  ### Response Example (${docs.statusCodes[0].code})\n  \`\`\`json\n${JSON.stringify(docs.responseExample, null, 2)
    .split('\n')
    .map((l) => '  ' + l)
    .join('\n')}\n  \`\`\`\n}`;

  parts.push(`\n${docsContent}`);

  return parts.join('\n') + '\n';
}

// Generate files
const brunoDir = path.resolve(process.cwd(), 'bruno');
if (!fs.existsSync(brunoDir)) {
  fs.mkdirSync(brunoDir, { recursive: true });
}

// Write bruno.json
const brunoJson = {
  version: '1',
  name: 'Startup Incubation Platform API',
  type: 'collection',
  ignore: ['node_modules', '.git']
};
fs.writeFileSync(path.join(brunoDir, 'bruno.json'), JSON.stringify(brunoJson, null, 2) + '\n');

// Write environments
const envDir = path.join(brunoDir, 'environments');
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

fs.writeFileSync(
  path.join(envDir, 'Local.bru'),
  `vars {
  baseUrl: http://localhost:3000
  authToken: sample_jwt_auth_token_for_local_testing
}
`
);

fs.writeFileSync(
  path.join(envDir, 'Production.bru'),
  `vars {
  baseUrl: https://startupincubation.chennai.in
  authToken: 
}
`
);

// Write endpoints
for (const ep of endpoints) {
  const folderPath = path.join(brunoDir, ep.folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  const filePath = path.join(folderPath, ep.filename);
  const content = generateBruContent(ep);
  fs.writeFileSync(filePath, content, 'utf8');
}

console.log(`Generated ${endpoints.length} Bruno .bru files across ${new Set(endpoints.map((e) => e.folder)).size} folders in /bruno/!`);
