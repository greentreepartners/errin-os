import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Set it in .env.local (local) or the Netlify env (deploy)."
    );
  }
  if (!anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Set it in .env.local (local) or the Netlify env (deploy)."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Cookies can't be set from server components in Next.js 16.
          // proxy.ts refreshes the session cookie on every /admin/* request,
          // so missed writes here are recovered on the next request.
        }
      },
    },
  });
}
