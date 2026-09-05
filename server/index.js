import 'dotenv/config'
import { existsSync, mkdirSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { promisify } from 'node:util'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import cors from 'cors'
import express from 'express'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import multer from 'multer'

const app = express()
const port = process.env.PORT || 5000
const courses = []
const users = []
const scrypt = promisify(scryptCallback)
const jwtSecret = process.env.JWT_SECRET || 'local-development-jwt-secret'
const googleClientId = process.env.GOOGLE_CLIENT_ID || ''
const googleClient = new OAuth2Client(googleClientId)
const uploadDirectory = join(process.cwd(), 'server', 'uploads')
const clientBuildDirectory = join(process.cwd(), 'client', 'dist')

if (!existsSync(uploadDirectory)) mkdirSync(uploadDirectory, { recursive: true })

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_request, file, callback) => {
      const safeName = basename(file.originalname, extname(file.originalname)).replace(/[^a-z0-9-_]/gi, '-').slice(0, 60)
      callback(null, `${Date.now()}-${safeName || 'course-file'}${extname(file.originalname).toLowerCase()}`)
    },
  }),
})

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadDirectory))

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    hours: { type: Number, required: true, min: 1 },
    fileName: { type: String, trim: true },
    fileUrl: { type: String, trim: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
)

const Course = mongoose.model('Course', courseSchema)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    googleId: { type: String, unique: true, sparse: true, select: false },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  },
  { timestamps: true },
)

const User = mongoose.model('User', userSchema)

const isDatabaseConnected = () => mongoose.connection.readyState === 1

const isValidResourceId = (id) => !isDatabaseConnected() || mongoose.isValidObjectId(id)

const normalizeUsername = (username) =>
  typeof username === 'string' ? username.trim().toLowerCase() : ''

const createPasswordHash = async (password) => {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

const verifyPassword = async (password, storedHash) => {
  const [salt, key] = storedHash.split(':')
  if (!salt || !key) return false

  const derivedKey = await scrypt(password, salt, 64)
  const storedKey = Buffer.from(key, 'hex')
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey)
}

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
})

const createAuthToken = (userId) => jwt.sign({}, jwtSecret, { subject: String(userId), expiresIn: '1h' })

const createUniqueUsername = async (email, excludeId = null) => {
  const baseUsername = normalizeUsername(email.split('@')[0]).replace(/[^a-z0-9_]/g, '').slice(0, 16) || 'googleuser'
  let username = baseUsername
  let suffix = 1

  const usernameExists = async (candidate) => {
    if (isDatabaseConnected()) {
      return Boolean(await User.findOne({ username: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).lean())
    }
    return users.some((user) => user.username === candidate && user._id !== excludeId)
  }

  while (await usernameExists(username)) {
    username = `${baseUsername}${suffix}`.slice(0, 20)
    suffix += 1
  }

  return username
}

const requireAuth = async (request, response, next) => {
  const authorization = request.headers.authorization || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''

  if (!token) return response.status(401).json({ message: 'Authentication required.' })

  try {
    const { sub: userId } = jwt.verify(token, jwtSecret)
    request.user = isDatabaseConnected()
      ? await User.findById(userId).lean()
      : users.find((user) => user._id === userId)

    if (!request.user) return response.status(401).json({ message: 'Session is invalid.' })
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return response.status(401).json({ message: 'Session is invalid or expired.' })
    }

    response.status(500).json({ message: error.message })
  }
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, database: isDatabaseConnected() ? 'mongodb' : 'memory' })
})

app.post('/api/auth/register', async (request, response) => {
  const { name, username, email, password } = request.body
  const userName = typeof name === 'string' ? name.trim() : ''
  const userUsername = normalizeUsername(username)
  const userEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  if (
    !userName ||
    !/^[a-z0-9_]{3,20}$/.test(userUsername) ||
    !/^\S+@\S+\.\S+$/.test(userEmail) ||
    typeof password !== 'string' ||
    password.length < 8
  ) {
    return response.status(400).json({
      message: 'Name, valid username, email, and a password of at least 8 characters are required.',
    })
  }

  try {
    const existingUser = isDatabaseConnected()
      ? await User.findOne({ $or: [{ username: userUsername }, { email: userEmail }] }).lean()
      : users.find((item) => item.username === userUsername || item.email === userEmail)

    if (existingUser) return response.status(409).json({ message: 'Username or email is already in use.' })

    const passwordHash = await createPasswordHash(password)
    const user = isDatabaseConnected()
      ? await User.create({
          name: userName,
          username: userUsername,
          passwordHash,
          email: userEmail,
          role: 'student',
        })
      : {
          _id: `local-${Date.now()}`,
          name: userName,
          username: userUsername,
          passwordHash,
          email: userEmail,
          role: 'student',
          enrolledCourses: [],
        }

    if (!isDatabaseConnected()) users.unshift(user)
    const token = createAuthToken(user._id)
    response.status(201).json({ token, user: serializeUser(user) })
  } catch (error) {
    response.status(500).json({ message: error.message })
  }
})

app.post('/api/auth/login', async (request, response) => {
  const userUsername = normalizeUsername(request.body.username)
  const password = typeof request.body.password === 'string' ? request.body.password : ''

  if (!userUsername || !password) {
    return response.status(400).json({ message: 'Username and password are required.' })
  }

  try {
    const user = isDatabaseConnected()
      ? await User.findOne({ username: userUsername }).select('+passwordHash').lean()
      : users.find((item) => item.username === userUsername)

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return response.status(401).json({ message: 'Invalid username or password.' })
    }

    const token = createAuthToken(user._id)
    response.json({ token, user: serializeUser(user) })
  } catch (error) {
    response.status(500).json({ message: error.message })
  }
})

app.get('/api/auth/me', requireAuth, (request, response) => {
  response.json({ user: serializeUser(request.user) })
})

app.get('/api/courses', requireAuth, async (_request, response) => {
  try {
    const result = isDatabaseConnected()
      ? await Course.find().sort({ createdAt: -1 }).lean()
      : courses
    response.json(result)
  } catch (error) {
    response.status(500).json({ message: error.message })
  }
})

app.get('/api/courses/:id', requireAuth, async (request, response) => {
  try {
    const course = isDatabaseConnected()
      ? await Course.findById(request.params.id).lean()
      : courses.find((item) => item._id === request.params.id)

    if (!course) {
      return response.status(404).json({ message: 'Course not found.' })
    }

    response.json(course)
  } catch (error) {
    response.status(500).json({ message: error.message })
  }
})

app.post('/api/courses', requireAuth, upload.single('file'), async (request, response) => {
  const { title, category, description, hours } = request.body
  const courseTitle = typeof title === 'string' ? title.trim() : ''
  const courseCategory = typeof category === 'string' ? category.trim() : ''
  const courseDescription = typeof description === 'string' ? description.trim() : ''
  const courseHours = Number(hours)

  if (!courseTitle || !courseCategory || !courseDescription || !Number.isInteger(courseHours) || courseHours < 1) {
    return response.status(400).json({
      message: 'Title, category, description, and positive whole-number hours are required.',
    })
  }

  try {
    const course = isDatabaseConnected()
      ? await Course.create({
          title: courseTitle,
          category: courseCategory,
          description: courseDescription,
          hours: courseHours,
          ...(request.file ? { fileName: request.file.originalname, fileUrl: `/uploads/${request.file.filename}` } : {}),
        })
      : {
          _id: `local-${Date.now()}`,
          title: courseTitle,
          category: courseCategory,
          description: courseDescription,
          hours: courseHours,
          ...(request.file ? { fileName: request.file.originalname, fileUrl: `/uploads/${request.file.filename}` } : {}),
          students: [],
        }

    if (!isDatabaseConnected()) courses.unshift(course)
    response.status(201).json(course)
  } catch (error) {
    response.status(500).json({ message: error.message })
  }
})

app.post('/api/users', requireAuth, async (request, response) => {
  response.status(410).json({
    message: 'Create users through POST /api/auth/register with a username and password.',
  })
})

app.get('/api/users/:id/courses', requireAuth, async (request, response) => {
  if (!isValidResourceId(request.params.id)) {
    return response.status(404).json({ message: 'User not found.' })
  }

  try {
    if (isDatabaseConnected()) {
      const user = await User.findById(request.params.id).populate('enrolledCourses').lean()

      if (!user) {
        return response.status(404).json({ message: 'User not found.' })
      }

      return response.json(user.enrolledCourses)
    }

    const user = users.find((item) => item._id === request.params.id)
    if (!user) {
      return response.status(404).json({ message: 'User not found.' })
    }

    response.json(
      user.enrolledCourses
        .map((courseId) => courses.find((course) => course._id === courseId))
        .filter(Boolean),
    )
  } catch (error) {
    response.status(500).json({ message: error.message })
  }
})

app.post('/api/users/:userId/courses/:courseId', requireAuth, async (request, response) => {
  const { userId, courseId } = request.params

  if (!isValidResourceId(userId) || !isValidResourceId(courseId)) {
    return response.status(404).json({ message: 'User or course not found.' })
  }

  try {
    if (isDatabaseConnected()) {
      const [user, course] = await Promise.all([
        User.findById(userId).lean(),
        Course.findById(courseId).lean(),
      ])

      if (!user || !course) {
        return response.status(404).json({ message: 'User or course not found.' })
      }

      await Promise.all([
        User.updateOne({ _id: userId }, { $addToSet: { enrolledCourses: courseId } }),
        Course.updateOne({ _id: courseId }, { $addToSet: { students: userId } }),
      ])
      return response.status(201).json({ message: 'User enrolled in course successfully.' })
    }

    const user = users.find((item) => item._id === userId)
    const course = courses.find((item) => item._id === courseId)
    if (!user || !course) {
      return response.status(404).json({ message: 'User or course not found.' })
    }

    if (!user.enrolledCourses.includes(courseId)) user.enrolledCourses.push(courseId)
    if (!course.students.includes(userId)) course.students.push(userId)
    response.status(201).json({ message: 'User enrolled in course successfully.' })
  } catch (error) {
    response.status(500).json({ message: error.message })
  }
})

app.delete('/api/users/:userId/courses/:courseId', requireAuth, async (request, response) => {
  const { userId, courseId } = request.params

  if (!isValidResourceId(userId) || !isValidResourceId(courseId)) {
    return response.status(404).json({ message: 'User or course not found.' })
  }

  try {
    if (isDatabaseConnected()) {
      const [user, course] = await Promise.all([
        User.findById(userId).lean(),
        Course.findById(courseId).lean(),
      ])

      if (!user || !course) {
        return response.status(404).json({ message: 'User or course not found.' })
      }

      await Promise.all([
        User.updateOne({ _id: userId }, { $pull: { enrolledCourses: courseId } }),
        Course.updateOne({ _id: courseId }, { $pull: { students: userId } }),
      ])
      return response.json({ message: 'User unenrolled from course successfully.' })
    }

    const user = users.find((item) => item._id === userId)
    const course = courses.find((item) => item._id === courseId)
    if (!user || !course) {
      return response.status(404).json({ message: 'User or course not found.' })
    }

    user.enrolledCourses = user.enrolledCourses.filter((id) => id !== courseId)
    course.students = course.students.filter((id) => id !== userId)
    response.json({ message: 'User unenrolled from course successfully.' })
  } catch (error) {
    response.status(500).json({ message: error.message })
  }
})

app.put('/api/courses/:id', requireAuth, upload.single('file'), async (request, response) => {
  const { title, category, description, hours } = request.body
  const courseTitle = typeof title === 'string' ? title.trim() : ''
  const courseCategory = typeof category === 'string' ? category.trim() : ''
  const courseDescription = typeof description === 'string' ? description.trim() : ''
  const courseHours = Number(hours)

  if (
    !courseTitle ||
    !courseCategory ||
    !courseDescription ||
    !Number.isInteger(courseHours) ||
    courseHours < 1
  ) {
    return response.status(400).json({
      message: 'Title, category, description, and positive whole-number hours are required.',
    })
  }

  if (!isValidResourceId(request.params.id)) {
    return response.status(404).json({ message: 'Course not found.' })
  }

  try {
    if (isDatabaseConnected()) {
      const course = await Course.findByIdAndUpdate(
        request.params.id,
        {
          title: courseTitle,
          category: courseCategory,
          description: courseDescription,
          hours: courseHours,
          ...(request.file ? { fileName: request.file.originalname, fileUrl: `/uploads/${request.file.filename}` } : {}),
        },
        { new: true, runValidators: true },
      ).lean()

      if (!course) {
        return response.status(404).json({ message: 'Course not found.' })
      }

      return response.json(course)
    }

    const courseIndex = courses.findIndex((item) => item._id === request.params.id)
    if (courseIndex === -1) {
      return response.status(404).json({ message: 'Course not found.' })
    }

    courses[courseIndex] = {
      ...courses[courseIndex],
      title: courseTitle,
      category: courseCategory,
      description: courseDescription,
      hours: courseHours,
      ...(request.file ? { fileName: request.file.originalname, fileUrl: `/uploads/${request.file.filename}` } : {}),
    }

    response.json(courses[courseIndex])
  } catch (error) {
    response.status(500).json({ message: error.message })
  }
})

app.put('/api/users/:id', requireAuth, async (request, response) => {
  const { name, email, role } = request.body
  const userName = typeof name === 'string' ? name.trim() : ''
  const userEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const userRole = role || 'student'

  if (!userName || !/^\S+@\S+\.\S+$/.test(userEmail) || !['student', 'admin'].includes(userRole)) {
    return response.status(400).json({
      message: 'Name, a valid email, and a supported role are required.',
    })
  }

  if (!isValidResourceId(request.params.id)) {
    return response.status(404).json({ message: 'User not found.' })
  }

  try {
    if (isDatabaseConnected()) {
      const existingUser = await User.findOne({
        email: userEmail,
        _id: { $ne: request.params.id },
      }).lean()

      if (existingUser) {
        return response.status(409).json({ message: 'A user with this email already exists.' })
      }

      const user = await User.findByIdAndUpdate(
        request.params.id,
        { name: userName, email: userEmail, role: userRole },
        { new: true, runValidators: true },
      ).lean()

      if (!user) {
        return response.status(404).json({ message: 'User not found.' })
      }

      return response.json(user)
    }

    const userIndex = users.findIndex((item) => item._id === request.params.id)
    if (userIndex === -1) {
      return response.status(404).json({ message: 'User not found.' })
    }

    const duplicateUser = users.find(
      (item) => item.email === userEmail && item._id !== request.params.id,
    )
    if (duplicateUser) {
      return response.status(409).json({ message: 'A user with this email already exists.' })
    }

    users[userIndex] = {
      ...users[userIndex],
      name: userName,
      email: userEmail,
      role: userRole,
    }

    response.json(users[userIndex])
  } catch (error) {
    response.status(500).json({ message: error.message })
  }
})

app.delete('/api/courses/:id', requireAuth, async (request, response) => {
  if (!isValidResourceId(request.params.id)) {
    return response.status(404).json({ message: 'Course not found.' })
  }

  try {
    if (isDatabaseConnected()) {
      const course = await Course.findByIdAndDelete(request.params.id).lean()

      if (!course) {
        return response.status(404).json({ message: 'Course not found.' })
      }

      await User.updateMany({}, { $pull: { enrolledCourses: request.params.id } })
      return response.json({ message: 'Course deleted successfully.' })
    }

    const courseIndex = courses.findIndex((item) => item._id === request.params.id)
    if (courseIndex === -1) {
      return response.status(404).json({ message: 'Course not found.' })
    }

    courses.splice(courseIndex, 1)
    users.forEach((user) => {
      user.enrolledCourses = user.enrolledCourses.filter((id) => id !== request.params.id)
    })
    response.json({ message: 'Course deleted successfully.' })
  } catch (error) {
    response.status(500).json({ message: error.message })
  }
})

app.post('/api/auth/google', async (request, response) => {
  const credential = typeof request.body.credential === 'string' ? request.body.credential : ''

  if (!googleClientId) {
    return response.status(503).json({ message: 'Google authentication is not configured on the server.' })
  }

  if (!credential) {
    return response.status(400).json({ message: 'Google credential is required.' })
  }

  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: googleClientId })
    const payload = ticket.getPayload()
    const googleId = payload?.sub
    const email = payload?.email?.trim().toLowerCase()
    const name = payload?.name?.trim() || email?.split('@')[0]

    if (!googleId || !email || payload.email_verified !== true) {
      return response.status(401).json({ message: 'Google account could not be verified.' })
    }

    let user = isDatabaseConnected()
      ? await User.findOne({ $or: [{ googleId }, { email }] }).select('+passwordHash +googleId')
      : users.find((item) => item.googleId === googleId || item.email === email)

    if (user) {
      if (isDatabaseConnected() && !user.googleId) {
        user.googleId = googleId
        await user.save()
      } else if (!isDatabaseConnected()) {
        user.googleId = googleId
      }
    } else {
      const username = await createUniqueUsername(email)
      const passwordHash = await createPasswordHash(randomBytes(32).toString('hex'))
      user = isDatabaseConnected()
        ? await User.create({ name, username, email, googleId, passwordHash, role: 'student' })
        : { _id: `local-${Date.now()}`, name, username, email, googleId, passwordHash, role: 'student', enrolledCourses: [] }

      if (!isDatabaseConnected()) users.unshift(user)
    }

    const token = createAuthToken(user._id)
    response.json({ token, user: serializeUser(user) })
  } catch (error) {
    response.status(401).json({ message: 'Google authentication failed.' })
  }
})

if (existsSync(clientBuildDirectory)) {
  app.use(express.static(clientBuildDirectory))
  app.get(/^(?!\/api(?:\/|$)|\/uploads(?:\/|$)).*/, (_request, response) => {
    response.sendFile(join(clientBuildDirectory, 'index.html'))
  })
}

export {
  app,
  createPasswordHash,
  createUniqueUsername,
  isValidResourceId,
  normalizeUsername,
  requireAuth,
  serializeUser,
  verifyPassword,
}

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, async () => {
    if (process.env.MONGODB_URI) {
      try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('MongoDB connected')
      } catch (error) {
        console.warn(`MongoDB unavailable, using memory storage: ${error.message}`)
      }
    }
    console.log(`API running at http://localhost:${port}`)
  })
}