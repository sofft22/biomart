import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { loading, user, store } = useAuth();

  if (loading) return null;
  if (!user || !store) return <Navigate to="/login" replace />;

  return <>{children}</>;
}