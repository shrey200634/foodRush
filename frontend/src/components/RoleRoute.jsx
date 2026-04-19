import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

function normaliseRole(role = "") {
  const r = role.toUpperCase();
  if (r.includes("OWNER")) return "RESTAURANT_OWNER";
  if (r.includes("DRIVER") || r.includes("DELIVERY")) return "DRIVER";
  return "CUSTOMER";
}

export default function RoleRoute() {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  const role = normaliseRole(user?.role || "");
  if (role === "RESTAURANT_OWNER") return <Navigate to="/owner" replace />;
  if (role === "DRIVER")           return <Navigate to="/driver" replace />;
  return <Navigate to="/" replace />;
}
