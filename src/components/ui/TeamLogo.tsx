interface TeamLogoProps {
  name: string;
  shortName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
};

const teamColors: Record<string, { bg: string; text: string }> = {
  india: { bg: "bg-blue-600", text: "text-white" },
  australia: { bg: "bg-yellow-500", text: "text-blue-900" },
  england: { bg: "bg-red-600", text: "text-white" },
  "south africa": { bg: "bg-green-600", text: "text-white" },
  pakistan: { bg: "bg-emerald-600", text: "text-white" },
  "sri lanka": { bg: "bg-blue-800", text: "text-yellow-400" },
  "west indies": { bg: "bg-maroon-700", text: "text-yellow-400" },
  bangladesh: { bg: "bg-green-700", text: "text-red-500" },
  new_zealand: { bg: "bg-gray-800", text: "text-white" },
  afghanistan: { bg: "bg-blue-700", text: "text-red-500" },
};

function getTeamColor(name: string): { bg: string; text: string } {
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(teamColors)) {
    if (lower.includes(key)) return value;
  }
  const hash = lower.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return {
    bg: `bg-[hsl(${hue},50%,35%)]`,
    text: "text-white",
  };
}

export default function TeamLogo({ name, shortName, size = "md", className = "" }: TeamLogoProps) {
  const colors = getTeamColor(name);
  const initials = (shortName ?? name).slice(0, 2).toUpperCase();

  return (
    <div
      className={`${sizeClasses[size]} ${colors.bg} ${colors.text} rounded-lg flex items-center justify-center font-bold shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}
