import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, user, store } = useAuth();
  const loc = useLocation();

  // While auth is still resolving, render nothing (avoids a flash
  // of "logged out" state and a premature redirect).
  if (loading) return null;

  // Not logged in (or no store attached) → bounce to login,
  // remembering where they were headed.
  if (!user || !store) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return <>{children}</>;
}