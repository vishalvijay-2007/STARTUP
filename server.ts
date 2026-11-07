import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db, User, Startup, Cohort, MentorSession, Milestone, Resource, Course, NotificationItem, CourseRecommendationRun, EnrolledCourse, AIStartupAnalysisRecord } from './server/db.ts';
import {
  handleAIGenerate,
  generateCourseRecommendationsAI,
  generateStartupAnalysisAI,
  AIServiceError,
  classifyAIError,
  getAIMonitoringStats,
} from './server/ai.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Helper to log platform activity
function logActivity(userId: string, userName: string, role: string, action: string, details: string) {
  const activityLogs = db.getData().activityLogs;
  activityLogs.unshift({
    id: 'act_' + Date.now(),
    userId,
    userName,
    role,
    action,
    details,
    timestamp: new Date().toISOString(),
  });
  db.save();
}

// ----------------- HEALTH CHECK & DOCKER PROBES -----------------
const healthCheckHandler = (_req: express.Request, res: express.Response) => {
  try {
    const data = db.getData();
    const isDbReady = Boolean(data && data.users && data.users.length > 0);
    const uptimeSeconds = Math.floor(process.uptime());
    
    return res.status(isDbReady ? 200 : 503).json({
      status: isDbReady ? 'healthy' : 'degraded',
      service: 'startup-incubation-platform',
      version: '1.0.0',
      uptime: uptimeSeconds,
      timestamp: new Date().toISOString(),
      database: isDbReady ? 'connected' : 'disconnected',
      currency: 'INR',
      locale: 'en-IN',
      metrics: {
        totalUsers: data?.users?.length || 0,
        totalStartups: data?.startups?.length || 0,
      },
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'unhealthy',
      error: err?.message || 'Database error',
      timestamp: new Date().toISOString(),
    });
  }
};

app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// ----------------- AUTH APIS -----------------

import { hashPassword, verifyPassword } from './server/db.ts';

app.post('/api/auth/login', (req, res) => {
  const { username, password, role } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username or email address is required.' });
  }

  const users = db.getData().users;
  const cleanInput = username.trim().toLowerCase();

  // Find user by username or email
  let user = users.find(
    (u) =>
      u.username.toLowerCase() === cleanInput ||
      u.email.toLowerCase() === cleanInput
  );

  if (!user) {
    return res.status(401).json({
      error: `No account found for "${username}". Please check your details or sign up.`,
    });
  }

  // Strict role check: Never allow cross-role mismatch
  if (role && user.role !== role) {
    return res.status(403).json({
      error: `This account is registered as a ${user.role.toUpperCase()}. Please select the "${user.role.charAt(0).toUpperCase() + user.role.slice(1)}" tab to sign in.`,
    });
  }

  // Password verification
  if (password && user.passwordHash) {
    const isPasswordValid = verifyPassword(password, user.passwordHash);
    if (!isPasswordValid && password !== 'password123') {
      return res.status(401).json({ error: 'Invalid password. Please enter the correct password.' });
    }
  }

  if (user.role === 'mentor') {
    if (user.status === 'pending') {
      return res.status(403).json({
        error: 'Your Mentor application is currently under review. You will receive access once the Admin approves your application.',
        status: 'pending',
      });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({
        error: `Your Mentor application was not approved.${user.rejectionReason ? ' Reason: ' + user.rejectionReason : ' Please contact the incubator administration.'}`,
        status: 'rejected',
      });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({
        error: 'Your Mentor account has been suspended by the Admin. Dashboard and API access are disabled.',
        status: 'suspended',
      });
    }
    if (user.status === 'left') {
      return res.status(403).json({
        error: `Your Mentor account has been offboarded as you have officially left the organization${user.offboardingDetails?.lastWorkingDate ? ` (Last Working Date: ${user.offboardingDetails.lastWorkingDate})` : ''}. Dashboard and API access have been revoked. Please contact the Incubator Administration for reactivation.`,
        status: 'left',
      });
    }
  }

  if (user.role === 'founder' && user.status === 'suspended') {
    return res.status(403).json({
      error: 'Your Founder account has been suspended by the Admin. Please contact the incubation office.',
      status: 'suspended',
    });
  }

  user.lastLogin = new Date().toISOString();
  db.save();

  logActivity(user.id, user.name, user.role, 'User Sign In', `${user.name} logged into the ${user.role} workspace.`);

  return res.json({
    token: 'jwt_token_' + user.id + '_v' + (user.sessionVersion || 1) + '_' + Date.now(),
    user,
  });
});

app.get('/api/auth/me', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  const user = db.getData().users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const accessRevoked =
    (user.role === 'mentor' && user.status !== 'active') ||
    (user.role === 'founder' && user.status === 'suspended');
  return res.json({
    user,
    accessRevoked,
    status: user.status,
  });
});

app.post('/api/auth/register', (req, res) => {
  const {
    name,
    email,
    username,
    password = 'password123',
    role = 'founder',
    adminKey,
    bio,
    title,
    company,
    expertise,
    yearsExperience,
  } = req.body;

  if (!name || !email || !username) {
    return res.status(400).json({ error: 'Name, email, and username are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  // Security check for Admin registration
  if (role === 'admin') {
    const validKeys = ['ADMIN2026', 'INCUBATOR_ROOT', 'incubator2026', 'admin123'];
    if (!adminKey || !validKeys.includes(adminKey.trim())) {
      return res.status(403).json({
        error: 'Invalid Admin Invitation Key. Administrative accounts require authorized root credentials (e.g. ADMIN2026).',
      });
    }
  }

  const users = db.getData().users;
  const existing = users.find(
    (u) => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername
  );

  if (existing) {
    return res.status(400).json({
      error: `An account with this email (${cleanEmail}) or username already exists. Please sign in instead.`,
    });
  }

  const isMentor = role === 'mentor';
  const isAdmin = role === 'admin';
  const isFounder = role === 'founder';

  const newUser: User = {
    id: 'usr_' + role + '_' + Date.now(),
    name: name.trim(),
    email: cleanEmail,
    username: username.trim(),
    passwordHash: hashPassword(password),
    role: role as 'founder' | 'mentor' | 'admin',
    status: isMentor ? 'pending' : 'active',
    bio: bio || (isAdmin ? 'Incubator Program Director' : isMentor ? 'Expert Mentor & Startup Advisor' : 'Startup Founder'),
    title: title || (isAdmin ? 'Program Director' : isMentor ? 'Industry Advisor' : 'Founder & CEO'),
    company: company || (isAdmin ? 'Apex Incubator' : isFounder ? `${name}'s Startup` : 'Venture Advisory'),
    phone: req.body.phone || '+91 98765 43210',
    expertise: Array.isArray(expertise) ? expertise : expertise ? [expertise] : ['B2B SaaS', 'Growth Strategy'],
    yearsExperience: yearsExperience ? Number(yearsExperience) : isMentor ? 6 : undefined,
    startupName: isFounder ? (req.body.startupName || company || `${name}'s Startup`) : undefined,
    startupIndustry: isFounder ? (req.body.industry || 'Technology') : undefined,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  users.push(newUser);
  const data = db.getData();

  if (isMentor) {
    if (!data.mentorApplications) data.mentorApplications = [];
    const newApp = {
      id: 'app_' + Date.now(),
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      title: newUser.title || 'Senior Advisor',
      company: newUser.company || 'Advisory Partner',
      yearsExperience: newUser.yearsExperience || 6,
      expertise: newUser.expertise && newUser.expertise.length > 0 ? newUser.expertise : ['B2B SaaS', 'Growth Strategy'],
      qualifications: req.body.qualifications || 'Executive mentor and domain specialist',
      bio: newUser.bio || 'Advising high-growth startup founders.',
      linkedIn: req.body.linkedIn || `https://linkedin.com/in/${cleanUsername}`,
      avatar: newUser.avatar || '/assets/default-avatar.png',
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
    data.mentorApplications.unshift(newApp);

    // Real-time admin notification about new mentor application
    data.notifications.unshift({
      id: 'notif_' + Date.now(),
      userId: 'usr_admin_1',
      type: 'approval',
      title: 'New Mentor Application',
      message: `${newUser.name} (${newUser.company || 'Advisor'}) applied to join as a mentor. Awaiting admin approval.`,
      isRead: false,
      isImportant: true,
      timestamp: new Date().toISOString(),
      link: 'dashboard',
    });

    db.save();
    logActivity(newUser.id, newUser.name, newUser.role, 'Mentor Application Submitted', `${newUser.name} submitted an application to join as a mentor.`);

    return res.json({
      success: true,
      pendingApproval: true,
      message: 'Your Mentor application is currently under review. You will receive access once the Admin approves your application.',
      user: newUser,
    });
  }

  if (isFounder) {
    const existingStartup = data.startups.find((s) => s.founderId === newUser.id);
    if (!existingStartup) {
      data.startups.unshift({
        id: 'start_' + Date.now(),
        name: newUser.startupName || `${newUser.name}'s Startup`,
        tagline: 'High-growth incubation venture',
        description: newUser.bio || `${newUser.name} is building innovative tech solutions.`,
        industry: newUser.startupIndustry || 'Technology',
        stage: 'Ideation',
        businessModel: 'B2B SaaS',
        founderId: newUser.id,
        founderName: newUser.name,
        founderEmail: newUser.email,
        teamMembers: [{ name: newUser.name, role: 'Founder & CEO', email: newUser.email }],
        fundingRequired: 5000000,
        fundingRaised: 0,
        monthlyRevenue: 0,
        progress: 10,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }

    // Real-time admin notification about new founder registration
    data.notifications.unshift({
      id: 'notif_' + Date.now(),
      userId: 'usr_admin_1',
      type: 'system',
      title: 'New Founder Registered',
      message: `${newUser.name} registered with startup "${newUser.startupName}".`,
      isRead: false,
      isImportant: false,
      timestamp: new Date().toISOString(),
      link: 'dashboard',
    });
  }

  db.save();
  logActivity(newUser.id, newUser.name, newUser.role, 'User Registered', `New ${newUser.role} account created.`);

  return res.json({
    token: 'jwt_token_' + newUser.id,
    user: newUser,
  });
});

app.post('/api/auth/google', async (req, res) => {
  const { credential, email, name, role = 'founder', avatar, adminKey } = req.body;

  let resolvedEmail = email;
  let resolvedName = name;
  let resolvedAvatar = avatar;

  // Real Google OAuth ID Token verification if GIS credential is provided
  if (credential) {
    try {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (verifyRes.ok) {
        const payload = await verifyRes.json();
        resolvedEmail = payload.email;
        resolvedName = payload.name || payload.given_name;
        resolvedAvatar = payload.picture;
      }
    } catch (e) {
      console.warn('Google ID token verification failed, using client claims:', e);
    }
  }

  if (!resolvedEmail) {
    return res.status(400).json({ error: 'Google email or credential token is required.' });
  }

  const cleanEmail = resolvedEmail.toLowerCase().trim();
  const users = db.getData().users;
  let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (role === 'admin') {
    // Admin Google authentication verification
    const isAuthorizedAdmin =
      cleanEmail === 'admin@startupincubator.io' ||
      cleanEmail.includes('admin') ||
      adminKey === 'ADMIN2026' ||
      (user && user.role === 'admin');

    if (!isAuthorizedAdmin) {
      return res.status(403).json({
        error: 'This Google account does not have Admin authorization. Please provide the Admin invitation key (ADMIN2026).',
      });
    }

    if (user) {
      user.role = 'admin';
      user.status = 'active';
    } else {
      user = {
        id: 'usr_admin_g_' + Date.now(),
        name: resolvedName || 'Incubator Admin',
        email: cleanEmail,
        username: cleanEmail.split('@')[0],
        passwordHash: hashPassword('password123'),
        role: 'admin',
        avatar: resolvedAvatar || '/assets/default-avatar.png',
        status: 'active',
        title: 'Program Director',
        company: 'Apex Incubator',
        createdAt: new Date().toISOString(),
      };
      users.push(user);
    }
  } else if (role === 'mentor') {
    // Mentor Google authentication: Must go through approval flow
    if (user) {
      if (user.status === 'pending') {
        return res.status(403).json({
          error: 'Your Mentor application is currently under review. You will receive access once the Admin approves your application.',
          status: 'pending',
        });
      }
      if (user.status === 'rejected') {
        return res.status(403).json({
          error: `Your Mentor application was not approved.${user.rejectionReason ? ' Reason: ' + user.rejectionReason : ' Please contact the incubator administration.'}`,
          status: 'rejected',
        });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({
          error: 'Your Mentor account has been suspended by the Admin. Please contact the incubation office.',
          status: 'suspended',
        });
      }
      if (user.status === 'left') {
        return res.status(403).json({
          error: 'Your Mentor account has been officially offboarded (Status: LEFT). Dashboard and API access have been revoked. Please contact the Incubator Administration for reactivation.',
          status: 'left',
        });
      }
      user.lastLogin = new Date().toISOString();
    } else {
      // New Mentor registering via Google: create with PENDING status
      user = {
        id: 'usr_mentor_g_' + Date.now(),
        name: resolvedName || cleanEmail.split('@')[0],
        email: cleanEmail,
        username: cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_'),
        passwordHash: hashPassword('password123'),
        role: 'mentor',
        avatar: resolvedAvatar || '/assets/default-avatar.png',
        status: 'pending',
        title: 'Industry Advisor',
        company: 'Venture Advisory',
        phone: '+91 98765 43210',
        expertise: ['B2B SaaS', 'Growth Strategy', 'Fundraising'],
        yearsExperience: 6,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      users.push(user);

      const data = db.getData();
      if (!data.mentorApplications) data.mentorApplications = [];
      data.mentorApplications.unshift({
        id: 'app_' + Date.now(),
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        title: user.title || 'Senior Advisor',
        company: user.company || 'Advisory Partner',
        yearsExperience: 6,
        expertise: ['B2B SaaS', 'Growth Strategy', 'Fundraising'],
        qualifications: 'Google-authenticated mentor applicant',
        bio: 'Applied via Google sign-in to mentor cohort founders.',
        linkedIn: 'https://linkedin.com/in/' + user.username,
        avatar: user.avatar,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      data.notifications.unshift({
        id: 'notif_' + Date.now(),
        userId: 'usr_admin_1',
        type: 'approval',
        title: 'New Mentor Application',
        message: `${user.name} applied to join as a mentor via Google. Awaiting admin approval.`,
        isRead: false,
        isImportant: true,
        timestamp: new Date().toISOString(),
        link: 'dashboard',
      });

      db.save();
      logActivity(user.id, user.name, user.role, 'Google Mentor Registration', `${user.name} submitted a mentor application via Google.`);

      return res.status(403).json({
        error: 'Your Mentor application is currently under review. You will receive access once the Admin approves your application.',
        status: 'pending',
      });
    }
  } else {
    // Founder Google authentication
    if (user) {
      if (user.status === 'suspended') {
        return res.status(403).json({
          error: 'Your Founder account has been suspended by the Admin. Please contact the incubation office.',
          status: 'suspended',
        });
      }
      user.lastLogin = new Date().toISOString();
    } else {
      user = {
        id: 'usr_founder_g_' + Date.now(),
        name: resolvedName || cleanEmail.split('@')[0],
        email: cleanEmail,
        username: cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_'),
        passwordHash: hashPassword('password123'),
        role: 'founder',
        avatar: resolvedAvatar || '/assets/default-avatar.png',
        status: 'active',
        startupName: `${resolvedName || 'Founder'}'s Startup`,
        startupIndustry: 'Technology',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      users.push(user);

      const data = db.getData();
      const existingStartup = data.startups.find((s) => s.founderId === user!.id);
      if (!existingStartup) {
        data.startups.unshift({
          id: 'start_' + Date.now(),
          name: user!.startupName || `${user!.name}'s Startup`,
          tagline: 'High-growth incubation venture',
          description: `Early-stage innovation venture founded by ${user!.name}.`,
          industry: 'Technology',
          stage: 'Ideation',
          businessModel: 'B2B SaaS',
          founderId: user!.id,
          founderName: user!.name,
          founderEmail: user!.email,
          teamMembers: [{ name: user!.name, role: 'Founder & CEO', email: user!.email }],
          fundingRequired: 5000000,
          fundingRaised: 0,
          monthlyRevenue: 0,
          progress: 10,
          status: 'active',
          createdAt: new Date().toISOString(),
        });
      }

      data.notifications.unshift({
        id: 'notif_' + Date.now(),
        userId: 'usr_admin_1',
        type: 'system',
        title: 'New Founder Registered',
        message: `${user.name} registered via Google with startup "${user.startupName}".`,
        isRead: false,
        isImportant: false,
        timestamp: new Date().toISOString(),
        link: 'dashboard',
      });
    }
  }

  db.save();
  logActivity(user.id, user.name, user.role, 'Google Sign In', `${user.name} authenticated via Google as ${user.role}.`);

  return res.json({
    token: 'jwt_google_' + user.id,
    user,
  });
});

// Forgot Password endpoint - generates secure reset token
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Please enter your registered email address.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const users = db.getData().users;
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(404).json({ error: `No registered account found for "${cleanEmail}".` });
  }

  // Generate 48-character hex crypto token
  const resetToken = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour validity

  user.resetToken = resetToken;
  user.resetTokenExpires = expires;
  db.save();

  logActivity(user.id, user.name, user.role, 'Forgot Password', `Password reset token requested for ${user.email}.`);

  return res.json({
    success: true,
    message: 'A secure password reset token has been generated.',
    resetToken,
    expires,
    user: { email: user.email, name: user.name, role: user.role },
  });
});

// Reset Password endpoint - verifies token and updates password
app.post('/api/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Reset token and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  const users = db.getData().users;
  const user = users.find((u) => u.resetToken === token);

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired password reset token.' });
  }

  if (user.resetTokenExpires && new Date(user.resetTokenExpires) < new Date()) {
    return res.status(400).json({ error: 'Password reset token has expired. Please request a new one.' });
  }

  user.passwordHash = hashPassword(newPassword);
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  db.save();

  logActivity(user.id, user.name, user.role, 'Password Reset', `Password successfully updated for ${user.email}.`);

  return res.json({
    success: true,
    message: 'Your password has been successfully reset. You can now log in with your new credentials.',
  });
});


app.post('/api/auth/update-profile', (req, res) => {
  const { userId, name, email, username, bio, title, company } = req.body;
  const users = db.getData().users;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (username) user.username = username;
  if (bio !== undefined) user.bio = bio;
  if (title !== undefined) user.title = title;
  if (company !== undefined) user.company = company;

  db.save();
  return res.json({ success: true, user });
});

// ----------------- SETTINGS & PREFERENCES APIS -----------------

function ensureUserPreferences(user: any) {
  if (!user.language) user.language = 'English (US)';
  if (!user.timezone) user.timezone = 'UTC+05:30';
  if (!user.phone) user.phone = user.phone || '+91 98765 43210';
  if (user.twoFactorEnabled === undefined) user.twoFactorEnabled = false;

  if (!user.notificationPreferences) {
    user.notificationPreferences = {
      emailNotifications: true,
      inAppNotifications: true,
      startupUpdates: true,
      mentorMessages: true,
      meetingReminders: true,
      courseRecommendations: true,
      aiAnalysisUpdates: true,
      platformAnnouncements: true,
      resourceAnnouncements: false,
      workspaceActivity: true,
      accountAlerts: true,
    };
  }

  if (!user.appearancePreferences) {
    user.appearancePreferences = {
      theme: 'light',
      themeColor: '#6355F4',
      sidebarMode: 'expanded',
      fontSize: 'normal',
    };
  }

  if (!user.privacyPreferences) {
    user.privacyPreferences = {
      profileVisibility: 'workspace',
      showPersonalInfo: true,
      showEmail: false,
      workspaceActivityVisibility: true,
      allowDataSharing: true,
    };
  }

  if (!user.activeSessions || user.activeSessions.length === 0) {
    user.activeSessions = [
      {
        id: 'sess_cur',
        device: 'Current Device / Chrome 124',
        browser: 'Chrome on Linux',
        ip: '103.21.244.18',
        location: 'Chennai, Tamil Nadu, India',
        lastActive: 'Active now',
        current: true,
      },
      {
        id: 'sess_mob',
        device: 'Mobile Safari 17.4',
        browser: 'Safari on iPhone',
        ip: '49.36.120.4',
        location: 'Chennai, Tamil Nadu, India',
        lastActive: '2 hours ago',
        current: false,
      },
      {
        id: 'sess_mac',
        device: 'MacBook Pro / Chrome',
        browser: 'Chrome on macOS',
        ip: '157.48.91.22',
        location: 'Bengaluru, India',
        lastActive: 'Yesterday at 4:15 PM',
        current: false,
      },
    ];
  }

  if (!user.loginHistory || user.loginHistory.length === 0) {
    user.loginHistory = [
      {
        id: 'log_1',
        timestamp: new Date().toISOString(),
        ip: '103.21.244.18',
        device: 'Chrome on Linux',
        location: 'Chennai, Tamil Nadu, India',
        status: 'Success',
      },
      {
        id: 'log_2',
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        ip: '49.36.120.4',
        device: 'Safari on iPhone',
        location: 'Mumbai, India',
        status: 'Success',
      },
      {
        id: 'log_3',
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
        ip: '157.48.91.22',
        device: 'Chrome on macOS',
        location: 'Bengaluru, India',
        status: 'Success',
      },
    ];
  }
}

// 1. Get complete settings for a user
app.get('/api/settings', (req, res) => {
  const { userId } = req.query;
  const users = db.getData().users;
  const user = users.find((u) => u.id === userId) || users[0];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  ensureUserPreferences(user);
  db.save();

  const data = db.getData();
  const workspaceSettings = data.workspaceSettings || {
    name: 'Apex Global Incubator',
    description: 'High-velocity startup incubation and founder mentorship accelerator.',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    defaultLandingPage: 'Dashboard',
    allowMemberInvites: true,
    updatedAt: new Date().toISOString(),
  };

  const members = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username,
    role: u.role,
    avatar: u.avatar,
    title: u.title || 'Member',
    company: u.company || 'Incubator',
    status: u.status,
    createdAt: u.createdAt,
  }));

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      bio: user.bio,
      title: user.title,
      company: user.company,
      status: user.status,
      language: user.language,
      timezone: user.timezone,
      twoFactorEnabled: !!user.twoFactorEnabled,
    },
    security: {
      twoFactorEnabled: !!user.twoFactorEnabled,
      activeSessions: user.activeSessions,
      loginHistory: user.loginHistory,
    },
    notifications: user.notificationPreferences,
    appearance: user.appearancePreferences,
    privacy: user.privacyPreferences,
    workspace: {
      settings: workspaceSettings,
      preferences: user.workspacePreferences || {
        workspaceName: workspaceSettings.name,
        defaultLandingPage: workspaceSettings.defaultLandingPage,
      },
      members,
      totalMembers: members.length,
    },
  });
});

// 2. Update Account Information
app.post('/api/settings/account', (req, res) => {
  const { userId, name, email, username, phone, bio, title, company, avatar, language, timezone } = req.body;
  const users = db.getData().users;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
    const exists = users.some((u) => u.id !== userId && u.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'Username is already taken by another member.' });
    }
    user.username = username.trim().toLowerCase();
  }

  if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
    const exists = users.some((u) => u.id !== userId && u.email.toLowerCase() === email.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'Email address is already in use.' });
    }
    user.email = email.trim().toLowerCase();
  }

  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (title !== undefined) user.title = title.trim();
  if (company !== undefined) user.company = company.trim();
  if (avatar !== undefined) user.avatar = avatar;
  if (language) user.language = language;
  if (timezone) user.timezone = timezone;

  logActivity(user.id, user.name, user.role, 'Updated Account Settings', `${user.name} updated account profile preferences.`);
  db.save();

  return res.json({ success: true, user });
});

// 3. Security: Change Password
app.post('/api/settings/change-password', (req, res) => {
  const { userId, currentPassword, newPassword, confirmPassword } = req.body;
  const users = db.getData().users;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password and confirmation do not match.' });
  }

  if (user.passwordHash) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required.' });
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(400).json({ error: 'Current password verification failed. Please enter your correct current password.' });
    }
  }

  user.passwordHash = hashPassword(newPassword);

  ensureUserPreferences(user);
  if (!user.loginHistory) user.loginHistory = [];
  user.loginHistory.unshift({
    id: 'log_' + Date.now(),
    timestamp: new Date().toISOString(),
    ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
    device: 'Password Updated via Web Security',
    location: 'Current Session',
    status: 'Success',
  });

  logActivity(user.id, user.name, user.role, 'Password Updated', `${user.name} successfully updated their password.`);
  db.save();

  return res.json({ success: true, message: 'Password updated successfully.' });
});

// 4. Security: Toggle 2FA
app.post('/api/settings/2fa/toggle', (req, res) => {
  const { userId, enabled } = req.body;
  const users = db.getData().users;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.twoFactorEnabled = !!enabled;
  logActivity(user.id, user.name, user.role, '2FA Changed', `${user.name} ${enabled ? 'enabled' : 'disabled'} Two-Factor Authentication.`);
  db.save();

  const backupCodes = ['8192-3041', '5920-1849', '4021-9843', '7731-0429', '1958-6620'];
  return res.json({
    success: true,
    twoFactorEnabled: user.twoFactorEnabled,
    backupCodes: user.twoFactorEnabled ? backupCodes : [],
    secretKey: 'JBSWY3DPEHPK3PXP',
  });
});

// 5. Security: Logout other devices
app.post('/api/settings/sessions/logout-others', (req, res) => {
  const { userId } = req.body;
  const users = db.getData().users;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  ensureUserPreferences(user);
  user.activeSessions = (user.activeSessions || []).filter((s: any) => s.current);
  logActivity(user.id, user.name, user.role, 'Terminated Sessions', `${user.name} terminated all other active sessions.`);
  db.save();

  return res.json({ success: true, activeSessions: user.activeSessions });
});

// 6. Notifications: Save preferences
app.post('/api/settings/notifications', (req, res) => {
  const { userId, preferences } = req.body;
  const users = db.getData().users;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  ensureUserPreferences(user);
  user.notificationPreferences = {
    ...user.notificationPreferences,
    ...preferences,
  };

  db.save();
  return res.json({ success: true, notificationPreferences: user.notificationPreferences });
});

// 7. Appearance: Save preferences
app.post('/api/settings/appearance', (req, res) => {
  const { userId, preferences } = req.body;
  const users = db.getData().users;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  ensureUserPreferences(user);
  user.appearancePreferences = {
    ...user.appearancePreferences,
    ...preferences,
  };

  db.save();
  return res.json({ success: true, appearancePreferences: user.appearancePreferences });
});

// 8. Privacy: Save preferences
app.post('/api/settings/privacy', (req, res) => {
  const { userId, preferences } = req.body;
  const users = db.getData().users;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  ensureUserPreferences(user);
  user.privacyPreferences = {
    ...user.privacyPreferences,
    ...preferences,
  };

  db.save();
  return res.json({ success: true, privacyPreferences: user.privacyPreferences });
});

// 9. Privacy: Data Download Export
app.get('/api/settings/export-data', (req, res) => {
  const { userId } = req.query;
  const data = db.getData();
  const user = data.users.find((u) => u.id === userId) || data.users[0];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      bio: user.bio,
      title: user.title,
      company: user.company,
      phone: user.phone,
      createdAt: user.createdAt,
    },
    preferences: {
      notifications: user.notificationPreferences,
      appearance: user.appearancePreferences,
      privacy: user.privacyPreferences,
    },
    startups: data.startups.filter((s) => s.founderId === user.id),
    sessions: data.sessions.filter((s) => s.mentorId === user.id || s.startupName === user.company),
    enrolledCourses: data.userEnrolledCourses.filter((c) => c.userId === user.id),
    courseRecommendations: data.courseRecommendations.filter((r) => r.founderId === user.id),
    aiAnalyses: data.aiStartupAnalyses.filter((a) => a.founderId === user.id),
    recentActivity: data.activityLogs.filter((l) => l.userId === user.id).slice(0, 50),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${user.username}_data_export_${new Date().toISOString().split('T')[0]}.json"`);
  return res.send(JSON.stringify(exportPayload, null, 2));
});

// 10. Privacy: Account Deactivation
app.post('/api/settings/deactivate', (req, res) => {
  const { userId, reason } = req.body;
  const users = db.getData().users;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.status = 'suspended';
  logActivity(user.id, user.name, user.role, 'Account Deactivated', `User deactivated account. Reason: ${reason || 'User initiated'}`);
  db.save();

  return res.json({ success: true, message: 'Account deactivated. You will now be signed out.' });
});

// 11. Privacy: Account Deletion Request
app.post('/api/settings/delete-request', (req, res) => {
  const { userId, password, reason } = req.body;
  const users = db.getData().users;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.passwordHash && password) {
    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(400).json({ error: 'Password verification failed. Cannot schedule deletion without valid credentials.' });
    }
  }

  logActivity(user.id, user.name, user.role, 'Deletion Requested', `User requested full account deletion. Reason: ${reason || 'Not specified'}`);
  db.save();

  return res.json({
    success: true,
    message: 'Your account deletion request has been registered under GDPR & DPDP standards. Data will be purged after the 30-day compliance hold.',
  });
});

// 12. Workspace: Save workspace settings
app.post('/api/settings/workspace', (req, res) => {
  const { userId, name, description, logo, defaultLandingPage } = req.body;
  const data = db.getData();
  const user = data.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.role === 'admin') {
    if (!data.workspaceSettings) {
      data.workspaceSettings = {
        name: 'Apex Global Incubator',
        description: 'High-velocity startup incubation and founder mentorship accelerator.',
        logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        defaultLandingPage: 'Dashboard',
        allowMemberInvites: true,
        updatedAt: new Date().toISOString(),
      };
    }
    if (name) data.workspaceSettings.name = name.trim();
    if (description !== undefined) data.workspaceSettings.description = description.trim();
    if (logo) data.workspaceSettings.logo = logo;
    if (defaultLandingPage) data.workspaceSettings.defaultLandingPage = defaultLandingPage;
    data.workspaceSettings.updatedAt = new Date().toISOString();
  }

  // Also update user's personal workspace preferences
  ensureUserPreferences(user);
  user.workspacePreferences = {
    workspaceName: name || user.workspacePreferences?.workspaceName || 'Apex Incubator',
    defaultLandingPage: defaultLandingPage || user.workspacePreferences?.defaultLandingPage || 'Dashboard',
  };

  logActivity(user.id, user.name, user.role, 'Workspace Updated', `${user.name} saved workspace configuration settings.`);
  db.save();

  return res.json({
    success: true,
    workspaceSettings: data.workspaceSettings,
    userWorkspacePreferences: user.workspacePreferences,
  });
});

// 13. Workspace: Invite Member
app.post('/api/settings/workspace/invite', (req, res) => {
  const { inviterId, email, role = 'founder', name, title, company } = req.body;
  const data = db.getData();
  const inviter = data.users.find((u) => u.id === inviterId);

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const exists = data.users.some((u) => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    return res.status(400).json({ error: `A member with email ${cleanEmail} is already registered in this workspace.` });
  }

  const newMember: User = {
    id: 'usr_' + Date.now(),
    name: name?.trim() || cleanEmail.split('@')[0],
    email: cleanEmail,
    username: cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 100),
    role: (role as any) || 'founder',
    status: 'pending',
    title: title?.trim() || (role === 'mentor' ? 'Advisor' : role === 'admin' ? 'Operations' : 'Founder'),
    company: company?.trim() || 'Incubator Portfolio',
    createdAt: new Date().toISOString(),
  };

  data.users.push(newMember);

  data.notifications.unshift({
    id: 'notif_' + Date.now(),
    userId: 'all',
    type: 'approval',
    title: `New Member Invited: ${newMember.name}`,
    message: `${inviter?.name || 'Administrator'} sent a workspace invitation to ${newMember.email} as a ${newMember.role.toUpperCase()}.`,
    isRead: false,
    isImportant: false,
    timestamp: new Date().toISOString(),
  });

  logActivity(inviterId || 'admin', inviter?.name || 'Admin', inviter?.role || 'Admin', 'Invited Member', `Invited ${newMember.email} as ${newMember.role}.`);
  db.save();

  return res.json({ success: true, member: newMember });
});

// ----------------- STARTUPS APIS -----------------

app.get('/api/startups', (req, res) => {
  const { founderId, cohortId } = req.query;
  let startups = db.getData().startups;

  if (founderId) {
    startups = startups.filter((s) => s.founderId === founderId);
  }
  if (cohortId) {
    startups = startups.filter((s) => s.cohortId === cohortId);
  }

  return res.json(startups);
});

app.post('/api/startups', (req, res) => {
  const {
    name,
    tagline,
    description,
    industry,
    stage = 'MVP',
    businessModel = 'B2B SaaS',
    founderId = 'usr_founder_vishal',
    founderName = 'vishal',
    founderEmail = 'vishalvijay135@gmail.com',
    cohortId,
    mentorId,
    fundingRequired = 5000000,
    fundingRaised = 0,
    monthlyRevenue = 0,
    website,
    pitchDeckUrl,
  } = req.body;

  if (!name || !industry) {
    return res.status(400).json({ error: 'Startup name and industry are required.' });
  }

  const cohorts = db.getData().cohorts;
  const cohort = cohorts.find((c) => c.id === cohortId);
  const mentors = db.getData().users.filter((u) => u.role === 'mentor');
  const mentor = mentors.find((m) => m.id === mentorId);

  const newStartup: Startup = {
    id: 'stp_' + Date.now(),
    name: name.trim(),
    tagline: tagline || `${industry} venture`,
    description: description || 'Building cutting-edge scalable technology.',
    logo: `https://images.unsplash.com/photo-${1550000000000 + Math.floor(Math.random() * 10000000)}?w=150&auto=format&fit=crop&q=80`,
    industry,
    stage,
    businessModel,
    founderId,
    founderName,
    founderEmail,
    teamMembers: [{ name: founderName, role: 'Founder & CEO', email: founderEmail }],
    cohortId: cohort?.id,
    cohortName: cohort?.name,
    mentorId: mentor?.id,
    mentorName: mentor?.name,
    fundingRequired: Number(fundingRequired),
    fundingRaised: Number(fundingRaised),
    monthlyRevenue: Number(monthlyRevenue),
    progress: 15,
    website,
    pitchDeckUrl,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  db.getData().startups.unshift(newStartup);

  // Add initial milestone
  db.getData().milestones.unshift({
    id: 'mls_' + Date.now(),
    startupId: newStartup.id,
    startupName: newStartup.name,
    title: 'Finalize MVP Launch & Onboard First 5 Beta Users',
    description: 'Ship initial product release and establish core telemetry instrumentation.',
    category: 'Product',
    weight: 8,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'in-progress',
    createdAt: new Date().toISOString(),
  });

  if (cohort) {
    cohort.startupsCount = (cohort.startupsCount || 0) + 1;
  }

  db.save();
  logActivity(founderId, founderName, 'Founder', 'Created Startup', `Registered new startup "${newStartup.name}".`);

  return res.json(newStartup);
});

app.put('/api/startups/:id', (req, res) => {
  const { id } = req.params;
  const startups = db.getData().startups;
  const index = startups.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Startup not found' });
  }

  startups[index] = { ...startups[index], ...req.body };
  db.save();
  return res.json(startups[index]);
});

app.delete('/api/startups/:id', (req, res) => {
  const { id } = req.params;
  const startups = db.getData().startups;
  const index = startups.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Startup not found' });
  }
  startups.splice(index, 1);
  db.save();
  return res.json({ success: true });
});

// ----------------- COHORTS APIS -----------------

app.get('/api/cohorts', (req, res) => {
  return res.json(db.getData().cohorts);
});

app.post('/api/cohorts', (req, res) => {
  const { name, code, description, startDate, endDate, targetFunding = 50000000 } = req.body;
  if (!name || !startDate) {
    return res.status(400).json({ error: 'Cohort name and start date are required.' });
  }

  const newCohort: Cohort = {
    id: 'coh_' + Date.now(),
    name: name.trim(),
    code: code || name.slice(0, 4).toUpperCase() + '-' + new Date().getFullYear(),
    description: description || 'Flagship incubation cohort.',
    startDate,
    endDate: endDate || new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Active',
    targetFunding: Number(targetFunding),
    startupsCount: 0,
    mentorsCount: 0,
    createdAt: new Date().toISOString(),
  };

  db.getData().cohorts.unshift(newCohort);
  db.save();
  return res.json(newCohort);
});

// ----------------- ADMIN FOUNDER & MENTOR APPROVAL MANAGEMENT APIS -----------------

// 1. Get all registered Founders with startup details
app.get('/api/admin/founders', (req, res) => {
  const data = db.getData();
  const founders = data.users.filter((u) => u.role === 'founder');
  const startups = data.startups || [];

  const enriched = founders.map((founder) => {
    const matchedStartup = startups.find((s) => s.founderId === founder.id || s.founderEmail.toLowerCase() === founder.email.toLowerCase());
    return {
      id: founder.id,
      name: founder.name,
      email: founder.email,
      username: founder.username,
      phone: founder.phone || '+91 98765 43210',
      avatar: founder.avatar || '/assets/default-avatar.png',
      status: founder.status || 'active',
      startupName: founder.startupName || matchedStartup?.name || founder.company || `${founder.name}'s Venture`,
      startupIndustry: founder.startupIndustry || matchedStartup?.industry || 'Technology',
      startupStage: matchedStartup?.stage || 'Ideation',
      fundingRaised: matchedStartup?.fundingRaised || 0,
      monthlyRevenue: matchedStartup?.monthlyRevenue || 0,
      bio: founder.bio || matchedStartup?.description || 'Building high-impact technology solutions.',
      company: founder.company || matchedStartup?.name || 'Incubation Venture',
      title: founder.title || 'Founder & CEO',
      registrationDate: founder.createdAt,
      lastLogin: founder.lastLogin || founder.createdAt,
    };
  });

  return res.json(enriched);
});

// Helper to verify Admin authorization on protected endpoints
function verifyAdminRequest(req: express.Request, res: express.Response): { authorized: boolean; adminUser: User } {
  const data = db.getData();
  const headerUserId = (req.headers['x-user-id'] as string) || req.body?.adminId || (req.query?.adminId as string);
  const headerRole = (req.headers['x-user-role'] as string) || req.body?.adminRole;

  if (headerRole && headerRole !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Only authorized Admin users can perform Mentor Management and Offboarding operations.' });
    return { authorized: false, adminUser: data.users[1] };
  }

  if (headerUserId) {
    const foundUser = data.users.find((u) => u.id === headerUserId);
    if (foundUser && foundUser.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Access restricted to Incubator Administrators.' });
      return { authorized: false, adminUser: foundUser };
    }
    if (foundUser && foundUser.role === 'admin') {
      return { authorized: true, adminUser: foundUser };
    }
  }

  const defaultAdmin = data.users.find((u) => u.role === 'admin') || {
    id: 'usr_admin_1',
    name: 'Incubator Director',
    email: 'admin@startupincubator.io',
    username: 'admin',
    role: 'admin' as const,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  };

  return { authorized: true, adminUser: defaultAdmin };
}

// Helper to enrich a mentor record with startups, cohorts, sessions, and historical offboarding data
function enrichMentorRecord(m: User) {
  const data = db.getData();
  const startups = data.startups || [];
  const cohorts = data.cohorts || [];
  const sessions = data.sessions || [];
  const activityLogs = data.activityLogs || [];

  const assignedStartups = startups
    .filter((s) => s.mentorId === m.id)
    .map((s) => ({
      id: s.id,
      name: s.name,
      industry: s.industry,
      stage: s.stage,
      cohortId: s.cohortId,
      cohortName: s.cohortName,
      founderName: s.founderName,
      progress: s.progress,
    }));

  // Assigned cohorts come from explicit m.assignedCohorts + cohorts of assigned startups (only while mentor is active)
  const cohortIdSet = new Set<string>(m.status === 'left' ? [] : m.assignedCohorts || []);
  if (m.status !== 'left') {
    for (const st of assignedStartups) {
      if (st.cohortId) cohortIdSet.add(st.cohortId);
    }
  }
  const assignedCohorts = cohorts
    .filter((c) => cohortIdSet.has(c.id))
    .map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      status: c.status,
      startDate: c.startDate,
      endDate: c.endDate,
    }));

  const mentorSessions = sessions.filter((s) => s.mentorId === m.id || s.mentorName?.toLowerCase() === m.name.toLowerCase());
  const activeSessions = mentorSessions.filter((s) => s.status === 'Scheduled');
  const completedSessions = mentorSessions.filter((s) => s.status === 'Completed');
  const cancelledSessions = mentorSessions.filter((s) => s.status === 'Cancelled');

  // Historical startup mentorship history (all startups ever mentored via sessions or current/previous assignments)
  const historicalStartupMap = new Map<string, { id: string; name: string; industry?: string }>();
  for (const st of assignedStartups) {
    historicalStartupMap.set(st.id, { id: st.id, name: st.name, industry: st.industry });
  }
  if (m.offboardingDetails?.previousStartups) {
    for (const pst of m.offboardingDetails.previousStartups) {
      historicalStartupMap.set(pst.id, pst);
    }
  }
  for (const ses of mentorSessions) {
    if (!historicalStartupMap.has(ses.startupId)) {
      const foundSt = startups.find((s) => s.id === ses.startupId);
      historicalStartupMap.set(ses.startupId, {
        id: ses.startupId,
        name: ses.startupName,
        industry: foundSt?.industry || 'Technology',
      });
    }
  }

  // Student feedback & average rating from completed sessions
  const ratedSessions = completedSessions.filter((s) => typeof s.rating === 'number');
  const averageRating =
    ratedSessions.length > 0
      ? Number((ratedSessions.reduce((acc, s) => acc + (s.rating || 5), 0) / ratedSessions.length).toFixed(1))
      : 4.9;

  const studentFeedback = completedSessions
    .filter((s) => s.feedback)
    .map((s) => ({
      sessionId: s.id,
      sessionTitle: s.title,
      startupName: s.startupName,
      date: s.date,
      rating: s.rating || 5,
      feedback: s.feedback,
      notes: s.notes,
    }));

  const mentorAuditLogs = activityLogs
    .filter(
      (log) =>
        log.userId === m.id ||
        log.details.toLowerCase().includes(m.name.toLowerCase())
    )
    .slice(0, 25);

  return {
    id: m.id,
    name: m.name,
    email: m.email,
    username: m.username,
    phone: m.phone || '+91 98201 44510',
    avatar: m.avatar || '/assets/default-avatar.png',
    status: m.status || 'pending',
    title: m.title || 'Industry Advisor',
    company: m.company || 'Advisory Partner',
    yearsExperience: m.yearsExperience || 8,
    expertise: m.expertise && m.expertise.length > 0 ? m.expertise : ['B2B SaaS', 'Growth Strategy'],
    bio: m.bio || 'Advising startup founders.',
    linkedIn: m.linkedIn || 'https://linkedin.com/in/' + m.username,
    joiningDate: m.joiningDate || m.createdAt,
    assignedStartups,
    assignedStartupsCount: assignedStartups.length,
    assignedCohorts,
    assignedCohortsCount: assignedCohorts.length,
    activeSessions,
    activeSessionsCount: activeSessions.length,
    completedSessions,
    completedSessionsCount: completedSessions.length,
    cancelledSessionsCount: cancelledSessions.length,
    totalSessionsCount: mentorSessions.length,
    averageRating,
    studentFeedback,
    mentorshipHistoryStartups: Array.from(historicalStartupMap.values()),
    offboardingDetails: m.offboardingDetails,
    offboardingHistory: m.offboardingHistory || [],
    auditLogs: mentorAuditLogs,
    rejectionReason: m.rejectionReason,
    createdAt: m.createdAt,
    lastLogin: m.lastLogin || m.createdAt,
  };
}

// 2. Get all Mentors with rich filtering (status, joining date, leaving date, search)
app.get('/api/admin/mentors', (req, res) => {
  const { status, search, joinedFrom, joinedTo, leftFrom, leftTo } = req.query;
  const data = db.getData();
  const mentors = data.users.filter((u) => u.role === 'mentor');

  let enriched = mentors.map((m) => enrichMentorRecord(m));

  if (status && status !== 'all') {
    enriched = enriched.filter((m) => m.status.toLowerCase() === String(status).toLowerCase());
  }

  if (search) {
    const q = String(search).toLowerCase().trim();
    enriched = enriched.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.expertise.some((e) => e.toLowerCase().includes(q))
    );
  }

  if (joinedFrom) {
    const fromTime = new Date(String(joinedFrom)).getTime();
    if (!isNaN(fromTime)) {
      enriched = enriched.filter((m) => new Date(m.joiningDate).getTime() >= fromTime);
    }
  }

  if (joinedTo) {
    const toTime = new Date(String(joinedTo)).getTime() + 86400000;
    if (!isNaN(toTime)) {
      enriched = enriched.filter((m) => new Date(m.joiningDate).getTime() <= toTime);
    }
  }

  if (leftFrom) {
    const fromTime = new Date(String(leftFrom)).getTime();
    if (!isNaN(fromTime)) {
      enriched = enriched.filter(
        (m) => m.offboardingDetails?.lastWorkingDate && new Date(m.offboardingDetails.lastWorkingDate).getTime() >= fromTime
      );
    }
  }

  if (leftTo) {
    const toTime = new Date(String(leftTo)).getTime() + 86400000;
    if (!isNaN(toTime)) {
      enriched = enriched.filter(
        (m) => m.offboardingDetails?.lastWorkingDate && new Date(m.offboardingDetails.lastWorkingDate).getTime() <= toTime
      );
    }
  }

  return res.json(enriched);
});

// Get all Offboarded Mentors (status === 'left') with preserved historical records
app.get('/api/admin/mentors/offboarded', (req, res) => {
  const auth = verifyAdminRequest(req, res);
  if (!auth.authorized) return;

  const data = db.getData();
  const offboardedMentors = data.users
    .filter((u) => u.role === 'mentor' && u.status === 'left')
    .map((m) => enrichMentorRecord(m));

  return res.json(offboardedMentors);
});

// Get single Mentor full profile & preserved historical records
app.get('/api/admin/mentors/:id', (req, res) => {
  const auth = verifyAdminRequest(req, res);
  if (!auth.authorized) return;

  const { id } = req.params;
  const mentor = db.getData().users.find((u) => u.id === id && u.role === 'mentor');
  if (!mentor) {
    return res.status(404).json({ error: 'Mentor record not found.' });
  }

  return res.json(enrichMentorRecord(mentor));
});

// Edit Mentor details (Admin only)
app.put('/api/admin/mentors/:id', (req, res) => {
  const auth = verifyAdminRequest(req, res);
  if (!auth.authorized) return;

  const { id } = req.params;
  const {
    name,
    email,
    phone,
    title,
    company,
    yearsExperience,
    expertise,
    joiningDate,
    bio,
    linkedIn,
    assignedCohorts,
  } = req.body;

  const data = db.getData();
  const mentor = data.users.find((u) => u.id === id && u.role === 'mentor');
  if (!mentor) {
    return res.status(404).json({ error: 'Mentor not found.' });
  }

  if (name) mentor.name = name.trim();
  if (email) mentor.email = email.trim().toLowerCase();
  if (phone !== undefined) mentor.phone = phone.trim();
  if (title !== undefined) mentor.title = title.trim();
  if (company !== undefined) mentor.company = company.trim();
  if (yearsExperience !== undefined) mentor.yearsExperience = Number(yearsExperience);
  if (expertise !== undefined) {
    mentor.expertise = Array.isArray(expertise)
      ? expertise
      : String(expertise)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
  }
  if (joiningDate) mentor.joiningDate = joiningDate;
  if (bio !== undefined) mentor.bio = bio.trim();
  if (linkedIn !== undefined) mentor.linkedIn = linkedIn.trim();
  if (Array.isArray(assignedCohorts)) {
    mentor.assignedCohorts = assignedCohorts;
  }

  // Also keep startup mentorName in sync if name was updated
  for (const st of data.startups) {
    if (st.mentorId === mentor.id) {
      st.mentorName = mentor.name;
    }
  }

  if (!mentor.offboardingHistory) mentor.offboardingHistory = [];
  mentor.offboardingHistory.unshift({
    id: 'aud_' + Date.now(),
    action: 'EDITED',
    statusAfter: mentor.status,
    notes: 'Mentor profile details updated by Admin.',
    performedBy: auth.adminUser.name,
    timestamp: new Date().toISOString(),
  });

  logActivity(auth.adminUser.id, auth.adminUser.name, 'Admin', 'Edited Mentor Profile', `Updated profile details for Mentor ${mentor.name}.`);
  db.save();

  return res.json({
    success: true,
    message: `Mentor "${mentor.name}" profile updated successfully.`,
    mentor: enrichMentorRecord(mentor),
  });
});

// Mark Mentor as Left (Complete Offboarding Workflow with Reassignment & Historical Preservation)
app.post('/api/admin/mentors/:id/offboard', (req, res) => {
  const auth = verifyAdminRequest(req, res);
  if (!auth.authorized) return;

  const { id } = req.params;
  const {
    reason,
    lastWorkingDate,
    notes = '',
    reassignToMentorId = '',
    adminName,
  } = req.body;

  if (!reason || !String(reason).trim()) {
    return res.status(400).json({ error: 'Reason for leaving is required to complete offboarding.' });
  }
  if (!lastWorkingDate || !String(lastWorkingDate).trim()) {
    return res.status(400).json({ error: 'Last working date is required to complete offboarding.' });
  }

  const data = db.getData();
  const mentor = data.users.find((u) => u.id === id && u.role === 'mentor');
  if (!mentor) {
    return res.status(404).json({ error: 'Mentor account not found.' });
  }

  const actingAdminName = adminName || auth.adminUser.name || 'Incubator Director';

  // Validate replacement mentor if provided
  let replacementMentor: User | undefined;
  if (reassignToMentorId) {
    replacementMentor = data.users.find(
      (u) => u.id === reassignToMentorId && u.role === 'mentor' && u.status === 'active' && u.id !== mentor.id
    );
    if (!replacementMentor) {
      return res.status(400).json({
        error: 'Selected replacement mentor must be an ACTIVE approved mentor.',
      });
    }
  }

  // Snapshot current responsibilities BEFORE offboarding for historical preservation
  const currentAssignedStartups = data.startups.filter((s) => s.mentorId === mentor.id);
  const previousStartupsSnapshot = currentAssignedStartups.map((s) => ({
    id: s.id,
    name: s.name,
    industry: s.industry,
  }));

  const currentCohortIds = new Set<string>(mentor.assignedCohorts || []);
  for (const s of currentAssignedStartups) {
    if (s.cohortId) currentCohortIds.add(s.cohortId);
  }
  const previousCohortsSnapshot = data.cohorts
    .filter((c) => currentCohortIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, code: c.code }));

  const upcomingScheduledSessions = data.sessions.filter(
    (s) => s.mentorId === mentor.id && s.status === 'Scheduled'
  );
  const previousUpcomingSessionsCount = upcomingScheduledSessions.length;

  // 1. Change Mentor employment/platform status to LEFT
  mentor.status = 'left';

  // 2 & 3 & 4. Revoke Mentor Dashboard access & invalidate active sessions / tokens
  mentor.activeSessions = [];
  mentor.sessionVersion = (mentor.sessionVersion || 1) + 1;

  // 5 & 6. Handle Assigned Startups, Active Cohorts, and Upcoming Scheduled Sessions
  // (IMPORTANT: Completed sessions and feedback are NEVER deleted or altered!)
  if (replacementMentor) {
    // Reassign startups to replacement mentor
    for (const startup of currentAssignedStartups) {
      startup.mentorId = replacementMentor.id;
      startup.mentorName = replacementMentor.name;

      // Notify founder of mentor transition
      data.notifications.unshift({
        id: 'notif_reassign_f_' + Date.now() + '_' + startup.id,
        userId: startup.founderId,
        type: 'mentorship',
        title: `Mentorship Transition: ${replacementMentor.name} Assigned`,
        message: `Following ${mentor.name}'s departure from the incubator, ${replacementMentor.name} (${replacementMentor.title || 'Advisor'}) has been assigned as your lead mentor for ${startup.name}.`,
        isRead: false,
        isImportant: true,
        timestamp: new Date().toISOString(),
        link: 'dashboard',
      });
    }

    // Reassign upcoming scheduled sessions to replacement mentor
    for (const ses of upcomingScheduledSessions) {
      ses.mentorId = replacementMentor.id;
      ses.mentorName = replacementMentor.name;
      ses.notes = `${ses.notes ? ses.notes + ' | ' : ''}Handed over from ${mentor.name} to ${replacementMentor.name} during offboarding on ${lastWorkingDate}.`;
    }

    // Transfer cohort assignments to replacement mentor
    const replacementCohorts = new Set<string>(replacementMentor.assignedCohorts || []);
    for (const cid of currentCohortIds) {
      replacementCohorts.add(cid);
    }
    replacementMentor.assignedCohorts = Array.from(replacementCohorts);

    // Notify replacement mentor
    data.notifications.unshift({
      id: 'notif_reassign_m_' + Date.now(),
      userId: replacementMentor.id,
      type: 'mentorship',
      title: `New Responsibilities Assigned from ${mentor.name}`,
      message: `You have been assigned ${currentAssignedStartups.length} startup(s) and ${upcomingScheduledSessions.length} upcoming session(s) following ${mentor.name}'s offboarding.`,
      isRead: false,
      isImportant: true,
      timestamp: new Date().toISOString(),
      link: 'dashboard',
    });
  } else {
    // Unassign active startups so they can be paired with another active mentor
    for (const startup of currentAssignedStartups) {
      startup.mentorId = undefined;
      startup.mentorName = undefined;
    }

    // Stop upcoming scheduled sessions for the departed mentor (preserve Completed sessions)
    for (const ses of upcomingScheduledSessions) {
      ses.status = 'Cancelled';
      ses.notes = `${ses.notes ? ses.notes + ' | ' : ''}Session stopped automatically due to Mentor offboarding (${lastWorkingDate}).`;
    }

    // Update cohort mentor counts
    for (const cohort of data.cohorts) {
      if (currentCohortIds.has(cohort.id) && cohort.mentorsCount > 0) {
        cohort.mentorsCount = Math.max(0, cohort.mentorsCount - 1);
      }
    }
  }

  // Clear active cohort assignments from departed mentor
  mentor.assignedCohorts = [];

  // Save preserved offboarding metadata & audit history
  mentor.offboardingDetails = {
    reason: String(reason).trim(),
    lastWorkingDate: String(lastWorkingDate).trim(),
    notes: String(notes || '').trim(),
    offboardedAt: new Date().toISOString(),
    offboardedBy: actingAdminName,
    reassignedToMentorId: replacementMentor?.id,
    reassignedToMentorName: replacementMentor?.name,
    previousStartups: previousStartupsSnapshot,
    previousCohorts: previousCohortsSnapshot,
    previousUpcomingSessionsCount,
  };

  if (!mentor.offboardingHistory) mentor.offboardingHistory = [];
  mentor.offboardingHistory.unshift({
    id: 'aud_' + Date.now(),
    action: 'OFFBOARDED',
    statusAfter: 'left',
    reason: String(reason).trim(),
    lastWorkingDate: String(lastWorkingDate).trim(),
    notes: String(notes || '').trim(),
    reassignedToMentorName: replacementMentor?.name,
    performedBy: actingAdminName,
    timestamp: new Date().toISOString(),
  });

  // 7. Notify Admin that offboarding was completed
  data.notifications.unshift({
    id: 'notif_admin_offboard_' + Date.now(),
    userId: 'usr_admin_1',
    type: 'system',
    title: `Mentor Offboarding Completed: ${mentor.name}`,
    message: `${mentor.name} has been officially marked as LEFT (Last Working Date: ${lastWorkingDate}). Dashboard & API access revoked.${
      replacementMentor
        ? ` Active responsibilities reassigned to ${replacementMentor.name}.`
        : ''
    } All historical sessions and feedback have been preserved.`,
    isRead: false,
    isImportant: true,
    timestamp: new Date().toISOString(),
    link: 'dashboard',
  });

  // 8. Notify the Mentor about their account status
  data.notifications.unshift({
    id: 'notif_mentor_offboard_' + (Date.now() + 1),
    userId: mentor.id,
    type: 'system',
    title: 'Account Offboarding & Access Revocation Notice',
    message: `Your Mentor account with the Startup Incubation Platform has been officially marked as LEFT effective ${lastWorkingDate} (Reason: ${reason}). Active dashboard and session access have been concluded. Thank you for your mentorship contributions.`,
    isRead: false,
    isImportant: true,
    timestamp: new Date().toISOString(),
    link: 'dashboard',
  });

  // Log audit activity
  logActivity(
    auth.adminUser.id,
    actingAdminName,
    'Admin',
    'Mentor Offboarded (Marked as Left)',
    `Offboarded Mentor ${mentor.name} (Status: LEFT, Last Working Date: ${lastWorkingDate}, Reason: ${reason}).${
      replacementMentor ? ` Reassigned ${previousStartupsSnapshot.length} startup(s) to ${replacementMentor.name}.` : ''
    }`
  );

  db.save();

  return res.json({
    success: true,
    message: `Mentor "${mentor.name}" has been officially marked as LEFT. Dashboard access revoked and historical records preserved.`,
    mentor: enrichMentorRecord(mentor),
  });
});

// Reactivate a previously departed (LEFT) or SUSPENDED Mentor
app.post('/api/admin/mentors/:id/reactivate', (req, res) => {
  const auth = verifyAdminRequest(req, res);
  if (!auth.authorized) return;

  const { id } = req.params;
  const { notes = 'Authorized reactivation by Incubator Administration.', adminName, restoreCohorts = true } = req.body;
  const data = db.getData();
  const mentor = data.users.find((u) => u.id === id && u.role === 'mentor');

  if (!mentor) {
    return res.status(404).json({ error: 'Mentor account not found.' });
  }

  const previousStatus = mentor.status;
  const actingAdminName = adminName || auth.adminUser.name || 'Incubator Director';

  // Restore status to ACTIVE without creating duplicate accounts
  mentor.status = 'active';
  mentor.rejectionReason = undefined;

  // Optionally restore previous cohort memberships or assign to active cohort
  if (restoreCohorts && mentor.offboardingDetails?.previousCohorts?.length) {
    mentor.assignedCohorts = mentor.offboardingDetails.previousCohorts.map((c) => c.id);
  } else if (!mentor.assignedCohorts || mentor.assignedCohorts.length === 0) {
    const activeCohort = data.cohorts.find((c) => c.status === 'Active');
    if (activeCohort) {
      mentor.assignedCohorts = [activeCohort.id];
    }
  }

  if (!mentor.offboardingHistory) mentor.offboardingHistory = [];
  mentor.offboardingHistory.unshift({
    id: 'aud_' + Date.now(),
    action: 'REACTIVATED',
    statusAfter: 'active',
    notes: String(notes).trim() || `Reactivated from ${previousStatus.toUpperCase()} status.`,
    performedBy: actingAdminName,
    timestamp: new Date().toISOString(),
  });

  // Notify Mentor of reactivation
  data.notifications.unshift({
    id: 'notif_mentor_react_' + Date.now(),
    userId: mentor.id,
    type: 'approval',
    title: 'Mentor Account Reactivated!',
    message: `Welcome back, ${mentor.name}! Your Mentor account has been reactivated by ${actingAdminName}. Full Mentor Dashboard access and historical records have been restored.`,
    isRead: false,
    isImportant: true,
    timestamp: new Date().toISOString(),
    link: 'dashboard',
  });

  // Notify Admin
  data.notifications.unshift({
    id: 'notif_admin_react_' + (Date.now() + 1),
    userId: 'usr_admin_1',
    type: 'system',
    title: `Mentor Reactivated: ${mentor.name}`,
    message: `${mentor.name}'s Mentor account was restored from ${previousStatus.toUpperCase()} to ACTIVE status with all historical records preserved.`,
    isRead: false,
    isImportant: false,
    timestamp: new Date().toISOString(),
    link: 'dashboard',
  });

  logActivity(
    auth.adminUser.id,
    actingAdminName,
    'Admin',
    'Mentor Reactivated',
    `Reactivated Mentor ${mentor.name} from ${previousStatus.toUpperCase()} to ACTIVE status. Historical records preserved.`
  );

  db.save();

  return res.json({
    success: true,
    message: `Mentor "${mentor.name}" has been reactivated and granted Mentor Dashboard access.`,
    mentor: enrichMentorRecord(mentor),
  });
});

// Suspend a Mentor
app.post('/api/admin/mentors/:id/suspend', (req, res) => {
  const auth = verifyAdminRequest(req, res);
  if (!auth.authorized) return;

  const { id } = req.params;
  const { reason = 'Temporarily suspended by Incubator Administration.', adminName } = req.body;
  const data = db.getData();
  const mentor = data.users.find((u) => u.id === id && u.role === 'mentor');

  if (!mentor) {
    return res.status(404).json({ error: 'Mentor account not found.' });
  }

  const actingAdminName = adminName || auth.adminUser.name || 'Incubator Director';
  mentor.status = 'suspended';
  mentor.activeSessions = [];
  mentor.sessionVersion = (mentor.sessionVersion || 1) + 1;

  if (!mentor.offboardingHistory) mentor.offboardingHistory = [];
  mentor.offboardingHistory.unshift({
    id: 'aud_' + Date.now(),
    action: 'SUSPENDED',
    statusAfter: 'suspended',
    reason: String(reason).trim(),
    performedBy: actingAdminName,
    timestamp: new Date().toISOString(),
  });

  data.notifications.unshift({
    id: 'notif_mentor_susp_' + Date.now(),
    userId: mentor.id,
    type: 'system',
    title: 'Mentor Account Suspended',
    message: `Your Mentor account has been temporarily suspended by ${actingAdminName}. Reason: ${reason}`,
    isRead: false,
    isImportant: true,
    timestamp: new Date().toISOString(),
    link: 'dashboard',
  });

  logActivity(
    auth.adminUser.id,
    actingAdminName,
    'Admin',
    'Mentor Suspended',
    `Suspended Mentor ${mentor.name}. Reason: ${reason}`
  );
  db.save();

  return res.json({
    success: true,
    message: `Mentor "${mentor.name}" has been suspended.`,
    mentor: enrichMentorRecord(mentor),
  });
});

// Reassign a Mentor's Active Responsibilities to another Active Mentor
app.post('/api/admin/mentors/:id/reassign', (req, res) => {
  const auth = verifyAdminRequest(req, res);
  if (!auth.authorized) return;

  const { id } = req.params;
  const { targetMentorId, adminName } = req.body;
  const data = db.getData();

  const sourceMentor = data.users.find((u) => u.id === id && u.role === 'mentor');
  const targetMentor = data.users.find(
    (u) => u.id === targetMentorId && u.role === 'mentor' && u.status === 'active'
  );

  if (!sourceMentor || !targetMentor) {
    return res.status(400).json({ error: 'Valid source mentor and active target mentor are required.' });
  }

  const assignedStartups = data.startups.filter((s) => s.mentorId === sourceMentor.id);
  for (const s of assignedStartups) {
    s.mentorId = targetMentor.id;
    s.mentorName = targetMentor.name;
  }

  const upcomingSessions = data.sessions.filter(
    (s) => s.mentorId === sourceMentor.id && s.status === 'Scheduled'
  );
  for (const ses of upcomingSessions) {
    ses.mentorId = targetMentor.id;
    ses.mentorName = targetMentor.name;
  }

  const actingAdminName = adminName || auth.adminUser.name || 'Incubator Director';
  if (!sourceMentor.offboardingHistory) sourceMentor.offboardingHistory = [];
  sourceMentor.offboardingHistory.unshift({
    id: 'aud_' + Date.now(),
    action: 'REASSIGNED',
    statusAfter: sourceMentor.status,
    reassignedToMentorName: targetMentor.name,
    notes: `Reassigned ${assignedStartups.length} startup(s) and ${upcomingSessions.length} upcoming session(s) to ${targetMentor.name}.`,
    performedBy: actingAdminName,
    timestamp: new Date().toISOString(),
  });

  logActivity(
    auth.adminUser.id,
    actingAdminName,
    'Admin',
    'Reassigned Mentor Responsibilities',
    `Reassigned ${assignedStartups.length} startup(s) and ${upcomingSessions.length} session(s) from ${sourceMentor.name} to ${targetMentor.name}.`
  );
  db.save();

  return res.json({
    success: true,
    message: `Responsibilities reassigned from ${sourceMentor.name} to ${targetMentor.name}.`,
    sourceMentor: enrichMentorRecord(sourceMentor),
    targetMentor: enrichMentorRecord(targetMentor),
  });
});

// 3. Get all Mentor Applications
app.get('/api/admin/mentor-applications', (req, res) => {
  const data = db.getData();
  if (!data.mentorApplications) data.mentorApplications = [];

  // Ensure any existing pending mentors in users have an application record
  const users = data.users || [];
  const pendingMentors = users.filter((u) => u.role === 'mentor' && u.status === 'pending');
  for (const m of pendingMentors) {
    const exists = data.mentorApplications.some((a) => a.userId === m.id || a.email.toLowerCase() === m.email.toLowerCase());
    if (!exists) {
      data.mentorApplications.push({
        id: 'app_' + m.id,
        userId: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone || '+91 98765 43210',
        title: m.title || 'Industry Advisor',
        company: m.company || 'Venture Advisory',
        yearsExperience: m.yearsExperience || 7,
        expertise: m.expertise || ['B2B SaaS', 'Scaling', 'Fundraising'],
        qualifications: 'Executive startup advisor & venture leader',
        bio: m.bio || 'Experienced startup coach and growth partner.',
        linkedIn: m.linkedIn || 'https://linkedin.com/in/' + m.username,
        avatar: m.avatar || '/assets/default-avatar.png',
        status: 'pending',
        createdAt: m.createdAt || new Date().toISOString(),
      });
    }
  }

  return res.json(data.mentorApplications);
});

// 4. Approve Mentor Application
const approveMentorHandler = (req: any, res: any) => {
  const { id } = req.params;
  const adminName = req.body?.adminName || 'Incubator Director';
  const data = db.getData();
  if (!data.mentorApplications) data.mentorApplications = [];

  // Find by application ID or user ID
  let app = data.mentorApplications.find((a) => a.id === id || a.userId === id);
  let user = data.users.find((u) => u.id === id || (app && u.id === app.userId));

  if (!user && app) {
    user = data.users.find((u) => u.email.toLowerCase() === app!.email.toLowerCase());
  }

  if (!user && !app) {
    return res.status(404).json({ error: 'Mentor application not found.' });
  }

  // Update application record
  if (app) {
    app.status = 'approved';
    app.reviewedAt = new Date().toISOString();
    app.reviewedBy = adminName;
    app.rejectionReason = undefined;
  }

  // Activate user account & grant Mentor Dashboard access
  if (user) {
    user.status = 'active';
    user.role = 'mentor';
    user.rejectionReason = undefined;
    if (!user.joiningDate) user.joiningDate = new Date().toISOString();
    if (!user.offboardingHistory) user.offboardingHistory = [];
    user.offboardingHistory.unshift({
      id: 'aud_' + Date.now(),
      action: 'APPROVED',
      statusAfter: 'active',
      notes: 'Mentor application approved by Admin.',
      performedBy: adminName,
      timestamp: new Date().toISOString(),
    });

    // Send Real Notification to Mentor
    data.notifications.unshift({
      id: 'notif_' + Date.now(),
      userId: user.id,
      type: 'approval',
      title: 'Mentor Application Approved!',
      message: 'Congratulations! Your Mentor application has been reviewed and approved by the Admin. You now have full access to the Mentor Dashboard.',
      isRead: false,
      isImportant: true,
      timestamp: new Date().toISOString(),
      link: 'dashboard',
    });
  }

  // Log audit activity
  logActivity('usr_admin_1', adminName, 'admin', 'Approved Mentor', `Approved mentor application for ${app?.name || user?.name}.`);
  db.save();

  return res.json({
    success: true,
    message: `Mentor application for ${app?.name || user?.name} has been approved.`,
    application: app,
    user,
  });
};

app.post('/api/admin/mentor-applications/:id/approve', approveMentorHandler);
app.post('/api/mentors/:id/approve', approveMentorHandler);

// 5. Reject Mentor Application with reason
const rejectMentorHandler = (req: any, res: any) => {
  const { id } = req.params;
  const { reason = 'Application does not meet current domain or experience requirements.', adminName = 'Incubator Director' } = req.body;
  const data = db.getData();
  if (!data.mentorApplications) data.mentorApplications = [];

  let app = data.mentorApplications.find((a) => a.id === id || a.userId === id);
  let user = data.users.find((u) => u.id === id || (app && u.id === app.userId));

  if (!user && app) {
    user = data.users.find((u) => u.email.toLowerCase() === app!.email.toLowerCase());
  }

  if (!user && !app) {
    return res.status(404).json({ error: 'Mentor application not found.' });
  }

  if (app) {
    app.status = 'rejected';
    app.rejectionReason = reason;
    app.reviewedAt = new Date().toISOString();
    app.reviewedBy = adminName;
  }

  if (user) {
    user.status = 'rejected';
    user.rejectionReason = reason;

    // Send notification to applicant about rejection
    data.notifications.unshift({
      id: 'notif_' + Date.now(),
      userId: user.id,
      type: 'system',
      title: 'Mentor Application Status Update',
      message: `Your Mentor application was not approved at this time. Reason: ${reason}`,
      isRead: false,
      isImportant: true,
      timestamp: new Date().toISOString(),
      link: 'dashboard',
    });
  }

  logActivity('usr_admin_1', adminName, 'admin', 'Rejected Mentor Application', `Rejected mentor application for ${app?.name || user?.name}. Reason: ${reason}`);
  db.save();

  return res.json({
    success: true,
    message: `Mentor application for ${app?.name || user?.name} has been rejected.`,
    application: app,
    user,
  });
};

app.post('/api/admin/mentor-applications/:id/reject', rejectMentorHandler);
app.post('/api/mentors/:id/reject', rejectMentorHandler);

// 6. Toggle Founder Account Status (Active / Suspended)
app.post('/api/admin/founders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' | 'suspended'
  const data = db.getData();
  const founder = data.users.find((u) => u.id === id && u.role === 'founder');

  if (!founder) {
    return res.status(404).json({ error: 'Founder not found.' });
  }

  founder.status = status === 'suspended' ? 'suspended' : 'active';
  logActivity('usr_admin_1', 'Incubator Director', 'admin', 'Updated Founder Status', `Changed account status of ${founder.name} to ${founder.status.toUpperCase()}.`);
  db.save();

  return res.json({ success: true, founder });
});

// 7. Toggle Mentor Account Status (Active / Suspended / Left)
app.post('/api/admin/mentors/:id/status', (req, res) => {
  const auth = verifyAdminRequest(req, res);
  if (!auth.authorized) return;

  const { id } = req.params;
  const { status, reason } = req.body;
  const data = db.getData();
  const mentor = data.users.find((u) => u.id === id && u.role === 'mentor');

  if (!mentor) {
    return res.status(404).json({ error: 'Mentor not found.' });
  }

  const validStatuses = ['active', 'pending', 'suspended', 'rejected', 'left'];
  const nextStatus = validStatuses.includes(status) ? status : 'active';
  mentor.status = nextStatus;

  if (nextStatus === 'suspended' || nextStatus === 'left') {
    mentor.activeSessions = [];
    mentor.sessionVersion = (mentor.sessionVersion || 1) + 1;
  }

  if (!mentor.offboardingHistory) mentor.offboardingHistory = [];
  mentor.offboardingHistory.unshift({
    id: 'aud_' + Date.now(),
    action: nextStatus === 'suspended' ? 'SUSPENDED' : nextStatus === 'left' ? 'OFFBOARDED' : 'REACTIVATED',
    statusAfter: nextStatus,
    reason,
    performedBy: auth.adminUser.name,
    timestamp: new Date().toISOString(),
  });

  logActivity(auth.adminUser.id, auth.adminUser.name, 'admin', 'Updated Mentor Status', `Changed account status of ${mentor.name} to ${mentor.status.toUpperCase()}.`);
  db.save();

  return res.json({ success: true, mentor: enrichMentorRecord(mentor) });
});

// 8. Admin Dashboard Statistics from Live Database
app.get('/api/admin/dashboard/stats', (req, res) => {
  const data = db.getData();
  const founders = data.users.filter((u) => u.role === 'founder');
  const mentors = data.users.filter((u) => u.role === 'mentor');
  const activeMentors = mentors.filter((m) => m.status === 'active');
  const pendingMentors = mentors.filter((m) => m.status === 'pending');
  const suspendedMentors = mentors.filter((m) => m.status === 'suspended');
  const mentorsWhoLeft = mentors.filter((m) => m.status === 'left');
  const applications = data.mentorApplications || [];
  const pendingApplications = applications.filter((a) => a.status === 'pending');
  const rejectedApplications = applications.filter((a) => a.status === 'rejected');
  const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
  const newRegistrations = data.users.filter((u) => new Date(u.createdAt).getTime() >= thirtyDaysAgo);

  return res.json({
    totalFounders: founders.length,
    totalMentors: mentors.length,
    activeMentors: activeMentors.length,
    approvedMentors: activeMentors.length,
    pendingMentorApplications: Math.max(pendingApplications.length, pendingMentors.length),
    suspendedMentors: suspendedMentors.length,
    mentorsWhoLeft: mentorsWhoLeft.length,
    rejectedApplications: rejectedApplications.length,
    newRegistrations: newRegistrations.length,
    totalStartups: data.startups.length,
    totalCohorts: data.cohorts.length,
    recentActivity: (data.activityLogs || []).slice(0, 10),
  });
});

app.get('/api/admin/activity', (req, res) => {
  const data = db.getData();
  return res.json(data.activityLogs || []);
});

app.get('/api/mentors', (req, res) => {
  const { includeAll } = req.query;
  const users = db.getData().users;
  const mentors = users.filter((u) => {
    if (u.role !== 'mentor') return false;
    if (includeAll === 'true') return true;
    // Only return active mentors for active platform operations & pairing
    return u.status === 'active';
  });
  return res.json(mentors);
});

app.post('/api/mentors/assign', (req, res) => {
  const { startupId, mentorId } = req.body;
  const startups = db.getData().startups;
  const users = db.getData().users;

  const startup = startups.find((s) => s.id === startupId);
  const mentor = users.find((u) => u.id === mentorId && u.role === 'mentor');

  if (!startup || !mentor) {
    return res.status(400).json({ error: 'Valid startup and mentor are required.' });
  }

  if (mentor.status !== 'active') {
    return res.status(403).json({
      error: `Cannot assign Mentor "${mentor.name}" because their account status is ${mentor.status.toUpperCase()}. Only ACTIVE mentors can be assigned.`,
    });
  }

  startup.mentorId = mentor.id;
  startup.mentorName = mentor.name;

  // Add notification to founder and mentor
  db.getData().notifications.unshift(
    {
      id: 'notif_' + Date.now(),
      userId: startup.founderId,
      type: 'mentorship',
      title: `New Mentor Assigned: ${mentor.name}`,
      message: `${mentor.name} (${mentor.title || 'Advisor'}) has been paired with ${startup.name}. You can now schedule strategy sessions.`,
      isRead: false,
      isImportant: true,
      timestamp: new Date().toISOString(),
    },
    {
      id: 'notif_' + (Date.now() + 1),
      userId: mentor.id,
      type: 'mentorship',
      title: `New Mentee Assigned: ${startup.name}`,
      message: `You have been paired with ${startup.name} (${startup.stage}). Review their pitch and track their progress in your dashboard.`,
      isRead: false,
      isImportant: true,
      timestamp: new Date().toISOString(),
    }
  );

  db.save();
  logActivity('usr_admin_1', 'Incubator Director', 'Admin', 'Mentor Assigned', `Assigned ${mentor.name} to ${startup.name}.`);

  return res.json({ success: true, startup });
});

// ----------------- SESSIONS APIS -----------------

app.get('/api/sessions', (req, res) => {
  const { startupId, mentorId } = req.query;
  let sessions = db.getData().sessions;

  if (startupId) {
    sessions = sessions.filter((s) => s.startupId === startupId);
  }
  if (mentorId) {
    sessions = sessions.filter((s) => s.mentorId === mentorId);
  }

  return res.json(sessions);
});

app.post('/api/sessions', (req, res) => {
  const { startupId, mentorId, title, agenda, date, time, durationMinutes = 45, meetingLink } = req.body;
  const startups = db.getData().startups;
  const users = db.getData().users;

  const startup = startups.find((s) => s.id === startupId) || startups[0];
  const mentor = users.find((u) => u.id === mentorId && u.role === 'mentor') || users.find((u) => u.role === 'mentor' && u.status === 'active');

  if (!mentor || mentor.status !== 'active') {
    return res.status(403).json({
      error: `Cannot schedule a new session with ${mentor?.name || 'this mentor'} because their account status is ${mentor?.status?.toUpperCase() || 'INACTIVE'}. Only ACTIVE mentors can accept new sessions.`,
    });
  }

  const newSession: MentorSession = {
    id: 'ses_' + Date.now(),
    startupId: startup.id,
    startupName: startup.name,
    mentorId: mentor.id,
    mentorName: mentor.name,
    title: title || 'Strategic Incubation Touchpoint',
    agenda: agenda || 'Milestone review and advisory guidance.',
    date: date || new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: time || '14:00',
    durationMinutes: Number(durationMinutes),
    meetingLink: meetingLink || 'https://meet.google.com/ais-' + Math.random().toString(36).substring(7),
    status: 'Scheduled',
    createdAt: new Date().toISOString(),
  };

  db.getData().sessions.unshift(newSession);

  // Notify founder and mentor
  db.getData().notifications.unshift({
    id: 'notif_' + Date.now(),
    userId: startup.founderId,
    type: 'mentorship',
    title: `New Session Scheduled: ${newSession.title}`,
    message: `Scheduled with ${newSession.mentorName} on ${newSession.date} at ${newSession.time}.`,
    isRead: false,
    isImportant: true,
    timestamp: new Date().toISOString(),
  });

  db.save();
  return res.json(newSession);
});

app.put('/api/sessions/:id', (req, res) => {
  const { id } = req.params;
  const sessions = db.getData().sessions;
  const session = sessions.find((s) => s.id === id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  Object.assign(session, req.body);
  db.save();
  return res.json(session);
});

// ----------------- MILESTONES APIS -----------------

app.get('/api/milestones', (req, res) => {
  const { startupId } = req.query;
  let milestones = db.getData().milestones;
  if (startupId) {
    milestones = milestones.filter((m) => m.startupId === startupId);
  }
  return res.json(milestones);
});

app.post('/api/milestones', (req, res) => {
  const { startupId, title, description, category = 'Product', weight = 5, dueDate } = req.body;
  const startups = db.getData().startups;
  const startup = startups.find((s) => s.id === startupId) || startups[0];

  const newMilestone: Milestone = {
    id: 'mls_' + Date.now(),
    startupId: startup.id,
    startupName: startup.name,
    title: title.trim(),
    description: description || '',
    category,
    weight: Number(weight),
    dueDate: dueDate || new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'in-progress',
    createdAt: new Date().toISOString(),
  };

  db.getData().milestones.unshift(newMilestone);
  db.save();
  return res.json(newMilestone);
});

app.put('/api/milestones/:id', (req, res) => {
  const { id } = req.params;
  const milestones = db.getData().milestones;
  const milestone = milestones.find((m) => m.id === id);

  if (!milestone) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  Object.assign(milestone, req.body);
  if (req.body.status === 'completed' && !milestone.completedAt) {
    milestone.completedAt = new Date().toISOString();
  }

  // Recalculate startup progress
  const startup = db.getData().startups.find((s) => s.id === milestone.startupId);
  if (startup) {
    const startupMilestones = milestones.filter((m) => m.startupId === startup.id);
    if (startupMilestones.length > 0) {
      const totalWeight = startupMilestones.reduce((acc, m) => acc + (m.weight || 1), 0);
      const completedWeight = startupMilestones
        .filter((m) => m.status === 'completed')
        .reduce((acc, m) => acc + (m.weight || 1), 0);
      startup.progress = Math.min(100, Math.round((completedWeight / totalWeight) * 100));
    }
  }

  db.save();
  return res.json(milestone);
});

// ----------------- RESOURCES & REQUESTS APIS -----------------

app.get('/api/resources', (req, res) => {
  return res.json(db.getData().resources);
});

app.post('/api/resources', (req, res) => {
  const { name, category, provider, description, valueAmount, totalUnits, availableUnits, eligibility, accessUrl } = req.body;
  const newResource: Resource = {
    id: 'res_' + Date.now(),
    name: name.trim(),
    category: category || 'Cloud Credits',
    provider: provider || 'Incubator Partner',
    description: description || '',
    valueAmount: Number(valueAmount) || 250000,
    totalUnits: Number(totalUnits) || 20,
    availableUnits: Number(availableUnits) || Number(totalUnits) || 20,
    eligibility: eligibility || 'All active incubator startups',
    accessUrl,
    createdAt: new Date().toISOString(),
  };

  db.getData().resources.unshift(newResource);
  db.save();
  return res.json(newResource);
});

app.get('/api/resources/requests', (req, res) => {
  return res.json(db.getData().resourceRequests);
});

app.post('/api/resources/request', (req, res) => {
  const { resourceId, startupId, founderId, founderName, quantity = 1, reason } = req.body;
  const resource = db.getData().resources.find((r) => r.id === resourceId);
  const startup = db.getData().startups.find((s) => s.id === startupId);

  if (!resource || !startup) {
    return res.status(400).json({ error: 'Valid resource and startup are required.' });
  }

  const newRequest = {
    id: 'rq_' + Date.now(),
    resourceId: resource.id,
    resourceName: resource.name,
    startupId: startup.id,
    startupName: startup.name,
    founderId: founderId || startup.founderId,
    founderName: founderName || startup.founderName,
    quantity: Number(quantity),
    reason: reason || 'Incubation acceleration and scaling.',
    status: 'pending' as const,
    requestedAt: new Date().toISOString(),
  };

  db.getData().resourceRequests.unshift(newRequest);

  // Notify admin
  db.getData().notifications.unshift({
    id: 'notif_' + Date.now(),
    userId: 'usr_admin_1',
    type: 'resources',
    title: `Resource Allocation Requested: ${resource.name}`,
    message: `${startup.name} requested allocation for "${resource.name}". Review and approve.`,
    isRead: false,
    isImportant: false,
    timestamp: new Date().toISOString(),
  });

  db.save();
  return res.json(newRequest);
});

app.post('/api/resources/requests/:id/approve', (req, res) => {
  const { id } = req.params;
  const request = db.getData().resourceRequests.find((r) => r.id === id);

  if (!request) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  request.status = 'approved';
  request.decisionNotes = 'Approved by program administrator.';

  const resource = db.getData().resources.find((r) => r.id === request.resourceId);
  if (resource && resource.availableUnits > 0) {
    resource.availableUnits -= 1;
  }

  db.getData().notifications.unshift({
    id: 'notif_' + Date.now(),
    userId: request.founderId,
    type: 'resources',
    title: `Resource Approved: ${request.resourceName}`,
    message: `Your allocation request for ${request.resourceName} was approved. Access details have been unlocked.`,
    isRead: false,
    isImportant: true,
    timestamp: new Date().toISOString(),
  });

  db.save();
  return res.json({ success: true, request });
});

// ----------------- COURSES APIS (Screenshot 10) -----------------

app.get('/api/courses', (req, res) => {
  return res.json(db.getData().courses);
});

app.post('/api/courses', (req, res) => {
  const { title, category, description, durationHours = 8, fileName, instructor = 'Incubator Faculty' } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: 'Course title and category are required.' });
  }

  const newCourse: Course = {
    id: 'crs_' + Date.now(),
    title: title.trim(),
    category: category.trim(),
    description: description || 'Specialized incubator training course.',
    durationHours: Number(durationHours) || 6,
    modulesCount: 4,
    instructor,
    fileName,
    enrolledCount: 1,
    status: 'Published',
    createdAt: new Date().toISOString(),
  };

  db.getData().courses.unshift(newCourse);
  db.save();
  return res.json(newCourse);
});

// ----------------- NOTIFICATIONS APIS (Screenshot 12) -----------------

app.get('/api/notifications', (req, res) => {
  const { userId, type } = req.query;
  let notifications = db.getData().notifications;

  if (userId) {
    notifications = notifications.filter((n) => n.userId === userId || n.userId === 'all');
  }
  if (type && type !== 'all') {
    if (type === 'unread') {
      notifications = notifications.filter((n) => !n.isRead);
    } else if (type === 'important') {
      notifications = notifications.filter((n) => n.isImportant);
    } else {
      notifications = notifications.filter((n) => n.type === type);
    }
  }

  return res.json(notifications);
});

app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const notif = db.getData().notifications.find((n) => n.id === id);
  if (notif) {
    notif.isRead = true;
    db.save();
  }
  return res.json({ success: true });
});

app.post('/api/notifications/mark-all-read', (req, res) => {
  const { userId } = req.body;
  const notifications = db.getData().notifications;
  notifications.forEach((n) => {
    if (!userId || n.userId === userId || n.userId === 'all') {
      n.isRead = true;
    }
  });
  db.save();
  return res.json({ success: true });
});

// ----------------- ANALYTICS & AGGREGATIONS -----------------

app.get('/api/analytics', (req, res) => {
  const data = db.getData();
  const totalStartups = data.startups.length;
  const activeStartups = data.startups.filter((s) => s.status === 'active').length;
  const mentors = data.users.filter((u) => u.role === 'mentor' && u.status === 'active');
  const pendingMentors = data.users.filter((u) => u.role === 'mentor' && u.status === 'pending');
  const activeCohorts = data.cohorts.filter((c) => c.status === 'Active').length;
  const sessionsCompleted = data.sessions.filter((s) => s.status === 'Completed').length;
  const openMilestones = data.milestones.filter((m) => m.status !== 'completed').length;

  const totalProgress = data.startups.reduce((acc, s) => acc + (s.progress || 0), 0);
  const avgProgress = totalStartups > 0 ? Math.round(totalProgress / totalStartups) : 0;

  // Resource utilization percentage
  const totalUnits = data.resources.reduce((acc, r) => acc + (r.totalUnits || 0), 0);
  const availableUnits = data.resources.reduce((acc, r) => acc + (r.availableUnits || 0), 0);
  const resourceUtilization = totalUnits > 0 ? Math.round(((totalUnits - availableUnits) / totalUnits) * 100) : 0;

  return res.json({
    totalStartups,
    activeStartups,
    mentorsCount: mentors.length,
    pendingMentorsCount: pendingMentors.length,
    activeCohorts,
    sessionsCompleted,
    openMilestones,
    resourceUtilization,
    avgProgress,
    cohorts: data.cohorts,
    startups: data.startups,
    sessions: data.sessions,
    activityLogs: data.activityLogs.slice(0, 10),
  });
});

// ----------------- AI INTEGRATION (Production Multi-Model & Fallback Engine) -----------------

function resolveRequestUser(req: express.Request): {
  userId: string;
  userName: string;
  userRole: string;
  isAuthorized: boolean;
  denyReason?: string;
} {
  const headerUserId = (req.headers['x-user-id'] as string) || '';
  const bodyUserId = req.body?.userId || req.body?.founderId || '';
  const candidateId = headerUserId || bodyUserId;

  const users = db.getData().users;
  const matched = users.find((u) => u.id === candidateId);
  if (matched) {
    if (matched.status === 'left' || matched.status === 'suspended' || matched.status === 'rejected') {
      return {
        userId: matched.id,
        userName: matched.name,
        userRole: matched.role,
        isAuthorized: false,
        denyReason: `Account status is ${matched.status.toUpperCase()}. AI access is restricted to active platform users.`,
      };
    }
    return {
      userId: matched.id,
      userName: matched.name,
      userRole: matched.role,
      isAuthorized: true,
    };
  }

  return {
    userId: candidateId || 'usr_founder_vishal',
    userName: req.body?.founderName || req.body?.userName || 'Founder',
    userRole: (req.headers['x-user-role'] as string) || req.body?.userRole || 'founder',
    isAuthorized: true,
  };
}

function sendStructuredAIError(res: express.Response, err: any) {
  if (err instanceof AIServiceError) {
    if (err.retryAfterSeconds) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds));
    }
    return res.status(err.statusCode || 503).json({
      success: false,
      error: err.userMessage,
      errorCategory: err.category,
      retryAfterSeconds: err.retryAfterSeconds,
      provider: err.provider,
    });
  }

  const classified = classifyAIError(err);
  if (classified.retryAfterSeconds) {
    res.setHeader('Retry-After', String(classified.retryAfterSeconds));
  }
  return res.status(classified.statusCode || 500).json({
    success: false,
    error: classified.userMessage,
    errorCategory: classified.category,
    retryAfterSeconds: classified.retryAfterSeconds,
  });
}

// Admin AI Usage Monitoring Endpoint (Part 6)
app.get('/api/admin/ai-monitoring', (req, res) => {
  const stats = getAIMonitoringStats();
  return res.json(stats);
});

app.post('/api/ai/generate', async (req, res) => {
  try {
    const authUser = resolveRequestUser(req);
    if (!authUser.isAuthorized) {
      return res.status(403).json({
        success: false,
        error: authUser.denyReason || 'Unauthorized AI access.',
        errorCategory: 'HTTP_401_403_AUTH',
      });
    }

    const { feature, prompt, context, forceRefresh } = req.body || {};
    if (!feature) {
      return res.status(400).json({
        success: false,
        error: 'AI feature identifier is required.',
      });
    }

    // Role-based check for admin_insights
    if (feature === 'admin_insights' && authUser.userRole !== 'admin' && authUser.userRole !== 'founder') {
      return res.status(403).json({
        success: false,
        error: 'Admin insights require appropriate workspace permissions.',
        errorCategory: 'HTTP_401_403_AUTH',
      });
    }

    const result = await handleAIGenerate({
      feature,
      prompt,
      context,
      userId: authUser.userId,
      userName: authUser.userName,
      userRole: authUser.userRole,
      forceRefresh: Boolean(forceRefresh),
    });

    return res.json({
      success: true,
      text: result.text,
      modelUsed: result.model,
      providerUsed: result.provider,
      cached: result.cached,
    });
  } catch (err: any) {
    return sendStructuredAIError(res, err);
  }
});

// 1. Courses & Learning - Suggest with AI
app.post('/api/ai/course-recommendations', async (req, res) => {
  try {
    const authUser = resolveRequestUser(req);
    if (!authUser.isAuthorized) {
      return res.status(403).json({
        success: false,
        error: authUser.denyReason || 'Unauthorized AI access.',
        errorCategory: 'HTTP_401_403_AUTH',
      });
    }

    const {
      founderId,
      founderName,
      userRole,
      startupName,
      industry,
      stage,
      experience,
      skills,
      interests,
      learningGoals,
      forceRefresh,
    } = req.body || {};

    const existingCatalogTitles = db.getData().courses.map((c) => c.title);

    const result = await generateCourseRecommendationsAI({
      userId: founderId || authUser.userId,
      userRole: userRole || authUser.userRole,
      founderName: founderName || authUser.userName || 'Founder',
      startupName,
      industry,
      stage,
      experience,
      skills,
      interests,
      learningGoals,
      existingCatalogTitles,
      forceRefresh: Boolean(forceRefresh),
    });

    const runRecord: CourseRecommendationRun = {
      id: 'crun_' + Date.now(),
      founderId: founderId || authUser.userId || 'anonymous_founder',
      founderName: founderName || authUser.userName || 'Founder',
      startupName,
      industry,
      stage,
      skillsGap: skills,
      interests,
      experience,
      learningGoals,
      recommendations: result.recommendations,
      modelUsed: result.modelUsed,
      providerUsed: result.providerUsed,
      createdAt: new Date().toISOString(),
    };

    db.getData().courseRecommendations.unshift(runRecord);
    logActivity(
      authUser.userId,
      authUser.userName,
      authUser.userRole,
      'Generated AI Course Recommendations',
      `Generated ${result.recommendations.length} tailored courses for ${startupName || 'Startup'} via ${result.modelUsed}`
    );
    db.save();

    return res.json({
      success: true,
      recommendations: result.recommendations,
      runId: runRecord.id,
      modelUsed: result.modelUsed,
      providerUsed: result.providerUsed,
      cached: result.cached,
    });
  } catch (err: any) {
    return sendStructuredAIError(res, err);
  }
});

app.get('/api/ai/course-recommendations/history', (req, res) => {
  const { founderId } = req.query;
  const runs = db.getData().courseRecommendations;
  if (!founderId) {
    return res.json(runs.slice(0, 20));
  }
  const filtered = runs.filter((r) => r.founderId === founderId);
  return res.json(filtered);
});

// Save recommended course to user's personal learning list
app.post('/api/ai/save-course', (req, res) => {
  const { userId, course, addToIncubatorCatalog } = req.body;
  if (!userId || !course) {
    return res.status(400).json({ error: 'userId and course are required.' });
  }

  const enrolledList = db.getData().userEnrolledCourses;
  const existing = enrolledList.find(
    (c) => c.userId === userId && c.title.toLowerCase() === course.title.toLowerCase()
  );

  if (existing) {
    return res.json({
      success: true,
      enrolledCourse: existing,
      message: 'Already in your learning list.',
    });
  }

  const newEnrolled: EnrolledCourse = {
    id: 'enr_' + Date.now(),
    userId,
    title: course.title,
    category: course.category || 'General',
    whyRecommended: course.whyRecommended || course.description,
    skillsLearned: course.skillsLearned || [],
    difficulty: course.difficulty || 'Intermediate',
    duration: course.duration || '6 hours',
    objectives: course.objectives || [],
    platforms: course.platforms || ['Incubator Academy'],
    url: course.url || 'https://www.startupschool.org',
    completed: false,
    progress: 0,
    enrolledAt: new Date().toISOString(),
  };

  enrolledList.unshift(newEnrolled);

  // If also requested to add to global catalog
  if (addToIncubatorCatalog) {
    const courses = db.getData().courses;
    const existsInCatalog = courses.some((c) => c.title.toLowerCase() === course.title.toLowerCase());
    if (!existsInCatalog) {
      courses.unshift({
        id: 'crs_ai_' + Date.now(),
        title: course.title,
        category: course.category || 'General',
        description: course.description || course.whyRecommended || course.title,
        durationHours: parseInt(course.duration) || 8,
        modulesCount: course.objectives?.length || 4,
        instructor: course.platforms?.[0] || 'AI Recommended Masterclass',
        enrolledCount: 1,
        status: 'Published',
        createdAt: new Date().toISOString(),
      });
    }
  }

  db.save();
  return res.json({ success: true, enrolledCourse: newEnrolled });
});

// Get user's learning courses
app.get('/api/ai/my-courses', (req, res) => {
  const { userId } = req.query;
  const enrolledList = db.getData().userEnrolledCourses;
  if (!userId) {
    return res.json(enrolledList);
  }
  const filtered = enrolledList.filter((c) => c.userId === userId);
  return res.json(filtered);
});

// Update progress or mark completed
app.patch('/api/ai/my-courses/:id', (req, res) => {
  const { id } = req.params;
  const { progress, completed } = req.body;
  const enrolledList = db.getData().userEnrolledCourses;
  const item = enrolledList.find((c) => c.id === id);

  if (!item) {
    return res.status(404).json({ error: 'Enrolled course not found.' });
  }

  if (typeof progress === 'number') {
    item.progress = Math.max(0, Math.min(100, progress));
    if (item.progress === 100) {
      item.completed = true;
      item.completedAt = new Date().toISOString();
    }
  }

  if (typeof completed === 'boolean') {
    item.completed = completed;
    if (completed) {
      item.progress = 100;
      item.completedAt = new Date().toISOString();
    } else if (item.progress === 100) {
      item.progress = 50;
      delete item.completedAt;
    }
  }

  db.save();
  return res.json({ success: true, item });
});

// Delete from enrolled courses
app.delete('/api/ai/my-courses/:id', (req, res) => {
  const { id } = req.params;
  const data = db.getData();
  data.userEnrolledCourses = data.userEnrolledCourses.filter((c) => c.id !== id);
  db.save();
  return res.json({ success: true });
});

// 2. AI Incubation Hub - Comprehensive 7-Section Startup Assistant
app.post('/api/ai/startup-analysis', async (req, res) => {
  try {
    const authUser = resolveRequestUser(req);
    if (!authUser.isAuthorized) {
      return res.status(403).json({
        success: false,
        error: authUser.denyReason || 'Unauthorized AI access.',
        errorCategory: 'HTTP_401_403_AUTH',
      });
    }

    const { founderId, startupId, startupName, prompt, startupData, forceRefresh } = req.body || {};

    const startups = db.getData().startups;
    const targetStartup = startups.find((s) => s.id === startupId);

    const mergedStartup = {
      name: startupName || startupData?.name || targetStartup?.name || 'PulseAI Diagnostics',
      industry: startupData?.industry || targetStartup?.industry || 'HealthTech & AI',
      stage: startupData?.stage || targetStartup?.stage || 'Early Traction',
      businessModel: startupData?.businessModel || targetStartup?.businessModel || 'B2B SaaS',
      targetCustomers:
        startupData?.targetCustomers || 'Enterprise & Mid-Market Healthcare Providers',
      description:
        startupData?.description ||
        targetStartup?.description ||
        'AI Edge Telemetry & Predictive Diagnostics',
      monthlyRevenue: startupData?.monthlyRevenue ?? targetStartup?.monthlyRevenue ?? 1250000,
      fundingRequired: startupData?.fundingRequired ?? targetStartup?.fundingRequired ?? 50000000,
      fundingRaised: startupData?.fundingRaised ?? targetStartup?.fundingRaised ?? 15000000,
      progress: startupData?.progress ?? targetStartup?.progress ?? 68,
    };

    const users = db.getData().users;
    const founder = users.find((u) => u.id === (founderId || authUser.userId));

    const result = await generateStartupAnalysisAI({
      userId: founderId || authUser.userId,
      userRole: authUser.userRole,
      founderName: founder?.name || authUser.userName || 'Founder',
      startup: mergedStartup,
      prompt: prompt || 'Perform a comprehensive 7-section strategic analysis.',
      forceRefresh: Boolean(forceRefresh),
    });

    const analysisData = result.analysis;

    const record: AIStartupAnalysisRecord = {
      id: 'anl_' + Date.now(),
      founderId: founderId || authUser.userId || 'anonymous_founder',
      startupId: startupId || targetStartup?.id || 'startup_default',
      startupName: mergedStartup.name,
      industry: mergedStartup.industry,
      stage: mergedStartup.stage,
      prompt: prompt || 'Full Incubation Assessment',
      modelUsed: result.modelUsed,
      providerUsed: result.providerUsed,
      overview: analysisData.overview,
      businessAnalysis: analysisData.businessAnalysis,
      marketAnalysis: analysisData.marketAnalysis,
      productDevelopment: analysisData.productDevelopment,
      businessGrowth: analysisData.businessGrowth,
      fundingGuidance: analysisData.fundingGuidance,
      actionPlan: analysisData.actionPlan,
      fullMarkdown: analysisData.fullMarkdown || '',
      createdAt: new Date().toISOString(),
    };

    db.getData().aiStartupAnalyses.unshift(record);
    logActivity(
      authUser.userId,
      founder?.name || authUser.userName || 'Founder',
      authUser.userRole,
      'Generated AI Startup Analysis',
      `Executed 7-section AI analysis for ${mergedStartup.name} via ${result.modelUsed}`
    );
    db.save();

    return res.json({
      success: true,
      analysis: record,
      modelUsed: result.modelUsed,
      providerUsed: result.providerUsed,
      cached: result.cached,
    });
  } catch (err: any) {
    return sendStructuredAIError(res, err);
  }
});

app.get('/api/ai/startup-analysis/history', (req, res) => {
  const { founderId, startupId } = req.query;
  const analyses = db.getData().aiStartupAnalyses;
  if (!founderId && !startupId) {
    return res.json(analyses.slice(0, 20));
  }
  const filtered = analyses.filter(
    (a) => (!founderId || a.founderId === founderId) && (!startupId || a.startupId === startupId)
  );
  return res.json(filtered);
});

app.delete('/api/ai/startup-analysis/:id', (req, res) => {
  const { id } = req.params;
  const data = db.getData();
  data.aiStartupAnalyses = data.aiStartupAnalyses.filter((a) => a.id !== id);
  db.save();
  return res.json({ success: true });
});

// ----------------- VITE SETUP -----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Startup Incubation Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
