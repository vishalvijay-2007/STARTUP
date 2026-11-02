import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../lib/api.js'

export default function AdminDashboard({ user, onBack, onLogout }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest('/admin/users')
      setUsers(result.users || [])
    } catch (requestError) {
      setError(requestError.message || 'Unable to load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const setMentorAccess = async (account, enabled) => {
    const roles = [...new Set([...(account.roles || []), 'founder'])]
      .filter((role) => role !== 'mentor')
    if (enabled) roles.push('mentor')
    setSavingId(account.id)
    setMessage('')
    setError('')
    try {
      await apiRequest(`/admin/users/${encodeURIComponent(account.id)}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ roles }),
      })
      setMessage(`Updated access for ${account.email}. They must sign in again to refresh their permissions.`)
      await loadUsers()
    } catch (requestError) {
      setError(requestError.message || 'Unable to update permissions.')
    } finally {
      setSavingId('')
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f7f7fb', padding: '32px 20px', color: '#172033' }}>
      <section style={{ maxWidth: 1050, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <p style={{ color: '#6548e8', fontWeight: 800, letterSpacing: 2, fontSize: 12 }}>STARTUP MANAGEMENT</p>
            <h1 style={{ margin: '6px 0', fontSize: 30 }}>Administrator dashboard</h1>
            <p style={{ margin: 0, color: '#667085' }}>Signed in as {user.email}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onBack} style={buttonStyle}>Workspace</button>
            <button type="button" onClick={onLogout} style={{ ...buttonStyle, background: '#fff1f1', color: '#a32121' }}>Sign out</button>
          </div>
        </header>

        <section style={{ background: '#fff', border: '1px solid #e5e7ef', borderRadius: 16, padding: 22, boxShadow: '0 8px 28px #1720330a' }}>
          <h2 style={{ marginTop: 0 }}>User access</h2>
          <p style={{ color: '#667085' }}>Grant or revoke Mentor access for registered accounts. Administrator privileges cannot be granted from this screen.</p>
          {message && <p role="status" style={{ color: '#176b3a', background: '#effaf2', padding: 12, borderRadius: 8 }}>{message}</p>}
          {error && <p role="alert" style={{ color: '#a32121', background: '#fff1f1', padding: 12, borderRadius: 8 }}>{error}</p>}
          {loading ? <p>Loading accounts…</p> : users.length === 0 ? <p>No accounts found.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead><tr>
                  {['Name / username', 'Email', 'Current roles', 'Mentor access'].map((label) => (
                    <th key={label} style={thStyle}>{label}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {users.map((account) => (
                    <tr key={account.id}>
                      <td style={tdStyle}><strong>{account.name}</strong><br /><small>@{account.username}</small></td>
                      <td style={tdStyle}>{account.email}</td>
                      <td style={tdStyle}>{(account.roles || []).join(', ')}</td>
                      <td style={tdStyle}>
                        {account.roles?.includes('admin') ? 'Administrator' : (
                          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                            <input
                              type="checkbox"
                              checked={Boolean(account.roles?.includes('mentor'))}
                              disabled={savingId === account.id}
                              onChange={(event) => setMentorAccess(account, event.target.checked)}
                            />
                            {savingId === account.id ? 'Saving…' : 'Mentor'}
                          </label>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button type="button" onClick={loadUsers} disabled={loading} style={{ ...buttonStyle, marginTop: 18 }}>Refresh users</button>
        </section>
      </section>
    </main>
  )
}

const buttonStyle = {
  border: '1px solid #d8dbea', borderRadius: 9, padding: '10px 15px',
  background: '#fff', color: '#3c2c9c', fontWeight: 700, cursor: 'pointer',
}
const thStyle = { padding: '12px 10px', borderBottom: '1px solid #e5e7ef', color: '#667085', fontSize: 13 }
const tdStyle = { padding: '14px 10px', borderBottom: '1px solid #edf0f5', verticalAlign: 'top' }
