import React from "react";
import {
  Calendar,
  Clock,
  Users,
  Link as LinkIcon,
  MessageSquare,
  CheckCircle,
  User,
  FileText,
  AlertCircle,
  X,
} from "lucide-react";
import "../../../styles/mom/modals/MomDetailsView.css";

const MomDetailsView = ({ mom, onClose }) => {
  // Helper to get property with PascalCase/camelCase fallback
  const getProperty = (obj, camelKey, pascalKey) => {
    return obj?.[camelKey] ?? obj?.[pascalKey] ?? null;
  };

  if (!mom) return null;

  // Extract all properties with fallbacks
  const meetingTitle =
    getProperty(mom, "meetingTitle", "MeetingTitle") || "Untitled Meeting";
  const meetingType = getProperty(mom, "meetingType", "MeetingType") || "Other";
  const meetingDate = getProperty(mom, "meetingDate", "MeetingDate");
  const meetingLink = getProperty(mom, "meetingLink", "MeetingLink");
  const attendees = getProperty(mom, "attendees", "Attendees");
  const submittedByName = getProperty(
    mom,
    "submittedByEmployeeName",
    "SubmittedByEmployeeName"
  );
  const submittedByRole = getProperty(
    mom,
    "submittedByRole",
    "SubmittedByRole"
  );
  const departmentName = getProperty(mom, "departmentName", "DepartmentName");
  const commentsObservations = getProperty(
    mom,
    "commentsObservations",
    "CommentsObservations"
  );
  const discussionPoints =
    getProperty(mom, "discussionPoints", "DiscussionPoints") || [];
  const actionItems = getProperty(mom, "actionItems", "ActionItems") || [];
  const createdAt = getProperty(mom, "createdAt", "CreatedAt");
  const updatedAt = getProperty(mom, "updatedAt", "UpdatedAt");

  // Format attendees
  let formattedAttendees = "N/A";
  if (Array.isArray(attendees)) {
    formattedAttendees = attendees.length > 0 ? attendees.join(", ") : "N/A";
  } else if (typeof attendees === "string") {
    formattedAttendees = attendees || "N/A";
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusBadge = (status, dueDate) => {
    const isOverdue =
      status === "Pending" && dueDate && new Date(dueDate) < new Date();

    if (isOverdue) {
      return (
        <span className="badge bg-danger d-inline-flex align-items-center gap-1">
          <AlertCircle size={12} />
          Overdue
        </span>
      );
    }

    if (status === "Completed") {
      return (
        <span className="badge bg-success d-inline-flex align-items-center gap-1">
          <CheckCircle size={12} />
          Completed
        </span>
      );
    }
    
   
    
    return (
      <span className="badge bg-secondary d-inline-flex align-items-center gap-1">
        {status || "Unknown"}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    if (!priority) return null;

    const badgeMap = {
      High: "bg-danger",
      Medium: "bg-warning text-dark",
      Low: "bg-secondary",
    };

    return (
      <span className={`badge ${badgeMap[priority] || "bg-secondary"}`}>
        {priority}
      </span>
    );
  };

  return (
    <div
      className="mdv-overlay modal fade show d-block mdv-modal-open"
      tabIndex="-1"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mom-details-title"
    >
      <div
        className="mdv-dialog modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mdv-content modal-content border-0 shadow-lg">
          {/* Header */}
          <div className="mdv-header modal-header border-0">
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-2">
                <FileText size={24} className="text-primary" />
                <h5
                  id="mom-details-title"
                  className="mdv-title modal-title fw-bold mb-0"
                >
                  {meetingTitle}
                </h5>
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="mdv-type-pill badge bg-primary">
                  {meetingType}
                </span>
                {departmentName && (
                  <span className="badge bg-secondary d-inline-flex align-items-center gap-1">
                    <Users size={12} />
                    {departmentName}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Body */}
          <div className="mdv-body modal-body">
            {/* Meeting Information Card */}
            <div className="mdv-info-card card bg-light border-0 mb-4">
              <div className="card-body p-4">
                <h6 className="mdv-info-title fw-semibold mb-4 d-flex align-items-center gap-2">
                  <Calendar size={18} />
                  Meeting Information
                </h6>

                <div className="row g-4">
                  <div className="col-md-6">
                    <small className="mdv-muted text-muted d-block mb-1">
                      Meeting Date & Time:
                    </small>
                    <div className="fw-semibold d-flex align-items-center gap-2">
                      <Calendar
                        size={16}
                        className="mdv-icon-primary text-primary"
                      />
                      {formatDateTime(meetingDate)}
                    </div>
                  </div>

                  {meetingLink && (
                    <div className="col-md-6">
                      <small className="mdv-muted text-muted d-block mb-1">
                        Meeting Link:
                      </small>
                      <a
                        href={meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mdv-link fw-semibold d-flex align-items-center gap-2"
                      >
                        <LinkIcon size={16} />
                        Join Meeting
                        <LinkIcon size={12} className="rotate-45" />
                      </a>
                    </div>
                  )}

                  <div className="col-md-6">
                    <small className="mdv-muted text-muted d-block mb-1">
                      Attendees:
                    </small>
                    <div className="fw-semibold d-flex align-items-center gap-2">
                      <Users
                        size={16}
                        className="mdv-icon-primary text-primary"
                      />
                      {formattedAttendees}
                    </div>
                  </div>

                  {submittedByName && (
                    <div className="col-md-6">
                      <small className="mdv-muted text-muted d-block mb-1">
                        Submitted by:
                      </small>
                      <div className="fw-semibold d-flex align-items-center gap-2 mdv-submitter">
                        <User
                          size={16}
                          className="mdv-icon-primary text-primary"
                        />
                        <span>
                          {submittedByName}
                          {submittedByRole && ` (${submittedByRole})`}
                        </span>
                      </div>
                    </div>
                  )}

                  {createdAt && (
                    <div className="col-md-6">
                      <small className="mdv-muted text-muted d-block mb-1">
                        Created:
                      </small>
                      <div className="fw-semibold d-flex align-items-center gap-2">
                        <Clock
                          size={16}
                          className="mdv-icon-primary text-primary"
                        />
                        {formatDate(createdAt)}
                      </div>
                    </div>
                  )}

                  {updatedAt && (
                    <div className="col-md-6">
                      <small className="mdv-muted text-muted d-block mb-1">
                        Last Updated:
                      </small>
                      <div className="fw-semibold d-flex align-items-center gap-2">
                        <Clock
                          size={16}
                          className="mdv-icon-primary text-primary"
                        />
                        {formatDate(updatedAt)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Comments & Observations */}
            {commentsObservations && commentsObservations.trim() && (
              <div className="mb-4">
                <h6 className="mdv-section-title fw-semibold mb-3 d-flex align-items-center gap-2">
                  <MessageSquare size={18} />
                  Comments &amp; Observations
                </h6>
                <div className="mdv-comments alert alert-secondary mb-0">
                  {commentsObservations}
                </div>
              </div>
            )}

            <div className="mb-4">
              <h6 className="mdv-section-title fw-semibold mb-3 d-flex align-items-center gap-2">
                <MessageSquare size={18} />
                Discussion Points
                {Array.isArray(discussionPoints) &&
                  discussionPoints.length > 0 && (
                    <span className="badge bg-light text-dark">
                      {discussionPoints.length}
                    </span>
                  )}
              </h6>

              {Array.isArray(discussionPoints) &&
              discussionPoints.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {discussionPoints.map((dp, index) => {
                    const pointText =
                      getProperty(dp, "pointText", "PointText") ||
                      getProperty(dp, "point", "Point");
                    const timestamp = getProperty(dp, "timestamp", "Timestamp");

                    return (
                      <div
                        key={index}
                        className="mdv-discussion-item p-3 rounded d-flex align-items-start gap-3"
                      >

                        <div className="flex-grow-1">
                          <p className="mb-1">{pointText || "No details"}</p>
                          {timestamp && (
                            <small className="text-muted d-flex align-items-center gap-1">
                              <Clock size={12} />
                              {formatDateTime(timestamp)}
                            </small>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="alert alert-info mb-0 d-flex align-items-center gap-2">
                  <MessageSquare size={16} />
                  No discussion points recorded
                </div>
              )}
            </div>

            {/* Action Items */}
            <div className="mb-4">
              <h6 className="mdv-section-title fw-semibold mb-3 d-flex align-items-center gap-2">
                <CheckCircle size={18} />
                Action Items
                {Array.isArray(actionItems) && actionItems.length > 0 && (
                  <span className="badge bg-light text-dark">
                    {actionItems.length}
                  </span>
                )}
              </h6>

              {Array.isArray(actionItems) && actionItems.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {actionItems.map((ai, index) => {
                    const taskDescription =
                      getProperty(ai, "taskDescription", "TaskDescription") ||
                      getProperty(ai, "task", "Task");
                    const assignedToName =
                      getProperty(
                        ai,
                        "assignedToEmployeeName",
                        "AssignedToEmployeeName"
                      ) || getProperty(ai, "assignTo", "AssignTo");
                    const dueDate = getProperty(ai, "dueDate", "DueDate");
                    const status =
                      getProperty(ai, "status", "Status") || "Pending";
                    const priority = getProperty(ai, "priority", "Priority");
                    const notes = getProperty(ai, "notes", "Notes");

                    return (
                      <div key={index} className="mdv-action-item p-3 rounded">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h6 className="fw-semibold mb-0 flex-grow-1">
                            {taskDescription || "No description"}
                          </h6>
                          <div className="d-flex gap-2">
                            {getStatusBadge(status, dueDate)}
                            {getPriorityBadge(priority)}
                          </div>
                        </div>

                        {notes && (
                          <p className="text-muted small mb-2">{notes}</p>
                        )}

                        <div className="row g-2">
                          <div className="col-md-6">
                            <small className="text-muted d-flex align-items-center gap-2">
                              <User size={14} className="text-primary" />
                              <strong>Assigned to:</strong>{" "}
                              {assignedToName || "Unassigned"}
                            </small>
                          </div>

                          <div className="col-md-6">
                            <small className="text-muted d-flex align-items-center gap-2">
                              <Calendar size={14} className="text-danger" />
                              <strong>Due Date:</strong> {formatDate(dueDate)}
                            </small>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="alert alert-info mb-0 d-flex align-items-center gap-2">
                  <CheckCircle size={16} />
                  No action items recorded
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mdv-footer modal-footer border-0">
            <button
              type="button"
              onClick={onClose}
              className="mdv-close-btn btn btn-secondary px-4 d-flex align-items-center gap-2"
            >
              <X size={16} />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MomDetailsView;
