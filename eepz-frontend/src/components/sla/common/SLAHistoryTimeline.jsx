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

const SLAHistoryTimeline = ({ history }) => {
  const getIconAndColor = (changeType) => {
    switch (changeType) {
      case "Created":
        return { icon: FileText, color: "#0F62FE", bgColor: "#0F62FE15" };
      case "StatusChanged":
        return { icon: TrendingUp, color: "#E2B93B", bgColor: "#E2B93B15" };
      case "Escalated":
      case "EscalatedToDeptHead":
        return { icon: AlertTriangle, color: "#E01950", bgColor: "#E0195015" };
      case "Reopened":
        return { icon: RotateCcw, color: "#AC5098", bgColor: "#AC509815" };
      case "Closed":
        return { icon: CheckCircle, color: "#24A148", bgColor: "#24A14815" };
      case "ComplianceChanged":
        return { icon: Clock, color: "#6B7280", bgColor: "#6B728015" };
      case "AutoClosed":
        return { icon: XCircle, color: "#E01950", bgColor: "#E0195015" };
      default:
        return { icon: FileText, color: "#6B7280", bgColor: "#6B728015" };
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
      <div className="text-center py-5">
        <Clock size={48} className="text-muted mb-3" />
        <p className="text-muted">No history available for this SLA</p>
      </div>
    );
  }

  return (
    <div className="position-relative">
      <div
        className="position-absolute"
        style={{
          left: "20px",
          top: "30px",
          bottom: "30px",
          width: "2px",
          backgroundColor: "#e0e0e0",
        }}
      />

      {history.map((item, index) => {
        const { icon: Icon, color, bgColor } = getIconAndColor(item.changeType);

        return (
          <div
            key={item.historyId || index}
            className="d-flex gap-3 mb-4 position-relative"
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 position-relative"
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: bgColor,
                border: `3px solid white`,
                zIndex: 1,
              }}
            >
              <Icon size={18} color={color} strokeWidth={2.5} />
            </div>

            <div className="flex-grow-1">
              <div
                className="card border-0 shadow-sm"
                style={{
                  borderRadius: "8px",
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="mb-1 fw-semibold" style={{ color }}>
                        {item.changeType}
                      </h6>
                      <div className="d-flex align-items-center gap-3 text-muted small">
                        <span className="d-flex align-items-center gap-1">
                          <Calendar size={12} />
                          {formatDateTime(item.createdAt)}
                        </span>
                        {item.changedByEmployeeName && (
                          <span className="d-flex align-items-center gap-1">
                            <User size={12} />
                            {item.changedByEmployeeName}
                          </span>
                        )}
                      </div>
                    </div>

                    {(item.changedFrom || item.changedTo) && (
                      <div className="d-flex align-items-center gap-2">
                        {item.changedFrom && (
                          <span className="badge bg-light text-dark border small">
                            {item.changedFrom}
                          </span>
                        )}
                        {item.changedFrom && item.changedTo && (
                          <span className="text-muted">→</span>
                        )}
                        {item.changedTo && (
                          <span
                            className="badge small"
                            style={{
                              backgroundColor: bgColor,
                              color,
                              border: `1px solid ${color}30`,
                            }}
                          >
                            {item.changedTo}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {item.reason && (
                    <p
                      className="mb-0 small text-muted"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {item.reason}
                    </p>
                  )}

                  {item.referenceEscalationId && (
                    <div className="mt-2">
                      <span className="badge bg-light text-dark border small">
                        Escalation #{item.referenceEscalationId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SLAHistoryTimeline;
