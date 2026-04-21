import { supabase } from "@/lib/supabase";
import { MOTION_ORDER, type Project, type Task } from "@/lib/types";
import { statusPillClasses } from "@/lib/task-status";

export const dynamic = "force-dynamic";

const BUILT_AT = new Date().toISOString();
const BUILD_COMMIT =
  (process.env.COMMIT_REF || process.env.NETLIFY_COMMIT_REF)?.slice(0, 7) ??
  "local-dev";

function TaskCard({ task }: { task: Task }) {
  const visibleBlockers = (task.blocked_by ?? [])
    .map((b) => b.blocking_task?.short_id)
    .filter((s): s is string => Boolean(s));

  return (
    <article
      style={{
        borderStyle: task.visibility === "public" ? "solid" : "dashed",
      }}
      className="relative border border-rule bg-bg-card px-4 pt-8 pb-4"
    >
      <span className="absolute top-2 right-2 border border-solid border-rule px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-text-3">
        {task.visibility === "public" ? "PUBLIC" : "PRIVATE"}
      </span>

      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            {task.short_id && (
              <span className="font-mono text-xs text-text-3">
                {task.short_id}
              </span>
            )}
            <span
              className={`border border-solid px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${statusPillClasses(task.status, { interactive: false })}`}
            >
              {task.status.replace("_", " ")}
            </span>
            <h3 className="font-sans font-semibold text-text">{task.title}</h3>
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-text-2">{task.description}</p>
          )}

          {visibleBlockers.length > 0 && (
            <p className="mt-2 inline-block border border-solid border-rule px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-text-3">
              Blocked by {visibleBlockers.join(", ")}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 text-[10px] text-text-3">
          {task.horizon && (
            <span className="border border-solid border-rule px-2 py-0.5 font-mono uppercase tracking-wider">
              {task.horizon}
            </span>
          )}
          {task.effort && (
            <span className="border border-solid border-rule px-2 py-0.5 font-mono uppercase tracking-wider">
              effort: {task.effort}
            </span>
          )}
          {task.impact && (
            <span className="border border-solid border-rule px-2 py-0.5 font-mono uppercase tracking-wider">
              impact: {task.impact}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function Home() {
  const [projectsResult, countsResult] = await Promise.all([
    supabase
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
      .order("display_order"),
    supabase.rpc("public_counts"),
  ]);

  const { data, error } = projectsResult;
  const { data: countsData, error: countsError } = countsResult as {
    data: { public_count: number; total_count: number } | null;
    error: { message: string; code?: string } | null;
  };

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
    <main className="mx-auto w-full max-w-3xl px-6 py-12 font-sans text-sm text-text bg-bg">
      {(error || countsError) && (
        <section className="mb-6 border border-solid border-red-700 bg-red-50 p-4 text-red-900">
          <h2 className="font-semibold">Supabase query error</h2>
          {error && <p className="mt-1">{error.message}</p>}
          {error?.code && <p className="mt-1">Code: {error.code}</p>}
          {countsError && <p className="mt-1">{countsError.message}</p>}
          <p className="mt-2 text-xs">
            Rendered server-side — visible in any browser regardless of console access.
          </p>
        </section>
      )}

      <header className="flex flex-wrap gap-x-6 gap-y-1 border border-solid border-rule p-4 text-text-2">
        <span>
          <span className="font-mono text-text">{stats.total}</span> total
        </span>
        <span>
          <span className="font-mono text-text">{stats.this_week}</span> this week
        </span>
        <span>
          <span className="font-mono text-text">{stats.in_progress}</span> in progress
        </span>
        <span>
          <span className="font-mono text-text">{stats.done}</span> done
        </span>
        <span>
          <span className="font-mono text-text">{stats.blocked}</span> blocked
        </span>
      </header>

      <section className="mt-4 grid grid-cols-3 gap-4 border border-solid border-rule-soft p-4 text-xs text-text-3">
        <div>
          <p className="font-semibold text-text">Horizon</p>
          <ul className="mt-1">
            <li>this_week</li>
            <li>next_2_weeks</li>
            <li>ongoing</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-text">Effort</p>
          <ul className="mt-1">
            <li>low</li>
            <li>medium</li>
            <li>high</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-text">Impact</p>
          <ul className="mt-1">
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
            className="border border-solid border-text px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-text"
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-8 space-y-8">
        {projects.map((project) => {
          const projectTasks = project.tasks ?? [];
          const projectNum = String(project.display_order).padStart(2, "0");

          const heading = (
            <h2 className="flex items-baseline gap-2">
              <span className="font-mono text-text-3">{projectNum} ·</span>
              <span className="font-sans text-lg font-semibold uppercase tracking-wide text-text">
                {project.name}
              </span>
            </h2>
          );

          if (project.slug === "career") {
            return (
              <section key={project.id}>
                {heading}
                <div className="mt-3 space-y-6">
                  {MOTION_ORDER.map(({ key, label }) => {
                    const subset = projectTasks.filter(
                      (t) => t.motion === key
                    );
                    if (subset.length === 0) return null;
                    return (
                      <div key={key}>
                        <h3 className="text-sm font-semibold text-text-2">
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
              {heading}
              <div className="mt-3 space-y-3">
                {projectTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="mt-12 text-xs text-text-3">
        <p>
          Build commit:{" "}
          <span className="font-mono text-text-2">{BUILD_COMMIT}</span>
        </p>
        <p>Built: {BUILT_AT}</p>
        <p>
          {countsData ? (
            <>
              Showing{" "}
              <span className="font-mono text-text-2">
                {countsData.public_count}
              </span>{" "}
              of{" "}
              <span className="font-mono text-text-2">
                {countsData.total_count}
              </span>{" "}
              tasks.{" "}
              <span className="font-mono text-text-2">
                {countsData.total_count - countsData.public_count}
              </span>{" "}
              tasks are private.
            </>
          ) : (
            "Task counts unavailable."
          )}
        </p>
      </footer>
    </main>
  );
}
