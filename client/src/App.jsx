import { useEffect, useRef, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')

const initialForm = {
  title: '',
  category: '',
  description: '',
  hours: '',
  file: null,
}

const initialAuthForm = {
  name: '',
  username: '',
  email: '',
  password: '',
}

function GoogleSignIn({ clientId, onCredential }) {
  const buttonRef = useRef(null)
  const callbackRef = useRef(onCredential)

  useEffect(() => {
    callbackRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    if (!clientId) return undefined

    const renderButton = () => {
      if (!window.google || !buttonRef.current) return
      window.google.accounts.id.initialize({ client_id: clientId, callback: (response) => callbackRef.current(response) })
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      })
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript) {
      renderButton()
      return undefined
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = renderButton
    document.head.appendChild(script)

    return () => script.remove()
  }, [clientId])

  if (!clientId) return <p className="config-text">Google sign-in needs VITE_GOOGLE_CLIENT_ID.</p>
  return <div ref={buttonRef} className="google-sign-in" />
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [courses, setCourses] = useState([])
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [status, setStatus] = useState('Loading courses...')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(initialAuthForm)
  const [authStatus, setAuthStatus] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  const apiRequest = (url, options = {}) =>
    fetch(url, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(localStorage.getItem('authToken')
          ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
          : {}),
        ...options.headers,
      },
    })

  const fetchCourses = async () => {
    try {
      const response = await apiRequest(`${API_BASE_URL}/courses`)
      if (!response.ok) {
        throw new Error('Unable to fetch courses')
      }

      const data = await response.json()
      setCourses(data)
      setStatus(data.length ? 'Courses loaded successfully.' : 'No courses saved yet.')
    } catch (error) {
      setStatus(error.message)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) return

    apiRequest(`${API_BASE_URL}/auth/me`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Session expired.')
        const result = await response.json()
        setUser(result.user)
        await fetchCourses()
      })
      .catch(() => localStorage.removeItem('authToken'))
  }, [])

  const handleChange = (event) => {
    const { name, value, files } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: name === 'file' ? files[0] || null : value }))
  }

  const handleAuthChange = (event) => {
    const { name, value } = event.target
    setAuthForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setAuthStatus('')

    try {
      const response = await apiRequest(`${API_BASE_URL}/auth/${authMode}`, {
        method: 'POST',
        body: JSON.stringify(authForm),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Authentication failed.')

      localStorage.setItem('authToken', result.token)
      setUser(result.user)
      setAuthForm(initialAuthForm)
      setAuthStatus('')
      await fetchCourses()
    } catch (error) {
      setAuthStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredential = async (response) => {
    setLoading(true)
    setAuthStatus('')

    try {
      const result = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      }).then(async (apiResponse) => {
        const data = await apiResponse.json()
        if (!apiResponse.ok) throw new Error(data.message || 'Google authentication failed.')
        return data
      })

      localStorage.setItem('authToken', result.token)
      setUser(result.user)
      await fetchCourses()
    } catch (error) {
      setAuthStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setUser(null)
    setCourses([])
    setStatus('')
  }

  const startEditing = (course) => {
    setEditingCourseId(course._id)
    setForm({
      title: course.title,
      category: course.category,
      description: course.description,
      hours: String(course.hours),
    })
    setStatus(`Editing ${course.title}`)
  }

  const cancelEditing = () => {
    setEditingCourseId(null)
    setForm(initialForm)
    setStatus('Ready to add a course.')
  }

  const handleAiSuggest = async () => {
    setAiLoading(true)
    setStatus('Creating an AI course suggestion...')

    try {
      const response = await apiRequest(`${API_BASE_URL}/ai/course-suggestions`, {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          description: form.description,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'AI suggestion could not be created.')

      setForm((currentForm) => ({ ...currentForm, ...result.suggestion }))
      setStatus('AI suggestion added. Review it before saving.')
    } catch (error) {
      setStatus(error.message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const courseData = new FormData()
      courseData.append('title', form.title)
      courseData.append('category', form.category)
      courseData.append('description', form.description)
      courseData.append('hours', String(Number(form.hours)))
      if (form.file) courseData.append('file', form.file)

      const response = await apiRequest(
        `${API_BASE_URL}/courses${editingCourseId ? `/${editingCourseId}` : ''}`,
        {
          method: editingCourseId ? 'PUT' : 'POST',
          body: courseData,
        },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Course could not be saved.')
      }

      setForm(initialForm)
      setEditingCourseId(null)
      setStatus(`Course ${editingCourseId ? 'updated' : 'created'}: ${result.title}`)
      await fetchCourses()
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (course) => {
    if (!window.confirm(`Delete ${course.title}?`)) return

    setLoading(true)
    try {
      const response = await apiRequest(`${API_BASE_URL}/courses/${course._id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Course could not be deleted.')
      }

      if (editingCourseId === course._id) cancelEditing()
      setStatus(`Course deleted: ${course.title}`)
      await fetchCourses()
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="panel auth-panel">
          <p className="eyebrow">Startup Management</p>
          <h1>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="auth-intro">Sign in to manage your startup learning courses.</p>
          <form onSubmit={handleAuthSubmit} className="course-form">
            {authMode === 'register' && (
              <label>
                Full name
                <input name="name" value={authForm.name} onChange={handleAuthChange} required />
              </label>
            )}
            <label>
              Username
              <input name="username" value={authForm.username} onChange={handleAuthChange} minLength="3" required />
            </label>
            {authMode === 'register' && (
              <label>
                Email
                <input type="email" name="email" value={authForm.email} onChange={handleAuthChange} required />
              </label>
            )}
            <label>
              Password
              <input type="password" name="password" value={authForm.password} onChange={handleAuthChange} minLength="8" required />
            </label>
            <button type="submit" disabled={loading}>{loading ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Create account'}</button>
            {authStatus && <p className="error-text">{authStatus}</p>}
          </form>
          <div className="auth-divider"><span>or</span></div>
          <GoogleSignIn clientId={googleClientId} onCredential={handleGoogleCredential} />
          <button type="button" className="link-btn" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthStatus('') }}>
            {authMode === 'login' ? 'Need an account? Register' : 'Already registered? Sign in'}
          </button>
        </section>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Startup Management</p>
          <h1>Course Portal</h1>
        </div>
        <div className="topbar-actions">
          <span className="status-badge">@{user.username}</span>
          <button type="button" className="logout-btn" onClick={logout}>Log out</button>
        </div>
      </header>

      <main className="content-grid">
        <section className="panel form-panel">
          <div className="form-heading">
            <h2>{editingCourseId ? 'Edit course' : 'Add a new course'}</h2>
            <button type="button" className="ai-btn" onClick={handleAiSuggest} disabled={loading || aiLoading}>
              {aiLoading ? 'Thinking...' : 'Suggest with AI'}
            </button>
          </div>
          <p className="ai-hint">Start with a topic, or let AI draft the course details for you.</p>
          <form onSubmit={handleSubmit} className="course-form">
            <label>
              Course title
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="AI for Founders"
                required
              />
            </label>

            <label>
              Category
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Technology"
                required
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the training module"
                required
              />
            </label>

            <label>
              Hours
              <input
                type="number"
                name="hours"
                value={form.hours}
                onChange={handleChange}
                min="1"
                placeholder="8"
                required
              />
            </label>

            <label>
              Course resource (optional, max 10MB)
              <input type="file" name="file" onChange={handleChange} accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt" />
              {form.file && <span className="file-name">Selected: {form.file.name}</span>}
            </label>

            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingCourseId ? 'Update Course' : 'Save Course'}
            </button>
            {editingCourseId && (
              <button type="button" className="cancel-btn" onClick={cancelEditing} disabled={loading}>
                Cancel editing
              </button>
            )}
          </form>
        </section>

        <section className="panel list-panel">
          <div className="section-header">
            <h2>Saved courses</h2>
            <button type="button" className="refresh-btn" onClick={fetchCourses}>
              Refresh
            </button>
          </div>

          <p className="status-text">{status}</p>

          <ul className="course-list">
            {courses.map((course) => (
              <li key={course._id} className="course-item">
                <div>
                  <h3>{course.title}</h3>
                  <p className="meta">{course.category} | {course.hours} hours</p>
                </div>
                <p>{course.description}</p>
                {course.fileUrl && (
                  <a className="file-link" href={`${API_ORIGIN}${course.fileUrl}`} target="_blank" rel="noreferrer">
                    Open resource: {course.fileName}
                  </a>
                )}
                <div className="course-actions">
                  <button type="button" className="edit-btn" onClick={() => startEditing(course)} disabled={loading}>
                    Edit
                  </button>
                  <button type="button" className="delete-btn" onClick={() => handleDelete(course)} disabled={loading}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}

export default App