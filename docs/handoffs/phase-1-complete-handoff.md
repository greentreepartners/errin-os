# Phase 1 Complete — Handoff
**Date:** 20 April 2026
**From:** PM chat that ran Brief 1B (Prompt A + Prompt B) and Brief 1C
**To:** Next PM chat picking up Brief 2A
**Status:** Phase 1 read-only data layer is shipped and live. Engineering conventions and PM playbook are committed. Repo is ready for Brief 2A (execution-co aesthetic + Talent Agent layout).

This handoff supersedes `docs/handoffs/phase-1-brief-1-handoff.md`. That file remains in the repo as historical record but is no longer the load-bearing context for the next chat. Read this file first.

---

## What shipped

### Live application

- **URL:** https://errin-os.netlify.app/
- **Renders:** 3 public tasks (A1, NC1, NC2) fetched server-side from Supabase via RLS-filtered anon-key query
- **Footer shows:** `Build commit: 0e58aaf` (live deploy SHA from Netlify's `COMMIT_REF`) and a per-request server timestamp
- **Pipeline proven end-to-end:** Postgres + RLS → Supabase client → server component → SSR HTML → live URL → browser

### Commits added since Brief 1's original handoff

| Hash | Subject |
|---|---|
| `3ca1273` | `deps(supabase): pin @supabase/supabase-js@2.103.3 and add server client wrapper` |
| `0e58aaf` | `feat(home): server-component scaffold-green page rendering 3 public tasks` |
| `701826d` | `docs(conventions): capture engineering conventions and PM playbook` |

`main` is at `701826d`. Local and remote pointers match.

### Files added or modified across the session

- `src/lib/supabase.ts` — server-only client wrapper, throws named errors on missing env vars (Brief 1B-A)
- `src/app/page.tsx` — replaced default scaffold with async server component (Brief 1B-B)
- `package.json` + `package-lock.json` — `@supabase/supabase-js@2.103.3` pinned with `--save-exact`
- `CLAUDE.md` — extended from 38 to 103 lines with new `## Engineering conventions` section (Brief 1C)
- `docs/PM_PLAYBOOK.md` — new file, 56 lines, PM-chat operating manual (Brief 1C)
- `.env.local` — leading whitespace cleaned from two Supabase key values (gitignored, fixed locally and in Netlify env vars)

### Decisions locked during this session

- **Page rendering mode for the public read view:** `export const dynamic = "force-dynamic"`. Per-request rendering exercises RLS on real traffic; static prerender would only validate against the build environment.
- **Architectural contract for the data layer:** RLS at the database is the single source of truth for public/private filtering. The application code does NOT add a redundant `.eq("visibility", "public")` filter. Doing so would mask any future RLS regression.
- **Visibility UI minimum contract:** Even at scaffold-green stage, every task card has a `PUBLIC` badge with a solid border per `VISIBILITY.md`. When private tasks render in the admin view (Phase 2), they get dashed borders. The visual treatment is non-negotiable from the start.

---

## Deviations from plan and why

### Brief 1B-A — Three correction loops on the multi-line commit message

**What happened:** The plan called for a Conventional Commits message with subject + blank line + body. Three sequential attempts to write the message failed: two heredoc approaches collapsed the body onto a single line; one `git commit -F -` heredoc had the same problem. Resolved on the fourth attempt by switching to `printf` with explicit `\n` escapes, writing to a temp file, and verifying the line count with `wc -l` before commit.

**Root cause:** Heredocs render ambiguously through Claude Code's permission UI (the dialog flattens multi-line strings into one display line). The agent had no way to verify line breaks before execution, and operator review couldn't catch the issue from the dialog alone. The `wc -l` verification gate that we added on attempt four made the failure mode visible at the right moment.

**Outcome:** Recoverable. The malformed commit was caught at `git log -1 --format="%B"` after commit but before push, and the byte-level diagnosis via `od -c` confirmed the structure. No bad commits made it to remote.

**Lesson:** Codified into `CLAUDE.md` Section 1.1 — printf-to-tempfile is the only sanctioned multi-line commit message procedure. Heredocs are forbidden.

### Brief 1B-B — `wc -l` is display-only inside `&&` chains

**What happened:** Attempting to use `wc -l file && next-command` as a verification gate. The agent discovered (with operator review) that bare `wc -l` exits 0 regardless of what count it printed, so the chain proceeded to the next command unconditionally.

**Outcome:** Caught before execution. Resolved by splitting the chain into two operator approvals (printf + verify, then commit + push) so the operator could be the gate.

**Lesson:** Codified into `CLAUDE.md` Section 1.2. Two patterns documented: (a) two-approval split for human-gated procedures, (b) test wrapper `[ "$(wc -l < file)" -eq N ] || exit 1` for fully automated chains. Brief 1C used pattern (b) successfully on first try.

### Brief 1B-B — Background dev-server command missed the `&`

**What happened:** First attempt at backgrounding the Next.js dev server omitted the trailing `&` and would have blocked the session indefinitely.

**Outcome:** Caught before execution. Resolved with the pattern `cmd > log 2>&1 & echo $! > pidfile` — the `& echo $!` must be on the same command line as the backgrounding for `$!` to capture the right PID.

**Lesson:** Codified into `CLAUDE.md` Section 1.3. Includes the kill + verify-with-`kill -0` pattern.

### Brief 1B-A — agent inserted `Co-Authored-By` trailer without authorisation

**What happened:** First commit attempt included a `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer. Not in the plan, not consistent with the existing repo's commit history.

**Outcome:** Caught before execution, removed.

**Lesson:** Codified into `CLAUDE.md` Section 1.1 as a `[HARD]` rule. This is a portfolio repo where author signal matters.

### Brief 1B-B — line count prediction missed by 12% on Brief 1C

**What happened:** Brief 1C plan predicted CLAUDE.md would land at ~117 lines (range 115–120). Actual was 103. The agent flagged the miss per stop-condition discipline and offered to expand. Operator chose to ship as-is.

**Outcome:** Accepted. Soft constraint, content coverage was the real check and it passed. Trim discipline preserved.

**Lesson:** Soft constraints don't fail on miss; the agent flagging them is the right behaviour. Padding to hit a soft target is the wrong incentive.

---

## Things you discover only by running this

These are not in any other doc. They cost time today; capturing so they don't cost time again.

### Claude Code's permission UI flattens long commands

The dialog showing "Allow Claude to run X?" strips newlines from multi-line commands and renders them as one wrapped string. This is a UI rendering artifact, not a transformation of the command being executed. But it means **operator review of long chained commands cannot rely on visual structure** — verify intent through the agent's plan and the verification commands, not the dialog itself.

### Claude Code's `›` chevrons hide tool output by default

Completion messages show summaries like "Ran Verify committed message preserved line breaks ›" and require the operator to expand the chevron to see actual command output. The `CLAUDE.md` reporting requirement (Section 1.5) now mandates expansion or verbatim paste.

### `force-dynamic` cold-start cost on Netlify

Per-request rendering means every visitor hits a Netlify Function cold start (~200–500ms). Fine for portfolio-scale traffic. Worth knowing if the site ever needs visitor performance optimisation; the fix would be ISR with a short revalidate.

### `COMMIT_REF` is exposed by Netlify but not by `next dev`

The footer SHA reads `local-dev` in development and the actual short SHA in production. The fallback is intentional and the production path is verified live.

### Netlify deploy lag is ~20 minutes between push and live URL serving the new build

Real measured number from this session, not a guess. Plan brief completion timing accordingly — "shipped to remote" and "visible on live URL" are 20 minutes apart.

---

## Process changes for next chat

These come from real failures and successes in this session. Bake them in.

### Pasting saves tokens vs screenshots

Each screenshot in PM chat consumes ~1500–2000 tokens. Plain text is usually 100–300. **For the next chat, default to pasting text** for permission dialogs, terminal output, and agent completion messages. Reserve screenshots for things that lose meaning as text — rendered web pages, anything where layout or colour matters.

### Always pre-decide page rendering mode in the brief

The `force-dynamic` decision came up mid-plan in Brief 1B-B and cost ~5 minutes for the operator to think through and respond. New brief template should specify rendering mode (force-dynamic / static / ISR with revalidate) up front for any page-creating brief. Captured in `docs/PM_PLAYBOOK.md` Section 2.3.

### Operator should visually confirm rendered output, not just deploy status

Brief 1B-B done state included "Netlify build green" but not "operator visually confirms render matches expectations." Netlify can build green and serve a broken page. Add render confirmation to the done-state checklist for any UI brief. Candidate addition to `PM_PLAYBOOK.md` Section 2.3.

### `[HARD]` and `[SOFT — guidance only]` constraint marking is now standard

Established in Brief 1's handoff, validated through this session. Every numeric or behavioural constraint in a Claude Code brief gets tagged. Soft constraint misses get flagged but don't fail the brief.

### Standard stop-condition boilerplate is now standard

Captured verbatim in `docs/PM_PLAYBOOK.md` Section 2.2. Every Claude Code brief from here uses it as the closing paragraph.

### Push-and-verify chain is now standard

Captured in `CLAUDE.md` Section 1.4. Every push uses it. Local HEAD and `origin/main` must match before declaring the push verified.

### "Always allow" remains forbidden during pattern-setting briefs

Use Allow-once until patterns are stable. Trust ratchets up over time as conventions prove themselves. See `docs/PM_PLAYBOOK.md` Section 2.4 for the per-phase trust ladder defaults.

---

## What next chat starts from

### Repo state

- Clean working tree, on `main`, at commit `701826d`
- Live URL deploying green
- All three Phase 1 commits merged and pushed
- `.env.local` cleaned (no leading-whitespace issues)
- Netlify env vars match `.env.local`

### Files the next chat should read first

1. `DECISIONS.md` (canon — never relitigate)
2. `VISIBILITY.md` (canon — public/private policy is a hard rule)
3. `CLAUDE.md` (engineering conventions, especially Sections 1.1–1.6)
4. `docs/PM_PLAYBOOK.md` (PM-chat operating manual, especially the trust ladder)
5. This handoff doc

### Pre-resolved decisions for Brief 2A

These are settled. Don't relitigate.

- **Visual reference:** `execution-co.netlify.app` (operator must capture the actual URL — outstanding from Brief 1's handoff, still unresolved)
- **Aesthetic baseline:** black on cream, bold typography, flat surfaces, no gradients, no glow (per `DECISIONS.md` D8)
- **Layout pattern:** Talent Agent view from chat — gate banner top, stat row, legend, filter pills, then sections (Gate → Motion A → Motion B → Motion C for Career), cards with checkbox + ID + title + one-line note + right-aligned badge stack
- **Visibility UI requirements stay in force:** solid border for public, dashed for private, persistent badge on every card, footer count of public-vs-private (per `VISIBILITY.md` and `DECISIONS.md` D6)

### Brief 2A's first task

Brief 2A (execution-co aesthetic + Talent Agent layout) likely splits into 2A-1 and 2A-2 — operator hasn't finalised this yet. The PM chat should:

1. Prompt operator for the `execution-co.netlify.app` URL (open question from Brief 1's handoff)
2. Decide whether to split 2A into layout shell (2A-1) and visual polish (2A-2), or treat as one brief
3. Also fold in the small fix to `src/app/layout.tsx` — `<title>Create Next App</title>` and the auto-generated meta description are still defaults. Either Brief 2A scope addition or its own micro-brief.

### Out of scope for Brief 2A

- Auth, `/admin` route — that's Brief 2B
- Write actions, visibility toggles in UI — that's Brief 2C
- Claude skill for chat-to-Supabase writes — that's Brief 3A
- Real task data migration — that's Brief 3B

### Open question still unresolved

- **`execution-co.netlify.app` URL.** Asked twice in Brief 1, asked again in this handoff. Capture before kicking off Brief 2A. Without it, the agent can't load the visual reference.

---

## Operating context for next chat

### Strategic framing (unchanged from Brief 1's handoff)

This build is **portfolio + utility**, in that order. The dashboard is the artifact for an AI-First Senior PM career transition. Recruiters land on the public GitHub repo, read `DECISIONS.md`, browse commits, and infer how the operator thinks. Bias every brief toward **clean over fast** when those conflict.

### Trust ladder current defaults

Per `docs/PM_PLAYBOOK.md` Section 2.4:

- **Phase 1 (now complete):** Tier 3 default — every plan reviewed by PM chat
- **Phase 2:** Tier 3 for auth/RLS/secrets; Tier 2 for everything else (revisit after 2A ships)
- **Phase 3+:** TBD as patterns prove themselves

Tier 3 cost today was ~5–10 min per brief in PM-chat overhead. Worth it during pattern-setting. Will loosen as conventions prove themselves.

### Brief tracking — predicted vs actual operator time

| Brief | Predicted | Actual | Delta | Notes |
|---|---|---|---|---|
| 1A | ~2 hr | ~2 hr | on | pre-PM-chat (scaffold + Netlify pipeline) |
| 1B-A | 25 min | ~25 min | on | commit-message correction loop ate ~12 min |
| 1B-B | 30–45 min | ~50 min | +5–20 min | first encounter with dev-server backgrounding and wc-l gate |
| 1C | 20–30 min | ~25 min | on | conventions stuck on first try |

Three of four briefs landed on prediction; 1B-B ran slightly long. Variance is tightening. Next-chat estimates per `docs/PM_PLAYBOOK.md` Section 2.5: continue tracking each brief, reassess "weeks to MVP" estimate after Brief 2A and 2B add real data points.

### Forward estimates to MVP

Unchanged from earlier in this session, holding within bands:

| Brief | Estimated operator time |
|---|---|
| 2A (execution-co aesthetic + Talent Agent layout, possibly split) | 2.5–4 hr |
| 2B (`/admin` + magic-link auth shell) | 1.5–2 hr |
| 2C (write actions on `/admin`) | 2–3 hr |
| 3A (Claude skill + handoff-pickup pattern) | 2–3 hr |
| 3B (migrate real task inventory) | 1–2 hr |
| 4 (iterate on real use) | ongoing |

**Realistic total to MVP:** ~10–12 hr operator time across remaining briefs. Calendar pace depends on session frequency; 5–6 weeks at 3 hr/week is the sustainable middle.

### Surface quirks (still apply)

- Working directory immutable per Claude Code session — new session every scope change
- Worktree checkbox defaults off in operator's environment (verified this session)
- "Always allow" forbidden during pattern-setting briefs
- Plan Mode is Shift+Tab (twice on first toggle to skip auto-accept mode)
- `git commit`, `git push`, and complex shell chains require fresh approval — non-overrideable, this is correct behaviour
- Permission dialog flattens long commands visually — verify intent through plan, not dialog
- Completion `›` chevrons hide tool output — require expansion or verbatim paste in reports

### Strategy project escalation criteria (unchanged)

PM chat escalates to Strategy project for:

- Locked decisions in `DECISIONS.md` that appear wrong
- Architecture pivots
- `VISIBILITY.md` violations requested by operator
- Technical constraints requiring architecture changes

PM chat decides without escalation for:

- Implementation details (CSS framework, file structure inside `/components/`)
- Bug fixes within existing architecture
- Naming choices that don't affect the public surface
- Optimisations that don't change behaviour

---

*Handoff written by PM chat at end of Phase 1 (post Brief 1B-B and Brief 1C). Update when patterns change.*
