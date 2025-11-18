import React from "react";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Pause,
} from "lucide-react";

const SLAStatusBadge = ({ status, size = "md" }) => {
  const statusConfig = {
    Open: {
      icon: Clock,
      color: "#0F62FE",
      bgColor: "#0F62FE15",
      label: "Open",
    },
    InProgress: {
      icon: Clock,
      color: "#E2B93B",
      bgColor: "#E2B93B15",
      label: "In Progress",
    },
    Closed: {
      icon: CheckCircle,
      color: "#24A148",
      bgColor: "#24A14815",
      label: "Closed",
    },
    Breached: {
      icon: AlertTriangle,
      color: "#E01950",
      bgColor: "#E0195015",
      label: "Breached",
    },
    Extended: {
      icon: Pause,
      color: "#AC5098",
      bgColor: "#AC509815",
      label: "Extended",
    },
    Escalated: {
      icon: AlertTriangle,
      color: "#E2B93B",
      bgColor: "#E2B93B15",
      label: "Escalated",
    },
  };

  const config = statusConfig[status] || statusConfig["Open"];
  const IconComponent = config.icon;

  const sizeConfig = {
    sm: { padding: "0.25rem 0.5rem", fontSize: "0.75rem", iconSize: 12 },
    md: { padding: "0.375rem 0.75rem", fontSize: "0.813rem", iconSize: 14 },
    lg: { padding: "0.5rem 1rem", fontSize: "0.938rem", iconSize: 16 },
  };

  const currentSize = sizeConfig[size];

  return (
    <span
      className="badge d-inline-flex align-items-center gap-1"
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        padding: currentSize.padding,
        borderRadius: "6px",
        fontWeight: 600,
        fontSize: currentSize.fontSize,
        border: `1px solid ${config.color}30`,
      }}
    >
      <IconComponent size={currentSize.iconSize} />
      {config.label}
    </span>
  );
};

export default SLAStatusBadge;
