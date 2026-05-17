"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

export default function AccountLogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await logout();
          router.replace("/login");
        } finally {
          setLoading(false);
        }
      }}
      className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-brand)]/70 disabled:opacity-60"
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}

