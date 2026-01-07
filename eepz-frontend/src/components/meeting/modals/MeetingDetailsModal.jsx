import React, { useState } from "react";
import CreateMomModal from "./CreateMomModal";
import "../../../styles/mom/modals/MeetingDetailsModal.css";

const MeetingDetailsModal = ({ meeting, onClose, employeeMap }) => {
  const [showCreateMom, setShowCreateMom] = useState(false);

  const toggleCreateMom = () => setShowCreateMom(!showCreateMom);

  if (!meeting) return null;

  return (
    <>
      <div
        className="mdm-overlay modal fade show d-block"
        tabIndex="-1"
        onClick={onClose}
      >
        <div
          className="mdm-dialog modal-dialog"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mdm-content modal-content border-0 shadow-lg">
            <div className="mdm-header modal-header border-0">
              <div className="mdm-header-text">
                <h5 className="mdm-title modal-title fw-bold mb-2">
                  {meeting.meetingTitle}
                </h5>
                <span className="mdm-type-badge badge bg-light text-primary">
                  {meeting.meetingType}
                </span>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>

            <div className="mdm-body modal-body">
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="mdm-info-card p-3 rounded">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-calendar3 text-primary"></i>
                      <small className="text-muted fw-semibold">
                        Date &amp; Time
                      </small>
                    </div>
                    <span className="d-block fw-medium">
                      {new Date(meeting.meetingDate).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mdm-info-card p-3 rounded">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-people text-success"></i>
                      <small className="text-muted fw-semibold">
                        Attendees
                      </small>
                    </div>
                    <span className="d-block fw-medium">
                      {meeting.attendees || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>

              {meeting.meetingLink && (
                <div className="mb-4">
                  <div className="mdm-link-card p-3 rounded">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-link-45deg text-primary"></i>
                      <small className="text-muted fw-semibold">
                        Meeting Link
                      </small>
                    </div>
                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mdm-link text-primary text-decoration-none d-flex align-items-center gap-2 fw-medium"
                    >
                      Join Meeting
                      <i className="bi bi-box-arrow-up-right small"></i>
                    </a>
                  </div>
                </div>
              )}

              {meeting.commentsObservations && (
                <div className="mb-4">
                  <h6 className="mdm-section-title fw-semibold mb-3 d-flex align-items-center gap-2">
                    <i className="bi bi-chat-left-text text-info"></i>
                    Comments &amp; Observations
                  </h6>
                  <div className="mdm-comments-card p-3 rounded">
                    <p className="mb-0">{meeting.commentsObservations}</p>
                  </div>
                </div>
              )}

              {meeting.discussionPoints &&
                meeting.discussionPoints.length > 0 && (
                  <div className="mb-4">
                    <h6 className="mdm-section-title fw-semibold mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-chat-dots text-warning"></i>
                      Discussion Points
                      <span className="badge bg-light text-dark">
                        {meeting.discussionPoints.length}
                      </span>
                    </h6>
                    <div className="d-flex flex-column gap-2">
                      {meeting.discussionPoints.map((dp, i) => (
                        <div
                          key={i}
                          className="mdm-discussion-card p-3 rounded d-flex align-items-start gap-3"
                        >
                          <span className="flex-grow-1">{dp.pointText}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {meeting.actionItems && meeting.actionItems.length > 0 && (
                <div className="mb-4">
                  <h6 className="mdm-section-title fw-semibold mb-3 d-flex align-items-center gap-2">
                    <i className="bi bi-check2-square text-success"></i>
                    Action Items
                    <span className="badge bg-light text-dark">
                      {meeting.actionItems.length}
                    </span>
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    {meeting.actionItems.map((ai, i) => (
                      <div key={i} className="mdm-action-card p-3 rounded">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h6 className="fw-semibold mb-0 flex-grow-1 pe-2">
                            {ai.taskDescription}
                          </h6>
                        </div>
                        <div className="mdm-action-meta d-flex flex-wrap gap-3 text-muted small">
                          <span className="d-flex align-items-center gap-2">
                            <i className="bi bi-person-circle text-primary"></i>
                            <span>
                              <strong>Assigned to:</strong>{" "}
                              <span className="text-primary fw-medium">
                                {employeeMap[ai.assignedToEmployeeId] ||
                                  `Employee ${ai.assignedToEmployeeId}`}
                              </span>
                            </span>
                          </span>
                          <span className="d-flex align-items-center gap-2">
                            <i className="bi bi-calendar-event text-danger"></i>
                            <span>
                              <strong>Due:</strong>{" "}
                              {new Date(ai.dueDate).toLocaleDateString()}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="mdm-create-mom-btn btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                onClick={toggleCreateMom}
              >
                <i
                  className={`bi ${
                    showCreateMom ? "bi-x-circle" : "bi-plus-circle"
                  }`}
                ></i>
                {showCreateMom
                  ? "Cancel MOM Creation"
                  : "Create MOM for this Meeting"}
              </button>

              {showCreateMom && (
                <CreateMomModal
                  meetingData={meeting}
                  onClose={toggleCreateMom}
                />
              )}
            </div>

            <div className="mdm-footer modal-footer border-0">
              <button
                className="mdm-close-btn btn btn-secondary px-4"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MeetingDetailsModal;
