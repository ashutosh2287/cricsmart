"use client";

import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ variant = "primary", loading, icon, children, style, ...props }: ButtonProps) {
  const variantStyles: Record<Variant, React.CSSProperties> = {
    primary: { background: "var(--brand)", color: "var(--text-inv)", border: "none" },
    secondary: { background: "transparent", color: "var(--text-2)", border: "0.5px solid var(--border-med)" },
    danger: { background: "var(--danger-light)", color: "var(--danger)", border: "0.5px solid var(--danger)" },
    ghost: { background: "transparent", color: "var(--brand)", border: "none" },
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ opacity: 0.87 }}
      style={{
        ...variantStyles[variant],
        padding: "8px 18px",
        borderRadius: "var(--radius-md)",
        fontFamily: "var(--font-body)",
        fontWeight: 500,
        fontSize: 14,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        transition: "background 0.15s, opacity 0.15s",
        ...(style ?? {}),
      }}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: 14,
            height: 14,
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spin 0.7s linear infinite",
          }}
        />
      ) : (
        icon
      )}
      {children}
    </motion.button>
  );
}
