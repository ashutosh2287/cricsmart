import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, className = "", children, ...props }, ref) => {
    return (
      <div className="relative">
        {label && (
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.13em] text-[var(--text-2)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full appearance-none rounded-lg border border-[var(--border-med)] bg-[var(--surface-3)] px-3 py-2 pr-9 text-sm text-[var(--text-1)] transition-colors hover:border-[var(--border-bright)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/15 ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
