# Repository Guidelines

## Project Structure & Module Organization

This repository is currently documentation-first. The main project artifact is [`PRD.md`](/Users/andreashaag/Desktop/code/sudoku/PRD.md), which defines the product scope, gameplay features, and proposed architecture for the Sudoku web app.

Keep the repository root clean. Until the application is scaffolded, place new planning or architecture documents next to `PRD.md` only when they affect the whole project. When implementation begins, group code by concern at the top level, for example `frontend/`, `backend/`, and `infra/`, instead of mixing source files into the root.

## Build, Test, and Development Commands

No build, test, or runtime scripts are configured in this checkout yet. Before adding tooling, prefer simple, explicit commands:

- `ls -la` to inspect the current workspace
- `rg --files` to list tracked project files quickly
- `sed -n '1,120p' PRD.md` to review the product spec in slices

If you add an app scaffold, also add the corresponding documented commands here, such as `npm run dev`, `npm test`, or `make test`.

## Coding Style & Naming Conventions

Use Markdown headings, short paragraphs, and task-focused language for documentation. Keep filenames descriptive and lowercase with hyphens when adding new docs, for example `architecture-overview.md`.

For source code introduced later, follow the formatter and linter of the chosen stack and commit their config with the first code scaffold. Avoid ad hoc style rules that are not enforced by tooling.

## Testing Guidelines

There is no automated test suite yet. Any future implementation should ship with tests in the same change that adds behavior. Name test files after the unit under test, such as `board-state.test.ts` or `matchmaking.spec.ts`.

Document how to run the test suite in this file as soon as a framework is added.

## Commit & Pull Request Guidelines

Git history is not available in this workspace, so no existing commit convention can be inferred here. Use short, imperative commit subjects, for example `Add multiplayer match state diagram`.

Pull requests should include:

- a concise summary of what changed
- the reason for the change and any PRD section affected
- screenshots or diagrams for UI/architecture updates
- follow-up work or open questions, if any

## Security & Configuration Notes

Do not commit secrets, production credentials, or ad-hoc environment files. If runtime configuration is introduced later, provide a checked-in example file such as `.env.example` and document each required variable.
