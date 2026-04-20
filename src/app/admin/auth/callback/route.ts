import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/login?error=missing_code", request.url)
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user) {
    return NextResponse.redirect(
      new URL("/admin/login?error=exchange_failed", request.url)
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || data.user.email !== adminEmail) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/admin/login?error=unauthorized", request.url)
    );
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}
