"use client";

import { useActionState, useState } from "react";
import { loginAction, signupAction, type AuthResult } from "@/lib/authActions";

const initial: AuthResult = {};

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-[var(--chrome-border)] bg-[var(--chrome-panel)] p-6">
        <h1 className="text-xl font-semibold mb-1">Report Builder</h1>
        <p className="text-sm text-[var(--chrome-muted)] mb-5">
          {mode === "login" ? "Sign in to your workspace" : "Create a creator account"}
        </p>
        <form action={formAction} className="flex flex-col gap-3">
          <input name="email" type="email" required placeholder="you@example.com" className="rounded-md bg-[var(--chrome-bg)] border border-[var(--chrome-border)] px-3 py-2 text-sm outline-none focus:border-[var(--chrome-accent)]" />
          <input name="password" type="password" required placeholder="Password" className="rounded-md bg-[var(--chrome-bg)] border border-[var(--chrome-border)] px-3 py-2 text-sm outline-none focus:border-[var(--chrome-accent)]" />
          {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
          <button type="submit" disabled={pending} className="rounded-md bg-[var(--chrome-accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
            {pending ? "..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-4 text-sm text-[var(--chrome-muted)] hover:text-[var(--chrome-text)]">
          {mode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
