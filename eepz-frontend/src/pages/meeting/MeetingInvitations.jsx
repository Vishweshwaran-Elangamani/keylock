import { useEffect, useState } from "react";
import rsvpService from "../../services/meeting/rsvpService";
import toastr from "toastr";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Send,
  MessageSquare,
  ArrowLeft,
  Mail,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const RSVP_STATUS = {
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  TENTATIVE: "Tentative",
  PENDING: "Pending",
};

const MeetingInvitations = () => {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [rsvpComment, setRsvpComment] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState(RSVP_STATUS.ACCEPTED);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const response = await rsvpService.getMyInvitations();
      const data = Array.isArray(response) ? response : response.data ?? [];
      setInvitations(data);
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load meeting invitations.";
      toastr.error(errorMessage);
      console.error("Load invitations error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openRsvpModal = (invitation) => {
    setSelectedInvitation(invitation);
    setErrorMessage(""); // Clear any previous errors
    const currentStatus =
      invitation.rsvpStatus || invitation.RSVPStatus || RSVP_STATUS.PENDING;
    const validStatuses = Object.values(RSVP_STATUS);
    setRsvpStatus(
      validStatuses.includes(currentStatus)
        ? currentStatus
        : RSVP_STATUS.ACCEPTED
    );
    setRsvpComment(invitation.rsvpComments || invitation.RSVPComments || "");
  };

  const closeRsvpModal = () => {
    setSelectedInvitation(null);
    setRsvpComment("");
    setErrorMessage(""); // Clear errors when closing
  };

  const handleRsvpSubmit = async () => {
    if (!selectedInvitation) return;

    const meetingId =
      selectedInvitation.meetingId || selectedInvitation.MeetingId;

    if (!meetingId || Number(meetingId) === 0) {
      setErrorMessage("Invalid meeting ID.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(""); // Clear previous errors
      
      const payload = {
        meetingId: Number(meetingId),
        rsvpStatus: rsvpStatus,
        rsvpComments: rsvpComment.trim(),
      };

      const response = await rsvpService.submitRsvp(payload);
      
      // Check if response indicates failure (success === false)
      if (response && response.success === false) {
        const errorMsg = response.message || "Failed to submit RSVP.";
        setErrorMessage(errorMsg);
        return;
      }

      toastr.success("RSVP submitted successfully.");
      closeRsvpModal();
      loadInvitations();
    } catch (err) {
      console.error("RSVP submit error:", err);
      
      // Handle error - check if it has success and message properties
      let errorMsg = "Failed to submit RSVP.";
      
      if (err && typeof err === 'object') {
        // Check for direct success/message properties (your API format)
        if (err.success === false && err.message) {
          errorMsg = err.message;
        }
        // Check for response data
        else if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
        }
        // Check for direct message
        else if (err.message) {
          errorMsg = err.message;
        }
        // Check for data object
        else if (err.data?.message) {
          errorMsg = err.data.message;
        }
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case RSVP_STATUS.ACCEPTED:
        return (
          <span className="badge bg-success d-inline-flex align-items-center gap-1">
            <CheckCircle size={14} /> Accepted
          </span>
        );
      case RSVP_STATUS.DECLINED:
        return (
          <span className="badge bg-danger d-inline-flex align-items-center gap-1">
            <XCircle size={14} /> Declined
          </span>
        );
      case RSVP_STATUS.TENTATIVE:
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
    if (!dateString) return "Not scheduled";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const formatDate = (dateString) => {
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

  const getField = (obj, ...fieldNames) => {
    for (const field of fieldNames) {
      if (obj && obj[field] !== undefined && obj[field] !== null) {
        return obj[field];
      }
    }
    return null;
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

  return (
    <div
      className="container-fluid px-4 py-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-9">
          {/* Breadcrumb Navigation */}
          <nav aria-label="breadcrumb" className="mb-3">
            <ol
              className="breadcrumb mb-0 d-flex align-items-center"
              style={{
                backgroundColor: "transparent",
                padding: 0,
                margin: 0,
              }}
            >
              <li
                className="breadcrumb-item"
                style={{ display: "flex", alignItems: "center" }}
              >
                <button
                  onClick={() => navigate("/employee/dashboard/meetmom")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#97247E",
                    cursor: "pointer",
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#7a1d65")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#97247E")
                  }
                >
                  <i
                    className="bi bi-house-door"
                    style={{ fontSize: "1rem" }}
                  ></i>
                  Dashboard
                </button>
              </li>
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#97247E",
                  margin: "0 8px",
                  fontSize: "1rem",
                }}
              >
                /
              </li>
              <li
                className="breadcrumb-item active"
                aria-current="page"
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "#1e293b",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  Meeting Invitations
                </span>
              </li>
            </ol>
          </nav>

          {/* Empty State */}
          {invitations.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: "80px",
                    height: "80px",
                    backgroundColor: "#e3f2fd",
                  }}
                >
                  <Mail size={40} style={{ color: "#1976d2" }} />
                </div>
                <h5 className="fw-semibold mb-2">No Invitations</h5>
                <p className="text-muted mb-0">
                  You have no pending meeting invitations at this time.
                </p>
              </div>
            </div>
          ) : (
            /* Invitations List */
            <div className="row g-3">
              {invitations.map((inv, index) => {
                const meetingId = getField(inv, "meetingId", "MeetingId");
                const meetingTitle =
                  getField(inv, "meetingTitle", "MeetingTitle") ||
                  "Untitled Meeting";
                const meetingDate = getField(inv, "meetingDate", "MeetingDate");
                const rsvpStatus =
                  getField(inv, "rsvpStatus", "RSVPStatus") ||
                  RSVP_STATUS.PENDING;
                const invitedAt = getField(inv, "invitedAt", "InvitedAt");
                const schedulerName = getField(
                  inv,
                  "schedulerName",
                  "SchedulerName",
                  "organizerName",
                  "OrganizerName"
                );

                return (
                  <div key={meetingId || index} className="col-12">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body p-4">
                        <div className="row align-items-start">
                          {/* Meeting Icon */}
                          <div className="col-auto d-none d-md-block">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: "60px",
                                height: "60px",
                                backgroundColor: "#e3f2fd",
                              }}
                            >
                              <Calendar
                                size={28}
                                style={{ color: "#1976d2" }}
                              />
                            </div>
                          </div>

                          {/* Meeting Details */}
                          <div className="col">
                            <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                              <h5
                                className="fw-bold mb-0 text-start"
                                style={{ color: "#1e293b" }}
                              >
                                {meetingTitle}
                              </h5>
                              {getStatusBadge(rsvpStatus)}
                            </div>

                            <div className="row g-3 text-start">
                              {schedulerName && (
                                <div className="col-md-4">
                                  <div className="d-flex align-items-start gap-2">
                                    <User
                                      size={18}
                                      className="text-primary mt-1"
                                      style={{ flexShrink: 0 }}
                                    />
                                    <div>
                                      <div
                                        className="text-muted fw-medium"
                                        style={{ fontSize: "0.8rem" }}
                                      >
                                        Organized by
                                      </div>
                                      <div
                                        className="fw-semibold"
                                        style={{
                                          fontSize: "0.95rem",
                                          color: "#1e293b",
                                        }}
                                      >
                                        {schedulerName}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div
                                className={
                                  schedulerName ? "col-md-8" : "col-md-6"
                                }
                              >
                                <div className="d-flex align-items-start gap-2">
                                  <Clock
                                    size={18}
                                    className="text-primary mt-1"
                                    style={{ flexShrink: 0 }}
                                  />
                                  <div>
                                    <div
                                      className="text-muted fw-medium"
                                      style={{ fontSize: "0.8rem" }}
                                    >
                                      Meeting Time
                                    </div>
                                    <div
                                      className="fw-semibold"
                                      style={{
                                        fontSize: "0.95rem",
                                        color: "#1e293b",
                                      }}
                                    >
                                      {formatDateTime(meetingDate)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {!schedulerName && invitedAt && (
                                <div className="col-md-6">
                                  <div className="d-flex align-items-start gap-2">
                                    <Mail
                                      size={18}
                                      className="text-primary mt-1"
                                      style={{ flexShrink: 0 }}
                                    />
                                    <div>
                                      <div
                                        className="text-muted fw-medium"
                                        style={{ fontSize: "0.8rem" }}
                                      >
                                        Invited on
                                      </div>
                                      <div
                                        className="fw-semibold"
                                        style={{
                                          fontSize: "0.95rem",
                                          color: "#1e293b",
                                        }}
                                      >
                                        {formatDate(invitedAt)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="col-12 col-md-auto mt-3 mt-md-0">
                            <div className="d-flex gap-2 flex-wrap">
                              <button
                                className="btn gradient-button d-flex align-items-center gap-2"
                                onClick={() => openRsvpModal(inv)}
                                style={{
                                  background:
                                    "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                                  color: "#fff",
                                  border: "none",
                                  fontWeight: 500,
                                }}
                              >
                                <Send size={16} />
                                RSVP
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* RSVP Modal */}
          {selectedInvitation && (
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              onClick={closeRsvpModal}
            >
              <div
                className="modal-dialog modal-dialog-centered"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-content border-0 shadow">
                  <div
                    className="modal-header border-0 pb-3"
                    style={{
                      background: "#27235C",
                      borderRadius: "0.5rem 0.5rem 0 0",
                    }}
                  >
                    <div>
                      <h5
                        className="modal-title fw-bold"
                        style={{ color: "#fff" }}
                      >
                        Confirm RSVP
                      </h5>
                      <p
                        className="mb-0"
                        style={{
                          color: "rgba(255,255,255,0.8)",
                          fontSize: "0.875rem",
                        }}
                      >
                        Respond to meeting invitation
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={closeRsvpModal}
                    ></button>
                  </div>

                  <div className="modal-body">
                    {/* Error Message */}
                    {errorMessage && (
                      <div className="alert alert-danger d-flex align-items-start gap-2 mb-4 text-start">
                        <XCircle
                          size={18}
                          className="mt-1"
                          style={{ flexShrink: 0 }}
                        />
                        <div className="flex-grow-1">
                          <strong>Error:</strong> {errorMessage}
                        </div>
                        <button
                          type="button"
                          className="btn-close btn-sm"
                          onClick={() => setErrorMessage("")}
                          style={{ fontSize: "0.7rem" }}
                        ></button>
                      </div>
                    )}

                    {/* Meeting Info Card */}
                    <div className="card bg-light border-0 mb-4">
                      <div className="card-body">
                        <h6 className="fw-semibold mb-3 text-start">
                          {getField(
                            selectedInvitation,
                            "meetingTitle",
                            "MeetingTitle"
                          ) || "Meeting Details"}
                        </h6>
                        <div className="d-flex flex-column gap-2 text-start">
                          <div className="d-flex align-items-center gap-2">
                            <Clock size={16} className="text-primary" />
                            <span
                              style={{ fontSize: "0.9rem", color: "#1e293b" }}
                            >
                              {formatDateTime(
                                getField(
                                  selectedInvitation,
                                  "meetingDate",
                                  "MeetingDate"
                                )
                              )}
                            </span>
                          </div>

                          {getField(
                            selectedInvitation,
                            "schedulerName",
                            "SchedulerName",
                            "organizerName",
                            "OrganizerName"
                          ) && (
                            <div className="d-flex align-items-center gap-2">
                              <User size={16} className="text-primary" />
                              <span
                                style={{ fontSize: "0.9rem", color: "#1e293b" }}
                              >
                                Organized by{" "}
                                <strong>
                                  {getField(
                                    selectedInvitation,
                                    "schedulerName",
                                    "SchedulerName",
                                    "organizerName",
                                    "OrganizerName"
                                  )}
                                </strong>
                              </span>
                            </div>
                          )}

                          <div className="d-flex align-items-center gap-2">
                            <Mail size={16} className="text-primary" />
                            <span
                              style={{ fontSize: "0.9rem", color: "#1e293b" }}
                            >
                              Invited:{" "}
                              {formatDate(
                                getField(
                                  selectedInvitation,
                                  "invitedAt",
                                  "InvitedAt"
                                )
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Current Status Alert */}
                    {getField(
                      selectedInvitation,
                      "rsvpStatus",
                      "RSVPStatus"
                    ) !== RSVP_STATUS.PENDING && (
                      <div className="alert alert-info d-flex align-items-start gap-2 mb-4 text-start">
                        <AlertCircle
                          size={18}
                          className="mt-1"
                          style={{ flexShrink: 0 }}
                        />
                        <div className="flex-grow-1">
                          <strong>Current Response:</strong>{" "}
                          {getField(
                            selectedInvitation,
                            "rsvpStatus",
                            "RSVPStatus"
                          )}
                          {getField(
                            selectedInvitation,
                            "rsvpResponseDate",
                            "RSVPResponseDate"
                          ) && (
                            <div className="text-muted small mt-1">
                              Responded on{" "}
                              {formatDate(
                                getField(
                                  selectedInvitation,
                                  "rsvpResponseDate",
                                  "RSVPResponseDate"
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* RSVP Status Selection */}
                    <div className="mb-4 text-start">
                      <label className="form-label fw-semibold d-flex align-items-center gap-2 mb-3">
                        <Send size={18} />
                        Your Response
                        <span className="text-danger">*</span>
                      </label>

                      <div className="btn-group w-100" role="group">
                        <input
                          type="radio"
                          className="btn-check"
                          name="rsvpStatus"
                          id="rsvp-accepted"
                          value={RSVP_STATUS.ACCEPTED}
                          checked={rsvpStatus === RSVP_STATUS.ACCEPTED}
                          onChange={(e) => setRsvpStatus(e.target.value)}
                        />
                        <label
                          className="btn btn-outline-success"
                          htmlFor="rsvp-accepted"
                        >
                          <CheckCircle size={16} className="me-1" />
                          Accept
                        </label>

                        <input
                          type="radio"
                          className="btn-check"
                          name="rsvpStatus"
                          id="rsvp-tentative"
                          value={RSVP_STATUS.TENTATIVE}
                          checked={rsvpStatus === RSVP_STATUS.TENTATIVE}
                          onChange={(e) => setRsvpStatus(e.target.value)}
                        />
                        <label
                          className="btn btn-outline-info"
                          htmlFor="rsvp-tentative"
                        >
                          <AlertCircle size={16} className="me-1" />
                          Tentative
                        </label>

                        <input
                          type="radio"
                          className="btn-check"
                          name="rsvpStatus"
                          id="rsvp-declined"
                          value={RSVP_STATUS.DECLINED}
                          checked={rsvpStatus === RSVP_STATUS.DECLINED}
                          onChange={(e) => setRsvpStatus(e.target.value)}
                        />
                        <label
                          className="btn btn-outline-danger"
                          htmlFor="rsvp-declined"
                        >
                          <XCircle size={16} className="me-1" />
                          Decline
                        </label>
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-3 text-start">
                      <label className="form-label fw-semibold d-flex align-items-center gap-2">
                        <MessageSquare size={18} />
                        Add Comment (Optional)
                      </label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={rsvpComment}
                        onChange={(e) => setRsvpComment(e.target.value)}
                        placeholder="Add any comments or notes..."
                      />
                      {getField(
                        selectedInvitation,
                        "rsvpComments",
                        "RSVPComments"
                      ) && (
                        <small className="text-muted mt-1 d-block">
                          <strong>Previous comment:</strong> "
                          {getField(
                            selectedInvitation,
                            "rsvpComments",
                            "RSVPComments"
                          )}
                          "
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="modal-footer border-0 pt-0">
                    <button
                      className="btn btn-light px-4"
                      onClick={closeRsvpModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn gradient-button px-4 d-flex align-items-center gap-2"
                      onClick={handleRsvpSubmit}
                      disabled={submitting}
                      style={{
                        background:
                          "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                        color: "#fff",
                        border: "none",
                        fontWeight: 500,
                      }}
                    >
                      {submitting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          {getField(
                            selectedInvitation,
                            "rsvpStatus",
                            "RSVPStatus"
                          ) === RSVP_STATUS.PENDING
                            ? "Submit RSVP"
                            : "Update RSVP"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .breadcrumb-item + .breadcrumb-item::before {
          display: none;
        }
        
        .gradient-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(151, 36, 126, 0.3);
          transition: all 0.2s ease;
        }
        
        .gradient-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default MeetingInvitations;
