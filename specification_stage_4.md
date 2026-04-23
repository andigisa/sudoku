# Stage 4 Specification: Accounts and Cloud Sync Foundation

## 1. Goal and Release Outcome

Stage 4 introduces optional registered accounts and cloud sync while preserving anonymous first-use flow. The system must let an existing guest user create an account without losing progress. This stage creates the identity and synchronization model required for cross-device use and future iPhone packaging.

## 2. Scope Included / Explicitly Excluded

Included:

- email/password registration
- login and logout
- password reset flow placeholder or initial implementation
- guest-to-account upgrade
- server-backed cloud sync for progress, settings, and stats
- optional alias for leaderboard display

Excluded:

- social login
- subscription billing
- realtime multiplayer
- spectator and chat

## 3. Identity and Session Model

### 3.1 Authentication Model

Use cookie-based web authentication:

- short-lived signed session cookie
- server-side session table for revocation and rotation

Do not use long-lived JWT-only auth for the web app in this stage. Cookie sessions are simpler and safer for same-origin deployment.

### 3.2 Guest Upgrade Rules

When a guest registers:

- the guest profile is linked to the new `user`
- prior session history, daily completions, tournament entries, and stats are reassigned to the new account
- the external guest token remains supported for fallback migration safety until next login

### 3.3 Sync Principles

Cloud becomes source of truth for:

- completed puzzle history
- daily challenge completion
- tournament history
- user settings

Local remains source of truth temporarily for:

- active in-progress puzzle when offline

On reconnect, the client uploads pending local progress and the server resolves it by last-updated timestamp with explicit rules.

## 4. Frontend Requirements

Add:

- registration screen
- login screen
- account settings screen
- upgrade prompt from guest profile
- sync status indicator on active game screen

The user must still be able to ignore account creation and keep playing as guest.

## 5. Backend and API Requirements

### 5.1 Endpoints

Implement:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/upgrade-guest`
- `GET /api/v1/sync/bootstrap`
- `POST /api/v1/sync/push`

### 5.2 Register Contract

Request:

```json
{
  "email": "user@example.com",
  "password": "strong-password",
  "display_name": "GridFox"
}
```

Rules:

- email unique, case-normalized
- display name optional but unique enough for public display if used in leaderboard
- password hashed with Argon2id

### 5.3 Sync Contract

`GET /api/v1/sync/bootstrap` returns:

- current user profile
- settings
- recent sessions
- in-progress resumable games

`POST /api/v1/sync/push` accepts:

- pending local progress updates
- local settings changes
- last-known server sync token

Server response returns:

- accepted changes
- rejected changes with reason
- new sync token

## 6. Data Model and Persistence

Create these tables:

- `user`
- `user_session`
- `password_credential`
- `sync_state`

Update prior tables to support:

- optional `user_id`
- nullable `guest_profile_id` for pre-upgrade ownership

Required rules:

- records may belong to either guest or user during migration period
- after guest upgrade, all future writes should target `user_id`
- migration logic must be idempotent

## 7. Security and Privacy Requirements

- Argon2id password hashing
- password minimum length and breach-resistant validation policy
- session rotation on login
- CSRF protection for cookie-authenticated write requests
- email verification optional in this stage; if deferred, restrict risky account actions until verification is added later
- rate-limit login and registration endpoints

Password reset may be deferred, but the spec must define a placeholder route shape and note that production launch with public registration requires a reset flow before broad promotion.

## 8. Deployment and Operations

### 8.1 Environment Variables

Add:

- `SESSION_COOKIE_SECRET`
- `ARGON2_MEMORY_COST`
- `ARGON2_TIME_COST`
- `SMTP_FROM` if reset mail is implemented

### 8.2 Operational Requirements

- session table cleanup job may run lazily on login or startup if cron is unavailable
- auth logs must exclude passwords and secrets
- database backup frequency increases before deploying auth changes

## 9. Testing Strategy

### 9.1 Unit Tests

Cover:

- email normalization
- password policy
- guest-upgrade merge planner
- sync conflict resolution rules

### 9.2 Integration Tests

Cover:

- register, login, logout flow
- duplicate email rejection
- guest profile upgraded to account with retained history
- sync bootstrap and push behavior
- CSRF rejection for invalid write requests

### 9.3 End-to-End Tests

Cover:

- play as guest, register, verify progress remains
- sign in on second browser context and load synced stats
- make local offline progress, reconnect, push and verify server merge

## 10. Acceptance Criteria

- Anonymous users can register without losing prior data.
- Registered users can sign in on another device and retrieve synchronized stats and history.
- Account creation remains optional and does not block guest play.
- Authentication uses secure cookie sessions rather than client-trusted tokens.
- Sync conflicts are deterministic and documented.

## 11. Exit Criteria to Start Stage 5

Stage 4 is complete only when:

- account and guest ownership models coexist safely
- cloud sync is stable enough to support multi-device play
- the identity layer is ready to attach to live matches
- iPhone packaging can reuse the same sync and domain contracts later
