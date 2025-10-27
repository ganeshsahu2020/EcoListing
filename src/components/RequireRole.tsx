import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type Props = { allow: Array<"superadmin" | "agent" | "user">; children: React.ReactNode };

export default function RequireRole({ allow, children }: Props) {
  const { loading, user, role } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/auth/login" state={{ from: loc }} replace />;
  if (!role || !allow.includes(role)) return <div className="p-6">Not authorized.</div>;
  return <>{children}</>;
}
