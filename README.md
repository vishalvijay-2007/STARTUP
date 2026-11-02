# Startup Management Platform

## Problem Statement
Startup incubators need one place to manage startup portfolios, cohorts, mentor activity, learning, and resource usage. Disconnected spreadsheets make progress and engagement difficult to measure.

## Proposed Solution
Startup Management Platform extends its original course portal with an authenticated incubation workspace. Founders can maintain startup and cohort records, mentors, sessions, weighted milestones, resource availability, and course enrollment. Dashboard metrics and charts are calculated from the signed-in user's records (or all records for an administrator).

## Technology Stack
- Frontend: React 19, Vite, CSS
- Backend: Node.js, Express 5
- Data: MongoDB with Mongoose, plus an in-memory fallback for local development
- Authentication: JWT, scrypt password hashing, optional Google Identity Services
- Uploads: course materials up to 10 MB and profile photos up to 5 MB in persistent `server/uploads` storage
- Optional AI: OpenAI-compatible chat completions API
- Quality and delivery: Jest, ESLint, Docker, GitHub Actions, GitHub Pages

## Architecture Overview
The React client calls the Express REST API using `VITE_API_URL`. The API validates requests, authenticates users with a bearer JWT, and reads/writes either MongoDB or in-memory collections when `MONGODB_URI` is not configured. Courses and users have a many-to-many relationship: user enrollment IDs and course student IDs are updated together. The Docker image builds the client and serves the resulting static files and API from one Express process.

## Key Features
- Username/password registration, login, session lookup, and logout
- Optional Google sign-in and registration with server-side ID-token verification and stable Google account linking
- New accounts start with one authorized role; administrators can assign both Founder and Mentor roles, and Google sign-in never grants roles
- The selected Founder or Mentor role is signed into the JWT, revalidated on protected requests, and opens the corresponding dashboard
- Owner-scoped startup, cohort, mentor, session, milestone, and resource APIs with backend role checks
- Weighted milestone progress, portfolio metrics, cohort/stage/session summaries, and monthly startup growth
- Session, milestone, and resource activity notifications with unread/read state
- Profile editing and JPG, JPEG, PNG, or WEBP photo updates shared across profile avatars; responsive collapsible navigation and light-theme workspace pages
- Authenticated course list, detail, create, update, and delete operations
- Course material uploads up to 10 MB for supported document formats
- User enrollment, unenrollment, and enrolled-course listing
- Workspace-grounded AI insights with a local fallback when the AI provider is not configured or available
- Authenticated conversational AI chat with workspace context, conversation history, and local workspace answers
- Five varied AI course suggestions, with built-in ideas and setup guidance when the AI provider is unavailable
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
- `OPENAI_API_KEY`: required for genuine AI chat and AI-generated insights. Set it only in the server's `.env` file or backend hosting environment—never in `client/.env`, browser storage, source code, or chat—and restart/redeploy the backend.
- `OPENAI_MODEL`: optional model name; defaults to `gpt-4o-mini`.
- `OPENAI_API_URL`: optional OpenAI-compatible API base URL; leave it unset for OpenAI. If used, set the base URL (for example `https://api.openai.com/v1`), not the `/chat/completions` endpoint.

Chat and insights require authentication and use only the signed-in user's workspace records (admins retain their existing all-records access). Chat returns a clear error if the OpenAI key is missing or the provider is unavailable; it does not invent an AI response. Insights can still show separately labeled, data-derived workspace analysis when AI is unavailable.

The current frontend GitHub Pages workflow builds against `https://startup-api-3shs.onrender.com/api`. The backend source includes the authenticated `POST /api/ai/chat` and `POST /api/users/:id/photo` endpoints. The frontend workflow does not deploy the backend, so a frontend release can show a missing-route error until the backend is deployed separately. The backend deployment workflow checks that unauthenticated requests to both protected endpoints return `401` (rather than `404`) before it reports a successful deployment.

To redeploy the existing Render service:

1. Push the backend changes to the GitHub repository's `main` branch. The local repository must be up to date; verify the commit is present on GitHub before proceeding.
2. In Render, open the existing `startup-api-3shs` web service. Set its repository to `vishalvijay-2007/STARTUP`, branch to `main`, and Root Directory to the repository root (`.`). Use either the repository's Dockerfile or the Node commands `npm ci` (Build Command) and `npm run server` (Start Command). Set the health check path to `/api/health`.
3. In the Render service's **Environment** settings, configure `JWT_SECRET` and `OPENAI_API_KEY`. `OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`; Render supplies `PORT`. Keep `MONGODB_URI` set if the service uses MongoDB. Never set the OpenAI key in GitHub Pages or a `VITE_*` variable.
4. In Render **Settings → Deploy Hook**, create a deploy hook. In GitHub **Settings → Secrets and variables → Actions**, add a repository secret named `RENDER_DEPLOY_HOOK_URL` with that hook URL. The backend workflow runs tests, triggers the hook on `main` backend changes, and waits for health `200` plus an unauthenticated chat response `401`; missing hook configuration fails the workflow instead of silently skipping deployment.
5. To deploy immediately without the hook, use Render **Manual Deploy → Deploy latest commit** after the commit is on the service's tracked `main` branch. Wait for the deployment to finish.
6. Verify `GET https://startup-api-3shs.onrender.com/api/health` returns `200`, and unauthenticated `POST https://startup-api-3shs.onrender.com/api/ai/chat` and `POST https://startup-api-3shs.onrender.com/api/users/test-user/photo` return `401` (not `404`). Sign in to the production frontend, upload a profile photo, and send `Hi` then `Help me plan a pitch deck`; successful chat responses should identify their source as `openai`.

Render deploys commits from its configured branch; local edits must be committed and pushed before a manual or hook-triggered deployment can include them.

For the browser, create `client/.env` when needed. Use the same Google web client ID in the server `GOOGLE_CLIENT_ID` and frontend `VITE_GOOGLE_CLIENT_ID` settings:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=1065389571330-2sjilk3sul2152t7abu84ekbekst1gc7.apps.googleusercontent.com
```

Google sign-in requires an existing account; Google account creation is available only in the registration flow. A verified Google email can be linked to an existing account without granting or changing roles. Founder accounts can self-register. Mentor access must be assigned by an administrator; selecting Mentor during public registration does not grant Mentor permissions. To assign both roles to an existing account, an administrator updates that account through `PUT /api/users/:id` with its existing `name` and `email` plus `"roles": ["founder", "mentor"]`. The administrator can optionally specify `"role": "founder"` or `"role": "mentor"` as the account's default role. Users cannot assign roles to themselves. Accounts created before multi-role support continue to use their existing `role` automatically, so no database migration or destructive data change is required. If a selected role is not assigned, the sign-in response directs the user to request authorization from an administrator. Never commit `.env` files or real credentials. Google sign-in also requires the frontend origin to be listed in Google Cloud Console's authorized JavaScript origins.

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
Incubation record lists accept `page`, `limit` (maximum 100), and `search`. All incubation, course, and enrollment APIs require a bearer JWT unless noted.
All course and enrollment routes require `Authorization: Bearer <token>` unless noted.

- `GET /api/health` - API and database mode check
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google` - authentication
- `POST /api/auth/logout` - invalidate the user's active bearer-token sessions
- `GET /api/auth/me` - current authenticated user
- `GET /api/dashboard` - account-scoped summary and chart data
- `GET|POST /api/startups`, `PUT|DELETE /api/startups/:id` - startup records
- `GET|POST /api/cohorts`, `PUT|DELETE /api/cohorts/:id` - cohort records
- `GET|POST /api/mentors`, `PUT|DELETE /api/mentors/:id` - mentor profiles
- `GET|POST /api/sessions`, `PUT|DELETE /api/sessions/:id` - mentor sessions
- `GET|POST /api/milestones`, `PUT|DELETE /api/milestones/:id` - weighted milestones
- `GET|POST /api/resources`, `PUT|DELETE /api/resources/:id` - resource inventory and allocation details
- `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all` - activity notifications
- `GET /api/ai/insights` - data-grounded workspace insights; falls back to clearly labeled local analysis when AI is unconfigured or unavailable. Limited to 5 requests per user per minute.
- `POST /api/ai/chat` - authenticated OpenAI chat with account-scoped workspace context; accepts `message` and up to 12 prior user/assistant messages in `history`. Limited to 12 requests per user per minute.
- `GET /api/courses`, `GET /api/courses/:id` - course reads
- `POST /api/courses`, `PUT /api/courses/:id`, `DELETE /api/courses/:id` - course management
- `POST /api/ai/course-suggestions` - optional AI or explicitly labeled built-in course suggestions. Limited to 8 requests per user per minute.
- `POST /api/users`, `PUT /api/users/:id` - user management; only administrators may set the `roles` array (for example `["founder", "mentor"]`)
- `POST /api/users/:id/photo`, `DELETE /api/users/:id/photo` - authenticated profile photo upload and removal; upload uses a `photo` multipart field and accepts JPG, JPEG, PNG, or WEBP images up to 5 MB
- `GET /api/users/:id/courses` - enrolled courses
- `POST /api/users/:userId/courses/:courseId`, `DELETE /api/users/:userId/courses/:courseId` - enrollment changes

Course create and update requests use `multipart/form-data` with `title`, `category`, `description`, `hours`, and an optional `file` field. Bruno examples are available in [bruno/startup-api](bruno/startup-api).
When running the unauthenticated demo workspace, profile photos are saved locally in IndexedDB and are not uploaded to the server.

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
server/models/      Mongoose schemas for incubation records
models/             Existing user and course schema files
client/src/         React workspace, reusable views, API client, and styling
bruno/startup-api/  Bruno request collection and local environment
.github/workflows/  Frontend deployment workflow
Dockerfile          Multi-stage full-stack production image
```

## Future Improvements
- Use object storage for uploaded material instead of local disk.
- Add email delivery and token-based password reset workflows.
- Add participant invitations and explicit mentor/team assignment permissions.
- Add allocation history with transactional availability checks and resource requests.
- Add enrollment progress, attendance workflows, and notification preferences.
- Expand automated API integration tests to cover MongoDB-backed authorization and relationships.
- Add a production backend deployment with managed MongoDB and monitoring.

## Contributors
Vishal Vijay

## Submission Checklist
- [ ] Verify frontend, backend health, database mode, authentication, uploads, and enrollment workflows on the deployed environment.
- [ ] Record and upload the technical walkthrough; set Google Drive access to "Anyone with the link can view".
- [ ] Create `feature/final-project-submission`, commit the final changes, push it, and open a public PR targeting `main`.
