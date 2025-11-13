import { Navigate } from "react-router-dom";

import { useAuth } from "../../contexts/auth/AuthContext";

const PublicRoute = ({ children }) => {
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

  if (isAuthenticated) {
    const role = user?.role || "Employee";

    const normalizedRole = role.toUpperCase().replace(/\s+/g, "");

    const routes = {
      ADMIN: "/admin/dashboard",

      HR: "/hr/dashboard",

      DEPARTMENTHEAD: "/department-head/dashboard",

      MANAGER: "/manager/dashboard",

      EMPLOYEE: "/employee/dashboard",

      LEADERSHIP: "/department-head/dashboard",
    };

    const redirectPath = routes[normalizedRole] || "/employee/dashboard";

    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default PublicRoute;
