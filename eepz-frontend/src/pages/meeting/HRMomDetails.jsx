import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import momService from "../../services/meeting/momService";
import toastr from "toastr";
import {
  FileText,
  Calendar,
  Clock,
  Users,
  Link as LinkIcon,
  MessageSquare,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  User,
  Home,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/mom/components/HRMomDetails.css";

const HRMomDetails = () => {
  const { momId } = useParams();
  const navigate = useNavigate();
  const [mom, setMom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (momId) {
      fetchMomDetails();
    }
  }, [momId]);

  const fetchMomDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await momService.getMomById(momId);

      let momData = null;
      if (response.success && response.data) {
        momData = response.data;
      } else if (response.data) {
        momData = response.data;
      } else if (response) {
        momData = response;
      }

      setMom(momData);
    } catch (err) {
      console.error("Fetch MOM details error:", err);
      setError("Failed to load MOM details");
      toastr.error("Failed to load MOM details");
    } finally {
      setLoading(false);
    }
  };

  const getMeetingTypeBadge = (type) => {
    const badgeMap = {
      "One-on-One": "hrmom-badge-primary",
      "Team Meeting": "hrmom-badge-success",
      Presentation: "hrmom-badge-info",
      Other: "hrmom-badge-secondary",
    };
    return (
      <span
        className={`hrmom-badge ${
          badgeMap[type] || "hrmom-badge-secondary"
        }`}
      >
        {type}
      </span>
    );
  };

  const getStatusBadge = (status, isOverdue) => {
    if (isOverdue) {
      return (
        <span className="hrmom-badge hrmom-badge-danger hrmom-badge-icon">
          <AlertCircle size={14} /> Overdue
        </span>
      );
    }
    return null;
  };

  const getPriorityBadge = (priority) => {
    const badgeMap = {
      High: "hrmom-badge-danger",
      Medium: "hrmom-badge-warning",
      Low: "hrmom-badge-secondary",
    };
    return (
      <span
        className={`hrmom-badge ${
          badgeMap[priority] || "hrmom-badge-secondary"
        }`}
      >
        {priority}
      </span>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const calculateActionItemStats = () => {
    if (!mom?.actionItems || !Array.isArray(mom.actionItems)) {
      return { total: 0, completed: 0, pending: 0, overdue: 0 };
    }

    return {
      total: mom.actionItems.length,
      completed: mom.actionItems.filter(
        (ai) => ai.status === "Completed"
      ).length,
      pending: mom.actionItems.filter(
        (ai) => ai.status === "Pending" && !ai.isOverdue
      ).length,
      overdue: mom.actionItems.filter((ai) => ai.isOverdue).length,
    };
  };

  if (loading) {
    return (
      <div className="hrmom-wrapper hrmom-loading">
        <div className="hrmom-spinner-container">
          <div className="spinner-border text-primary hrmom-loading-spinner">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="hrmom-loading-text">Loading MOM details...</p>
        </div>
      </div>
    );
  }

  if (error || !mom) {
    return (
      <div className="hrmom-wrapper">
        <div className="hrmom-container">
          <div className="hrmom-error-card">
            <AlertCircle size={48} className="hrmom-error-icon" />
            <h3 className="hrmom-error-title">
              {error || "MOM not found"}
            </h3>
            <button
              className="hrmom-btn hrmom-btn-primary"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const actionStats = calculateActionItemStats();

  return (
    <div className="hrmom-wrapper">
      <div className="hrmom-container">
        {/* BREADCRUMB UPDATED */}
        <nav
          aria-label="breadcrumb"
          className="hrmom-breadcrumb-nav"
          style={{ "--bs-breadcrumb-divider": "''" }}
        >
          <ol className="breadcrumb hrmom-breadcrumb">
            <li className="breadcrumb-item hrmom-breadcrumb-item">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/hr/dashboard");
                }}
                className="hrmom-breadcrumb-link"
              >
                <Home size={14} />
                Dashboard
              </a>
              <span className="hrmom-breadcrumb-slash">/</span>
            </li>

            <li className="breadcrumb-item hrmom-breadcrumb-item">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/hr/dasboard/meetmom");
                }}
                className="hrmom-breadcrumb-link"
              >
                Meetings and MoM
              </a>
              <span className="hrmom-breadcrumb-slash">/</span>
            </li>

            <li
              className="breadcrumb-item active hrmom-breadcrumb-item"
              aria-current="page"
            >
              <span className="hrmom-breadcrumb-active">Details</span>
            </li>
          </ol>
        </nav>

        {/* STATS */}
        <div className="hrmom-stats-grid">
          <div className="hrmom-stat-card">
            <div className="hrmom-stat-content">
              <MessageSquare
                size={24}
                className="hrmom-stat-icon hrmom-stat-icon-info"
              />
              <div className="hrmom-stat-info">
                <div className="hrmom-stat-value">
                  {Array.isArray(mom.discussionPoints)
                    ? mom.discussionPoints.length
                    : 0}
                </div>
                <div className="hrmom-stat-label">
                  Discussion Points
                </div>
              </div>
            </div>
          </div>
          <div className="hrmom-stat-card">
            <div className="hrmom-stat-content">
              <CheckCircle
                size={24}
                className="hrmom-stat-icon hrmom-stat-icon-success"
              />
              <div className="hrmom-stat-info">
                <div className="hrmom-stat-value">
                  {actionStats.total}
                </div>
                <div className="hrmom-stat-label">Action Items</div>
              </div>
            </div>
          </div>
          <div className="hrmom-stat-card">
            <div className="hrmom-stat-content">
              <AlertCircle
                size={24}
                className="hrmom-stat-icon hrmom-stat-icon-danger"
              />
              <div className="hrmom-stat-info">
                <div className="hrmom-stat-value">
                  {actionStats.overdue}
                </div>
                <div className="hrmom-stat-label">Overdue Tasks</div>
              </div>
            </div>
          </div>
        </div>

        {/* MEETING CARD */}
        <div className="hrmom-card">
          <div className="hrmom-card-body">
            <div className="hrmom-meeting-header">
              <div className="hrmom-meeting-icon-wrapper">
                <div className="hrmom-meeting-icon">
                  <FileText size={35} />
                </div>
              </div>
              <div className="hrmom-meeting-info">
                <h3 className="hrmom-meeting-title">
                  {mom.meetingTitle}
                </h3>
                <div className="hrmom-meeting-badges">
                  {getMeetingTypeBadge(mom.meetingType)}
                  {mom.departmentName && (
                    <span className="hrmom-badge hrmom-badge-light">
                      <Users size={14} />
                      {mom.departmentName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="hrmom-meeting-details">
              <div className="hrmom-detail-item">
                <Calendar size={20} className="hrmom-detail-icon" />
                <div className="hrmom-detail-content">
                  <div className="hrmom-detail-label">
                    Meeting Date &amp; Time
                  </div>
                  <div className="hrmom-detail-value">
                    {formatDateTime(mom.meetingDate)}
                  </div>
                </div>
              </div>

              {mom.meetingLink && (
                <div className="hrmom-detail-item">
                  <LinkIcon size={20} className="hrmom-detail-icon" />
                  <div className="hrmom-detail-content">
                    <div className="hrmom-detail-label">Meeting Link</div>
                    <a
                      href={mom.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="hrmom-detail-link"
                    >
                      Join Meeting <LinkIcon size={12} />
                    </a>
                  </div>
                </div>
              )}

              <div className="hrmom-detail-item">
                <User size={20} className="hrmom-detail-icon" />
                <div className="hrmom-detail-content">
                  <div className="hrmom-detail-label">Submitted By</div>
                  <div className="hrmom-detail-value">
                    {mom.submittedByEmployeeName || "Unknown"}
                  </div>
                  {mom.submittedByRole && (
                    <small className="hrmom-detail-meta">
                      {mom.submittedByRole}
                    </small>
                  )}
                </div>
              </div>

              <div className="hrmom-detail-item">
                <Clock size={20} className="hrmom-detail-icon" />
                <div className="hrmom-detail-content">
                  <div className="hrmom-detail-label">Tracking</div>
                  <div className="hrmom-detail-value hrmom-detail-value-sm">
                    Created: {formatDate(mom.createdAt)}
                  </div>
                  {mom.updatedAt && (
                    <div className="hrmom-detail-value hrmom-detail-value-sm">
                      Updated: {formatDate(mom.updatedAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COMMENTS */}
        {mom.commentsObservations && (
          <div className="hrmom-card">
            <div className="hrmom-card-header">
              <h5 className="hrmom-card-title">
                <MessageSquare size={22} />
                Comments &amp; Observations
              </h5>
            </div>
            <div className="hrmom-card-body">
              <div className="hrmom-comments-box">
                {mom.commentsObservations}
              </div>
            </div>
          </div>
        )}

        {/* DISCUSSION + ACTION ITEMS */}
        <div className="hrmom-two-column-grid">
          {/* Discussion points */}
          <div className="hrmom-card">
            <div className="hrmom-card-header">
              <h5 className="hrmom-card-title">
                <MessageSquare size={22} />
                Discussion Points (
                {Array.isArray(mom.discussionPoints)
                  ? mom.discussionPoints.length
                  : 0}
                )
              </h5>
            </div>
            <div className="hrmom-card-body">
              {mom.discussionPoints &&
              Array.isArray(mom.discussionPoints) &&
              mom.discussionPoints.length > 0 ? (
                <div className="hrmom-discussion-list">
                  {mom.discussionPoints.map((dp, index) => (
                    <div
                      key={dp.pointId || index}
                      className="hrmom-discussion-item"
                    >
                      <span className="hrmom-discussion-number">
                        {index + 1}
                      </span>
                      <div className="hrmom-discussion-content">
                        <p className="hrmom-discussion-text">
                          {dp.pointText || dp.point || "No details"}
                        </p>
                        {dp.timestamp && (
                          <small className="hrmom-discussion-time">
                            <Clock size={12} />
                            Discussed at: {formatDateTime(dp.timestamp)}
                          </small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="hrmom-empty-state">
                  No discussion points recorded
                </div>
              )}
            </div>
          </div>

          {/* Action items */}
          <div className="hrmom-card">
            <div className="hrmom-card-header">
              <h5 className="hrmom-card-title">
                <CheckCircle size={22} />
                Action Items ({actionStats.total})
              </h5>
            </div>
            <div className="hrmom-card-body">
              {mom.actionItems &&
              Array.isArray(mom.actionItems) &&
              mom.actionItems.length > 0 ? (
                <div className="hrmom-action-items-list">
                  {mom.actionItems.map((ai, index) => (
                    <div
                      key={ai.actionItemId || index}
                      className="hrmom-action-item"
                    >
                      <div className="hrmom-action-item-header">
                        <div className="hrmom-action-item-number">
                          {index + 1}
                        </div>
                        <div className="hrmom-action-item-content">
                          <div className="hrmom-action-item-title">
                            {ai.taskDescription ||
                              ai.task ||
                              "No description"}
                          </div>
                          {ai.notes && (
                            <small className="hrmom-action-item-notes">
                              {ai.notes}
                            </small>
                          )}
                        </div>
                      </div>
                      <div className="hrmom-action-item-details">
                        <div className="hrmom-action-item-detail">
                          <User size={14} />
                          <span>
                            {ai.assignedToEmployeeName ||
                              ai.assignTo ||
                              "Unassigned"}
                          </span>
                        </div>
                        <div className="hrmom-action-item-detail">
                          <Calendar size={14} />
                          <span
                            className={
                              ai.isOverdue ? "hrmom-date-overdue" : ""
                            }
                          >
                            {formatDate(ai.dueDate)}
                          </span>
                        </div>
                      </div>
                      <div className="hrmom-action-item-badges">
                        {getStatusBadge(ai.status, ai.isOverdue)}
                        {ai.priority && getPriorityBadge(ai.priority)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="hrmom-empty-state">
                  No action items recorded
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRMomDetails;
