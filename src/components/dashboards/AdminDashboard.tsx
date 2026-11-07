import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Building2,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Package,
  Layers,
  Clock,
  AlertCircle,
  UserCheck,
  UserX,
  Search,
  Filter,
  Eye,
  RefreshCw,
  ExternalLink,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Award,
  Bell,
  Activity,
  UserPlus,
  Ban,
  Check,
  MessageSquare,
  ChevronRight,
  X,
  Edit3,
  LogOut,
  RotateCcw,
  Star,
  History,
  FileText,
  ArrowLeftRight,
} from 'lucide-react';
import {
  Startup,
  Cohort,
  MentorSession,
  User,
  ResourceRequest,
  Resource,
  MentorOffboardingDetails,
  MentorAuditHistoryItem,
} from '../../types';
import { formatINR } from '../../utils/currency';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../common/UserAvatar';

interface AdminDashboardProps {
  startups: Startup[];
  cohorts: Cohort[];
  mentors: User[];
  sessions: MentorSession[];
  resourceRequests: ResourceRequest[];
  resources: Resource[];
  onApproveMentor?: (mentorId: string) => void;
  onRejectMentor?: (mentorId: string) => void;
  onAssignMentor: (startupId: string, mentorId: string) => void;
  onApproveResourceRequest: (requestId: string) => void;
  onNavigate: (tab: any) => void;
  onRefreshWorkspace?: () => void;
}

interface EnrichedFounder {
  id: string;
  name: string;
  email: string;
  username: string;
  phone: string;
  avatar: string;
  status: 'active' | 'suspended';
  startupName: string;
  startupIndustry: string;
  startupStage: string;
  fundingRaised: number;
  monthlyRevenue: number;
  bio: string;
  company: string;
  title: string;
  registrationDate: string;
  lastLogin: string;
}

interface EnrichedMentorApp {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  company: string;
  yearsExperience: number;
  expertise: string[];
  qualifications: string;
  bio: string;
  linkedIn?: string;
  avatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface EnrichedMentor {
  id: string;
  name: string;
  email: string;
  username: string;
  phone: string;
  avatar: string;
  status: 'active' | 'pending' | 'suspended' | 'rejected' | 'left';
  title: string;
  company: string;
  yearsExperience: number;
  expertise: string[];
  bio: string;
  linkedIn?: string;
  joiningDate: string;
  assignedStartups: { id: string; name: string; industry: string; stage: string; founderName: string }[];
  assignedStartupsCount: number;
  assignedCohorts: { id: string; name: string; status?: string; batchCode?: string }[];
  assignedCohortsCount: number;
  activeSessions: {
    id: string;
    startupId: string;
    startupName: string;
    topic: string;
    date: string;
    time: string;
    duration: string;
    status: string;
  }[];
  activeSessionsCount: number;
  completedSessions: {
    id: string;
    startupId: string;
    startupName: string;
    topic: string;
    date: string;
    time: string;
    duration: string;
    status: string;
    notes?: string;
    rating?: number;
    feedback?: string;
  }[];
  completedSessionsCount: number;
  averageRating: number | null;
  studentFeedback: {
    sessionId: string;
    startupName: string;
    topic: string;
    date: string;
    rating?: number;
    feedback: string;
  }[];
  mentorshipHistoryStartups: { id: string; name: string; industry: string; stage: string }[];
  offboardingDetails?: MentorOffboardingDetails;
  offboardingHistory: MentorAuditHistoryItem[];
  auditLogs?: ActivityLogItem[];
  createdAt: string;
  lastLogin: string;
}

interface DashboardStats {
  totalFounders: number;
  totalMentors: number;
  activeMentors?: number;
  approvedMentors: number;
  pendingMentorApplications: number;
  suspendedMentors?: number;
  mentorsWhoLeft?: number;
  rejectedApplications: number;
  newRegistrations: number;
  totalStartups: number;
  totalCohorts: number;
}

interface ActivityLogItem {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  startups,
  cohorts,
  resourceRequests,
  onApproveMentor,
  onRejectMentor,
  onAssignMentor,
  onApproveResourceRequest,
  onNavigate,
  onRefreshWorkspace,
}) => {
  const { user } = useAuth();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    'overview' | 'founders' | 'approval-requests' | 'mentors' | 'activity' | 'notifications' | 'pairing' | 'ai-monitoring'
  >('overview');
  const [aiMonitoring, setAiMonitoring] = useState<any>(null);

  // Real backend data states
  const [stats, setStats] = useState<DashboardStats>({
    totalFounders: 0,
    totalMentors: 0,
    activeMentors: 0,
    approvedMentors: 0,
    pendingMentorApplications: 0,
    suspendedMentors: 0,
    mentorsWhoLeft: 0,
    rejectedApplications: 0,
    newRegistrations: 0,
    totalStartups: startups.length,
    totalCohorts: cohorts.length,
  });
  const [foundersList, setFoundersList] = useState<EnrichedFounder[]>([]);
  const [applicationsList, setApplicationsList] = useState<EnrichedMentorApp[]>([]);
  const [allMentorsList, setAllMentorsList] = useState<EnrichedMentor[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');

  // Pairing inputs
  const [selectedStartupForPairing, setSelectedStartupForPairing] = useState<string>('');
  const [selectedMentorForPairing, setSelectedMentorForPairing] = useState<string>('');

  // Search & Filters - Founders
  const [founderSearch, setFounderSearch] = useState('');
  const [founderStatusFilter, setFounderStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [founderDateFilter, setFounderDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');

  // Search & Filters - Mentor Applications
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Search & Filters - Mentor Management
  const [mentorSearch, setMentorSearch] = useState('');
  const [mentorStatusFilter, setMentorStatusFilter] = useState<
    'all' | 'active' | 'pending' | 'suspended' | 'left' | 'rejected'
  >('all');
  const [mentorJoinedFrom, setMentorJoinedFrom] = useState('');
  const [mentorJoinedTo, setMentorJoinedTo] = useState('');
  const [mentorLeftFrom, setMentorLeftFrom] = useState('');
  const [mentorLeftTo, setMentorLeftTo] = useState('');

  // Modals - Founders & Applications
  const [viewingFounder, setViewingFounder] = useState<EnrichedFounder | null>(null);
  const [viewingApp, setViewingApp] = useState<EnrichedMentorApp | null>(null);
  const [rejectingApp, setRejectingApp] = useState<EnrichedMentorApp | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Modals - Mentor Lifecycle & Offboarding System
  const [viewingMentorDetails, setViewingMentorDetails] = useState<EnrichedMentor | null>(null);
  const [mentorDetailsTab, setMentorDetailsTab] = useState<
    'overview' | 'assignments' | 'sessions' | 'feedback' | 'audit'
  >('overview');

  const [editingMentor, setEditingMentor] = useState<EnrichedMentor | null>(null);
  const [editMentorForm, setEditMentorForm] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    company: '',
    yearsExperience: 5,
    expertiseText: '',
    joiningDate: '',
    bio: '',
    linkedIn: '',
    assignedCohorts: [] as string[],
  });

  const [offboardingMentor, setOffboardingMentor] = useState<EnrichedMentor | null>(null);
  const [offboardReason, setOffboardReason] = useState('Completed Tenure / Contract Ended');
  const [offboardLastDate, setOffboardLastDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [offboardNotes, setOffboardNotes] = useState('');
  const [offboardReassignMentorId, setOffboardReassignMentorId] = useState('');

  const [suspendingMentor, setSuspendingMentor] = useState<EnrichedMentor | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendNotes, setSuspendNotes] = useState('');
  const [suspendReassignMentorId, setSuspendReassignMentorId] = useState('');

  const [reactivatingMentor, setReactivatingMentor] = useState<EnrichedMentor | null>(null);
  const [reactivateNotes, setReactivateNotes] = useState('');
  const [reactivateCohorts, setReactivateCohorts] = useState<string[]>([]);

  const [reassigningMentor, setReassigningMentor] = useState<EnrichedMentor | null>(null);
  const [reassignTargetMentorId, setReassignTargetMentorId] = useState('');

  const adminHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      'x-user-id': user?.id || 'usr_admin_1',
      'x-user-role': user?.role || 'admin',
    }),
    [user?.id, user?.role]
  );

  // Fetch all live admin data from real endpoints
  const fetchAllAdminData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [statsRes, foundersRes, appsRes, mentorsRes, actRes, notifRes, aiMonRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats').then((r) => r.json()).catch(() => null),
        fetch('/api/admin/founders').then((r) => r.json()).catch(() => []),
        fetch('/api/admin/mentor-applications').then((r) => r.json()).catch(() => []),
        fetch('/api/admin/mentors').then((r) => r.json()).catch(() => []),
        fetch('/api/admin/activity').then((r) => r.json()).catch(() => []),
        fetch('/api/notifications').then((r) => r.json()).catch(() => []),
        fetch('/api/admin/ai-monitoring').then((r) => r.json()).catch(() => null),
      ]);

      if (statsRes) {
        setStats(statsRes);
      }
      if (Array.isArray(foundersRes)) {
        setFoundersList(foundersRes);
      }
      if (Array.isArray(appsRes)) {
        setApplicationsList(appsRes);
      }
      if (Array.isArray(mentorsRes)) {
        setAllMentorsList(mentorsRes);
      }
      if (Array.isArray(actRes)) {
        setActivityLogs(actRes);
      }
      if (Array.isArray(notifRes)) {
        setNotificationsList(notifRes);
      }
      if (aiMonRes) {
        setAiMonitoring(aiMonRes);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAdminData();
    const interval = setInterval(fetchAllAdminData, 10000);
    return () => clearInterval(interval);
  }, [fetchAllAdminData]);

  const showToast = (msg: string) => {
    setActionErrorMsg('');
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 5000);
  };

  const showErrorToast = (msg: string) => {
    setActionSuccessMsg('');
    setActionErrorMsg(msg);
    setTimeout(() => setActionErrorMsg(''), 5000);
  };

  // Open Mentor Details Modal and fetch full enriched record (including audit logs)
  const handleOpenMentorDetails = async (mentor: EnrichedMentor) => {
    setViewingMentorDetails(mentor);
    setMentorDetailsTab('overview');
    try {
      const res = await fetch(`/api/admin/mentors/${mentor.id}`);
      if (res.ok) {
        const fullData = await res.json();
        setViewingMentorDetails(fullData);
      }
    } catch (err) {
      console.error('Failed to fetch detailed mentor record:', err);
    }
  };

  // Open Edit Mentor Modal
  const handleOpenEditMentor = (mentor: EnrichedMentor) => {
    setEditingMentor(mentor);
    setEditMentorForm({
      name: mentor.name || '',
      email: mentor.email || '',
      phone: mentor.phone || '',
      title: mentor.title || '',
      company: mentor.company || '',
      yearsExperience: mentor.yearsExperience || 5,
      expertiseText: (mentor.expertise || []).join(', '),
      joiningDate: mentor.joiningDate
        ? new Date(mentor.joiningDate).toISOString().split('T')[0]
        : new Date(mentor.createdAt).toISOString().split('T')[0],
      bio: mentor.bio || '',
      linkedIn: mentor.linkedIn || '',
      assignedCohorts: (mentor.assignedCohorts || []).map((c) => c.id),
    });
  };

  // Submit Edit Mentor
  const handleSaveEditMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMentor) return;
    setIsSubmittingAction(true);
    try {
      const expertiseArray = editMentorForm.expertiseText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/mentors/${editingMentor.id}`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({
          name: editMentorForm.name.trim(),
          email: editMentorForm.email.trim(),
          phone: editMentorForm.phone.trim(),
          title: editMentorForm.title.trim(),
          company: editMentorForm.company.trim(),
          yearsExperience: Number(editMentorForm.yearsExperience) || 5,
          expertise: expertiseArray,
          joiningDate: editMentorForm.joiningDate
            ? new Date(editMentorForm.joiningDate).toISOString()
            : editingMentor.joiningDate,
          bio: editMentorForm.bio.trim(),
          linkedIn: editMentorForm.linkedIn.trim(),
          assignedCohorts: editMentorForm.assignedCohorts,
          adminId: user?.id,
          adminName: user?.name || 'Incubator Director',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Mentor profile for "${editMentorForm.name}" updated successfully.`);
        setEditingMentor(null);
        if (viewingMentorDetails?.id === editingMentor.id && data.mentor) {
          setViewingMentorDetails(data.mentor);
        }
        await fetchAllAdminData();
        if (onRefreshWorkspace) onRefreshWorkspace();
      } else {
        showErrorToast(data.error || 'Failed to update mentor details.');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Network error while updating mentor.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Open Mark Mentor as Left Modal
  const handleOpenOffboardModal = (mentor: EnrichedMentor) => {
    setOffboardingMentor(mentor);
    setOffboardReason('Completed Tenure / Contract Ended');
    setOffboardLastDate(new Date().toISOString().split('T')[0]);
    setOffboardNotes('');
    setOffboardReassignMentorId('');
  };

  // Submit Offboarding (Mark as Left)
  const handleConfirmOffboarding = async () => {
    if (!offboardingMentor) return;
    if (!offboardReason.trim()) {
      showErrorToast('Please provide a Reason for Leaving before confirming offboarding.');
      return;
    }
    if (!offboardLastDate) {
      showErrorToast('Please select a Last Working Date.');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/mentors/${offboardingMentor.id}/offboard`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          reason: offboardReason.trim(),
          lastWorkingDate: offboardLastDate,
          additionalNotes: offboardNotes.trim(),
          reassignToMentorId: offboardReassignMentorId || undefined,
          adminId: user?.id,
          adminName: user?.name || 'Incubator Director',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          data.message ||
            `Mentor "${offboardingMentor.name}" has been marked as LEFT and offboarded. Access revoked.`
        );
        if (viewingMentorDetails?.id === offboardingMentor.id && data.mentor) {
          setViewingMentorDetails(data.mentor);
        }
        setOffboardingMentor(null);
        await fetchAllAdminData();
        if (onRefreshWorkspace) onRefreshWorkspace();
      } else {
        showErrorToast(data.error || 'Failed to complete mentor offboarding.');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Network error while offboarding mentor.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Open Suspend Mentor Modal
  const handleOpenSuspendModal = (mentor: EnrichedMentor) => {
    setSuspendingMentor(mentor);
    setSuspendReason('Administrative Review / Temporary Unavailability');
    setSuspendNotes('');
    setSuspendReassignMentorId('');
  };

  // Submit Suspend Mentor
  const handleConfirmSuspend = async () => {
    if (!suspendingMentor) return;
    if (!suspendReason.trim()) {
      showErrorToast('Please provide a reason for suspending this mentor.');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/mentors/${suspendingMentor.id}/suspend`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          reason: suspendReason.trim(),
          notes: suspendNotes.trim(),
          reassignToMentorId: suspendReassignMentorId || undefined,
          adminId: user?.id,
          adminName: user?.name || 'Incubator Director',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Mentor "${suspendingMentor.name}" has been SUSPENDED. Dashboard access paused.`);
        if (viewingMentorDetails?.id === suspendingMentor.id && data.mentor) {
          setViewingMentorDetails(data.mentor);
        }
        setSuspendingMentor(null);
        await fetchAllAdminData();
        if (onRefreshWorkspace) onRefreshWorkspace();
      } else {
        showErrorToast(data.error || 'Failed to suspend mentor.');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Network error while suspending mentor.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Open Reactivate Mentor Modal
  const handleOpenReactivateModal = (mentor: EnrichedMentor) => {
    setReactivatingMentor(mentor);
    setReactivateNotes('Re-authorized by Incubator Administration to resume active mentorship.');
    setReactivateCohorts(
      mentor.offboardingDetails?.previousCohorts?.map((c) => c.id) ||
        mentor.assignedCohorts?.map((c) => c.id) ||
        []
    );
  };

  // Submit Reactivate Mentor
  const handleConfirmReactivate = async () => {
    if (!reactivatingMentor) return;
    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/mentors/${reactivatingMentor.id}/reactivate`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          notes: reactivateNotes.trim(),
          assignedCohorts: reactivateCohorts,
          adminId: user?.id,
          adminName: user?.name || 'Incubator Director',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          `Mentor "${reactivatingMentor.name}" has been REACTIVATED. Dashboard access restored with full history preserved.`
        );
        if (viewingMentorDetails?.id === reactivatingMentor.id && data.mentor) {
          setViewingMentorDetails(data.mentor);
        }
        setReactivatingMentor(null);
        await fetchAllAdminData();
        if (onRefreshWorkspace) onRefreshWorkspace();
      } else {
        showErrorToast(data.error || 'Failed to reactivate mentor.');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Network error while reactivating mentor.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Submit Reassign Responsibilities
  const handleConfirmReassign = async () => {
    if (!reassigningMentor || !reassignTargetMentorId) return;
    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/mentors/${reassigningMentor.id}/reassign`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          targetMentorId: reassignTargetMentorId,
          adminId: user?.id,
          adminName: user?.name || 'Incubator Director',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Responsibilities reassigned to active mentor.');
        setReassigningMentor(null);
        setReassignTargetMentorId('');
        await fetchAllAdminData();
        if (onRefreshWorkspace) onRefreshWorkspace();
      } else {
        showErrorToast(data.error || 'Failed to reassign responsibilities.');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Network error while reassigning responsibilities.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 1. Approve Mentor Application
  const handleApprove = async (appId: string, mentorName: string) => {
    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/mentor-applications/${appId}/approve`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ adminName: user?.name || 'Incubator Director' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Mentor "${mentorName}" has been APPROVED. Dashboard access granted.`);
        if (onApproveMentor) onApproveMentor(appId);
        await fetchAllAdminData();
        if (onRefreshWorkspace) onRefreshWorkspace();
      } else {
        showErrorToast(data.error || 'Failed to approve mentor application.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 2. Reject Mentor Application
  const handleRejectConfirm = async () => {
    if (!rejectingApp) return;
    if (!rejectionReason.trim()) {
      showErrorToast('Please provide a reason for rejecting this application.');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/mentor-applications/${rejectingApp.id}/reject`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          reason: rejectionReason.trim(),
          adminName: user?.name || 'Incubator Director',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Mentor application for "${rejectingApp.name}" was REJECTED with feedback.`);
        if (onRejectMentor) onRejectMentor(rejectingApp.id);
        setRejectingApp(null);
        setRejectionReason('');
        await fetchAllAdminData();
        if (onRefreshWorkspace) onRefreshWorkspace();
      } else {
        showErrorToast(data.error || 'Failed to reject application.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 3. Toggle Founder Status (Activate / Suspend)
  const handleToggleFounderStatus = async (founder: EnrichedFounder) => {
    const nextStatus = founder.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/founders/${founder.id}/status`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(`Founder "${founder.name}" status updated to ${nextStatus.toUpperCase()}.`);
        await fetchAllAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered founders
  const filteredFounders = useMemo(() => {
    return foundersList.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(founderSearch.toLowerCase()) ||
        f.email.toLowerCase().includes(founderSearch.toLowerCase()) ||
        f.startupName.toLowerCase().includes(founderSearch.toLowerCase());

      const matchesStatus =
        founderStatusFilter === 'all' || f.status === founderStatusFilter;

      let matchesDate = true;
      if (founderDateFilter !== 'all') {
        const regTime = new Date(f.registrationDate).getTime();
        const now = Date.now();
        if (founderDateFilter === 'today') {
          matchesDate = now - regTime < 24 * 3600 * 1000;
        } else if (founderDateFilter === '7days') {
          matchesDate = now - regTime < 7 * 24 * 3600 * 1000;
        } else if (founderDateFilter === '30days') {
          matchesDate = now - regTime < 30 * 24 * 3600 * 1000;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [foundersList, founderSearch, founderStatusFilter, founderDateFilter]);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applicationsList.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(appSearch.toLowerCase()) ||
        a.email.toLowerCase().includes(appSearch.toLowerCase()) ||
        a.company.toLowerCase().includes(appSearch.toLowerCase());

      const matchesStatus =
        appStatusFilter === 'all' || a.status === appStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applicationsList, appSearch, appStatusFilter]);

  // Filtered mentors list with status + joining/leaving date filters
  const filteredMentors = useMemo(() => {
    return allMentorsList.filter((m) => {
      const q = mentorSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone || '').toLowerCase().includes(q) ||
        (m.company || '').toLowerCase().includes(q) ||
        (m.expertise || []).some((e) => e.toLowerCase().includes(q));

      const matchesStatus =
        mentorStatusFilter === 'all' || m.status === mentorStatusFilter;

      let matchesJoinDate = true;
      const joinTime = new Date(m.joiningDate || m.createdAt).getTime();
      if (mentorJoinedFrom) {
        const fromTime = new Date(mentorJoinedFrom).getTime();
        if (!isNaN(fromTime) && joinTime < fromTime) matchesJoinDate = false;
      }
      if (mentorJoinedTo) {
        const toTime = new Date(mentorJoinedTo).getTime() + 86400000;
        if (!isNaN(toTime) && joinTime > toTime) matchesJoinDate = false;
      }

      let matchesLeftDate = true;
      if (mentorLeftFrom || mentorLeftTo) {
        if (m.status !== 'left' || !m.offboardingDetails?.lastWorkingDate) {
          matchesLeftDate = false;
        } else {
          const leftTime = new Date(m.offboardingDetails.lastWorkingDate).getTime();
          if (mentorLeftFrom) {
            const fromTime = new Date(mentorLeftFrom).getTime();
            if (!isNaN(fromTime) && leftTime < fromTime) matchesLeftDate = false;
          }
          if (mentorLeftTo) {
            const toTime = new Date(mentorLeftTo).getTime() + 86400000;
            if (!isNaN(toTime) && leftTime > toTime) matchesLeftDate = false;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesJoinDate && matchesLeftDate;
    });
  }, [
    allMentorsList,
    mentorSearch,
    mentorStatusFilter,
    mentorJoinedFrom,
    mentorJoinedTo,
    mentorLeftFrom,
    mentorLeftTo,
  ]);

  const pendingAppsCount = applicationsList.filter((a) => a.status === 'pending').length;
  const pendingResourceRequests = resourceRequests.filter((r) => r.status === 'pending');
  const activeMentors = useMemo(
    () => allMentorsList.filter((m) => m.status === 'active'),
    [allMentorsList]
  );

  // Computed mentor counts for stats cards
  const totalMentorsCount = allMentorsList.length || stats.totalMentors;
  const activeMentorsCount =
    allMentorsList.filter((m) => m.status === 'active').length || stats.activeMentors || stats.approvedMentors;
  const suspendedMentorsCount =
    allMentorsList.filter((m) => m.status === 'suspended').length ?? stats.suspendedMentors ?? 0;
  const leftMentorsCount =
    allMentorsList.filter((m) => m.status === 'left').length ?? stats.mentorsWhoLeft ?? 0;
  const pendingMentorsCount =
    stats.pendingMentorApplications ??
    allMentorsList.filter((m) => m.status === 'pending').length;

  const renderMentorStatusBadge = (status: EnrichedMentor['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            ACTIVE
          </span>
        );
      case 'pending':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            PENDING
          </span>
        );
      case 'suspended':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            SUSPENDED
          </span>
        );
      case 'left':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            LEFT
          </span>
        );
      case 'rejected':
      default:
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            REJECTED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Action Success Toast Alert */}
      {actionSuccessMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 max-w-md">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccessMsg}</span>
          <button
            onClick={() => setActionSuccessMsg('')}
            className="ml-2 hover:bg-emerald-700 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Action Error Toast Alert */}
      {actionErrorMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-600 text-white shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 max-w-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionErrorMsg}</span>
          <button
            onClick={() => setActionErrorMsg('')}
            className="ml-2 hover:bg-red-700 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <BrandLogo variant="badge" className="mb-2" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Admin Management Center
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time founder governance, mentor approval & offboarding lifecycle, and startup portfolio operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs">
            <UserAvatar
              src={user?.avatar}
              alt={user?.name || 'Administrator'}
              size="sm"
              shape="rounded-square"
              border={true}
              statusBadge="active"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-gray-900 leading-tight">
                {user?.name || 'Incubator Director'}
              </p>
              <p className="text-[10px] text-[#6355F4] font-semibold">Super Administrator</p>
            </div>
          </div>

          <button
            onClick={fetchAllAdminData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-gray-500 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
          <button
            onClick={() => onNavigate('cohorts')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Manage Cohorts</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'overview'
              ? 'bg-[#6355F4] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('mentors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'mentors'
              ? 'bg-[#6355F4] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Mentor Management</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'mentors'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {allMentorsList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('approval-requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 relative ${
            activeTab === 'approval-requests'
              ? 'bg-[#6355F4] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Mentor Approval Requests</span>
          {pendingAppsCount > 0 && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'approval-requests'
                  ? 'bg-amber-400 text-gray-900'
                  : 'bg-amber-100 text-amber-800 animate-pulse'
              }`}
            >
              {pendingAppsCount} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('founders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'founders'
              ? 'bg-[#6355F4] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Founder Management</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'founders'
                ? 'bg-white/20 text-white'
                : 'bg-purple-100 text-[#6355F4]'
            }`}
          >
            {foundersList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pairing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'pairing'
              ? 'bg-[#6355F4] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pairing & Allocations</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'activity'
              ? 'bg-[#6355F4] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Audit & Activity</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'notifications'
              ? 'bg-[#6355F4] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications</span>
          {notificationsList.filter((n) => !n.isRead).length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'notifications'
                  ? 'bg-red-400 text-white'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {notificationsList.filter((n) => !n.isRead).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ai-monitoring')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'ai-monitoring'
              ? 'bg-[#6355F4] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Usage Monitoring</span>
          {aiMonitoring && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'ai-monitoring'
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-100 text-[#6355F4]'
              }`}
            >
              {aiMonitoring.totalRequests || 0} Req
            </span>
          )}
        </button>
      </div>

      {/* ----------------- TAB 1: OVERVIEW ----------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Mentor & Platform KPI Statistics Cards */}
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div
              onClick={() => {
                setMentorStatusFilter('all');
                setActiveTab('mentors');
              }}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-purple-200 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Total Mentors
              </p>
              <p className="text-2xl font-black text-gray-900 mt-1">{totalMentorsCount}</p>
              <p className="text-[10px] text-indigo-600 font-semibold mt-1">All lifecycle states</p>
            </div>

            <div
              onClick={() => {
                setMentorStatusFilter('active');
                setActiveTab('mentors');
              }}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-emerald-200 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Active Mentors
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{activeMentorsCount}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Approved & active</p>
            </div>

            <div
              onClick={() => setActiveTab('approval-requests')}
              className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs hover:border-amber-400 transition-all cursor-pointer bg-gradient-to-br from-white to-amber-50/40"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2.5">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Pending Mentor Apps
              </p>
              <p className="text-2xl font-black text-amber-600 mt-1">{pendingMentorsCount}</p>
              <p className="text-[10px] text-amber-700 font-bold mt-1 flex items-center gap-1">
                Review queue <ChevronRight className="w-3 h-3" />
              </p>
            </div>

            <div
              onClick={() => {
                setMentorStatusFilter('suspended');
                setActiveTab('mentors');
              }}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-red-200 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2.5">
                <Ban className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Suspended Mentors
              </p>
              <p className="text-2xl font-black text-red-600 mt-1">{suspendedMentorsCount}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-1">Temporarily paused</p>
            </div>

            <div
              onClick={() => {
                setMentorStatusFilter('left');
                setActiveTab('mentors');
              }}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-2.5">
                <LogOut className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Mentors Who Left
              </p>
              <p className="text-2xl font-black text-slate-700 mt-1">{leftMentorsCount}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Offboarded & archived</p>
            </div>

            <div
              onClick={() => setActiveTab('founders')}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-purple-200 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#6355F4] flex items-center justify-center mb-2.5">
                <Building2 className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Registered Founders
              </p>
              <p className="text-2xl font-black text-gray-900 mt-1">{stats.totalFounders}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Active portfolio</p>
            </div>
          </div>

          {/* Quick Action Alerts */}
          {pendingAppsCount > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                    {pendingAppsCount} Mentor {pendingAppsCount === 1 ? 'Application' : 'Applications'} Awaiting Verification
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Mentors cannot access the Mentor Dashboard until approved by incubator administration.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('approval-requests')}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 text-center"
              >
                Review Applications
              </button>
            </div>
          )}

          {/* Recent Founders & Mentor Lifecycle Snapshot side-by-side */}
          <div className="grid lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Mentor Roster & Offboarding Overview */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Mentor Roster & Lifecycle Status</h3>
                  <p className="text-[11px] text-gray-400">
                    Active advisors, suspended accounts, and offboarded alumni
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('mentors')}
                  className="text-xs font-semibold text-[#6355F4] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  Manage Mentors ({allMentorsList.length}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {allMentorsList.slice(0, 5).map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        src={m.avatar}
                        alt={m.name}
                        size="sm"
                        shape="rounded-square"
                        border={true}
                        statusBadge={m.status}
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{m.name}</h4>
                        <p className="text-[11px] text-gray-500 truncate">
                          {m.title} • <span className="text-gray-400">{m.company}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      {renderMentorStatusBadge(m.status)}
                      <button
                        onClick={() => handleOpenMentorDetails(m)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-purple-50 text-gray-600 hover:text-[#6355F4] cursor-pointer"
                        title="View Mentor Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Founders */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Recent Founder Registrations</h3>
                  <p className="text-[11px] text-gray-400">Newly registered entrepreneurs</p>
                </div>
                <button
                  onClick={() => setActiveTab('founders')}
                  className="text-xs font-semibold text-[#6355F4] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  View All ({foundersList.length}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {foundersList.slice(0, 5).map((f) => (
                  <div key={f.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        src={f.avatar}
                        alt={f.name}
                        size="sm"
                        shape="rounded-square"
                        border={true}
                        statusBadge={f.status}
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{f.name}</h4>
                        <p className="text-[11px] text-gray-500 truncate">
                          {f.startupName} • <span className="text-gray-400">{f.startupIndustry}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          f.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {f.status.toUpperCase()}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(f.registrationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 4: MENTOR MANAGEMENT & OFFBOARDING SYSTEM ----------------- */}
      {activeTab === 'mentors' && (
        <div className="space-y-6">
          {/* 5 Mentor Statistics Cards */}
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <button
              type="button"
              onClick={() => setMentorStatusFilter('all')}
              className={`text-left bg-white rounded-2xl p-4 border transition-all cursor-pointer ${
                mentorStatusFilter === 'all'
                  ? 'border-[#6355F4] ring-2 ring-[#6355F4]/15'
                  : 'border-gray-100 hover:border-purple-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Total Mentors
                </span>
                <Users className="w-4 h-4 text-[#6355F4]" />
              </div>
              <p className="text-2xl font-black text-gray-900">{totalMentorsCount}</p>
              <p className="text-[10px] text-gray-500 mt-1">Complete directory</p>
            </button>

            <button
              type="button"
              onClick={() => setMentorStatusFilter('active')}
              className={`text-left bg-white rounded-2xl p-4 border transition-all cursor-pointer ${
                mentorStatusFilter === 'active'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/15'
                  : 'border-gray-100 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Active Mentors
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600">{activeMentorsCount}</p>
              <p className="text-[10px] text-emerald-700 mt-1">Operational & assignable</p>
            </button>

            <button
              type="button"
              onClick={() => setMentorStatusFilter('pending')}
              className={`text-left bg-white rounded-2xl p-4 border transition-all cursor-pointer ${
                mentorStatusFilter === 'pending'
                  ? 'border-amber-500 ring-2 ring-amber-500/15'
                  : 'border-gray-100 hover:border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Pending Applications
                </span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-600">{pendingMentorsCount}</p>
              <p className="text-[10px] text-amber-700 mt-1">Awaiting verification</p>
            </button>

            <button
              type="button"
              onClick={() => setMentorStatusFilter('suspended')}
              className={`text-left bg-white rounded-2xl p-4 border transition-all cursor-pointer ${
                mentorStatusFilter === 'suspended'
                  ? 'border-red-500 ring-2 ring-red-500/15'
                  : 'border-gray-100 hover:border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                  Suspended Mentors
                </span>
                <Ban className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-black text-red-600">{suspendedMentorsCount}</p>
              <p className="text-[10px] text-red-700 mt-1">Access temporarily paused</p>
            </button>

            <button
              type="button"
              onClick={() => setMentorStatusFilter('left')}
              className={`text-left bg-white rounded-2xl p-4 border transition-all cursor-pointer ${
                mentorStatusFilter === 'left'
                  ? 'border-slate-600 ring-2 ring-slate-500/15'
                  : 'border-gray-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Mentors Who Left
                </span>
                <LogOut className="w-4 h-4 text-slate-600" />
              </div>
              <p className="text-2xl font-black text-slate-800">{leftMentorsCount}</p>
              <p className="text-[10px] text-slate-500 mt-1">Offboarded • History preserved</p>
            </button>
          </div>

          {/* Mentor Management Directory & Filters */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Mentor Management & Employee Offboarding System
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage active mentors, reassign startup/cohort responsibilities, mark departing mentors as Left, or reactivate returning advisors with full historical records intact.
                </p>
              </div>

              {/* Status Quick Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'all', label: `All (${allMentorsList.length})` },
                    {
                      id: 'active',
                      label: `Active (${allMentorsList.filter((m) => m.status === 'active').length})`,
                    },
                    {
                      id: 'pending',
                      label: `Pending (${allMentorsList.filter((m) => m.status === 'pending').length})`,
                    },
                    {
                      id: 'suspended',
                      label: `Suspended (${allMentorsList.filter((m) => m.status === 'suspended').length})`,
                    },
                    {
                      id: 'left',
                      label: `Left / Offboarded (${allMentorsList.filter((m) => m.status === 'left').length})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMentorStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      mentorStatusFilter === tab.id
                        ? 'bg-[#6355F4] text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search & Joining / Leaving Date Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
              <div className="sm:col-span-2 lg:col-span-2 relative">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Search Mentor
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={mentorSearch}
                    onChange={(e) => setMentorSearch(e.target.value)}
                    placeholder="Name, email, phone, company, or expertise..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#6355F4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Joined From
                </label>
                <input
                  type="date"
                  value={mentorJoinedFrom}
                  onChange={(e) => setMentorJoinedFrom(e.target.value)}
                  className="w-full py-2 px-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#6355F4]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Joined To
                </label>
                <input
                  type="date"
                  value={mentorJoinedTo}
                  onChange={(e) => setMentorJoinedTo(e.target.value)}
                  className="w-full py-2 px-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#6355F4]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Left After (Offboarded)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={mentorLeftFrom}
                    onChange={(e) => setMentorLeftFrom(e.target.value)}
                    className="w-full py-2 px-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#6355F4]"
                  />
                  {(mentorSearch ||
                    mentorStatusFilter !== 'all' ||
                    mentorJoinedFrom ||
                    mentorJoinedTo ||
                    mentorLeftFrom ||
                    mentorLeftTo) && (
                    <button
                      type="button"
                      onClick={() => {
                        setMentorSearch('');
                        setMentorStatusFilter('all');
                        setMentorJoinedFrom('');
                        setMentorJoinedTo('');
                        setMentorLeftFrom('');
                        setMentorLeftTo('');
                      }}
                      className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 text-[10px] font-bold shrink-0 cursor-pointer"
                      title="Reset filters"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mentors Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 min-w-[1050px]">
                <thead className="bg-gray-50/90 text-gray-400 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Mentor Name</th>
                    <th className="p-3">Email & Phone</th>
                    <th className="p-3">Areas of Expertise</th>
                    <th className="p-3">Joining / Leaving Date</th>
                    <th className="p-3">Current Status</th>
                    <th className="p-3">Assigned Startups</th>
                    <th className="p-3">Assigned Cohorts</th>
                    <th className="p-3">Mentor Sessions</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMentors.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-10 text-center text-gray-400">
                        No mentors found matching your search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredMentors.map((m) => (
                      <tr
                        key={m.id}
                        className={`hover:bg-gray-50/70 transition-colors ${
                          m.status === 'left' ? 'bg-slate-50/40' : ''
                        }`}
                      >
                        {/* 1. Mentor Name */}
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar
                              src={m.avatar}
                              alt={m.name}
                              size="sm"
                              shape="rounded-square"
                              border={true}
                              statusBadge={m.status}
                            />
                            <div>
                              <p className="font-bold text-gray-900">{m.name}</p>
                              <p className="text-[10px] text-gray-500">
                                {m.title} • {m.company}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Email & Phone */}
                        <td className="p-3">
                          <p className="font-medium text-gray-800">{m.email}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {m.phone || '+91 98765 43210'}
                          </p>
                        </td>

                        {/* 3. Areas of Expertise */}
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {(m.expertise || []).slice(0, 3).map((exp, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium"
                              >
                                {exp}
                              </span>
                            ))}
                            {(m.expertise || []).length > 3 && (
                              <span className="text-[9px] text-gray-400 font-semibold">
                                +{(m.expertise || []).length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Joining Date (& Last Working Date if LEFT) */}
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <p className="text-gray-800 font-medium text-[11px]">
                              Joined:{' '}
                              {new Date(m.joiningDate || m.createdAt).toLocaleDateString()}
                            </p>
                            {m.status === 'left' && m.offboardingDetails?.lastWorkingDate && (
                              <p className="text-[10px] text-slate-600 font-semibold">
                                Left:{' '}
                                {new Date(
                                  m.offboardingDetails.lastWorkingDate
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* 5. Current Status */}
                        <td className="p-3">
                          <div className="space-y-1">
                            {renderMentorStatusBadge(m.status)}
                            {m.status === 'left' && m.offboardingDetails?.reason && (
                              <p
                                className="text-[10px] text-slate-500 max-w-[140px] truncate"
                                title={m.offboardingDetails.reason}
                              >
                                {m.offboardingDetails.reason}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* 6. Assigned Startups */}
                        <td className="p-3">
                          {m.assignedStartups && m.assignedStartups.length > 0 ? (
                            <div className="space-y-1">
                              <span className="font-bold text-gray-900 text-[11px]">
                                {m.assignedStartups.length}{' '}
                                {m.assignedStartups.length === 1 ? 'Startup' : 'Startups'}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {m.assignedStartups.slice(0, 2).map((st) => (
                                  <span
                                    key={st.id}
                                    className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium"
                                  >
                                    {st.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : m.status === 'left' &&
                            m.offboardingDetails?.previousStartups &&
                            m.offboardingDetails.previousStartups.length > 0 ? (
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold block">
                                0 Active (Offboarded)
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Prev: {m.offboardingDetails.previousStartups.map((s) => s.name).join(', ')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400">0 Assigned</span>
                          )}
                        </td>

                        {/* 7. Assigned Cohorts */}
                        <td className="p-3">
                          {m.assignedCohorts && m.assignedCohorts.length > 0 ? (
                            <div className="space-y-1">
                              {m.assignedCohorts.map((c) => (
                                <span
                                  key={c.id}
                                  className="inline-block text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold mr-1"
                                >
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          ) : m.status === 'left' &&
                            m.offboardingDetails?.previousCohorts &&
                            m.offboardingDetails.previousCohorts.length > 0 ? (
                            <div>
                              <span className="text-[10px] text-slate-400 block">Removed</span>
                              <span className="text-[10px] text-slate-500">
                                Prev: {m.offboardingDetails.previousCohorts.map((c) => c.name).join(', ')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400">None</span>
                          )}
                        </td>

                        {/* 8. Active & Historical Mentor Sessions */}
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <p className="font-bold text-gray-900 text-[11px]">
                              {m.activeSessionsCount || 0} Active
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {m.completedSessionsCount || 0} Completed
                              {m.averageRating ? ` • ★ ${m.averageRating}` : ''}
                            </p>
                          </div>
                        </td>

                        {/* 9. Actions: View Details, Edit Mentor, Mark as Left, Suspend Mentor, Reactivate Mentor */}
                        <td className="p-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenMentorDetails(m)}
                              className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-purple-50 text-gray-700 hover:text-[#6355F4] text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="View Mentor Details & Preserved History"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Details</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditMentor(m)}
                              className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Edit Mentor Profile & Cohort Assignments"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {m.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => handleApprove(m.id, m.name)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                            )}

                            {m.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => handleOpenSuspendModal(m)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Temporarily Suspend Mentor"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Suspend</span>
                              </button>
                            )}

                            {m.status !== 'left' && (
                              <button
                                type="button"
                                onClick={() => handleOpenOffboardModal(m)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Mark Mentor as Left (Offboard)"
                              >
                                <LogOut className="w-3 h-3" />
                                <span>Mark as Left</span>
                              </button>
                            )}

                            {(m.status === 'left' || m.status === 'suspended' || m.status === 'rejected') && (
                              <button
                                type="button"
                                onClick={() => handleOpenReactivateModal(m)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Reactivate Mentor Account"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reactivate</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: FOUNDER MANAGEMENT ----------------- */}
      {activeTab === 'founders' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Founder Registration Management</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Total Registered Founders: <strong className="text-gray-900">{foundersList.length}</strong> • Synchronized with live database
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="grid sm:grid-cols-3 gap-3 p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={founderSearch}
                onChange={(e) => setFounderSearch(e.target.value)}
                placeholder="Search by founder name, email or startup..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#6355F4]"
              />
            </div>

            <div>
              <select
                value={founderStatusFilter}
                onChange={(e: any) => setFounderStatusFilter(e.target.value)}
                className="w-full py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#6355F4]"
              >
                <option value="all">Status: All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>

            <div>
              <select
                value={founderDateFilter}
                onChange={(e: any) => setFounderDateFilter(e.target.value)}
                className="w-full py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#6355F4]"
              >
                <option value="all">Registration Date: All Time</option>
                <option value="today">Registered Today</option>
                <option value="7days">Past 7 Days</option>
                <option value="30days">Past 30 Days</option>
              </select>
            </div>
          </div>

          {/* Founders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50/80 text-gray-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Founder Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Phone Number</th>
                  <th className="p-3">Startup Name</th>
                  <th className="p-3">Startup Industry</th>
                  <th className="p-3">Registration Date</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3">Last Login</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFounders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400">
                      No founders found matching your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredFounders.map((founder) => (
                    <tr key={founder.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            src={founder.avatar}
                            alt={founder.name}
                            size="sm"
                            shape="rounded-square"
                            border={true}
                            statusBadge={founder.status}
                          />
                          <div>
                            <p className="font-bold text-gray-900">{founder.name}</p>
                            <p className="text-[10px] text-gray-400">@{founder.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-gray-800">{founder.email}</td>
                      <td className="p-3 text-gray-600">{founder.phone || '—'}</td>
                      <td className="p-3 font-semibold text-gray-900">{founder.startupName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium text-[10px]">
                          {founder.startupIndustry}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">
                        {new Date(founder.registrationDate).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            founder.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              founder.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {founder.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500 text-[11px]">
                        {new Date(founder.lastLogin).toLocaleDateString()}{' '}
                        {new Date(founder.lastLogin).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingFounder(founder)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-purple-50 text-gray-600 hover:text-[#6355F4] transition-colors cursor-pointer"
                            title="View Founder Profile & Startup Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleFounderStatus(founder)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                              founder.status === 'active'
                                ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                            }`}
                          >
                            {founder.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- TAB 3: MENTOR APPROVAL REQUESTS ----------------- */}
      {activeTab === 'approval-requests' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Mentor Approval Management</h2>
                {pendingAppsCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {pendingAppsCount} Action Required
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Review applicant credentials, experience, qualifications, and grant or deny access to Mentor Dashboard.
              </p>
            </div>
          </div>

          {/* Search & Status Filter */}
          <div className="grid sm:grid-cols-2 gap-3 p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Search mentor applicants by name, email or company..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#6355F4]"
              />
            </div>
            <div>
              <select
                value={appStatusFilter}
                onChange={(e: any) => setAppStatusFilter(e.target.value)}
                className="w-full py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#6355F4]"
              >
                <option value="all">All Submissions</option>
                <option value="pending">Pending Admin Review</option>
                <option value="approved">Approved Applications</option>
                <option value="rejected">Rejected Applications</option>
              </select>
            </div>
          </div>

          {/* Applications Cards / List */}
          {filteredApps.length === 0 ? (
            <div className="p-10 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-900">No Mentor Applications in Queue</h3>
              <p className="text-xs text-gray-500 mt-1">
                All mentor applications have been reviewed or none match the selected filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <UserAvatar
                      src={app.avatar}
                      alt={app.name}
                      size="lg"
                      shape="rounded-square"
                      border={true}
                      statusBadge={
                        app.status === 'pending'
                          ? 'pending'
                          : app.status === 'approved'
                          ? 'active'
                          : 'rejected'
                      }
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">{app.name}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            app.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : app.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {app.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <Briefcase className="w-3.5 h-3.5 text-gray-400" /> {app.title} • {app.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400" /> {app.email}
                        </span>
                        {app.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-gray-400" /> {app.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-gray-400" /> {app.yearsExperience} Years Exp
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 mt-2 max-w-2xl leading-relaxed">{app.bio}</p>

                      {app.qualifications && (
                        <p className="text-[11px] text-gray-500 mt-1 italic">
                          Qualifications: {app.qualifications}
                        </p>
                      )}

                      {app.expertise && app.expertise.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {app.expertise.map((exp, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium"
                            >
                              {exp}
                            </span>
                          ))}
                        </div>
                      )}

                      {app.rejectionReason && (
                        <div className="mt-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                          <strong>Rejection reason recorded:</strong> {app.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    <button
                      onClick={() => setViewingApp(app)}
                      className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>

                    {app.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(app.id, app.name)}
                          disabled={isSubmittingAction}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            setRejectingApp(app);
                            setRejectionReason(
                              'Does not meet current domain or experience requirements.'
                            );
                          }}
                          disabled={isSubmittingAction}
                          className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {app.status === 'approved' && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Approved
                      </span>
                    )}

                    {app.status === 'rejected' && (
                      <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB 5: USER ACTIVITY & OFFBOARDING AUDIT ----------------- */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Platform Activity & Offboarding Audit Log</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time immutable records of mentor offboarding, reactivations, responsibility reassignments, and system events.
              </p>
            </div>
            <button
              onClick={fetchAllAdminData}
              className="text-xs font-semibold text-[#6355F4] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Log
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {activityLogs.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">No activity recorded yet.</p>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#6355F4] flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{log.action}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {log.userRole}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{log.details}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Initiator: {log.userName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {new Date(log.timestamp).toLocaleDateString()}{' '}
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 6: NOTIFICATIONS ----------------- */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Admin Alerts & Notifications</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time operational alerts regarding mentor offboarding, approvals, and founder updates.
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {notificationsList.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">No notifications at this time.</p>
            ) : (
              notificationsList.map((n) => (
                <div key={n.id} className="py-3.5 flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      n.type === 'approval'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-purple-100 text-[#6355F4]'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-gray-900">{n.title}</h4>
                    <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {new Date(n.timestamp).toLocaleDateString()}{' '}
                      {new Date(n.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 7: PAIRING & ALLOCATIONS ----------------- */}
      {activeTab === 'pairing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Mentor-to-Startup Pairing Engine</h3>
                <p className="text-[11px] text-gray-400">
                  Pair active startups with verified active mentors (offboarded and suspended mentors are automatically excluded)
                </p>
              </div>
              <button
                onClick={() => onNavigate('ai-insights')}
                className="text-xs font-semibold text-[#6355F4] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Match Recommendation
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 p-4 bg-gray-50/70 rounded-2xl border border-gray-100 mb-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Select Startup
                </label>
                <select
                  value={selectedStartupForPairing}
                  onChange={(e) => setSelectedStartupForPairing(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-200 rounded-xl p-2 text-gray-800"
                >
                  <option value="">-- Choose startup --</option>
                  {startups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.industry})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Select Verified Active Mentor
                </label>
                <select
                  value={selectedMentorForPairing}
                  onChange={(e) => setSelectedMentorForPairing(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-200 rounded-xl p-2 text-gray-800"
                >
                  <option value="">-- Choose active mentor --</option>
                  {activeMentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.company})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    if (selectedStartupForPairing && selectedMentorForPairing) {
                      onAssignMentor(selectedStartupForPairing, selectedMentorForPairing);
                      setSelectedStartupForPairing('');
                      setSelectedMentorForPairing('');
                      showToast('Active Mentor paired with startup successfully.');
                      setTimeout(fetchAllAdminData, 500);
                    }
                  }}
                  disabled={!selectedStartupForPairing || !selectedMentorForPairing}
                  className="w-full bg-[#6355F4] hover:bg-[#5244E0] disabled:opacity-50 text-white font-semibold text-xs py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>

            {/* Existing Assignments Overview */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-400 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Startup</th>
                    <th className="p-3">Industry</th>
                    <th className="p-3">Assigned Mentor</th>
                    <th className="p-3">Cohort</th>
                    <th className="p-3">Target Funding</th>
                    <th className="p-3">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {startups.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-bold text-gray-900">{s.name}</td>
                      <td className="p-3">{s.industry}</td>
                      <td className="p-3 font-medium text-[#6355F4]">
                        {s.mentorName || <span className="text-gray-400 italic">Unassigned</span>}
                      </td>
                      <td className="p-3">{s.cohortName || 'General'}</td>
                      <td className="p-3 font-semibold text-gray-800">{formatINR(s.fundingRequired)}</td>
                      <td className="p-3 font-semibold text-gray-800">{s.progress}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Resource Allocation Requests */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Resource & Perk Requests</h3>
            <p className="text-[11px] text-gray-400 mb-4">
              Cloud credits, coworking desks, and legal advisory allocations requested by founders
            </p>

            {pendingResourceRequests.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No pending resource requests.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingResourceRequests.map((req) => (
                  <div key={req.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{req.resourceName}</h4>
                      <p className="text-[11px] text-gray-500">
                        Requested by {req.startupName} ({req.founderName})
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Reason: {req.reason}</p>
                    </div>
                    <button
                      onClick={() => onApproveResourceRequest(req.id)}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-[#6355F4] text-[#6355F4] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Approve Allocation
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 8: AI USAGE MONITORING (PART 6) ----------------- */}
      {activeTab === 'ai-monitoring' && (
        <div className="space-y-6">
          {/* Top AI Provider & Model Banner */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-100 text-[#6355F4] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-extrabold text-gray-900">
                      AI Usage Monitoring & Telemetry
                    </h2>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Server-Side Secured
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Real-time monitoring of Courses & Learning AI, AI Incubation Hub, multi-model health routing, and API error categories. (API keys remain strictly hidden on server).
                  </p>
                </div>
              </div>

              <button
                onClick={fetchAllAdminData}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Telemetry</span>
              </button>
            </div>

            {/* Primary KPI Grid: Total, Successful, Failed, Cached, Current Provider, Active Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 mt-5">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Total AI Requests
                </p>
                <p className="text-2xl font-black text-gray-900 mt-1">
                  {aiMonitoring?.totalRequests ?? 0}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  Live API Telemetry
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Successful Requests
                </p>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {aiMonitoring?.successfulRequests ?? 0}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                  Success Rate: {aiMonitoring?.successRate ?? 100}%
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-red-50/60 border border-red-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                  Failed Requests
                </p>
                <p className="text-2xl font-black text-red-700 mt-1">
                  {aiMonitoring?.failedRequests ?? 0}
                </p>
                <p className="text-[10px] text-red-600 font-semibold mt-1">
                  Auto-fallback enabled
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  Deduplicated / Cached
                </p>
                <p className="text-2xl font-black text-indigo-700 mt-1">
                  {aiMonitoring?.cachedResponses ?? 0}
                </p>
                <p className="text-[10px] text-indigo-600 font-semibold mt-1">
                  10-min TTL Cache
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#6355F4]">
                  Current AI Provider
                </p>
                <p className="text-sm font-black text-gray-900 mt-1.5 truncate">
                  {aiMonitoring?.currentProvider || 'Google Gemini API'}
                </p>
                <p className="text-[10px] text-gray-500 mt-1 truncate">
                  {aiMonitoring?.secondaryProviderName || 'Multi-Model Pool'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#6355F4]">
                  Model Being Used
                </p>
                <p className="text-xs font-mono font-extrabold text-gray-900 mt-1.5 truncate">
                  {aiMonitoring?.currentModel || 'gemini-3.5-flash-lite'}
                </p>
                <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                  Active Primary Route
                </p>
              </div>
            </div>
          </div>

          {/* Usage by AI Feature & API Error Categories Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Usage by AI Feature */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Usage Statistics by AI Feature</h3>
                <p className="text-xs text-gray-400">
                  Breakdown of requests, completions, and average latency per platform AI capability.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-400 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">AI Feature</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Success</th>
                      <th className="p-3">Failed</th>
                      <th className="p-3">Avg Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {!aiMonitoring?.usageByFeature || aiMonitoring.usageByFeature.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-400">
                          No AI feature requests recorded in this session yet.
                        </td>
                      </tr>
                    ) : (
                      aiMonitoring.usageByFeature.map((fStats: any) => (
                        <tr key={fStats.feature} className="hover:bg-gray-50/60">
                          <td className="p-3">
                            <p className="font-bold text-gray-900">{fStats.label || fStats.feature}</p>
                            <p className="text-[10px] font-mono text-gray-400">{fStats.feature}</p>
                          </td>
                          <td className="p-3 font-semibold">{fStats.total}</td>
                          <td className="p-3 text-emerald-600 font-bold">{fStats.success}</td>
                          <td className="p-3 text-red-600 font-bold">{fStats.failed}</td>
                          <td className="p-3 font-mono text-[11px]">{fStats.avgLatencyMs} ms</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* API Error Categories Breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">API Error Categories</h3>
                <p className="text-xs text-gray-400">
                  Smart classification across rate limits, daily quotas, 503 overload, auth, and timeouts.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                {[
                  {
                    key: 'HTTP_429_RATE_LIMIT',
                    label: 'HTTP 429 Rate Limit (Per-Min)',
                  },
                  {
                    key: 'DAILY_QUOTA_EXCEEDED',
                    label: 'Daily Quota Exhausted',
                  },
                  {
                    key: 'HTTP_503_OVERLOAD',
                    label: 'HTTP 503 Service Overload',
                  },
                  {
                    key: 'HTTP_500_INTERNAL',
                    label: 'HTTP 500 Internal Server Error',
                  },
                  {
                    key: 'HTTP_401_403_AUTH',
                    label: 'HTTP 401 / 403 Invalid API Key',
                  },
                  {
                    key: 'NETWORK_TIMEOUT',
                    label: 'Network Timeout Errors',
                  },
                  {
                    key: 'INVALID_MODEL_CONFIG',
                    label: 'Invalid Model Configuration',
                  },
                ].map((cat) => {
                  const count = aiMonitoring?.errorCategories?.[cat.key] ?? 0;
                  return (
                    <div
                      key={cat.key}
                      className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-800">{cat.label}</p>
                        <p className="text-[10px] font-mono text-gray-400">{cat.key}</p>
                      </div>
                      <span
                        className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                          count > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gemini Multi-Model Health Pool Status */}
          {aiMonitoring?.modelsStatus && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Gemini Multi-Model Routing & Quota Health Pool
                </h3>
                <p className="text-xs text-gray-400">
                  Models with exhausted daily quotas or temporary 503 overload are automatically bypassed with zero wasted latency.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiMonitoring.modelsStatus.map((m: any) => (
                  <div
                    key={m.model}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      m.status === 'healthy'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-amber-50/50 border-amber-200'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-mono font-bold text-gray-900">{m.model}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Success: {m.successCount} • Failures: {m.failureCount}
                      </p>
                      {m.lastErrorCategory && m.status !== 'healthy' && (
                        <p className="text-[10px] text-amber-800 font-semibold mt-0.5">
                          Last error: {m.lastErrorCategory} ({m.cooldownRemainingSeconds}s cooldown)
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        m.status === 'healthy'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent AI Request Timestamps & Logs */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Recent AI Request Timestamps & Audit Log</h3>
              <p className="text-xs text-gray-400">
                Chronological log of recent AI requests, active provider, model used, user role, latency, and outcome.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-400 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">AI Feature</th>
                    <th className="p-3">User / Role</th>
                    <th className="p-3">Provider</th>
                    <th className="p-3">Model Used</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Latency</th>
                    <th className="p-3">Error Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!aiMonitoring?.recentLogs || aiMonitoring.recentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-gray-400">
                        No AI requests logged yet. Trigger "Suggest with AI" or "Generate Analysis" to see live telemetry.
                      </td>
                    </tr>
                  ) : (
                    aiMonitoring.recentLogs.map((req: any) => (
                      <tr key={req.id} className="hover:bg-gray-50/60">
                        <td className="p-3 font-mono text-[11px] text-gray-500">
                          {new Date(req.timestamp).toLocaleDateString()}{' '}
                          {new Date(req.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-3 font-bold text-gray-900">{req.featureLabel || req.feature}</td>
                        <td className="p-3 text-gray-600">
                          {req.userName} <span className="text-[10px] text-gray-400">({req.userRole})</span>
                        </td>
                        <td className="p-3 text-gray-700">{req.provider}</td>
                        <td className="p-3 font-mono text-[11px] text-[#6355F4]">{req.model}</td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              req.cached
                                ? 'bg-indigo-100 text-indigo-800'
                                : req.status === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {req.cached ? 'CACHED' : req.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px]">{req.latencyMs} ms</td>
                        <td className="p-3 font-mono text-[10px] text-red-600">
                          {req.errorCategory || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL A: MARK MENTOR AS LEFT (CONFIRMATION & RESPONSIBILITY HANDOVER) */}
      {/* ===================================================================== */}
      {offboardingMentor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                    Official Offboarding Action
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mt-0.5">
                    Mark Mentor as Left
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOffboardingMentor(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Mentor Identity Summary */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={offboardingMentor.avatar}
                    alt={offboardingMentor.name}
                    size="md"
                    shape="rounded-square"
                    border={true}
                    statusBadge={offboardingMentor.status}
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      Mentor Name: {offboardingMentor.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {offboardingMentor.email} • {offboardingMentor.company}
                    </p>
                  </div>
                </div>
                {renderMentorStatusBadge(offboardingMentor.status)}
              </div>

              {/* Responsibility Check & Reassignment Section */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-950">
                      Active Responsibilities & Handover Check
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Review this mentor&apos;s current startups, cohorts, and upcoming sessions before completing offboarding:
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-white border border-amber-200/80">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Assigned Startups
                    </span>
                    <span className="text-sm font-black text-gray-900">
                      {offboardingMentor.assignedStartups?.length || 0}
                    </span>
                    {offboardingMentor.assignedStartups?.length > 0 && (
                      <p className="text-[10px] text-indigo-700 font-medium mt-0.5 truncate">
                        {offboardingMentor.assignedStartups.map((s) => s.name).join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-amber-200/80">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Assigned Cohorts
                    </span>
                    <span className="text-sm font-black text-gray-900">
                      {offboardingMentor.assignedCohorts?.length || 0}
                    </span>
                    {offboardingMentor.assignedCohorts?.length > 0 && (
                      <p className="text-[10px] text-emerald-700 font-medium mt-0.5 truncate">
                        {offboardingMentor.assignedCohorts.map((c) => c.name).join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-amber-200/80">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Upcoming Sessions
                    </span>
                    <span className="text-sm font-black text-gray-900">
                      {offboardingMentor.activeSessions?.length || 0}
                    </span>
                    {offboardingMentor.activeSessions?.length > 0 && (
                      <p className="text-[10px] text-amber-700 font-medium mt-0.5 truncate">
                        {offboardingMentor.activeSessions.map((s) => s.topic).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Reassign Responsibilities Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-amber-950 mb-1">
                    Reassign Startups, Cohorts & Upcoming Sessions to Approved Active Mentor (Optional):
                  </label>
                  <select
                    value={offboardReassignMentorId}
                    onChange={(e) => setOffboardReassignMentorId(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-amber-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  >
                    <option value="">
                      -- Unassign from active roster (Cancel upcoming sessions) --
                    </option>
                    {activeMentors
                      .filter((m) => m.id !== offboardingMentor.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          Reassign to {m.name} ({m.company} • {m.expertise?.slice(0, 2).join(', ')})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Offboarding Form Fields */}
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Reason for Leaving <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={offboardReason}
                    onChange={(e) => setOffboardReason(e.target.value)}
                    className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4] focus:bg-white"
                  >
                    <option value="Completed Tenure / Contract Ended">
                      Completed Tenure / Contract Ended
                    </option>
                    <option value="Full-Time Executive Role / Career Transition">
                      Full-Time Executive Role / Career Transition
                    </option>
                    <option value="Relocation / Timezone Unavailable">
                      Relocation / Timezone Unavailable
                    </option>
                    <option value="Personal / Sabbatical Leave">Personal / Sabbatical Leave</option>
                    <option value="Administrative Offboarding">Administrative Offboarding</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Last Working Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={offboardLastDate}
                    onChange={(e) => setOffboardLastDate(e.target.value)}
                    className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4] focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Additional Notes & Handover Summary
                </label>
                <textarea
                  rows={3}
                  value={offboardNotes}
                  onChange={(e) => setOffboardNotes(e.target.value)}
                  placeholder="Document exit notes, cohort handover context, or eligibility for future reactivation..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4] focus:bg-white"
                />
              </div>

              {/* Automated Actions Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">
                  Automated Offboarding Operations upon Confirmation:
                </p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Changes Mentor status to <strong>LEFT</strong> and removes from Active Mentors list.</li>
                  <li>Immediately revokes Mentor Dashboard access & blocks future login sessions.</li>
                  <li>Stops new session bookings & removes active cohort assignments.</li>
                  <li>Preserves all completed sessions, startup mentorship history, and founder feedback.</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setOffboardingMentor(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOffboarding}
                disabled={isSubmittingAction}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isSubmittingAction ? 'Processing Offboarding...' : 'Confirm Offboarding'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL B: VIEW MENTOR DETAILS & PRESERVED HISTORICAL RECORDS           */}
      {/* ===================================================================== */}
      {viewingMentorDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3.5">
                <UserAvatar
                  src={viewingMentorDetails.avatar}
                  alt={viewingMentorDetails.name}
                  size="lg"
                  shape="rounded-square"
                  border={true}
                  statusBadge={viewingMentorDetails.status}
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                      {viewingMentorDetails.name}
                    </h3>
                    {renderMentorStatusBadge(viewingMentorDetails.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {viewingMentorDetails.title} • {viewingMentorDetails.company} (
                    {viewingMentorDetails.yearsExperience} yrs exp)
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {viewingMentorDetails.email} • {viewingMentorDetails.phone}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingMentorDetails(null)}
                className="self-end sm:self-center p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-navigation Tabs inside Mentor Details Modal */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-gray-100 pb-2.5 mb-4">
              {(
                [
                  { id: 'overview', label: 'Profile & Status' },
                  {
                    id: 'assignments',
                    label: `Startups & Cohorts (${
                      (viewingMentorDetails.assignedStartupsCount || 0) +
                      (viewingMentorDetails.assignedCohortsCount || 0)
                    })`,
                  },
                  {
                    id: 'sessions',
                    label: `Sessions History (${
                      (viewingMentorDetails.activeSessionsCount || 0) +
                      (viewingMentorDetails.completedSessionsCount || 0)
                    })`,
                  },
                  {
                    id: 'feedback',
                    label: `Student Feedback (${viewingMentorDetails.studentFeedback?.length || 0})`,
                  },
                  {
                    id: 'audit',
                    label: `Audit Trail (${viewingMentorDetails.offboardingHistory?.length || 0})`,
                  },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMentorDetailsTab(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
                    mentorDetailsTab === t.id
                      ? 'bg-[#6355F4] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sub-tab 1: Profile & Offboarding Status */}
            {mentorDetailsTab === 'overview' && (
              <div className="space-y-4 text-xs">
                {viewingMentorDetails.status === 'left' && viewingMentorDetails.offboardingDetails && (
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <LogOut className="w-3.5 h-3.5" /> Official Offboarding Record (Historical Archive Preserved)
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600">
                        Last Working Date:{' '}
                        {new Date(
                          viewingMentorDetails.offboardingDetails.lastWorkingDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">
                      Reason for Leaving: {viewingMentorDetails.offboardingDetails.reason}
                    </p>
                    {viewingMentorDetails.offboardingDetails.additionalNotes && (
                      <p className="text-xs text-slate-700">
                        Notes: {viewingMentorDetails.offboardingDetails.additionalNotes}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-slate-600">
                      <span>
                        Offboarded By: <strong>{viewingMentorDetails.offboardingDetails.offboardedBy}</strong>
                      </span>
                      {viewingMentorDetails.offboardingDetails.reassignedToMentorName && (
                        <span>
                          Responsibilities Reassigned To:{' '}
                          <strong className="text-[#6355F4]">
                            {viewingMentorDetails.offboardingDetails.reassignedToMentorName}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Joining Date
                    </span>
                    <span className="text-sm font-extrabold text-gray-900 mt-0.5 block">
                      {new Date(
                        viewingMentorDetails.joiningDate || viewingMentorDetails.createdAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Completed Sessions
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600 mt-0.5 block">
                      {viewingMentorDetails.completedSessionsCount || 0} Sessions
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Performance Rating
                    </span>
                    <span className="text-sm font-extrabold text-amber-600 mt-0.5 block">
                      {viewingMentorDetails.averageRating
                        ? `★ ${viewingMentorDetails.averageRating} / 5.0`
                        : 'No ratings yet'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Startups Mentored
                    </span>
                    <span className="text-sm font-extrabold text-[#6355F4] mt-0.5 block">
                      {viewingMentorDetails.mentorshipHistoryStartups?.length ||
                        viewingMentorDetails.assignedStartupsCount ||
                        0}{' '}
                      Ventures
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Areas of Expertise
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(viewingMentorDetails.expertise || []).map((exp, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 text-[#6355F4] font-semibold text-xs"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Advisory Bio
                  </h4>
                  <p className="p-3.5 rounded-2xl bg-gray-50 text-gray-700 leading-relaxed">
                    {viewingMentorDetails.bio || 'No biography provided.'}
                  </p>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Startups & Cohorts (Active + Historical) */}
            {mentorDetailsTab === 'assignments' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900">
                    Active Assigned Startups ({viewingMentorDetails.assignedStartups?.length || 0})
                  </h4>
                  {viewingMentorDetails.assignedStartups?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setReassigningMentor(viewingMentorDetails);
                        setReassignTargetMentorId('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6355F4] text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Reassign Responsibilities</span>
                    </button>
                  )}
                </div>

                {viewingMentorDetails.assignedStartups?.length === 0 ? (
                  <p className="p-4 rounded-2xl bg-gray-50 text-gray-500">
                    No active startups currently assigned.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {viewingMentorDetails.assignedStartups.map((st) => (
                      <div
                        key={st.id}
                        className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{st.name}</p>
                          <p className="text-[11px] text-gray-500">
                            {st.industry} • {st.stage} • Founder: {st.founderName}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <h4 className="font-bold text-gray-900 pt-2">
                  Assigned Cohorts ({viewingMentorDetails.assignedCohorts?.length || 0})
                </h4>
                {viewingMentorDetails.assignedCohorts?.length === 0 ? (
                  <p className="p-4 rounded-2xl bg-gray-50 text-gray-500">
                    No active cohorts currently assigned.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {viewingMentorDetails.assignedCohorts.map((c) => (
                      <div
                        key={c.id}
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold"
                      >
                        {c.name} {c.batchCode ? `(${c.batchCode})` : ''}
                      </div>
                    ))}
                  </div>
                )}

                {/* Historical Startups Mentored */}
                {viewingMentorDetails.mentorshipHistoryStartups?.length > 0 && (
                  <div className="pt-2">
                    <h4 className="font-bold text-gray-900 mb-2">
                      Preserved Startup Mentorship History ({viewingMentorDetails.mentorshipHistoryStartups.length})
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {viewingMentorDetails.mentorshipHistoryStartups.map((st) => (
                        <div
                          key={st.id}
                          className="p-3 rounded-xl bg-gray-50 border border-gray-200/70 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-gray-800">{st.name}</p>
                            <p className="text-[10px] text-gray-500">
                              {st.industry} • {st.stage}
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold text-gray-500">
                            Historical Record
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab 3: Active & Completed Historical Sessions */}
            {mentorDetailsTab === 'sessions' && (
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    Upcoming / Active Sessions ({viewingMentorDetails.activeSessions?.length || 0})
                  </h4>
                  {viewingMentorDetails.activeSessions?.length === 0 ? (
                    <p className="p-3.5 rounded-2xl bg-gray-50 text-gray-500">
                      No upcoming sessions scheduled.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {viewingMentorDetails.activeSessions.map((ses) => (
                        <div
                          key={ses.id}
                          className="p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/40 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-gray-900">{ses.topic}</p>
                            <p className="text-[11px] text-gray-600">
                              Startup: <strong>{ses.startupName}</strong> • {ses.date} at {ses.time} ({ses.duration})
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                            {ses.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    Completed Historical Sessions ({viewingMentorDetails.completedSessions?.length || 0})
                  </h4>
                  {viewingMentorDetails.completedSessions?.length === 0 ? (
                    <p className="p-3.5 rounded-2xl bg-gray-50 text-gray-500">
                      No completed sessions on record yet.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {viewingMentorDetails.completedSessions.map((ses) => (
                        <div
                          key={ses.id}
                          className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-gray-900">
                              {ses.topic} — <span className="text-[#6355F4]">{ses.startupName}</span>
                            </p>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              COMPLETED • {ses.date}
                            </span>
                          </div>
                          {ses.notes && (
                            <p className="text-[11px] text-gray-600">
                              <strong>Session Notes:</strong> {ses.notes}
                            </p>
                          )}
                          {ses.feedback && (
                            <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200/60">
                              <strong>Founder Feedback {ses.rating ? `(★ ${ses.rating}/5)` : ''}:</strong>{' '}
                              &ldquo;{ses.feedback}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-tab 4: Student / Founder Feedback & Performance */}
            {mentorDetailsTab === 'feedback' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">
                      Preserved Mentorship Performance & Student Feedback
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      All founder reviews and session ratings are permanently retained in the database.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-[#6355F4]">
                      {viewingMentorDetails.averageRating
                        ? `★ ${viewingMentorDetails.averageRating} / 5.0`
                        : 'N/A'}
                    </span>
                    <span className="block text-[10px] text-gray-400">Overall Rating</span>
                  </div>
                </div>

                {!viewingMentorDetails.studentFeedback ||
                viewingMentorDetails.studentFeedback.length === 0 ? (
                  <p className="p-6 text-center text-gray-400 bg-gray-50 rounded-2xl">
                    No written student/founder feedback recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {viewingMentorDetails.studentFeedback.map((fb) => (
                      <div
                        key={fb.sessionId}
                        className="p-4 rounded-2xl border border-gray-200 bg-white space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">
                            {fb.startupName} • {fb.topic}
                          </span>
                          <span className="text-xs font-bold text-amber-600">
                            {fb.rating ? `★ ${fb.rating} / 5` : 'Reviewed'} • {fb.date}
                          </span>
                        </div>
                        <p className="text-gray-600 italic">&ldquo;{fb.feedback}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab 5: Audit History */}
            {mentorDetailsTab === 'audit' && (
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-gray-900">
                  Mentor Account Lifecycle & Offboarding Audit Trail
                </h4>
                {!viewingMentorDetails.offboardingHistory ||
                viewingMentorDetails.offboardingHistory.length === 0 ? (
                  <p className="p-6 text-center text-gray-400 bg-gray-50 rounded-2xl">
                    No status transitions or offboarding events recorded for this mentor yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {viewingMentorDetails.offboardingHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-start justify-between gap-3"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-[#6355F4]">
                            {item.action.toUpperCase()}
                          </span>
                          <p className="font-bold text-gray-900 mt-1">
                            {item.reason || 'Administrative status update'}
                          </p>
                          {item.notes && <p className="text-gray-600 mt-0.5">{item.notes}</p>}
                          <p className="text-[10px] text-gray-400 mt-1">
                            Authorized by: {item.performedBy}
                            {item.reassignedToMentorName
                              ? ` • Reassigned to: ${item.reassignedToMentorName}`
                              : ''}
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer Action Buttons inside Mentor Details Modal */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditMentor(viewingMentorDetails)}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Mentor</span>
                </button>

                {viewingMentorDetails.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => handleOpenSuspendModal(viewingMentorDetails)}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Suspend Mentor</span>
                  </button>
                )}

                {viewingMentorDetails.status !== 'left' && (
                  <button
                    type="button"
                    onClick={() => handleOpenOffboardModal(viewingMentorDetails)}
                    className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Mark as Left</span>
                  </button>
                )}

                {(viewingMentorDetails.status === 'left' ||
                  viewingMentorDetails.status === 'suspended') && (
                  <button
                    type="button"
                    onClick={() => handleOpenReactivateModal(viewingMentorDetails)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reactivate Mentor</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setViewingMentorDetails(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL C: EDIT MENTOR PROFILE & COHORT ASSIGNMENTS                     */}
      {/* ===================================================================== */}
      {editingMentor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditMentor}
            className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                  Edit Mentor Profile & Cohorts
                </h3>
                <p className="text-xs text-gray-500">Updating record for {editingMentor.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMentor(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editMentorForm.name}
                    onChange={(e) => setEditMentorForm({ ...editMentorForm, name: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editMentorForm.email}
                    onChange={(e) =>
                      setEditMentorForm({ ...editMentorForm, email: e.target.value })
                    }
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editMentorForm.phone}
                    onChange={(e) =>
                      setEditMentorForm({ ...editMentorForm, phone: e.target.value })
                    }
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Role / Title</label>
                  <input
                    type="text"
                    value={editMentorForm.title}
                    onChange={(e) =>
                      setEditMentorForm({ ...editMentorForm, title: e.target.value })
                    }
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Company / Fund</label>
                  <input
                    type="text"
                    value={editMentorForm.company}
                    onChange={(e) =>
                      setEditMentorForm({ ...editMentorForm, company: e.target.value })
                    }
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={editMentorForm.joiningDate}
                    onChange={(e) =>
                      setEditMentorForm({ ...editMentorForm, joiningDate: e.target.value })
                    }
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={editMentorForm.yearsExperience}
                    onChange={(e) =>
                      setEditMentorForm({
                        ...editMentorForm,
                        yearsExperience: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Areas of Expertise (comma-separated)
                </label>
                <input
                  type="text"
                  value={editMentorForm.expertiseText}
                  onChange={(e) =>
                    setEditMentorForm({ ...editMentorForm, expertiseText: e.target.value })
                  }
                  placeholder="e.g. Venture Capital, B2B SaaS, AI Architecture, Fundraising"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                />
              </div>

              {/* Assigned Cohorts Checkboxes */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Assigned Cohorts</label>
                <div className="grid sm:grid-cols-2 gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  {cohorts.map((cohort) => {
                    const checked = editMentorForm.assignedCohorts.includes(cohort.id);
                    return (
                      <label
                        key={cohort.id}
                        className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditMentorForm({
                                ...editMentorForm,
                                assignedCohorts: [...editMentorForm.assignedCohorts, cohort.id],
                              });
                            } else {
                              setEditMentorForm({
                                ...editMentorForm,
                                assignedCohorts: editMentorForm.assignedCohorts.filter(
                                  (id) => id !== cohort.id
                                ),
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-[#6355F4] focus:ring-[#6355F4]"
                        />
                        <span className="font-medium">{cohort.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Bio & Advisory Focus</label>
                <textarea
                  rows={3}
                  value={editMentorForm.bio}
                  onChange={(e) => setEditMentorForm({ ...editMentorForm, bio: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setEditingMentor(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingAction}
                className="px-5 py-2 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction ? 'Saving...' : 'Save Mentor Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL D: SUSPEND MENTOR MODAL                                         */}
      {/* ===================================================================== */}
      {suspendingMentor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Suspend Mentor Account</h3>
                <p className="text-[11px] text-gray-500">Mentor: {suspendingMentor.name}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Suspending a mentor temporarily revokes Mentor Dashboard access and prevents new session bookings while keeping their profile eligible for quick reactivation.
            </p>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Reason for Suspension</label>
                <input
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                  required
                />
              </div>

              {suspendingMentor.assignedStartupsCount > 0 && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Reassign {suspendingMentor.assignedStartupsCount} Active Startup(s) (Optional)
                  </label>
                  <select
                    value={suspendReassignMentorId}
                    onChange={(e) => setSuspendReassignMentorId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                  >
                    <option value="">-- Keep current startup assignments --</option>
                    {activeMentors
                      .filter((m) => m.id !== suspendingMentor.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          Reassign to {m.name} ({m.company})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  value={suspendNotes}
                  onChange={(e) => setSuspendNotes(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSuspendingMentor(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspend}
                disabled={isSubmittingAction || !suspendReason.trim()}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL E: REACTIVATE MENTOR MODAL (RESTORE PREVIOUS ACCOUNT)           */}
      {/* ===================================================================== */}
      {reactivatingMentor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  Admin Re-Authorization
                </span>
                <h3 className="text-base font-extrabold text-gray-900 mt-0.5">
                  Reactivate Mentor Account
                </h3>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{reactivatingMentor.name}</p>
                  <p className="text-[11px] text-gray-500">
                    {reactivatingMentor.email} • {reactivatingMentor.company}
                  </p>
                </div>
                {renderMentorStatusBadge(reactivatingMentor.status)}
              </div>

              {reactivatingMentor.offboardingDetails && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] text-slate-700">
                  <p className="font-bold text-slate-900">Previous Offboarding Record:</p>
                  <p>Reason: {reactivatingMentor.offboardingDetails.reason}</p>
                  <p>
                    Last Working Date:{' '}
                    {new Date(
                      reactivatingMentor.offboardingDetails.lastWorkingDate
                    ).toLocaleDateString()}
                  </p>
                  <p className="text-emerald-700 font-semibold pt-1">
                    ✓ All {reactivatingMentor.completedSessionsCount || 0} completed sessions and historical feedback records will be preserved without creating duplicate accounts.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  Restore Cohort Assignments (Optional)
                </label>
                <div className="grid sm:grid-cols-2 gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  {cohorts.map((cohort) => {
                    const checked = reactivateCohorts.includes(cohort.id);
                    return (
                      <label
                        key={cohort.id}
                        className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReactivateCohorts([...reactivateCohorts, cohort.id]);
                            } else {
                              setReactivateCohorts(
                                reactivateCohorts.filter((id) => id !== cohort.id)
                              );
                            }
                          }}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-medium">{cohort.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Admin Reactivation Authorization Notes
                </label>
                <textarea
                  rows={2}
                  value={reactivateNotes}
                  onChange={(e) => setReactivateNotes(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setReactivatingMentor(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReactivate}
                disabled={isSubmittingAction}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isSubmittingAction ? 'Reactivating...' : 'Authorize & Reactivate Mentor'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL F: REASSIGN RESPONSIBILITIES MODAL                              */}
      {/* ===================================================================== */}
      {reassigningMentor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6355F4] flex items-center justify-center shrink-0">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Reassign Mentor Responsibilities</h3>
                <p className="text-[11px] text-gray-500">From: {reassigningMentor.name}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Transfer all currently assigned startups, cohorts, and upcoming sessions from{' '}
              <strong>{reassigningMentor.name}</strong> to another verified active mentor.
            </p>

            <div className="mb-4 text-xs">
              <label className="block font-bold text-gray-700 mb-1">
                Select Replacement Active Mentor:
              </label>
              <select
                value={reassignTargetMentorId}
                onChange={(e) => setReassignTargetMentorId(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
              >
                <option value="">-- Choose active mentor --</option>
                {activeMentors
                  .filter((m) => m.id !== reassigningMentor.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.company})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReassigningMentor(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                disabled={isSubmittingAction || !reassignTargetMentorId}
                className="px-4 py-2 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction ? 'Reassigning...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 1: VIEW FOUNDER DETAILS ----------------- */}
      {viewingFounder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={viewingFounder.avatar}
                  alt={viewingFounder.name}
                  size="lg"
                  shape="rounded-square"
                  border={true}
                  statusBadge={viewingFounder.status}
                />
                <div>
                  <h3 className="text-base font-bold text-gray-900">{viewingFounder.name}</h3>
                  <p className="text-xs text-gray-500">
                    Founder & CEO • {viewingFounder.startupName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingFounder(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-gray-50 rounded-2xl space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">Email Address:</span>
                  <span className="font-semibold text-gray-900">{viewingFounder.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone Number:</span>
                  <span className="font-semibold text-gray-900">{viewingFounder.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Account Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                      viewingFounder.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {viewingFounder.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Registered On:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(viewingFounder.registrationDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Active:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(viewingFounder.lastLogin).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Startup Venture Details
                </h4>
                <div className="grid grid-cols-2 gap-3 p-4 bg-purple-50/40 rounded-2xl border border-purple-100">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Startup Name</span>
                    <span className="font-bold text-gray-900 text-sm">
                      {viewingFounder.startupName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Industry</span>
                    <span className="font-bold text-[#6355F4]">
                      {viewingFounder.startupIndustry}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Funding Raised</span>
                    <span className="font-bold text-gray-900">
                      {formatINR(viewingFounder.fundingRaised)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Monthly Revenue</span>
                    <span className="font-bold text-gray-900">
                      {formatINR(viewingFounder.monthlyRevenue)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                  Founder Bio & Mission
                </h4>
                <p className="p-3 bg-gray-50 rounded-xl text-gray-600 leading-relaxed">
                  {viewingFounder.bio}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                onClick={() => handleToggleFounderStatus(viewingFounder)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewingFounder.status === 'active'
                    ? 'bg-red-50 hover:bg-red-100 text-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {viewingFounder.status === 'active' ? 'Suspend Account' : 'Activate Account'}
              </button>
              <button
                onClick={() => setViewingFounder(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: VIEW MENTOR APPLICATION DETAILS ----------------- */}
      {viewingApp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={viewingApp.avatar}
                  alt={viewingApp.name}
                  size="lg"
                  shape="rounded-square"
                  border={true}
                  statusBadge={
                    viewingApp.status === 'pending'
                      ? 'pending'
                      : viewingApp.status === 'approved'
                      ? 'active'
                      : 'rejected'
                  }
                />
                <div>
                  <h3 className="text-base font-bold text-gray-900">{viewingApp.name}</h3>
                  <p className="text-xs text-gray-500">
                    {viewingApp.title} • {viewingApp.company}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingApp(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-gray-50 rounded-2xl space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">Email Address:</span>
                  <span className="font-semibold text-gray-900">{viewingApp.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone Number:</span>
                  <span className="font-semibold text-gray-900">{viewingApp.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Years of Experience:</span>
                  <span className="font-semibold text-gray-900">
                    {viewingApp.yearsExperience} Years
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Application Date:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(viewingApp.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                      viewingApp.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : viewingApp.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {viewingApp.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                  Qualifications & Credentials
                </h4>
                <p className="p-3 bg-purple-50/50 rounded-xl text-gray-700 font-medium">
                  {viewingApp.qualifications || 'Startup Advisor & Industry Specialist'}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                  Bio & Professional Summary
                </h4>
                <p className="p-3 bg-gray-50 rounded-xl text-gray-600 leading-relaxed">
                  {viewingApp.bio}
                </p>
              </div>

              {viewingApp.expertise && viewingApp.expertise.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                    Areas of Expertise
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingApp.expertise.map((exp, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 text-[#6355F4] font-semibold text-[11px]"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewingApp.linkedIn && (
                <div className="pt-1">
                  <a
                    href={viewingApp.linkedIn}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#6355F4] hover:underline flex items-center gap-1"
                  >
                    View LinkedIn Profile <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
              {viewingApp.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(viewingApp.id, viewingApp.name);
                      setViewingApp(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Approve Mentor
                  </button>
                  <button
                    onClick={() => {
                      setRejectingApp(viewingApp);
                      setRejectionReason(
                        'Does not meet current domain or experience requirements.'
                      );
                      setViewingApp(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold cursor-pointer"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setViewingApp(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 3: REJECT MENTOR WITH REASON ----------------- */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Reject Mentor Application</h3>
                <p className="text-[11px] text-gray-500">Applicant: {rejectingApp.name}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Please specify the rejection reason. The applicant will be notified and access to the Mentor Dashboard will remain blocked.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Rejection Reason / Feedback:
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Insufficient verified domain experience or lack of active advisory availability."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-red-500 focus:bg-white"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingApp(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={isSubmittingAction || !rejectionReason.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
