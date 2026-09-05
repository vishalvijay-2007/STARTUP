import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'

const app = express()
const port = process.env.PORT || 5000
const courses = []
const users = []

app.use(cors())
app.use(express.json())

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    hours: { type: Number, required: true, min: 1 },
  },
  { timestamps: true },
)

const Course = mongoose.model('Course', courseSchema)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
  },
  { timestamps: true },
)

const User = mongoose.model('User', userSchema)

const isDatabaseConnected = () => mongoose.connection.readyState === 1

const isValidResourceId = (id) => !isDatabaseConnected() || mongoose.isValidObjectId(id)

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, database: isDatabaseConnected() ? 'mongodb' : 'memory' })
})

app.get('/api/courses', async (_request, response) => {
  try {
    const result = isDatabaseConnected()
      ? await Course.find().sort({ createdAt: -1 }).lean()
      : courses
    response.json(result)
  } catch (error) {
    response.status(500).json({ message: error.message })
  }
})

app.get('/api/courses/:id', async (request, response) => {
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

app.post('/api/courses', async (request, response) => {
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

  try {
    const course = isDatabaseConnected()
      ? await Course.create({
          title: courseTitle,
          category: courseCategory,
          description: courseDescription,
          hours: courseHours,
        })
      : {
          _id: `local-${Date.now()}`,
          title: courseTitle,
          category: courseCategory,
          description: courseDescription,
          hours: courseHours,
        }

    if (!isDatabaseConnected()) courses.unshift(course)
    response.status(201).json(course)
  } catch (error) {
    response.status(500).json({ message: error.message })
  }
})

app.post('/api/users', async (request, response) => {
  const { name, email, role } = request.body
  const userName = typeof name === 'string' ? name.trim() : ''
  const userEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const userRole = role || 'student'

  if (!userName || !/^\S+@\S+\.\S+$/.test(userEmail) || !['student', 'admin'].includes(userRole)) {
    return response.status(400).json({
      message: 'Name, a valid email, and a supported role are required.',
    })
  }

  try {
    const existingUser = isDatabaseConnected()
      ? await User.findOne({ email: userEmail }).lean()
      : users.find((item) => item.email === userEmail)

    if (existingUser) {
      return response.status(409).json({ message: 'A user with this email already exists.' })
    }

    const user = isDatabaseConnected()
      ? await User.create({ name: userName, email: userEmail, role: userRole })
      : { _id: `local-${Date.now()}`, name: userName, email: userEmail, role: userRole }

    if (!isDatabaseConnected()) users.unshift(user)
    response.status(201).json(user)
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

app.put('/api/courses/:id', async (request, response) => {
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

app.put('/api/users/:id', async (request, response) => {
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

app.delete('/api/courses/:id', async (request, response) => {
  if (!isValidResourceId(request.params.id)) {
    return response.status(404).json({ message: 'Course not found.' })
  }

  try {
    if (isDatabaseConnected()) {
      const course = await Course.findByIdAndDelete(request.params.id).lean()

      if (!course) {
        return response.status(404).json({ message: 'Course not found.' })
      }

      return response.json({ message: 'Course deleted successfully.' })
    }

    const courseIndex = courses.findIndex((item) => item._id === request.params.id)
    if (courseIndex === -1) {
      return response.status(404).json({ message: 'Course not found.' })
    }

    courses.splice(courseIndex, 1)
    response.json({ message: 'Course deleted successfully.' })
  } catch (error) {
    response.status(500).json({ message: error.message })
  }
})