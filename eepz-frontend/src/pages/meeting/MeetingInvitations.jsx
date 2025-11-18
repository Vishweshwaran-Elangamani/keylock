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
      toastr.error("Failed to load meeting invitations.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openRsvpModal = (invitation) => {
    setSelectedInvitation(invitation);
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
  };

  const handleRsvpSubmit = async () => {
    if (!selectedInvitation) return;

    const meetingId =
      selectedInvitation.meetingId || selectedInvitation.MeetingId;

    if (!meetingId || Number(meetingId) === 0) {
      toastr.error("Invalid meeting ID.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        meetingId: Number(meetingId),
        rsvpStatus: rsvpStatus,
        rsvpComments: rsvpComment.trim(),
      };

      await rsvpService.submitRsvp(payload);
      toastr.success("RSVP submitted successfully.");
      closeRsvpModal();
      loadInvitations();
    } catch (err) {
      toastr.error("Failed to submit RSVP.");
      console.error("RSVP submit error:", err);
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
          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
            <button
              className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
              onClick={() => navigate(-1)}
              style={{ width: "40px", height: "40px" }}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-grow-1">
              <h2
                className="fw-bold mb-1"
                style={{ color: "#1e293b", fontSize: "1.75rem" }}
              >
                Meeting Invitations
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
                Review and respond to your meeting invitations
              </p>
            </div>
            <div className="d-flex align-items-center gap-2 px-3 py-2 bg-white rounded border">
              <Mail size={20} className="text-primary" />
              <div>
                <div className="fw-bold" style={{ fontSize: "1.25rem" }}>
                  {invitations.length}
                </div>
                <small className="text-muted">Total</small>
              </div>
            </div>
          </div>

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
                                className="fw-bold mb-0"
                                style={{ color: "#1e293b" }}
                              >
                                {meetingTitle}
                              </h5>
                              {getStatusBadge(rsvpStatus)}
                            </div>

                            <div className="row g-3">
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
                                className="btn btn-success d-flex align-items-center gap-2"
                                onClick={() => openRsvpModal(inv)}
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
                  <div className="modal-header border-0 pb-0">
                    <div>
                      <h5 className="modal-title fw-bold">Confirm RSVP</h5>
                      <p className="text-muted small mb-0">
                        Respond to meeting invitation
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeRsvpModal}
                    ></button>
                  </div>

                  <div className="modal-body">
                    {/* Meeting Info Card */}
                    <div className="card bg-light border-0 mb-4">
                      <div className="card-body">
                        <h6 className="fw-semibold mb-3">
                          {getField(
                            selectedInvitation,
                            "meetingTitle",
                            "MeetingTitle"
                          ) || "Meeting Details"}
                        </h6>
                        <div className="d-flex flex-column gap-2">
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
                      <div className="alert alert-info d-flex align-items-start gap-2 mb-4">
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
                    <div className="mb-4">
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
                    <div className="mb-3">
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
                      className="btn btn-secondary px-4"
                      onClick={closeRsvpModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-success px-4 d-flex align-items-center gap-2"
                      onClick={handleRsvpSubmit}
                      disabled={submitting}
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
    </div>
  );
};

export default MeetingInvitations;
