import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import IncubatorWorkspace from './components/IncubatorWorkspace.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import { apiRequest } from './lib/api.js'
import { getCurrentPath, navigateToPath, subscribeToPath } from './lib/browserRouter.js'
import { workspacePageIds } from './lib/workspaceRoutes.js'
import './App.css'

const initialForm = { name: '', username: '', email: '', password: '', confirmPassword: '' }
const signInPath = '/signin'
const dashboardPath = '/dashboard'
const accountRoles = [
  {
    id: 'founder',
    name: 'Founder',
    description: 'Manage your startup and track your progress.',
    icon: <path d="M4 19.5h16M6.5 16V9.5l5.5-4 5.5 4V16M9.5 16v-3.5h5V16" />,
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Support founders and manage mentoring sessions.',
    icon: <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 20a7 7 0 0 1 14 0M18 8.5h4M20 6.5v4" />,
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Manage users and approve Mentor access.',
    icon: <path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3Zm-3 9 2 2 4-4" />,
  },
]

const authErrorMessage = (error) => {
  if (error?.status >= 500) return 'We could not complete your request right now. Please try again shortly.'
  if (!error?.status && error instanceof TypeError) return 'We could not reach the server. Check your connection and try again.'
  return error?.message || 'We could not complete your request. Please try again.'
}

function GoogleSignIn({ clientId, onCredential, onError }) {
  const buttonRef = useRef(null)
  const callbackRef = useRef({ onCredential, onError })

  useEffect(() => {
    callbackRef.current = { onCredential, onError }
  }, [onCredential, onError])

  useEffect(() => {
    if (!clientId) return undefined

    const handleScriptError = () => {
      callbackRef.current.onError('Google sign-in could not be loaded. Check your connection and try again.')
    }
    const renderButton = () => {
      if (!window.google || !buttonRef.current) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response?.credential) {
            callbackRef.current.onError('Google did not return a sign-in credential. Please try again.')
            return
          }
          callbackRef.current.onCredential(response)
        },
        error_callback: () => {
          callbackRef.current.onError('Google sign-in was closed or could not be opened. Please try again.')
        },
      })
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      })
    }

    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
    script.addEventListener('load', renderButton)
    script.addEventListener('error', handleScriptError)
    if (window.google) renderButton()
    return () => {
      script.removeEventListener('load', renderButton)
      script.removeEventListener('error', handleScriptError)
    }
  }, [clientId])

  if (!clientId) return <p className="config-text">Google sign-in needs VITE_GOOGLE_CLIENT_ID.</p>
  return <div ref={buttonRef} className="google-sign-in" />
}

function App() {
  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(initialForm)
  const [authStatus, setAuthStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('founder')
  const [showPassword, setShowPassword] = useState(false)
  const [checkingSession, setCheckingSession] = useState(() => Boolean(localStorage.getItem('authToken')))
  const currentPath = useSyncExternalStore(subscribeToPath, getCurrentPath, () => '/')
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) return undefined

    let active = true
    apiRequest('/auth/me')
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        if (!active) return
        setAuthStatus(localStorage.getItem('authToken')
          ? 'Your session could not be verified. Please sign in again.'
          : 'Your session expired. Please sign in again.')
      })
      .finally(() => {
        if (active) setCheckingSession(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!user?.profilePhoto?.startsWith('blob:')) return undefined
    const photoUrl = user.profilePhoto
    return () => URL.revokeObjectURL(photoUrl)
  }, [user?.profilePhoto])

  useEffect(() => {
    const handleExpiredSession = () => {
      setUser(null)
      setAuthStatus('Your session expired. Please sign in again.')
    }
    window.addEventListener('auth-expired', handleExpiredSession)
    return () => window.removeEventListener('auth-expired', handleExpiredSession)
  }, [])

  useEffect(() => {
    if (checkingSession) return

    if (!user) {
      if (currentPath !== signInPath) navigateToPath(signInPath, { replace: true })
      return
    }

    const page = currentPath.replace(/^\/+|\/+$/g, '')
    const destination = page === 'admin' && user.role === 'admin'
      ? '/admin'
      : workspacePageIds.has(page) ? `/${page}` : dashboardPath
    if (currentPath !== destination) navigateToPath(destination, { replace: true })
  }, [checkingSession, currentPath, user])

  const navigateToPage = (page) => {
    if (!workspacePageIds.has(page)) return
    navigateToPath(`/${page}`)
  }

  const establishSession = ({ token, user: authenticatedUser }) => {
    localStorage.setItem('authToken', token)
    setUser(authenticatedUser)
    setAuthForm(initialForm)
    setAuthStatus('')
    navigateToPath(authenticatedUser?.role === 'admin' ? '/admin' : dashboardPath, { replace: true })
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    if (selectedRole === 'admin') {
      setAuthStatus('Administrator access is available only to the Google account configured as ADMIN_EMAIL by the project owner. Use Continue with Google.')
      return
    }
    if (loading) return
    if (authMode === 'register' && authForm.password !== authForm.confirmPassword) {
      setAuthStatus('Your passwords do not match.')
      return
    }
    setLoading(true)
    setAuthStatus('')
    try {
      const requestBody = authMode === 'register'
        ? {
            name: authForm.name,
            username: authForm.username,
            email: authForm.email,
            password: authForm.password,
            role: selectedRole,
          }
        : { username: authForm.username, password: authForm.password, role: selectedRole }
      const session = await apiRequest(`/auth/${authMode}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      if (session.user?.role !== selectedRole) {
        const actualRole = accountRoles.find(({ id }) => id === session.user?.role)?.name
        setAuthStatus(actualRole
          ? `This account is registered as a ${actualRole}. Select ${actualRole} to sign in.`
          : 'This account does not match the selected role. Choose the correct role and try again.')
        return
      }
      establishSession(session)
    } catch (error) {
      setAuthStatus(authErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredential = async ({ credential }) => {
    if (loading) return
    setLoading(true)
    setAuthStatus('')
    try {
      const googleAuthPath = authMode === 'register' ? '/auth/google/register' : '/auth/google'
      const session = await apiRequest(googleAuthPath, {
        method: 'POST',
        body: JSON.stringify({ credential, role: selectedRole }),
      })
      if (session.user?.role !== selectedRole) {
        const actualRole = accountRoles.find(({ id }) => id === session.user?.role)?.name
        setAuthStatus(actualRole
          ? `This Google account is registered as a ${actualRole}. Select ${actualRole} to continue.`
          : 'This account does not match the selected role. Choose the correct role and try again.')
        return
      }
      establishSession(session)
    } catch (error) {
      setAuthStatus(authErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const selectRoleWithKeyboard = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? accountRoles.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : accountRoles.length - 1)) % accountRoles.length
    const nextRole = accountRoles[nextIndex]
    setSelectedRole(nextRole.id)
    event.currentTarget.parentElement?.querySelector(`[data-role="${nextRole.id}"]`)?.focus()
    setAuthStatus('')
  }

  const logout = () => {
    const token = localStorage.getItem('authToken')
    localStorage.removeItem('authToken')
    setUser(null)
    setAuthStatus('')
    navigateToPath(signInPath, { replace: true })
    if (!token) return

    apiRequest('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch((error) => {
      setAuthStatus(`You were signed out on this device, but the server could not invalidate the session: ${authErrorMessage(error)}`)
    })
  }

  if (checkingSession) {
    return <main className="session-loading" aria-live="polite">Restoring your secure session…</main>
  }

  if (user) {
    const activePage = currentPath.replace(/^\/+|\/+$/g, '')
    if (activePage === 'admin' && user.role === 'admin') {
      return <AdminDashboard user={user} onBack={() => navigateToPath('/dashboard')} onLogout={logout} />
    }
    return (
      <IncubatorWorkspace
        user={user}
        activePage={workspacePageIds.has(activePage) ? activePage : 'dashboard'}
        onNavigate={navigateToPage}
        onUserUpdated={(updatedUser) => setUser((currentUser) => ({ ...currentUser, ...updatedUser }))}
        onLogout={logout}
      />
    )
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="auth-visual-content">
          <div className="brand-mark"><span className="brand-icon" aria-hidden="true">✦</span> STARTUP</div>
          <h2>Build. Connect. Grow.</h2>
          <p>One workspace for founders and mentors to turn ambitious ideas into meaningful progress.</p>
          <div className="feature-pills">
            <span className="feature-pill">Startup Growth</span>
            <span className="feature-pill">Expert Mentorship</span>
            <span className="feature-pill">Milestone Tracking</span>
          </div>
          <p className="auth-visual-footer">Empowering the next generation of startups.</p>
        </div>
      </section>
      <section className="auth-card-wrap">
        <div className="auth-panel">
          <p className="eyebrow">Startup Management</p>
          <h1>{authMode === 'login' ? 'Welcome back' : 'Join the startup community'}</h1>
          <p className="auth-intro">
            {authMode === 'login'
              ? selectedRole === 'founder'
                ? 'Sign in to manage your startup and continue making progress.'
                : 'Sign in to mentor founders and manage your mentoring sessions.'
              : selectedRole === 'admin'
                ? 'Administrator access is restricted to the Google email configured by the project owner.'
                : `Create your ${selectedRole} account and join the community.`}
          </p>
          <div className="role-picker" role="radiogroup" aria-label="Choose your account role">
            {accountRoles.map((role, index) => (
              <button
                key={role.id}
                type="button"
                role="radio"
                aria-checked={selectedRole === role.id}
                aria-label={`${role.name}. ${role.description}`}
                data-role={role.id}
                tabIndex={selectedRole === role.id ? 0 : -1}
                className={`role-option ${selectedRole === role.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedRole(role.id)
                  setAuthStatus('')
                }}
                onKeyDown={(event) => selectRoleWithKeyboard(event, index)}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  {role.icon}
                </svg>
                <span className="role-option-copy">
                  <strong>{role.name}</strong>
                  <span>{role.description}</span>
                </span>
              </button>
            ))}
          </div>
          {selectedRole === 'admin' && (
            <p className="config-text">Use the configured administrator Google account. Admin access cannot be self-assigned.</p>
          )}
          <form onSubmit={handleAuthSubmit} className="course-form auth-form">
            {authMode === 'register' && (
              <>
                <label htmlFor="auth-name">Full name
                  <input id="auth-name" name="name" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} autoComplete="name" required />
                </label>
                <label htmlFor="auth-email">Email address
                  <input id="auth-email" type="email" name="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} autoComplete="email" required />
                </label>
              </>
            )}
            <label htmlFor="auth-username">Username
              <input id="auth-username" name="username" value={authForm.username} onChange={(event) => setAuthForm({ ...authForm, username: event.target.value })} minLength="3" maxLength="20" pattern="[A-Za-z0-9_]{3,20}" autoComplete="username" required />
            </label>
            <label htmlFor="auth-password">Password
              <span className="password-field">
                <input id="auth-password" type={showPassword ? 'text' : 'password'} name="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} minLength="8" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} required />
                <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>
            {authMode === 'register' && (
              <label htmlFor="auth-confirm-password">Confirm password
                <input id="auth-confirm-password" type={showPassword ? 'text' : 'password'} name="confirmPassword" value={authForm.confirmPassword} onChange={(event) => setAuthForm({ ...authForm, confirmPassword: event.target.value })} autoComplete="new-password" aria-invalid={Boolean(authStatus && authForm.password !== authForm.confirmPassword)} required />
              </label>
            )}
            <button className="auth-submit" type="submit" disabled={loading} aria-busy={loading}>
              {loading && <span className="auth-spinner" aria-hidden="true" />}
              {loading ? (authMode === 'login' ? 'Signing in…' : 'Creating account…') : authMode === 'login' ? 'Sign in' : 'Create account'}
            </button>
            {authStatus && <p className="error-text auth-message" role="alert" aria-live="polite">{authStatus}</p>}
          </form>
          {googleClientId && (
            <>
              <div className="auth-divider"><span>or</span></div>
              <GoogleSignIn
                clientId={googleClientId}
                onCredential={handleGoogleCredential}
                onError={(message) => setAuthStatus(message)}
              />
            </>
          )}
          <p className="auth-switch">
            {authMode === 'login' ? 'New to the platform?' : 'Already part of the community?'}
            {' '}
            <button type="button" className="link-btn" onClick={() => {
              setAuthMode(authMode === 'login' ? 'register' : 'login')
              setAuthStatus('')
            }}>
              {authMode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
