# Bruno API collection

This collection documents the Startup Management Platform API.

## Run the collection

1. Start the API from the repository root with `npm run server`.
2. Open the `bruno/startup-api` folder in Bruno.
3. Select the `local` environment.
4. Run `Auth/Register` once, or run `Auth/Login` with the sample credentials. The response script stores `token` and `userId` automatically.
5. Run `Courses/Create Course` with the included `Courses/course-material.txt`, or replace it with a real course file. Its response script stores `courseId` automatically.
6. Run the remaining course and enrollment requests.

The API requires a bearer token for all endpoints except health, register, and login. Course create and update use `multipart/form-data` and accept an optional file up to 10 MB.

## Documented endpoints

| Area | Requests |
| --- | --- |
| Health | `GET /api/health` |
| Authentication | Register, login, current user |
| Courses | Create, list, get, update |
| Enrollment | Enroll, list enrolled courses, unenroll |

The collection contains 12 request definitions and a local environment with the API base URL and token variables.