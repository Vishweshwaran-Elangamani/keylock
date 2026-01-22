import React from "react";
import "../../../styles/mom/modals/MomDetailsView.css";

const MomDetailsView = ({ mom, onClose }) => {
  if (!mom) return null;

  return (
    <div
      className="mdv-overlay modal fade show d-block mdv-modal-open"
      tabIndex="-1"
      onClick={onClose}
    >
      <div className="mdv-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="mdv-content modal-content border-0 shadow-lg">
          <div className="mdv-header modal-header border-0">
            <div>
              <h5 className="mdv-title modal-title fw-bold mb-1">
                {mom.meetingTitle}
              </h5>
              <span className="mdv-type-pill">{mom.meetingType}</span>
            </div>

            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          <div className="mdv-body modal-body">
            <div className="mdv-info-card card bg-light border-0 mb-4">
              <div className="card-body p-4">
                <h6 className="mdv-info-title fw-semibold mb-4">
                  Meeting Information
                </h6>

                <div className="row g-4">
                  <div className="col-md-6">
                    <small className="mdv-muted text-muted d-block mb-1">
                      Meeting Date:
                    </small>
                    <div className="fw-semibold d-flex align-items-center gap-2">
                      <i className="bi bi-calendar3 mdv-icon-primary"></i>
                      {new Date(mom.meetingDate).toLocaleString()}
                    </div>
                  </div>

                  {mom.meetingLink && (
                    <div className="col-md-6">
                      <small className="mdv-muted text-muted d-block mb-1">
                        Meeting Link:
                      </small>
                      <a
                        href={mom.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mdv-link fw-semibold d-flex align-items-center gap-2"
                      >
                        <i className="bi bi-link-45deg"></i>
                        Join Meeting
                        <i className="bi bi-box-arrow-up-right small"></i>
                      </a>
                    </div>
                  )}

                  <div className="col-md-6">
                    <small className="mdv-muted text-muted d-block mb-1">
                      Attendees:
                    </small>
                    <div className="fw-semibold d-flex align-items-center gap-2">
                      <i className="bi bi-people mdv-icon-primary"></i>
                      {mom.attendees || "N/A"}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <small className="mdv-muted text-muted d-block mb-1">
                      Submitted by:
                    </small>
                    <div className="fw-semibold d-flex align-items-center mdv-submitter">
                      <i className="bi bi-person-circle mdv-icon-primary"></i>
                      <span>
                        {mom.submittedByEmployeeName} ({mom.submittedByRole})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {mom.commentsObservations && (
              <div className="mb-4">
                <h6 className="mdv-section-title fw-semibold mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-chat-left-text"></i>
                  Comments &amp; Observations
                </h6>
                <div className="mdv-comments alert alert-secondary mb-0">
                  {mom.commentsObservations}
                </div>
              </div>
            )}

            <div className="mb-4">
              <h6 className="mdv-section-title fw-semibold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-chat-dots"></i>
                Discussion Points
                {mom.discussionPoints?.length > 0 && (
                  <span className="badge bg-light text-dark">
                    {mom.discussionPoints.length}
                  </span>
                )}
              </h6>

              {mom.discussionPoints?.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {mom.discussionPoints.map((dp, index) => (
                    <div
                      key={index}
                      className="mdv-discussion-item p-3 rounded d-flex align-items-start gap-3"
                    >
                      <span>{dp.pointText}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info mb-0">
                  No discussion points recorded
                </div>
              )}
            </div>

            <div className="mb-4">
              <h6 className="mdv-section-title fw-semibold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-check2-square"></i>
                Action Items
                {mom.actionItems?.length > 0 && (
                  <span className="badge bg-light text-dark">
                    {mom.actionItems.length}
                  </span>
                )}
              </h6>

              {mom.actionItems?.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {mom.actionItems.map((ai, index) => (
                    <div key={index} className="mdv-action-item p-3 rounded">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h6 className="fw-semibold mb-0">
                          {ai.taskDescription}
                        </h6>
                      </div>

                      <div className="row g-2">
                        <div className="col-md-6">
                          <small className="text-muted d-flex align-items-center gap-2">
                            <i className="bi bi-person-circle text-primary"></i>
                            <strong>Assigned to:</strong>{" "}
                            {ai.assignedToEmployeeName || "N/A"}
                          </small>
                        </div>

                        <div className="col-md-6">
                          <small className="text-muted d-flex align-items-center gap-2">
                            <i className="bi bi-calendar-event text-danger"></i>
                            <strong>Due Date:</strong>{" "}
                            {ai.dueDate
                              ? new Date(ai.dueDate).toLocaleDateString()
                              : "N/A"}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info mb-0">
                  No action items recorded
                </div>
              )}
            </div>
          </div>

          <div className="mdv-footer modal-footer border-0">
            <button type="button" onClick={onClose} className="mdv-close-btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MomDetailsView;
