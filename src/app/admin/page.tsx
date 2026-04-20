import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { MOTION_ORDER, type Project, type Task } from "@/lib/types";

export const dynamic = "force-dynamic";

function TaskCard({ task }: { task: Task }) {
  const borderStyle =
    task.visibility === "public" ? "border-solid" : "border-dashed";

  const visibleBlockers = (task.blocked_by ?? [])
    .map((b) => b.blocking_task?.short_id)
    .filter((s): s is string => Boolean(s));

  return (
    <article
      className={`relative border ${borderStyle} border-rule bg-bg-card px-4 pt-8 pb-4`}
    >
      <span className="absolute top-2 right-2 border border-solid border-rule px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-text-3">
        {task.visibility === "public" ? "PUBLIC" : "PRIVATE"}
      </span>

      <div className="flex items-start gap-3">
        <input type="checkbox" disabled className="mt-1" />

        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            {task.short_id && (
              <span className="font-mono text-xs text-text-3">
                {task.short_id}
              </span>
            )}
            {task.status === "in_progress" && (
              <span className="border border-solid border-accent-line bg-accent-soft px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-accent">
                in progress
              </span>
            )}
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
          <span className="border border-solid border-rule px-2 py-0.5 font-mono uppercase tracking-wider">
            {task.status.replace("_", " ")}
          </span>
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

export default async function AdminHome() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    redirect("/admin/login");
  }

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
  const privateCount = tasks.filter((t) => t.visibility === "private").length;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8 font-sans text-sm text-text bg-bg">
      {error && (
        <section className="mb-6 border border-solid border-red-700 bg-red-950 p-4 text-red-200">
          <h2 className="font-semibold">Supabase query error</h2>
          <p className="mt-1">{error.message}</p>
          {error.code && <p className="mt-1">Code: {error.code}</p>}
        </section>
      )}

      <header className="flex flex-wrap gap-x-6 gap-y-1 border border-solid border-rule p-4 text-text-2">
        <span>
          <span className="font-mono text-text">{tasks.length}</span> total
        </span>
        <span>
          <span className="font-mono text-text">
            {tasks.length - privateCount}
          </span>{" "}
          public
        </span>
        <span>
          <span className="font-mono text-text">{privateCount}</span> private
        </span>
      </header>

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
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">
                {project.visibility}
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
    </main>
  );
}
