"use client";

import { FormEvent, useState } from "react";
import UserAvatar from "@/components/account/UserAvatar";
import { useAuth } from "@/providers/AuthProvider";

type ProfileFormProps = {
  initialDisplayName: string;
  email: string;
  avatarUrl?: string | null;
};

export default function ProfileForm({ initialDisplayName, email, avatarUrl }: ProfileFormProps) {
  const { refreshSession } = useAuth();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      const body = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !body.success) {
        setError(body.error ?? "Failed to update profile");
        return;
      }
      setSuccess("Profile updated");
      await refreshSession();
    } catch {
      setError("Unable to update profile right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] p-3">
        <UserAvatar
          username={displayName}
          avatarUrl={avatarUrl}
          sizeClassName="h-12 w-12"
          textSizeClassName="text-sm"
        />
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Avatar preview</p>
          <p className="text-xs text-[var(--text-secondary)]">Using initials-based avatar for now</p>
        </div>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--text-secondary)]">Display Name</span>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
          autoComplete="username"
          required
          disabled={submitting}
        />
        <span className="mt-1 block text-xs text-[var(--text-muted)]">
          At least 3 characters. Use lowercase letters, numbers, or underscores.
        </span>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--text-secondary)]">Email</span>
        <input
          value={email}
          readOnly
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
        />
      </label>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-[var(--accent-brand)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
