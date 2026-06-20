# Copilot Bridge

Copilot Bridge is a VS Code extension that exposes a local web UI for running reusable prompt commands against GitHub Copilot using the official `vscode.lm` API.

## What it does

- Serves a local UI at `http://localhost:3456`.
- Reads active editor and debug context from VS Code.
- Streams Copilot responses through Server-Sent Events (SSE).
- Supports a command library with custom templates and variables.

## Core Endpoints

- `GET /` -> web UI
- `GET /health` -> extension/model availability
- `GET /context` -> live editor/debug context
- `GET /commands` -> list saved commands
- `POST /commands` -> create/update command
- `DELETE /commands/:id` -> delete command
- `POST /commands/reset` -> reset default commands
- `POST /chat` -> stream Copilot response

## Current Security Baseline

- Body size limit for API requests (`1MB`).
- Input validation for command save and chat requests.
- Safer response headers (`nosniff`, `no-store`).
- Diagnostics are only included when explicitly requested.

## Next Milestones

1. Add API auth token to protect local endpoints.
2. Add command import/export.
3. Add prompt history and replay.
4. Add test coverage for endpoint validation.
