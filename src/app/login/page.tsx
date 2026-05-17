"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, authEnabled, loading, user } = useAuth();

  const nextUrl = useMemo(() => {
    const next = params.get("next");
    if (!next || !next.startsWith("/")) return "/";
    return next;
  }, [params]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && !authEnabled) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-sm text-[var(--text-secondary)]">
        Authentication is disabled for this environment.
      </div>
    );
  }

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextUrl);
    }
  }, [loading, nextUrl, router, user]);

  if (!loading && user) {
    return null;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error ?? "Invalid credentials");
        return;
      }
      router.replace(nextUrl);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <h1 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">Sign in</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
            autoComplete="username"
            required
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
            autoComplete="current-password"
            required
          />
        </label>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-[var(--accent-brand)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
