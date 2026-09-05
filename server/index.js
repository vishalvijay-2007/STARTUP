import 'dotenv/config'
import { promisify } from 'node:util'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'

const app = express()
const port = process.env.PORT || 5000
const courses = []
const users = []
const sessions = new Map()
const scrypt = promisify(scryptCallback)

app.use(cors())
app.use(express.json())

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    hours: { type: Number, required: true, min: 1 },
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

const requireAuth = async (request, response, next) => {
  const token = request.headers.authorization?.replace('Bearer ', '')
  const userId = token ? sessions.get(token) : null

  if (!userId) return response.status(401).json({ message: 'Authentication required.' })

  try {
    request.user = isDatabaseConnected()
      ? await User.findById(userId).lean()
      : users.find((user) => user._id === userId)

    if (!request.user) return response.status(401).json({ message: 'Session is invalid.' })
    next()
  } catch (error) {
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
    const token = randomBytes(32).toString('hex')
    sessions.set(token, user._id)
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

    const token = randomBytes(32).toString('hex')
    sessions.set(token, user._id)
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

app.post('/api/courses', requireAuth, async (request, response) => {
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
      ? await Course.create({ title: courseTitle, category: courseCategory, description: courseDescription, hours: courseHours })
      : { _id: `local-${Date.now()}`, title: courseTitle, category: courseCategory, description: courseDescription, hours: courseHours, students: [] }

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

app.put('/api/courses/:id', requireAuth, async (request, response) => {
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