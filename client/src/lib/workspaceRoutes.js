export const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', tone: 'violet' },
  { id: 'startups', label: 'Startups', icon: 'startups', tone: 'blue' },
  { id: 'cohorts', label: 'Cohorts', icon: 'cohorts', tone: 'teal' },
  { id: 'mentors', label: 'Mentors', icon: 'mentors', tone: 'rose' },
  { id: 'sessions', label: 'Mentor sessions', icon: 'sessions', tone: 'amber' },
  { id: 'milestones', label: 'Milestones & tasks', icon: 'milestones', tone: 'green' },
  { id: 'resources', label: 'Resources', icon: 'resources', tone: 'sky' },
  { id: 'courses', label: 'Courses & learning', icon: 'courses', tone: 'indigo' },
]

export const insightNavigation = [
  { id: 'analytics', label: 'Analytics & reports', icon: 'analytics', tone: 'blue' },
  { id: 'ai-insights', label: 'AI insights', icon: 'ai', tone: 'violet' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications', tone: 'orange' },
  { id: 'settings', label: 'Settings', icon: 'settings', tone: 'slate' },
]

export const workspacePageIds = new Set([...navigation, ...insightNavigation].map(({ id }) => id))
