"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PROFILE_USERNAME_MAX_LENGTH,
  PROFILE_USERNAME_MIN_LENGTH,
  PROFILE_USERNAME_PATTERN,
} from "@/lib/validation/profile";

type Props = {
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
};

export function ProfileClient({ user }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState(user.username);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, avatarUrl: avatarUrl || null }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      setMessage("Profile updated successfully");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Profile Details</h2>
      <form onSubmit={handleSave} className="mt-4 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
            autoComplete="username"
            pattern={PROFILE_USERNAME_PATTERN}
            minLength={PROFILE_USERNAME_MIN_LENGTH}
            maxLength={PROFILE_USERNAME_MAX_LENGTH}
            required
            disabled={saving}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Email</span>
          <input
            value={user.email}
            readOnly
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-muted)]"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Avatar URL</span>
          <input
            type="url"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
            placeholder="https://example.com/avatar.png"
            disabled={saving}
          />
        </label>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--accent-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </section>
  );
}
