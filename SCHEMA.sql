-- ============================================================================
-- errin-os — Supabase schema
-- ============================================================================
-- Run this in the Supabase SQL editor for project errin-os.
-- Project ID: cxxjnkwjcpllcuzxtees
--
-- This creates: projects, tasks, dependencies (junction).
-- Then seeds 3 projects + 6 sample tasks that exercise every schema feature.
-- Real task data is NOT migrated here — that happens in Phase 3.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------

create type visibility as enum ('public', 'private');
create type task_status as enum ('backlog', 'this_week', 'in_progress', 'blocked', 'done', 'killed');
create type effort_level as enum ('low', 'medium', 'high');
create type impact_level as enum ('low', 'medium', 'high');
create type horizon as enum ('this_week', 'next_2_weeks', 'ongoing');

-- ----------------------------------------------------------------------------
-- PROJECTS
-- ----------------------------------------------------------------------------

create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                      -- e.g. 'career', 'namecoach', 'life'
  name text not null,                             -- display name
  description text,                               -- one-line summary
  visibility visibility not null default 'private',
  display_order int not null default 0,           -- controls dashboard ordering
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TASKS
-- ----------------------------------------------------------------------------

create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,

  -- Identity & content
  short_id text,                                  -- optional human ID like 'B3', 'G1'
  title text not null,
  description text,                               -- one-line operating note
  motion text,                                    -- 'gate', 'motion_a', 'motion_b', 'motion_c', null
  motion_subtitle text,                           -- e.g. 'Passive · compounds · high quality'

  -- State
  status task_status not null default 'backlog',
  visibility visibility not null default 'private',

  -- Classification
  effort effort_level,
  impact impact_level,
  horizon horizon,

  -- Flags
  is_gate boolean not null default false,         -- this task is a gate item
  circuit_breaker date,                           -- optional decision deadline

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ----------------------------------------------------------------------------
-- DEPENDENCIES (junction table — task A is blocked by task B)
-- ----------------------------------------------------------------------------

create table task_dependencies (
  blocked_task_id uuid not null references tasks(id) on delete cascade,
  blocking_task_id uuid not null references tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocked_task_id, blocking_task_id),
  check (blocked_task_id <> blocking_task_id)
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------

create index idx_tasks_project on tasks(project_id);
create index idx_tasks_status on tasks(status);
create index idx_tasks_visibility on tasks(visibility);
create index idx_tasks_motion on tasks(project_id, motion);
create index idx_deps_blocking on task_dependencies(blocking_task_id);

-- ----------------------------------------------------------------------------
-- TRIGGER — auto-update updated_at on row change
-- ----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated before update on projects
  for each row execute function set_updated_at();

create trigger tasks_updated before update on tasks
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- TRIGGER — auto-set completed_at when status moves to 'done'
-- ----------------------------------------------------------------------------

create or replace function set_completed_at()
returns trigger as $$
begin
  if new.status = 'done' and (old.status is null or old.status <> 'done') then
    new.completed_at = now();
  elsif new.status <> 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger tasks_completed before update on tasks
  for each row execute function set_completed_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- Public read: anyone can read rows where visibility = 'public'
-- Authenticated read/write: signed-in users (just Errin) can do everything
-- ----------------------------------------------------------------------------

alter table projects enable row level security;
alter table tasks enable row level security;
alter table task_dependencies enable row level security;

-- PROJECTS: public can read public projects; authed user can read all
create policy "public reads public projects"
  on projects for select
  using (visibility = 'public');

create policy "authed reads all projects"
  on projects for select
  to authenticated
  using (true);

create policy "authed writes projects"
  on projects for all
  to authenticated
  using (true)
  with check (true);

-- TASKS: public can read public tasks (only if parent project is also public);
-- authed user can read/write all
create policy "public reads public tasks"
  on tasks for select
  using (
    visibility = 'public'
    and exists (
      select 1 from projects p
      where p.id = tasks.project_id and p.visibility = 'public'
    )
  );

create policy "authed reads all tasks"
  on tasks for select
  to authenticated
  using (true);

create policy "authed writes tasks"
  on tasks for all
  to authenticated
  using (true)
  with check (true);

-- DEPENDENCIES: public can read deps where both endpoints are public-visible;
-- authed user can do everything
create policy "public reads visible deps"
  on task_dependencies for select
  using (
    exists (select 1 from tasks t where t.id = task_dependencies.blocked_task_id and t.visibility = 'public')
    and exists (select 1 from tasks t where t.id = task_dependencies.blocking_task_id and t.visibility = 'public')
  );

create policy "authed reads all deps"
  on task_dependencies for select
  to authenticated
  using (true);

create policy "authed writes deps"
  on task_dependencies for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================================
-- SEED DATA — 3 projects, 6 sample tasks
-- ============================================================================
-- These are deliberately fake. Each task is designed to exercise a specific
-- schema feature so we can verify the dashboard renders all states correctly.
-- Real tasks get migrated in Phase 3.
-- ============================================================================

-- Projects
insert into projects (slug, name, description, visibility, display_order) values
  ('career',    'Career',            'Senior AI-First PM transition',                  'public',  1),
  ('namecoach', 'Namecoach',         'Product OS engagement — current client work',    'public',  2),
  ('life',      'Life',              'Personal admin, finances, health',               'private', 3);

-- Tasks
-- Each task tests something specific. The "tests:" comment is the contract.
insert into tasks (project_id, short_id, title, description, motion, motion_subtitle, status, visibility, effort, impact, horizon, is_gate)
select id, 'A1', 'Sample task A — public, this week, will be blocked',
  'Tests: visibility=public + status=this_week + dependency chain',
  'motion_a', 'Passive · compounds · high quality',
  'this_week', 'public', 'medium', 'high', 'this_week', false
from projects where slug = 'career';

insert into tasks (project_id, short_id, title, description, motion, status, visibility, effort, impact, horizon, is_gate)
select id, 'G1', 'Sample task B — private, done, gate item',
  'Tests: visibility=private + status=done (sets completed_at) + is_gate=true',
  'gate',
  'done', 'private', 'high', 'high', 'this_week', true
from projects where slug = 'career';

insert into tasks (project_id, short_id, title, description, status, visibility, effort, impact, horizon, is_gate)
select id, 'NC1', 'Sample task C — public, in progress, gate item',
  'Tests: in_progress status + is_gate flag in a non-Career project',
  'in_progress', 'public', 'medium', 'high', 'this_week', true
from projects where slug = 'namecoach';

insert into tasks (project_id, short_id, title, description, status, visibility, effort, impact, horizon)
select id, 'NC2', 'Sample task D — public, blocks task C',
  'Tests: reverse dependency — this task is the blocker',
  'this_week', 'public', 'low', 'medium', 'this_week'
from projects where slug = 'namecoach';

insert into tasks (project_id, short_id, title, description, status, visibility, effort, impact, horizon)
select id, 'L1', 'Sample task E — private, this week, high effort',
  'Tests: private task in private project — should NOT appear on public view',
  'this_week', 'private', 'high', 'high', 'this_week'
from projects where slug = 'life';

insert into tasks (project_id, short_id, title, description, status, visibility, effort, impact, horizon)
select id, 'L2', 'Sample task F — public, ongoing, low effort',
  'Tests: public task in private project — should NOT appear (project gates it)',
  'in_progress', 'public', 'low', 'low', 'ongoing'
from projects where slug = 'life';

-- Dependencies
-- Task A is blocked by Task B (Career)
insert into task_dependencies (blocked_task_id, blocking_task_id)
select a.id, b.id
from tasks a, tasks b
where a.short_id = 'A1' and b.short_id = 'G1';

-- Task C is blocked by Task D (Namecoach)
insert into task_dependencies (blocked_task_id, blocking_task_id)
select c.id, d.id
from tasks c, tasks d
where c.short_id = 'NC1' and d.short_id = 'NC2';

-- ============================================================================
-- VERIFICATION QUERIES — run these after seed to confirm the model works
-- ============================================================================

-- Should return 6 tasks
-- select count(*) from tasks;

-- Should return 4 (Career A1 is public, Career G1 is private; Namecoach NC1 + NC2 are public; Life is private project so neither L1 nor L2 should pass)
-- Actually returns 3: A1 (public in public project), NC1 + NC2 (public in public project)
-- Tests RLS: anonymous reads via the anon key should see 3 rows total
-- select count(*) from tasks;  -- run this as anon user to verify

-- Should show: A1 blocked_by G1, NC1 blocked_by NC2
-- select t1.short_id as blocked, t2.short_id as blocked_by
-- from task_dependencies d
-- join tasks t1 on t1.id = d.blocked_task_id
-- join tasks t2 on t2.id = d.blocking_task_id;
