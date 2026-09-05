# Startup Management Platform

## Project Description
This project helps startup incubators manage courses, mentors, and learning resources for founders and teams.

## Features
- Course creation form
- Course listing from database/api
- Startup learning portfolio tracking
- Dashboard overview
- API-backed data storage support

## Tech Stack
- React
- Node.js
- Express
- MongoDB

## Database Read/Write Flow
The backend exposes the following API endpoints:

- GET /api/health
- GET /api/courses
- POST /api/courses
- PUT /api/courses/:id
- POST /api/users
- PUT /api/users/:id
- GET /api/users/:id/courses
- POST /api/users/:userId/courses/:courseId
- DELETE /api/users/:userId/courses/:courseId

Users and courses have a many-to-many relationship. A user's `enrolledCourses`
references courses, while each course's `students` references enrolled users.
The enrollment endpoints keep both sides synchronized and course deletion removes
the deleted course from every user's enrollment list.

If a MongoDB connection string is set in an environment variable, the app stores records in MongoDB. Otherwise it falls back to in-memory storage so the project can still run locally without a database.

Course create and update requests use `multipart/form-data` and accept an optional `file` field. Files up to 10MB are stored locally in `server/uploads` and are returned as `fileUrl` and `fileName` fields.

## Run Locally

1. Install dependencies at the root:
   npm install

2. Start the backend:
   npm run server

3. In a second terminal, start the frontend:
   cd client
   npm install
   npm run dev

4. Open the React app in the browser and use the course form to create records.

## Deployment and Submission Links

- Deployed frontend: https://vishalvijay-2007.github.io/STARTUP/
- GitHub repository: https://github.com/vishalvijay-2007/STARTUP
- GitHub pull request: Add the pull request URL here after opening the PR from the feature branch.
- Video explanation: Add the public video URL here after recording and uploading the explanation.

The frontend is deployed automatically to GitHub Pages from the `main` branch after the frontend deployment workflow completes. The deployed UI needs a publicly hosted backend URL for authentication and course API actions; set `VITE_API_URL` in the deployment environment when that backend is available.

## Google Sign-In Setup

1. Open Google Cloud Console and create or select a project.
2. Go to **APIs & Services > OAuth consent screen**, configure the app, and add your Google account as a test user if the app is in testing mode.
3. Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
4. Choose **Web application** and add `http://localhost:5173` to **Authorized JavaScript origins**.
5. Copy the web client ID into both `.env` at the project root as `GOOGLE_CLIENT_ID` and `client/.env` as `VITE_GOOGLE_CLIENT_ID`.
6. Start the backend with `npm run server` and the frontend with `cd client && npm run dev`.
7. Open `http://localhost:5173` and use the Google button on the sign-in screen.

The backend verifies the Google ID token before creating or linking a local user and issuing the same JWT used by the existing course API. Never commit either `.env` file; `.env.example` files are provided as templates.

## API Example

POST http://localhost:5000/api/courses
{
  "title": "AI for Founders",
  "category": "Technology",
  "description": "Learn how to build AI products for startup teams.",
  "hours": 8
}

POST http://localhost:5000/api/users
{
   "name": "Vishal Vijay",
   "email": "vishal@example.com",
   "role": "student"
}

PUT http://localhost:5000/api/courses/local-COURSE_ID
{
   "title": "AI for Startup Founders",
   "category": "Technology",
   "description": "Updated training content for startup teams.",
   "hours": 10
}

PUT http://localhost:5000/api/users/local-USER_ID
{
   "name": "Vishal Vijay",
   "email": "vishal@example.com",
   "role": "admin"
}

POST http://localhost:5000/api/users/local-USER_ID/courses/local-COURSE_ID

GET http://localhost:5000/api/users/local-USER_ID/courses

DELETE http://localhost:5000/api/users/local-USER_ID/courses/local-COURSE_ID

## Project Completed
