import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedUserRole = user?.role?.toUpperCase().replace(/\s+/g, "");
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
