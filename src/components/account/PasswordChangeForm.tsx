"use client";

import { FormEvent, useState } from "react";

export default function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const body = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !body.success) {
        setError(body.error ?? "Failed to change password");
        return;
      }
      setSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Unable to change password right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-4 space-y-4" onSubmit={onSubmit}>
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--text-secondary)]">Current password</span>
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
          autoComplete="current-password"
          required
          disabled={submitting}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--text-secondary)]">New password</span>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
          autoComplete="new-password"
          required
          disabled={submitting}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--text-secondary)]">Confirm new password</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
          autoComplete="new-password"
          required
          disabled={submitting}
        />
      </label>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-[var(--accent-brand)] px-3 py-2 text-sm font-medium text-[#ffffff] disabled:opacity-60"
      >
        {submitting ? "Updating..." : "Change password"}
      </button>
    </form>
  );
}
