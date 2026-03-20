export default function GlassPanel({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
  bg-white/5
  backdrop-blur-lg
  border border-white/10
  rounded-2xl
  p-5
  shadow-lg
  shadow-black/30
  transition-all duration-300
  hover:border-white/20
  hover:scale-[1.01]
  ${className}
`}
    >
      {children}
    </div>
  );
}