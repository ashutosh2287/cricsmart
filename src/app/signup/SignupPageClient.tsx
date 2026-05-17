"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

function resolveRedirectTarget(value: string | null): string {
  if (!value || !value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

export default function SignupPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { authEnabled, isAuthenticated, loading, refreshSession } = useAuth();

  const redirectTarget = useMemo(() => {
    const redirect = params.get("redirect");
    const next = params.get("next");
    return resolveRedirectTarget(redirect ?? next);
  }, [params]);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(redirectTarget);
    }
  }, [loading, isAuthenticated, redirectTarget, router]);

  if (!loading && !authEnabled) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-sm text-[var(--text-secondary)]">
        Authentication is disabled for this environment.
      </div>
    );
  }

  if (!loading && isAuthenticated) {
    return null;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, confirmPassword }),
      });
      const body = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !body.success) {
        setError(body.error ?? "Signup failed");
        return;
      }
      await refreshSession();
      router.replace(redirectTarget);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <h1 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">Create account</h1>
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
          <span className="mb-1 block text-[var(--text-secondary)]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
            autoComplete="email"
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
            autoComplete="new-password"
            required
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Confirm Password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
            autoComplete="new-password"
            required
          />
        </label>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-[var(--accent-brand)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
        Already have an account?{" "}
        <Link
          href={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
          className="font-medium text-[var(--accent-brand)] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

