# Stage 3 Specification: Async Competition MVP

## 1. Goal and Release Outcome

Stage 3 introduces the first competitive loop without adding realtime infrastructure. Users compete asynchronously on the same puzzle set during a tournament window, and the server calculates authoritative scores and rankings.

The release goal is to create a competition system that is fair, auditable, and simple enough to run on the same single-server deployment model as the previous stages.

## 2. Scope Included / Explicitly Excluded

Included:

- active tournament overview
- tournament puzzle assignment
- server-authoritative score calculation
- tournament result submission
- tournament leaderboard
- immutable audit trail for scoring inputs
- basic abuse detection rules

Excluded:

- live matches
- matchmaking
- spectator mode
- chat
- rewards economy
- advanced moderation tooling

## 3. Competition Model

### 3.1 Tournament Format

Use one active asynchronous tournament at a time for the MVP. Each tournament contains one shared puzzle for all participants. Future support for multi-puzzle tournaments is allowed, but Stage 3 must implement single-puzzle tournaments only.

Tournament fields:

- `id`
- `slug`
- `title`
- `starts_at`
- `ends_at`
- `puzzle_id`
- `ruleset_version`
- `status`

### 3.2 Submission Rules

- each guest or account may submit multiple attempts during tournament window
- only the best valid score counts on the leaderboard
- ties are sorted by:
  1. higher score
  2. lower completion time
  3. earlier completion timestamp

### 3.3 Score Formula

Implement server-side score calculation:

`score = base_difficulty_points * completion_multiplier * time_multiplier - mistake_penalty - hint_penalty`

Stage 3 requires fixed rules:

- completed puzzle: `completion_multiplier = 1.0`
- incomplete puzzle: submission rejected for leaderboard
- `time_multiplier = 1.0` for Stage 3 MVP to avoid overfitting early
- `mistake_penalty = 50 * mistakes`
- `hint_penalty = 100 * hints_used`

Base difficulty points:

- easy: 1000
- medium: 1500
- hard: 2200
- expert: 3000

These values are deliberately simple and must be versioned through `ruleset_version`.

## 4. System Architecture for This Stage

### 4.1 Runtime Topology

Remain on a single Node.js process with SQLite. No WebSocket and no external cache.

### 4.2 New Internal Modules

Add:

- tournament service
- leaderboard service
- scoring service
- anti-abuse rules service

These must be implemented as internal modules, not separate services.

## 5. Frontend Requirements

Add:

- tournament card on home screen
- tournament detail page
- leaderboard page
- post-result summary showing current rank and score breakdown

The UI must show:

- tournament countdown
- current status: upcoming, active, ended
- score breakdown with mistakes and hints impact

## 6. Backend and API Requirements

### 6.1 Endpoints

Implement:

- `GET /api/v1/tournaments/current`
- `GET /api/v1/tournaments/:tournamentId`
- `POST /api/v1/tournaments/:tournamentId/entries`
- `GET /api/v1/leaderboards/tournament/:tournamentId`

### 6.2 Entry Submission Contract

Request example:

```json
{
  "session_id": "sess_123",
  "elapsed_ms": 312000,
  "mistakes": 1,
  "hints_used": 0,
  "final_board": "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
}
```

Server rules:

- the linked session must exist and belong to the current user identity
- the final board must be validated against the solution
- the score must be calculated on the server
- raw submission data and computed result must be stored atomically

### 6.3 Leaderboard Response

Return:

- rank
- display name or guest alias
- score
- completion time
- mistakes
- hints used
- submission time

No PII is allowed in leaderboard output.

## 7. Data Model and Persistence

Create these tables:

- `tournament`
- `tournament_entry`
- `leaderboard_snapshot`
- `abuse_flag`

Behavior:

- `tournament_entry` stores raw inputs, normalized metrics, calculated score, and validity status
- `leaderboard_snapshot` is optional for Stage 3; if used, snapshots are regenerated synchronously after valid submission or lazily on read
- `abuse_flag` stores suspicious submissions for later review

Required indexes:

- tournament by status and date
- tournament entries by tournament and player
- leaderboard ranking retrieval by tournament and score desc

## 8. Security and Trust Requirements

- Client-submitted score is ignored.
- Client-submitted completion timestamp is ignored.
- Minimum elapsed time threshold is enforced, for example reject impossible solves below a configured floor such as 20 seconds.
- Duplicate tournament entry submission with identical payload must be idempotent.
- Every ranked entry must be reproducible from stored inputs and ruleset version.

## 9. Deployment and Operations

### 9.1 Tournament Provisioning

Do not depend on external schedulers. Provide an internal admin-only seeding command or protected route to create future tournaments ahead of time. The application may also auto-activate the next tournament when read requests occur after the scheduled start time.

### 9.2 Environment Variables

Add:

- `TOURNAMENT_MIN_SOLVE_MS`
- `TOURNAMENT_RULESET_VERSION`

### 9.3 Observability

Log:

- tournament created
- tournament entry submitted
- tournament entry rejected
- abuse flag created
- leaderboard requested

## 10. Testing Strategy

### 10.1 Unit Tests

Cover:

- score calculation for every difficulty
- tie-break ordering
- invalid final board rejection
- ruleset version behavior

### 10.2 Integration Tests

Cover:

- create tournament and fetch current tournament
- submit valid result and verify rank
- submit duplicate result and verify idempotency
- best-attempt replacement behavior
- abuse flag creation on impossible solve times

### 10.3 End-to-End Tests

Cover:

- user opens active tournament
- user completes tournament puzzle
- leaderboard updates after submission
- ended tournament remains viewable but closed to new entries

## 11. Acceptance Criteria

- A tournament can run from start to finish without manual database edits.
- Scores are fully server-authoritative and reproducible.
- Leaderboard ranking is deterministic and stable.
- Best-attempt logic works correctly for repeat entries.
- The full competition release still deploys as one Node.js app with SQLite.

## 12. Exit Criteria to Start Stage 4

Stage 3 is complete only when:

- scoring rules are versioned
- the leaderboard is reproducible from stored data
- abuse rules exist for obvious score fraud
- competition adds retention without introducing realtime infrastructure
