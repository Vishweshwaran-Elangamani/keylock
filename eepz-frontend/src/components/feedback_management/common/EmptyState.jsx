// src/components/EmptyState.jsx
import React from "react";

export default function EmptyState({
  icon,
  title = "No data found",
  subtitle,
}) {
  const Icon = icon || (() => null);
  return (
    <div
      className="card border-0"
      style={{
        boxShadow: "var(--shadow)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        minHeight: "240px",
      }}
    >
      <div className="card-body d-flex flex-column align-items-center justify-content-center text-center p-5">
        {icon && (
          <Icon
            size={56}
            className="mb-3"
            style={{ color: "var(--color-primary-3)", opacity: 0.5 }}
          />
        )}
        <h5 className="text-muted">{title}</h5>
        {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
      </div>
    </div>
  );
}
