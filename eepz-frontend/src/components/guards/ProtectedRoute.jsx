import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth/AuthContext";

const normalizeRole = (role = "") =>
  role.toUpperCase().replace(/\s+/g, "");

const ROLE_DASHBOARD_MAP = {
  ADMIN: "/admin/dashboard",
  HR: "/hr/dashboard",
  DEPARTMENTHEAD: "/department-head/dashboard",
  LEADERSHIP: "/leadership/dashboard",
  MANAGER: "/manager/dashboard",
  EMPLOYEE: "/employee/dashboard",
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  /* ✅ 1. Wait until auth is fully resolved */
  if (loading) {
    return null; // or <FullPageLoader />
  }

  /* ✅ 2. Not authenticated */
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  /* ✅ 3. Role-based authorization (if specified) */
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const userRole = normalizeRole(user.role);
    const allowed = allowedRoles.map(normalizeRole);

    if (!allowed.includes(userRole)) {
      return (
        <Navigate
          to={ROLE_DASHBOARD_MAP[userRole] || "/employee/dashboard"}
          replace
        />
      );
    }
  }

  /* ✅ 4. Authorized */
  return children;
};

export default ProtectedRoute;