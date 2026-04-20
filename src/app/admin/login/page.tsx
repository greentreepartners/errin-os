"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const CALLBACK_ERROR_COPY: Record<string, string> = {
  unauthorized: "That email isn't authorized for this dashboard.",
  missing_code: "The magic link was incomplete. Try again.",
  exchange_failed: "The link expired or was already used. Request a new one.",
};

function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error") ?? "";
  const callbackErrorCopy = CALLBACK_ERROR_COPY[errorParam] ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrorMsg(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/auth/callback`,
      },
    });
    if (error) {
      setState("idle");
      setErrorMsg(error.message);
      return;
    }
    setState("sent");
  }

  return (
    <main className="mx-auto w-full max-w-sm px-6 py-16 font-sans text-sm text-text">
      <h1 className="font-sans text-lg font-semibold uppercase tracking-wide text-text">
        Admin
      </h1>
      <p className="mt-2 text-xs text-text-2">
        Magic-link sign-in. Single-user dashboard.
      </p>

      {callbackErrorCopy && (
        <p className="mt-4 border border-solid border-red-700 bg-red-950 p-3 text-xs text-red-200">
          {callbackErrorCopy}
        </p>
      )}

      {state === "sent" ? (
        <p className="mt-6 border border-solid border-rule p-4 text-xs text-text-2">
          Check your inbox. The link opens this site at{" "}
          <span className="font-mono text-text">/admin/auth/callback</span> and
          completes sign-in.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-1 w-full border border-solid border-rule bg-bg-card px-3 py-2 font-mono text-text"
            />
          </label>
          <button
            type="submit"
            disabled={state === "sending"}
            className="w-full border border-solid border-text bg-text px-3 py-2 font-mono text-xs uppercase tracking-wider text-bg disabled:opacity-50"
          >
            {state === "sending" ? "Sending…" : "Send magic link"}
          </button>
          {errorMsg && (
            <p className="text-xs text-red-400">{errorMsg}</p>
          )}
        </form>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
