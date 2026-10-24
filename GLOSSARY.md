# Pi OS App (MVP)

Conversation-only durable coding agent app for a single owner.

## Language

**Conversation**:
A durable thread of user and agent messages tied to one owner workspace.
_Avoid_: Chat, thread

**Session**:
The stored conversation record shown in the session list.
_Avoid_: Conversation view, tab

**Message**:
One user or agent entry inside a session.
_Avoid_: Turn output, bubble

**Turn**:
One user input plus its resulting agent response cycle.
_Avoid_: Request, job

**Owner**:
The single operator who controls the app.
_Avoid_: User, account, admin

**Owner Token**:
The single secret that grants full app access as the owner.
_Avoid_: Password, API key, session cookie

**Launcher**:
The startup flow that chooses how devices reach the app.
_Avoid_: Server start, bootstrap

**Access Mode**:
One of four launcher choices: this device, local network, Cloudflare Tunnel, Tailscale.
_Avoid_: Transport, host mode

**Durable Run**:
A persisted agent turn execution that can resume or retry after interruption.
_Avoid_: Task, job, process

**Extension**:
A pluggable module implementing one of the app's capability ports.
_Avoid_: Plugin, addon

**Capability Port**:
A named interface an extension can implement without changing core.
_Avoid_: Hook, service

**Run Status**:
One of pending, running, completed, failed.
_Avoid_: State, lifecycle
