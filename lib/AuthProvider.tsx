import React, { createContext, useContext } from "react";
import { useAuth } from "../features/auth";
import type { AuthState } from "../features/auth";

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthState {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return value;
}
