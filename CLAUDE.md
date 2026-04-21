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

See §1.11 for post-APPROVED permission prompt conventions.

See §1.12 for when verbatim-dictation briefs may skip Plan Mode entirely.

## Scope

This repo is errin-os: Next.js dashboard at `errin-os.netlify.app` (public read) and `/admin` (auth-gated write), backed by Supabase. Claude is the build agent. Everything else is out of scope until `DECISIONS.md` says otherwise.

## Engineering conventions (captured from real failures)

These conventions were learned during Briefs 1A, 1B-A, 1B-B, 2A-1, and 2A-2. Follow them by default. `[HARD]` rules require stop-and-ask if reality differs; other items are standard procedure.

### 1.1 Multi-line commit messages

Use `printf` to a temp file with explicit `\n` escapes, then verify line count with `wc -l` as a real gate, then `git commit -F`. No heredocs — they render ambiguously through shell parsing.

```
printf 'subject\n\nbody¶1...\n\nbody¶2...\n' > /tmp/commit-msg.txt
wc -l /tmp/commit-msg.txt   # must report expected count
git commit -F /tmp/commit-msg.txt
rm /tmp/commit-msg.txt
```

Line count math: for N body paragraphs, `wc -l` reports `2N + 1` (subject + blank + N paragraphs + N-1 blanks between them). Predict the count in the plan before running.

[HARD] No `Co-Authored-By:` trailer on any commit. None of the existing commits on this repo carry one, and this is a portfolio repo where author signal matters.

[HARD] The `printf` invocation must use double quotes around the format string. Single quotes prevent `\n` expansion and produce literal `\n` characters instead of newlines — this is the same failure mode heredocs produced in Phase 1, dressed differently. Single-quoted `printf` for multi-line commit messages is forbidden.

[HARD] No speculative commit body content. Commit message bodies cover what shipped in this commit and why. They do not editorialise about future briefs, predict how downstream work will reuse the current change, or commit the project to implementation choices that haven't been designed yet. If a sentence in the body refers to a brief that hasn't shipped, delete it. The brief reference at the top of the body (e.g. "Brief 2A-1.") is the only forward-looking element permitted.

### 1.2 `wc -l` is display-only inside `&&` chains

`wc -l file && next-command` runs `next-command` regardless of what `wc -l` printed, because `wc -l` exits 0 on success regardless of the value it reports. To make `wc -l` an actual gate, use one of:

(a) **Two approvals (default).** First approval runs `printf` + `wc -l` + `cat` for inspection. Second approval runs commit + push only after the operator confirms the count.

(b) **Test wrapper.** Exits non-zero on mismatch:

```
[ "$(wc -l < /tmp/commit-msg.txt)" -eq 9 ] || exit 1
```

### 1.3 Background processes

When starting a long-running process (dev server, watcher), capture the PID atomically on the same command line as the `&` so `$!` resolves to the right process:

```
rm -f /tmp/proc.log /tmp/proc.pid && some-command > /tmp/proc.log 2>&1 & echo $! > /tmp/proc.pid && sleep 1 && cat /tmp/proc.pid
```

Kill via PID, then verify the process is dead with `kill -0`:

```
kill $(cat /tmp/proc.pid) && sleep 1 && (kill -0 $(cat /tmp/proc.pid) 2>/dev/null && echo "STILL RUNNING" || echo "killed cleanly")
```

[HARD] Never leave a backgrounded process running at session end.

### 1.4 Push verification chain

Standard pattern after every commit-and-push:

```
git push origin main 2>&1 && echo "---HEAD---" && git log -1 --format="%H%n%s" && echo "---REMOTE---" && git rev-parse origin/main
```

Local HEAD and `origin/main` hashes must match before declaring the push verified. Report both in the completion message.

### 1.5 Reporting completion to the operator

When reporting verification or completion, expand any `›` chevrons in the chat output OR paste the verbatim command output in the body of the report. Do not summarise tool output behind collapsed blocks — the operator should not need to expand chevrons to see what actually happened.

### 1.6 Dependency installs

Use `npm install`, not yarn or pnpm. For new runtime dependencies during pattern-setting briefs, pin to an exact version with `--save-exact` (no `^` or `~` prefix in `package.json`). Loosening to caret ranges is a deliberate decision per dependency, not a default.

### 1.7 Per-step gate invariance

Commit, push, and verify are always separate permission gates. `git add` staging also requires its own gate. Discipline does not relax for smaller commits, follow-up commits, or late-session work — the second commit of a session gets the same scrutiny as the first.

Standard four-step sequence:

    git add <specific files>          # gate 1
    git commit -F /tmp/commit-msg.txt # gate 2
    git push origin main              # gate 3
    git rev-parse HEAD origin/main    # verify (read-only, no gate)

Never collapse into a chained gate. Chaining `commit && push` or `add && commit && push` hides each step's output from the reviewer mid-execution and defeats the per-step review contract.

### 1.8 Permission-dialog redirect protocol

Permission dialogs in Claude Code are deny/allow only. To redirect or query the agent mid-execution, deny the dialog first to return control to the main input, then send text guidance there. Never type instructions while a dialog is the active modal — they do not land on the agent.

Deny is not rejection of the work; it is a signal to revise. A deny-plus-guidance sequence is a course correction, not a setback.

### 1.9 Parser-clean chain rule

The chained-command rule extends beyond parser warnings (the `&` backgrounding case in §1.3). A single permission gate covering multiple consequential operations — file mutations, network actions, irreversible state changes — must be denied even if the chain parses cleanly. The test is not "does the dialog warn" but "how many things would I be approving with one click."

Read-only commands chained with one consequential command are fine. `git add x && git status` bundles one staging action with one read — acceptable. `git commit && git push` or `write-file && git-add && git-commit` crosses the line — each consequential step gets its own gate.

### 1.10 Handoff commit gate compression

Handoff commits are subject-only. The handoff doc itself is the body — the commit message does not duplicate it. Use `git commit -m "docs(handoff): YYYY-MM-DD HH:MM [role] — [brief-closeout-tag]"` directly; skip the `printf` + `wc -l` + `-F` pattern from §1.1.

This is the only targeted relaxation of §1.1. It applies only to `docs(handoff):` commits containing a fresh handoff doc in `handoffs/`. All other commits still use the §1.1 pattern.

Additionally, handoff commits may bundle write + git add + commit + push into a single permission gate, in narrow contravention of §1.7. The §1.7 invariance rule applies to consequential operations affecting running systems; handoff doc commits affect nothing in production. The chain rule's spirit (§1.9) is "how many things break if this approval is wrong" — for doc-only operations on doc-only files, the answer is nothing, so a single gate is correct.

### 1.11 Plan-scoped permission prompts after APPROVED

Once the operator replies `APPROVED` on a Plan Mode artifact, the delivery chat should proactively tell the operator which permission prompts during execution are safe to `Always allow` and which should remain `Allow once`.

The plan is the gate. Per-edit prompting after plan approval is friction without signal for edits and commands named in the plan. But "Always allow" in Claude Code persists for the session and matches on command shape, not on this specific invocation — so the relaxation applies only to in-scope operations, not to the shape of the command.

Default table:

| Prompt type | Treatment |
|---|---|
| Edits to files named in the plan | Always allow |
| Build / lint / type-check commands named in the plan | Always allow |
| `git add <files-in-plan>` | Always allow |
| `git commit -F <tmp-msg>` | **Allow once** — commits are semantic actions, each one merits conscious approval |
| `git push origin <branch-in-plan>` | **Allow once** — pushes ship to deployment targets; never auto-pass |
| Dev server startup, background processes, PID capture | **Allow once** — one-shot verification, not recurring |
| `rm -f`, temp file cleanup | **Allow once** — command shape matches future contexts |
| `curl localhost`, `grep`, read-only verification | **Allow once** — cheap per-prompt, keeps eyes on output |
| Files or surfaces **not named in the plan** | **Deny and flag** — scope drift, not routine execution |
| `.env`, migrations, new dependencies, auth flow | **Deny and flag** — always re-plan before touching |
| Network calls to external services not in plan | **Deny and flag** |

[HARD] `git commit` and `git push` never go `Always allow`. The per-step gate invariance of §1.7 is not relaxed by plan approval — plan approval gates the *work*, not the individual semantic git actions. This also holds when Claude Code offers an "Always allow" button: the correct answer is still `Allow once`.

If Claude Code attempts to edit a file or run a command not covered by the plan, deny the prompt and flag to the operator. That's a scope-drift signal, not a routine edit — re-plan before proceeding.

### 1.12 Verbatim-dictation exemption from Plan Mode

§28 / the Plan-Mode-then-APPROVED pattern requires Plan Mode for changes touching multiple files, schema, auth, or configuration. CLAUDE.md edits arguably qualify as "configuration." A verbatim-dictation brief — where the operator supplies the exact content to add and the exact commit message in the brief itself — may skip Plan Mode without violation.

**Definition.** A brief qualifies as verbatim dictation when all three hold:

1. The exact content to add or change is supplied in the brief, character-for-character (not "add a section about X" but "add this section: <verbatim text>")
2. The commit message is supplied in the brief, character-for-character
3. The change touches a single file

**Why the exemption holds.** Plan Mode's purpose is to surface architectural calls, scope ambiguity, and risky-edit decisions before they're made. When the operator has dictated content and commit message verbatim, those decisions have already been made — the plan would just be ceremony restating the brief.

[HARD] The exemption applies only when all three conditions are met. If the brief says "add a section about X with these key points" rather than supplying the exact text, that's not dictation — Plan Mode applies. If the brief touches a second file (even tangentially, like updating a cross-reference), Plan Mode applies. If the commit message is left for the executor to draft, Plan Mode applies.

[HARD] The four-gate git sequence (§1.7) and the printf + wc -l + -F pattern (§1.1) are not relaxed by this exemption. Only the Plan Mode artifact is skipped — execution discipline remains identical.

When in doubt, write the plan. The cost of an unnecessary plan is small; the cost of a missed architectural call is the rest of the session debugging it.

### 1.13 RSC client-island pattern for interactive state over server-fetched data

When a Next.js page uses top-level `await` for a server-side fetch (e.g. Supabase reads via the anon client or RPC), interactive state (`useState`, `onClick`, `onChange`) cannot be added in-place. A single `.tsx` file is either a Server Component or a Client Component — never both. Converting the whole page to `"use client"` to accommodate interactivity sacrifices the server-side fetch pattern and is the wrong move.

**Correct pattern:** extract a client island.

- Server Component page (`src/app/page.tsx`, `src/app/admin/page.tsx`): handles auth, data fetch, stats computation, error banner, static layout
- Client island (`src/app/_components/TaskFilter.tsx`, `src/app/admin/_components/AdminTaskFilter.tsx`): `"use client"` directive, receives server-fetched data as prop, holds interactive state, renders the interactive subtree

**Prop serialisability requirement.** Props crossing the RSC boundary must be serialisable — no `Date` objects, no functions, no class instances. Supabase JSON responses are safe by default; typed arrays of primitives and string unions pass cleanly.

**Stats stay on the server.** "Whole-set truth" values (total count, public/private breakdown, etc.) compute from the unfiltered server-fetched set and render in the Server Component. They never cross the boundary. Filter state in the client island cannot contaminate them.

**Naming convention.** Client islands live in a `_components/` folder nested inside the route folder that consumes them. The underscore prefix keeps the folder non-routable (Next.js convention). Example: `src/app/admin/_components/AdminTaskFilter.tsx` is consumed only by `src/app/admin/page.tsx`.

First applied in Brief 2B-Fix-4; pattern-proven by successful reapplication in 2B-Fix-5.

### 1.14 Shared class-string constants for D8 semantic rules

When the same D8 visual treatment (cyan accent, active-filter state, a semantic border colour) must appear on two or more surfaces, extract the Tailwind class strings to a shared module rather than duplicating inline. Example: `src/lib/filter-pill.ts` holds the `INACTIVE_PILL` / `ACTIVE_PILL` class strings used by both `TaskFilter.tsx` (public) and `AdminTaskFilter.tsx` (admin).

**Why this matters more than normal DRY.** Tailwind class strings are just strings — nothing stops a future edit to one surface from diverging from the other. D8's cyan-for-in-progress-and-active-filter rule is *semantic*; the class string is the contract. A shared module makes any future edit a module-level decision visible across both surfaces rather than silent drift.

**Rule-of-three may trigger on two.** Extract on the second occurrence when the value is a canonical reference (the D8 cyan is *the* accent colour, not just *a* class that happens to match). Wait for the third occurrence for generic repeated strings.

**Top-of-file comment on the shared module** should reference the governing decision:

```ts
// D8 cyan accent — shared between public and admin filter pills.
// Edit both surfaces deliberately, not by accident.
```

First applied in Brief 2B-Fix-5.

### 1.15 `grep -c` counts lines, not occurrences

When verifying rendered HTML output with grep, `grep -c '<pattern'` counts *matching lines*, not *matching occurrences*. If multiple elements render on a single line (common in dev and production React output), the count is `1` for many elements and misleads verification.

**Correct pattern for occurrence counts:**

```bash
grep -oE '<pattern' file | wc -l
```

`-o` prints each match on its own line; `-E` enables extended regex; piping to `wc -l` counts the matches. Use this form for all element-count verifications in smoke-test scripts. Reserve `grep -c` for line-count questions only.

[HARD] Smoke-test scripts that count elements in rendered HTML never use `grep -c`. If a test is counting anything visual — cards, badges, pills, buttons — use `grep -oE | wc -l`.

Caught mid-verification in Brief 2B-Fix-4 when card count returned `1` instead of `10`.
