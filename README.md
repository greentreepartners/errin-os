# errin-os

Personal operating system. Public read-view of curated career, work, and life tasks. Private admin behind auth.

## Stack

- **Next.js** — App Router, TypeScript, Tailwind.
- **Supabase** — Postgres for the task database, Supabase Auth for admin magic-link, Row Level Security for visibility enforcement.
- **Netlify** — hosting for public view and `/admin`.
- **Claude Code** — build agent. See `CLAUDE.md` for session guardrails.

## Repo structure

- `/src` — Next.js app (App Router, TypeScript).
- Repo root — canonical docs: `DECISIONS.md`, `SCHEMA.sql`, `VISIBILITY.md`, `CLAUDE.md`.
- `/private/` and `/projects/*/private/` — gitignored. Never committed. See `VISIBILITY.md`.

## Status

Currently Phase 1 — pipeline build. See `DECISIONS.md` for the full phase plan (Phase 0 → 1 → 2 → 3 → 4).

## Architecture

`DECISIONS.md` is the canonical architecture record. Do not duplicate content here.
