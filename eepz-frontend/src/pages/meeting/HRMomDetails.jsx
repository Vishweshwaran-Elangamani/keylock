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
  Download,
  Share2,
  Building,
  Briefcase,
  Home,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

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
      console.log("MOM Details Response:", response);

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
      <span className={`hrmom-badge ${badgeMap[type] || "hrmom-badge-secondary"}`}>
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
    switch (status) {
      case "Completed":
        return (
          <span className="hrmom-badge hrmom-badge-success hrmom-badge-icon">
            <CheckCircle size={14} /> Completed
          </span>
        );
      case "Pending":
        return (
          <span className="hrmom-badge hrmom-badge-warning hrmom-badge-icon">
            <Clock size={14} /> Pending
          </span>
        );
      default:
        return (
          <span className="hrmom-badge hrmom-badge-secondary hrmom-badge-icon">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    const badgeMap = {
      High: "hrmom-badge-danger",
      Medium: "hrmom-badge-warning",
      Low: "hrmom-badge-secondary",
    };
    return (
      <span className={`hrmom-badge ${badgeMap[priority] || "hrmom-badge-secondary"}`}>
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
      completed: mom.actionItems.filter((ai) => ai.status === "Completed").length,
      pending: mom.actionItems.filter((ai) => ai.status === "Pending" && !ai.isOverdue).length,
      overdue: mom.actionItems.filter((ai) => ai.isOverdue).length,
    };
  };

  if (loading) {
    return (
      <div className="hrmom-wrapper hrmom-loading">
        <div className="hrmom-spinner-container">
          <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }}>
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
            <button className="hrmom-btn hrmom-btn-primary" onClick={() => navigate(-1)}>
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
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="hrmom-breadcrumb-nav">
          <ol className="breadcrumb hrmom-breadcrumb">
            <li className="breadcrumb-item">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/hr/dashboard");
                }}
                className="hrmom-breadcrumb-link"
              >
                <Home size={14} /> Dashboard
              </a>
            </li>
            <li className="breadcrumb-item">
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
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              <span className="hrmom-breadcrumb-active">Details</span>
            </li>
          </ol>
        </nav>

       
        {/* Quick Stats */}
        <div className="hrmom-stats-grid">
          <div className="hrmom-stat-card">
            <div className="hrmom-stat-content">
              <Users size={24} className="hrmom-stat-icon hrmom-stat-icon-primary" />
              <div className="hrmom-stat-info">
                <div className="hrmom-stat-value">
                  {Array.isArray(mom.attendees) ? mom.attendees.length : 0}
                </div>
                <div className="hrmom-stat-label">Attendees</div>
              </div>
            </div>
          </div>
          <div className="hrmom-stat-card">
            <div className="hrmom-stat-content">
              <MessageSquare size={24} className="hrmom-stat-icon hrmom-stat-icon-info" />
              <div className="hrmom-stat-info">
                <div className="hrmom-stat-value">
                  {Array.isArray(mom.discussionPoints) ? mom.discussionPoints.length : 0}
                </div>
                <div className="hrmom-stat-label">Discussion Points</div>
              </div>
            </div>
          </div>
          <div className="hrmom-stat-card">
            <div className="hrmom-stat-content">
              <CheckCircle size={24} className="hrmom-stat-icon hrmom-stat-icon-success" />
              <div className="hrmom-stat-info">
                <div className="hrmom-stat-value">{actionStats.total}</div>
                <div className="hrmom-stat-label">Action Items</div>
              </div>
            </div>
          </div>
          <div className="hrmom-stat-card">
            <div className="hrmom-stat-content">
              <AlertCircle size={24} className="hrmom-stat-icon hrmom-stat-icon-danger" />
              <div className="hrmom-stat-info">
                <div className="hrmom-stat-value">{actionStats.overdue}</div>
                <div className="hrmom-stat-label">Overdue Tasks</div>
              </div>
            </div>
          </div>
        </div>

        {/* Meeting Header Card */}
        <div className="hrmom-card">
          <div className="hrmom-card-body">
            <div className="hrmom-meeting-header">
              <div className="hrmom-meeting-icon-wrapper">
                <div className="hrmom-meeting-icon">
                  <FileText size={35} />
                </div>
              </div>
              <div className="hrmom-meeting-info">
                <h3 className="hrmom-meeting-title">{mom.meetingTitle}</h3>
                <div className="hrmom-meeting-badges">
                  {getMeetingTypeBadge(mom.meetingType)}
                  {mom.departmentName && (
                    <span className="hrmom-badge hrmom-badge-light">
                      <Building size={14} />
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
                  <div className="hrmom-detail-label">Meeting Date & Time</div>
                  <div className="hrmom-detail-value">{formatDateTime(mom.meetingDate)}</div>
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
                    <small className="hrmom-detail-meta">{mom.submittedByRole}</small>
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

        {/* Attendees Card */}
        <div className="hrmom-card">
          <div className="hrmom-card-header">
            <h5 className="hrmom-card-title">
              <Users size={22} />
              Attendees ({Array.isArray(mom.attendees) ? mom.attendees.length : 0})
            </h5>
          </div>
          <div className="hrmom-card-body">
            {mom.attendees && Array.isArray(mom.attendees) && mom.attendees.length > 0 ? (
              <div className="hrmom-attendees-grid">
                {mom.attendees.map((attendee, index) => {
                  const attendeeName =
                    typeof attendee === "string"
                      ? attendee
                      : attendee.name || attendee.employeeName || "Unknown";
                  return (
                    <div key={index} className="hrmom-attendee-card">
                      <div className="hrmom-attendee-avatar">
                        <User size={20} />
                      </div>
                      <div className="hrmom-attendee-info">
                        <div className="hrmom-attendee-name">{attendeeName}</div>
                        {typeof attendee === "object" && attendee.role && (
                          <small className="hrmom-attendee-role">
                            <Briefcase size={12} />
                            {attendee.role}
                          </small>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="hrmom-empty-state">No attendees recorded</div>
            )}
          </div>
        </div>

        {/* Comments/Observations Card */}
        {mom.commentsObservations && (
          <div className="hrmom-card">
            <div className="hrmom-card-header">
              <h5 className="hrmom-card-title">
                <MessageSquare size={22} />
                Comments & Observations
              </h5>
            </div>
            <div className="hrmom-card-body">
              <div className="hrmom-comments-box">{mom.commentsObservations}</div>
            </div>
          </div>
        )}

        {/* Discussion Points Card */}
        <div className="hrmom-card">
          <div className="hrmom-card-header">
            <h5 className="hrmom-card-title">
              <MessageSquare size={22} />
              Discussion Points (
              {Array.isArray(mom.discussionPoints) ? mom.discussionPoints.length : 0})
            </h5>
          </div>
          <div className="hrmom-card-body">
            {mom.discussionPoints &&
            Array.isArray(mom.discussionPoints) &&
            mom.discussionPoints.length > 0 ? (
              <div className="hrmom-discussion-list">
                {mom.discussionPoints.map((dp, index) => (
                  <div key={dp.pointId || index} className="hrmom-discussion-item">
                    <span className="hrmom-discussion-number">{index + 1}</span>
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
              <div className="hrmom-empty-state">No discussion points recorded</div>
            )}
          </div>
        </div>

        {/* Action Items Card */}
        <div className="hrmom-card">
          <div className="hrmom-card-header hrmom-card-header-between">
            <h5 className="hrmom-card-title">
              <CheckCircle size={22} />
              Action Items ({actionStats.total})
            </h5>
            <div className="hrmom-action-stats">
              <span className="hrmom-badge hrmom-badge-success">
                {actionStats.completed} Completed
              </span>
              <span className="hrmom-badge hrmom-badge-warning">
                {actionStats.pending} Pending
              </span>
              {actionStats.overdue > 0 && (
                <span className="hrmom-badge hrmom-badge-danger">
                  {actionStats.overdue} Overdue
                </span>
              )}
            </div>
          </div>
          <div className="hrmom-card-body hrmom-card-body-table">
            {mom.actionItems && Array.isArray(mom.actionItems) && mom.actionItems.length > 0 ? (
              <div className="hrmom-table-wrapper">
                <table className="hrmom-table">
                  <thead className="hrmom-table-header">
                    <tr>
                      <th style={{ width: "5%" }}>#</th>
                      <th style={{ width: "35%" }}>Task Description</th>
                      <th style={{ width: "20%" }}>Assigned To</th>
                      <th style={{ width: "15%" }}>Due Date</th>
                      <th style={{ width: "15%" }}>Status</th>
                      <th style={{ width: "10%" }}>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mom.actionItems.map((ai, index) => (
                      <tr key={ai.actionItemId || index}>
                        <td>
                          <div className="hrmom-table-number">{index + 1}</div>
                        </td>
                        <td>
                          <div className="hrmom-task-cell">
                            <CheckCircle size={16} className="hrmom-task-icon" />
                            <div>
                              <div className="hrmom-task-title">
                                {ai.taskDescription || ai.task || "No description"}
                              </div>
                              {ai.notes && <small className="hrmom-task-notes">{ai.notes}</small>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="hrmom-assignee-cell">
                            <User size={16} />
                            <span>{ai.assignedToEmployeeName || ai.assignTo || "Unassigned"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="hrmom-date-cell">
                            <Calendar size={14} />
                            <span className={ai.isOverdue ? "hrmom-date-overdue" : ""}>
                              {formatDate(ai.dueDate)}
                            </span>
                          </div>
                        </td>
                        <td>
                          {getStatusBadge(ai.status, ai.isOverdue)}
                        </td>
                        <td>
                          {ai.priority && getPriorityBadge(ai.priority)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="hrmom-empty-state">No action items recorded</div>
            )}
          </div>
        </div>

        {/* Metadata Card */}
        <div className="hrmom-card">
          <div className="hrmom-card-header">
            <h6 className="hrmom-card-title-small">System Information & Metadata</h6>
          </div>
          <div className="hrmom-card-body">
            <div className="hrmom-metadata-grid">
              <div className="hrmom-metadata-item">
                <small className="hrmom-metadata-label">MOM ID</small>
                <span className="hrmom-metadata-value hrmom-metadata-code">{mom.momId}</span>
              </div>
              <div className="hrmom-metadata-item">
                <small className="hrmom-metadata-label">Created At</small>
                <span className="hrmom-metadata-value">{formatDateTime(mom.createdAt)}</span>
              </div>
              {mom.updatedAt && (
                <div className="hrmom-metadata-item">
                  <small className="hrmom-metadata-label">Last Updated</small>
                  <span className="hrmom-metadata-value">{formatDateTime(mom.updatedAt)}</span>
                </div>
              )}
              {mom.submittedById && (
                <div className="hrmom-metadata-item">
                  <small className="hrmom-metadata-label">Submitted By ID</small>
                  <span className="hrmom-metadata-value hrmom-metadata-code">
                    {mom.submittedById}
                  </span>
                </div>
              )}
              {mom.departmentId && (
                <div className="hrmom-metadata-item">
                  <small className="hrmom-metadata-label">Department ID</small>
                  <span className="hrmom-metadata-value hrmom-metadata-code">
                    {mom.departmentId}
                  </span>
                </div>
              )}
              {mom.projectId && (
                <div className="hrmom-metadata-item">
                  <small className="hrmom-metadata-label">Project ID</small>
                  <span className="hrmom-metadata-value hrmom-metadata-code">
                    {mom.projectId}
                  </span>
                </div>
              )}
              <div className="hrmom-metadata-item">
                <small className="hrmom-metadata-label">Status</small>
                <span className="hrmom-badge hrmom-badge-success">Active</span>
              </div>
              <div className="hrmom-metadata-item">
                <small className="hrmom-metadata-label">Visibility</small>
                <span className="hrmom-badge hrmom-badge-info">
                  {mom.isPrivate ? "Private" : "Public"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Internal CSS */}
      <style>{`
        /* Wrapper */
        .hrmom-wrapper {
          padding: 1.5rem 2rem;
          background-color: #f8f9fa;
          min-height: 100vh;
        }

        .hrmom-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .hrmom-loading {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hrmom-spinner-container {
          text-align: center;
        }

        .hrmom-loading-text {
          color: #6c757d;
          margin-top: 1rem;
          font-size: 0.95rem;
        }

        /* Breadcrumb */
        .hrmom-breadcrumb-nav {
          margin-bottom: 1.5rem;
        }

        .hrmom-breadcrumb {
          background: #ffffff;
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          font-size: 0.875rem;
          margin-bottom: 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .hrmom-breadcrumb-link {
          color: #97247E;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          transition: color 0.2s;
        }

        .hrmom-breadcrumb-link:hover {
          color: #7A1D66;
          text-decoration: underline;
        }

        .hrmom-breadcrumb-active {
          color: #7A1D66;
          font-weight: 600;
        }

        /* Header */
        .hrmom-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .hrmom-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .hrmom-btn-back {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }

        .hrmom-btn-back:hover {
          background: #f8f9fa;
          transform: translateX(-2px);
        }

        .hrmom-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          line-height: 1.2;
        }

        .hrmom-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0.25rem 0 0;
        }

        .hrmom-header-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        /* Buttons */
        .hrmom-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .hrmom-btn-primary {
          background: #3b82f6;
          color: #ffffff;
        }

        .hrmom-btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }

        .hrmom-btn-success {
          background: #10b981;
          color: #ffffff;
        }

        .hrmom-btn-success:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
        }

        .hrmom-btn-outline {
          background: #ffffff;
          color: #3b82f6;
          border: 1.5px solid #3b82f6;
        }

        .hrmom-btn-outline:hover {
          background: #eff6ff;
          transform: translateY(-1px);
        }

        /* Stats Grid - LEFT ALIGNED */
        .hrmom-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .hrmom-stat-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 2px solid #27235C;
          transition: transform 0.2s;
        }

        .hrmom-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .hrmom-stat-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .hrmom-stat-icon {
          flex-shrink: 0;
        }

        .hrmom-stat-icon-primary {
          color: #3b82f6;
        }

        .hrmom-stat-icon-info {
          color: #06b6d4;
        }

        .hrmom-stat-icon-success {
          color: #10b981;
        }

        .hrmom-stat-icon-danger {
          color: #ef4444;
        }

        .hrmom-stat-info {
          text-align: left;
        }

        .hrmom-stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .hrmom-stat-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
        }

        /* Cards */
        .hrmom-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 2px solid #27235C;
          margin-bottom: 1.5rem;
          overflow: hidden;
        }

        .hrmom-card-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .hrmom-card-header-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .hrmom-card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .hrmom-card-title-small {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .hrmom-card-body {
          padding: 1.5rem;
        }

        .hrmom-card-body-table {
          padding: 0;
        }

        /* Meeting Header */
        .hrmom-meeting-header {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .hrmom-meeting-icon-wrapper {
          flex-shrink: 0;
        }

        .hrmom-meeting-icon {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: #e3f2fd;
          color: #1976d2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hrmom-meeting-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.75rem;
        }

        .hrmom-meeting-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        /* Badges */
        .hrmom-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
        }

        .hrmom-badge-icon {
          gap: 0.5rem;
        }

        .hrmom-badge-primary {
          background: #dbeafe;
          color: #1e40af;
        }

        .hrmom-badge-success {
          background: #dcfce7;
          color: #15803d;
        }

        .hrmom-badge-info {
          background: #e0f2fe;
          color: #0369a1;
        }

        .hrmom-badge-warning {
          background: #fef3c7;
          color: #b45309;
        }

        .hrmom-badge-danger {
          background: #fee2e2;
          color: #b91c1c;
        }

        .hrmom-badge-secondary {
          background: #f1f5f9;
          color: #475569;
        }

        .hrmom-badge-light {
          background: #f8f9fa;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }

        /* Meeting Details */
        .hrmom-meeting-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .hrmom-detail-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .hrmom-detail-icon {
          color: #3b82f6;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .hrmom-detail-content {
          text-align: left;
        }

        .hrmom-detail-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .hrmom-detail-value {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
        }

        .hrmom-detail-value-sm {
          font-size: 0.85rem;
          font-weight: 600;
          color: #1e293b;
        }

        .hrmom-detail-meta {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        .hrmom-detail-link {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          transition: color 0.2s;
        }

        .hrmom-detail-link:hover {
          color: #2563eb;
          text-decoration: underline;
        }

        /* Attendees */
        .hrmom-attendees-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
        }

        .hrmom-attendee-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .hrmom-attendee-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: #e3f2fd;
          color: #1976d2;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .hrmom-attendee-info {
          text-align: left;
        }

        .hrmom-attendee-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
        }

        .hrmom-attendee-role {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        /* Comments */
        .hrmom-comments-box {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          white-space: pre-wrap;
          font-size: 0.95rem;
          color: #1e293b;
          line-height: 1.6;
          text-align: left;
        }

        /* Discussion Points */
        .hrmom-discussion-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .hrmom-discussion-item {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          gap: 1rem;
        }

        .hrmom-discussion-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #3b82f6;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .hrmom-discussion-content {
          text-align: left;
        }

        .hrmom-discussion-text {
          font-size: 1rem;
          color: #1e293b;
          line-height: 1.6;
          margin: 0;
        }

        .hrmom-discussion-time {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.5rem;
        }

        /* Action Stats */
        .hrmom-action-stats {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        /* Table */
        .hrmom-table-wrapper {
          overflow-x: auto;
        }

        .hrmom-table {
          width: 100%;
          border-collapse: collapse;
        }

        .hrmom-table-header {
          background: #27235C;
        }

        .hrmom-table-header th {
          padding: 1rem 1.25rem;
          text-align: left;
          font-size: 0.875rem;
          font-weight: 600;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          white-space: nowrap;
        }

        .hrmom-table tbody tr {
          border-bottom: 1px solid #e2e8f0;
          transition: background 0.15s;
        }

        .hrmom-table tbody tr:last-child {
          border-bottom: none;
        }

        .hrmom-table tbody tr:hover {
          background: #f8f9fa;
        }

        .hrmom-table tbody td {
          padding: 1rem 1.25rem;
          font-size: 0.875rem;
          color: #1e293b;
          vertical-align: middle;
          text-align: left;
        }

        .hrmom-table-number {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #3b82f6;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .hrmom-task-cell {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .hrmom-task-icon {
          color: #3b82f6;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .hrmom-task-title {
          font-weight: 600;
          color: #1e293b;
          text-align: left;
        }

        .hrmom-task-notes {
          display: block;
          color: #64748b;
          margin-top: 0.25rem;
          font-size: 0.75rem;
          text-align: left;
        }

        .hrmom-assignee-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .hrmom-assignee-cell svg {
          color: #64748b;
        }

        .hrmom-date-cell {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          color: #64748b;
        }

        .hrmom-date-overdue {
          color: #ef4444;
          font-weight: 600;
        }

        /* Metadata */
        .hrmom-metadata-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .hrmom-metadata-item {
          text-align: left;
        }

        .hrmom-metadata-label {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 0.375rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .hrmom-metadata-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
        }

        .hrmom-metadata-code {
          font-family: 'Courier New', monospace;
        }

        /* Empty State */
        .hrmom-empty-state {
          padding: 2rem;
          text-align: left;
          background: #f8f9fa;
          border-radius: 8px;
          color: #64748b;
          font-size: 0.95rem;
          font-weight: 500;
        }

        /* Error Card */
        .hrmom-error-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 3rem 2rem;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 2px solid #27235C;
        }

        .hrmom-error-icon {
          color: #ef4444;
          margin-bottom: 1rem;
        }

        .hrmom-error-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 1.5rem;
        }

        /* Responsive */
        @media (max-width: 992px) {
          .hrmom-wrapper {
            padding: 1rem;
          }

          .hrmom-title {
            font-size: 1.5rem;
          }

          .hrmom-meeting-details {
            grid-template-columns: 1fr;
          }

          .hrmom-attendees-grid {
            grid-template-columns: 1fr;
          }

          .hrmom-metadata-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .hrmom-wrapper {
            padding: 0.75rem;
          }

          .hrmom-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .hrmom-header-actions {
            width: 100%;
          }

          .hrmom-btn {
            flex: 1;
            justify-content: center;
          }

          .hrmom-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .hrmom-table-wrapper {
            overflow-x: scroll;
          }

          .hrmom-table {
            min-width: 800px;
          }

          .hrmom-metadata-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 576px) {
          .hrmom-stats-grid {
            grid-template-columns: 1fr;
          }

          .hrmom-stat-card {
            padding: 1.25rem;
          }

          .hrmom-meeting-header {
            flex-direction: column;
          }

          .hrmom-discussion-item {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default HRMomDetails;
