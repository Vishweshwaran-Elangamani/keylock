import React from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

const FeedbackBreadcrumb = ({ items }) => {
  const navigate = useNavigate();

  // Get user from localStorage for home route
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
    <nav aria-label="breadcrumb" className="mb-3">
      <ol
        className="breadcrumb mb-0 p-3 rounded"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          fontSize: "0.875rem",
        }}
      >
        <li className="breadcrumb-item">
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
            }}
          >
            <Home size={14} />
            Dashboard
          </a>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={index}
              className={`breadcrumb-item ${isLast ? "active" : ""}`}
              aria-current={isLast ? "page" : undefined}
            >
              {isLast ? (
                <span
                  style={{ color: "var(--color-accent-1)", fontWeight: 600 }}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (item.path) navigate(item.path);
                  }}
                  style={{
                    color: "var(--color-accent-1)",
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default FeedbackBreadcrumb;
