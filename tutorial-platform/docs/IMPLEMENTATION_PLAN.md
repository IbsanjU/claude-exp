# Implementation Plan

## Product Vision

Create a multi-language tutorial platform with:

- Landing page for discovery and conversion.
- Course learning flow with lessons and exercises.
- Secure code execution.
- Optional authentication for saved progress.

## Deployment Constraint

- Primary app deployment target: Vercel.
- Untrusted server-side code execution must run outside Vercel in an isolated runner.

## Architecture Plan

1. Web App (Vercel)
- Next.js frontend and API routes.
- Landing pages, course UI, dashboard, editor workspace.

2. Data Layer
- PostgreSQL for users, courses, progress, attempts.
- Redis for rate limiting and short-lived execution metadata.

3. Code Execution Layer
- JavaScript: browser execution sandbox.
- Python (basic): browser execution via Pyodide.
- Java/C++/Go (and advanced Python): external isolated execution service.

4. Security Layer
- Strict rate limiting.
- Signed execution tokens.
- Execution timeout/memory/output limits.
- No outbound network by default in runner.
- Non-root, ephemeral runtime, dropped capabilities.

## Phased Delivery

### Phase 1: MVP (JavaScript First)

Deliverables:

- Landing page.
- Course catalog and lesson pages.
- Interactive code editor + run/check for JavaScript in browser.
- Optional login.
- Progress tracking dashboard.

Acceptance criteria:

- User can complete at least one full JavaScript beginner course.
- Progress persists for logged-in users.
- Anonymous users can still try lessons.

### Phase 2: Python + Better Assessment

Deliverables:

- Python execution using Pyodide.
- Improved challenge checker and test cases.
- Better analytics around lesson attempts.

Acceptance criteria:

- User can run Python beginner exercises without server execution.

### Phase 3: External Secure Runner

Deliverables:

- Isolated execution service integration for Java/C++/Go.
- Queueing and abuse controls.
- Observability and alerting for runner events.

Acceptance criteria:

- Untrusted code execution remains isolated from Vercel app.
- Per-run isolation and hard limits are enforced.

### Phase 4: Playwright Track

Deliverables:

- Playwright learning path.
- Controlled browser automation labs.
- Predefined fixtures and task checker.

Acceptance criteria:

- Users can complete browser automation exercises safely.

## Technical Work Breakdown

1. Foundation
- Initialize Next.js app and workspace conventions.
- Add linting, formatting, and CI checks.
- Configure environment strategy (dev/stage/prod).

2. Course System
- Define course content schema (MDX + metadata).
- Build parser/loader.
- Render lesson pages and module navigation.

3. Learning Workspace
- Monaco editor integration.
- Console/output panel.
- Run/Reset/Check action flows.

4. Auth and Progress
- Optional login provider.
- Progress APIs and dashboard UI.
- Save attempt history.

5. Security Hardening
- API rate limiting.
- CSP and secure headers.
- Audit logging and abuse throttling.

## Risks and Mitigations

- Risk: Attempting to run arbitrary code inside Vercel.
  - Mitigation: Browser execution first; isolated runner for server languages.

- Risk: Abuse/spam of execution endpoints.
  - Mitigation: Redis rate limiting, user quotas, cooldown windows.

- Risk: Curriculum maintenance complexity.
  - Mitigation: Hybrid content model (MDX in repo + DB for user state).

## Definition of Done for MVP

- Public landing page is live on Vercel.
- One complete JavaScript beginner course is available.
- Interactive editor supports run/check/reset.
- Optional login works.
- Progress persists and renders in dashboard.
- Basic observability and abuse controls are active.
