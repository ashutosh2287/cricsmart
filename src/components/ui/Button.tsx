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

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--brand)] text-[var(--text-inv)] border-none hover:shadow-[var(--shadow-glow-cyan)]",
  secondary:
    "bg-transparent text-[var(--text-2)] border border-[var(--border-med)] hover:border-[var(--border-bright)] hover:text-[var(--text-1)]",
  danger:
    "bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]/30 hover:border-[var(--danger)]/60",
  ghost:
    "bg-transparent text-[var(--brand)] border-none hover:bg-[var(--surface-3)]",
};

export function Button({
  variant = "primary",
  loading,
  icon,
  children,
  style,
  disabled,
  type = "button",
  onClick,
  className = "",
}: ButtonProps) {
  return (
    <motion.button
      whileHover={variant === "primary" ? { scale: 1.02 } : { scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
      style={style}
      className={`inline-flex items-center gap-1.5 px-[18px] py-2 rounded-[var(--radius-md)] font-[var(--font-body)] font-medium text-sm relative overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      disabled={loading || disabled}
      type={type}
      onClick={onClick}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full inline-block animate-[spin_0.7s_linear_infinite]" />
      ) : (
        icon
      )}
      {children}
    </motion.button>
  );
}
