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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/account");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-sm text-[var(--text-secondary)]">
        Checking your session...
      </div>
    );
  }

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
        setError(result.error ?? "Invalid credentials");
        return;
      }
      router.replace(redirectTarget);
    } catch {
      setError("Unable to sign in right now. Please try again.");
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
            disabled={submitting}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Password</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 pr-10 text-[var(--text-primary)]"
              autoComplete="current-password"
              required
              disabled={submitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </label>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-[var(--accent-brand)] px-3 py-2 text-sm font-medium text-[#ffffff] disabled:opacity-60"
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
