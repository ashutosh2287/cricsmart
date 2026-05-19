import ProfileForm from "@/components/account/ProfileForm";
import { findById } from "@/lib/repositories/user.repository";
import { getRequiredRequestAuthSession } from "@/services/auth/serverRequestContext";

export default async function AccountProfilePage() {
  const session = await getRequiredRequestAuthSession();
  const user = await findById(session.userId);
  const displayName = user?.username ?? session.username;
  const email = user?.email ?? "";

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <div className="mb-6 flex items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">My Profile</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage your display name and account details</p>
        </div>
      </div>

      <ProfileForm initialDisplayName={displayName} email={email} avatarUrl={user?.avatarUrl} />
    </div>
  );
}
