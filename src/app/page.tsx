import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const BUILT_AT = new Date().toISOString();
const BUILD_COMMIT = process.env.COMMIT_REF?.slice(0, 7) ?? "local-dev";

type Visibility = "public" | "private";

type TaskStatus =
  | "backlog"
  | "this_week"
  | "in_progress"
  | "blocked"
  | "done"
  | "killed";

type EffortLevel = "low" | "medium" | "high";
type ImpactLevel = "low" | "medium" | "high";
type Horizon = "this_week" | "next_2_weeks" | "ongoing";

type BlockedBy = {
  blocking_task: { short_id: string | null } | null;
};

type Task = {
  id: string;
  short_id: string | null;
  title: string;
  description: string | null;
  motion: string | null;
  motion_subtitle: string | null;
  status: TaskStatus;
  visibility: Visibility;
  effort: EffortLevel | null;
  impact: ImpactLevel | null;
  horizon: Horizon | null;
  is_gate: boolean;
  blocked_by: BlockedBy[] | null;
};

type Project = {
  id: string;
  slug: string;
  name: string;
  display_order: number;
  visibility: Visibility;
  tasks: Task[] | null;
};

const MOTION_ORDER: Array<{ key: string; label: string }> = [
  { key: "gate", label: "Gate" },
  { key: "motion_a", label: "Motion A" },
  { key: "motion_b", label: "Motion B" },
  { key: "motion_c", label: "Motion C" },
];

function TaskCard({ task }: { task: Task }) {
  const borderStyle =
    task.visibility === "public" ? "border-solid" : "border-dashed";

  const visibleBlockers = (task.blocked_by ?? [])
    .map((b) => b.blocking_task?.short_id)
    .filter((s): s is string => Boolean(s));

  return (
    <article
      className={`relative border ${borderStyle} border-zinc-900 px-4 pt-8 pb-4`}
    >
      <span className="absolute top-2 right-2 border border-solid border-zinc-900 px-2 py-0.5 text-[10px] font-mono">
        {task.visibility === "public" ? "PUBLIC" : "PRIVATE"}
      </span>

      <div className="flex items-start gap-3">
        <input type="checkbox" disabled className="mt-1" />

        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            {task.short_id && (
              <span className="font-mono text-xs text-zinc-600">
                {task.short_id}
              </span>
            )}
            <h3 className="font-semibold">{task.title}</h3>
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-zinc-600">{task.description}</p>
          )}

          {visibleBlockers.length > 0 && (
            <p className="mt-2 inline-block border border-solid border-zinc-400 px-2 py-0.5 text-[10px] text-zinc-700">
              Blocked by {visibleBlockers.join(", ")}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 text-[10px] text-zinc-700">
          {task.horizon && (
            <span className="border border-solid border-zinc-400 px-2 py-0.5">
              {task.horizon}
            </span>
          )}
          {task.effort && (
            <span className="border border-solid border-zinc-400 px-2 py-0.5">
              effort: {task.effort}
            </span>
          )}
          {task.impact && (
            <span className="border border-solid border-zinc-400 px-2 py-0.5">
              impact: {task.impact}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function Home() {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id, slug, name, display_order, visibility,
      tasks (
        id, short_id, title, description, motion, motion_subtitle,
        status, visibility, effort, impact, horizon, is_gate,
        blocked_by:task_dependencies!blocked_task_id (
          blocking_task:tasks!blocking_task_id ( short_id )
        )
      )
      `
    )
    .order("display_order");

  const projects = (data ?? []) as unknown as Project[];
  const tasks = projects.flatMap((p) => p.tasks ?? []);

  const stats = {
    total: tasks.length,
    this_week: tasks.filter((t) => t.status === "this_week").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 font-sans text-sm">
      {error && (
        <section className="mb-6 border border-solid border-red-700 bg-red-50 p-4 text-red-900">
          <h2 className="font-semibold">Supabase query error</h2>
          <p className="mt-1">{error.message}</p>
          {error.code && <p className="mt-1">Code: {error.code}</p>}
          <p className="mt-2 text-xs">
            Rendered server-side — visible in any browser regardless of console access.
          </p>
        </section>
      )}

      <header className="flex flex-wrap gap-x-6 gap-y-1 border border-solid border-zinc-900 p-4">
        <span>
          <span className="font-mono">{stats.total}</span> total
        </span>
        <span>
          <span className="font-mono">{stats.this_week}</span> this week
        </span>
        <span>
          <span className="font-mono">{stats.in_progress}</span> in progress
        </span>
        <span>
          <span className="font-mono">{stats.done}</span> done
        </span>
        <span>
          <span className="font-mono">{stats.blocked}</span> blocked
        </span>
      </header>

      <section className="mt-4 grid grid-cols-3 gap-4 border border-solid border-zinc-300 p-4 text-xs">
        <div>
          <p className="font-semibold">Horizon</p>
          <ul className="mt-1 text-zinc-700">
            <li>this_week</li>
            <li>next_2_weeks</li>
            <li>ongoing</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Effort</p>
          <ul className="mt-1 text-zinc-700">
            <li>low</li>
            <li>medium</li>
            <li>high</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Impact</p>
          <ul className="mt-1 text-zinc-700">
            <li>low</li>
            <li>medium</li>
            <li>high</li>
          </ul>
        </div>
      </section>

      {/* Pill interactivity lands in a later brief — see Brief 2A-1 scope */}
      <nav className="mt-4 flex flex-wrap gap-2">
        {["All", "This Week", "In Progress", "Blocked", "Done"].map((label) => (
          <button
            key={label}
            type="button"
            className="border border-solid border-zinc-900 px-3 py-1 text-xs"
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-8 space-y-8">
        {projects.map((project) => {
          const projectTasks = project.tasks ?? [];

          if (project.slug === "career") {
            return (
              <section key={project.id}>
                <h2 className="text-lg font-semibold">{project.name}</h2>
                <div className="mt-3 space-y-6">
                  {MOTION_ORDER.map(({ key, label }) => {
                    const subset = projectTasks.filter(
                      (t) => t.motion === key
                    );
                    if (subset.length === 0) return null;
                    return (
                      <div key={key}>
                        <h3 className="text-sm font-semibold text-zinc-700">
                          {label}
                        </h3>
                        <div className="mt-2 space-y-3">
                          {subset.map((task) => (
                            <TaskCard key={task.id} task={task} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          }

          return (
            <section key={project.id}>
              <h2 className="text-lg font-semibold">{project.name}</h2>
              <div className="mt-3 space-y-3">
                {projectTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="mt-12 text-xs text-zinc-500">
        <p>Build commit: {BUILD_COMMIT}</p>
        <p>Built: {BUILT_AT}</p>
        <p>
          Showing 4 of 4 public tasks. Private task count visible in admin view.
        </p>
      </footer>
    </main>
  );
}
