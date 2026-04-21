import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { type Project } from "@/lib/types";
import { AddTaskForm } from "./_components/AddTaskForm";
import { AdminTaskFilter } from "./_components/AdminTaskFilter";

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

      <AdminTaskFilter projects={projects} projectOptions={projectOptions} />
    </main>
  );
}
