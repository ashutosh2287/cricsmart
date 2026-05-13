"use client";

type MobileMenuButtonProps = {
  isOpen: boolean;
  onClick: () => void;
};

export default function MobileMenuButton({ isOpen, onClick }: MobileMenuButtonProps) {
  return (
    <button
      type="button"
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen}
      aria-controls="cricsmart-app-drawer"
      onClick={onClick}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-white/80 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80"
    >
      <span
        className={`absolute h-[2px] w-5 rounded-full bg-current transition duration-300 ${
          isOpen ? "rotate-45" : "-translate-y-[6px]"
        }`}
      />
      <span
        className={`absolute h-[2px] w-5 rounded-full bg-current transition duration-200 ${
          isOpen ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute h-[2px] w-5 rounded-full bg-current transition duration-300 ${
          isOpen ? "-rotate-45" : "translate-y-[6px]"
        }`}
      />
    </button>
  );
}
