import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import rsvpService from "../../services/meeting/rsvpService";
import toastr from "toastr";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  MessageSquare,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

const RSVPSummary = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (meetingId) {
      loadSummary();
    }
  }, [meetingId]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rsvpService.getMeetingRsvpSummary(meetingId);
      const data = response.data || response;
      setSummary(data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("You do not have permission to view this RSVP summary.");
      } else if (err.response?.status === 404) {
        setError("Meeting not found or no RSVP data available.");
      } else {
        setError("Failed to load RSVP summary");
        toastr.error("Failed to load RSVP summary");
      }
      console.error("Load summary error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Accepted":
        return (
          <span className="badge bg-success d-inline-flex align-items-center gap-1">
            <CheckCircle size={14} /> Accepted
          </span>
        );
      case "Declined":
        return (
          <span className="badge bg-danger d-inline-flex align-items-center gap-1">
            <XCircle size={14} /> Declined
          </span>
        );
      case "Tentative":
        return (
          <span className="badge bg-info text-dark d-inline-flex align-items-center gap-1">
            <AlertCircle size={14} /> Tentative
          </span>
        );
      default:
        return (
          <span className="badge bg-secondary d-inline-flex align-items-center gap-1">
            <Clock size={14} /> Pending
          </span>
        );
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleString("en-US", {
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

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "300px" }}
      >
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

  if (error) {
    return (
      <div className="container-fluid px-4 py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="alert alert-danger d-flex align-items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
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

  if (!summary) {
    return (
      <div className="container-fluid px-4 py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="alert alert-warning d-flex align-items-center gap-2">
              <AlertCircle size={20} />
              <span>No RSVP data available for this meeting</span>
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

  const {
    meetingTitle,
    totalInvitations = 0,
    acceptedCount = 0,
    declinedCount = 0,
    tentativeCount = 0,
    pendingCount = 0,
    responseRate = 0,
    participants = [],
  } = summary;

  const responsePercentage =
    totalInvitations > 0
      ? Math.round(((totalInvitations - pendingCount) / totalInvitations) * 100)
      : 0;

  return (
    <div
      className="container-fluid px-4 py-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      <div className="row justify-content-center">
        <div className="col-12 col-xl-11">
          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
            <button
              className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
              onClick={() => navigate(-1)}
              style={{ width: "40px", height: "40px", flexShrink: 0 }}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-grow-1">
              <h2
                className="fw-bold mb-1"
                style={{ color: "#1e293b", fontSize: "1.75rem" }}
              >
                RSVP Summary
              </h2>
              {meetingTitle && (
                <p
                  className="text-muted mb-0 d-flex align-items-center gap-2"
                  style={{ fontSize: "0.95rem" }}
                >
                  <Calendar size={16} />
                  {meetingTitle}
                </p>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="row g-3 mb-4">
            <div className="col-xl-2 col-lg-4 col-md-4 col-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-3">
                  <Users size={28} className="text-primary mb-2" />
                  <div
                    className="fw-bold fs-4 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {totalInvitations}
                  </div>
                  <small className="text-muted">Total Invited</small>
                </div>
              </div>
            </div>

            <div className="col-xl-2 col-lg-4 col-md-4 col-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-3">
                  <CheckCircle size={28} className="text-success mb-2" />
                  <div
                    className="fw-bold fs-4 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {acceptedCount}
                  </div>
                  <small className="text-muted">Accepted</small>
                </div>
              </div>
            </div>

            <div className="col-xl-2 col-lg-4 col-md-4 col-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-3">
                  <XCircle size={28} className="text-danger mb-2" />
                  <div
                    className="fw-bold fs-4 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {declinedCount}
                  </div>
                  <small className="text-muted">Declined</small>
                </div>
              </div>
            </div>

            <div className="col-xl-2 col-lg-4 col-md-4 col-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-3">
                  <AlertCircle size={28} className="text-info mb-2" />
                  <div
                    className="fw-bold fs-4 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {tentativeCount}
                  </div>
                  <small className="text-muted">Tentative</small>
                </div>
              </div>
            </div>

            <div className="col-xl-2 col-lg-4 col-md-4 col-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-3">
                  <Clock size={28} className="text-secondary mb-2" />
                  <div
                    className="fw-bold fs-4 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {pendingCount}
                  </div>
                  <small className="text-muted">Pending</small>
                </div>
              </div>
            </div>

            <div className="col-xl-2 col-lg-4 col-md-4 col-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-3">
                  <TrendingUp size={28} className="text-primary mb-2" />
                  <div
                    className="fw-bold fs-4 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {responsePercentage}%
                  </div>
                  <small className="text-muted">Response Rate</small>
                </div>
              </div>
            </div>
          </div>

          {/* Response Progress Bar */}
          {totalInvitations > 0 && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h6 className="fw-semibold mb-3">Response Breakdown</h6>
                <div className="progress mb-3" style={{ height: "30px" }}>
                  {acceptedCount > 0 && (
                    <div
                      className="progress-bar bg-success d-flex align-items-center justify-content-center"
                      style={{
                        width: `${(acceptedCount / totalInvitations) * 100}%`,
                      }}
                    >
                      {acceptedCount > 0 && (
                        <small className="fw-semibold">{acceptedCount}</small>
                      )}
                    </div>
                  )}
                  {tentativeCount > 0 && (
                    <div
                      className="progress-bar bg-info d-flex align-items-center justify-content-center"
                      style={{
                        width: `${(tentativeCount / totalInvitations) * 100}%`,
                      }}
                    >
                      {tentativeCount > 0 && (
                        <small className="fw-semibold text-dark">
                          {tentativeCount}
                        </small>
                      )}
                    </div>
                  )}
                  {declinedCount > 0 && (
                    <div
                      className="progress-bar bg-danger d-flex align-items-center justify-content-center"
                      style={{
                        width: `${(declinedCount / totalInvitations) * 100}%`,
                      }}
                    >
                      {declinedCount > 0 && (
                        <small className="fw-semibold">{declinedCount}</small>
                      )}
                    </div>
                  )}
                  {pendingCount > 0 && (
                    <div
                      className="progress-bar bg-secondary d-flex align-items-center justify-content-center"
                      style={{
                        width: `${(pendingCount / totalInvitations) * 100}%`,
                      }}
                    >
                      {pendingCount > 0 && (
                        <small className="fw-semibold">{pendingCount}</small>
                      )}
                    </div>
                  )}
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge bg-success d-inline-flex align-items-center gap-1">
                    <CheckCircle size={12} /> Accepted ({acceptedCount})
                  </span>
                  <span className="badge bg-info text-dark d-inline-flex align-items-center gap-1">
                    <AlertCircle size={12} /> Tentative ({tentativeCount})
                  </span>
                  <span className="badge bg-danger d-inline-flex align-items-center gap-1">
                    <XCircle size={12} /> Declined ({declinedCount})
                  </span>
                  <span className="badge bg-secondary d-inline-flex align-items-center gap-1">
                    <Clock size={12} /> Pending ({pendingCount})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Participants Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title fw-semibold mb-4 d-flex align-items-center gap-2">
                <Users size={22} />
                Participants{" "}
                {participants.length > 0 && `(${participants.length})`}
              </h5>

              {participants.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <Users size={48} className="mb-3" style={{ opacity: 0.3 }} />
                  <p className="mb-0">No participants data available</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th
                          className="fw-semibold"
                          style={{ color: "#64748b" }}
                        >
                          Employee Name
                        </th>
                        <th
                          className="fw-semibold"
                          style={{ color: "#64748b" }}
                        >
                          Status
                        </th>
                        <th
                          className="fw-semibold"
                          style={{ color: "#64748b" }}
                        >
                          Response Date
                        </th>
                        <th
                          className="fw-semibold"
                          style={{ color: "#64748b" }}
                        >
                          Comments
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant, index) => (
                        <tr key={participant.participantId || index}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  backgroundColor: "#e3f2fd",
                                  flexShrink: 0,
                                }}
                              >
                                <Users size={18} style={{ color: "#1976d2" }} />
                              </div>
                              <span className="fw-semibold">
                                {participant.employeeName || "Unknown"}
                              </span>
                            </div>
                          </td>
                          <td>{getStatusBadge(participant.rsvpStatus)}</td>
                          <td>
                            <span className="text-muted">
                              {formatDateTime(participant.rsvpResponseDate)}
                            </span>
                          </td>
                          <td>
                            {participant.rsvpComments ? (
                              <div className="d-flex align-items-start gap-2">
                                <MessageSquare
                                  size={16}
                                  className="text-muted mt-1"
                                  style={{ flexShrink: 0 }}
                                />
                                <small className="text-muted">
                                  {participant.rsvpComments}
                                </small>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSVPSummary;
