# Startup Incubation Platform

A full-stack startup incubation and management platform that connects **Founders, Mentors, and Administrators** in one workspace. It helps incubator teams manage startup profiles, milestones, mentor applications, mentoring sessions, cohorts, learning resources, notifications, analytics, and AI-assisted startup guidance.

The application is built with React and TypeScript on the frontend and Node.js/Express on the backend. It uses a JSON-file database and supports local development as well as Docker-based deployment.

## Features

### Role-based workspaces
- **Founder:** manage startup information, track milestones, discover mentors, attend mentoring sessions, access courses and resources, and view relevant notifications.
- **Mentor:** maintain a mentor profile, manage assigned founders and mentoring sessions, and access the mentor workspace. New mentor applications require administrator approval.
- **Administrator:** oversee founders and mentors, approve or reject mentor applications, manage cohorts, review platform activity, and view dashboard statistics.

### Platform modules
- Authentication, registration, profile management, and password-reset flows
- Startup profiles and milestone tracking
- Mentor directory, mentor assignment, and session scheduling
- Cohort management and administrative approval workflows
- AI assistant, startup analysis, and course recommendations (requires an AI API key)
- Courses, learning progress, and resource requests
- Notifications, account settings, privacy, and appearance preferences
- Analytics and activity logs
- INR (₹) currency formatting and Indian locale defaults

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling and UI | Tailwind CSS 4, Lucide React, Motion |
| Charts | Recharts |
| Backend | Node.js, Express |
| AI integration | Google GenAI SDK (Gemini) |
| Data storage | JSON file database |
| API testing | Bruno |
| Deployment | Docker, Docker Compose, Nginx |

## Project Structure

```text
Startup Management Platform/
├── bruno/                  # Bruno API collection and environments
├── client/public/          # Public client assets
├── data/
│   └── db.json             # Local JSON database
├── public/                 # Static assets, logos, and illustrations
├── scripts/                # Utility scripts
├── server/
│   ├── ai.ts               # AI provider integration
│   └── db.ts               # Database access and data models
├── src/
│   ├── components/
│   │   ├── auth/           # Login, registration, password recovery
│   │   ├── common/         # Shared UI components
│   │   ├── dashboards/     # Founder, Mentor, and Admin dashboards
│   │   ├── landing/        # Landing page
│   │   ├── layout/         # Application layout
│   │   └── pages/          # Main application pages
│   ├── context/            # Authentication context
│   ├── types/              # TypeScript types
│   └── utils/              # Shared utilities
├── server.ts               # Express API and development server
├── package.json
├── vite.config.ts
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
└── README.md
```

## Prerequisites

For local development:
- Node.js 20 or later
- npm (or a compatible package manager)

For container deployment:
- Docker Engine
- Docker Compose v2

Optional integrations:
- A Google Gemini API key for AI features
- A Google OAuth Client ID if Google sign-in is enabled/configured

## Getting Started (Local Development)

1. Open a terminal in the project root.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your local environment file:

   **Windows PowerShell**
   ```powershell
   Copy-Item .env.example .env
   ```

   **macOS / Linux**
   ```bash
   cp .env.example .env
   ```

4. Open `.env` and configure the values you need. At minimum, review the server settings and set a valid, private `JWT_SECRET`. Add your Gemini API key to enable AI-powered features. Configure the Google OAuth client ID only if you intend to use Google sign-in.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open the local URL printed in the terminal. The project normally serves the application at:

   ```text
   http://localhost:3000
   ```

The development command runs the Express server with `tsx` and Vite middleware.

## Environment Variables

Use `.env.example` as the template. Common settings include:

| Variable | Purpose |
|---|---|
| `PORT` | Express server port (default: `3000`) |
| `NODE_ENV` | Runtime mode, such as `development` or `production` |
| `APP_URL` | Public/base application URL |
| `VITE_API_BASE_URL` | Optional frontend API base URL; blank uses the same-origin `/api` route |
| `DATA_DIR` | Directory used for persistent data |
| `DB_FILE` | Optional explicit JSON database file path |
| `GEMINI_API_KEY` | Google Gemini API key for AI functionality |
| `OPENAI_API_KEY` | Optional secondary AI provider key |
| `GROQ_API_KEY` | Optional secondary AI provider key |
| `OPENROUTER_API_KEY` | Optional secondary AI provider key |
| `SECONDARY_AI_API_KEY` | Optional generic secondary provider key |
| `SECONDARY_AI_BASE_URL` | Optional secondary provider endpoint |
| `SECONDARY_AI_MODEL` | Optional secondary provider model |
| `SECONDARY_AI_PROVIDER_NAME` | Optional secondary provider display name |
| `JWT_SECRET` | Secret used by authentication/security code; set a strong unique value |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth web client ID |
| `DEFAULT_CURRENCY` | Currency setting (default: `INR`) |
| `DEFAULT_LOCALE` | Locale setting (default: `en-IN`) |
| `INCUBATOR_HQ_LOCATION` | Incubator location setting |

Do not commit `.env` or real API keys/passwords to source control. Use `.env.example` only as a template and rotate any credentials that may have been exposed.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the frontend and bundle the backend into `dist/server.js` |
| `npm start` | Start the built production server |
| `npm run lint` | Run TypeScript type-checking (`tsc --noEmit`) |
| `npm run test:api` | Run the Bruno API collection against the Local environment |
| `npm run clean` | Remove generated build output |

Build and run locally:

```bash
npm run build
npm start
```

## Docker Deployment

The repository includes Dockerfiles and a Compose configuration for a frontend Nginx container and a backend Node.js container.

1. Create and configure `.env` from `.env.example`.
2. Build the images:

   ```bash
   docker compose build
   ```

3. Start the services:

   ```bash
   docker compose up -d
   ```

4. Check service status:

   ```bash
   docker compose ps
   ```

5. Open the frontend:

   ```text
   http://localhost
   ```

   The Compose configuration also maps the frontend to port `8080`, so `http://localhost:8080` may be used if that mapping is available.

Useful commands:

```bash
# Follow logs
docker compose logs -f

# Follow backend logs only
docker compose logs -f backend

# Restart services
docker compose restart

# Stop containers (keeps the named database volume)
docker compose down

# WARNING: also removes named volumes and persisted database data
docker compose down -v
```

The Compose setup stores backend data in the `incubator_data` named volume mounted at `/app/data`. Keep this volume when you want database data to survive container recreation.

## Health Checks

- Backend: `GET http://localhost:3000/api/health`
- Frontend Nginx: `GET http://localhost/healthz`

Check the backend health endpoint with:

```bash
curl http://localhost:3000/api/health
```

## API Collection and Testing

The `bruno/` directory contains a Bruno collection grouped by feature, including authentication, settings, startup management, mentor sessions, administration, AI/learning, notifications, and resources.

To run the local API collection:

```bash
npm run test:api
```

Make sure the application backend is running and the Bruno Local environment points to the correct API base URL. You can also open the `bruno/` folder in the Bruno desktop application and run requests individually.

## Troubleshooting

**Port 3000 or 80 is already in use**
- Stop the process using the port, or change the relevant port mapping/configuration.
- For Docker, edit the host-side port in `docker-compose.yml`.

**Frontend cannot reach the API**
- Confirm the backend is running and `/api/health` responds.
- When using Docker Compose, confirm both containers are healthy and the Nginx `/api` reverse proxy is configured correctly.
- Check `VITE_API_BASE_URL` if you have customized API routing.

**AI features are unavailable**
- Confirm `GEMINI_API_KEY` is set correctly in the environment used by the backend.
- Check backend logs for provider or quota errors.
- Optional secondary AI provider variables may be configured if supported by the current AI service implementation.

**Data appears to reset**
- Local development uses the configured JSON database path.
- In Docker, verify that the `incubator_data` volume is mounted and do not run `docker compose down -v` unless you intend to delete persisted volume data.

## Security Notes

- Use a strong, unique `JWT_SECRET` in every environment.
- Keep `.env` out of Git and never publish API keys or credentials.
- Use HTTPS and managed secrets for production deployments.
- Review authentication, authorization, and account-registration settings before exposing the application publicly.
- Back up the JSON database/volume regularly.

## Contributing

1. Create a feature branch.
2. Make focused changes that match the existing TypeScript/React structure.
3. Run `npm run lint` and relevant API tests.
4. Submit a pull request with a clear summary and testing notes.

## License

No license is specified in this repository. Add a `LICENSE` file before distributing the project under an open-source license.
