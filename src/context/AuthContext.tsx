import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password?: string, role?: UserRole) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    username: string;
    password?: string;
    role: UserRole;
    adminKey?: string;
    bio?: string;
    company?: string;
    title?: string;
    phone?: string;
    yearsExperience?: number;
    qualifications?: string;
    startupName?: string;
    industry?: string;
    expertise?: string[];
  }) => Promise<{ success: boolean; user?: User; error?: string; isPendingApproval?: boolean; message?: string }>;
  loginWithGoogle: (
    role?: UserRole,
    customEmail?: string,
    customName?: string,
    adminKey?: string,
    credential?: string
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; resetToken?: string; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  switchRole: (role: UserRole) => void;
  updateProfile: (updated: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('incubator_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('incubator_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('incubator_user');
    }
  }, [user]);

  // Periodically verify live account status from server so offboarded/suspended mentors immediately lose access
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    const syncLiveUser = async () => {
      try {
        const res = await fetch(`/api/auth/me?userId=${encodeURIComponent(user.id)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data?.user) {
          if (
            data.user.status !== user.status ||
            data.user.sessionVersion !== user.sessionVersion ||
            data.user.name !== user.name
          ) {
            setUser(data.user);
            localStorage.setItem('incubator_user', JSON.stringify(data.user));
          }
        }
      } catch {
        // ignore network hiccup
      }
    };
    syncLiveUser();
    const timer = setInterval(syncLiveUser, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [user?.id, user?.status, user?.sessionVersion, user?.name]);

  const login = async (username: string, password = '', role?: UserRole) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await res.json();
      setIsLoading(false);
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed' };
      }

      setUser(data.user);
      localStorage.setItem('incubator_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Network connection failed' };
    }
  };

  const register = async (formData: {
    name: string;
    email: string;
    username: string;
    password?: string;
    role: UserRole;
    adminKey?: string;
    bio?: string;
    company?: string;
    title?: string;
    phone?: string;
    yearsExperience?: number;
    qualifications?: string;
    startupName?: string;
    industry?: string;
    expertise?: string[];
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setIsLoading(false);
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed', status: data.status };
      }

      if (data.pendingApproval) {
        return {
          success: false,
          isPendingApproval: true,
          message: data.message || 'Your Mentor application is currently under review. You will receive access once the Admin approves your application.',
          error: data.message || 'Your Mentor application is currently under review. You will receive access once the Admin approves your application.',
        };
      }

      setUser(data.user);
      localStorage.setItem('incubator_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Network connection failed' };
    }
  };

  const loginWithGoogle = async (
    role: UserRole = 'founder',
    customEmail?: string,
    customName?: string,
    adminKey?: string,
    credential?: string
  ) => {
    setIsLoading(true);
    try {
      const defaultEmail =
        role === 'admin'
          ? 'admin@startupincubator.io'
          : role === 'mentor'
          ? 'sarah.chen@stanford.edu'
          : 'vishalvijay135@gmail.com';

      const defaultName =
        role === 'admin'
          ? 'Incubator Director'
          : role === 'mentor'
          ? 'Dr. Sarah Chen'
          : 'vishal';

      const emailToUse = customEmail || defaultEmail;
      const nameToUse = customName || defaultName;

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential,
          email: emailToUse,
          name: nameToUse,
          role,
          adminKey,
          avatar: '/assets/default-avatar.png',
        }),
      });

      const data = await res.json();
      setIsLoading(false);
      if (!res.ok) {
        return { success: false, error: data.error || 'Google login failed', status: data.status };
      }

      if (data.pendingApproval) {
        return {
          success: false,
          isPendingApproval: true,
          error: data.message || 'Your Mentor application is currently under review. You will receive access once the Admin approves your application.',
        };
      }

      setUser(data.user);
      localStorage.setItem('incubator_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Google authentication error' };
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setIsLoading(false);
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to process request.' };
      }
      return { success: true, message: data.message, resetToken: data.resetToken };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Network error occurred.' };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      setIsLoading(false);
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to reset password.' };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Network error occurred.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('incubator_user');
    setUser(null);
  };

  const switchRole = async (targetRole: UserRole) => {
    const targetId =
      targetRole === 'admin'
        ? 'usr_admin_1'
        : targetRole === 'mentor'
        ? 'usr_mentor_sarah'
        : 'usr_founder_vishal';

    try {
      const res = await fetch(`/api/auth/me?userId=${encodeURIComponent(targetId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem('incubator_user', JSON.stringify(data.user));
          return;
        }
      }
    } catch {
      // fallback below
    }

    if (targetRole === 'admin') {
      const adminUser: User = {
        id: 'usr_admin_1',
        name: 'Incubator Director',
        email: 'admin@startupincubator.io',
        username: 'admin',
        role: 'admin',
        avatar: '/assets/default-avatar.png',
        status: 'active',
        bio: 'Managing Partner & Program Director at Global Venture Studio.',
        title: 'Program Director',
        company: 'Apex Incubator',
        createdAt: '2025-11-01T08:00:00Z',
      };
      setUser(adminUser);
      localStorage.setItem('incubator_user', JSON.stringify(adminUser));
    } else if (targetRole === 'mentor') {
      const mentorUser: User = {
        id: 'usr_mentor_sarah',
        name: 'Dr. Sarah Chen',
        email: 'sarah.chen@stanford.edu',
        username: 'sarahchen',
        role: 'mentor',
        avatar: '/assets/default-avatar.png',
        status: 'active',
        bio: 'Ex-VP AI Engineering at Google Cloud, Venture Partner, 15+ years scaling B2B & DeepTech SaaS.',
        title: 'Venture Partner & Tech Mentor',
        company: 'Horizon Ventures',
        expertise: ['B2B SaaS', 'AI & Machine Learning', 'Product Strategy', 'Series A Pitching'],
        yearsExperience: 16,
        linkedIn: 'https://linkedin.com/in/sarahchen-ai',
        createdAt: '2025-12-01T09:00:00Z',
      };
      setUser(mentorUser);
      localStorage.setItem('incubator_user', JSON.stringify(mentorUser));
    } else {
      const founderUser: User = {
        id: 'usr_founder_vishal',
        name: 'vishal',
        email: 'vishalvijay135@gmail.com',
        username: 'vijaynisha123',
        role: 'founder',
        avatar: '/assets/default-avatar.png',
        status: 'active',
        bio: 'Founder building next-gen AI startup tools & healthcare diagnostics.',
        title: 'Founder & CEO',
        company: 'PulseAI Diagnostics',
        createdAt: '2026-01-10T10:00:00Z',
      };
      setUser(founderUser);
      localStorage.setItem('incubator_user', JSON.stringify(founderUser));
    }
  };

  const updateProfile = async (updated: Partial<User>) => {
    if (!user) return false;
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...updated }),
      });
      if (res.ok) {
        setUser((prev) => {
          if (!prev) return null;
          const next = { ...prev, ...updated };
          localStorage.setItem('incubator_user', JSON.stringify(next));
          return next;
        });
        return true;
      }
      return false;
    } catch {
      setUser((prev) => {
        if (!prev) return null;
        const next = { ...prev, ...updated };
        localStorage.setItem('incubator_user', JSON.stringify(next));
        return next;
      });
      return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        forgotPassword,
        resetPassword,
        switchRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
