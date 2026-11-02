import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { API_ORIGIN, apiRequest } from '../lib/api.js'
import { insightNavigation, navigation } from '../lib/workspaceRoutes.js'
import { fallbackCourseSuggestions } from '../../../shared/courseSuggestions.js'
import NavigationIcon from './NavigationIcon.jsx'
import ProfileAvatar from './ProfileAvatar.jsx'
import StartupLogo from './StartupLogo.jsx'

const collectionLabels = {
  startups: 'Startups',
  cohorts: 'Cohorts',
  mentors: 'Mentors',
  sessions: 'Mentor sessions',
  milestones: 'Milestones & tasks',
  resources: 'Resources',
}

const fields = {
  startups: [
    { name: 'name', label: 'Startup name', required: true },
    { name: 'industry', label: 'Industry' },
    { name: 'stage', label: 'Stage', type: 'select', options: ['Idea', 'Pre-seed', 'Seed', 'Series A', 'Growth'] },
    { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Paused', 'Graduated'] },
    { name: 'cohortId', label: 'Cohort', type: 'select', optionsFrom: 'cohorts', optional: true },
    { name: 'mentorIds', label: 'Assigned mentors', type: 'multiselect', optionsFrom: 'mentors', optional: true },
    { name: 'teamSize', label: 'Team size', type: 'number', min: 1 },
    { name: 'website', label: 'Website', type: 'url' },
    { name: 'location', label: 'Location' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  cohorts: [
    { name: 'name', label: 'Cohort name', required: true },
    { name: 'status', label: 'Status', type: 'select', options: ['Planned', 'Active', 'Completed'] },
    { name: 'startDate', label: 'Start date', type: 'date' },
    { name: 'endDate', label: 'End date', type: 'date' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  mentors: [
    { name: 'name', label: 'Mentor name', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'expertise', label: 'Expertise', type: 'textarea' },
    { name: 'availability', label: 'Availability' },
  ],
  sessions: [
    { name: 'startupId', label: 'Startup', type: 'select', optionsFrom: 'startups', required: true },
    { name: 'mentorId', label: 'Mentor', type: 'select', optionsFrom: 'mentors', optional: true },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'startTime', label: 'Start time', type: 'time' },
    { name: 'endTime', label: 'End time', type: 'time' },
    { name: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'Completed', 'Cancelled', 'Missed'] },
    { name: 'rating', label: 'Feedback rating (1–5)', type: 'number', min: 1, max: 5, optional: true },
    { name: 'agenda', label: 'Agenda', type: 'textarea' },
    { name: 'notes', label: 'Session notes', type: 'textarea' },
  ],
  milestones: [
    { name: 'startupId', label: 'Startup', type: 'select', optionsFrom: 'startups', required: true },
    { name: 'title', label: 'Milestone title', required: true },
    { name: 'status', label: 'Status', type: 'select', options: ['Not started', 'In progress', 'Completed'] },
    { name: 'dueDate', label: 'Due date', type: 'date' },
    { name: 'weight', label: 'Progress weight', type: 'number', min: 1, max: 100 },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  resources: [
    { name: 'name', label: 'Resource name', required: true },
    { name: 'category', label: 'Category', type: 'select', options: ['Workspace', 'Equipment', 'Software', 'Learning', 'Funding', 'Marketing', 'Other'] },
    { name: 'quantity', label: 'Total quantity', type: 'number', min: 1 },
    { name: 'available', label: 'Available quantity', type: 'number', min: 0 },
    { name: 'status', label: 'Status', type: 'select', options: ['Available', 'Allocated', 'Maintenance'] },
    { name: 'startupId', label: 'Allocate to startup', type: 'select', optionsFrom: 'startups', optional: true },
    { name: 'cohortId', label: 'Allocate to cohort', type: 'select', optionsFrom: 'cohorts', optional: true },
    { name: 'allocatedUntil', label: 'Allocation end date', type: 'date' },
  ],
}

const blankForms = {
  startups: { name: '', industry: '', stage: 'Idea', status: 'Active', cohortId: '', mentorIds: [], teamSize: '1', website: '', location: '', description: '' },
  cohorts: { name: '', status: 'Active', startDate: '', endDate: '', description: '' },
  mentors: { name: '', email: '', expertise: '', availability: '' },
  sessions: { startupId: '', mentorId: '', date: '', startTime: '', endTime: '', status: 'Scheduled', rating: '', agenda: '', notes: '' },
  milestones: { startupId: '', title: '', status: 'Not started', dueDate: '', weight: '1', description: '' },
  resources: { name: '', category: 'Other', quantity: '1', available: '1', status: 'Available', startupId: '', cohortId: '', allocatedUntil: '' },
}

const emptyData = { startups: [], cohorts: [], mentors: [], sessions: [], milestones: [], resources: [], courses: [], notifications: [] }

const readPaged = async (path) => {
  const result = await apiRequest(`/${path}?limit=100`)
  return result.items
}

const loadWorkspaceData = async () => {
  const [summary, startups, cohorts, mentors, sessions, milestones, resources, courses, notifications] = await Promise.all([
    apiRequest('/dashboard'),
    readPaged('startups'),
    readPaged('cohorts'),
    readPaged('mentors'),
    readPaged('sessions'),
    readPaged('milestones'),
    readPaged('resources'),
    apiRequest('/courses'),
    apiRequest('/notifications'),
  ])
  return {
    summary,
    data: { startups, cohorts, mentors, sessions, milestones, resources, courses, notifications: notifications.items },
    unreadCount: notifications.unreadCount,
  }
}

const displayDate = (value) => value
  ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
  : '—'

const displayTimestamp = (value) => value
  ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
  : '—'

const getStartupName = (id, startups) => startups.find((startup) => String(startup._id) === String(id))?.name || 'Startup'

function RecordForm({ type, initial, data, saving, onCancel, onCreateStartup, onSave }) {
  const [values, setValues] = useState(initial)
  const update = (name, value) => setValues((current) => ({ ...current, [name]: value }))

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel()
    }}>
      <section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{initial._id ? 'Update record' : 'New record'}</p>
            <h2 id="modal-heading">{initial._id ? `Edit ${collectionLabels[type].toLowerCase()}` : `Add ${collectionLabels[type].toLowerCase().replace(/s$/, '')}`}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close dialog" onClick={onCancel}>×</button>
        </div>
        <form className="record-form" onSubmit={(event) => {
          event.preventDefault()
          onSave(values)
        }}>
          {fields[type].map((field) => {
            const common = {
              id: field.name,
              name: field.name,
              required: Boolean(field.required && field.name !== 'startupId'),
              'aria-required': Boolean(field.required),
              value: values[field.name] ?? '',
              onChange: (event) => update(field.name, event.target.value),
            }
            const options = field.optionsFrom ? data[field.optionsFrom] : null
            return (
              <label className={field.type === 'textarea' ? 'field-wide' : ''} htmlFor={field.name} key={field.name}>
                {field.label}
                {field.type === 'textarea' ? (
                  <textarea {...common} rows="3" maxLength="2000" />
                ) : field.type === 'select' || field.type === 'multiselect' ? (
                  <select
                    {...common}
                    multiple={field.type === 'multiselect'}
                    value={field.type === 'multiselect' ? (values[field.name] || []).map(String) : common.value}
                    onChange={field.type === 'multiselect'
                      ? (event) => update(field.name, Array.from(event.target.selectedOptions, (option) => option.value))
                      : common.onChange}
                  >
                    {field.optional && <option value="">Not assigned</option>}
                    {field.name === 'startupId' && !field.optional && <option value="">Choose a startup</option>}
                    {!field.optional && !field.optionsFrom && <option value="">Choose one</option>}
                    {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                    {options?.map((option) => <option key={option._id} value={option._id}>{option.name}</option>)}
                  </select>
                ) : (
                  <input {...common} type={field.type || 'text'} min={field.min} max={field.max} step={field.type === 'number' ? '1' : undefined} />
                )}
                {field.name === 'startupId' && field.required && !options?.length && (
                  <span className="field-hint">
                    Create a startup before adding this record.{' '}
                    <button type="button" className="text-button" onClick={onCreateStartup}>Add startup</button>
                  </span>
                )}
              </label>
            )
          })}
          <div className="modal-actions field-wide">
            <button type="button" className="secondary-button" onClick={onCancel} disabled={saving}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : initial._id ? 'Save changes' : 'Create record'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">✦</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

function DataChart({ title, subtitle, items }) {
  const max = Math.max(1, ...items.map((item) => Number(item.count) || 0))
  return (
    <section className="surface-card data-chart">
      <div className="card-heading"><div><h2>{title}</h2><p>{subtitle}</p></div></div>
      {!items.length || items.every((item) => !item.count) ? (
        <p className="chart-empty">No data available for this period.</p>
      ) : (
        <div className="chart-rows">{items.map((item) => <div className="chart-row" key={item.label}>
          <div className="chart-label"><span>{item.label}</span><strong>{item.count}{item.suffix || ''}</strong></div>
          <div className="progress-track"><span style={{ width: `${Math.max(item.count ? 4 : 0, (Number(item.count) || 0) / max * 100)}%` }} /></div>
        </div>)}</div>
      )}
    </section>
  )
}

function IncubatorWorkspace({ user, activePage, onNavigate, onUserUpdated, onLogout }) {
  const [data, setData] = useState(emptyData)
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [courseForm, setCourseForm] = useState({ title: '', category: '', description: '', hours: '', file: null })
  const [courseSuggestions, setCourseSuggestions] = useState([])
  const [editingCourse, setEditingCourse] = useState(null)
  const [courseBusy, setCourseBusy] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [aiSource, setAiSource] = useState('')
  const [aiMessage, setAiMessage] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [chatSource, setChatSource] = useState('')
  const [chatNotice, setChatNotice] = useState('')
  const chatEndRef = useRef(null)
  const topbarRef = useRef(null)
  const searchInputRef = useRef(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [openPanel, setOpenPanel] = useState(null)
  const [activeSearchIndex, setActiveSearchIndex] = useState(0)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [notificationQuery, setNotificationQuery] = useState('')
  const [notificationFilter, setNotificationFilter] = useState('all')
  const [notificationSort, setNotificationSort] = useState('newest')
  const [refreshingNotifications, setRefreshingNotifications] = useState(false)

  const hasSession = Boolean(localStorage.getItem('authToken'))

  const normalizeNotification = (notification) => {
    const createdAt = notification.createdAt || new Date().toISOString()
    const rawCategory = String(notification.category || notification.type || 'system').toLowerCase()
    const category = rawCategory === 'session'
      ? 'mentorship'
      : rawCategory === 'milestone'
        ? 'milestones'
        : rawCategory === 'resource'
          ? 'resources'
          : rawCategory
    const actionLabel = notification.actionLabel || (
      category === 'mentorship' ? 'View session'
        : category === 'milestones' ? 'View milestone'
          : category === 'resources' ? 'Explore resource'
            : category === 'startup' ? 'View report'
              : 'Review settings')
    return {
      ...notification,
      category,
      createdAt,
      important: Boolean(notification.important),
      readAt: notification.readAt || null,
      actionLabel,
    }
  }

  const applyStoredNotificationOverrides = (serverNotifications = []) => {
    const savedNotifications = JSON.parse(localStorage.getItem('startup-notification-state') || 'null')
    if (!Array.isArray(savedNotifications) || !savedNotifications.length) return serverNotifications

    const nextMap = new Map((serverNotifications || []).map((notification) => [String(notification._id), notification]))
    for (const savedNotification of savedNotifications) {
      const key = String(savedNotification._id)
      if (!nextMap.has(key)) continue
      nextMap.set(key, { ...nextMap.get(key), ...savedNotification })
    }
    return [...nextMap.values()]
  }

  const updateNotificationState = (updater) => {
    setData((current) => {
      const nextNotifications = updater(current.notifications || [])
      localStorage.setItem('startup-notification-state', JSON.stringify(nextNotifications))
      return { ...current, notifications: nextNotifications }
    })
  }

  const refresh = useCallback(async () => {
    if (!hasSession) {
      setDashboard(null)
      setData(emptyData)
      setUnreadCount(0)
      setLoading(false)
      return
    }

    setLoading(true)
    setRefreshingNotifications(true)
    setError('')
    try {
      const workspace = await loadWorkspaceData()
      const mergedNotifications = applyStoredNotificationOverrides(workspace.data.notifications)
      setDashboard(workspace.summary)
      setData({ ...workspace.data, notifications: mergedNotifications })
      setUnreadCount(mergedNotifications.filter((item) => !item.readAt).length)
    } catch (requestError) {
      const message = requestError.message || ''
      if (!/unauthorized|authentication|required/i.test(message)) {
        setError(message)
      }
    } finally {
      setLoading(false)
      setRefreshingNotifications(false)
    }
  }, [hasSession])

  useEffect(() => {
    if (!hasSession) {
      setDashboard(null)
      setData(emptyData)
      setUnreadCount(0)
      setLoading(false)
      setError('')
      return undefined
    }

    let active = true
    loadWorkspaceData()
      .then((workspace) => {
        if (!active) return
        const mergedNotifications = applyStoredNotificationOverrides(workspace.data.notifications)
        setDashboard(workspace.summary)
        setData({ ...workspace.data, notifications: mergedNotifications })
        setUnreadCount(mergedNotifications.filter((item) => !item.readAt).length)
      })
      .catch((requestError) => {
        if (!active) return
        const message = requestError.message || ''
        if (!/unauthorized|authentication|required/i.test(message)) {
          setError(message)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [hasSession])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 3500)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chatMessages, chatSending])

  useEffect(() => {
    if (searchExpanded && openPanel === 'search') searchInputRef.current?.focus()
  }, [openPanel, searchExpanded])

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpenPanel('search')
        setSearchExpanded(true)
      }
      if (event.key === 'Escape') {
        setOpenPanel(null)
        setSearchExpanded(false)
      }
    }
    const handleOutsideClick = (event) => {
      if (!topbarRef.current?.contains(event.target)) {
        setOpenPanel(null)
        setSearchExpanded(false)
      }
    }
    document.addEventListener('keydown', handleShortcut)
    document.addEventListener('pointerdown', handleOutsideClick)
    return () => {
      document.removeEventListener('keydown', handleShortcut)
      document.removeEventListener('pointerdown', handleOutsideClick)
    }
  }, [])

  const activeNav = navigation.find((item) => item.id === activePage)
  const visibleRecords = useMemo(() => {
    const items = data[activePage] || []
    if (!query.trim()) return items
    const term = query.trim().toLowerCase()
    return items.filter((record) => Object.values(record).some((value) => String(value || '').toLowerCase().includes(term)))
  }, [activePage, data, query])
  const visibleCourses = useMemo(() => {
    if (!query.trim()) return data.courses
    const term = query.trim().toLowerCase()
    return data.courses.filter((course) => Object.values(course).some((value) => String(value || '').toLowerCase().includes(term)))
  }, [data.courses, query])
  const notificationEntries = useMemo(() =>
    (data.notifications || []).map(normalizeNotification), [data.notifications])

  const notificationSummary = useMemo(() => {
    const total = notificationEntries.length
    const unread = notificationEntries.filter((item) => !item.readAt).length
    const important = notificationEntries.filter((item) => item.important).length
    return { total, unread, important }
  }, [notificationEntries])

  const notificationFilterOptions = useMemo(() => {
    const counts = {
      all: notificationEntries.length,
      unread: notificationEntries.filter((item) => !item.readAt).length,
      important: notificationEntries.filter((item) => item.important).length,
      mentorship: notificationEntries.filter((item) => (item.category || '').toLowerCase() === 'mentorship').length,
      milestones: notificationEntries.filter((item) => (item.category || '').toLowerCase() === 'milestones').length,
      resources: notificationEntries.filter((item) => (item.category || '').toLowerCase() === 'resources').length,
      system: notificationEntries.filter((item) => (item.category || '').toLowerCase() === 'system').length,
    }
    return [
      { id: 'all', label: 'All', count: counts.all },
      { id: 'unread', label: 'Unread', count: counts.unread },
      { id: 'important', label: 'Important', count: counts.important },
      { id: 'mentorship', label: 'Mentorship', count: counts.mentorship },
      { id: 'milestones', label: 'Milestones', count: counts.milestones },
      { id: 'resources', label: 'Resources', count: counts.resources },
      { id: 'system', label: 'System', count: counts.system },
    ]
  }, [notificationEntries])

  const filteredNotifications = useMemo(() => {
    const term = notificationQuery.trim().toLowerCase()
    let items = [...notificationEntries]

    if (notificationFilter !== 'all') {
      items = items.filter((notification) => {
        const category = (notification.category || '').toLowerCase()
        switch (notificationFilter) {
          case 'unread': return !notification.readAt
          case 'important': return Boolean(notification.important)
          case 'mentorship': return category === 'mentorship'
          case 'milestones': return category === 'milestones'
          case 'resources': return category === 'resources'
          case 'system': return category === 'system'
          default: return true
        }
      })
    }

    if (term) {
      items = items.filter((notification) => {
        const haystack = `${notification.title || ''} ${notification.message || ''} ${notification.category || ''}`.toLowerCase()
        return haystack.includes(term)
      })
    }

    items.sort((left, right) => {
      const leftTime = new Date(left.createdAt).getTime()
      const rightTime = new Date(right.createdAt).getTime()
      return notificationSort === 'oldest' ? leftTime - rightTime : rightTime - leftTime
    })

    return items
  }, [notificationEntries, notificationFilter, notificationQuery, notificationSort])

  const groupedNotifications = useMemo(() => {
    const buckets = { today: [], yesterday: [], earlier: [] }
    for (const item of filteredNotifications) {
      const time = new Date(item.createdAt)
      const diffInDays = Math.floor((Date.now() - time.getTime()) / (1000 * 60 * 60 * 24))
      if (diffInDays === 0) buckets.today.push(item)
      else if (diffInDays === 1) buckets.yesterday.push(item)
      else buckets.earlier.push(item)
    }
    return buckets
  }, [filteredNotifications])

  const visibleNotifications = filteredNotifications
  const searchSuggestions = useMemo(() => {
    const term = query.trim().toLowerCase()
    const pages = [...navigation, ...insightNavigation]
      .filter((item) => !term || item.label.toLowerCase().includes(term))
      .slice(0, term ? 4 : 5)
      .map((item) => ({ type: 'page', id: item.id, label: item.label, detail: 'Open workspace section' }))
    const collections = [
      { page: 'startups', items: data.startups },
      { page: 'cohorts', items: data.cohorts },
      { page: 'mentors', items: data.mentors },
      { page: 'sessions', items: data.sessions },
      { page: 'milestones', items: data.milestones },
      { page: 'resources', items: data.resources },
      { page: 'courses', items: data.courses },
      { page: 'notifications', items: data.notifications },
    ]
    const records = term ? collections.flatMap(({ page, items }) => items
      .filter((record) => Object.entries(record).some(([key, value]) =>
        !['_id', 'ownerId', 'createdAt', 'updatedAt', 'readAt'].includes(key)
        && typeof value === 'string'
        && value.toLowerCase().includes(term)))
      .map((record) => {
        const label = record.name || record.title || record.agenda || record.email || record.message || record.category || record.date || 'Workspace record'
        const detail = page === 'notifications'
          ? 'Notification'
          : page === 'courses'
            ? 'Course'
            : collectionLabels[page] || 'Workspace'
        return { type: 'record', page, label, detail }
      })).slice(0, 5) : []
    return [...pages, ...records].slice(0, 7)
  }, [data, query])

  const openNewRecord = (type) => {
    const initial = { ...blankForms[type] }
    if (['sessions', 'milestones'].includes(type) && data.startups.length === 1) {
      initial.startupId = data.startups[0]._id
    }
    setModal({ type, initial })
  }
  const openEditRecord = (type, record) => {
    const initial = { ...blankForms[type], ...record, _id: record._id }
    for (const field of fields[type]) {
      const value = initial[field.name]
      if (value && field.type === 'date') initial[field.name] = new Date(value).toISOString().slice(0, 10)
      else if (value == null && (field.type === 'select' || field.type === 'date')) initial[field.name] = ''
      else if (value != null && field.type === 'number') initial[field.name] = String(value)
      else if (field.type === 'multiselect') initial[field.name] = (value || []).map(String)
    }
    setModal({ type, initial })
  }

  const saveRecord = async (values) => {
    const type = modal.type
    if (fields[type].some((field) => field.name === 'startupId' && field.required) && !values.startupId) {
      setError(data.startups.length
        ? 'Select a startup before creating this record.'
        : 'Create a startup before adding this record.')
      return
    }
    const payload = {}
    for (const field of fields[type]) {
      const value = values[field.name]
      if (value === '' && field.optional) payload[field.name] = null
      else if (field.type === 'number' && value !== '') payload[field.name] = Number(value)
      else if (value !== '' && value != null) payload[field.name] = value
    }
    setSaving(true)
    setError('')
    try {
      const path = `/${type}${values._id ? `/${values._id}` : ''}`
      const result = await apiRequest(path, { method: values._id ? 'PUT' : 'POST', body: JSON.stringify(payload) })
      setModal(null)
      setNotice(result.warning || `${collectionLabels[type].replace(/s$/, '')} ${values._id ? 'updated' : 'created'}.`)
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteRecord = async (type, record) => {
    if (!window.confirm(`Delete "${record.name || record.title}"? This cannot be undone.`)) return
    try {
      await apiRequest(`/${type}/${record._id}`, { method: 'DELETE' })
      setNotice('Record deleted.')
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const saveCourse = async (event) => {
    event.preventDefault()
    setCourseBusy(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('title', courseForm.title)
      formData.append('category', courseForm.category)
      formData.append('description', courseForm.description)
      formData.append('hours', String(Number(courseForm.hours)))
      if (courseForm.file) formData.append('file', courseForm.file)
      const result = await apiRequest(`/courses${editingCourse ? `/${editingCourse._id}` : ''}`, {
        method: editingCourse ? 'PUT' : 'POST',
        body: formData,
      })
      setCourseForm({ title: '', category: '', description: '', hours: '', file: null })
      setEditingCourse(null)
      setNotice(`Course ${editingCourse ? 'updated' : 'created'}: ${result.title}`)
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setCourseBusy(false)
    }
  }

  const suggestCourse = async () => {
    setAiBusy(true)
    setError('')
    setNotice('')
    setCourseSuggestions([])
    try {
      const result = await apiRequest('/ai/course-suggestions', {
        method: 'POST',
        body: JSON.stringify({
          ...courseForm,
          existingTitles: data.courses.map((course) => course.title),
        }),
      })
      setCourseSuggestions(result.suggestions)
      setNotice(result.source === 'ai'
        ? 'AI suggestions are ready. Choose a course idea to add it to the form.'
        : `${result.message || 'AI is unavailable.'} Built-in course ideas are shown below.`)
    } catch (requestError) {
      setCourseSuggestions(fallbackCourseSuggestions({
        existingTitles: data.courses.map((course) => course.title),
      }))
      setNotice(`${requestError.message} Showing built-in course ideas instead.`)
    } finally {
      setAiBusy(false)
    }
  }

  const generateInsights = async () => {
    setAiBusy(true)
    setError('')
    setAiResult('')
    setAiSource('')
    setAiMessage('')
    try {
      const result = await apiRequest('/ai/insights')
      setAiResult(result.insights)
      setAiSource(result.source)
      setAiMessage(result.message || '')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setAiBusy(false)
    }
  }

  const sendChatMessage = async (event) => {
    event.preventDefault()
    const message = chatInput.trim()
    if (!message || chatSending) return

    const previousMessages = chatMessages.slice(-12).map(({ role, content }) => ({ role, content }))
    setChatMessages((current) => [...current, { role: 'user', content: message }])
    setChatInput('')
    setChatSending(true)
    setChatNotice('')
    setError('')
    try {
      const result = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history: previousMessages }),
      })
      setChatMessages((current) => [...current, { role: 'assistant', content: result.reply }])
      setChatSource(result.source)
      setChatNotice(result.message || '')
    } catch (requestError) {
      setChatMessages((current) => current.slice(0, -1))
      setChatInput(message)
      setChatSource('')
      setChatNotice(requestError.message)
    } finally {
      setChatSending(false)
    }
  }

  const deleteCourse = async (course) => {
    if (!window.confirm(`Delete "${course.title}"?`)) return
    try {
      await apiRequest(`/courses/${course._id}`, { method: 'DELETE' })
      setNotice('Course deleted.')
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const toggleEnrollment = async (course) => {
    setCourseBusy(true)
    try {
      const enrolled = (course.students || []).some((id) => String(id) === String(user.id))
      await apiRequest(`/users/${user.id}/courses/${course._id}`, { method: enrolled ? 'DELETE' : 'POST' })
      setNotice(enrolled ? 'You left the course.' : 'You enrolled in the course.')
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setCourseBusy(false)
    }
  }

  const setPage = (page) => {
    onNavigate(page)
    setQuery('')
    setMobileMenuOpen(false)
    setOpenPanel(null)
    setSearchExpanded(false)
    setError('')
  }

  const chooseSearchSuggestion = (suggestion) => {
    const searchTerm = query.trim()
    setPage(suggestion.page || suggestion.id)
    if (suggestion.type === 'record') setQuery(searchTerm)
  }

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown' && searchSuggestions.length) {
      event.preventDefault()
      setActiveSearchIndex((index) => (index + 1) % searchSuggestions.length)
    } else if (event.key === 'ArrowUp' && searchSuggestions.length) {
      event.preventDefault()
      setActiveSearchIndex((index) => (index - 1 + searchSuggestions.length) % searchSuggestions.length)
    } else if (event.key === 'Enter' && searchSuggestions[activeSearchIndex]) {
      event.preventDefault()
      chooseSearchSuggestion(searchSuggestions[activeSearchIndex])
    } else if (event.key === 'Escape') {
      setOpenPanel(null)
      setSearchExpanded(false)
    }
  }

  const markNotificationRead = async (id, read = true) => {
    const nextNotifications = data.notifications.map((notification) => (
      notification._id === id ? { ...notification, readAt: read ? new Date().toISOString() : null } : notification
    ))
    updateNotificationState(() => nextNotifications)
    setUnreadCount(nextNotifications.filter((item) => !item.readAt).length)

    if (read) {
      try {
        await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' })
        setNotice('Notification marked as read.')
      } catch (requestError) {
        setError(requestError.message)
      }
      return
    }

    setNotice('Notification marked as unread.')
  }

  const markAllNotificationsRead = async () => {
    const nextNotifications = data.notifications.map((notification) => ({ ...notification, readAt: new Date().toISOString() }))
    updateNotificationState(() => nextNotifications)
    setUnreadCount(0)
    setRefreshingNotifications(true)
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' })
      setNotice('All notifications marked as read.')
    } catch (requestError) {
      setError(requestError.message)
      setUnreadCount(nextNotifications.filter((item) => !item.readAt).length)
    } finally {
      setRefreshingNotifications(false)
    }
  }

  const toggleNotificationImportant = (id) => {
    const nextNotifications = data.notifications.map((notification) => (
      notification._id === id ? { ...notification, important: !Boolean(notification.important) } : notification
    ))
    updateNotificationState(() => nextNotifications)
    const item = nextNotifications.find((notification) => notification._id === id)
    setNotice(item?.important ? 'Notification marked as important.' : 'Notification removed from important.')
  }

  const deleteNotification = (id) => {
    const target = data.notifications.find((notification) => notification._id === id)
    if (!target || !window.confirm(`Delete "${target.title || 'this notification'}"?`)) return

    const nextNotifications = data.notifications.filter((notification) => notification._id !== id)
    updateNotificationState(() => nextNotifications)
    setUnreadCount(nextNotifications.filter((item) => !item.readAt).length)
    setNotice('Notification deleted.')
  }

  const pageTitle = activePage === 'dashboard'
    ? user.role === 'mentor' ? 'Mentor Dashboard' : user.role === 'founder' ? 'Founder Dashboard' : 'Incubator overview'
    : activePage === 'analytics'
      ? 'Analytics & reports'
      : activePage === 'notifications'
        ? 'Notifications'
        : activePage === 'settings'
          ? 'Workspace settings'
          : activeNav?.label || 'AI insights'

  const metricCards = dashboard ? [
    { label: 'Total startups', value: dashboard.summary.startups, icon: 'startups', tone: 'violet' },
    { label: 'Active startups', value: dashboard.summary.activeStartups, icon: 'trendingUp', tone: 'blue' },
    { label: 'Mentors', value: dashboard.summary.mentors, icon: 'mentors', tone: 'green' },
    { label: 'Active cohorts', value: dashboard.summary.cohorts, icon: 'cohorts', tone: 'amber' },
    { label: 'Sessions completed', value: dashboard.summary.completedSessions, icon: 'completedSessions', tone: 'teal' },
    { label: 'Open milestones', value: dashboard.summary.pendingTasks, icon: 'milestoneFlag', tone: 'rose' },
    { label: 'Resource utilization', value: `${dashboard.summary.resourceUtilization}%`, icon: 'analytics', tone: 'orange' },
    { label: 'Average progress', value: `${dashboard.summary.averageProgress}%`, icon: 'progressChart', tone: 'indigo' },
  ] : []

  return (
    <div className={`workspace ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {mobileMenuOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo"><StartupLogo /></div>
          {!collapsed && <div className="sidebar-brand-copy"><strong>Startup</strong><span>Incubator workspace</span></div>}
          <button className="collapse-button" type="button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d={collapsed ? 'm7.5 4.5 5.5 5.5-5.5 5.5' : 'm12.5 4.5-5.5 5.5 5.5 5.5'} />
            </svg>
          </button>
        </div>
        <div className="sidebar-section-label">{!collapsed && 'WORKSPACE'}</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)} title={collapsed ? item.label : undefined}>
              <NavigationIcon name={item.icon} tone={item.tone} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
          <div className="sidebar-section-label nav-divider">{!collapsed && 'INSIGHTS'}</div>
          {insightNavigation.map((item) => (
            <button key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)} title={collapsed ? item.label : undefined}>
              <NavigationIcon name={item.icon} tone={item.tone} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <ProfileAvatar name={user.name || user.username} src={user.profilePhoto} />
          {!collapsed && <div className="sidebar-user"><strong>{user.name || user.username}</strong><span>{user.role?.replace('_', ' ') || 'Founder'}</span></div>}
          <button className="logout-icon" type="button" title="Log out" onClick={onLogout}>↪</button>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-topbar" ref={topbarRef}>
          <button className="mobile-menu-button" type="button" aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)}>☰</button>
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <button type="button" className="breadcrumb-home" onClick={() => setPage('dashboard')}>Workspace</button>
            <svg className="breadcrumb-separator" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 3.5 4.5 4.5L6 12.5" /></svg>
            <strong aria-current="page">{pageTitle}</strong>
          </nav>
          <div className="topbar-tools">
            <div className={`global-search-wrap ${openPanel === 'search' ? 'is-open' : ''} ${searchExpanded ? 'is-expanded' : ''}`}>
              <button className="search-compact-toggle" type="button" aria-label="Open search" onClick={() => {
                setSearchExpanded(true)
                setOpenPanel('search')
              }}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
              </button>
              <div className="global-search">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
                <input
                  ref={searchInputRef}
                  aria-label="Search workspace"
                  aria-autocomplete="list"
                  aria-controls="workspace-search-suggestions"
                  aria-expanded={openPanel === 'search'}
                  aria-activedescendant={openPanel === 'search' && searchSuggestions[activeSearchIndex] ? `search-option-${activeSearchIndex}` : undefined}
                  value={query}
                  onFocus={() => setOpenPanel('search')}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setActiveSearchIndex(0)
                    setOpenPanel('search')
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search workspace..."
                />
                {query && <button className="search-clear" type="button" aria-label="Clear search" onClick={() => {
                  setQuery('')
                  setActiveSearchIndex(0)
                  searchInputRef.current?.focus()
                }}>×</button>}
                <kbd>⌘ / Ctrl K</kbd>
              </div>
              {openPanel === 'search' && <div className="search-suggestions" id="workspace-search-suggestions" role="listbox" aria-label="Search suggestions">
                <div className="search-suggestions-heading">{query.trim() ? 'SUGGESTED RESULTS' : 'QUICK ACCESS'}</div>
                {searchSuggestions.length ? searchSuggestions.map((suggestion, index) => (
                  <button
                    className={`search-suggestion ${activeSearchIndex === index ? 'is-active' : ''}`}
                    id={`search-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={activeSearchIndex === index}
                    key={`${suggestion.type}-${suggestion.page || suggestion.id}-${suggestion.label}-${index}`}
                    onMouseEnter={() => setActiveSearchIndex(index)}
                    onClick={() => chooseSearchSuggestion(suggestion)}
                  >
                    <span className={`suggestion-icon ${suggestion.type === 'page' ? 'is-page' : ''}`}>
                      {suggestion.type === 'page'
                        ? <NavigationIcon name={[...navigation, ...insightNavigation].find((item) => item.id === suggestion.id)?.icon || 'dashboard'} tone="violet" />
                        : <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>}
                    </span>
                    <span className="suggestion-copy"><strong>{suggestion.label}</strong><small>{suggestion.detail}</small></span>
                    <svg className="suggestion-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
                  </button>
                )) : <p className="search-no-results">{query.trim() ? 'No matching pages or workspace records.' : 'No workspace sections are available.'}</p>}
                <div className="search-suggestions-footer"><span>Navigate with ↑ ↓</span><span><kbd>Enter</kbd> to select</span></div>
              </div>}
            </div>
            <div className="topbar-menu-wrap">
              <button
                className={`topbar-icon notification-button ${unreadCount > 0 ? 'has-unread' : ''} ${openPanel === 'notifications' ? 'is-active' : ''}`}
                type="button"
                aria-label={`${unreadCount} unread notifications`}
                aria-expanded={openPanel === 'notifications'}
                aria-controls="notification-popover"
                onClick={() => setOpenPanel((panel) => panel === 'notifications' ? null : 'notifications')}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>
                {unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {openPanel === 'notifications' && <section className="topbar-popover notification-popover" id="notification-popover" aria-label="Notifications">
                <div className="popover-heading">
                  <div><p className="eyebrow">YOUR UPDATES</p><h2>Notifications{unreadCount > 0 && <span>{unreadCount} new</span>}</h2></div>
                  {unreadCount > 0 && <button className="popover-text-button" type="button" onClick={markAllNotificationsRead}>Mark all read</button>}
                </div>
                {!data.notifications.length
                  ? <div className="popover-empty"><span className="popover-empty-icon"><NavigationIcon name="notifications" tone="violet" /></span><strong>You're all caught up</strong><p>New workspace updates will appear here.</p></div>
                  : <div className="popover-notification-list">{data.notifications.slice(0, 5).map((notification) => (
                    <article className={`popover-notification ${notification.readAt ? 'is-read' : 'is-unread'}`} key={notification._id}>
                      <span className="popover-notification-dot" aria-hidden="true" />
                      <div className="popover-notification-copy">
                        <div className="popover-notification-title"><strong>{notification.title}</strong><span>{notification.readAt ? 'Read' : 'Unread'}</span></div>
                        <p>{notification.message}</p>
                        <time dateTime={notification.createdAt}>{displayTimestamp(notification.createdAt)}</time>
                      </div>
                      {!notification.readAt && <button className="popover-read-button" type="button" aria-label={`Mark ${notification.title} as read`} onClick={() => markNotificationRead(notification._id)}>Mark read</button>}
                    </article>
                  ))}</div>}
                <button className="popover-footer-link" type="button" onClick={() => setPage('notifications')}>View all notifications <span aria-hidden="true">→</span></button>
              </section>}
            </div>
            <div className="topbar-menu-wrap profile-menu-wrap">
              <button
                className={`profile-chip ${openPanel === 'profile' ? 'is-active' : ''}`}
                type="button"
                aria-expanded={openPanel === 'profile'}
                aria-controls="profile-popover"
                onClick={() => setOpenPanel((panel) => panel === 'profile' ? null : 'profile')}
              >
                <ProfileAvatar name={user.name || user.username} src={user.profilePhoto} className="profile-avatar" />
                <span className="profile-name">{user.name || user.username}</span>
                <svg className="profile-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
              </button>
              {openPanel === 'profile' && <div className="topbar-popover profile-popover" id="profile-popover" role="menu" aria-label="Profile menu">
                <div className="profile-popover-heading">
                  <ProfileAvatar name={user.name || user.username} src={user.profilePhoto} className="profile-avatar" />
                  <div><strong>{user.name || user.username}</strong><span>{user.email || user.role?.replace('_', ' ') || 'Workspace member'}</span></div>
                </div>
                <div className="profile-menu-divider" />
                <button type="button" role="menuitem" onClick={() => setPage('settings')}><span className="profile-menu-icon">◉</span>Profile</button>
                <button type="button" role="menuitem" onClick={() => setPage('settings')}><span className="profile-menu-icon">⚙</span>Account settings</button>
                <div className="profile-menu-divider" />
                <button className="profile-logout" type="button" role="menuitem" onClick={onLogout}><span className="profile-menu-icon">↗</span>Log out</button>
              </div>}
            </div>
          </div>
        </header>

        <div className="page-content">
          {error && <div className="inline-alert" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
          {notice && <div className="toast-message" role="status">{notice}</div>}
          {loading && <div className="loading-banner">Loading your workspace…</div>}

          {(activePage === 'dashboard' || activePage === 'analytics') && dashboard && (
            <>
              <div className="page-heading-row">
                <div><p className="eyebrow">STARTUP MANAGEMENT</p><h1>{pageTitle}</h1><p className="page-subtitle">A live view of startup progress, mentoring activity, and resources.</p></div>
                <button className="secondary-button" type="button" onClick={refresh}>↻ <span>Refresh data</span></button>
              </div>
              <section className="metric-grid" aria-label="Workspace metrics">
                {metricCards.map((card) => <article className="metric-card" key={card.label}>
                  <NavigationIcon name={card.icon} tone={card.tone} className={`metric-icon ${card.tone}`} />
                  <div className="metric-label">{card.label}</div>
                  <div className="metric-value">{card.value}</div>
                </article>)}
              </section>
              <div className="dashboard-grid">
                <section className="surface-card progress-card">
                  <div className="card-heading"><div><h2>Startup progress</h2><p>Milestone completion by startup</p></div><button className="text-button" onClick={() => setPage('startups')}>View startups <span>→</span></button></div>
                  {!dashboard.startupProgress.length ? <EmptyState title="No startup data yet" description="Add a startup and milestones to see real progress here." action={<button className="primary-button compact" onClick={() => openNewRecord('startups')}>Add your first startup</button>} /> :
                    <div className="progress-list">{dashboard.startupProgress.slice(0, 6).map((startup) => <div className="progress-row" key={startup.name}>
                      <div className="progress-row-label"><strong>{startup.name}</strong><span>{startup.progress}%</span></div><div className="progress-track"><span style={{ width: `${startup.progress}%` }} /></div>
                    </div>)}</div>}
                </section>
                <section className="surface-card sessions-card">
                  <div className="card-heading"><div><h2>Upcoming sessions</h2><p>Scheduled mentor touchpoints</p></div><button className="text-button" onClick={() => setPage('sessions')}>See all <span>→</span></button></div>
                  {!dashboard.upcomingSessions.length ? <EmptyState title="Nothing scheduled" description="Schedule a mentor session to keep your startups moving." action={<button className="secondary-button compact" onClick={() => setPage('sessions')}>View sessions</button>} /> :
                    <ul className="session-list">{dashboard.upcomingSessions.map((session) => <li key={session._id}><div className="date-tile"><strong>{new Date(session.date).getDate()}</strong><span>{new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(session.date))}</span></div><div><strong>{getStartupName(session.startupId, data.startups)}</strong><span>{session.startTime || 'Time TBD'} · Mentor session</span></div></li>)}</ul>}
                </section>
                <section className="surface-card recent-card">
                  <div className="card-heading"><div><h2>Recently added startups</h2><p>Your latest workspace activity</p></div><button className="text-button" onClick={() => setPage('startups')}>View all <span>→</span></button></div>
                  {!dashboard.recentStartups.length ? <EmptyState title="Welcome to your workspace" description="Create your first startup record to begin tracking your cohort." action={<button className="primary-button compact" onClick={() => openNewRecord('startups')}>Add startup</button>} /> :
                    <div className="recent-list">{dashboard.recentStartups.slice(0, 4).map((startup) => <div className="recent-row" key={startup._id}><div className="startup-avatar">{startup.name.slice(0, 1).toUpperCase()}</div><div><strong>{startup.name}</strong><span>{startup.industry || 'Industry not set'} · {startup.stage}</span></div><span className={`status-pill ${startup.status?.toLowerCase()}`}>{startup.status}</span></div>)}</div>}
                </section>
                <section className="surface-card cohort-card">
                  <div className="card-heading"><div><h2>Incubation at a glance</h2><p>Program portfolio summary</p></div></div>
                  <div className="portfolio-stats"><div><span>All cohorts</span><strong>{data.cohorts.length}</strong></div><div><span>Active mentors</span><strong>{data.mentors.length}</strong></div><div><span>Open milestones</span><strong>{data.milestones.filter((item) => item.status !== 'Completed').length}</strong></div></div>
                  <button className="secondary-button full-width" type="button" onClick={() => setPage('analytics')}>Explore analytics <span>→</span></button>
                </section>
              </div>
              {activePage === 'analytics' && <section className="analytics-grid">
                <DataChart title="Startup growth" subtitle="New startups created by month" items={dashboard.monthlyGrowth} />
                <DataChart title="Startup stage distribution" subtitle="Portfolio by current stage" items={dashboard.stageDistribution} />
                <DataChart title="Cohort performance" subtitle="Average milestone completion" items={dashboard.cohortPerformance.map((item) => ({ label: item.name, count: item.progress, suffix: `% · ${item.startups} startups` }))} />
                <DataChart title="Mentor session status" subtitle="Recorded session outcomes" items={dashboard.sessionStatus} />
              </section>}
            </>
          )}

          {collectionLabels[activePage] && (
            <>
              <div className="page-heading-row">
                <div><p className="eyebrow">WORKSPACE</p><h1>{collectionLabels[activePage]}</h1><p className="page-subtitle">{pageDescription(activePage)}</p></div>
                <button className="primary-button" type="button" onClick={() => openNewRecord(activePage)}>＋ <span>Add {activePage === 'sessions' ? 'session' : activePage === 'milestones' ? 'milestone' : activePage.slice(0, -1)}</span></button>
              </div>
              {!loading && visibleRecords.length === 0 ? (
                <EmptyState
                  title={query ? 'No matching records' : `No ${collectionLabels[activePage].toLowerCase()} yet`}
                  description={query ? 'Try another search term.' : `Add your first ${activePage === 'sessions' ? 'session' : activePage === 'milestones' ? 'milestone' : activePage.slice(0, -1)} to start building your workspace data.`}
                  action={!query && <button className="primary-button compact" onClick={() => openNewRecord(activePage)}>Add record</button>}
                />
              ) : (
                <section className="record-grid">
                  {visibleRecords.map((record) => <RecordCard key={record._id} type={activePage} record={record} data={data} onEdit={() => openEditRecord(activePage, record)} onDelete={() => deleteRecord(activePage, record)} />)}
                </section>
              )}
            </>
          )}

          {activePage === 'courses' && <section className="courses-layout">
            <div className="page-heading-row course-page-heading"><div><p className="eyebrow">LEARNING PROGRAMS</p><h1>Courses & learning</h1><p className="page-subtitle">Create practical learning paths and track course enrollment.</p></div></div>
            <div className="courses-grid">
              <section className="surface-card course-editor">
                <div className="card-heading course-editor-heading"><div><h2>{editingCourse ? 'Edit course' : 'Add a new course'}</h2><p>Build a learning resource for your founders.</p></div><button type="button" className="ai-button" onClick={suggestCourse} disabled={aiBusy || courseBusy}>{aiBusy ? 'Drafting…' : '✧ Suggest with AI'}</button></div>
                {courseSuggestions.length > 0 && <section className="course-suggestions" aria-label="Course suggestions">
                  <div className="course-suggestions-heading"><h3>Choose a course idea</h3><span>{courseSuggestions.length} ideas</span></div>
                  <div className="course-suggestions-list">{courseSuggestions.map((suggestion) => <article className="course-suggestion-card" key={suggestion.title}>
                    <span className="category-tag">{suggestion.category}</span>
                    <h4>{suggestion.title}</h4>
                    <p>{suggestion.description}</p>
                    <div className="course-suggestion-footer"><span>{suggestion.hours} hours</span><button type="button" className="small-button violet-button" onClick={() => {
                      setCourseForm((current) => ({ ...current, ...suggestion }))
                      setNotice('Course idea added to the form. Review it before saving.')
                    }}>Use this idea</button></div>
                  </article>)}</div>
                </section>}
                <form className="record-form one-column" onSubmit={saveCourse}>
                  <label>Course title<input value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })} placeholder="AI for Founders" required /></label>
                  <label>Category<input value={courseForm.category} onChange={(event) => setCourseForm({ ...courseForm, category: event.target.value })} placeholder="Technology" required /></label>
                  <label>Description<textarea value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} placeholder="Describe the learning module" rows="4" required /></label>
                  <label>Duration (hours)<input type="number" min="1" value={courseForm.hours} onChange={(event) => setCourseForm({ ...courseForm, hours: event.target.value })} placeholder="8" required /></label>
                  <label>Course resource (optional, max 10 MB)<input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt" onChange={(event) => setCourseForm({ ...courseForm, file: event.target.files?.[0] || null })} /></label>
                  {courseForm.file && <span className="muted-caption">Selected: {courseForm.file.name}</span>}
                  <button className="primary-button full-width" type="submit" disabled={courseBusy}>{courseBusy ? 'Saving…' : editingCourse ? 'Update course' : 'Save course'}</button>
                  {editingCourse && <button type="button" className="secondary-button full-width" onClick={() => { setEditingCourse(null); setCourseForm({ title: '', category: '', description: '', hours: '', file: null }) }}>Cancel edit</button>}
                </form>
              </section>
              <section className="surface-card course-library">
                <div className="card-heading"><div><h2>Saved courses</h2><p>{data.courses.length} learning resources</p></div><button className="secondary-button compact" type="button" onClick={refresh}>Refresh</button></div>
                {!visibleCourses.length ? <EmptyState title={query ? 'No matching courses' : 'No courses saved yet'} description={query ? 'Try another search term.' : 'Create a course to give your founders a clear learning path.'} /> :
                  <div className="course-list">{visibleCourses.map((course) => {
                    const enrolled = (course.students || []).some((id) => String(id) === String(user.id))
                    return <article className="course-card" key={course._id}><div className="course-card-icon">▣</div><div className="course-card-content"><span className="category-tag">{course.category}</span><h3>{course.title}</h3><p>{course.description}</p><div className="course-card-meta">{course.hours} hours <span>·</span> {(course.students || []).length} enrolled</div>{course.fileUrl && <a className="resource-link" href={`${API_ORIGIN}${course.fileUrl}`} target="_blank" rel="noreferrer">Open course material ↗</a>}<div className="course-card-actions"><button className="small-button violet-button" onClick={() => toggleEnrollment(course)} disabled={courseBusy}>{enrolled ? 'Leave course' : 'Enroll'}</button><button className="small-button" onClick={() => { setEditingCourse(course); setCourseForm({ title: course.title, category: course.category, description: course.description, hours: String(course.hours), file: null }); setCourseSuggestions([]) }}>Edit</button><button className="small-button danger-button" onClick={() => deleteCourse(course)}>Delete</button></div></div></article>
                  })}</div>}
              </section>
            </div>
          </section>}

          {activePage === 'ai-insights' && <section className="surface-card feature-panel ai-page">
            <p className="eyebrow">AI-POWERED SUPPORT</p><h1>AI insights</h1>
            <div className="ai-config-card"><div className="metric-icon violet">✧</div><div className="ai-insight-content"><h2>Ground insights in your workspace data</h2><p>Generate evidence-based observations from the startups, sessions, milestones, and resources in your account.</p><button className="primary-button compact" type="button" onClick={generateInsights} disabled={aiBusy}>{aiBusy ? 'Analyzing workspace…' : 'Generate AI insights'}</button>{aiResult && <><p className="config-status">{aiSource === 'openai' ? 'AI-generated insights' : 'Workspace insights'}</p><div className="ai-result">{aiResult}</div></>}{aiMessage && <p className="ai-service-note" role="status">{aiMessage}</p>}<p className="config-caption">Add OPENAI_API_KEY to the backend environment for AI-generated insights and chat. Data-derived workspace insights are labeled separately when AI is unavailable.</p></div></div>
            <section className="ai-chat-card" aria-label="AI chat">
              <div className="ai-chat-heading"><div><p className="eyebrow">YOUR AI ASSISTANT</p><h2>Ask anything</h2><p>Get help with your workspace, startup planning, and more.</p></div><button type="button" className="secondary-button compact" onClick={() => { setChatMessages([]); setChatInput(''); setChatNotice(''); setChatSource('') }} disabled={chatSending}>New chat</button></div>
              <div className="ai-chat-messages" role="log" aria-live="polite" aria-label="Conversation">
                {!chatMessages.length && <div className="ai-chat-welcome"><div className="metric-icon violet">✧</div><h3>How can I help you today?</h3><p>Try asking a question or choose a suggestion to get started.</p><div className="ai-chat-prompts">{['Summarize my workspace', 'How do I validate a startup idea?', 'Help me plan a pitch deck'].map((prompt) => <button key={prompt} type="button" onClick={() => setChatInput(prompt)}>{prompt}</button>)}</div></div>}
                {chatMessages.map((item, index) => <article className={`ai-chat-message ${item.role}`} key={`${index}-${item.role}`}>{item.role === 'assistant' ? <span className="ai-chat-avatar">✧</span> : <ProfileAvatar name={user.name || user.username} src={user.profilePhoto} className="ai-chat-avatar" />}<div><strong>{item.role === 'assistant' ? 'Startup AI' : 'You'}</strong><p>{item.content}</p></div></article>)}
                {chatSending && <article className="ai-chat-message assistant"><span className="ai-chat-avatar">✧</span><div><strong>Startup AI</strong><p className="ai-thinking">Thinking…</p></div></article>}
                <div ref={chatEndRef} />
              </div>
              {chatNotice && <p className="ai-service-note chat-service-note" role="alert">{chatNotice}</p>}
              {chatSource && <p className="ai-chat-source">{chatSource === 'openai' ? 'AI assistant' : 'Workspace assistant'}</p>}
              <form className="ai-chat-form" onSubmit={sendChatMessage}>
                <textarea aria-label="Message the AI assistant" value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); sendChatMessage(event) } }} placeholder="Message Startup AI…" rows="2" maxLength="4000" />
                <button className="primary-button" type="submit" disabled={!chatInput.trim() || chatSending}>{chatSending ? 'Sending…' : 'Send'}</button>
                <span>Enter to send · Shift + Enter for a new line</span>
              </form>
            </section>
          </section>}

          {activePage === 'notifications' && <section className="notifications-page">
            <div className="notification-header">
              <div className="notification-header-copy">
                <p className="eyebrow">YOUR ACTIVITY</p>
                <div className="notification-title-row">
                  <h1>Notifications</h1>
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </div>
                <p className="page-subtitle">Stay updated on your startup journey.</p>
              </div>
              <div className="notification-header-actions">
                <button type="button" className="secondary-button compact" onClick={markAllNotificationsRead} disabled={!notificationEntries.some((item) => !item.readAt) || refreshingNotifications}>
                  {refreshingNotifications ? 'Updating…' : 'Mark all as read'}
                </button>
                <button type="button" className="secondary-button compact refresh-button" onClick={refresh} aria-label="Refresh notifications" disabled={refreshingNotifications}>
                  <span className={`refresh-icon ${refreshingNotifications ? 'is-spinning' : ''}`}>↻</span>
                  <span>Refresh</span>
                </button>
                <button type="button" className="secondary-button compact" onClick={() => setPage('settings')}>Preferences</button>
              </div>
            </div>

            <div className="notification-summary-grid" aria-label="Notification summary cards">
              {[
                { id: 'all', label: 'All notifications', value: notificationSummary.total, tone: 'violet' },
                { id: 'unread', label: 'Unread', value: notificationSummary.unread, tone: 'purple' },
                { id: 'important', label: 'Important', value: notificationSummary.important, tone: 'amber' },
              ].map((card) => (
                <button key={card.id} type="button" className={`notification-summary-card ${card.tone}`} onClick={() => setNotificationFilter(card.id === 'all' ? 'all' : card.id)}>
                  <span className="notification-summary-icon">{card.id === 'important' ? '★' : card.id === 'unread' ? '◉' : '◌'}</span>
                  <div>
                    <strong>{card.value}</strong>
                    <span>{card.label}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="notification-filter-bar">
              <div className="notification-filter-list" role="tablist" aria-label="Notification filters">
                {notificationFilterOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`filter-pill ${notificationFilter === option.id ? 'is-active' : ''}`}
                    onClick={() => setNotificationFilter(option.id)}
                    aria-pressed={notificationFilter === option.id}
                  >
                    <span>{option.label}</span>
                    <em>{option.count}</em>
                  </button>
                ))}
              </div>

              <div className="notification-control-row">
                <label className="notification-search" htmlFor="notification-search-input">
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4.5 4.5" /></svg>
                  <input id="notification-search-input" type="search" value={notificationQuery} onChange={(event) => setNotificationQuery(event.target.value)} placeholder="Search notifications" aria-label="Search notifications" />
                </label>
                <label className="notification-sort" htmlFor="notification-sort">
                  <span>Sort</span>
                  <select id="notification-sort" value={notificationSort} onChange={(event) => setNotificationSort(event.target.value)} aria-label="Sort notifications">
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </label>
                {(notificationFilter !== 'all' || notificationQuery) && (
                  <button type="button" className="text-button notification-clear" onClick={() => { setNotificationFilter('all'); setNotificationQuery('') }}>Clear filters</button>
                )}
              </div>
            </div>

            {!notificationEntries.length ? (
              <div className="empty-state notification-empty-state">
                <span className="empty-state-icon" aria-hidden="true">✦</span>
                <h3>You're all caught up!</h3>
                <p>New updates about your startup journey will appear here.</p>
                <button className="primary-button compact" type="button" onClick={() => setPage('dashboard')}>Explore your workspace</button>
              </div>
            ) : !visibleNotifications.length ? (
              <div className="empty-state notification-empty-state">
                <span className="empty-state-icon" aria-hidden="true">⌕</span>
                <h3>No notifications found</h3>
                <p>Try changing your search or filters.</p>
                <button className="primary-button compact" type="button" onClick={() => { setNotificationFilter('all'); setNotificationQuery('') }}>Clear filters</button>
              </div>
            ) : (
              <div className="notification-feed">
                {Object.entries(groupedNotifications).map(([groupName, items]) => items.length ? (
                  <section key={groupName} className="notification-group">
                    <div className="notification-group-header">
                      <span>{groupName === 'today' ? 'Today' : groupName === 'yesterday' ? 'Yesterday' : 'Earlier'}</span>
                    </div>
                    <div className="notification-list">
                      {items.map((item) => {
                        const meta = getNotificationMeta(item.category)
                        return (
                          <article className={`notification-item ${item.readAt ? 'is-read' : 'is-unread'} ${item.important ? 'is-important' : ''}`} key={item._id}>
                            <div className={`notification-icon ${meta.tone}`} aria-hidden="true">{meta.icon}</div>
                            <div className="notification-copy">
                              <div className="notification-copy-top">
                                <div>
                                  <h3>{item.title}</h3>
                                  <p>{item.message}</p>
                                </div>
                                <div className="notification-utility">
                                  {item.important && <span className="notification-star" aria-label="Important notification">★</span>}
                                  <button className="icon-button notification-menu-button" type="button" aria-label={`More actions for ${item.title}`}>
                                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="10" cy="4.5" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="15.5" r="1.5" /></svg>
                                  </button>
                                </div>
                              </div>
                              <div className="notification-meta-row">
                                <time dateTime={item.createdAt}>{formatNotificationTimestamp(item.createdAt)}</time>
                                <span className="notification-category">{meta.label}</span>
                                {!item.readAt && <span className="notification-unread-indicator">Unread</span>}
                              </div>
                            </div>
                            <div className="notification-actions">
                              <button type="button" className="secondary-button compact" onClick={() => markNotificationRead(item._id, !item.readAt)}>{item.readAt ? 'Mark unread' : 'Mark read'}</button>
                              <button type="button" className="secondary-button compact" onClick={() => toggleNotificationImportant(item._id)}>{item.important ? 'Starred' : 'Star'}</button>
                              {item.actionLabel && <button type="button" className="primary-button compact" onClick={() => setPage('settings')}>{item.actionLabel}</button>}
                              <button type="button" className="small-button danger-button" onClick={() => deleteNotification(item._id)}>Delete</button>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </section>
                ) : null)}
              </div>
            )}
          </section>}

          {activePage === 'settings' && <SettingsPanel user={user} onUserUpdated={onUserUpdated} onLogout={onLogout} onNotice={setNotice} onError={setError} />}
          {!loading && !dashboard && activePage === 'dashboard' && <EmptyState title="Workspace data is unavailable" description="Check the API connection, then try refreshing." action={<button className="primary-button compact" onClick={refresh}>Try again</button>} />}
        </div>
      </main>
      {modal && <RecordForm type={modal.type} initial={modal.initial} data={data} saving={saving} onCancel={() => setModal(null)} onCreateStartup={() => { setPage('startups'); openNewRecord('startups') }} onSave={saveRecord} />}
    </div>
  )
}

function getNotificationMeta(category = 'system') {
  const normalized = String(category || '').toLowerCase()
  const lookup = {
    mentorship: { icon: '✦', label: 'Mentorship', tone: 'violet' },
    milestones: { icon: '✓', label: 'Milestones', tone: 'green' },
    resources: { icon: '▣', label: 'Resources', tone: 'sky' },
    system: { icon: '⚙', label: 'System', tone: 'slate' },
    startup: { icon: '◌', label: 'Startup updates', tone: 'purple' },
  }
  return lookup[normalized] || { icon: '✦', label: 'System', tone: 'violet' }
}

function formatNotificationTimestamp(value) {
  const created = new Date(value)
  const now = new Date()
  const deltaMs = now.getTime() - created.getTime()
  const deltaMinutes = Math.max(1, Math.round(deltaMs / 60000))
  if (deltaMinutes < 60) return `${deltaMinutes} min ago`
  const deltaHours = Math.round(deltaMs / 3600000)
  if (deltaHours < 24) return `${deltaHours} hour${deltaHours === 1 ? '' : 's'} ago`
  const deltaDays = Math.round(deltaMs / 86400000)
  if (deltaDays === 1) return 'Yesterday'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(created)
}

function pageDescription(page) {
  const descriptions = {
    startups: 'Manage your portfolio and keep founder teams on track.',
    cohorts: 'Organize programs, dates, and participating startups.',
    mentors: 'Maintain mentor profiles, expertise, and availability.',
    sessions: 'Plan and record meaningful mentor conversations.',
    milestones: 'Track weighted outcomes, deadlines, and startup progress.',
    resources: 'Manage your inventory and current allocations.',
  }
  return descriptions[page]
}

function RecordCard({ type, record, data, onEdit, onDelete }) {
  const status = record.status || 'Active'
  const label = {
    startups: record.industry || record.stage,
    cohorts: `${displayDate(record.startDate)} – ${displayDate(record.endDate)}`,
    mentors: record.expertise || record.email,
    sessions: `${getStartupName(record.startupId, data.startups)} · ${displayDate(record.date)} ${record.startTime || ''}`,
    milestones: `${getStartupName(record.startupId, data.startups)} · Due ${displayDate(record.dueDate)}`,
    resources: `${record.category} · ${record.available ?? 0} of ${record.quantity ?? 0} available`,
  }[type]
  const title = record.name || record.title || 'Untitled'
  const detail = record.description || record.agenda || record.notes || record.availability || record.email || 'No description provided.'

  return (
    <article className="record-card">
      <div className="record-card-top">
        <div className="startup-avatar">{title.slice(0, 1).toUpperCase()}</div>
        <span className={`status-pill ${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>
      </div>
      <h2>{title}</h2>
      <p className="record-subtitle">{label || 'Details not set'}</p>
      <p className="record-description">{detail}</p>
      {type === 'startups' && <div className="record-facts"><span>Team size <strong>{record.teamSize || 1}</strong></span><span>Cohort <strong>{data.cohorts.find((cohort) => String(cohort._id) === String(record.cohortId))?.name || '—'}</strong></span></div>}
      {type === 'sessions' && <p className="record-description">{record.notes ? `Notes: ${record.notes}` : `Agenda: ${record.agenda || 'Not set'}`}</p>}
      {type === 'milestones' && <div className="record-progress"><span>{record.status === 'Completed' ? 'Completed' : record.status === 'In progress' ? 'In progress' : 'Not started'}</span><span>Weight {record.weight || 1}</span></div>}
      {type === 'resources' && <div className="record-progress"><span>{record.startupId ? getStartupName(record.startupId, data.startups) : data.cohorts.find((cohort) => String(cohort._id) === String(record.cohortId))?.name || 'Unallocated'}</span><span>{record.allocatedUntil ? `Until ${displayDate(record.allocatedUntil)}` : ''}</span></div>}
      <div className="record-actions"><button className="small-button" onClick={onEdit}>Edit</button><button className="small-button danger-button" onClick={onDelete}>Delete</button></div>
    </article>
  )
}

function SettingsPanel({ user, onUserUpdated, onLogout, onNotice, onError }) {
  const settingsSections = [
    { id: 'profile', label: 'Profile', description: 'Manage your personal information.', icon: 'settings' },
    { id: 'account', label: 'Account', description: 'Configure your account preferences.', icon: 'dashboard' },
    { id: 'security', label: 'Security', description: 'Manage password and account security.', icon: 'notifications' },
    { id: 'notifications', label: 'Notifications', description: 'Control how you receive updates.', icon: 'notifications' },
    { id: 'appearance', label: 'Appearance', description: 'Customize your workspace appearance.', icon: 'ai' },
    { id: 'privacy', label: 'Privacy', description: 'Review your privacy preferences.', icon: 'resources' },
    { id: 'workspace', label: 'Workspace', description: 'Manage workspace-related preferences.', icon: 'startups' },
  ]

  const defaultPreferences = {
    email: true,
    mentorReminders: true,
    milestoneUpdates: true,
    resourceAnnouncements: false,
    workspaceActivity: true,
    accountAlerts: true,
  }

  const defaultAppearance = 'light'
  const defaultPrivacy = { profileVisibility: 'workspace-members', activityVisibility: true }
  const defaultWorkspace = { landingPage: 'dashboard' }
  const defaultAccount = { language: 'English (US)', timezone: 'UTC+05:30' }

  const storedNotifications = (() => {
    try {
      const raw = localStorage.getItem('startupSettings.notifications')
      return raw ? JSON.parse(raw) : null
    } catch (error) {
      return null
    }
  })()

  const storedAppearance = (() => {
    try {
      return localStorage.getItem('startupSettings.theme') || defaultAppearance
    } catch (error) {
      return defaultAppearance
    }
  })()

  const storedPrivacy = (() => {
    try {
      const raw = localStorage.getItem('startupSettings.privacy')
      return raw ? JSON.parse(raw) : defaultPrivacy
    } catch (error) {
      return defaultPrivacy
    }
  })()

  const storedWorkspace = (() => {
    try {
      const raw = localStorage.getItem('startupSettings.workspace')
      return raw ? JSON.parse(raw) : defaultWorkspace
    } catch (error) {
      return defaultWorkspace
    }
  })()

  const storedAccount = (() => {
    try {
      const raw = localStorage.getItem('startupSettings.account')
      return raw ? JSON.parse(raw) : defaultAccount
    } catch (error) {
      return defaultAccount
    }
  })()

  const [activeSection, setActiveSection] = useState('profile')
  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    email: user.email || '',
    username: user.username || '',
    role: user.role || 'founder',
  })
  const [profileErrors, setProfileErrors] = useState({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [notificationPrefs, setNotificationPrefs] = useState({ ...defaultPreferences, ...(storedNotifications || {}) })
  const [appearancePreference, setAppearancePreference] = useState(storedAppearance)
  const [privacyPreference, setPrivacyPreference] = useState(storedPrivacy)
  const [workspacePreference, setWorkspacePreference] = useState(storedWorkspace)
  const [accountPreference, setAccountPreference] = useState(storedAccount)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [passwordSaving, setPasswordSaving] = useState(false)

  const isProfileDirty = profileForm.name !== (user.name || '') || profileForm.email !== (user.email || '') || profileForm.role !== (user.role || 'founder')

  useEffect(() => {
    if (!isProfileDirty) return undefined
    const handleBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isProfileDirty])

  useEffect(() => {
    localStorage.setItem('startupSettings.notifications', JSON.stringify(notificationPrefs))
  }, [notificationPrefs])

  useEffect(() => {
    localStorage.setItem('startupSettings.theme', appearancePreference)
  }, [appearancePreference])

  useEffect(() => {
    localStorage.setItem('startupSettings.privacy', JSON.stringify(privacyPreference))
  }, [privacyPreference])

  useEffect(() => {
    localStorage.setItem('startupSettings.workspace', JSON.stringify(workspacePreference))
  }, [workspacePreference])

  useEffect(() => {
    localStorage.setItem('startupSettings.account', JSON.stringify(accountPreference))
  }, [accountPreference])

  const updateProfileField = (field, value) => {
    setProfileForm((current) => ({ ...current, [field]: value }))
    setProfileErrors((current) => ({ ...current, [field]: '' }))
  }

  const validateProfile = () => {
    const errors = {}
    if (!profileForm.name.trim()) errors.name = 'Full name is required.'
    if (!/^\S+@\S+\.\S+$/.test(profileForm.email)) errors.email = 'Enter a valid email address.'
    return errors
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    const validation = validateProfile()
    if (Object.keys(validation).length > 0) {
      setProfileErrors(validation)
      return
    }

    setSavingProfile(true)
    try {
      const result = await apiRequest(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          role: profileForm.role,
        }),
      })
      setProfileForm({
        name: result.name || profileForm.name,
        email: result.email || profileForm.email,
        username: user.username || profileForm.username,
        role: result.role || profileForm.role,
      })
      onUserUpdated(result)
      setProfileErrors({})
      onNotice('Profile updated successfully.')
    } catch (error) {
      onError(error.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const resetProfile = () => {
    setProfileForm({
      name: user.name || '',
      email: user.email || '',
      username: user.username || '',
      role: user.role || 'founder',
    })
    setProfileErrors({})
  }

  const handlePasswordUpdate = async (event) => {
    event.preventDefault()
    const nextErrors = {}

    if (!passwordForm.currentPassword) nextErrors.currentPassword = 'Current password is required.'
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) nextErrors.newPassword = 'New password must be at least 8 characters.'
    if (passwordForm.newPassword !== passwordForm.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'

    if (Object.keys(nextErrors).length) {
      setPasswordErrors(nextErrors)
      return
    }

    setPasswordSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      onNotice('Password updates are not supported by the current authentication API. Use your configured password reset flow instead.')
    } catch (error) {
      onError(error.message)
    } finally {
      setPasswordSaving(false)
    }
  }

  const toggleNotification = (key) => {
    setNotificationPrefs((current) => ({
      ...current,
      [key]: !current[key],
    }))
    onNotice('Notification preference updated.')
  }

  const sectionDetails = settingsSections.find((section) => section.id === activeSection) || settingsSections[0]

  return (
    <section className="surface-card settings-panel">
      <div className="settings-header">
        <div className="settings-header-copy">
          <p className="eyebrow">WORKSPACE PREFERENCES</p>
          <h1>Settings</h1>
          <p className="page-subtitle">Manage your profile, account security, and workspace experience.</p>
        </div>
        <div className="settings-header-actions">
          <div className="settings-user-badge">
            <ProfileAvatar name={user.name || user.username} src={user.profilePhoto} className="settings-avatar" />
            <div>
              <strong>{user.name || user.username}</strong>
              <span>{(user.role || 'founder').replace('_', ' ')}</span>
            </div>
          </div>
          <button type="button" className="secondary-button compact" onClick={() => onNotice('Support resources are available from your workspace administrator or help center.')}>Help &amp; Support</button>
        </div>
      </div>

      <div className="settings-layout">
        <aside className="settings-nav-panel" aria-label="Settings sections">
          <nav className="settings-nav" role="tablist" aria-label="Settings navigation">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={activeSection === section.id}
                className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="settings-nav-icon"><NavigationIcon name={section.icon} tone={activeSection === section.id ? 'violet' : 'slate'} /></span>
                <span>
                  <strong>{section.label}</strong>
                  <small>{section.description}</small>
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="settings-content">
          <div className="settings-section-header">
            <div>
              <p className="eyebrow">{sectionDetails.label.toUpperCase()}</p>
              <h2>{sectionDetails.label}</h2>
            </div>
            <span className="settings-status-pill">Secure</span>
          </div>

          {activeSection === 'profile' && (
            <div className="settings-section">
              <div className="profile-overview-card">
                <div className="profile-overview-main">
                  <ProfileAvatar
                    name={user.name || user.username}
                    src={user.profilePhoto}
                    className="settings-avatar-large"
                  />
                  <div className="profile-overview-copy">
                    <strong>{user.name || user.username}</strong>
                    <span>@{user.username}</span>
                    <p>{(user.role || 'founder').replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              <form className="settings-form" onSubmit={saveProfile} noValidate>
                <div className="form-grid">
                  <label>
                    <span>Full name</span>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(event) => updateProfileField('name', event.target.value)}
                      aria-invalid={Boolean(profileErrors.name)}
                    />
                    {profileErrors.name && <small className="field-error">{profileErrors.name}</small>}
                  </label>

                  <label>
                    <span>Email address</span>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(event) => updateProfileField('email', event.target.value)}
                      aria-invalid={Boolean(profileErrors.email)}
                    />
                    {profileErrors.email && <small className="field-error">{profileErrors.email}</small>}
                  </label>

                  <label>
                    <span>Username</span>
                    <input value={profileForm.username} disabled readOnly />
                  </label>

                  <label>
                    <span>Role</span>
                    <input value={(profileForm.role || 'founder').replace('_', ' ')} disabled readOnly />
                  </label>
                </div>

                <div className="settings-form-actions">
                  <button className="primary-button" type="submit" disabled={savingProfile || !isProfileDirty}>
                    {savingProfile ? 'Saving…' : 'Save changes'}
                  </button>
                  <button className="secondary-button" type="button" onClick={resetProfile} disabled={!isProfileDirty}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="settings-section">
              <div className="settings-info-grid">
                <div className="info-card">
                  <h3>Account information</h3>
                  <ul>
                    <li><strong>Username</strong><span>{user.username}</span></li>
                    <li><strong>Email</strong><span>{user.email}</span></li>
                    <li><strong>Account status</strong><span className="status-positive">Active</span></li>
                  </ul>
                </div>
                <div className="info-card">
                  <h3>Workspace preferences</h3>
                  <label>
                    <span>Preferred language</span>
                    <select value={accountPreference.language} onChange={(event) => setAccountPreference((current) => ({ ...current, language: event.target.value }))}>
                      <option value="English (US)">English (US)</option>
                      <option value="English (UK)">English (UK)</option>
                      <option value="Hindi">Hindi</option>
                    </select>
                  </label>
                  <label>
                    <span>Time zone</span>
                    <select value={accountPreference.timezone} onChange={(event) => setAccountPreference((current) => ({ ...current, timezone: event.target.value }))}>
                      <option value="UTC-08:00">UTC-08:00</option>
                      <option value="UTC+00:00">UTC+00:00</option>
                      <option value="UTC+05:30">UTC+05:30</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="settings-section">
              <div className="settings-message-box">
                <h3>Password updates</h3>
                <p>This workspace does not expose a password update API. Use the authentication flow already configured by your project or your workspace administrator to change or reset your password securely.</p>
              </div>

              <form className="settings-form security-form" onSubmit={handlePasswordUpdate} noValidate>
                <div className="form-grid">
                  <label>
                    <span>Current password</span>
                    <div className="password-field">
                      <input type={showPasswords.current ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} aria-invalid={Boolean(passwordErrors.currentPassword)} />
                      <button type="button" className="toggle-password" onClick={() => setShowPasswords((current) => ({ ...current, current: !current.current }))}>{showPasswords.current ? 'Hide' : 'Show'}</button>
                    </div>
                    {passwordErrors.currentPassword && <small className="field-error">{passwordErrors.currentPassword}</small>}
                  </label>

                  <label>
                    <span>New password</span>
                    <div className="password-field">
                      <input type={showPasswords.new ? 'text' : 'password'} value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} aria-invalid={Boolean(passwordErrors.newPassword)} />
                      <button type="button" className="toggle-password" onClick={() => setShowPasswords((current) => ({ ...current, new: !current.new }))}>{showPasswords.new ? 'Hide' : 'Show'}</button>
                    </div>
                    {passwordErrors.newPassword && <small className="field-error">{passwordErrors.newPassword}</small>}
                  </label>

                  <label>
                    <span>Confirm new password</span>
                    <div className="password-field">
                      <input type={showPasswords.confirm ? 'text' : 'password'} value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} aria-invalid={Boolean(passwordErrors.confirmPassword)} />
                      <button type="button" className="toggle-password" onClick={() => setShowPasswords((current) => ({ ...current, confirm: !current.confirm }))}>{showPasswords.confirm ? 'Hide' : 'Show'}</button>
                    </div>
                    {passwordErrors.confirmPassword && <small className="field-error">{passwordErrors.confirmPassword}</small>}
                  </label>
                </div>

                <div className="settings-form-actions">
                  <button className="primary-button" type="submit" disabled={passwordSaving}>{passwordSaving ? 'Updating…' : 'Update password'}</button>
                </div>
              </form>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="settings-section">
              <div className="toggle-card-list">
                {[
                  { key: 'email', label: 'Email notifications', description: 'Receive helpful updates in your inbox.' },
                  { key: 'mentorReminders', label: 'Mentor session reminders', description: 'Get nudges before important sessions.' },
                  { key: 'milestoneUpdates', label: 'Milestone updates', description: 'Track progress on startup milestones.' },
                  { key: 'resourceAnnouncements', label: 'Resource announcements', description: 'Hear about workspace resources and availability.' },
                  { key: 'workspaceActivity', label: 'Workspace activity', description: 'See product updates and collaboration events.' },
                  { key: 'accountAlerts', label: 'Important account alerts', description: 'Critical security and access messages.' },
                ].map((item) => (
                  <div className="toggle-card" key={item.key}>
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.description}</p>
                    </div>
                    <button type="button" className={`switch ${notificationPrefs[item.key] ? 'on' : ''}`} aria-pressed={notificationPrefs[item.key]} onClick={() => toggleNotification(item.key)}>
                      <span />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="settings-section">
              <div className="theme-grid">
                {[
                  { id: 'light', label: 'Light theme', description: 'Default dashboard appearance with a calm workspace feel.' },
                  { id: 'system', label: 'System theme', description: 'Follow the operating system preference. Current app styling remains light until proper global theme support is added.' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`theme-option ${appearancePreference === option.id ? 'selected' : ''}`}
                    onClick={() => {
                      setAppearancePreference(option.id)
                      onNotice(`Theme preference saved locally as ${option.label.toLowerCase()}.`)
                    }}
                  >
                    <span className="theme-preview">
                      <span className="theme-preview-header" />
                      <span className="theme-preview-body">
                        <span />
                        <span />
                        <span />
                      </span>
                    </span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="settings-section">
              <div className="privacy-grid">
                <label>
                  <span>Profile visibility</span>
                  <select value={privacyPreference.profileVisibility} onChange={(event) => setPrivacyPreference((current) => ({ ...current, profileVisibility: event.target.value }))}>
                    <option value="workspace-members">Visible to workspace members</option>
                    <option value="only-me">Only me</option>
                  </select>
                </label>

                <div className="toggle-card compact">
                  <div>
                    <strong>Workspace activity visibility</strong>
                    <p>Show your recent activity to members in this workspace.</p>
                  </div>
                  <button type="button" className={`switch ${privacyPreference.activityVisibility ? 'on' : ''}`} aria-pressed={privacyPreference.activityVisibility} onClick={() => setPrivacyPreference((current) => ({ ...current, activityVisibility: !current.activityVisibility }))}>
                    <span />
                  </button>
                </div>

                <div className="settings-message-box subtle">
                  <h3>Privacy information</h3>
                  <p>Workspace privacy settings are managed locally in this browser unless a server-backed privacy API is added.</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'workspace' && (
            <div className="settings-section">
              <div className="info-card full-width">
                <h3>Workspace defaults</h3>
                <div className="form-grid compact-grid">
                  <label>
                    <span>Workspace name</span>
                    <input value="Startup" readOnly disabled />
                  </label>
                  <label>
                    <span>Default landing page</span>
                    <select value={workspacePreference.landingPage} onChange={(event) => setWorkspacePreference((current) => ({ ...current, landingPage: event.target.value }))}>
                      <option value="dashboard">Dashboard</option>
                      <option value="startups">Startups</option>
                      <option value="notifications">Notifications</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="settings-footer-actions">
            <button type="button" className="secondary-button danger-button" onClick={onLogout}>Sign out</button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default IncubatorWorkspace
