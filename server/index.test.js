import { jest } from '@jest/globals'
import { OAuth2Client } from 'google-auth-library'
import {
  app,
  createPasswordHash,
  createRateLimiter,
  createUniqueUsername,
  generateAIChatResponse,
  generateAIInsights,
  generateLocalAssistantResponse,
  fallbackCourseSuggestions,
  generateCourseSuggestions,
  generateLocalInsights,
  normalizeUsername,
  serializeUser,
  updateStoredUser,
  verifyPassword,
} from './index.js'

const openAIResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
const nativeFetch = global.fetch

describe('course suggestion generation', () => {
  let originalApiKey
  let originalFetch

  beforeEach(() => {
    originalApiKey = process.env.OPENAI_API_KEY
    originalFetch = global.fetch
    process.env.OPENAI_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = originalApiKey
    global.fetch = originalFetch
  })

  test('returns built-in ideas with setup guidance when no API key is configured', async () => {
    delete process.env.OPENAI_API_KEY

    const result = await generateCourseSuggestions({})

    expect(result.source).toBe('local')
    expect(result.suggestions).toHaveLength(5)
    expect(result.message).toContain('OPENAI_API_KEY')
  })

  test('returns built-in ideas and explains an invalid API key response', async () => {
    global.fetch = jest.fn().mockResolvedValue(openAIResponse({ error: { message: 'invalid key' } }, 401))

    const result = await generateCourseSuggestions({})

    expect(result.source).toBe('local')
    expect(result.suggestions).toHaveLength(5)
    expect(result.message).toContain('rejected its server API key')
  })

  test('returns built-in ideas when the AI provider cannot be reached', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network failure'))

    const result = await generateCourseSuggestions({})

    expect(result.source).toBe('local')
    expect(result.suggestions).toHaveLength(5)
    expect(result.message).toContain('temporarily unreachable')
  })

  test('returns AI-generated ideas when the provider responds successfully', async () => {
    global.fetch = jest.fn().mockResolvedValue(openAIResponse({
      choices: [{
        message: {
          content: JSON.stringify({
            suggestions: [
              { title: 'Idea One', category: 'Product', description: 'First course', hours: 3 },
              { title: 'Idea Two', category: 'Finance', description: 'Second course', hours: 4 },
              { title: 'Idea Three', category: 'Growth', description: 'Third course', hours: 5 },
            ],
          }),
        },
      }],
    }))

    const result = await generateCourseSuggestions({})

    expect(result.source).toBe('ai')
    expect(result.suggestions).toHaveLength(3)
    expect(result.suggestions[0].title).toBe('Idea One')
    expect(new Headers(global.fetch.mock.calls[0][1].headers).get('authorization')).toBe('Bearer test-api-key')
  })
})

describe('authentication and user helpers', () => {
  test('normalizes a username by trimming and lowercasing it', () => {
    expect(normalizeUsername('  Founder_One  ')).toBe('founder_one')
  })

  test('returns an empty username for non-string input', () => {
    expect(normalizeUsername(null)).toBe('')
  })

  test('creates a password hash that verifies with the original password', async () => {
    const passwordHash = await createPasswordHash('correct horse battery staple')

    await expect(verifyPassword('correct horse battery staple', passwordHash)).resolves.toBe(true)
  })

  test('rejects an incorrect password', async () => {
    const passwordHash = await createPasswordHash('correct password')

    await expect(verifyPassword('wrong password', passwordHash)).resolves.toBe(false)
  })

  test('serializes only public user fields', () => {
    const user = {
      _id: 'user-123',
      name: 'Asha Founder',
      username: 'asha',
      email: 'asha@example.com',
      role: 'student',
      roles: ['student'],
      profilePhoto: '/uploads/profile-photo.jpg',
      passwordHash: 'secret',
      googleId: 'google-123',
      enrolledCourses: ['course-123'],
    }

    expect(serializeUser(user)).toEqual({
      id: 'user-123',
      name: 'Asha Founder',
      username: 'asha',
      email: 'asha@example.com',
      role: 'student',
      roles: ['student'],
      profilePhoto: '/uploads/profile-photo.jpg',
    })
  })

  test('registers founders and prevents users from self-assigning Mentor access', async () => {
    const server = app.listen(0, '127.0.0.1')
    await new Promise((resolve, reject) => {
      server.once('listening', resolve)
      server.once('error', reject)
    })

    const baseUrl = `http://127.0.0.1:${server.address().port}`
    const suffix = Date.now().toString().slice(-8)
    const requestJson = (path, body, token) => nativeFetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })

    try {
      const forbiddenRole = await requestJson('/api/auth/register', {
        name: 'Attempted Admin',
        username: `admin${suffix}`,
        email: `admin-${suffix}@example.com`,
        password: 'secure-password',
        role: 'admin',
      })
      expect(forbiddenRole.status).toBe(400)

      const unauthorizedMentorRegistration = await requestJson('/api/auth/register', {
        name: 'Attempted Mentor',
        username: `mentor${suffix}`,
        email: `mentor-${suffix}@example.com`,
        password: 'secure-password',
        role: 'mentor',
      })
      expect(unauthorizedMentorRegistration.status).toBe(403)
      expect((await unauthorizedMentorRegistration.json()).message).toContain('authorized by an administrator')

      for (const role of ['founder']) {
        const username = `${role}${suffix}`
        const email = `${role}-${suffix}@example.com`
        const credentials = { username, password: 'secure-password' }
        const registration = await requestJson('/api/auth/register', {
          ...credentials,
          name: `${role} Test`,
          email,
          role,
        })
        expect(registration.status).toBe(201)
        const registered = await registration.json()
        expect(registered.user.role).toBe(role)

        const selfPromotion = await nativeFetch(`${baseUrl}/api/users/${registered.user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${registered.token}`,
          },
          body: JSON.stringify({
            name: registered.user.name,
            email: registered.user.email,
            role: 'mentor',
          }),
        })
        expect(selfPromotion.status).toBe(403)

        const selfRoleAssignment = await nativeFetch(`${baseUrl}/api/users/${registered.user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${registered.token}`,
          },
          body: JSON.stringify({
            name: registered.user.name,
            email: registered.user.email,
            roles: ['founder', 'mentor'],
          }),
        })
        expect(selfRoleAssignment.status).toBe(403)

        const signIn = await requestJson('/api/auth/login', { ...credentials, role })
        expect(signIn.status).toBe(200)
        const session = await signIn.json()
        expect(session.user.role).toBe(role)

        const wrongRole = role === 'founder' ? 'mentor' : 'founder'
        const mismatchedSignIn = await requestJson('/api/auth/login', { ...credentials, role: wrongRole })
        expect(mismatchedSignIn.status).toBe(403)

        const currentUser = await nativeFetch(`${baseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${session.token}` },
        })
        expect((await currentUser.json()).user.role).toBe(role)

        if (role === 'mentor') {
          const founderOnlyWrite = await requestJson('/api/startups', { name: 'Not allowed' }, session.token)
          expect(founderOnlyWrite.status).toBe(403)
        }

        const logout = await requestJson('/api/auth/logout', {}, session.token)
        expect(logout.status).toBe(200)
        const revokedSession = await nativeFetch(`${baseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${session.token}` },
        })
        expect(revokedSession.status).toBe(401)

        const signedInAgain = await requestJson('/api/auth/login', { ...credentials, role })
        expect(signedInAgain.status).toBe(200)
        const signedInSession = await signedInAgain.json()
        const restoredSession = await nativeFetch(`${baseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${signedInSession.token}` },
        })
        expect(restoredSession.status).toBe(200)
      }
    } finally {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    }
  })

  test('Google and password sign-in honor administrator-assigned roles without granting roles during sign-in', async () => {
    const originalGoogleClientId = process.env.GOOGLE_CLIENT_ID
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
    const suffix = Date.now().toString()
    const identities = {
      'founder-credential': {
        sub: `google-founder-${suffix}`,
        email: `google-founder-${suffix}@example.com`,
        email_verified: true,
        name: 'Google Founder',
      },
      'new-mentor-credential': {
        sub: `google-new-mentor-${suffix}`,
        email: `google-new-mentor-${suffix}@example.com`,
        email_verified: true,
        name: 'New Google Mentor',
      },
      'existing-mentor-credential': {
        sub: `google-existing-mentor-${suffix}`,
        email: `google-mentor-${suffix}@example.com`,
        email_verified: true,
        name: 'Existing Google Mentor',
      },
      'different-google-credential': {
        sub: `google-different-${suffix}`,
        email: `google-founder-${suffix}@example.com`,
        email_verified: true,
        name: 'Different Google Identity',
      },
    }
    const verifyToken = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken')
      .mockImplementation(async ({ idToken }) => ({ getPayload: () => identities[idToken] }))
    const server = app.listen(0, '127.0.0.1')
    await new Promise((resolve, reject) => {
      server.once('listening', resolve)
      server.once('error', reject)
    })

    const baseUrl = `http://127.0.0.1:${server.address().port}`
    const postJson = (path, body) => nativeFetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const registerFounder = async (label) => {
      const username = `${label}${suffix.slice(-8)}`
      const email = `google-${label}-${suffix}@example.com`
      const response = await postJson('/api/auth/register', {
        name: `Google ${label}`,
        username,
        email,
        password: 'secure-password',
        role: 'founder',
      })
      expect(response.status).toBe(201)
      const { user } = await response.json()
      return { email, id: user.id, username }
    }

    try {
      const founderAccount = await registerFounder('founder')

      identities['founder-credential'].email = founderAccount.email

      const founderWrongRole = await postJson('/api/auth/google', {
        credential: 'founder-credential',
        role: 'mentor',
      })
      expect(founderWrongRole.status).toBe(403)
      const founderRoleMismatch = await founderWrongRole.json()
      expect(founderRoleMismatch.message).toContain('registered as a Founder')
      expect(founderRoleMismatch.message).toContain('Ask an administrator')

      const founderRegistrationWrongRole = await postJson('/api/auth/google/register', {
        credential: 'founder-credential',
        role: 'mentor',
      })
      expect(founderRegistrationWrongRole.status).toBe(403)

      const founderSignIn = await postJson('/api/auth/google', {
        credential: 'founder-credential',
        role: 'founder',
      })
      expect(founderSignIn.status).toBe(200)
      const founderSession = await founderSignIn.json()
      expect(founderSession.user.role).toBe('founder')
      expect(founderSession.user.roles).toEqual(['founder'])

      const repeatedFounderSignIn = await postJson('/api/auth/google', {
        credential: 'founder-credential',
        role: 'founder',
      })
      expect(repeatedFounderSignIn.status).toBe(200)
      expect((await repeatedFounderSignIn.json()).user.id).toBe(founderSession.user.id)

      const adminAccount = await registerFounder('administrator')
      await updateStoredUser(adminAccount.id, { role: 'admin', roles: ['admin'] })
      const adminSignIn = await postJson('/api/auth/login', {
        username: adminAccount.username,
        password: 'secure-password',
      })
      expect(adminSignIn.status).toBe(200)
      const adminSession = await adminSignIn.json()
      expect(adminSession.user.role).toBe('admin')
      const assignAccountRoles = async (account, roles) => nativeFetch(`${baseUrl}/api/users/${account.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession.token}`,
        },
        body: JSON.stringify({ name: `Google ${account.username}`, email: account.email, roles }),
      })

      const founderRoleAssignment = await assignAccountRoles(founderAccount, ['founder', 'mentor'])
      expect(founderRoleAssignment.status).toBe(200)
      expect((await founderRoleAssignment.json()).roles).toEqual(['founder', 'mentor'])

      const founderAccountMentorSession = await postJson('/api/auth/google', {
        credential: 'founder-credential',
        role: 'mentor',
      })
      expect(founderAccountMentorSession.status).toBe(200)
      const founderAsMentor = await founderAccountMentorSession.json()
      expect(founderAsMentor.user.role).toBe('mentor')
      expect(founderAsMentor.user.roles).toEqual(['founder', 'mentor'])

      const revokeMentorRole = await assignAccountRoles(founderAccount, ['founder'])
      expect(revokeMentorRole.status).toBe(200)
      const revokedRoleSession = await nativeFetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${founderAsMentor.token}` },
      })
      expect(revokedRoleSession.status).toBe(403)
      const restoreMentorRole = await assignAccountRoles(founderAccount, ['founder', 'mentor'])
      expect(restoreMentorRole.status).toBe(200)

      const mentorMe = await nativeFetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${founderAsMentor.token}` },
      })
      expect((await mentorMe.json()).user.role).toBe('mentor')

      const mentorWriteWithSession = await nativeFetch(`${baseUrl}/api/startups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${founderAsMentor.token}`,
        },
        body: JSON.stringify({ name: 'Role check' }),
      })
      expect(mentorWriteWithSession.status).toBe(403)

      const founderWriteWithSession = await nativeFetch(`${baseUrl}/api/startups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${founderSession.token}`,
        },
        body: JSON.stringify({ name: 'Founder role check' }),
      })
      expect(founderWriteWithSession.status).toBe(201)

      const founderPasswordAsMentor = await postJson('/api/auth/login', {
        username: founderAccount.username,
        password: 'secure-password',
        role: 'mentor',
      })
      expect(founderPasswordAsMentor.status).toBe(200)
      expect((await founderPasswordAsMentor.json()).user.role).toBe('mentor')

      const mentorAccount = await registerFounder('mentor')
      const mentorRoleAssignment = await assignAccountRoles(mentorAccount, ['mentor'])
      expect(mentorRoleAssignment.status).toBe(200)
      identities['existing-mentor-credential'].email = mentorAccount.email

      const existingMentorSignIn = await postJson('/api/auth/google', {
        credential: 'existing-mentor-credential',
        role: 'mentor',
      })
      expect(existingMentorSignIn.status).toBe(200)
      const mentorFounderRoleAssignment = await assignAccountRoles(mentorAccount, ['mentor', 'founder'])
      expect(mentorFounderRoleAssignment.status).toBe(200)
      expect((await mentorFounderRoleAssignment.json()).role).toBe('mentor')

      const existingMentorAsFounder = await postJson('/api/auth/google', {
        credential: 'existing-mentor-credential',
        role: 'founder',
      })
      expect(existingMentorAsFounder.status).toBe(200)
      expect((await existingMentorAsFounder.json()).user.role).toBe('founder')

      const mentorPasswordAsFounder = await postJson('/api/auth/login', {
        username: mentorAccount.username,
        password: 'secure-password',
        role: 'founder',
      })
      expect(mentorPasswordAsFounder.status).toBe(200)
      expect((await mentorPasswordAsFounder.json()).user.role).toBe('founder')

      const differentGoogleIdentity = await postJson('/api/auth/google', {
        credential: 'different-google-credential',
        role: 'founder',
      })
      expect(differentGoogleIdentity.status).toBe(409)

      const loginWithoutAccount = await postJson('/api/auth/google', {
        credential: 'new-mentor-credential',
        role: 'mentor',
      })
      expect(loginWithoutAccount.status).toBe(404)

      const mentorRegistration = await postJson('/api/auth/google/register', {
        credential: 'new-mentor-credential',
        role: 'mentor',
      })
      expect(mentorRegistration.status).toBe(403)
      expect((await mentorRegistration.json()).message).toContain('authorized by an administrator')

      const repeatedRegistration = await postJson('/api/auth/google/register', {
        credential: 'new-mentor-credential',
        role: 'mentor',
      })
      expect(repeatedRegistration.status).toBe(403)

      const registeredMentorSignIn = await postJson('/api/auth/google', {
        credential: 'new-mentor-credential',
        role: 'mentor',
      })
      expect(registeredMentorSignIn.status).toBe(404)

      const invalidRole = await postJson('/api/auth/google', {
        credential: 'founder-credential',
        role: 'admin',
      })
      expect(invalidRole.status).toBe(400)

      const invalidPasswordRole = await postJson('/api/auth/login', {
        username: founderAccount.username,
        password: 'secure-password',
        role: 'admin',
      })
      expect(invalidPasswordRole.status).toBe(400)
    } finally {
      verifyToken.mockRestore()
      if (originalGoogleClientId === undefined) delete process.env.GOOGLE_CLIENT_ID
      else process.env.GOOGLE_CLIENT_ID = originalGoogleClientId
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    }
  })

  describe('profile photo upload API', () => {
    test('authenticates, validates, persists, and removes profile photos', async () => {
      const server = app.listen(0, '127.0.0.1')
      await new Promise((resolve, reject) => {
        server.once('listening', resolve)
        server.once('error', reject)
      })

      const baseUrl = `http://127.0.0.1:${server.address().port}`
      const suffix = Date.now()
      let token = ''
      let userId = ''

      const uploadPhoto = async (id, name, mimeType, bytes, authToken = token) => {
        const formData = new FormData()
        formData.append('photo', new Blob([bytes], { type: mimeType }), name)
        return nativeFetch(`${baseUrl}/api/users/${id}/photo`, {
          method: 'POST',
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          body: formData,
        })
      }

      try {
        const registration = await nativeFetch(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Photo Test',
            username: `photo${suffix}`,
            email: `photo-${suffix}@example.com`,
            password: 'test-password-123',
          }),
        })
        expect(registration.status).toBe(201)
        const registered = await registration.json()
        token = registered.token
        userId = registered.user.id

        const unauthenticated = await uploadPhoto(userId, 'photo.png', 'image/png', Buffer.alloc(8), '')
        expect(unauthenticated.status).toBe(401)

        const differentUser = await uploadPhoto('another-user', 'photo.png', 'image/png', Buffer.alloc(8))
        expect(differentUser.status).toBe(403)

        const images = [
          ['photo.jpg', 'image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xd9])],
          ['photo.png', 'image/png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
          ['photo.webp', 'image/webp', Buffer.from('RIFF0000WEBP')],
        ]

        for (const [name, mimeType, bytes] of images) {
          const uploaded = await uploadPhoto(userId, name, mimeType, bytes)
          expect(uploaded.status).toBe(200)
          const { user } = await uploaded.json()
          expect(user.profilePhoto).toMatch(/^\/uploads\/profile-/)

          const restoredSession = await nativeFetch(`${baseUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          expect((await restoredSession.json()).user.profilePhoto).toBe(user.profilePhoto)

          const savedImage = await nativeFetch(`${baseUrl}${user.profilePhoto}`)
          expect(savedImage.status).toBe(200)
          expect(Buffer.from(await savedImage.arrayBuffer())).toEqual(bytes)
        }

        const lastSavedPhoto = (await (await nativeFetch(`${baseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })).json()).user.profilePhoto

        const unsupported = await uploadPhoto(userId, 'photo.gif', 'image/gif', Buffer.from('GIF89a'))
        expect(unsupported.status).toBe(400)
        expect((await unsupported.json()).message).toContain('JPG, JPEG, PNG, or WEBP')

        const invalidImage = await uploadPhoto(userId, 'photo.png', 'image/png', Buffer.from('not an image'))
        expect(invalidImage.status).toBe(400)
        expect((await invalidImage.json()).message).toContain('not a valid JPG, PNG, or WEBP')

        const mismatchedMime = await uploadPhoto(
          userId,
          'photo.png',
          'image/jpeg',
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        )
        expect(mismatchedMime.status).toBe(400)

        const oversized = await uploadPhoto(
          userId,
          'large.jpg',
          'image/jpeg',
          Buffer.alloc(5 * 1024 * 1024 + 1, 0xff),
        )
        expect(oversized.status).toBe(413)
        expect((await oversized.json()).message).toContain('5 MB or smaller')

        const missingFile = await nativeFetch(`${baseUrl}/api/users/${userId}/photo`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        expect(missingFile.status).toBe(400)
        expect((await missingFile.json()).message).toContain('Choose a profile photo')

        const unchangedProfile = await nativeFetch(`${baseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        expect((await unchangedProfile.json()).user.profilePhoto).toBe(lastSavedPhoto)

        const removed = await nativeFetch(`${baseUrl}/api/users/${userId}/photo`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
        expect(removed.status).toBe(200)
        expect((await removed.json()).user.profilePhoto).toBe('')
      } finally {
        if (token && userId) {
          await nativeFetch(`${baseUrl}/api/users/${userId}/photo`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        }
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
      }
    })
  })

  test('creates a unique username when the base username is already used', async () => {
    const uniqueUsername = await createUniqueUsername('asha@example.com')

    expect(uniqueUsername).toBe('asha')
  })

  test('creates several distinct fallback course ideas and skips saved titles', () => {
    const suggestions = fallbackCourseSuggestions({
      title: 'AI for Founders',
      category: 'Technology',
      existingTitles: ['Customer Discovery and Interview Skills'],
    })

    expect(suggestions).toHaveLength(5)
    expect(new Set(suggestions.map((suggestion) => suggestion.title)).size).toBe(5)
    expect(suggestions.map((suggestion) => suggestion.title)).not.toContain('Customer Discovery and Interview Skills')
    expect(new Set(suggestions.map((suggestion) => suggestion.category)).size).toBeGreaterThan(1)
  })

  test('generates local workspace insights when the AI service is not configured', () => {
    const insights = generateLocalInsights({
      startups: [{ status: 'Active' }, { status: 'Paused' }],
      cohorts: [{ status: 'Active' }],
      mentors: [{}, {}],
      sessions: [{ status: 'Missed' }],
      milestones: [{ title: 'Launch', status: 'In progress', dueDate: '2000-01-01' }],
      resources: [{ available: 0, quantity: 2 }],
    })

    expect(insights).toContain('1 of 2 startups are active')
    expect(insights).toContain('1 incomplete milestone is past due')
    expect(insights).toContain('1 mentor session was marked missed')
    expect(insights).toContain('1 resource has limited availability')
    expect(insights).toContain('1 of 1 cohorts is active')
  })

  test('guides an empty workspace toward adding useful data', () => {
    expect(generateLocalInsights({ startups: [], cohorts: [], mentors: [], sessions: [], milestones: [], resources: [] }))
      .toContain('No startups are recorded yet')
  })

  test('returns workspace-based insights when the AI provider is unavailable', async () => {
    const records = {
      startups: [{ name: 'Acme', status: 'Active' }],
      cohorts: [],
      mentors: [],
      sessions: [],
      milestones: [],
      resources: [],
    }
    global.fetch = jest.fn().mockRejectedValue(new Error('network failure'))

    const result = await generateAIInsights(records)

    expect(result.source).toBe('local')
    expect(result.insights).toContain('1 of 1 startups are active')
    expect(result.message).toContain('temporarily unreachable')
  })

  test('does not fabricate a chat answer when no AI API key is configured', async () => {
    delete process.env.OPENAI_API_KEY
    const records = {
      startups: [{ name: 'Acme', status: 'Active' }],
      cohorts: [],
      mentors: [],
      sessions: [],
      milestones: [],
      resources: [],
    }

    await expect(generateAIChatResponse({ message: 'Summarize my startups', records }))
      .rejects.toMatchObject({
        name: 'AIServiceError',
        status: 503,
        message: expect.stringContaining('OPENAI_API_KEY'),
      })
  })

  test('gives actionable steps for validating a startup idea without the AI provider', () => {
    const reply = generateLocalAssistantResponse({ message: 'How do I validate a startup idea?' })

    expect(reply).toContain('Interview 10–15 people')
    expect(reply).toContain('Measure real commitment')
  })

  test('responds naturally to repeated-letter and Tamil greetings without the AI provider', () => {
    expect(generateLocalAssistantResponse({ message: 'hii' })).toContain('I’m doing well')
    expect(generateLocalAssistantResponse({ message: 'how are you' })).toContain('thanks for asking')
    expect(generateLocalAssistantResponse({ message: 'வணக்கம்' })).toContain('எப்படி உதவலாம்')
  })

  test('uses the configured AI provider for general chat and preserves conversation context', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key'
    global.fetch = jest.fn().mockResolvedValue(openAIResponse({
      choices: [{ message: { content: 'Here is a helpful answer.' } }],
    }))
    const records = { startups: [], cohorts: [], mentors: [], sessions: [], milestones: [], resources: [] }

    const result = await generateAIChatResponse({
      message: 'What should I do next?',
      history: [{ role: 'user', content: 'I just launched a product.' }, { role: 'assistant', content: 'Who is your customer?' }],
      records,
    })

    expect(result).toEqual({ reply: 'Here is a helpful answer.', source: 'openai' })
    const sentMessages = JSON.parse(global.fetch.mock.calls[0][1].body).messages
    expect(sentMessages.map(({ role }) => role)).toEqual(['system', 'user', 'assistant', 'user'])
    expect(sentMessages[0].content).toContain('Workspace data')
  })

  test('returns a safe actionable error when OpenAI rejects the configured key', async () => {
    process.env.OPENAI_API_KEY = 'invalid-test-key'
    global.fetch = jest.fn().mockResolvedValue(openAIResponse({ error: { message: 'secret provider details' } }, 401))
    const records = { startups: [], cohorts: [], mentors: [], sessions: [], milestones: [], resources: [] }

    await expect(generateAIChatResponse({ message: 'Hello', records }))
      .rejects.toMatchObject({
        name: 'AIServiceError',
        status: 503,
        message: expect.stringContaining('Check OPENAI_API_KEY'),
      })
  })

  test('returns a safe actionable error when OpenAI is out of quota', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key'
    global.fetch = jest.fn().mockResolvedValue(openAIResponse({ error: { message: 'quota details' } }, 429))
    const records = { startups: [], cohorts: [], mentors: [], sessions: [], milestones: [], resources: [] }

    await expect(generateAIChatResponse({ message: 'Hello', records }))
      .rejects.toMatchObject({
        name: 'AIServiceError',
        status: 503,
        message: expect.stringContaining('out of credits'),
      })
  })

  test('limits AI requests per authenticated user', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 })
    const request = { user: { _id: 'founder-1' } }
    const response = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    const next = jest.fn()

    limiter(request, response, next)
    limiter(request, response, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(response.status).toHaveBeenCalledWith(429)
    expect(response.set).toHaveBeenCalledWith('Retry-After', expect.any(String))
  })

  test('explains when local chat cannot answer an open-ended question', () => {
    const reply = generateLocalAssistantResponse({ message: 'What is the capital of Japan?' })

    expect(reply).toContain('OPENAI_API_KEY')
  })

  test('serves authenticated chat requests with OpenAI responses, history, and a fresh conversation', async () => {
    const originalFetch = nativeFetch
    const originalApiKey = process.env.OPENAI_API_KEY
    const openAICalls = []
    const replies = ['Hello from test AI.', 'Here is a pitch deck outline.', 'Hello from test AI.']
    const server = app.listen(0, '127.0.0.1')
    await new Promise((resolve, reject) => {
      server.once('listening', resolve)
      server.once('error', reject)
    })
    process.env.OPENAI_API_KEY = 'test-api-key'
    global.fetch = async (input, options) => {
      if (String(input).startsWith('https://api.openai.com/')) {
        openAICalls.push(JSON.parse(options.body))
        return openAIResponse({ choices: [{ message: { content: replies[openAICalls.length - 1] } }] })
      }
      return originalFetch(input, options)
    }

    try {
      const baseUrl = `http://127.0.0.1:${server.address().port}`
      const unauthenticated = await originalFetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      expect(unauthenticated.status).toBe(401)

      const registered = await originalFetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Chat Test',
          username: `chat${Date.now()}`,
          email: `chat-${Date.now()}@example.com`,
          password: 'test-password-123',
        }),
      })
      const { token } = await registered.json()
      const history = []
      const ask = async (message) => {
        const response = await originalFetch(`${baseUrl}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message, history }),
        })
        const result = await response.json()
        expect(response.status).toBe(200)
        expect(result.source).toBe('openai')
        history.push({ role: 'user', content: message }, { role: 'assistant', content: result.reply })
        return result.reply
      }

      await expect(ask('Hi')).resolves.toBe('Hello from test AI.')
      await expect(ask('Help me plan a pitch deck')).resolves.toBe('Here is a pitch deck outline.')
      history.length = 0
      await expect(ask('Hi')).resolves.toBe('Hello from test AI.')
      expect(openAICalls).toHaveLength(3)
      expect(openAICalls[1].messages.map(({ role }) => role)).toEqual([
        'system',
        'user',
        'assistant',
        'user',
      ])
      expect(openAICalls[1].messages.at(-1).content).toBe('Help me plan a pitch deck')
      expect(openAICalls[2].messages.map(({ role }) => role)).toEqual(['system', 'user'])
    } finally {
      global.fetch = originalFetch
      if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY
      else process.env.OPENAI_API_KEY = originalApiKey
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    }
  })
})