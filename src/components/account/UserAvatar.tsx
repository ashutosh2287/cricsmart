type UserAvatarProps = {
  username?: string | null;
  avatarUrl?: string | null;
  sizeClassName?: string;
  textSizeClassName?: string;
};

function toInitials(username?: string | null): string {
  const value = username?.trim();
  if (!value) return "CS";
  const segments = value.split(/\s+/).filter(Boolean);
  if (segments.length === 1) return segments[0].slice(0, 2).toUpperCase();
  return `${segments[0][0] ?? ""}${segments[1][0] ?? ""}`.toUpperCase();
}

export default function UserAvatar({
  username,
  avatarUrl,
  sizeClassName = "h-8 w-8",
  textSizeClassName = "text-xs",
}: UserAvatarProps) {
  const initials = toInitials(username);

  if (avatarUrl) {
    return (
      <span className={`relative inline-flex overflow-hidden rounded-full border border-[var(--border-subtle)] ${sizeClassName}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt={`${username ?? "User"} avatar`} className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border border-[var(--accent-brand)]/45 bg-[var(--accent-brand)]/15 font-semibold text-[var(--text-primary)] ${sizeClassName} ${textSizeClassName}`}
      aria-label={`${username ?? "User"} avatar`}
    >
      {initials}
    </span>
  );
}
