# Stage 6 Specification: Scale-Out and iPhone Productization Path

## 1. Goal and Release Outcome

Stage 6 evolves the system from a single-server product into a scalable service and turns the offline-capable web system into a proper iPhone deliverable. This stage is only justified after live product usage proves the need for scale-out or native packaging.

The release goal is twofold:

- support multi-instance backend deployment with reliable realtime coordination
- ship an iPhone app path that preserves full offline solo play and delayed sync

## 2. Scope Included / Explicitly Excluded

Included:

- SQLite to Postgres migration
- Redis-backed realtime coordination
- optional spectator mode and chat foundation if justified by usage
- stronger sync model for offline-first mobile behavior
- iPhone packaging and release path

Excluded:

- premature microservice decomposition
- non-iPhone native apps unless specifically prioritized

## 3. Architecture Evolution

### 3.1 Deployment Topology

Move to VPS or managed infrastructure with:

- one or more Node.js app instances
- Postgres as canonical relational store
- Redis for ephemeral match coordination and pub/sub fanout

The application remains a modular monolith at code level. Do not split into separate services unless measured operational pain requires it.

### 3.2 New Infrastructure Responsibilities

Postgres stores:

- users
- sessions
- puzzles
- tournaments
- match metadata
- durable move logs

Redis stores:

- active match coordination state
- queue state
- websocket fanout metadata
- short-lived reconnect tokens

## 4. iPhone App Strategy

### 4.1 Packaging Decision

Use Capacitor as the default iPhone path. This reuses the React frontend and shared TypeScript domain logic while allowing App Store packaging and native local storage integration.

Do not build a fully separate native Swift client in this stage.

### 4.2 Offline Model

The iPhone app must support:

- full solo play offline
- local progress storage
- local completion history
- deferred sync when network returns

Multiplayer is not required offline. If no network exists, realtime features must be disabled clearly rather than failing silently.

### 4.3 Mobile Persistence

On iPhone, local storage must use a durable offline-friendly store. Keep the domain sync format aligned with the web IndexedDB format, even if the underlying storage adapter differs.

## 5. Backend Interface Changes

### 5.1 Sync Requirements

Extend sync contracts to support:

- batched local mutations
- client-generated mutation ids
- replay-safe server acknowledgements
- conflict responses with server-authoritative resolution

### 5.2 Mobile Session Support

For native packaging, support token-based authenticated API calls in addition to cookie-based web sessions. Keep web on secure cookies; mobile may use short-lived access token plus rotating refresh token stored securely by the app.

## 6. Data Migration Requirements

### 6.1 SQLite to Postgres

Migration plan must include:

- schema parity verification
- data export from SQLite
- import into Postgres
- row-count checks per table
- checksum or sample validation for critical tables
- rollback plan to prior SQLite deployment

No live cutover occurs without rehearsal in staging.

### 6.2 Compatibility

Older clients must continue to function during migration window if API contracts do not change. If a breaking change is necessary, version the API explicitly.

## 7. Realtime Scale-Out Requirements

- socket connections may land on different instances
- any instance must be able to route updates for a match through Redis coordination
- reconnect flow must work regardless of which instance receives the reconnect
- match state consistency must survive one app instance restart

Spectator and chat remain optional. If added, they must use the same coordination model and rate limiting.

## 8. Security and Privacy Requirements

- secure storage for mobile refresh tokens
- token revocation support
- Redis must not become a source of truth for durable user history
- Postgres backups and restore drills are mandatory
- production secrets must be managed outside the repo and rotated regularly

## 9. Deployment and Operations

### 9.1 Environment Variables

Add:

- `POSTGRES_URL`
- `REDIS_URL`
- `MOBILE_TOKEN_SIGNING_KEY`
- `SYNC_BATCH_LIMIT`

### 9.2 Observability

Expand observability to include:

- per-instance socket counts
- Redis publish and delivery latency
- Postgres query latency
- sync conflict rates
- mobile offline queue flush success rate

### 9.3 Release Process

The release process must include:

- staging deploy
- migration rehearsal
- App Store build generation for iPhone release
- smoke tests against web and iPhone package

## 10. Testing Strategy

### 10.1 Migration Tests

Cover:

- empty and populated SQLite migration to Postgres
- schema equivalence checks
- rollback rehearsal

### 10.2 Realtime Scale Tests

Cover:

- cross-instance match progress fanout
- reconnect on different server instance
- Redis interruption handling and graceful degradation

### 10.3 Mobile and Sync Tests

Cover:

- complete solo play offline on iPhone package
- queue local mutations while offline
- restore connectivity and flush successfully
- conflict resolution when server data changed while device was offline

### 10.4 End-to-End Tests

Cover:

- web user and iPhone user see consistent synced stats
- web and mobile can both join supported online features when connected
- mobile offline mode does not corrupt later cloud state

## 11. Acceptance Criteria

- Backend can run on multiple instances with Postgres and Redis.
- Live match coordination works across instances.
- iPhone deliverable supports full offline solo play and later sync.
- Mobile auth and sync are secure and measurable.
- The system remains a modular monolith rather than an unnecessarily fragmented platform.

## 12. Exit Criteria / Future Work Gate

Stage 6 is complete only when:

- multi-instance deployment is stable in production-like testing
- SQLite has been retired or reduced to local-only tooling
- the iPhone path is proven with offline play and delayed sync
- any decision to split services is backed by production evidence, not assumption
