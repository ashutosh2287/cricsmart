"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

type Props = {
  teamId: string;
};

export default function TeamEngagementButtons({ teamId }: Props) {
  const { authEnabled, isAuthenticated, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runAction(path: string, method: "POST" | "DELETE", successMessage: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(path, { method });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage(body.error ?? "Action failed");
        return;
      }
      setMessage(successMessage);
    } catch {
      setMessage("Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return null;
  }

  if (authEnabled && !isAuthenticated) {
    return <p className="text-xs text-[var(--text-muted)]">Sign in to follow or favorite this team.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => runAction(`/api/teams/${teamId}/follow`, "POST", "Following team")}
          className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-1.5 text-sm text-[var(--text-primary)] disabled:opacity-50"
        >
          Follow
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => runAction(`/api/teams/${teamId}/favorite`, "POST", "Added to favorites")}
          className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-1.5 text-sm text-[var(--text-primary)] disabled:opacity-50"
        >
          Favorite
        </button>
      </div>
      {message ? <p className="text-xs text-[var(--text-secondary)]">{message}</p> : null}
    </div>
  );
}
