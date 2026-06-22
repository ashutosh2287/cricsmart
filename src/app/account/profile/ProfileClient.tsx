"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  PROFILE_USERNAME_MAX_LENGTH,
  PROFILE_USERNAME_MIN_LENGTH,
  PROFILE_USERNAME_PATTERN,
} from "@/lib/validation/profile";
import { fadeUp, slideRight } from "@/components/ui/motion";

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
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-brand)]/20 to-[var(--accent-brand)]/5 flex items-center justify-center text-sm">
            ⚙️
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Profile Settings</h2>
            <p className="text-xs text-[var(--text-muted)]">Update your profile information</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="w-16 h-16 rounded-xl object-cover border border-[var(--border-subtle)]"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--accent-brand)] to-[var(--accent-brand)]/60 flex items-center justify-center text-xl font-bold text-white">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-xs text-[var(--text-muted)]">
              <p>Avatar Preview</p>
              <p className="mt-0.5">Enter a URL below to update</p>
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="profile-username" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Username
            </label>
            <input
              id="profile-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)]/30 focus:border-[var(--accent-brand)] transition-all"
              autoComplete="username"
              pattern={PROFILE_USERNAME_PATTERN}
              minLength={PROFILE_USERNAME_MIN_LENGTH}
              maxLength={PROFILE_USERNAME_MAX_LENGTH}
              required
              disabled={saving}
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Email
            </label>
            <input
              id="profile-email"
              value={user.email}
              readOnly
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)]/50 px-3 py-2.5 text-sm text-[var(--text-muted)] cursor-not-allowed"
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label htmlFor="profile-avatar-url" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Avatar URL
            </label>
            <input
              id="profile-avatar-url"
              type="url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)]/30 focus:border-[var(--accent-brand)] transition-all"
              placeholder="https://example.com/avatar.png"
              disabled={saving}
            />
          </div>

          {/* Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}
            {message && (
              <motion.p
                key="success"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2"
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" loading={saving} variant="primary">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
