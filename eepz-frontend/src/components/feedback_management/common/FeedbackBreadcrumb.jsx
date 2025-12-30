import React from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

const FeedbackBreadcrumb = ({ items }) => {
  const navigate = useNavigate();


  const getHomeRoute = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const roleRoutes = {
        Employee: "/employee/dashboard",
        Manager: "/manager/dashboard",
        DepartmentHead: "/depthead/dashboard",
        HR: "/hr/dashboard",
      };
      return roleRoutes[user.roleName] || "/dashboard";
    } catch {
      return "/dashboard";
    }
  };

  return (
    <nav
      aria-label="breadcrumb"
      className="mb-3"
      style={{ "--bs-breadcrumb-divider": "''" }}
    >
      <ol
        className="breadcrumb mb-0 p-0"
        style={{
          backgroundColor: "transparent",
          fontSize: "0.875rem",
          color: "var(--color-accent-1)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <li className="breadcrumb-item d-flex align-items-center gap-1">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(getHomeRoute());
            }}
            style={{
              color: "var(--color-accent-1)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontWeight: 600,
            }}
          >
            <Home size={14} />
            Dashboard
          </a>
          <span className="fb-breadcrumb-slash">/</span>
        </li>

        {/* Other items – slash only if not last */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={index}
              className="breadcrumb-item d-flex align-items-center gap-1"
              aria-current={isLast ? "page" : undefined}
            >
              {item.path && !isLast ? (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                  style={{
                    color: "var(--color-accent-1)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <span
                  style={{
                    color: "var(--color-accent-1)",
                    fontWeight: 600,
                  }}
                >
                  {item.label}
                </span>
              )}

              {!isLast && <span className="fb-breadcrumb-slash">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default FeedbackBreadcrumb;
