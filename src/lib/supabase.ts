import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL. Set it in .env.local (local) or the Netlify env (deploy).");
}
if (!anonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Set it in .env.local (local) or the Netlify env (deploy).");
}

export const supabase = createClient(url, anonKey);
