# Progress Tracker

## Project Status

- Current phase: Planning and foundation setup
- Last updated: 2026-06-20
- Owner: revana

## Milestones

1. M1 - Product and architecture planning
- Status: In Progress
- Tasks:
  - [x] Define product scope and phased roadmap
  - [x] Define Vercel-compatible architecture boundaries
  - [x] Define secure execution strategy
  - [ ] Finalize MVP feature list

2. M2 - MVP scaffold (Next.js + core pages)
- Status: Not Started
- Tasks:
  - [ ] Initialize app project structure
  - [ ] Build landing page shell
  - [ ] Build course listing page
  - [ ] Build lesson workspace shell

3. M3 - JavaScript execution MVP
- Status: Not Started
- Tasks:
  - [ ] Integrate editor
  - [ ] Implement browser-based JS run flow
  - [ ] Add lesson challenge checker

4. M4 - Auth and progress persistence
- Status: Not Started
- Tasks:
  - [ ] Add optional login flow
  - [ ] Persist user progress
  - [ ] Build progress dashboard

5. M5 - Security baseline
- Status: Not Started
- Tasks:
  - [ ] Add rate limiting
  - [ ] Add secure headers and CSP
  - [ ] Add audit logs for execution events

## Decision Log

- 2026-06-20: Chosen architecture is hybrid execution (browser + isolated server runner).
- 2026-06-20: Vercel is selected for core app deployment.
- 2026-06-20: Auth is optional for MVP, required for progress persistence.
- 2026-06-20: Content model is hybrid (repo content + dynamic user data).

## Current Blockers

- No blocker at planning stage.

## Next Actions

1. Confirm folder naming and repository layout preference.
2. Start M2 by scaffolding Next.js app in this folder.
3. Add initial route map for landing, courses, and lesson pages.
