import { supabase } from "@/lib/supabase";
import { type Project } from "@/lib/types";
import { TaskFilter } from "./_components/TaskFilter";

export const dynamic = "force-dynamic";

const BUILT_AT = new Date().toISOString();
const BUILD_COMMIT =
  (process.env.COMMIT_REF || process.env.NETLIFY_COMMIT_REF)?.slice(0, 7) ??
  "local-dev";

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

      <TaskFilter projects={projects} />

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
