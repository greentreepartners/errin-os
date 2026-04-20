# Visibility Policy — errin-os

**This is a hard rule. Apply it without exception.**

The dashboard is public-facing infrastructure. Anything tagged `public` may be screenshotted, indexed, or shared. Anything tagged `private` is for the operator only.

---

## The default

**New tasks are private. Always. No exceptions.**

You publish individually after deciding a task is safe to expose. You never bulk-publish. You never assume something is fine to make public — you make a deliberate decision per task.

The cost of an accidental leak (named hiring manager, financial figure, sensitive client detail) is much higher than the cost of forgetting to publish a task that would have been fine. Default-private is the conservative posture by design.

---

## What can be public

- Task titles and descriptions that demonstrate **how the system works** without exposing **who or what it touches**
- Methodology framing — motion taxonomy, gate logic, badge taxonomy, dependency reasoning
- Done items where the work is now public anyway (e.g. published LinkedIn post)
- Generic operating notes ("subject line is the artifact link, not 'opportunity'")

## What must stay private

- Names of specific people (hiring managers, recruiters, clients, family)
- Names of specific companies in negotiation contexts
- Financial figures of any kind — salary, bonus, cashflow, savings
- Sensitive client information from current engagements
- Anything that would embarrass anyone if screenshotted and shared

When in doubt: **private.**

---

## How visibility shows in the UI

Visibility is a first-class concern. It must be glanceable on every card without opening anything.

**Required UI treatments:**

1. **Border treatment** — public tasks have a solid border. Private tasks have a dashed border. Visible at any zoom level across the whole board.
2. **Persistent badge** — small `PUBLIC` or `PRIVATE` pill in a fixed position on every card. Never hidden, never on hover.
3. **Toggle from the card** — one click on the badge flips visibility. No nested menu, no modal, no confirm dialog (the dashed/solid border is the confirmation).
4. **Public dashboard footer** — always shows "Showing X of Y tasks. Z tasks are private." Honest about curation.
5. **Admin UI reminder** — somewhere persistently visible: "New tasks are private by default. Publish individually."

These treatments are non-negotiable. If a UI iteration removes them, it gets reverted.

---

## How visibility works in the data layer

Visibility is enforced at **two levels**:

1. **Project level** — a project is `public` or `private`. If the project is private, none of its tasks appear on the public view, regardless of individual task visibility.
2. **Task level** — within a public project, individual tasks can be public or private. Only public tasks in public projects appear on the public view.

This is enforced by Row Level Security policies on the Supabase tables, not just by the application layer. Even if the app has a bug, the database refuses to return private rows to unauthenticated requests.

The truth table:

| Project visibility | Task visibility | Appears on public view? |
|---|---|---|
| public | public | Yes |
| public | private | No |
| private | public | No |
| private | private | No |

---

## How visibility works for project knowledge (Markdown)

The repo is public. Knowledge folders use the same convention:

```
/projects/career/
  ├── public/                ← committed, visible on GitHub
  │   ├── decisions.md
  │   ├── methodology.md
  │   └── current-state.md
  └── private/               ← gitignored, never committed
      ├── decisions.md
      ├── current-state.md
      └── artifacts/
```

The `/private/` folder is in `.gitignore` at the repo root. Claude (via Claude Code) writes to either folder based on the visibility flag of the content. New decisions default to `/private/`. Promote to `/public/` only after deliberate review.

---

## What to do if visibility gets violated

If you discover that a private item ended up on the public view (or in the public repo):

1. Flip it to private immediately in the admin UI / move the file to `/private/`
2. If the repo was affected: rewrite history with `git filter-repo`, force-push, **rotate any leaked credentials** (assume they're compromised)
3. Note what happened in `/projects/dashboard/private/incidents.md` so the failure mode gets caught in a review

---

*This file is referenced in every Claude project's system prompt. Any chat working on errin-os data must respect it.*
