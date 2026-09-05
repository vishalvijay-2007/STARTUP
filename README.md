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

## Project Completed
