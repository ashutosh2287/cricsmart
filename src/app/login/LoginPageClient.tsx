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

export default function LoginPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, authEnabled, loading, isAuthenticated } = useAuth();

  const redirectTarget = useMemo(() => {
    const redirect = params.get("redirect");
    const next = params.get("next");
    return resolveRedirectTarget(redirect ?? next);
  }, [params]);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
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
      const result = await login(identifier, password);
      if (!result.success) {
        setError("Invalid credentials");
        return;
      }
      router.replace(redirectTarget);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <h1 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">Sign in</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Email or Username</span>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
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

      <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
        New to CricSmart?{" "}
        <Link
          href={`/signup?redirect=${encodeURIComponent(redirectTarget)}`}
          className="font-medium text-[var(--accent-brand)] hover:underline"
        >
          Create Account
        </Link>
      </p>
    </div>
  );
}

