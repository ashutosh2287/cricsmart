import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1 text-xs text-[var(--text-3)] ${className}`}>
      <Link href="/" className="hover:text-[var(--text-1)] transition-colors">
        Home
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3" />
          {item.href ? (
            <Link href={item.href} className="hover:text-[var(--text-1)] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--text-2)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
