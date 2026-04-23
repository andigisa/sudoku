# Stage 2 Specification: Server-Backed Sessions, Daily Challenge, Telemetry Baseline

## 1. Goal and Release Outcome

Stage 2 upgrades the solo MVP into a durable product while keeping the same simple deployment model. The product must still run as one Node.js application on a single host, but now it persists sessions and challenge data in SQLite and records server-side progress for guest users.

This stage establishes the minimum backend foundation required for retention features and future competition features.

## 2. Scope Included / Explicitly Excluded

Included:

- SQLite persistence
- database migrations
- guest profile identity token
- server-backed puzzle sessions
- session completion tracking
- daily challenge and challenge archive
- server-side personal stats for guest profiles
- baseline structured logging and health readiness checks

Excluded:

- registered accounts
- async tournaments
- leaderboard
- realtime match play
- chat
- monetization

## 3. System Architecture for This Stage

### 3.1 Runtime Topology

Remain on a single Node.js process with one SQLite database file on local disk. The server continues to serve the frontend and API. No second process may be required for normal operation.

### 3.2 Additional Technology Decisions

- ORM and migrations: Drizzle ORM + Drizzle Kit
- SQLite driver: `better-sqlite3`
- API documentation: OpenAPI generated from Zod schemas or explicit route schemas

### 3.3 Scheduling Strategy

Do not depend on a platform cron feature. Daily challenge creation must be demand-driven:

- on first request for a calendar day, the server checks if the daily challenge row exists
- if missing, it creates it transactionally from the designated puzzle pool

This makes Stage 2 deployable on constrained hosting.

## 4. Frontend Requirements

### 4.1 Identity Behavior

Generate a guest profile token on first load and store it securely in an `httpOnly` cookie if feasible; if hosting constraints require it, store a signed identifier in a secure cookie and use server lookups for profile data. The frontend must treat the user as anonymous but persistent.

### 4.2 New Screens and Features

Add:

- daily challenge card on home screen
- stats view for guest history
- completion summary screen with session result

The existing local resume behavior from Stage 1 remains, but server-backed sessions become the source of truth for completed sessions.

## 5. Backend and API Requirements

### 5.1 Endpoints

Implement:

- `POST /api/v1/sessions`
- `POST /api/v1/sessions/:sessionId/complete`
- `GET /api/v1/daily`
- `GET /api/v1/daily/archive`
- `GET /api/v1/stats/me`
- `GET /readyz`

### 5.2 Session Lifecycle

`POST /api/v1/sessions`:

- request contains `puzzle_id`
- response returns server-generated session id and session start timestamp

`POST /api/v1/sessions/:sessionId/complete`:

- request contains completion payload: elapsed time, hints used, mistakes, final board checksum
- server validates that the session exists and has not already been completed
- server records completion atomically

### 5.3 Daily Challenge Rules

- one daily challenge puzzle per UTC day or configured app timezone; choose and document one timezone and use it consistently. Use UTC to avoid ambiguous hosting behavior.
- all users receive the same puzzle for the day
- archive returns previous challenges in descending date order

## 6. Data Model and Persistence

Create these tables:

- `guest_profile`
- `puzzle`
- `puzzle_session`
- `daily_challenge`
- `daily_challenge_completion`

Required table behavior:

- `guest_profile` has stable external token and creation timestamps
- `puzzle` stores puzzle metadata and version information
- `puzzle_session` stores start time, completion state, and session metrics
- `daily_challenge` references exactly one puzzle per date
- `daily_challenge_completion` links guest, challenge, and result metrics

Add indexes for:

- guest lookups by external token
- challenge lookup by date
- session lookup by guest and start time

## 7. Security and Privacy Requirements

- all session-completion writes must be idempotent or reject duplicates safely
- guest token must be signed or randomly generated with enough entropy
- do not trust client-provided timestamps as authoritative
- rate-limit session completion and daily endpoints to reduce abuse
- no third-party trackers yet

## 8. Deployment and Operations

### 8.1 Environment Variables

Add:

- `DATABASE_URL` pointing to SQLite file
- `COOKIE_SECRET`
- `LOG_LEVEL`

### 8.2 Backups and Recovery

Document a simple backup procedure for the SQLite file:

- daily snapshot copy
- backup before each deploy involving migrations

### 8.3 Migrations

Every schema change must ship with forward migrations. Destructive schema changes are not allowed in this stage.

### 8.4 Observability

Log at minimum:

- guest profile creation
- session created
- session completed
- daily challenge generated
- database errors

Emit basic metrics if feasible:

- request count
- request duration
- session completion count
- daily challenge fetch count

## 9. Testing Strategy

### 9.1 Unit Tests

Cover:

- session result validation
- daily challenge date resolution logic
- guest token generation and parsing

### 9.2 Integration Tests

Cover:

- migration from empty DB
- session create and complete flow
- duplicate completion rejection
- daily challenge generation race condition
- stats aggregation for a guest profile

### 9.3 End-to-End Tests

Cover:

- play a puzzle and create a server session
- finish a daily challenge and verify stats update
- reopen the app and retrieve prior results under same guest profile

## 10. Acceptance Criteria

- Guest users keep their history on the same browser through a persistent server-backed profile.
- Daily challenge is stable and identical for all users on a given UTC date.
- Duplicate completion requests do not create duplicate score records.
- SQLite migrations can build the database from empty state in CI.
- The product still deploys as one Node.js application without external services.

## 11. Exit Criteria to Start Stage 3

Stage 2 is complete only when:

- the SQLite schema is migration-managed
- API contracts are documented in OpenAPI
- guest profiles are stable and trusted enough for soft competition
- daily challenge generation works without cron
- logging is sufficient to diagnose session and challenge issues in production
