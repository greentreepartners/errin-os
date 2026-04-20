import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const BUILT_AT = new Date().toISOString();
const BUILD_COMMIT = process.env.COMMIT_REF?.slice(0, 7) ?? "local-dev";

export default async function Home() {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, short_id, title, visibility")
    .order("short_id", { ascending: true });

  const tasks = data ?? [];
  const count = tasks.length;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12 font-sans text-sm">
      <h1 className="text-2xl font-bold">errin-os — Phase 1 scaffold green</h1>
      <p className="mt-2 text-zinc-600">
        Server-side Supabase fetch · RLS-filtered to public tasks in public projects
      </p>

      {error && (
        <section className="mt-6 border border-red-700 bg-red-50 p-4 text-red-900">
          <h2 className="font-semibold">Supabase query error</h2>
          <p className="mt-1">{error.message}</p>
          {error.code && <p className="mt-1">Code: {error.code}</p>}
          <p className="mt-2 text-xs">
            Rendered server-side — visible in any browser regardless of console access.
          </p>
        </section>
      )}

      <p className="mt-6">
        Fetched {count} {count === 1 ? "task" : "tasks"}
        {count !== 3 && (
          <span className="ml-2 font-semibold text-red-700">Expected 3</span>
        )}
      </p>

      <ul className="mt-4 space-y-3">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-4 border border-solid border-zinc-900 p-3"
          >
            <span className="font-mono text-xs">{t.short_id}</span>
            <span className="flex-1">{t.title}</span>
            <span className="border border-solid border-zinc-900 px-2 py-0.5 text-xs">
              PUBLIC
            </span>
          </li>
        ))}
      </ul>

      <footer className="mt-12 text-xs text-zinc-500">
        <p>Build commit: {BUILD_COMMIT}</p>
        <p>Built: {BUILT_AT}</p>
      </footer>
    </main>
  );
}
