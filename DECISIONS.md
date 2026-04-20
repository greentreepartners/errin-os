# Architecture Decisions — Life CEO Dashboard (errin-os)
**Owner:** Errin Henderson
**Date:** April 2026
**Status:** Locked. No more pivots. Build phase.

This file is the bootstrap document for any new chat working on this project. Read it first. The decisions below are settled. If a future chat wants to revisit one, it must escalate to the CEO project — not relitigate inside the PM project.

---

## The model in one paragraph

A personal operating system. Supabase (Postgres) is the task database. Markdown files in the dashboard repo are the project knowledge base. A Next.js dashboard at `errin-os.netlify.app` is the operational surface — public read view at root, auth-gated write surface at `/admin`. Claude is the agent — per-project Claude projects bootstrap from the relevant Markdown brain on each new chat, write task updates to Supabase via skill, write knowledge updates to Markdown via Claude Code. Three tools, three jobs, no overlap.

---

## Architecture decisions

### D1 — Supabase as task database
**Decision:** Postgres via Supabase. Free tier. Project name `errin-os`. Project ID `cxxjnkwjcpllcuzxtees`.
**Rationale:** Real database. No rate-limit anxiety. SQL when we need it. Migration story is `pg_dump` if we ever leave. Stronger portfolio signal than Notion or Airtable for the AI-First PM positioning.
**Rejected:** Linear (lock-in, doesn't tell our story), Notion (rate limits, knowledge/task hybrid was tempting but task UX is weak), Airtable (1000-record free tier cap, weakest portfolio signal), JSON-in-repo (doesn't scale, no relations).

### D2 — Markdown-in-repo for project knowledge
**Decision:** Per-project knowledge lives as Markdown files in the dashboard repo under `/projects/<slug>/`. Decisions, current state, artifacts.
**Rationale:** Version-controlled. Greppable. Portable. Lives in the same workflow as the code (Claude Code + git). Doesn't require a separate tool.
**Rejected:** Notion as knowledge store (would have needed to keep two systems in sync via different APIs).

### D3 — Next.js for the dashboard
**Decision:** Next.js, not plain HTML+JS.
**Rationale:** The auth layer for `/admin` is materially easier in Next.js. Server-side Supabase reads. Stronger portfolio signal than a static HTML site.
**Cost:** ~1 hour more setup than plain HTML. Pays back in Phase 2.

### D4 — Auth via Supabase magic link
**Decision:** Admin route uses Supabase Auth with magic link to Errin's email.
**Rationale:** Reuses Supabase project we're already running. One fewer service. No password. Mobile-friendly. Secure enough for a personal OS.
**Rejected:** Netlify Identity (separate service, deprecated direction), passkey (more setup for marginal gain at this stage).

### D5 — Public repo, hybrid private folder
**Decision:** GitHub repo is public. Sensitive content lives in `/private/` paths that are gitignored.
**Rationale:** Public repo doubles as portfolio artifact. Decision logs and TDR-like writeups become recruiter signal. Sensitive data stays off the internet entirely (not just hidden in the UI).

### D6 — Visibility as a first-class concern
**Decision:** Every task and project has a required `visibility` field with values `public` or `private`. No null state. Default for new tasks is **private**.
**UI requirements:**
- Visibility status is shown on every card via both border treatment (solid = public, dashed = private) AND a persistent badge ("PUBLIC" / "PRIVATE")
- Toggle visibility from the card itself, one click, no modal
- Public dashboard view shows "Showing X of Y tasks. Z tasks are private." in the footer — honest about curation
- Admin UI has a persistent reminder somewhere visible: "New tasks are private by default. Publish individually."

**Rationale:** The cost of an accidental leak (named hiring manager, financial figure) is much higher than the cost of forgetting to publish. Default-private is the conservative posture. Visibility must be glanceable, never hidden in a detail pane.

### D7 — Two URLs, not one
**Decision:** `errin-os.netlify.app` is the public read-only portfolio view. `errin-os.netlify.app/admin` is the auth-gated write surface.
**Rationale:** Different jobs deserve different surfaces. Public view optimised for "recruiter clicks a link." Admin view optimised for "Errin manages tasks on his phone." Trying to do both in one UI would compromise both.

### D8 — Aesthetic baseline
**Decision:** Visual language is `execution-co.netlify.app`. Black on cream. Bold typography. Flat surfaces. No gradients. No glow. No fintech energy.
**View pattern:** The "Talent Agent" view Errin built in chat is the template — gate banner at top, stat row, legend, filter pills, then sections (Gate → Motion A → Motion B → Motion C for Career), cards with checkbox + ID + title + one-line operating note + right-aligned badge stack (horizon, effort, impact).

### D9 — Three Claude projects, three altitudes
**Decision:**
- **Strategy project** (this chat's lineage) — architecture, scope, red-teaming, pivots. GSTACK CEO instructions.
- **Delivery project** (new) — executes builds via Claude Code, manages task lifecycle, escalates scope ambiguity. GSTACK PM instructions.
- **Daily Ops project** (later, when needed) — quick task adds, status updates, daily briefings. Lighter system prompt.

They communicate via the brain (Supabase + Markdown). No direct messaging.

### D10 — Sample data first, real data later
**Decision:** Build the pipeline with deliberately fake sample tasks (6 across 3 projects, each exercising a specific schema feature). Migrate real task inventory only after the read+write+display pipeline is proven end-to-end.
**Rationale:** Reconciling the real task list (which is currently stale in the context doc and accurate only in screenshots) is a separate concern from proving the data layer. Don't conflate them.


### D11 — Claude Code in the desktop app as the execution surface

**Decision:** All build work for errin-os happens in **Claude Code inside the Claude desktop app** (the Code tab), not Cursor, not the standalone CLI as primary, not Cowork.

**Rationale:**
- Replicates the Cursor Plan/Agent workflow via Plan Mode (Shift+Tab twice) — read-only scoping phase before execution, with editable plan artifact, structurally equivalent to Cursor's Plan pane even though it's a mode toggle rather than a literal pane split.
- Single-app surface for the whole project: Strategy chat, PM chat, and building all live in the same Claude desktop window in different tabs. Less context-switching, cleaner mental model.
- Mobile Dispatch supported — start a task on phone, complete on desktop. Useful for the "mark a task done from anywhere" pattern.
- Stronger portfolio story: Claude ecosystem end-to-end, no third-party IDE in the credit line. Reinforces the AI-First PM positioning.
- CLI remains available for terminal-native work via `/desktop` handoff. Not blocked from dropping to CLI when needed.

**Rejected alternatives:**
- **Cursor:** Plan/Agent panes are excellent, but using a non-Anthropic tool dilutes the "I run my work inside the Claude ecosystem" portfolio claim that the dashboard itself is meant to demonstrate.
- **Claude Code CLI as primary:** Identical capability, but loses the visual surface (server preview, diff review, PR status) that the desktop app provides. Available as fallback via `/desktop`.
- **Cowork:** Built for non-coding knowledge work (file organisation, report drafting). Anthropic's own positioning excludes engineering use cases. Wrong tool.

**Trade-offs accepted:**
- No literal side-by-side panes — Plan and execution share the surface, separated by mode rather than layout. Acceptable since Errin vibe-directs rather than hand-editing code.
- No IDE features (multi-cursor, language server polish, etc.). Not relevant for this build.

**Operational note for the PM project:** Plan Mode is the default for any non-trivial change. Single-sentence diffs (rename a variable, fix a typo) skip Plan. Anything touching multiple files, anything modifying schema, anything involving the auth flow — Plan Mode first, review the plan, then execute.

---

*D11 added April 2026 — execution surface unblocked, Phase 1 ready to start.*






---

## Open questions deferred (not blockers)

These don't block Phase 0 or Phase 1. Resolve when relevant.

- **Mobile-specific UI** for the admin surface — design when Phase 3 starts
- **Skill design** — direct Supabase REST from skill vs MCP server vs Claude Code intermediary — decide in Phase 4
- **Daily briefing format** — only relevant when Daily Ops project is set up
- **Custom domain** — Supabase paid tier requires it for vanity URL on the database; not needed for v1

---

## What success looks like (definition of done per phase)

| Phase | Done when |
|---|---|
| Phase 0 | Supabase schema deployed, sample data seeded, repo + Netlify connected, PM project ready to receive build instructions |
| Phase 1 | Public dashboard at `errin-os.netlify.app` reads sample data from Supabase and renders the Talent Agent view at execution-co fidelity |
| Phase 2 | `/admin` route gated by Supabase magic-link auth, write actions update Supabase, changes reflect on public view |
| Phase 3 | Claude PM project can add/update/check off tasks via skill, real task inventory migrated from screenshots, sample data removed |
| Phase 4 | Errin uses the dashboard as primary task surface for one full week without friction |

---

## Hard rules — apply to all chats touching this project

1. **No relitigating decisions in this file.** If a decision needs revisiting, escalate to the Strategy project. PM project does not pivot architecture.
2. **No real names, financials, or sensitive details in `public` data.** Ever. The visibility flag is the gate.
3. **No new features in v1.** Tasks, statuses, workstreams, gates, dependencies, badges. That is the whole job. Suggestions go to a `FUTURE.md` log, not the build.
4. **Boring infrastructure aesthetic.** If anything starts looking like a fintech homepage or AI-generated SaaS, call it out and revert.
5. **Build sequence is sacred.** Phase 0 → 1 → 2 → 3 → 4. Skipping is the documented #1 failure mode.

---

*This file is the canonical architecture record. All other docs reference this one.*
