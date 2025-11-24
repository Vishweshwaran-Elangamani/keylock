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
import "../../../styles/sla/SLAHistoryTimeline.css";

const SLAHistoryTimeline = ({ history }) => {
  const getIconAndColor = (changeType) => {
    switch (changeType) {
      case "Created":
        return { icon: FileText, color: "#16A34A", label: "Created" };
      case "StatusChanged":
        return { icon: TrendingUp, color: "#3B82F6", label: "Status Changed" };
      case "Escalated":
      case "EscalatedToDeptHead":
        return { icon: AlertTriangle, color: "#F59E0B", label: "Escalated" };
      case "Reopened":
        return { icon: RotateCcw, color: "#8B5CF6", label: "Reopened" };
      case "Closed":
        return { icon: CheckCircle, color: "#10B981", label: "Closed" };
      case "ComplianceChanged":
        return { icon: Clock, color: "#6B7280", label: "Compliance Changed" };
      case "AutoClosed":
        return { icon: XCircle, color: "#EF4444", label: "Auto Closed" };
      default:
        return { icon: FileText, color: "#6B7280", label: changeType };
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
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
        <p className="sla-history-empty-text">No history available for this SLA</p>
      </div>
    );
  }

  return (
    <div className="sla-history-timeline">
      <div className="sla-history-timeline-line" />

      {history.map((item, index) => {
        const { icon: Icon, color, label } = getIconAndColor(item.changeType);

        return (
          <div key={item.historyId || index} className="sla-history-item">
            <div
              className="sla-history-icon-wrapper"
              style={{ borderColor: color }}
            >
              <Icon size={20} color={color} strokeWidth={2.5} />
            </div>

            <div className="sla-history-content">
              <div className="sla-history-card" style={{ borderLeftColor: color }}>
                <div className="sla-history-card-header">
                  <div className="sla-history-title-section">
                    <h6 className="sla-history-title" style={{ color }}>
                      {label}
                    </h6>
                    <div className="sla-history-meta">
                      <span className="sla-history-meta-item">
                        <Calendar size={14} />
                        {formatDateTime(item.createdAt)}
                      </span>
                      {item.changedByEmployeeName && (
                        <span className="sla-history-meta-item">
                          <User size={14} />
                          {item.changedByEmployeeName}
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
                        <span
                          className="sla-history-badge sla-history-badge-to"
                          style={{
                            backgroundColor: `${color}15`,
                            color: color,
                            borderColor: `${color}40`,
                          }}
                        >
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

                {item.referenceEscalationId && (
                  <div className="sla-history-reference">
                    <span className="sla-history-reference-badge">
                      Escalation #{item.referenceEscalationId}
                    </span>
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
