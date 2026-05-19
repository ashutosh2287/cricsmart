import PasswordChangeForm from "@/components/account/PasswordChangeForm";

export default function AccountSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Settings</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Change your account password securely.
      </p>
      <PasswordChangeForm />
    </div>
  );
}
