"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthRole } from "@/config/auth";

type AuthUser = {
  userId: string;
  username: string;
  role: AuthRole;
  email?: string;
  avatarUrl?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  authEnabled: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe(): Promise<{ user: AuthUser | null; authEnabled: boolean }> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  if (!res.ok) {
    return { user: null, authEnabled: false };
  }

  const body = (await res.json()) as {
    authEnabled?: boolean;
    user?: AuthUser | null;
  };

  return {
    user: body.user ?? null,
    authEnabled: Boolean(body.authEnabled),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const state = await fetchMe();
      setUser(state.user);
      setAuthEnabled(state.authEnabled);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const body = (await res.json()) as {
      success?: boolean;
      error?: string;
    };

    if (!res.ok || !body.success) {
      return { success: false, error: body.error ?? "Login failed" };
    }

    await refreshSession();
    return { success: true };
  }, [refreshSession]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    await refreshSession();
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authEnabled,
      loading,
      isAuthenticated: Boolean(user),
      refreshSession,
      login,
      logout,
    }),
    [user, authEnabled, loading, refreshSession, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
