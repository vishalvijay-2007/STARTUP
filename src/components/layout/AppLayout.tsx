import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users2,
  UserCheck,
  CalendarCheck,
  CheckSquare,
  Package,
  GraduationCap,
  BarChart3,
  Sparkles,
  Bell,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowLeftRight,
  LogOut,
  Shield,
  Compass,
  X,
  Plus,
  Globe,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import { UserAvatar } from '../common/UserAvatar';

export type ActiveTab =
  | 'dashboard'
  | 'startups'
  | 'cohorts'
  | 'mentors'
  | 'sessions'
  | 'milestones'
  | 'resources'
  | 'courses'
  | 'analytics'
  | 'ai-insights'
  | 'notifications'
  | 'settings';

interface AppLayoutProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  children: React.ReactNode;
  onOpenAddStartup?: () => void;
  unreadCount?: number;
  onGoToLanding?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  setActiveTab,
  children,
  onOpenAddStartup,
  unreadCount = 2,
  onGoToLanding,
}) => {
  const { user, logout, switchRole } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const showFullSidebar = !isSidebarCollapsed || isMobileMenuOpen;

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return user?.role === 'admin'
          ? 'Admin Dashboard'
          : user?.role === 'mentor'
          ? 'Mentor Dashboard'
          : 'Founder Dashboard';
      case 'startups':
        return 'Startups';
      case 'cohorts':
        return 'Cohorts';
      case 'mentors':
        return 'Mentors';
      case 'sessions':
        return 'Mentor sessions';
      case 'milestones':
        return 'Milestones & tasks';
      case 'resources':
        return 'Resources';
      case 'courses':
        return 'Courses & learning';
      case 'analytics':
        return 'Analytics & reports';
      case 'ai-insights':
        return 'AI insights';
      case 'notifications':
        return 'Notifications';
      case 'settings':
        return 'Workspace settings';
      default:
        return 'Dashboard';
    }
  };

  const navItemsWorkspace = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'startups' as ActiveTab, label: 'Startups', icon: Building2 },
    { id: 'cohorts' as ActiveTab, label: 'Cohorts', icon: Users2 },
    { id: 'mentors' as ActiveTab, label: 'Mentors', icon: UserCheck },
    { id: 'sessions' as ActiveTab, label: 'Mentor sessions', icon: CalendarCheck },
    { id: 'milestones' as ActiveTab, label: 'Milestones & tasks', icon: CheckSquare },
    { id: 'resources' as ActiveTab, label: 'Resources', icon: Package },
    { id: 'courses' as ActiveTab, label: 'Courses & learning', icon: GraduationCap },
  ];

  const navItemsInsights = [
    { id: 'analytics' as ActiveTab, label: 'Analytics & reports', icon: BarChart3 },
    { id: 'ai-insights' as ActiveTab, label: 'AI insights', icon: Sparkles },
    { id: 'notifications' as ActiveTab, label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  const quickJumpItems = [
    { title: 'Founder Dashboard', tab: 'dashboard' as ActiveTab, role: 'All' },
    { title: 'PulseAI Diagnostics', tab: 'startups' as ActiveTab, role: 'Startups' },
    { title: 'GreenLogix Supply', tab: 'startups' as ActiveTab, role: 'Startups' },
    { title: 'Winter 2026 Tech Batch', tab: 'cohorts' as ActiveTab, role: 'Cohorts' },
    { title: 'Dr. Sarah Chen (B2B SaaS & AI)', tab: 'mentors' as ActiveTab, role: 'Mentors' },
    { title: 'Mastering the Seed Round Pitch Deck', tab: 'courses' as ActiveTab, role: 'Courses' },
    { title: 'AI Startup Strategy Assistant', tab: 'ai-insights' as ActiveTab, role: 'AI Engine' },
    { title: 'Google Cloud ₹75 Lakhs Credits', tab: 'resources' as ActiveTab, role: 'Resources' },
  ];

  const filteredQuickJump = quickJumpItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 h-16 flex items-center justify-between px-3 sm:px-6 gap-2">
        {/* Left: Mobile Menu Button + Breadcrumbs */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 font-medium min-w-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="hidden sm:inline shrink-0">Workspace</span>
          <span className="hidden sm:inline text-gray-300 shrink-0">/</span>
          <span className="text-gray-900 font-semibold truncate">{getBreadcrumbTitle()}</span>
          {user?.role && (
            <span
              className={`hidden min-[420px]:inline-flex ml-1 sm:ml-2 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                user.role === 'admin'
                  ? 'bg-purple-100 text-purple-700'
                  : user.role === 'mentor'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {user.role} view
            </span>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Mobile Search Icon Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
            title="Search workspace"
            aria-label="Search workspace"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Desktop Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 rounded-xl px-3.5 py-1.5 text-xs text-gray-400 transition-colors w-48 lg:w-64 justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">Search workspace...</span>
            </div>
            <kbd className="hidden lg:inline-block font-sans px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-500 shadow-2xs shrink-0">
              ⌘ / Ctrl K
            </kbd>
          </button>

          {/* Public Landing Page link */}
          {onGoToLanding && (
            <button
              onClick={onGoToLanding}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-[#6355F4] hover:bg-purple-50 border border-gray-200/80 transition-all cursor-pointer"
              title="Visit Public Landing Page"
            >
              <Globe className="w-3.5 h-3.5 text-[#6355F4] shrink-0" />
              <span className="hidden sm:inline">Public Site</span>
            </button>
          )}

          {/* Notifications bell */}
          <button
            onClick={() => setActiveTab('notifications')}
            className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#6355F4] rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* User Profile Pill / Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1 pr-2 sm:pr-2.5 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
            >
              <UserAvatar
                src={user?.avatar}
                alt={user?.name || 'User'}
                size="sm"
                shape="circle"
                border={true}
              />
              <span className="text-sm font-semibold text-gray-700 hidden sm:inline max-w-[110px] truncate">
                {user?.name || 'vishal'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2.5 border-b border-gray-100 mb-1 flex items-center gap-3">
                  <UserAvatar
                    src={user?.avatar}
                    alt={user?.name || 'User'}
                    size="md"
                    shape="rounded-square"
                    border={true}
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs text-gray-400 font-medium">Signed in as</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>

                {/* Quick Role Switcher (For Evaluation & Demo) */}
                <div className="px-3 py-2 bg-purple-50/60 rounded-xl mb-1">
                  <p className="text-[11px] font-semibold text-[#6355F4] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <ArrowLeftRight className="w-3 h-3" /> Quick Switch Role
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {(['founder', 'mentor', 'admin'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          switchRole(r);
                          setIsUserMenuOpen(false);
                          setActiveTab('dashboard');
                        }}
                        className={`text-xs py-1 rounded-lg font-medium capitalize transition-all ${
                          user?.role === r
                            ? 'bg-[#6355F4] text-white shadow-xs'
                            : 'bg-white hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Account Settings
                </button>

                <button
                  onClick={() => {
                    setActiveTab('ai-insights');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI Assistant & Tools
                </button>

                {onGoToLanding && (
                  <button
                    onClick={() => {
                      onGoToLanding();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-purple-700 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Globe className="w-4 h-4 text-[#6355F4]" />
                    Public Landing Page
                  </button>
                )}

                <div className="border-t border-gray-100 my-1" />

                <button
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Drawer Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-150"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Left Sidebar: Slide-over drawer on mobile (< md), collapsible sidebar on tablet/desktop (md+) */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 md:z-30 bg-white border-r border-gray-100 flex flex-col justify-between transition-all duration-200 ease-in-out w-72 max-w-[85vw] md:max-w-none shrink-0 ${
            isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none'
          } ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}
        >
          {/* Top Brand & Workspace info */}
          <div className="flex flex-col min-h-0 flex-1">
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                {!showFullSidebar ? (
                  <BrandLogo
                    variant="compact"
                    size="sm"
                    onClick={onGoToLanding}
                    className="cursor-pointer"
                  />
                ) : (
                  <BrandLogo
                    variant="navbar"
                    size="sm"
                    onClick={onGoToLanding}
                    className="cursor-pointer"
                  />
                )}
              </div>
              {/* Desktop collapse button */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden md:flex p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              {/* Mobile close drawer button */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Nav Links */}
            <div className="py-4 px-3 space-y-6 overflow-y-auto flex-1">
              {/* Section 1: WORKSPACE */}
              <div>
                {showFullSidebar && (
                  <p className="px-3 text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-2">
                    WORKSPACE
                  </p>
                )}
                <div className="space-y-1">
                  {navItemsWorkspace.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                          isActive
                            ? 'bg-[#6355F4] text-white shadow-md shadow-purple-500/25 font-semibold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        } ${!showFullSidebar ? 'justify-center px-0' : ''}`}
                        title={item.label}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        {showFullSidebar && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: INSIGHTS */}
              <div>
                {showFullSidebar && (
                  <p className="px-3 text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-2">
                    INSIGHTS
                  </p>
                )}
                <div className="space-y-1">
                  {navItemsInsights.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                          isActive
                            ? 'bg-[#6355F4] text-white shadow-md shadow-purple-500/25 font-semibold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        } ${!showFullSidebar ? 'justify-center px-0' : ''}`}
                        title={item.label}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                          {showFullSidebar && <span className="truncate">{item.label}</span>}
                        </div>
                        {showFullSidebar && Boolean(item.badge && item.badge > 0) && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive ? 'bg-white text-[#6355F4]' : 'bg-purple-100 text-[#6355F4]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom user profile card matching Screenshot 2 & 13 */}
          <div className="p-3 border-t border-gray-100 shrink-0">
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 border border-gray-100">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <UserAvatar
                  src={user?.avatar}
                  alt={user?.name || 'User'}
                  size="sm"
                  shape="rounded-square"
                  border={true}
                />
                {showFullSidebar && (
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-900 truncate leading-tight">
                      {user?.name || 'vishal'}
                    </p>
                    <p className="text-[10px] text-gray-400 capitalize truncate mt-0.5">
                      {user?.role || 'Founder'}
                    </p>
                  </div>
                )}
              </div>
              {showFullSidebar && (
                <button
                  onClick={() => {
                    const next = user?.role === 'founder' ? 'mentor' : user?.role === 'mentor' ? 'admin' : 'founder';
                    switchRole(next);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#6355F4] hover:bg-white transition-colors shrink-0"
                  title="Switch to next role (Founder → Mentor → Admin)"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Center Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#F8FAFC] p-3.5 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto w-full space-y-6">{children}</div>
        </main>
      </div>

      {/* Global Quick Search Modal (Cmd+K) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-in fade-in duration-100">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-3 border-b border-gray-100 flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search startups, cohorts, mentors, resources, courses..."
                autoFocus
                className="w-full text-sm bg-transparent border-none outline-none placeholder:text-gray-400 text-gray-900"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto">
              {filteredQuickJump.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveTab(item.tab);
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-gray-50 rounded-xl text-left transition-colors"
                >
                  <span className="font-medium text-gray-800">{item.title}</span>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {item.role}
                  </span>
                </button>
              ))}
            </div>
            <div className="p-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 px-3">
              <span>Press ESC to exit</span>
              <span>⌘K to reopen</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
