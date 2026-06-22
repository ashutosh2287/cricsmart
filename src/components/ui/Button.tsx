"use client";

import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps {
  variant?: Variant;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function Button({ variant = "primary", loading, icon, children, style, disabled, type = "button", onClick, className }: ButtonProps) {
  const variantStyles: Record<Variant, React.CSSProperties> = {
    primary: {
      background: "var(--brand)",
      color: "var(--text-inv)",
      border: "none",
    },
    secondary: {
      background: "transparent",
      color: "var(--text-2)",
      border: "0.5px solid var(--border-med)",
    },
    danger: {
      background: "var(--danger-light)",
      color: "var(--danger)",
      border: "0.5px solid var(--danger)",
    },
    ghost: {
      background: "transparent",
      color: "var(--brand)",
      border: "none",
    },
  };

  return (
    <motion.button
      whileHover={
        variant === "primary"
          ? { scale: 1.02, boxShadow: "0 0 20px rgba(29, 158, 117, 0.35)" }
          : { scale: 1.02 }
      }
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
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
        cursor: loading ? "wait" : "pointer",
        position: "relative",
        overflow: "hidden",
        ...(style ?? {}),
      }}
      className={className}
      disabled={loading || disabled}
      type={type}
      onClick={onClick}
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
