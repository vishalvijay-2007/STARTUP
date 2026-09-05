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
