import {
  createPasswordHash,
  createUniqueUsername,
  normalizeUsername,
  serializeUser,
  verifyPassword,
} from './index.js'

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
    })
  })

  test('creates a unique username when the base username is already used', async () => {
    const uniqueUsername = await createUniqueUsername('asha@example.com')

    expect(uniqueUsername).toBe('asha')
  })
})