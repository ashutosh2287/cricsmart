"use client";

import { type FormEvent, type InputHTMLAttributes, type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  user: {
    username: string;
    email: string;
    avatarUrl: string | null;
  };
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <h2 className="mb-4 border-b border-[var(--border-subtle)] pb-3 text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
      {children}
    </section>
  );
}

function Input({ label, className = "", ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">{label}</span>
      <input
        {...props}
        className={`w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition focus:border-[var(--accent-brand)] focus:outline-none disabled:cursor-not-allowed disabled:text-[var(--text-muted)] ${className}`}
      />
    </label>
  );
}

function Feedback({ message, error }: { message: string | null; error: string | null }) {
  if (message) {
    return (
      <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
        {message}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
        {error}
      </div>
    );
  }

  return null;
}

export function SettingsClient({ user }: Props) {
  const router = useRouter();

  const [username, setUsername] = useState(user.username);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [theme, setTheme] = useState<"dark" | "darker">("dark");
  const [emailNotifications, setEmailNotifications] = useState(true);

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, avatarUrl: avatarUrl || null }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setProfileError(data.error ?? "Failed to update profile");
        return;
      }

      setProfileMessage("Profile updated");
      router.refresh();
    } catch {
      setProfileError("Something went wrong");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setPasswordError(data.error ?? "Failed to change password");
        return;
      }

      setPasswordMessage("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Something went wrong");
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div>
      <Section title="Profile">
        <form onSubmit={handleProfileSave}>
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-emerald-500/20 text-xl font-bold uppercase text-emerald-400">
              {avatarUrl ? (
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${avatarUrl})` }}
                  aria-label={`${username} avatar`}
                  role="img"
                />
              ) : (
                user.username.slice(0, 2)
              )}
            </div>
            <div className="flex-1">
              <Input
                label="Avatar URL"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://your-image-url.com/photo.jpg"
                disabled={profileSaving}
              />
            </div>
          </div>

          <Input
            label="Display Name"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            minLength={2}
            maxLength={30}
            required
            disabled={profileSaving}
          />

          <Input label="Email" value={user.email} disabled />

          <Feedback message={profileMessage} error={profileError} />

          <button
            type="submit"
            disabled={profileSaving}
            className="w-full rounded-lg bg-[var(--accent-brand)] py-2.5 text-sm font-bold text-white transition hover:opacity-95 disabled:opacity-50"
          >
            {profileSaving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </Section>

      <Section title="Change Password">
        <form onSubmit={handlePasswordChange}>
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
            disabled={passwordSaving}
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            disabled={passwordSaving}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
            disabled={passwordSaving}
          />

          <Feedback message={passwordMessage} error={passwordError} />

          <button
            type="submit"
            disabled={passwordSaving}
            className="w-full rounded-lg bg-[var(--accent-brand)] py-2.5 text-sm font-bold text-white transition hover:opacity-95 disabled:opacity-50"
          >
            {passwordSaving ? "Changing..." : "Change Password"}
          </button>
        </form>
      </Section>

      <Section title="Preferences">
        <div className="mb-3 flex items-center justify-between border-b border-[var(--border-subtle)] py-2">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Email Notifications</p>
            <p className="text-xs text-[var(--text-secondary)]">Match results and platform updates</p>
          </div>
          <button
            type="button"
            onClick={() => setEmailNotifications((prev) => !prev)}
            className={`relative h-5 w-10 rounded-full transition-colors ${emailNotifications ? "bg-[var(--accent-brand)]" : "bg-[var(--border-subtle)]"}`}
            aria-label="Toggle email notifications"
            aria-pressed={emailNotifications}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${emailNotifications ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Interface Theme</p>
            <p className="text-xs text-[var(--text-secondary)]">Choose your preferred darkness level</p>
          </div>
          <div className="flex gap-2">
            {(["dark", "darker"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                  theme === option
                    ? "border-[var(--accent-brand)] text-[var(--accent-brand)]"
                    : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <section className="rounded-xl border border-red-500/20 p-6">
        <h2 className="mb-4 text-sm font-semibold text-red-400">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Delete Account</p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Permanently delete your account and all data. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.alert("Account deletion coming soon — contact support")}
            className="rounded-lg border border-red-500/30 px-4 py-2 text-xs text-red-400 transition hover:border-red-500/60"
          >
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
}
