# Use SQLite as the single durable store for MVP

For MVP, all conversation, message, session, and run state is stored in one local SQLite file. SQLite is chosen over a networked database or multiple stores because the app is single-owner and local-first, reducing operational overhead while keeping state portable and durable.

**Status:** accepted

**Considered options:** PostgreSQL (rejected for operational overhead in MVP), in-memory plus JSON files (rejected for weaker durability/resume guarantees).
