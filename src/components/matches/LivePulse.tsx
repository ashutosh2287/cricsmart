export function LivePulse() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--danger)] opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--danger)]" />
    </span>
  );
}
