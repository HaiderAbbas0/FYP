import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

/* ─── Role definitions ─────────────────────────────────────────────────────── */
export type UserRole = "super_admin" | "analyst" | "viewer";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  token: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (newPass: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = "medisoc_session";

/* ─── Mock credential store (replace with real API call when backend arrives) ─ */
const MOCK_USERS: Record<string, { password: string; user: Omit<AuthUser, "token"> }> = {
  "admin@iomt-testbed.local": {
    password: "admin123",
    user: { id: "usr-001", email: "admin@iomt-testbed.local", name: "Super Admin", role: "super_admin" },
  },
  "analyst@iomt-testbed.local": {
    password: "analyst123",
    user: { id: "usr-002", email: "analyst@iomt-testbed.local", name: "SOC Analyst", role: "analyst" },
  },
  "viewer@iomt-testbed.local": {
    password: "viewer123",
    user: { id: "usr-003", email: "viewer@iomt-testbed.local", name: "Read-Only Viewer", role: "viewer" },
  },
};

function generateMockToken(email: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `mock.${btoa(email).replace(/=/g, "")}.${ts}.${rand}`;
}

/* ─── Provider ─────────────────────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  // Keep sessionStorage in sync
  useEffect(() => {
    if (user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      /* ── MOCK IMPLEMENTATION ──────────────────────────────────────────────
         Replace this entire block with a real API call:
           const res = await fetch("/api/auth/login", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ email, password }),
           });
           if (!res.ok) return { success: false, error: "Invalid credentials" };
           const { token, user: userData } = await res.json();
           setUser({ ...userData, token });
           return { success: true };
      ─────────────────────────────────────────────────────────────────────── */
      await new Promise((r) => setTimeout(r, 600)); // simulate network delay
      const entry = MOCK_USERS[email.trim().toLowerCase()];
      if (!entry || entry.password !== password) {
        return { success: false, error: "Invalid email or password." };
      }
      const token = generateMockToken(email);
      const authedUser: AuthUser = { ...entry.user, token };
      setUser(authedUser);
      return { success: true };
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const changePassword = useCallback(
    async (currentPass: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
      await new Promise((r) => setTimeout(r, 600));
      if (!user) return { success: false, error: "Not authenticated" };
      const entry = MOCK_USERS[user.email.toLowerCase()];
      
      if (!entry || entry.password !== currentPass) {
        return { success: false, error: "Incorrect current password." };
      }
      if (currentPass === newPass) {
        return { success: false, error: "New password must be different." };
      }
      
      // Update in-memory mock credential
      entry.password = newPass;
      return { success: true };
    },
    [user]
  );

  const resetPassword = useCallback(
    async (newPass: string): Promise<{ success: boolean; error?: string }> => {
      await new Promise((r) => setTimeout(r, 600));
      // In a real system, this takes a reset token. 
      // For this mock, we will reset the admin password.
      const entry = MOCK_USERS["admin@iomt-testbed.local"];
      if (entry) {
        entry.password = newPass;
      }
      return { success: true };
    },
    []
  );

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, changePassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ─── Hook ─────────────────────────────────────────────────────────────────── */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
