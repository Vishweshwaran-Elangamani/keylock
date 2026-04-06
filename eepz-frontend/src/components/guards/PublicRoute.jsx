import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth/AuthContext";

const normalizeRole = (role = "") =>
  role.toUpperCase().replace(/\s+/g, "");

const ROLE_DASHBOARD_MAP = {
  ADMIN: "/admin/dashboard",
  HR: "/hr/dashboard",
  DEPARTMENTHEAD: "/department-head/dashboard",
  MANAGER: "/manager/dashboard",
  EMPLOYEE: "/employee/dashboard",
  LEADERSHIP: "/leadership/dashboard",
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  /* ✅ 1. Wait for auth bootstrap */
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

  /* ✅ 2. Already authenticated → redirect */
  if (isAuthenticated && user) {
    const normalizedRole = normalizeRole(user.role);
    const redirectPath =
      ROLE_DASHBOARD_MAP[normalizedRole] || "/employee/dashboard";

    return <Navigate to={redirectPath} replace />;
  }

  /* ✅ 3. Public access allowed */
  return children;
};

export default PublicRoute;
