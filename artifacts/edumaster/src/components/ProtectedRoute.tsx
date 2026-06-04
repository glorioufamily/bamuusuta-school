import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";
import { Redirect } from "wouter";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}
