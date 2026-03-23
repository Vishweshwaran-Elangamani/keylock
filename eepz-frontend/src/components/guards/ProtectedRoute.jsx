import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // 🔄 Loading state
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // 🔒 Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🔥 Extract role (clean & reliable)
  const userRole =
    user?.roleName ||
    user?.role ||
    user?.userRole ||
    "Employee";

  const normalizedUserRole = userRole.toUpperCase().replace(/\s+/g, "");

  // 🔐 Role-based access check
  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      role.toUpperCase().replace(/\s+/g, "")
    );

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      // 🔁 Redirect based on role
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

  // ✅ Access granted
  return children;
};

export default ProtectedRoute;