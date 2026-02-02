import React from "react";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  FileText,
  TrendingUp,
  XCircle,
  User,
  Calendar,
} from "lucide-react";
import "../../../styles/sla/components/SLAHistoryTimeline.css";

const SLAHistoryTimeline = ({ history }) => {
  const getConfig = (changeType) => {
    switch (changeType) {
      case "Created":
        return { icon: FileText, label: "Created", variant: "created" };
      case "StatusChanged":
        return { icon: TrendingUp, label: "Status Changed", variant: "status" };
      case "Escalated":
      case "EscalatedToDeptHead":
        return {
          icon: AlertTriangle,
          label: "Escalated",
          variant: "escalated",
        };
      case "Reopened":
        return { icon: RotateCcw, label: "Reopened", variant: "reopened" };
      case "Closed":
        return { icon: CheckCircle, label: "Closed", variant: "closed" };
      case "ComplianceChanged":
        return {
          icon: Clock,
          label: "Compliance Changed",
          variant: "compliance",
        };
      case "AutoClosed":
        return { icon: XCircle, label: "Auto Closed", variant: "autoclosed" };
      default:
        return { icon: FileText, label: changeType, variant: "default" };
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!history || history.length === 0) {
    return (
      <div className="sla-history-empty">
        <Clock size={48} className="sla-history-empty-icon" />
        <p className="sla-history-empty-text">
          No history available for this SLA
        </p>
      </div>
    );
  }

  return (
    <div className="sla-history-timeline">
      <div className="sla-history-timeline-line" />

      {history.map((item, index) => {
        const { icon: Icon, label, variant } = getConfig(item.changeType);

        return (
          <div
            key={item.slahistoryId || index}
            className={`sla-history-item sla-history-variant-${variant}`}
          >
            <div className="sla-history-content">
              <div className="sla-history-card">
                <div className="sla-history-card-header">
                  <div className="sla-history-title-section">
                    <div className="sla-history-title-row">
                      <div className="sla-history-title-iconwrap">
                        <Icon size={20} strokeWidth={2.5} />
                      </div>
                      <h3 className="sla-history-title">{label}</h3>
                    </div>

                    <div className="sla-history-meta">
                      <span className="sla-history-meta-item">
                        <Calendar size={14} />
                        {formatDateTime(item.createdAt)}
                      </span>

                      {item.changedByName && (
                        <span className="sla-history-meta-item">
                          <User size={14} />
                          {item.changedByName}
                        </span>
                      )}
                    </div>
                  </div>

                  {(item.changedFrom || item.changedTo) && (
                    <div className="sla-history-badge-group">
                      {item.changedFrom && (
                        <span className="sla-history-badge sla-history-badge-from">
                          {item.changedFrom}
                        </span>
                      )}

                      {item.changedFrom && item.changedTo && (
                        <span className="sla-history-arrow">→</span>
                      )}

                      {item.changedTo && (
                        <span className="sla-history-badge sla-history-badge-to">
                          {item.changedTo}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {item.reason && (
                  <div className="sla-history-description">
                    <strong>Reason:</strong> {item.reason}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SLAHistoryTimeline;
