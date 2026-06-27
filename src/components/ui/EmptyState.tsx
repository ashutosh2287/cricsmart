import { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-[var(--surface-3)] flex items-center justify-center mb-4">
        {icon ?? <Inbox className="w-6 h-6 text-[var(--text-3)]" />}
      </div>
      <p className="text-sm font-medium text-[var(--text-1)] mb-1">{title}</p>
      {description && (
        <p className="text-xs text-[var(--text-3)] max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
