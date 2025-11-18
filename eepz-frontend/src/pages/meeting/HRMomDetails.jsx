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
  XCircle,
  User,
  Edit,
  Download,
  Share2,
  Building,
  Mail,
  Phone,
  Briefcase,
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
      "One-on-One": "primary",
      "Team Meeting": "success",
      Presentation: "info",
      Other: "secondary",
    };
    return (
      <span className={`badge bg-${badgeMap[type] || "secondary"} px-3 py-2`}>
        {type}
      </span>
    );
  };

  const getStatusBadge = (status, isOverdue) => {
    if (isOverdue) {
      return (
        <span className="badge bg-danger d-inline-flex align-items-center gap-1">
          <AlertCircle size={14} /> Overdue
        </span>
      );
    }
    switch (status) {
      case "Completed":
        return (
          <span className="badge bg-success d-inline-flex align-items-center gap-1">
            <CheckCircle size={14} /> Completed
          </span>
        );
      case "Pending":
        return (
          <span className="badge bg-warning text-dark d-inline-flex align-items-center gap-1">
            <Clock size={14} /> Pending
          </span>
        );
      default:
        return (
          <span className="badge bg-secondary d-inline-flex align-items-center gap-1">
            {status}
          </span>
        );
    }
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
      completed: mom.actionItems.filter((ai) => ai.status === "Completed")
        .length,
      pending: mom.actionItems.filter(
        (ai) => ai.status === "Pending" && !ai.isOverdue
      ).length,
      overdue: mom.actionItems.filter((ai) => ai.isOverdue).length,
    };
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div
          className="spinner-border text-primary"
          role="status"
          style={{ width: "3rem", height: "3rem" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !mom) {
    return (
      <div
        className="container-fluid px-4 py-4"
        style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
      >
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="alert alert-danger d-flex align-items-center gap-2">
              <AlertCircle size={20} />
              <span>{error || "MOM not found"}</span>
            </div>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
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
    <div
      className="container-fluid px-4 py-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <button
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                onClick={() => navigate(-1)}
                style={{ width: "40px", height: "40px", flexShrink: 0 }}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2
                  className="fw-bold mb-1"
                  style={{ color: "#1e293b", fontSize: "1.75rem" }}
                >
                  Meeting Minutes Details
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
                  Complete HR view of meeting information
                </p>
              </div>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-outline-primary d-flex align-items-center gap-2"
                onClick={() => toastr.info("Share functionality coming soon")}
              >
                <Share2 size={18} />
                Share
              </button>
              <button
                className="btn btn-success d-flex align-items-center gap-2"
                onClick={() => toastr.info("Export functionality coming soon")}
              >
                <Download size={18} />
                Export PDF
              </button>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="row g-3 mb-4">
            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center p-3">
                  <Users size={24} className="text-primary mb-2" />
                  <div
                    className="fw-bold fs-5 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {Array.isArray(mom.attendees) ? mom.attendees.length : 0}
                  </div>
                  <small className="text-muted">Attendees</small>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center p-3">
                  <MessageSquare size={24} className="text-info mb-2" />
                  <div
                    className="fw-bold fs-5 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {Array.isArray(mom.discussionPoints)
                      ? mom.discussionPoints.length
                      : 0}
                  </div>
                  <small className="text-muted">Discussion Points</small>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center p-3">
                  <CheckCircle size={24} className="text-success mb-2" />
                  <div
                    className="fw-bold fs-5 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {actionStats.total}
                  </div>
                  <small className="text-muted">Action Items</small>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center p-3">
                  <AlertCircle size={24} className="text-danger mb-2" />
                  <div
                    className="fw-bold fs-5 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {actionStats.overdue}
                  </div>
                  <small className="text-muted">Overdue Tasks</small>
                </div>
              </div>
            </div>
          </div>

          {/* Meeting Header Card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-3">
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "70px",
                      height: "70px",
                      backgroundColor: "#e3f2fd",
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={35} style={{ color: "#1976d2" }} />
                  </div>
                  <div>
                    <h3 className="fw-bold mb-2" style={{ color: "#1e293b" }}>
                      {mom.meetingTitle}
                    </h3>
                    <div className="d-flex gap-2 flex-wrap">
                      {getMeetingTypeBadge(mom.meetingType)}
                      {mom.departmentName && (
                        <span className="badge bg-light text-dark border">
                          <Building size={14} className="me-1" />
                          {mom.departmentName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-4 mt-2">
                <div className="col-md-6 col-lg-3">
                  <div className="d-flex align-items-start gap-2">
                    <Calendar
                      size={20}
                      className="text-primary mt-1"
                      style={{ flexShrink: 0 }}
                    />
                    <div>
                      <div
                        className="text-muted fw-medium"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Meeting Date & Time
                      </div>
                      <div
                        className="fw-semibold"
                        style={{ fontSize: "0.95rem", color: "#1e293b" }}
                      >
                        {formatDateTime(mom.meetingDate)}
                      </div>
                    </div>
                  </div>
                </div>

                {mom.meetingLink && (
                  <div className="col-md-6 col-lg-3">
                    <div className="d-flex align-items-start gap-2">
                      <LinkIcon
                        size={20}
                        className="text-primary mt-1"
                        style={{ flexShrink: 0 }}
                      />
                      <div>
                        <div
                          className="text-muted fw-medium"
                          style={{ fontSize: "0.8rem" }}
                        >
                          Meeting Link
                        </div>
                        <a
                          href={mom.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary text-decoration-none d-flex align-items-center gap-1 fw-semibold"
                          style={{ fontSize: "0.9rem" }}
                        >
                          Join <LinkIcon size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="col-md-6 col-lg-3">
                  <div className="d-flex align-items-start gap-2">
                    <User
                      size={20}
                      className="text-primary mt-1"
                      style={{ flexShrink: 0 }}
                    />
                    <div>
                      <div
                        className="text-muted fw-medium"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Submitted By
                      </div>
                      <div
                        className="fw-semibold"
                        style={{ fontSize: "0.95rem", color: "#1e293b" }}
                      >
                        {mom.submittedByEmployeeName || "Unknown"}
                      </div>
                      {mom.submittedByRole && (
                        <small className="text-muted">
                          {mom.submittedByRole}
                        </small>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-md-6 col-lg-3">
                  <div className="d-flex align-items-start gap-2">
                    <Clock
                      size={20}
                      className="text-primary mt-1"
                      style={{ flexShrink: 0 }}
                    />
                    <div>
                      <div
                        className="text-muted fw-medium"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Tracking
                      </div>
                      <div
                        className="fw-semibold"
                        style={{ fontSize: "0.85rem", color: "#1e293b" }}
                      >
                        Created: {formatDate(mom.createdAt)}
                      </div>
                      {mom.updatedAt && (
                        <div
                          className="fw-semibold"
                          style={{ fontSize: "0.85rem", color: "#1e293b" }}
                        >
                          Updated: {formatDate(mom.updatedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendees Card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="card-title fw-semibold mb-4 d-flex align-items-center gap-2">
                <Users size={22} />
                Attendees (
                {Array.isArray(mom.attendees) ? mom.attendees.length : 0})
              </h5>
              {mom.attendees &&
              Array.isArray(mom.attendees) &&
              mom.attendees.length > 0 ? (
                <div className="row g-3">
                  {mom.attendees.map((attendee, index) => {
                    const attendeeName =
                      typeof attendee === "string"
                        ? attendee
                        : attendee.name || attendee.employeeName || "Unknown";
                    return (
                      <div key={index} className="col-md-6 col-lg-4">
                        <div className="card bg-light border-0 h-100">
                          <div className="card-body p-3 d-flex align-items-center gap-3">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: "45px",
                                height: "45px",
                                backgroundColor: "#e3f2fd",
                                flexShrink: 0,
                              }}
                            >
                              <User size={20} style={{ color: "#1976d2" }} />
                            </div>
                            <div className="flex-grow-1">
                              <div
                                className="fw-semibold"
                                style={{ fontSize: "0.95rem" }}
                              >
                                {attendeeName}
                              </div>
                              {typeof attendee === "object" &&
                                attendee.role && (
                                  <small className="text-muted d-flex align-items-center gap-1">
                                    <Briefcase size={12} />
                                    {attendee.role}
                                  </small>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="alert alert-info mb-0">
                  No attendees recorded
                </div>
              )}
            </div>
          </div>

          {/* Comments/Observations Card */}
          {mom.commentsObservations && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-semibold mb-3 d-flex align-items-center gap-2">
                  <MessageSquare size={22} />
                  Comments & Observations
                </h5>
                <div
                  className="alert alert-secondary mb-0"
                  style={{ whiteSpace: "pre-wrap", fontSize: "0.95rem" }}
                >
                  {mom.commentsObservations}
                </div>
              </div>
            </div>
          )}

          {/* Discussion Points Card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="card-title fw-semibold mb-4 d-flex align-items-center gap-2">
                <MessageSquare size={22} />
                Discussion Points (
                {Array.isArray(mom.discussionPoints)
                  ? mom.discussionPoints.length
                  : 0}
                )
              </h5>
              {mom.discussionPoints &&
              Array.isArray(mom.discussionPoints) &&
              mom.discussionPoints.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {mom.discussionPoints.map((dp, index) => (
                    <div
                      key={dp.pointId || index}
                      className="card bg-light border-0"
                    >
                      <div className="card-body p-4">
                        <div className="d-flex gap-3">
                          <span
                            className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: "40px",
                              height: "40px",
                              flexShrink: 0,
                              fontSize: "1rem",
                              fontWeight: "700",
                            }}
                          >
                            {index + 1}
                          </span>
                          <div className="flex-grow-1">
                            <p
                              className="mb-0"
                              style={{ fontSize: "1rem", lineHeight: "1.6" }}
                            >
                              {dp.pointText || dp.point || "No details"}
                            </p>
                            {dp.timestamp && (
                              <small className="text-muted d-flex align-items-center gap-1 mt-2">
                                <Clock size={12} />
                                Discussed at: {formatDateTime(dp.timestamp)}
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info mb-0">
                  No discussion points recorded
                </div>
              )}
            </div>
          </div>

          {/* Action Items Card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="card-title fw-semibold mb-0 d-flex align-items-center gap-2">
                  <CheckCircle size={22} />
                  Action Items ({actionStats.total})
                </h5>
                <div className="d-flex gap-2">
                  <span className="badge bg-success">
                    {actionStats.completed} Completed
                  </span>
                  <span className="badge bg-warning text-dark">
                    {actionStats.pending} Pending
                  </span>
                  {actionStats.overdue > 0 && (
                    <span className="badge bg-danger">
                      {actionStats.overdue} Overdue
                    </span>
                  )}
                </div>
              </div>

              {mom.actionItems &&
              Array.isArray(mom.actionItems) &&
              mom.actionItems.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th
                          className="fw-semibold"
                          style={{ color: "#64748b", width: "5%" }}
                        >
                          #
                        </th>
                        <th
                          className="fw-semibold"
                          style={{ color: "#64748b", width: "35%" }}
                        >
                          Task Description
                        </th>
                        <th
                          className="fw-semibold"
                          style={{ color: "#64748b", width: "20%" }}
                        >
                          Assigned To
                        </th>
                        <th
                          className="fw-semibold"
                          style={{ color: "#64748b", width: "15%" }}
                        >
                          Due Date
                        </th>
                        <th
                          className="fw-semibold"
                          style={{ color: "#64748b", width: "15%" }}
                        >
                          Status
                        </th>
                        <th
                          className="fw-semibold"
                          style={{ color: "#64748b", width: "10%" }}
                        >
                          Priority
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mom.actionItems.map((ai, index) => (
                        <tr key={ai.actionItemId || index}>
                          <td>
                            <div
                              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                              style={{
                                width: "30px",
                                height: "30px",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                              }}
                            >
                              {index + 1}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-start gap-2">
                              <CheckCircle
                                size={16}
                                className="text-primary mt-1"
                                style={{ flexShrink: 0 }}
                              />
                              <div>
                                <div className="fw-semibold">
                                  {ai.taskDescription ||
                                    ai.task ||
                                    "No description"}
                                </div>
                                {ai.notes && (
                                  <small className="text-muted d-block mt-1">
                                    {ai.notes}
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <User size={16} className="text-muted" />
                              <span className="fw-medium">
                                {ai.assignedToEmployeeName ||
                                  ai.assignTo ||
                                  "Unassigned"}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              <Calendar size={14} className="text-muted" />
                              <span
                                className={
                                  ai.isOverdue
                                    ? "text-danger fw-semibold"
                                    : "text-muted"
                                }
                              >
                                {formatDate(ai.dueDate)}
                              </span>
                            </div>
                          </td>
                          <td>{getStatusBadge(ai.status, ai.isOverdue)}</td>
                          <td>
                            {ai.priority && (
                              <span
                                className={`badge ${
                                  ai.priority === "High"
                                    ? "bg-danger"
                                    : ai.priority === "Medium"
                                    ? "bg-warning text-dark"
                                    : "bg-secondary"
                                }`}
                              >
                                {ai.priority}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info mb-0">
                  No action items recorded
                </div>
              )}
            </div>
          </div>

          {/* Metadata & System Info Card */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h6 className="fw-semibold mb-4">
                System Information & Metadata
              </h6>
              <div className="row g-4">
                <div className="col-md-3">
                  <small className="text-muted d-block mb-2">MOM ID</small>
                  <span className="fw-semibold font-monospace">
                    {mom.momId}
                  </span>
                </div>
                <div className="col-md-3">
                  <small className="text-muted d-block mb-2">Created At</small>
                  <span className="fw-semibold">
                    {formatDateTime(mom.createdAt)}
                  </span>
                </div>
                {mom.updatedAt && (
                  <div className="col-md-3">
                    <small className="text-muted d-block mb-2">
                      Last Updated
                    </small>
                    <span className="fw-semibold">
                      {formatDateTime(mom.updatedAt)}
                    </span>
                  </div>
                )}
                {mom.submittedById && (
                  <div className="col-md-3">
                    <small className="text-muted d-block mb-2">
                      Submitted By ID
                    </small>
                    <span className="fw-semibold font-monospace">
                      {mom.submittedById}
                    </span>
                  </div>
                )}
                {mom.departmentId && (
                  <div className="col-md-3">
                    <small className="text-muted d-block mb-2">
                      Department ID
                    </small>
                    <span className="fw-semibold font-monospace">
                      {mom.departmentId}
                    </span>
                  </div>
                )}
                {mom.projectId && (
                  <div className="col-md-3">
                    <small className="text-muted d-block mb-2">
                      Project ID
                    </small>
                    <span className="fw-semibold font-monospace">
                      {mom.projectId}
                    </span>
                  </div>
                )}
                <div className="col-md-3">
                  <small className="text-muted d-block mb-2">Status</small>
                  <span className="badge bg-success">Active</span>
                </div>
                <div className="col-md-3">
                  <small className="text-muted d-block mb-2">Visibility</small>
                  <span className="badge bg-info text-dark">
                    {mom.isPrivate ? "Private" : "Public"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRMomDetails;
