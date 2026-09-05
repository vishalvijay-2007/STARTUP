import { useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const initialForm = {
  title: '',
  category: '',
  description: '',
  hours: '',
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [courses, setCourses] = useState([])
  const [status, setStatus] = useState('Loading courses...')
  const [loading, setLoading] = useState(false)

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses`)
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
    fetchCourses()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          hours: Number(form.hours),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Course could not be saved.')
      }

      setForm(initialForm)
      setStatus(`Course created: ${result.title}`)
      fetchCourses()
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Startup Management</p>
          <h1>Course Portal</h1>
        </div>
        <div className="status-badge">API Connected</div>
      </header>

      <main className="content-grid">
        <section className="panel form-panel">
          <h2>Add a new course</h2>
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

            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Course'}
            </button>
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
                  <p className="meta">{course.category} • {course.hours} hours</p>
                </div>
                <p>{course.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}

export default App