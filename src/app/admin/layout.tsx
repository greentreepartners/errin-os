import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  const authed = !!user && !!adminEmail && user.email === adminEmail;

  return (
    <div className="min-h-screen bg-bg text-text">
      {authed && (
        <div className="border-b border-solid border-rule">
          <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <span className="font-mono text-xs uppercase tracking-wider text-text-3">
              Admin · {user.email}
            </span>
            <form action="/admin/signout" method="post">
              <button
                type="submit"
                className="border border-solid border-rule px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-2 hover:border-text hover:text-text"
              >
                Sign out
              </button>
            </form>
          </header>
          <div className="mx-auto max-w-3xl px-6 pb-4">
            <p className="font-sans text-xs italic text-text-2">
              New tasks are private by default. Publish individually.
            </p>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
