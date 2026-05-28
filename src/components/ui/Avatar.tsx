export function Avatar({ name, size = 36, color = "var(--brand)" }: { name: string; size?: number; color?: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--brand-light)",
        border: `1.5px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: size * 0.36,
        color: "var(--brand-text)",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
