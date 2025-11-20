import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Home } from "lucide-react";

const Breadcrumb = ({ items, dynamicLabels = {} }) => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  // Helper function to resolve dynamic labels
  const resolveDynamicLabel = (item) => {
    // If item has a dynamic key (e.g., ":slaid"), look it up in params
    if (item.param && params[item.param]) {
      // If dynamicLabels object has a fetched name, use it
      if (dynamicLabels[item.param]) {
        return dynamicLabels[item.param];
      }
      // Otherwise, show the param value
      return `SLA #${params[item.param]}`;
    }
    return item.label;
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
              navigate("/dashboard");
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
          const resolvedLabel = resolveDynamicLabel(item);
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
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
