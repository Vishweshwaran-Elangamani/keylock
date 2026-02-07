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
 
  const getProperty = (obj, camelKey, pascalKey) => {
    return obj?.[camelKey] ?? obj?.[pascalKey] ?? null;
  };
 
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
      console.error("Fetch MOM details error:", err);
 
      // Enhanced error handling
      if (err.retryAfter) {
        setError(`Rate limit exceeded. Please wait ${err.retryAfter} seconds.`);
        toastr.error(
          `Rate limit exceeded. Please wait ${err.retryAfter} seconds.`,
        );
      } else if (err.message) {
        setError(`Failed to load MOM details: ${err.message}`);
        toastr.error(`Failed to load MOM details: ${err.message}`);
      } else {
        setError("Failed to load MOM details");
        toastr.error("Failed to load MOM details");
      }
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
        className={`hrmom-badge ${badgeMap[type] || "hrmom-badge-secondary"}`}
      >
        {type || "Other"}
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
 
    if (status === "Completed") {
      return (
        <span className="hrmom-badge hrmom-badge-success hrmom-badge-icon">
          <CheckCircle size={14} /> Completed
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
    if (!mom) {
      return { total: 0, completed: 0, pending: 0, overdue: 0 };
    }
 
    const actionItems = getProperty(mom, "actionItems", "ActionItems");
 
    if (!Array.isArray(actionItems)) {
      return { total: 0, completed: 0, pending: 0, overdue: 0 };
    }
 
    const total = actionItems.length;
    let completed = 0;
    let pending = 0;
    let overdue = 0;
 
    actionItems.forEach((ai) => {
      const status = getProperty(ai, "status", "Status");
      const isOverdueFlag = getProperty(ai, "isOverdue", "IsOverdue");
      const dueDate = getProperty(ai, "dueDate", "DueDate");
 
      if (status === "Completed") {
        completed++;
      } else if (
        isOverdueFlag ||
        (status === "Pending" && dueDate && new Date(dueDate) < new Date())
      ) {
        overdue++;
      } else if (status === "Pending") {
        pending++;
      }
    });
 
    return { total, completed, pending, overdue };
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
            <h3 className="hrmom-error-title">{error || "MOM not found"}</h3>
            <p className="text-muted mb-4">
              The requested meeting minute could not be loaded.
            </p>
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
 
  // Extract properties with fallback
  const meetingTitle = getProperty(mom, "meetingTitle", "MeetingTitle");
  const meetingType = getProperty(mom, "meetingType", "MeetingType");
  const meetingDate = getProperty(mom, "meetingDate", "MeetingDate");
  const meetingLink = getProperty(mom, "meetingLink", "MeetingLink");
  const departmentName = getProperty(mom, "departmentName", "DepartmentName");
  const submittedByName = getProperty(
    mom,
    "submittedByEmployeeName",
    "SubmittedByEmployeeName",
  );
  const submittedByRole = getProperty(
    mom,
    "submittedByRole",
    "SubmittedByRole",
  );
  const createdAt = getProperty(mom, "createdAt", "CreatedAt");
  const updatedAt = getProperty(mom, "updatedAt", "UpdatedAt");
  const commentsObservations = getProperty(
    mom,
    "commentsObservations",
    "CommentsObservations",
  );
  const discussionPoints = getProperty(
    mom,
    "discussionPoints",
    "DiscussionPoints",
  );
  const actionItems = getProperty(mom, "actionItems", "ActionItems");
 
  return (
    <div className="hrmom-wrapper">
      <div className="hrmom-container">
        <nav aria-label="breadcrumb" className="hrmom-breadcrumb-nav">
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
                <Home size={18} />
              </a>
              <span className="hrmom-breadcrumb-slash">/</span>
            </li>
 
            <li className="breadcrumb-item hrmom-breadcrumb-item">
              <span
                onClick={() => {
                  if (window.history.length > 2) {
                    navigate(-1);
                  } else {
                    navigate("/hr/dashboard/mom");
                  }
                }}
                className="hrmom-breadcrumb-link"
                style={{ cursor: "pointer" }}
              >
                Meetings and MoM
              </span>
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
 
        <div className="hrmom-stats-grid">
          <div className="hrmom-stat-card">
            <div className="hrmom-stat-content">
              <MessageSquare
                size={24}
                className="hrmom-stat-icon hrmom-stat-icon-info"
              />
              <div className="hrmom-stat-info">
                <div className="hrmom-stat-value">
                  {Array.isArray(discussionPoints)
                    ? discussionPoints.length
                    : 0}
                </div>
                <div className="hrmom-stat-label">Discussion Points</div>
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
                <div className="hrmom-stat-value">{actionStats.total}</div>
                <div className="hrmom-stat-label">Action Items</div>
              </div>
            </div>
          </div>
        </div>
 
        <div className="hrmom-card">
          <div className="hrmom-card-body">
            <div className="hrmom-meeting-header">
              <div className="hrmom-meeting-info">
                <h3 className="hrmom-meeting-title">
                  {meetingTitle || "Untitled Meeting"}
                </h3>
                <div className="hrmom-meeting-badges">
                  {getMeetingTypeBadge(meetingType)}
                  {departmentName && (
                    <span className="hrmom-badge hrmom-badge-light">
                      <Users size={14} />
                      {departmentName}
                    </span>
                  )}
                </div>
              </div>
            </div>
 
            <div className="hrmom-meeting-details">
              <div className="hrmom-detail-item">
                <div className="hrmom-detail-content">
                  <div className="hrmom-detail-label">
                    Meeting Date &amp; Time
                  </div>
                  <div className="hrmom-detail-value">
                    {formatDateTime(meetingDate)}
                  </div>
                </div>
              </div>
 
              {meetingLink && (
                <div className="hrmom-detail-item">
                  <div className="hrmom-detail-content">
                    <div className="hrmom-detail-label">Meeting Link</div>
                    <a
                      href={meetingLink}
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
                <div className="hrmom-detail-content">
                  <div className="hrmom-detail-label">Submitted By</div>
                  <div className="hrmom-detail-value">
                    {submittedByName || "Unknown"}
                  </div>
                  {submittedByRole && (
                    <small className="hrmom-detail-meta">
                      {submittedByRole}
                    </small>
                  )}
                </div>
              </div>
 
              <div className="hrmom-detail-item">
                <div className="hrmom-detail-content">
                  <div className="hrmom-detail-label">Tracking</div>
                  {createdAt && (
                    <div className="hrmom-detail-value hrmom-detail-value-sm">
                      Created: {formatDate(createdAt)}
                    </div>
                  )}
                  {updatedAt && (
                    <div className="hrmom-detail-value hrmom-detail-value-sm">
                      Updated: {formatDate(updatedAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
 
        {/* Comments Section */}
        {commentsObservations && commentsObservations.trim() && (
          <div className="hrmom-card">
            <div className="hrmom-card-header">
              <h5 className="hrmom-card-title">
                <MessageSquare size={22} />
                Comments &amp; Observations
              </h5>
            </div>
            <div className="hrmom-card-body">
              <div className="hrmom-comments-box">{commentsObservations}</div>
            </div>
          </div>
        )}
 
        <div className="hrmom-two-column-grid">
          {/* Discussion Points */}
          <div className="hrmom-card">
            <div className="hrmom-card-header">
              <h5 className="hrmom-card-title">
                <MessageSquare size={22} />
                Discussion Points (
                {Array.isArray(discussionPoints) ? discussionPoints.length : 0})
              </h5>
            </div>
            <div className="hrmom-card-body">
              {Array.isArray(discussionPoints) &&
              discussionPoints.length > 0 ? (
                <div className="hrmom-discussion-list">
                  {discussionPoints.map((dp, index) => {
                    const pointId = getProperty(dp, "pointId", "PointId");
                    const pointText =
                      getProperty(dp, "pointText", "PointText") ||
                      getProperty(dp, "point", "Point");
                    const timestamp = getProperty(dp, "timestamp", "Timestamp");
 
                    return (
                      <div
                        key={pointId || index}
                        className="hrmom-discussion-item"
                      >
                        <div className="hrmom-discussion-index">
                          {index + 1}
                        </div>
                        <div className="hrmom-discussion-content">
                          <p className="hrmom-discussion-text">
                            {pointText || "No details"}
                          </p>
                          {timestamp && (
                            <small className="hrmom-discussion-time">
                              <Clock size={12} />
                              Discussed at: {formatDateTime(timestamp)}
                            </small>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="hrmom-empty-state">
                  <MessageSquare size={32} className="text-muted mb-2" />
                  <p className="mb-0">No discussion points recorded</p>
                </div>
              )}
            </div>
          </div>
 
          <div className="hrmom-card">
            <div className="hrmom-card-header">
              <h5 className="hrmom-card-title">
                <CheckCircle size={22} />
                Action Items ({actionStats.total})
              </h5>
            </div>
            <div className="hrmom-card-body">
              {Array.isArray(actionItems) && actionItems.length > 0 ? (
                <div className="hrmom-action-items-list">
                  {actionItems.map((ai, index) => {
                    const actionItemId = getProperty(
                      ai,
                      "actionItemId",
                      "ActionItemId",
                    );
                    const taskDescription =
                      getProperty(ai, "taskDescription", "TaskDescription") ||
                      getProperty(ai, "task", "Task");
                    const assignedToName =
                      getProperty(
                        ai,
                        "assignedToEmployeeName",
                        "AssignedToEmployeeName",
                      ) || getProperty(ai, "assignTo", "AssignTo");
                    const dueDate = getProperty(ai, "dueDate", "DueDate");
                    const status = getProperty(ai, "status", "Status");
                    const isOverdueFlag = getProperty(
                      ai,
                      "isOverdue",
                      "IsOverdue",
                    );
                    const priority = getProperty(ai, "priority", "Priority");
                    const notes = getProperty(ai, "notes", "Notes");
 
                    const isOverdue =
                      isOverdueFlag ||
                      (status === "Pending" &&
                        dueDate &&
                        new Date(dueDate) < new Date());
 
                    return (
                      <div
                        key={actionItemId || index}
                        className="hrmom-action-item"
                      >
                        <div className="hrmom-action-item-header">
                          <div className="hrmom-action-item-content">
                            <div className="hrmom-action-item-title">
                              {taskDescription || "No description"}
                            </div>
                            {notes && (
                              <small className="hrmom-action-item-notes">
                                {notes}
                              </small>
                            )}
                          </div>
                        </div>
                        <div className="hrmom-action-item-details">
                          <div className="hrmom-action-item-detail">
                            <User size={14} />
                            <span>{assignedToName || "Unassigned"}</span>
                          </div>
                          <div className="hrmom-action-item-detail">
                            <Calendar size={14} />
                            <span
                              className={isOverdue ? "hrmom-date-overdue" : ""}
                            >
                              {formatDate(dueDate)}
                            </span>
                          </div>
                        </div>
                        <div className="hrmom-action-item-badges">
                          {getStatusBadge(status, isOverdue)}
                          {priority && getPriorityBadge(priority)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="hrmom-empty-state">
                  <CheckCircle size={32} className="text-muted mb-2" />
                  <p className="mb-0">No action items recorded</p>
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
 
 