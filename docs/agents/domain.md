# Domain docs

Layout: **single-context**.

- `GLOSSARY.md` at repo root holds canonical domain terms.
- `docs/adr/` at repo root holds Architecture Decision Records, numbered `0001-`, `0002-`, etc.
- `docs/agents/domain.md` consumer rules for domain-modeling skill.

## Consumer rules

- Read `GLOSSARY.md` before changing domain-relevant code; treat it as source of truth for terminology.
- When defining or renaming a domain term, add/update the entry in `GLOSSARY.md` via `domain-modeling` skill.
- ADRs in `docs/adr/` record consequential architecture decisions; create one with the skill when a decision is hard to reverse.
