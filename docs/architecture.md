# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep page rendering and user interaction in React components, and route all requests through the shared API client using relative `/api` paths. Each capability shows accessible loading, success, empty, and error states.
- Logic tier decision: Keep HTTP handling in Express routes and business rules in explicit service functions. Validate request data and references before writes, return deliberate 4xx responses for invalid input, and do not add authentication in this exercise.
- Data tier decision: Use Mongoose schemas for required fields, defaults, types, and references. Keep demo seeding idempotent and preserve unrelated records while reconciling seeded team membership.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`; validate ID shape and referenced records before creating an activity. Compute points server-side at one point per minute and set `occurredAt` on the server; list stored activities through the API.
- Team management approach: Require a team name, retain the submitted name and mascot, and store member references in a default-empty array. Create and list teams through the service layer.
- Leaderboard approach: Sum stored activity points per team, sort by total points descending, and return `teamName`, `totalPoints`, and a 1-based `rank`.
- Workout suggestions approach: Find the user by email, then recommend workouts aligned with their fitness goal or recent activity and include a human-readable reason. Return a deliberate 4xx when no user matches.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` - baseline: 4 failed, 1 passed. Failures indicate missing Mongoose required-field validation/defaults; the idempotent seed contract passes.
- API command: `npm run test:api --prefix octofit-tracker/backend` - baseline: 4 failed. Failures indicate incomplete activity/team validation and creation, leaderboard aggregation, and user-matched workout recommendations.
- Frontend command: `npm test --prefix octofit-tracker/frontend` - baseline: 15 failed. Failures indicate missing API-backed rendering, the user-specific workout request, and accessible loading, empty, and error states across the four routes.
- Backend build command: `npm run build --prefix octofit-tracker/backend` - passed. A failure indicates a TypeScript type-check error.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` - passed. A failure indicates a TypeScript or Vite production-build error.
