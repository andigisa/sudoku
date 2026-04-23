# Stage 5 Specification: Realtime 1v1 on a Single Server

## 1. Goal and Release Outcome

Stage 5 introduces the first live multiplayer release while preserving a modest infrastructure footprint. The focus is a robust, server-authoritative 1v1 experience that can still run on a single Node.js instance if traffic is low to moderate.

This stage is the first point where moving from shared hosting to VPS is allowed and expected if WebSocket limitations or runtime stability require it.

## 2. Scope Included / Explicitly Excluded

Included:

- private room by code
- simple public 1v1 queue
- lobby and ready state
- countdown and match start
- live progress updates
- authoritative match result
- reconnect and state resync
- persisted move log and replay support

Excluded:

- ranked matchmaking tiers
- 4+ player arenas
- spectator mode
- in-game chat
- multi-instance scale-out

## 3. Realtime Architecture

### 3.1 Runtime Topology

Use the existing Fastify server with WebSocket support in the same process. All match coordination lives in memory during the match, with durable writes to SQLite for room, match, and move log persistence.

There is still no Redis or cross-instance coordination in Stage 5.

### 3.2 Match Coordinator Rules

The server owns:

- room lifecycle
- queue lifecycle
- countdown clock
- authoritative elapsed time
- move validation
- progress percentage calculation
- disconnect timeout rules
- final result calculation

Clients are never authoritative for score, finish time, or opponent state.

## 4. Match Model

### 4.1 Supported Match Types

- `private_duel`
- `public_duel`

### 4.2 Match Lifecycle

States:

1. `waiting_for_players`
2. `ready_check`
3. `countdown`
4. `in_progress`
5. `finished`
6. `abandoned`
7. `expired`

### 4.3 Reconnect Rules

- if a player disconnects before `in_progress`, allow reconnect for 60 seconds
- if a player disconnects during `in_progress`, allow reconnect for 120 seconds
- if reconnect window expires, mark player as abandoned and award win to opponent if match already started

## 5. Frontend Requirements

Add:

- create private room flow
- join room by code flow
- public duel queue flow
- lobby screen with ready state
- live match screen with opponent progress bar
- post-match result screen

The live match screen must show:

- own board
- own timer
- opponent progress percent only
- connection state indicator

Do not reveal opponent notes or exact board contents.

## 6. Backend and Realtime Interface Requirements

### 6.1 REST Endpoints

Implement:

- `POST /api/v1/matches/private`
- `POST /api/v1/matches/private/:roomCode/join`
- `POST /api/v1/matches/queue`
- `GET /api/v1/matches/:matchId`

### 6.2 WebSocket Event Contracts

Client to server:

- `room.ready`
- `room.leave`
- `move.submit`
- `match.resync_request`

Server to client:

- `match.found`
- `match.state`
- `match.start`
- `match.progress`
- `match.resync`
- `match.finish`
- `match.error`

Example client message:

```json
{
  "type": "move.submit",
  "payload": {
    "match_id": "match_123",
    "seq": 18,
    "cell": 40,
    "mode": "pen",
    "value": 7
  }
}
```

Rules:

- `seq` is strictly increasing per player connection
- duplicate or out-of-order messages are ignored or trigger resync
- all responses include server timestamp

### 6.3 Resync Behavior

On reconnect or mismatch:

- client sends `match.resync_request`
- server returns authoritative board state, move cursor, progress, timer, and match state

## 7. Data Model and Persistence

Create these tables:

- `match`
- `match_player`
- `move_log`
- `match_result`

Rules:

- each accepted move is appended to `move_log`
- move log entries include `seq`, `cell`, `value`, `mode`, and server timestamp
- final result stores winner, finish reason, elapsed time, and versioned ruleset

Indexes:

- match by status
- player by user or guest owner
- move log by match and sequence

## 8. Security and Fairness Requirements

- server validates every move against puzzle and match rules
- server time is authoritative for start and finish
- room codes must be random enough to prevent trivial guessing
- queue abuse must be rate-limited
- reconnect token or match membership must be verified on every socket session

## 9. Deployment and Operations

### 9.1 Hosting Threshold

Stage 5 may start on Hostinger Node hosting only if:

- long-lived WebSocket connections are supported reliably
- p95 match event latency stays below 250 ms
- fewer than 50 concurrent sockets are expected

If any of these conditions fail, move deployment to a VPS immediately. Stage 5 is the formal point where VPS is acceptable and likely.

### 9.2 Environment Variables

Add:

- `WS_HEARTBEAT_INTERVAL_MS`
- `MATCH_RECONNECT_GRACE_MS`
- `PUBLIC_QUEUE_ENABLED`

### 9.3 Observability

Log:

- room created
- queue joined
- match started
- player disconnected
- player reconnected
- match finished
- resync requested

Track metrics:

- concurrent sockets
- queue wait time
- reconnect count
- match abandonment rate
- p95 event broadcast latency

## 10. Testing Strategy

### 10.1 Unit Tests

Cover:

- match state transitions
- reconnect deadline logic
- move sequence handling
- progress calculation

### 10.2 Integration Tests

Cover:

- private room creation and join
- public queue match assignment
- duplicate move handling
- out-of-order move resync
- disconnect and reconnect during active match

### 10.3 Determinism and Load Tests

Cover:

- replay move log and reproduce final board state
- replay move log and reproduce winner
- moderate concurrency simulation for target single-instance limits

### 10.4 End-to-End Tests

Cover:

- two browser contexts join same private room and finish a match
- one player disconnects and reconnects successfully
- abandoned player loses correctly after grace period

## 11. Acceptance Criteria

- Two users can complete a full private duel with authoritative outcome.
- Public queue can produce a valid 1v1 match.
- Reconnect and resync work for transient network loss.
- Move log replay reproduces the final result.
- Operations can identify socket overload or latency issues from logs and metrics.

## 12. Exit Criteria to Start Stage 6

Stage 5 is complete only when:

- live 1v1 works reliably on one server
- replay determinism is proven in tests
- the team has measured whether shared hosting is still viable
- the system is ready to justify Postgres and Redis only if live traffic demands it
