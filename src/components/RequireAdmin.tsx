import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { loading, user, store } = useAuth();

  // Show nothing while checking auth
  if (loading) return null;

  // Not logged in at all -> login
  if (!user || !store) return <Navigate to="/login" replace />;

  // Logged in, but not an admin -> kick to dashboard
  const isAdmin = (user as any).role === "admin";
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
