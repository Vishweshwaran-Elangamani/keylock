import React from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

const Breadcrumb = ({ items }) => {
  const navigate = useNavigate();

  return (
    <nav aria-label="breadcrumb" className="mb-3">
      <ol
        className="breadcrumb mb-0 p-3 rounded"
        style={{
          backgroundColor: "rgba(151, 36, 126, 0.05)",
          fontSize: "0.875rem",
        }}
      >
        <li className="breadcrumb-item">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/project-management/dashboard");
            }}
            style={{
              color: "var(--color-primary-3)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <Home size={18} />
            Dashboard
          </a>
        </li>
        {items.map((item, index) => (
          <li
            key={index}
            className={`breadcrumb-item ${
              index === items.length - 1 ? "active" : ""
            }`}
            aria-current={index === items.length - 1 ? "page" : undefined}
          >
            {index === items.length - 1 ? (
              <span
                style={{ color: "var(--color-primary-1)", fontWeight: 600 }}
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
                  color: "#97247E",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
