# Startup Management Platform

## Problem Statement
Startup incubators need a simple way to organize learning content and track which founders are enrolled in each course. A spreadsheet or disconnected form makes course updates, user access, and enrollment consistency difficult to manage.

## Proposed Solution
Startup Management Platform is a full-stack course and enrollment application. Authenticated users can create, edit, delete, and browse courses, attach course material, enroll in courses, and use an optional AI-assisted course suggestion flow.

## Technology Stack
- Frontend: React 19, Vite, CSS
- Backend: Node.js, Express 5
- Data: MongoDB with Mongoose, plus an in-memory fallback for local development
- Authentication: JWT, scrypt password hashing, optional Google Identity Services
- Uploads: Multer with a 10 MB limit and persistent `server/uploads` storage
- Optional AI: OpenAI-compatible chat completions API
- Quality and delivery: Jest, ESLint, Docker, GitHub Actions, GitHub Pages

## Architecture Overview
The React client calls the Express REST API using `VITE_API_URL`. The API validates requests, authenticates users with a bearer JWT, and reads/writes either MongoDB or in-memory collections when `MONGODB_URI` is not configured. Courses and users have a many-to-many relationship: user enrollment IDs and course student IDs are updated together. The Docker image builds the client and serves the resulting static files and API from one Express process.

## Key Features
- Username/password registration, login, session lookup, and logout
- Optional Google sign-in with server-side ID-token verification
- Authenticated course list, detail, create, update, and delete operations
- Course material uploads up to 10 MB
- User enrollment, unenrollment, and enrolled-course listing
- AI course autocomplete with a deterministic local fallback when no API key is configured
- MongoDB persistence or zero-setup in-memory development mode
- Health endpoint reporting API and database mode

## Installation Instructions
Requirements: Node.js 22 or later and npm. MongoDB and Docker are optional.

```bash
git clone https://github.com/vishalvijay-2007/STARTUP.git
cd STARTUP
npm install
cd client
npm install
cd ..
```

## Environment Setup
Copy the root template before starting the API:

```powershell
Copy-Item .env.example .env
```

Important variables are documented in [.env.example](.env.example):

- `PORT`: API port, default `5000`.
- `JWT_SECRET`: long random secret used to sign sessions.
- `MONGODB_URI`: optional MongoDB connection string. Without it, data is stored in memory and resets on restart.
- `GOOGLE_CLIENT_ID`: optional server-side Google web client ID.
- `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_API_URL`: optional AI configuration.

For the browser, create `client/.env` when needed:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

Never commit `.env` files or real credentials. Google OAuth also requires the frontend origin to be listed in Google Cloud Console.

## Running the Project
Run the backend from the repository root:

```bash
npm run server
```

Run the Vite frontend in a second terminal:

```bash
cd client
npm run dev
```

Open `http://localhost:5173`. Check `http://localhost:5000/api/health` to verify the API. Run the automated checks with:

```bash
npm test
cd client
npm run lint
npm run build
```

## API Surface
All course and enrollment routes require `Authorization: Bearer <token>` unless noted.

- `GET /api/health` - API and database mode check
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google` - authentication
- `GET /api/auth/me` - current authenticated user
- `GET /api/courses`, `GET /api/courses/:id` - course reads
- `POST /api/courses`, `PUT /api/courses/:id`, `DELETE /api/courses/:id` - course management
- `POST /api/ai/course-suggestions` - optional or fallback course suggestion
- `POST /api/users`, `PUT /api/users/:id` - user management
- `GET /api/users/:id/courses` - enrolled courses
- `POST /api/users/:userId/courses/:courseId`, `DELETE /api/users/:userId/courses/:courseId` - enrollment changes

Course create and update requests use `multipart/form-data` with `title`, `category`, `description`, `hours`, and an optional `file` field. Bruno examples are available in [bruno/startup-api](bruno/startup-api).

## Run with Docker
The image builds the frontend and runs the complete application on port 5000:

```bash
docker build -t startup-management-platform .
docker run --rm -p 5000:5000 --env-file .env -v startup-uploads:/app/server/uploads startup-management-platform
```

For a separate frontend deployment, pass the public API URL at build time:

```bash
docker build --build-arg VITE_API_URL=https://your-api.example.com/api -t startup-management-platform .
```

## Deployment Links
- Frontend: GitHub Pages workflow is configured in [.github/workflows/deploy-frontend.yml](.github/workflows/deploy-frontend.yml), but no public deployment is currently verified. Enable Pages with GitHub Actions on `main`, then add the generated URL here.
- Repository: https://github.com/vishalvijay-2007/STARTUP
- Backend health check: No public backend is currently configured. Deploy the Docker image or Node server with `MONGODB_URI` and `JWT_SECRET`, then verify `/api/health` and add the URL here.
- Pull request: Open `feature/final-project-submission` into `main` after pushing the final commit.
- Walkthrough video: Upload the 5-8 minute recording to Google Drive, set access to "Anyone with the link", verify it in an incognito window, and add the URL here.

The GitHub Pages workflow builds the frontend from `main`. GitHub Pages cannot host the Express API, so authenticated workflows require a separately deployed backend and a matching `VITE_API_URL` build/deployment variable. The Docker deployment serves both client and API from one process.

## Folder Structure
```text
server/             Express API, authentication, uploads, and persistence
models/             Mongoose schemas for users and courses
client/src/         React application and styling
bruno/startup-api/  Bruno request collection and local environment
.github/workflows/  Frontend deployment workflow
Dockerfile          Multi-stage full-stack production image
```

## Future Improvements
- Use object storage for uploaded material instead of local disk.
- Add role-based authorization for administrative course operations.
- Add integration tests for API routes and MongoDB-backed behavior.
- Add pagination, search, and course progress tracking.
- Add a production backend deployment with managed MongoDB and monitoring.

## Contributors
Vishal Vijay

## Submission Checklist
- [ ] Verify frontend, backend health, database mode, authentication, uploads, and enrollment workflows on the deployed environment.
- [ ] Record and upload the technical walkthrough; set Google Drive access to "Anyone with the link can view".
- [ ] Create `feature/final-project-submission`, commit the final changes, push it, and open a public PR targeting `main`.
