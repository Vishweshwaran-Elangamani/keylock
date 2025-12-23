import React from 'react';

const PRIMARY = '#27235C';

const MomDetailsView = ({ mom, onClose }) => {
  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.25)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1060,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      {/* Centered container */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '53%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content border-0 shadow-lg"
          style={{ borderRadius: '16px', overflow: 'hidden' }}
        >
          {/* HEADER */}
          <div
            className="modal-header border-0"
            style={{
              padding: '1.25rem 1.5rem 0.75rem',
              backgroundColor: PRIMARY,
            }}
          >
            <div>
              <h5
                className="modal-title fw-bold mb-1"
                style={{
                  color: '#ffffff',
                  fontSize: '1.4rem',
                  lineHeight: 1.2,
                }}
              >
                {mom.meetingTitle}
              </h5>

              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: PRIMARY,
                  color: '#ffffff',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.9rem',
                  border: '1px solid rgba(255,255,255,0.4)',
                }}
              >
                {mom.meetingType}
              </span>
            </div>

            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* BODY */}
          <div
            className="modal-body"
            style={{
              padding: '1.25rem 1.5rem 1rem',
              maxHeight: 'calc(90vh - 170px)',
              overflowY: 'auto',
            }}
          >
            <div
              className="card bg-light border-0 mb-4"
              style={{ borderRadius: '18px' }}
            >
              <div className="card-body p-4">
                <h6
                  className="fw-semibold mb-4"
                  style={{ color: PRIMARY, fontSize: '0.95rem' }}
                >
                  Meeting Information
                </h6>
                <div className="row g-4">
                  <div className="col-md-6">
                    <small className="text-muted d-block mb-1">
                      Meeting Date:
                    </small>
                    <div className="fw-semibold d-flex align-items-center gap-2">
                      <i
                        className="bi bi-calendar3"
                        style={{ color: PRIMARY }}
                      ></i>
                      {new Date(mom.meetingDate).toLocaleString()}
                    </div>
                  </div>

                  {mom.meetingLink && (
                    <div className="col-md-6">
                      <small className="text-muted d-block mb-1">
                        Meeting Link:
                      </small>
                      <a
                        href={mom.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="fw-semibold d-flex align-items-center gap-2"
                        style={{ color: PRIMARY, textDecoration: 'none' }}
                      >
                        <i className="bi bi-link-45deg"></i>
                        Join Meeting
                        <i className="bi bi-box-arrow-up-right small"></i>
                      </a>
                    </div>
                  )}

                  <div className="col-md-6">
                    <small className="text-muted d-block mb-1">
                      Attendees:
                    </small>
                    <div className="fw-semibold d-flex align-items-center gap-2">
                      <i
                        className="bi bi-people"
                        style={{ color: PRIMARY }}
                      ></i>
                      {mom.attendees || 'N/A'}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <small className="text-muted d-block mb-1">
                      Submitted by:
                    </small>
                    <div
                      className="fw-semibold d-flex align-items-center"
                      style={{ gap: '6px' }}
                    >
                      <i
                        className="bi bi-person-circle"
                        style={{ color: PRIMARY }}
                      ></i>
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
                <h6
                  className="fw-semibold mb-3 d-flex align-items-center gap-2"
                  style={{ color: PRIMARY }}
                >
                  <i className="bi bi-chat-left-text"></i>
                  Comments & Observations
                </h6>
                <div className="alert alert-secondary mb-0">
                  {mom.commentsObservations}
                </div>
              </div>
            )}

            <div className="mb-4">
              <h6
                className="fw-semibold mb-3 d-flex align-items-center gap-2"
                style={{ color: PRIMARY }}
              >
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
                      className="p-3 rounded d-flex align-items-start gap-3"
                      style={{ backgroundColor: '#f8f9fa' }}
                    >
                      <span className="">{dp.pointText}</span>
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
              <h6
                className="fw-semibold mb-3 d-flex align-items-center gap-2"
                style={{ color: PRIMARY }}
              >
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
                    <div
                      key={index}
                      className="p-3 rounded"
                      style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h6 className="fw-semibold mb-0">
                          {ai.taskDescription}
                        </h6>
                      </div>
                      <div className="row g-2">
                        <div className="col-md-6">
                          <small className="text-muted d-flex align-items-center gap-2">
                            <i className="bi bi-person-circle text-primary"></i>
                            <strong>Assigned to:</strong>{' '}
                            {ai.assignedToEmployeeName || 'N/A'}
                          </small>
                        </div>
                        <div className="col-md-6">
                          <small className="text-muted d-flex align-items-center gap-2">
                            <i className="bi bi-calendar-event text-danger"></i>
                            <strong>Due Date:</strong>{' '}
                            {ai.dueDate
                              ? new Date(ai.dueDate).toLocaleDateString()
                              : 'N/A'}
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

          {/* FOOTER – Close button aligned to right, styled like Cancel */}
          <div
            className="modal-footer border-0"
            style={{
              padding: '1rem 1.5rem 1.5rem',
              backgroundColor: '#ffffff',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#4B5563', // same tone as Cancel
                border: 'none',
                color: '#ffffff',
                borderRadius: '9999px',
                padding: '0.6rem 1.8rem',
                minWidth: '120px',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .modal.show.d-block {
          display: flex !important;
        }
      `}</style>
    </div>
  );
};

export default MomDetailsView;
