type Props = {
  children: React.ReactNode;
  variant?: "cyan" | "green" | "mixed";
  as?: "h1" | "h2" | "h3" | "h4" | "span" | "p";
  className?: string;
};

const gradientStyles = {
  cyan: "gradient-text",
  green: "gradient-text-green",
  mixed: "gradient-text",
};

export default function GradientText({
  children,
  variant = "cyan",
  as: Tag = "span",
  className = "",
}: Props) {
  return <Tag className={`${gradientStyles[variant]} ${className}`}>{children}</Tag>;
}
