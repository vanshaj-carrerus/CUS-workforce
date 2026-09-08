"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Employee } from "./types";

export type LoginError = "not-found" | "invalid-password" | "password-not-set" | "network-error";
export type LoginResult = { ok: true; employee: Employee } | { ok: false; error: LoginError };

interface AuthContextValue {
  user: Employee | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  updateUser: (patch: Partial<Employee>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "custech-hr-identifier";

async function lookupEmployee(identifier: string): Promise<Employee | null> {
  try {
    const res = await fetch(`/api/employees/lookup?identifier=${encodeURIComponent(identifier)}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    if (!stored) {
      setLoading(false);
      return;
    }
    lookupEmployee(stored)
      .then((emp) => setUser(emp))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        const error: LoginError = data.error === "invalid-password" || data.error === "password-not-set" ? data.error : "not-found";
        return { ok: false, error };
      }

      const emp: Employee = data.employee;
      setUser(emp);
      try {
        window.localStorage.setItem(STORAGE_KEY, emp.employeeId);
      } catch {
        // ignore
      }
      return { ok: true, employee: emp };
    } catch {
      return { ok: false, error: "network-error" };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const updateUser = useCallback((patch: Partial<Employee>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
