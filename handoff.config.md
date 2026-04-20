---
project: errin-os
repo: https://github.com/greentreepartners/errin-os
handoff_dir: handoffs/
roles:
  - strategy
  - delivery
  - daily-ops
canonical_docs:
  - DECISIONS.md
  - VISIBILITY.md
  - SCHEMA.sql
  - PHASE_0_CHECKLIST.md
  - GSTACK_PM_INSTRUCTIONS.md
successor_must_read:
  - DECISIONS.md
  - VISIBILITY.md
---

# errin-os — handoff config

This file is read by the `handoff` skill at the end of every chat in any errin-os project.

**Repo:** errin-os (public)
**Roles in use:**
- `strategy` — GSTACK CEO brain. Architecture decisions, scope, red-teaming.
- `delivery` — GSTACK PM brain. Build execution, deployment, debugging.
- `daily-ops` — light brain for daily task management (set up later).

**Canonical reads for any successor chat:**
- `DECISIONS.md` — locked architecture decisions D1-D11+
- `VISIBILITY.md` — public/private policy, never violate

**Role-specific successor reads (handled by each chat's system prompt):**
- Strategy: `GSTACK_CEO_INSTRUCTIONS.md` (in project knowledge, not repo)
- Delivery: `GSTACK_PM_INSTRUCTIONS.md` (in repo + project knowledge)
- Daily Ops: TBD when set up

**Handoff convention:**
- Path: `handoffs/`
- Filename: `YYYY-MM-DD-HHmm-[role].md`
- Sortable. Greppable. One folder, all roles, all time.
