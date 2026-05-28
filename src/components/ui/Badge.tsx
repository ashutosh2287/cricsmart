type Color = "green" | "amber" | "red" | "gray" | "blue";

const palettes: Record<Color, { bg: string; text: string }> = {
  green: { bg: "var(--brand-light)", text: "var(--brand-text)" },
  amber: { bg: "var(--accent-light)", text: "#7a4a00" },
  red: { bg: "var(--danger-light)", text: "var(--danger)" },
  gray: { bg: "var(--surface-3)", text: "var(--text-2)" },
  blue: { bg: "#1e3a5f", text: "#7eb8f7" },
};

export function Badge({ label, color = "green" }: { label: string; color?: Color }) {
  const palette = palettes[color];
  return (
    <span
      style={{
        background: palette.bg,
        color: palette.text,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 20,
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
