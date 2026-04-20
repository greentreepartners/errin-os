@AGENTS.md

# errin-os — agent guardrails

This file is permanent repo guardrails for any Claude Code session working in this repo. Read it once at the start of every new session. `DECISIONS.md` is the canonical architecture record. Do not relitigate decisions here — escalate to the Strategy project.

## Reading order for new sessions

1. `DECISIONS.md` — architecture, phases, rationale
2. `VISIBILITY.md` — public/private policy, RLS, UI requirements
3. `SCHEMA.sql` — database shape
4. This file — operational rules

## Hard rules (verbatim from DECISIONS.md)

1. **No relitigating decisions in this file.** If a decision needs revisiting, escalate to the Strategy project. PM project does not pivot architecture.
2. **No real names, financials, or sensitive details in `public` data.** Ever. The visibility flag is the gate.
3. **No new features in v1.** Tasks, statuses, workstreams, gates, dependencies, badges. That is the whole job. Suggestions go to a `FUTURE.md` log, not the build.
4. **Boring infrastructure aesthetic.** If anything starts looking like a fintech homepage or AI-generated SaaS, call it out and revert.
5. **Build sequence is sacred.** Phase 0 → 1 → 2 → 3 → 4. Skipping is the documented #1 failure mode.

## Visibility default

New tasks, new Markdown content, new anything — **private by default**. You publish individually after deliberate review. You never bulk-publish. When in doubt: **private**. Full policy in `VISIBILITY.md`.

Names, financial figures, client details, anything embarrassing-if-screenshotted — stays private. Full stop.

## Plan-Mode-then-APPROVED pattern

Anything touching multiple files, schema, auth, or configuration requires **Plan Mode** first (Shift+Tab twice). Produce a plan file, await review, then execute. Single-sentence diffs (rename a variable, fix a typo) may skip Plan Mode.

**Never run `git add`, `git commit`, or `git push` until the operator replies with the literal word `APPROVED`.** A clean build is not permission to commit. A green test suite is not permission to commit. Only `APPROVED` is permission to commit. If unsure, ask.

If a stop condition fires mid-execution, STOP and report. Do not improvise around it.

## Scope

This repo is errin-os: Next.js dashboard at `errin-os.netlify.app` (public read) and `/admin` (auth-gated write), backed by Supabase. Claude is the build agent. Everything else is out of scope until `DECISIONS.md` says otherwise.
