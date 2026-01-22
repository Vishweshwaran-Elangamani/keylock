import React from "react";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Pause,
} from "lucide-react";
import "../../../styles/sla/components/SLAStatusBadge.css";

const SLAStatusBadge = ({ status, size = "md" }) => {
  const statusConfig = {
    Open: { icon: Clock, label: "Open" },
    InProgress: { icon: Clock, label: "In Progress" },
    Closed: { icon: CheckCircle, label: "Closed" },
    Breached: { icon: AlertTriangle, label: "Breached" },
    Extended: { icon: Pause, label: "Extended" },
    Escalated: { icon: AlertTriangle, label: "Escalated" },
  };

  const config = statusConfig?.[status] || statusConfig.Open;
  const IconComponent = config.icon;

  const iconSizeMap = { sm: 12, md: 14, lg: 16 };
  const iconSize = iconSizeMap?.[size] || 14;

  const statusClass = `sla-status-badge--${String(status || "Open")
    .replace(/\s+/g, "")
    .toLowerCase()}`;

  const sizeClass = `sla-status-badge--${size}`;

  return (
    <span className={`sla-status-badge ${statusClass} ${sizeClass}`}>
      <IconComponent size={iconSize} className="sla-status-badge__icon" />
      <span className="sla-status-badge__text">{config.label}</span>
    </span>
  );
};

export default SLAStatusBadge;
