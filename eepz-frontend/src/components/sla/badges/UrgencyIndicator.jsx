import React from "react";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import "../../../styles/sla/components/UrgencyIndicator.css";

const UrgencyIndicator = ({
  urgencyStatus,
  daysUntilDeadline,
  showLabel = true,
}) => {
  const urgencyConfig = {
    Overdue: {
      icon: AlertTriangle,
      variant: "overdue",
      text: `Overdue by ${Math.abs(daysUntilDeadline)} day(s)`,
    },
    "Due Soon": {
      icon: Clock,
      variant: "due-soon",
      text: `${daysUntilDeadline} day(s) left`,
    },
    "On Track": {
      icon: CheckCircle,
      variant: "on-track",
      text: `${daysUntilDeadline} day(s) left`,
    },
  };

  const config = urgencyConfig[urgencyStatus] || urgencyConfig["On Track"];
  const IconComponent = config.icon;

  return (
    <div className={`ui-wrap ui-${config.variant}`}>
      <IconComponent className="ui-icon" size={16} strokeWidth={2.5} />
      {showLabel && <span className="ui-text">{config.text}</span>}
    </div>
  );
};

export default UrgencyIndicator;
