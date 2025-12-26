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
  Send,
  Mail,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../styles/mom/components/MeetingInvitations.css";

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
    setErrorMessage("");
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
    setErrorMessage("");
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
      setErrorMessage("");

      const payload = {
        meetingId: Number(meetingId),
        rsvpStatus: rsvpStatus,
        rsvpComments: rsvpComment.trim(),
      };

      const response = await rsvpService.submitRsvp(payload);

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

      let errorMsg = "Failed to submit RSVP.";

      if (err && typeof err === "object") {
        if (err.success === false && err.message) {
          errorMsg = err.message;
        } else if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
        } else if (err.message) {
          errorMsg = err.message;
        } else if (err.data?.message) {
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
          <span className="mi-badge mi-badge-accepted">
            <CheckCircle size={14} /> Accepted
          </span>
        );
      case RSVP_STATUS.DECLINED:
        return (
          <span className="mi-badge mi-badge-declined">
            <XCircle size={14} /> Declined
          </span>
        );
      case RSVP_STATUS.TENTATIVE:
        return (
          <span className="mi-badge mi-badge-tentative">
            <AlertCircle size={14} /> Tentative
          </span>
        );
      default:
        return (
          <span className="mi-badge mi-badge-pending">
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
      <div className="mi-loading-wrapper">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mi-page">
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-9">
          <nav aria-label="breadcrumb" className="mi-breadcrumb-nav">
            <ol className="breadcrumb mb-0 d-flex align-items-center mi-breadcrumb">
              <li className="breadcrumb-item mi-breadcrumb-item">
                <button
                  onClick={() => navigate("/employee/dashboard")}
                  className="mi-breadcrumb-link-button"
                >
                  <i className="bi bi-house-door mi-breadcrumb-home-icon"></i>
                  Dashboard
                </button>
              </li>
              <li className="mi-breadcrumb-separator">/</li>
              <li className="breadcrumb-item mi-breadcrumb-item">
                <button
                  onClick={() => navigate("/employee/dashboard/meetmom")}
                  className="mi-breadcrumb-link-button"
                >
                  Meetings and MoM
                </button>
              </li>
              <li className="mi-breadcrumb-separator">/</li>
              <li
                className="breadcrumb-item active mi-breadcrumb-item"
                aria-current="page"
              >
                <span className="mi-breadcrumb-current">
                  Meeting Invitations
                </span>
              </li>
            </ol>
          </nav>

          {invitations.length === 0 ? (
            <div className="card mi-card">
              <div className="card-body mi-empty-body">
                <div className="mi-empty-icon-wrapper">
                  <Mail size={40} className="mi-empty-icon" />
                </div>
                <h5 className="mi-empty-title">No Invitations</h5>
                <p className="mi-empty-text">
                  You have no pending meeting invitations at this time.
                </p>
              </div>
            </div>
          ) : (
            <div className="row g-3">
              {invitations.map((inv, index) => {
                const meetingId = getField(inv, "meetingId", "MeetingId");
                const meetingTitle =
                  getField(inv, "meetingTitle", "MeetingTitle") ||
                  "Untitled Meeting";
                const meetingDate = getField(
                  inv,
                  "meetingDate",
                  "MeetingDate"
                );
                const rsvpStatusValue =
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
                    <div className="card mi-card">
                      <div className="card-body mi-card-body">
                        <div className="row align-items-start">
                          <div className="col-auto d-none d-md-block">
                            <div className="mi-meeting-icon">
                              <Calendar
                                size={28}
                                className="mi-meeting-icon-svg"
                              />
                            </div>
                          </div>

                          <div className="col">
                            <div className="mi-card-header-row">
                              <h5 className="mi-meeting-title">
                                {meetingTitle}
                              </h5>
                              <div className="mi-header-actions">
                                {getStatusBadge(rsvpStatusValue)}
                                <button
                                  className="btn mi-gradient-button mi-rsvp-button"
                                  onClick={() => openRsvpModal(inv)}
                                >
                                  <Send size={16} />
                                  RSVP
                                </button>
                              </div>
                            </div>

                            <div className="row g-3 text-start">
                              {schedulerName && (
                                <div className="col-md-4">
                                  <div className="mi-info-row">
                                    <User
                                      size={18}
                                      className="mi-info-icon"
                                    />
                                    <div>
                                      <div className="mi-info-label">
                                        Organized by
                                      </div>
                                      <div className="mi-info-value">
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
                                <div className="mi-info-row">
                                  <Clock
                                    size={18}
                                    className="mi-info-icon"
                                  />
                                  <div>
                                    <div className="mi-info-label">
                                      Meeting Time
                                    </div>
                                    <div className="mi-info-value">
                                      {formatDateTime(meetingDate)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {!schedulerName && invitedAt && (
                                <div className="col-md-6">
                                  <div className="mi-info-row">
                                    <div></div>
                                  </div>
                                </div>
                              )}
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

          {selectedInvitation && (
            <div
              className="modal mi-modal-backdrop show"
              tabIndex="-1"
              onClick={closeRsvpModal}
            >
              <div
                className="modal-dialog mi-modal-dialog"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-content mi-modal-content">
                  <div className="modal-header mi-modal-header">
                    <div className="mi-modal-header-text">
                      <h5 className="modal-title mi-modal-title">
                        Confirm RSVP
                      </h5>
                      <p className="mi-modal-subtitle">
                        Respond to meeting invitation
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={closeRsvpModal}
                    ></button>
                  </div>

                  <div className="modal-body mi-modal-body">
                    {errorMessage && (
                      <div className="alert alert-danger mi-error-alert">
                        <XCircle
                          size={18}
                          className="mi-error-icon"
                        />
                        <div className="mi-error-text">
                          <strong>Error:</strong> {errorMessage}
                        </div>
                        <button
                          type="button"
                          className="btn-close btn-sm mi-error-close"
                          onClick={() => setErrorMessage("")}
                        ></button>
                      </div>
                    )}

                    <div className="card mi-modal-info-card">
                      <div className="card-body">
                        <h6 className="mi-modal-info-title">
                          {getField(
                            selectedInvitation,
                            "meetingTitle",
                            "MeetingTitle"
                          ) || "Meeting Details"}
                        </h6>
                        <div className="mi-modal-info-list">
                          <div className="mi-modal-info-row">
                            <Clock
                              size={16}
                              className="mi-info-icon"
                            />
                            <span className="mi-modal-info-text">
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
                            <div className="mi-modal-info-row">
                              <User
                                size={16}
                                className="mi-info-icon"
                              />
                              <span className="mi-modal-info-text">
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
                        </div>
                      </div>
                    </div>

                    {getField(
                      selectedInvitation,
                      "rsvpStatus",
                      "RSVPStatus"
                    ) !== RSVP_STATUS.PENDING && (
                      <div className="alert alert-info mi-current-status-alert">
                        <AlertCircle
                          size={18}
                          className="mi-current-status-icon"
                        />
                        <div className="mi-current-status-text">
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
                            <div className="mi-current-status-meta">
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

                    <div className="mi-rsvp-section">
                      <label className="form-label mi-rsvp-label">
                        <span>Your Response</span>
                        <span className="mi-required">*</span>
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
                          className="btn btn-outline-success mi-rsvp-option"
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
                          className="btn btn-outline-info mi-rsvp-option"
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
                          className="btn btn-outline-danger mi-rsvp-option"
                          htmlFor="rsvp-declined"
                        >
                          <XCircle size={16} className="me-1" />
                          Decline
                        </label>
                      </div>
                    </div>

                    <div className="mi-comment-section">
                      <label className="form-label mi-comment-label">
                        <span>Add Comment (Optional)</span>
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
                        <small className="mi-previous-comment">
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

                  <div className="modal-footer mi-modal-footer">
                    <button
                      className="btn btn-light mi-cancel-button"
                      onClick={closeRsvpModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn mi-gradient-button mi-submit-button"
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
