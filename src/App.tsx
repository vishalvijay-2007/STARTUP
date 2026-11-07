import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout, ActiveTab } from './components/layout/AppLayout';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { LandingPage } from './components/landing/LandingPage';
import { FounderDashboard } from './components/dashboards/FounderDashboard';
import { MentorDashboard } from './components/dashboards/MentorDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { StartupsPage } from './components/pages/StartupsPage';
import { CohortsPage } from './components/pages/CohortsPage';
import { MentorsPage } from './components/pages/MentorsPage';
import { MentorSessionsPage } from './components/pages/MentorSessionsPage';
import { MilestonesPage } from './components/pages/MilestonesPage';
import { ResourcesPage } from './components/pages/ResourcesPage';
import { CoursesPage } from './components/pages/CoursesPage';
import { AnalyticsPage } from './components/pages/AnalyticsPage';
import { AIHubPage } from './components/pages/AIHubPage';
import { NotificationsPage } from './components/pages/NotificationsPage';
import { SettingsPage } from './components/pages/SettingsPage';
import {
  Startup,
  Cohort,
  MentorSession,
  Milestone,
  Resource,
  ResourceRequest,
  Course,
  NotificationItem,
  User,
  UserRole,
} from './types';

type AppView = 'landing' | 'login' | 'register' | 'workspace';

const getInitialView = (): { view: AppView; roleHint: UserRole } => {
  const path = window.location.pathname.toLowerCase();
  if (path === '/login' || path === '/signin' || path === '/auth') {
    return { view: 'login', roleHint: 'founder' };
  }
  if (path === '/auth/founder') {
    return { view: 'login', roleHint: 'founder' };
  }
  if (path === '/auth/mentor') {
    return { view: 'login', roleHint: 'mentor' };
  }
  if (path === '/auth/admin') {
    return { view: 'login', roleHint: 'admin' };
  }
  if (path === '/register' || path === '/signup') {
    return { view: 'register', roleHint: 'founder' };
  }
  if (path.includes('/dashboard') || path === '/workspace') {
    return { view: 'workspace', roleHint: 'founder' };
  }
  // REQUIREMENT 1: Public Landing Page MUST ALWAYS open first!
  return { view: 'landing', roleHint: 'founder' };
};

function MainApplication() {
  const { user } = useAuth();
  const [initial] = useState(() => getInitialView());
  const [currentView, setCurrentView] = useState<AppView>(() => {
    // If user is not logged in and tried to directly access workspace, fallback to login
    if (initial.view === 'workspace' && !user) return 'login';
    return initial.view;
  });
  const [authRoleHint, setAuthRoleHint] = useState<UserRole>(initial.roleHint);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Application Data States
  const [startups, setStartups] = useState<Startup[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [mentors, setMentors] = useState<User[]>([]);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [analytics, setAnalytics] = useState({
    resourceUtilization: 35,
    avgProgress: 57,
  });

  // Navigation function with browser history syncing
  const navigateTo = useCallback((view: AppView, role?: UserRole, updateHistory = true) => {
    let targetPath = '/';
    if (view === 'landing') {
      targetPath = '/';
    } else if (view === 'login') {
      targetPath = role ? `/auth/${role}` : '/auth';
    } else if (view === 'register') {
      targetPath = role ? `/register/${role}` : '/register';
    } else if (view === 'workspace') {
      const activeRole = user?.role || role || 'founder';
      targetPath = `/${activeRole}/dashboard`;
    }

    if (role) {
      setAuthRoleHint(role);
    }

    setCurrentView(view);

    if (updateHistory && window.location.pathname !== targetPath) {
      window.history.pushState({ view, role }, '', targetPath);
    }
  }, [user]);

  // Handle browser back and forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const state = getInitialView();
      if (state.view === 'workspace' && !user) {
        setCurrentView('login');
        setAuthRoleHint(state.roleHint);
      } else {
        setCurrentView(state.view);
        setAuthRoleHint(state.roleHint);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Handle user logout transition from protected workspace
  useEffect(() => {
    if (!user && currentView === 'workspace') {
      navigateTo('landing', undefined, true);
    }
  }, [user, currentView, navigateTo]);

  // Fetch all database records from server
  const loadWorkspaceData = useCallback(async () => {
    try {
      const [
        startupsRes,
        cohortsRes,
        mentorsRes,
        sessionsRes,
        milestonesRes,
        resourcesRes,
        resourceRequestsRes,
        coursesRes,
        notificationsRes,
        analyticsRes,
      ] = await Promise.all([
        fetch('/api/startups').then((r) => r.json()),
        fetch('/api/cohorts').then((r) => r.json()),
        fetch('/api/mentors').then((r) => r.json()),
        fetch('/api/sessions').then((r) => r.json()),
        fetch('/api/milestones').then((r) => r.json()),
        fetch('/api/resources').then((r) => r.json()),
        fetch('/api/resources/requests').then((r) => r.json()),
        fetch('/api/courses').then((r) => r.json()),
        fetch('/api/notifications').then((r) => r.json()),
        fetch('/api/analytics').then((r) => r.json()),
      ]);

      if (Array.isArray(startupsRes)) setStartups(startupsRes);
      if (Array.isArray(cohortsRes)) setCohorts(cohortsRes);
      if (Array.isArray(mentorsRes)) setMentors(mentorsRes);
      if (Array.isArray(sessionsRes)) setSessions(sessionsRes);
      if (Array.isArray(milestonesRes)) setMilestones(milestonesRes);
      if (Array.isArray(resourcesRes)) setResources(resourcesRes);
      if (Array.isArray(resourceRequestsRes)) setResourceRequests(resourceRequestsRes);
      if (Array.isArray(coursesRes)) setCourses(coursesRes);
      if (Array.isArray(notificationsRes)) setNotifications(notificationsRes);
      if (analyticsRes) {
        setAnalytics({
          resourceUtilization: analyticsRes.resourceUtilization || 35,
          avgProgress: analyticsRes.avgProgress || 57,
        });
      }
    } catch (err) {
      console.error('Failed to load incubator workspace data:', err);
    }
  }, []);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Action handlers
  const handleAddStartup = async (startupData: Partial<Startup>) => {
    try {
      const res = await fetch('/api/startups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...startupData,
          founderId: user?.id,
          founderName: user?.name,
          founderEmail: user?.email,
        }),
      });
      if (res.ok) {
        loadWorkspaceData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteStartup = async (id: string) => {
    try {
      const res = await fetch(`/api/startups/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStartups((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCohort = async (data: Partial<Cohort>) => {
    try {
      const res = await fetch('/api/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) loadWorkspaceData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMentor = async (data: Partial<User>) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, role: 'mentor' }),
      });
      if (res.ok) loadWorkspaceData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveMentor = async (mentorId: string) => {
    try {
      const res = await fetch(`/api/mentors/${mentorId}/approve`, { method: 'POST' });
      if (res.ok) loadWorkspaceData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectMentor = async (mentorId: string) => {
    try {
      const res = await fetch(`/api/mentors/${mentorId}/reject`, { method: 'POST' });
      if (res.ok) loadWorkspaceData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignMentor = async (startupId: string, mentorId: string) => {
    try {
      const res = await fetch('/api/mentors/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId, mentorId }),
      });
      if (res.ok) loadWorkspaceData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSession = async (data: Partial<MentorSession>) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) loadWorkspaceData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteSession = async (id: string, feedback: string, rating: number) => {
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed', feedback, rating }),
      });
      if (res.ok) loadWorkspaceData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMilestone = async (data: Partial<Milestone>) => {
    try {
      const res = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) loadWorkspaceData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleMilestone = async (id: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/milestones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: completed ? 'completed' : 'in-progress' }),
      });
      if (res.ok) loadWorkspaceData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddResource = async (data: Partial<Resource>) => {
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) loadWorkspaceData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestResource = async (resourceId: string, startupId: string, reason: string) => {
    try {
      const res = await fetch('/api/resources/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId,
          startupId,
          founderId: user?.id,
          founderName: user?.name,
          reason,
        }),
      });
      if (res.ok) loadWorkspaceData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveResourceRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/resources/requests/${requestId}/approve`, { method: 'POST' });
      if (res.ok) loadWorkspaceData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCourse = async (courseData: Partial<Course>) => {
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...courseData, instructor: user?.name || 'Incubator Faculty' }),
      });
      if (res.ok) loadWorkspaceData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkNotifAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllNotifsAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // Views routing
  if (currentView === 'landing') {
    return (
      <LandingPage
        onGoToLogin={(role) => navigateTo('login', role)}
        onGoToRegister={(role) => navigateTo('register', role)}
        onEnterWorkspace={() => {
          if (user) {
            navigateTo('workspace', user.role);
          } else {
            navigateTo('login');
          }
        }}
      />
    );
  }

  if (currentView === 'login') {
    return (
      <LoginPage
        onSuccess={(loggedUser) => {
          navigateTo('workspace', loggedUser.role);
          setActiveTab('dashboard');
        }}
        onSwitchToRegister={(role) => {
          navigateTo('register', role);
        }}
        onGoToLanding={() => navigateTo('landing')}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <RegisterPage
        initialRole={authRoleHint}
        onSuccess={(regUser) => {
          navigateTo('workspace', regUser.role);
          setActiveTab('dashboard');
        }}
        onSwitchToLogin={(role) => {
          navigateTo('login', role);
        }}
        onGoToLanding={() => navigateTo('landing')}
      />
    );
  }

  // Active Workspace Role Dashboard selector
  // Strict redirection: Admin -> Admin Dashboard, Mentor -> Mentor Dashboard, Founder -> Founder Dashboard
  const renderDashboardByRole = () => {
    if (user?.role === 'admin') {
      return (
        <AdminDashboard
          startups={startups}
          cohorts={cohorts}
          mentors={mentors}
          sessions={sessions}
          resourceRequests={resourceRequests}
          resources={resources}
          onApproveMentor={handleApproveMentor}
          onRejectMentor={handleRejectMentor}
          onAssignMentor={handleAssignMentor}
          onApproveResourceRequest={handleApproveResourceRequest}
          onNavigate={(tab) => setActiveTab(tab)}
          onRefreshWorkspace={loadWorkspaceData}
        />
      );
    }

    if (user?.role === 'mentor') {
      return (
        <MentorDashboard
          startups={startups}
          sessions={sessions}
          milestones={milestones}
          onNavigate={(tab) => setActiveTab(tab)}
          onOpenScheduleSession={() => setActiveTab('sessions')}
          onAddSession={handleAddSession}
          onSubmitFeedback={handleCompleteSession}
        />
      );
    }

    // Default to Founder Dashboard
    return (
      <FounderDashboard
        startups={startups}
        sessions={sessions}
        cohorts={cohorts}
        milestones={milestones}
        mentorsCount={mentors.filter((m) => m.status === 'active').length}
        resourceUtilization={analytics.resourceUtilization}
        avgProgress={analytics.avgProgress}
        onRefresh={loadWorkspaceData}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenAddStartup={() => setActiveTab('startups')}
        onOpenAddSession={() => setActiveTab('sessions')}
      />
    );
  };

  // Enforce Requirement 3 & 5: LEFT, SUSPENDED, PENDING, and REJECTED Mentors cannot access any protected Mentor pages
  const isRestrictedMentor = user?.role === 'mentor' && user?.status !== 'active';

  return (
    <AppLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onOpenAddStartup={() => setActiveTab('startups')}
      unreadCount={notifications.filter((n) => !n.isRead).length}
      onGoToLanding={() => navigateTo('landing')}
    >
      {isRestrictedMentor ? (
        <MentorDashboard
          startups={startups}
          sessions={sessions}
          milestones={milestones}
          onNavigate={(tab) => setActiveTab(tab)}
          onOpenScheduleSession={() => setActiveTab('sessions')}
          onAddSession={handleAddSession}
          onSubmitFeedback={handleCompleteSession}
        />
      ) : (
        <>
          {activeTab === 'dashboard' && renderDashboardByRole()}

          {activeTab === 'startups' && (
            <StartupsPage
              startups={startups}
              cohorts={cohorts}
              mentors={mentors.filter((m) => m.status === 'active')}
              onAddStartup={handleAddStartup}
              onDeleteStartup={handleDeleteStartup}
            />
          )}

          {activeTab === 'cohorts' && (
            <CohortsPage
              cohorts={cohorts}
              startups={startups}
              onAddCohort={handleAddCohort}
            />
          )}

          {activeTab === 'mentors' && (
            <MentorsPage
              mentors={mentors.filter((m) => m.status === 'active')}
              startups={startups}
              onOpenScheduleSession={() => setActiveTab('sessions')}
              onAddSession={handleAddSession}
              onAddMentor={handleAddMentor}
            />
          )}

          {activeTab === 'sessions' && (
            <MentorSessionsPage
              sessions={sessions}
              startups={startups}
              mentors={mentors.filter((m) => m.status === 'active')}
              onAddSession={handleAddSession}
              onCompleteSession={handleCompleteSession}
            />
          )}

          {activeTab === 'milestones' && (
            <MilestonesPage
              milestones={milestones}
              startups={startups}
              onAddMilestone={handleAddMilestone}
              onToggleMilestone={handleToggleMilestone}
            />
          )}

          {activeTab === 'resources' && (
            <ResourcesPage
              resources={resources}
              resourceRequests={resourceRequests}
              startups={startups}
              onAddResource={handleAddResource}
              onRequestResource={handleRequestResource}
            />
          )}

          {activeTab === 'courses' && (
            <CoursesPage
              courses={courses}
              startups={startups}
              onAddCourse={handleAddCourse}
              onRefresh={loadWorkspaceData}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage
              startups={startups}
              cohorts={cohorts}
              sessions={sessions}
              milestones={milestones}
              mentorsCount={mentors.filter((m) => m.status === 'active').length}
              resourceUtilization={analytics.resourceUtilization}
              avgProgress={analytics.avgProgress}
              onRefresh={loadWorkspaceData}
            />
          )}

          {activeTab === 'ai-insights' && (
            <AIHubPage startups={startups} mentors={mentors.filter((m) => m.status === 'active')} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsPage
              notifications={notifications}
              onMarkAsRead={handleMarkNotifAsRead}
              onMarkAllAsRead={handleMarkAllNotifsAsRead}
              onRefresh={loadWorkspaceData}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'settings' && <SettingsPage />}
        </>
      )}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApplication />
    </AuthProvider>
  );
}
