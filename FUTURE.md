# FUTURE.md

Deferred items. Nothing here is in scope for v1. Entries explain what and why; the how waits for the phase that picks them up.

## Effort/impact/horizon editing on admin task cards

**Surfaced:** 2026-04-20 during Brief 2B operator verification.
**Why deferred:** Brief 2B explicitly excluded these fields from the four write actions. Phase 2 done-criterion was met without them.
**Phase candidate:** Phase 4 (post-real-data-migration). Designing the edit UX after seeing real-task patterns is better than guessing in advance.
**Scope when picked up:** Editable controls (dropdown or cycle pill — decide at design time) for effort, impact, horizon on AdminTaskCard. Add the three fields to AddTaskForm. PATCH handler whitelist already accepts them — no API change required.
