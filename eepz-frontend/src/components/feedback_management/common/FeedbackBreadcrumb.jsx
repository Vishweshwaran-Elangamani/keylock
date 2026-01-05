import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

const FeedbackBreadcrumb = ({ items }) => {
  const navigate = useNavigate();
  const [homeHover, setHomeHover] = useState(false);

  const accent = "var(--color-accent-1)";

  const css = useMemo(
    () => `
      .fb-breadcrumb-scope a,
      .fb-breadcrumb-scope a:link,
      .fb-breadcrumb-scope a:visited,
      .fb-breadcrumb-scope a:hover,
      .fb-breadcrumb-scope a:focus,
      .fb-breadcrumb-scope a:active {
        color: ${accent} !important;
        text-decoration: none !important;
      }

      .fb-breadcrumb-scope a:focus {
        outline: none !important;
        box-shadow: none !important;
      }
    `,
    [accent]
  );

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
    <nav aria-label="breadcrumb" className="mb-3 fb-breadcrumb-scope" style={{ "--bs-breadcrumb-divider": "''" }}>
      <style>{css}</style>

      <ol
        className="breadcrumb mb-0 p-0"
        style={{
          backgroundColor: "transparent",
          fontSize: "0.875rem",
          color: accent,
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
            onMouseEnter={() => setHomeHover(true)}
            onMouseLeave={() => setHomeHover(false)}
            style={{
              color: accent,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontWeight: 600,
              backgroundColor: homeHover ? "transparent" : "transparent",
            }}
            aria-label="Home"
            title="Home"
          >
            <Home size={18} color={accent} />
          </a>
          <span className="fb-breadcrumb-slash">/</span>
        </li>

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
                    color: accent,
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <span style={{ color: "#000", fontWeight: 600 }}>{item.label}</span>
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
