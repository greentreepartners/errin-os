import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { MOTION_ORDER, type Project } from "@/lib/types";
import { AdminTaskCard } from "./_components/AdminTaskCard";
import { AddTaskForm } from "./_components/AddTaskForm";

export const dynamic = "force-dynamic";

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
  const projectOptions = projects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
  }));

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

      <div className="mt-6">
        <AddTaskForm projects={projectOptions} />
      </div>

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
            const orderedKeys = MOTION_ORDER.map((m) => m.key);
            const unmotioned = projectTasks.filter(
              (t) => !t.motion || !orderedKeys.includes(t.motion)
            );
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
                            <AdminTaskCard key={task.id} task={task} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {unmotioned.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-text-2">
                        Unassigned
                      </h3>
                      <div className="mt-2 space-y-3">
                        {unmotioned.map((task) => (
                          <AdminTaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          return (
            <section key={project.id}>
              {heading}
              <div className="mt-3 space-y-3">
                {projectTasks.map((task) => (
                  <AdminTaskCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
