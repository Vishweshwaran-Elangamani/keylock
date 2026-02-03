import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import momService from "../../services/meeting/momService";
import toastr from "toastr";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Link as LinkIcon,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import "../../styles/mom/components/MomDetails.css";

const PRIMARY = "#27235C";

const MomDetails = () => {
  const { momId } = useParams();
  const navigate = useNavigate();
  const [mom, setMom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to get property with PascalCase/camelCase fallback
  const getProperty = (obj, camelKey, pascalKey) => {
    return obj?.[camelKey] ?? obj?.[pascalKey] ?? null;
  };

  useEffect(() => {
    if (momId) {
      fetchMomDetails(momId);
    }
  }, [momId]);

  const fetchMomDetails = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await momService.getMomById(id);

      // Extract mom data with fallback
      let momData = null;
      if (response?.success && response?.data) {
        momData = response.data;
      } else if (response?.Success && response?.Data) {
        momData = response.Data;
      } else if (response?.data) {
        momData = response.data;
      } else if (response?.Data) {
        momData = response.Data;
      } else if (response) {
        momData = response;
      }

      if (!momData) {
        throw new Error("No MOM data received");
      }

      setMom(momData);
    } catch (err) {
      console.error("Failed to fetch MOM details:", err);

      // Enhanced error handling
      if (err.retryAfter) {
        setError(`Rate limit exceeded. Please wait ${err.retryAfter} seconds.`);
        toastr.error(
          `Rate limit exceeded. Please wait ${err.retryAfter} seconds.`
        );
      } else if (err.message) {
        setError(`Failed to fetch MOM details: ${err.message}`);
        toastr.error(`Failed to fetch MOM details: ${err.message}`);
      } else {
        setError("Failed to fetch MOM details");
        toastr.error("Failed to fetch MOM details");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-US", {
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
      return new Date(dateString).toLocaleDateString("en-US", {
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
      return <span className="momd-badge momd-badge-danger">Overdue</span>;
    }

    if (status === "Completed") {
      return <span className="momd-badge momd-badge-success">Completed</span>;
    }

    if (status === "Pending") {
      return <span className="momd-badge momd-badge-warning">Pending</span>;
    }

    return <span className="momd-badge momd-badge-secondary">{status}</span>;
  };

  if (loading) {
    return (
      <div className="momd-page momd-center">
        <div className="momd-loading-container">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="momd-loading-text">Loading MOM details...</p>
        </div>
      </div>
    );
  }

  if (error || !mom) {
    return (
      <div className="momd-page momd-center">
        <div className="momd-error-container">
          <AlertCircle size={48} className="momd-error-icon mb-3" />
          <h5 className="momd-error-title mb-2">{error || "MOM Not Found"}</h5>
          <p className="momd-error-text mb-4">
            {error || "No MOM information available."}
          </p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} className="me-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Extract properties with fallback
  const meetingTitle =
    getProperty(mom, "meetingTitle", "MeetingTitle") || "Untitled Meeting";
  const meetingType = getProperty(mom, "meetingType", "MeetingType") || "Other";
  const meetingDate = getProperty(mom, "meetingDate", "MeetingDate");
  const meetingLink = getProperty(mom, "meetingLink", "MeetingLink");
  const attendees = getProperty(mom, "attendees", "Attendees");
  const commentsObservations = getProperty(
    mom,
    "commentsObservations",
    "CommentsObservations"
  );
  const discussionPoints = getProperty(
    mom,
    "discussionPoints",
    "DiscussionPoints"
  );
  const actionItems = getProperty(mom, "actionItems", "ActionItems");
  const submittedByName = getProperty(
    mom,
    "submittedByEmployeeName",
    "SubmittedByEmployeeName"
  );
  const createdAt = getProperty(mom, "createdAt", "CreatedAt");

  // Format attendees
  let formattedAttendees = "N/A";
  if (Array.isArray(attendees)) {
    formattedAttendees = attendees.length > 0 ? attendees.join(", ") : "N/A";
  } else if (typeof attendees === "string") {
    formattedAttendees = attendees || "N/A";
  }

  return (
    <div className="momd-page">
      <div className="momd-container">
        {/* Back Button */}
        <button
          className="btn btn-link momd-back-btn mb-3"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} className="me-2" />
          Back
        </button>

        <div className="momd-card">
          {/* Header */}
          <div className="momd-header" style={{ backgroundColor: PRIMARY }}>
            <div className="momd-header-text">
              <FileText size={32} className="momd-header-icon" />
              <div>
                <h2 className="momd-title">{meetingTitle}</h2>
                <span className="momd-type-badge">{meetingType}</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="momd-body">
            {/* Meeting Information */}
            <div className="momd-section momd-section-top">
              <h5 className="momd-section-title">
                <Calendar size={20} className="me-2" />
                Meeting Information
              </h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <p className="momd-field">
                    <span className="momd-field-label">
                      <Calendar size={16} className="me-1" />
                      Meeting Date:
                    </span>
                    <span className="momd-field-value">
                      {formatDateTime(meetingDate)}
                    </span>
                  </p>
                </div>

                <div className="col-md-6">
                  <p className="momd-field">
                    <span className="momd-field-label">
                      <FileText size={16} className="me-1" />
                      Meeting Type:
                    </span>
                    <span className="momd-field-value">{meetingType}</span>
                  </p>
                </div>

                {meetingLink && (
                  <div className="col-12">
                    <p className="momd-field">
                      <span className="momd-field-label">
                        <LinkIcon size={16} className="me-1" />
                        Meeting Link:
                      </span>
                      <a
                        href={meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="momd-link"
                      >
                        <LinkIcon size={14} className="me-1" />
                        Join Meeting
                      </a>
                    </p>
                  </div>
                )}

                <div className="col-12">
                  <p className="momd-field">
                    <span className="momd-field-label">
                      <Users size={16} className="me-1" />
                      Attendees:
                    </span>
                    <span className="momd-field-value">
                      {formattedAttendees}
                    </span>
                  </p>
                </div>

                {submittedByName && (
                  <div className="col-md-6">
                    <p className="momd-field">
                      <span className="momd-field-label">
                        <Users size={16} className="me-1" />
                        Submitted By:
                      </span>
                      <span className="momd-field-value">
                        {submittedByName}
                      </span>
                    </p>
                  </div>
                )}

                {createdAt && (
                  <div className="col-md-6">
                    <p className="momd-field">
                      <span className="momd-field-label">
                        <Clock size={16} className="me-1" />
                        Created:
                      </span>
                      <span className="momd-field-value">
                        {formatDate(createdAt)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Comments & Observations */}
            {commentsObservations && commentsObservations.trim() && (
              <section className="momd-section">
                <h5 className="momd-section-title">
                  <MessageSquare size={20} className="me-2" />
                  Comments &amp; Observations
                </h5>
                <div className="momd-comments-box">{commentsObservations}</div>
              </section>
            )}

            {/* Discussion Points */}
            <section className="momd-section">
              <h5 className="momd-section-title">
                <MessageSquare size={20} className="me-2" />
                Discussion Points
                {Array.isArray(discussionPoints) &&
                  discussionPoints.length > 0 && (
                    <span className="badge bg-primary ms-2">
                      {discussionPoints.length}
                    </span>
                  )}
              </h5>
              {Array.isArray(discussionPoints) &&
              discussionPoints.length > 0 ? (
                <ul className="momd-list">
                  {discussionPoints.map((dp, i) => {
                    const pointText =
                      getProperty(dp, "pointText", "PointText") ||
                      getProperty(dp, "point", "Point");
                    return (
                      <li key={i} className="momd-list-item">
                        <div className="momd-list-number">{i + 1}</div>
                        <div className="momd-list-content">
                          {pointText || "No details"}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="momd-empty-state">
                  <MessageSquare size={32} className="momd-empty-icon" />
                  <p className="momd-muted-text">
                    No discussion points recorded.
                  </p>
                </div>
              )}
            </section>

            {/* Action Items */}
            <section className="momd-section">
              <h5 className="momd-section-title">
                <CheckCircle size={20} className="me-2" />
                Action Items
                {Array.isArray(actionItems) && actionItems.length > 0 && (
                  <span className="badge bg-primary ms-2">
                    {actionItems.length}
                  </span>
                )}
              </h5>
              {Array.isArray(actionItems) && actionItems.length > 0 ? (
                <div className="momd-action-items-grid">
                  {actionItems.map((ai) => {
                    const actionItemId = getProperty(
                      ai,
                      "actionItemId",
                      "ActionItemId"
                    );
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

                    return (
                      <div key={actionItemId} className="momd-action-item-card">
                        <div className="momd-action-item-header">
                          <h6 className="momd-action-item-title">
                            {taskDescription || "No description"}
                          </h6>
                          {getStatusBadge(status, dueDate)}
                        </div>
                        <div className="momd-action-item-body">
                          <p className="momd-action-item-field">
                            <Users size={14} className="me-1" />
                            <strong>Assigned to:</strong>{" "}
                            {assignedToName || "N/A"}
                          </p>
                          <p className="momd-action-item-field">
                            <Calendar size={14} className="me-1" />
                            <strong>Due Date:</strong> {formatDate(dueDate)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="momd-empty-state">
                  <CheckCircle size={32} className="momd-empty-icon" />
                  <p className="momd-muted-text">No action items recorded.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MomDetails;
