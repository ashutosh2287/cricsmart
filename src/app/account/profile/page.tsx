import UserAvatar from "@/components/account/UserAvatar";
import { findById } from "@/lib/repositories/user.repository";
import { requireAuthenticatedPageSession } from "@/services/auth/pageAuth";

export default async function AccountProfilePage() {
  const session = await requireAuthenticatedPageSession("/account/profile");
  const user = await findById(session.userId);

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <div className="mb-6 flex items-center gap-3">
        <UserAvatar username={user?.username} avatarUrl={user?.avatarUrl} sizeClassName="h-12 w-12" textSizeClassName="text-sm" />
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">My Profile</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage profile details</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Username</span>
          <input
            value={user?.username ?? session.username}
            readOnly
            className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Email</span>
          <input
            value={user?.email ?? ""}
            readOnly
            className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Mobile Number (Future)</span>
          <input
            value=""
            readOnly
            placeholder="Will be available in a future release"
            className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-muted)]"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Avatar Upload (Future)</span>
          <input
            value={user?.avatarUrl ?? ""}
            readOnly
            placeholder="Avatar URL placeholder for future media integration"
            className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-muted)]"
          />
        </label>
      </div>

      <p className="mt-6 text-xs text-[var(--text-muted)]">
        Delete account, avatar upload, and advanced profile editing are reserved for future iterations.
      </p>
    </div>
  );
}

