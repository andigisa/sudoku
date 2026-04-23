# Stage 1 Specification: Solo MVP, Guest-Only, Offline-Capable

## 1. Goal and Release Outcome

Stage 1 delivers the first public product: a single-player Sudoku web application that can be deployed as one Node.js application on basic Hostinger Node hosting. The release must be usable on desktop and mobile browsers, must not require login, and must support installable offline-capable usage on iPhone and Android through PWA behavior.

The core outcome is simple: a new user can open the site, start an easy puzzle immediately, solve it with a polished game UI, and reopen the app later to continue or start a new game without server-side identity.

## 2. Scope Included / Explicitly Excluded

Included:

- Guest-only play
- Classic 9x9 Sudoku only
- Difficulty selection: `easy`, `medium`, `hard`, `expert`
- Board interactions: enter value, erase, notes, undo, redo
- Conflict highlighting and same-number highlighting
- Timer, pause, restart, new game
- Mobile number pad and desktop keyboard support
- Local persistence for in-progress game, settings, and local history
- PWA installation and offline use after first successful load

Excluded:

- Accounts and cloud sync
- Daily challenge
- Server-side sessions or persistent stats
- Tournaments and leaderboards
- Realtime or multiplayer
- Monetization

## 3. System Architecture for This Stage

### 3.1 Runtime Topology

Deploy a single Node.js process that:

- serves the built React frontend
- exposes a minimal REST API
- serves static puzzle pack data
- provides health endpoints

No external infrastructure is allowed in this stage. No Redis, no Postgres, no background workers, no cron dependency.

### 3.2 Repository and Module Layout

The implementation should be structured as a pnpm workspace with these directories:

- `apps/web` for the React frontend
- `apps/server` for the Fastify server
- `packages/domain` for Sudoku engine and game-state logic
- `packages/contracts` for shared API schemas and type definitions

`packages/domain` must be pure TypeScript without browser-only or Node-only dependencies. This is required so the same logic can later be reused for an iPhone app.

### 3.3 Technology Decisions

- Frontend: React + TypeScript + Vite
- PWA: `vite-plugin-pwa`
- Backend: Fastify + TypeScript
- Validation: Zod
- Local persistence: IndexedDB via Dexie
- Testing: Vitest + React Testing Library + Playwright

## 4. Frontend Requirements

### 4.1 Main Screens

Implement these screens:

- Home screen with difficulty selection and “Continue” when a saved game exists
- Game screen with 9x9 board, toolbar, timer, and number pad
- Settings panel with at least sound toggle placeholder, highlight toggle, conflict toggle

### 4.2 Board Behavior

The board must support:

- selecting one cell at a time
- writing fixed values only to non-given cells
- note mode and pen mode
- per-cell candidate notes from 1 to 9
- undo and redo for all mutable user actions
- row, column, and box highlighting for selected cell
- same-digit highlight for current selected value
- invalid move/conflict highlighting without blocking input

The game must not auto-solve or auto-fill candidates in this stage.

### 4.3 Offline and Local Persistence

Use IndexedDB for:

- active game snapshot
- move history needed for undo/redo recovery
- recent completed games summary
- client settings

Service worker responsibilities:

- cache app shell
- cache static assets
- cache puzzle pack requests

The app must still launch when the network is unavailable after the first successful load.

## 5. Backend and API Requirements

### 5.1 Endpoints

Implement:

- `GET /healthz`
- `GET /api/v1/puzzles/random?difficulty=easy|medium|hard|expert`

### 5.2 Puzzle API Contract

Response body:

```json
{
  "puzzle_id": "easy-000123",
  "givens": "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
  "difficulty": "easy",
  "generator_version": "pack-v1",
  "solution_checksum": "sha256:..."
}
```

Rules:

- `givens` is an 81-character string using `0` for empty cells
- do not return the full solution in Stage 1
- `solution_checksum` is used only for internal completion validation if needed later

### 5.3 Puzzle Source

Do not build the generator in this stage. Use pre-generated puzzle packs committed into the repository or generated ahead of time and imported as versioned JSON files. Each pack must contain enough puzzles per difficulty for repeated testing and MVP usage.

## 6. Data Model and Persistence

### 6.1 Client-Side Models

Define these client-side entities:

- `PuzzleDefinition`
- `GameState`
- `CellState`
- `Move`
- `GameSettings`
- `CompletedGameSummary`

### 6.2 Domain Rules

`packages/domain` must implement:

- parse and validate puzzle strings
- immutable board update functions
- candidate note operations
- conflict detection
- solved-state detection
- move history serialization

The frontend must use domain functions directly instead of duplicating Sudoku rules in UI components.

## 7. Security and Privacy Requirements

- No secrets embedded in frontend bundles
- Strict input validation for difficulty parameter
- CSP configured for self-hosted assets only
- No third-party analytics in this stage
- No personal data beyond anonymous local device storage

## 8. Deployment and Operations

### 8.1 Build and Deploy

The deliverable is one Node.js application artifact. The server serves the frontend build from disk. Build output must run with:

```bash
pnpm install
pnpm build
pnpm start
```

### 8.2 Environment Variables

Support only:

- `NODE_ENV`
- `PORT`
- `APP_BASE_URL`

### 8.3 Observability

Minimum logging:

- startup success
- request method, path, status, duration
- unhandled exceptions

## 9. Testing Strategy

### 9.1 Unit Tests

Cover:

- puzzle parsing
- legal and illegal cell updates
- note mode behavior
- undo/redo stack behavior
- conflict detection
- solved-state detection

### 9.2 Component Tests

Cover:

- cell selection
- number pad input
- mode switching
- conflict rendering

### 9.3 End-to-End Tests

Using Playwright:

- load home page and start easy game
- fill several cells and reload page, verify resume
- complete a known easy puzzle
- install or simulate offline mode, relaunch app without network

## 10. Acceptance Criteria

- A user can start a new game in fewer than three interactions from the home page.
- The game UI is usable on iPhone Safari and desktop Chrome.
- An active game survives page reload and browser restart on the same device.
- The app launches after first load even when the network is unavailable.
- All core game behavior is covered by automated unit tests.

## 11. Exit Criteria to Start Stage 2

Stage 1 is complete only when:

- the codebase is split into web, server, domain, and contracts modules
- the PWA works on iPhone home screen installation
- there is a stable puzzle encoding format
- there is no duplicated Sudoku rule logic between UI and server
- CI runs lint, unit tests, and Playwright smoke tests on every change
