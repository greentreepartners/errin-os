# PM playbook — guidance for the PM chat

This file is for the PM chat authoring briefs for Claude Code sessions in this repo. Claude Code itself reads `CLAUDE.md` — not this file. This is the PM-facing companion: conventions, boilerplate, and the trust ladder that govern how briefs are written.

Read once at the start of any PM chat that will produce a Claude Code brief.

## 2.1 Constraint marking convention

Every numeric or behavioural constraint in a Claude Code prompt must be tagged explicitly:

- `[HARD]` — stop and ask if reality differs at all from prediction
- `[SOFT — guidance only]` — proceed if reality is close; flag in the report

Ambiguous constraints in Brief 1A caused both a deviation past a hard rule (the `/tmp` move) and an unnecessary stop on a soft rule (README at 24 vs ~30 lines). Tagging removes the guesswork.

## 2.2 Standard stop-condition boilerplate

Every Claude Code prompt ends with this exact paragraph (copy verbatim):

> If reality differs from the plan's predictions in any way — file conflict count, command output, error messages, file presence, dependency versions, anything — STOP and ask before improvising. "Unexpected behavior" includes anything not explicitly enumerated in the plan. Never run `git add`, `git commit`, or `git push` until the operator replies with the literal word `APPROVED`. A clean build is not permission to commit.

## 2.3 Pre-decided plan elements

The PM chat must pre-decide and specify in the brief, not leave for the agent to ask mid-plan:

- **Page rendering mode** for any new page (`force-dynamic`, static, or ISR with `revalidate`)
- **Commit message subject and body content** (just the text — the procedure for writing the message is already in `CLAUDE.md` Section 1.1)
- **Whether commit + push is one approval gate or two**
- **Environment variable assumptions** (presence, format, location)

Leaving these open mid-brief forces the agent to guess or the operator to arbitrate live.

## 2.4 Trust ladder

| Tier | Pattern | Examples |
|---|---|---|
| **1 — Direct execute** | Claude Code goes alone, no Plan Mode, no PM chat | Renames, typos, formatting, "show me the file", "run the tests", reversible-with-one-git-command |
| **2 — Plan Mode, operator approves** | Claude Code plans, operator reads and approves, no PM chat | Refactors in one file, conventional new components, obvious bug fixes, dependency bumps |
| **3 — Plan Mode, plan routed through PM chat first** | PM chat reviews the plan before `APPROVED` | Anything touching `DECISIONS.md` / `SCHEMA.sql` / `VISIBILITY.md` / `CLAUDE.md`, anything touching auth/RLS/env vars, anything that defines a pattern future code copies, phase boundaries, first-time-using-X |
| **4 — Strategy project, not PM** | Out of PM scope entirely | Architectural decisions, pivots, anything that would amend `DECISIONS.md` materially |

Current defaults by phase:

- **Phase 1:** Tier 3 default.
- **Phase 2:** Tier 3 for auth / RLS / secrets, Tier 2 for everything else (revisit after 2A ships).
- **Phase 3+:** TBD as patterns prove themselves.

## 2.5 Brief-time tracking

Each brief's **predicted vs actual operator time** goes into the running table maintained in handoff docs. After three data points beyond Brief 1B, variance bounds should tighten enough to give realistic "weeks to MVP" numbers.

Columns to maintain per brief: predicted operator minutes, actual operator minutes, delta, notes on what drove the delta.

## 2.6 Truncated permission dialogs

If a Claude Code permission dialog truncates a chained command such that the operator (or PM chat reviewing) cannot see:

- the full command from start to finish
- any predicted values (line counts, expected output sizes) used as gates
- what runs after any verification gate

...then deny the action and require the agent to show the full command structure in its conversation output before re-attempting. The dialog is a UI artifact; the agent's prose is the source of truth. Approving an opaque chained command violates the Tier 3 review-each-action contract.

## 2.7 Deferred-verification flag for shipped-but-unrendered code

If a brief ships CSS classes, code branches, or rendering paths that the brief's own verification cannot exercise (e.g. a dashed-border class for private cards, but the brief renders only public cards), the brief must:

1. Name the deferred verification explicitly in scope notes
2. Identify which downstream brief will first exercise the path
3. The downstream brief must include an explicit verification step for the deferred path

This prevents code from shipping that no one ever proves works until production reveals the bug.

## 2.8 Corrections

**Netlify push-to-live timing.** Netlify push-to-live is near-realtime (under a minute typical). The "~20 minute" figure originally documented in the Phase 1 handoff was actually brief-to-brief total elapsed time, not push-to-live, and was recorded in error. Correction made April 2026 during Brief 2A-1.

---

*PM playbook created April 2026 at end of Brief 1. Update when patterns change.*
