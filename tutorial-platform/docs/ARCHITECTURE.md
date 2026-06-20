# Architecture

## High-Level Components

1. Client App (Next.js on Vercel)
- Landing pages
- Course pages
- Learning workspace
- User dashboard

2. App APIs (Next.js API routes)
- Auth/session endpoints
- Course metadata endpoints
- Progress and attempts endpoints
- Execution orchestration endpoint

3. Data Services
- PostgreSQL: users, progress, attempts, course metadata pointers
- Redis: rate limits, short-lived run tokens

4. Execution Services
- Browser sandbox: JavaScript (primary), Python (Pyodide)
- External runner: Java/C++/Go and advanced workloads

## Execution Security Model

- Treat all code as untrusted.
- Enforce per-run limits: CPU, memory, wall-time, output size.
- Disable outbound network by default.
- Use ephemeral runtimes with no persistence.
- Use signed request tokens and strong input validation.
- Log all runs with correlation IDs.

## Data Model (Initial)

- users
- courses
- modules
- lessons
- lesson_exercises
- user_progress
- exercise_attempts

## Vercel Fit

What stays on Vercel:

- Frontend rendering
- Standard app APIs
- Auth and progress operations

What should not run on Vercel:

- Long-lived or heavy untrusted code execution sandboxes

## Expansion Strategy

- Keep language execution behind a provider interface.
- Add language adapters one at a time.
- Preserve common lesson schema across languages.
