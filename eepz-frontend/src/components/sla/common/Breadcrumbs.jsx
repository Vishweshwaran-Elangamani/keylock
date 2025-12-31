import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Home } from "lucide-react";

const Breadcrumb = ({ items, dynamicLabels = {} }) => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const resolveDynamicLabel = (item) => {
    if (item.param && params[item.param]) {
      if (dynamicLabels[item.param]) {
        return dynamicLabels[item.param];
      }
      return `SLA #${params[item.param]}`;
    }
    return item.label;
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
              navigate("/dashboard");
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
          <span style={{ color: "var(--color-accent-1)" }}>/</span>
        </li>

        {items.map((item, index) => {
          const resolvedLabel = resolveDynamicLabel(item);
          const isLast = index === items.length - 1;

          return (
            <li
              key={index}
              className={`breadcrumb-item d-flex align-items-center gap-1 ${
                isLast ? "active" : ""
              }`}
              aria-current={isLast ? "page" : undefined}
            >
              {isLast ? (
                <span
                  style={{
                    color: "var(--color-accent-1)",
                    fontWeight: 600,
                  }}
                >
                  {resolvedLabel}
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
                  {resolvedLabel}
                </a>
              )}

              {!isLast && (
                <span style={{ color: "var(--color-accent-1)" }}>/</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
