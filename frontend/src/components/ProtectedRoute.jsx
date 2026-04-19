import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import SkeletonPage from "./SkeletonPage";

// Normalise role strings from backend
function normaliseRole(role = "") {
  const r = role.toUpperCase();
  if (r.includes("OWNER")) return "RESTAURANT_OWNER";
  if (r.includes("DRIVER") || r.includes("DELIVERY")) return "DRIVER";
  return "CUSTOMER";
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, user, fetchProfile } = useAuthStore();
  const location = useLocation();
  const [checking, setChecking] = useState(!user && !!token);

  useEffect(() => {
    if (token && !user) {
      fetchProfile().catch(() => {}).finally(() => setChecking(false));
    }
  }, [token]);

  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  if (checking) return <SkeletonPage />;

  // Role gate — if allowedRoles given, check membership
  if (allowedRoles && user) {
    const userRole = normaliseRole(user.role || "");
    const allowed  = allowedRoles.some(r => normaliseRole(r) === userRole);
    if (!allowed) {
      // Redirect to correct home
      if (userRole === "RESTAURANT_OWNER") return <Navigate to="/owner" replace />;
      if (userRole === "DRIVER")           return <Navigate to="/driver" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
