import { useState, useEffect } from "react";
import goalService from "../../../services/goals/goalService";
import Alert from "../common/Alert";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  formatDateTime,
  getRelativeTime,
} from "../../../utils/goals/goalHelpers";

const GoalTimeline = ({ goalId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadTimeline();
  }, [goalId]);

  const loadTimeline = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await goalService.getTimeline(goalId);
      setEvents(response.data || []);
    } catch (error) {
      setAlert({
        type: "danger",
        message: error.response?.data?.message || "Failed to load timeline",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMetadataKey = (key) => {
    const formatted = key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    const specialCases = {
      "Progress Percent": "Progress",
      "Approval Type": "Type",
      "Self Goal Activation": "Self Goal Activation",
    };

    return specialCases[formatted] || formatted;
  };

  const formatMetadataValue = (key, value) => {
    if (value === null || value === undefined) return "N/A";

    if (typeof value === "boolean") return value ? "Yes" : "No";

    if (key.toLowerCase().includes("percent")) return `${value}%`;

    if (typeof value === "string") {
      const formatted = value
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

      const valueMap = {
        auto: "Automatic",
        manual: "Manual",
        approved: "Approved",
        pending: "Pending",
        rejected: "Rejected",
        selfgoalactivation: "Self Goal Activation",
        teamgoalactivation: "Team Goal Activation",
        taskacknowledgment: "Task Acknowledgment",
        completion: "Completion",
      };

      return valueMap[value.toLowerCase()] || formatted;
    }

    if (
      key.toLowerCase().includes("date") ||
      key.toLowerCase().includes("time")
    ) {
      return formatDateTime(value);
    }

    return String(value);
  };

  const getEventIcon = (type) => {
    const icons = {
      creation: "bi-plus-circle-fill",
      progress: "bi-arrow-up-circle-fill",
      approval: "bi-check-circle-fill",
      comment: "bi-chat-fill",
      assignment: "bi-person-plus-fill",
      attachment: "bi-paperclip",
      edit: "bi-pencil-fill",
      status_change: "bi-arrow-left-right",
      completion: "bi-flag-fill",
      reopened: "bi-arrow-clockwise",
    };
    return icons[type] || "bi-circle-fill";
  };

  const getEventColor = (type) => {
    const colors = {
      creation: "#28a745",
      progress: "#0d6efd",
      approval: "#ffc107",
      comment: "#6c757d",
      assignment: "#0dcaf0",
      attachment: "#6c757d",
      edit: "#ffc107",
      status_change: "#17a2b8",
      completion: "#198754",
      reopened: "#fd7e14",
    };
    return colors[type] || "#6c757d";
  };

  const getEventTitle = (type) => {
    const titles = {
      creation: "Goal Created",
      progress: "Progress Updated",
      approval: "Approval Action",
      comment: "Comment Added",
      assignment: "Team Member Assigned",
      attachment: "Attachment Added",
      edit: "Goal Updated",
      status_change: "Status Changed",
      completion: "Goal Completed",
      reopened: "Goal Reopened",
    };
    return titles[type] || "Event";
  };

  const filteredEvents = events.filter((event) => {
    if (filter === "all") return true;
    return event.type === filter;
  });

  const eventTypes = [
    { value: "all", label: "All", icon: "bi-list-ul" },
    { value: "progress", label: "Progress", icon: "bi-arrow-up-circle" },
    { value: "comment", label: "Comments", icon: "bi-chat" },
    { value: "approval", label: "Approvals", icon: "bi-check-circle" },
    { value: "assignment", label: "Assignments", icon: "bi-person-plus" },
    { value: "creation", label: "Creation", icon: "bi-plus-circle" },
  ];

  return (
    <div>
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div
        className="card"
        style={{
          border: "1px solid rgb(39, 35, 92, 0.5)",
          borderRadius: "12px",
        }}
      >
        {/* Header */}
        <div
          className="goal-card-header"
          style={{ backgroundColor: "#f8f9fa", padding: "1rem 1.25rem" }}
        >
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <h6 className="mb-0" style={{ fontWeight: 600, fontSize: "18px" }}>
              <i
                className="bi bi-clock-history me-2"
                style={{ color: "rgb(39, 35, 92)" }}
              ></i>
              Timeline
              <span
                className="badge bg-secondary ms-2"
                style={{ fontSize: "10px" }}
              >
                {filteredEvents.length} events
              </span>
            </h6>

            <div className="d-flex gap-2 align-items-center flex-wrap">
              {/* Filter Buttons */}
              <div className="btn-group btn-group-sm" role="group">
                {eventTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`btn ${
                      filter === type.value
                        ? "btn-primary"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => setFilter(type.value)}
                    style={{ fontSize: "12px", padding: "0.25rem 0.75rem" }}
                  >
                    <i className={`bi ${type.icon} me-1`}></i>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className="card-body"
          style={{ padding: "2rem", maxHeight: "700px", overflowY: "auto" }}
        >
          {loading ? (
            <LoadingSpinner text="Loading timeline..." />
          ) : filteredEvents.length === 0 ? (
            <div
              style={{ textAlign: "center", color: "#6c757d", padding: "3rem" }}
            >
              <i
                className="bi bi-calendar-x"
                style={{ fontSize: "4rem", opacity: 0.2 }}
              ></i>
              <p className="mt-3 mb-1" style={{ fontWeight: 500 }}>
                No events to display
              </p>
              <p className="text-muted small mb-0">
                {filter !== "all"
                  ? "Try selecting a different filter"
                  : "Activity will appear here"}
              </p>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              {/* Vertical Line */}
              <div
                style={{
                  position: "absolute",
                  left: "19px",
                  top: "20px",
                  bottom: "20px",
                  width: "2px",
                  background:
                    "linear-gradient(180deg, #dee2e6 0%, rgba(222, 226, 230, 0.3) 100%)",
                }}
              />

              {/* Events */}
              {filteredEvents.map((event, index) => {
                const eventColor = getEventColor(event.type);
                const eventIcon = getEventIcon(event.type);
                const eventTitle = getEventTitle(event.type);

                return (
                  <div
                    key={`${event.timestamp}-${index}`}
                    style={{
                      position: "relative",
                      paddingLeft: "3rem",
                      marginBottom:
                        index === filteredEvents.length - 1 ? 0 : "1.5rem",
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: eventColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                        border: "3px solid #fff",
                        zIndex: 2,
                      }}
                    >
                      <i
                        className={`bi ${eventIcon}`}
                        style={{ color: "#fff", fontSize: "1rem" }}
                      ></i>
                    </div>

                    {/* Card */}
                    <div
                      className="card"
                      style={{
                        border: "1px solid #dee2e6",
                        borderRadius: "8px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(0, 0, 0, 0.12)";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 2px 6px rgba(0, 0, 0, 0.08)";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <div className="card-body" style={{ padding: "1rem" }}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6
                            style={{
                              fontWeight: 600,
                              marginBottom: 0,
                              color: eventColor,
                            }}
                          >
                            {eventTitle}
                          </h6>
                          <small
                            className="text-muted"
                            style={{ fontSize: "12px", whiteSpace: "nowrap" }}
                            title={formatDateTime(event.timestamp)}
                          >
                            <i className="bi bi-clock me-1"></i>
                            {formatDateTime(event.timestamp)}
                          </small>
                        </div>

                        {event.userName && (
                          <div
                            className="d-flex align-items-center gap-2 mb-2"
                            style={{ fontSize: "0.875rem", color: "#6c757d" }}
                          >
                            <i className="bi bi-person-circle"></i>
                            <span style={{ fontWeight: 500 }}>
                              {event.userName}
                            </span>
                          </div>
                        )}

                        {event.description && (
                          <p
                            style={{
                              marginBottom: event.metadata ? "0.75rem" : 0,
                              fontSize: "0.9rem",
                              color: "#495057",
                              lineHeight: "1.5",
                            }}
                          >
                            {event.description}
                          </p>
                        )}

                        {event.metadata &&
                          Object.keys(event.metadata).length > 0 && (
                            <div
                              className="mt-2 pt-2"
                              style={{ borderTop: "1px solid #e9ecef" }}
                            >
                              <div className="row g-2">
                                {Object.entries(event.metadata).map(
                                  ([key, value]) => (
                                    <div key={key} className="col-md-6">
                                      <div
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "#6c757d",
                                          marginBottom: "0.25rem",
                                        }}
                                      >
                                        <i className="bi bi-info-circle me-1"></i>
                                        {formatMetadataKey(key)}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "0.85rem",
                                          color: "#212529",
                                          fontWeight: 500,
                                          paddingLeft: "1.25rem",
                                        }}
                                      >
                                        {formatMetadataValue(key, value)}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default GoalTimeline;
