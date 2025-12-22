// GoalTimeline.jsx
import { useState, useEffect } from "react";
import goalService from "../../../services/goals/goalService";
import Alert from "../common/Alert";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  formatDateTime,
  getRelativeTime,
} from "../../../utils/goals/goalHelpers";
import styles from "../../../styles/goals/components/GoalTimeline.module.css";

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
    { value: "goal_created", label: "Creation", icon: "bi-plus-circle" },
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

      <div className={`card ${styles.card}`}>
        <div className={styles.header}>
          <div className={`d-flex justify-content-between align-items-center flex-wrap gap-3 ${styles.headerContent}`}>
            <h6 className={`mb-0 ${styles.title}`}>
              <i className="bi bi-clock-history me-2"></i>
              Timeline
              <span className={`badge bg-secondary ms-2 ${styles.eventCount}`}>
                {filteredEvents.length} events
              </span>
            </h6>

            <div className="d-flex gap-2 align-items-center flex-wrap">
              <div className="btn-group btn-group-sm" role="group">
                {eventTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`btn ${filter === type.value ? "btn-primary" : "btn-outline-secondary"} ${styles.filterBtn}`}
                    onClick={() => setFilter(type.value)}
                  >
                    <i className={`bi ${type.icon} me-1`}></i>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={`card-body ${styles.content}`}>
          {loading ? (
            <LoadingSpinner text="Loading timeline..." />
          ) : filteredEvents.length === 0 ? (
            <div className={styles.emptyState}>
              <i className={`bi bi-calendar-x ${styles.emptyIcon}`}></i>
              <p className={`mt-3 mb-1 ${styles.emptyTitle}`}>
                No events to display
              </p>
              <p className="text-muted small mb-0">
                {filter !== "all"
                  ? "Try selecting a different filter"
                  : "Activity will appear here"}
              </p>
            </div>
          ) : (
            <div className={styles.timelineContainer}>
              <div className={styles.verticalLine}></div>
              {filteredEvents.map((event, index) => {
                const eventColor = getEventColor(event.type);
                const eventIcon = getEventIcon(event.type);
                const eventTitle = getEventTitle(event.type);

                return (
                  <div
                    key={`${event.timestamp}-${index}`}
                    className={styles.eventWrapper}
                  >
                    <div 
                      className={`${styles.eventIcon} ${styles[event.type] || ''}`}
                      style={{ backgroundColor: eventColor }}
                    >
                      <i className={`bi ${eventIcon}`} ></i>
                    </div>

                    <div 
                      className={`card ${styles.eventCard}`}
                      onMouseEnter={(e) => e.currentTarget.classList.add(styles.hover)}
                      onMouseLeave={(e) => e.currentTarget.classList.remove(styles.hover)}
                    >
                      <div className={`card-body ${styles.eventCardBody}`}>
                        <div className={`d-flex justify-content-between align-items-start mb-2 ${styles.eventHeader}`}>
                          <h6 className={styles.eventTitle} style={{ color: eventColor }}>
                            {eventTitle}
                          </h6>
                          <small
                            className={`text-muted ${styles.eventTime}`}
                            title={formatDateTime(event.timestamp)}
                          >
                            <i className="bi bi-clock me-1"></i>
                            {formatDateTime(event.timestamp)}
                          </small>
                        </div>

                        {event.userName && (
                          <div className={`d-flex align-items-center gap-2 mb-2 ${styles.eventUser}`}>
                            <i className="bi bi-person-circle"></i>
                            <span className={styles.eventUserName}>{event.userName}</span>
                          </div>
                        )}

                        {event.description && (
                          <p className={`${styles.eventDescription}`}>
                            {event.description}
                          </p>
                        )}

                        {event.metadata &&
                          Object.keys(event.metadata).length > 0 && (
                          <div className={styles.metadataSection}>
                            <div className="row g-2">
                              {Object.entries(event.metadata).map(
                                ([key, value]) => (
                                  <div key={key} className="col-md-6">
                                    <div className={styles.metadataLabel}>
                                      <i className="bi bi-info-circle me-1"></i>
                                      {formatMetadataKey(key)}
                                    </div>
                                    <div className={styles.metadataValue}>
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
    </div>
  );
};

export default GoalTimeline;
