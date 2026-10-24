# MVP Design: Conversation-Only Durable Pi Coding Agent App

## Goal

Deliver a conversation-first coding agent app built on `pi-durable`, runnable under Node 24, with a customizable Preact + `htm` UI (no build step), SQLite durability, single-owner access, and an extension seam. Source implementation is intentionally deferred.

## Reference Sources

- pi-pocket (launcher, server, extensions, architecture): https://github.com/TannerMidd/pi-pocket
- pi-durable (Harness/Conversation/Entry/SQLite): https://github.com/earendil-works/pi/tree/main/packages/durable


## Locked choices

- Frontend: Preact + `htm`, no bundler/build step.
- Database: SQLite (single local file).
- Auth: owner token only; one owner, no multi-user/RBAC.
- Launcher: the four access modes used by pi-pocket.
- Runtime: Node 24 only; no Python.
- Architecture: extension-first separation of concerns (core defines ports; features plug in).

## In scope (MVP)

- Four-mode startup launcher: this device, local network, Cloudflare Tunnel, Tailscale.
- Owner-token-gated API/UI.
- Durable conversation turns (resume/retry after interruption).
- SQLite stores conversations, messages, sessions, and run state.
- Conversation UI: message stream + composer, pi-TUI-like layout, theme/layout customizable.
- Session list: search, recent, folders, archived, new.
- Extension seam: install/enable/disable/replace extensions without core edits.

## Out of scope (post-MVP)

- Multiplayer, PiP, watches, memory systems, spend controls.
- Browser automation tools (provided later as an extension).
- Subagent/team orchestration (provided later as an extension).

## Architecture

1. **Launcher** selects one access mode and starts the HTTP server with the chosen bind address.
2. **Owner auth** middleware validates the owner token on every request.
3. **Durable harness** wraps agent turns through `pi-durable`.
4. **Store** (SQLite) is the single source for conversation/session/run state.
5. **UI** is served as static Preact/`htm` modules and talks to the API.
6. **Extension host** loads extensions implementing declared ports (`storage`, `ui`, `tooling`, `session`).

## Data model (MVP)

- `conversation`: id, title, folder, archived, created_at, updated_at
- `message`: id, conversation_id, role, content, created_at
- `run`: id, conversation_id, status, started_at, finished_at, error
- `session_index`: search helpers / cached metadata

## Security

- Owner token is generated on first run and stored server-side.
- Token is never logged; clients send it as a bearer token.
- No accounts, passwords, or role matrix in MVP.

## Durability

- Every turn is a durable run with persisted input/output.
- Interrupted runs can be resumed or retried from SQLite state.
- UI reflects run status: pending, running, completed, failed.

## Customization

- Themes/layouts are extension-provided.
- Core ships one default conversation layout only.

## Risks / open items

- pi-durable API shape must be verified before implementation.
- Tunnel/Tailscale integrations depend on host tooling.
- Exact extension manifest and loader still TBD.
