import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // ✅ WAIT PROPERLY
  if (loading) {
    return null;
  }

  // ✅ NOT LOGGED IN
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ EXTRA SAFETY (VERY IMPORTANT)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ ROLE CHECK
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role;

    const normalizedUserRole = userRole.toUpperCase().replace(/\s+/g, "");

    const normalizedAllowedRoles = allowedRoles.map((role) =>
      role.toUpperCase().replace(/\s+/g, "")
    );

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      const dashboardRoutes = {
        ADMIN: "/admin/dashboard",
        HR: "/hr/dashboard",
        DEPARTMENTHEAD: "/department-head/dashboard",
        LEADERSHIP: "/leadership/dashboard",
        MANAGER: "/manager/dashboard",
        EMPLOYEE: "/employee/dashboard",
      };

      return (
        <Navigate
          to={dashboardRoutes[normalizedUserRole] || "/employee/dashboard"}
          replace
        />
      );
    }
  }

  return children;
};

export default ProtectedRoute;