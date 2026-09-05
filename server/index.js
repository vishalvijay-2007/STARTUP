import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'

const app = express()
const port = process.env.PORT || 5000
const courses = []

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

const isDatabaseConnected = () => mongoose.connection.readyState === 1

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

app.post('/api/courses', async (request, response) => {
  const { title, category, description, hours } = request.body

  if (!title || !category || !description || !Number(hours)) {
    return response.status(400).json({ message: 'All course fields are required.' })
  }

  try {
    const course = isDatabaseConnected()
      ? await Course.create({ title, category, description, hours: Number(hours) })
      : { _id: `local-${Date.now()}`, title, category, description, hours: Number(hours) }

    if (!isDatabaseConnected()) courses.unshift(course)
    response.status(201).json(course)
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