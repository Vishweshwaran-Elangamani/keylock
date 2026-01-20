import React from "react";
import "../../../styles/feedback/components/EmptyState.css";

export default function EmptyState({ icon, title = "No data found", subtitle }) {
  const Icon = icon || (() => null);

  return (
    <div className="empty-state-card">
      <div className="empty-state-body">
        {icon && <Icon size={56} className="empty-state-icon" />}
        <h5 className="empty-state-title">{title}</h5>
        {subtitle && <p className="empty-state-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
