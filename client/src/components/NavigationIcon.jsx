const iconArtwork = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  startups: (
    <>
      <path d="M4 20.5h16" />
      <path d="M6 20.5V8l6-4 6 4v12.5" />
      <path d="M9 20.5v-6h6v6M9 9.5h.01M15 9.5h.01" />
    </>
  ),
  cohorts: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19v-1.5a5.5 5.5 0 0 1 11 0V19z" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8M17 14a4.5 4.5 0 0 1 3.5 4.4V19h-3" />
    </>
  ),
  mentors: (
    <>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="m18.5 4 .8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z" />
    </>
  ),
  sessions: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17" />
      <circle cx="12" cy="14.5" r="3" />
      <path d="M12 13v1.7l1.2.8" />
    </>
  ),
  milestones: (
    <>
      <path d="m5 12.5 4.2 4.2L19 7" />
      <path d="M20 12v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h9" />
    </>
  ),
  resources: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" />
      <path d="M4 5.5v13M8 7h8M8 10.5h8" />
    </>
  ),
  courses: (
    <>
      <path d="m2.5 8.5 9.5-5 9.5 5-9.5 5z" />
      <path d="M6.5 11v5.5c3.4 2.6 7.6 2.6 11 0V11M21.5 9v6" />
    </>
  ),
  analytics: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      <path d="m3 7 5-3 5 4 7-5" />
    </>
  ),
  trendingUp: (
    <>
      <path d="M3.5 17.5 9 12l4 4 7.5-8" />
      <path d="M15.5 8H20v4.5" />
    </>
  ),
  completedSessions: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17" />
      <path d="m8.5 14 2.2 2.2 4.8-4.8" />
    </>
  ),
  milestoneFlag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 5c4-3 7 3 11 0l3-1v10l-3 1c-4 3-7-3-11 0" />
    </>
  ),
  progressChart: (
    <>
      <path d="M12 3.5v8.5h8.5" />
      <path d="M19.2 16.8A8.5 8.5 0 1 1 7.2 4.6" />
      <path d="M14.5 3.8a8.5 8.5 0 0 1 5.7 5.7" />
    </>
  ),
  ai: (
    <>
      <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z" />
      <path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9zM5 3l.6 1.4L7 5l-1.4.6L5 7l-.6-1.4L3 5l1.4-.6z" />
    </>
  ),
  notifications: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  settings: (
    <>
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
      <path d="m19.4 15 .1.1 1.3 1-1.5 2.6-1.6-.6a8 8 0 0 1-1.5.9l-.3 1.7h-3l-.3-1.7a8 8 0 0 1-1.5-.9l-1.6.6-1.5-2.6 1.3-1a7 7 0 0 1 0-1.8l-1.3-1 1.5-2.6 1.6.6a8 8 0 0 1 1.5-.9l.3-1.7h3l.3 1.7a8 8 0 0 1 1.5.9l1.6-.6 1.5 2.6-1.3 1a7 7 0 0 1-.1 1.7z" />
    </>
  ),
}

function NavigationIcon({ name, tone, className = '' }) {
  return (
    <span className={`nav-icon nav-icon-${tone}${name === 'ai' ? ' nav-icon-ai' : ''}${className ? ` ${className}` : ''}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {iconArtwork[name]}
      </svg>
    </span>
  )
}

export default NavigationIcon
