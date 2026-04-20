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
