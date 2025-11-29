
import React, { useState } from 'react';

import MomDetailsView from './MomDetailsView';

const ManagerMeetingDetailsModal = ({ meeting, onClose }) => {

  const [showMomDetails, setShowMomDetails] = useState(false);

  if (!meeting) return null;

  const formatDateTime = (isoString) => {

    if (!isoString) return "-";

    const date = new Date(isoString);

    const dd = String(date.getDate()).padStart(2, "0");

    const mm = String(date.getMonth() + 1).padStart(2, "0");

    const yyyy = date.getFullYear();

    const hh = String(date.getHours()).padStart(2, "0");

    const min = String(date.getMinutes()).padStart(2, "0");

    return `${dd}-${mm}-${yyyy} ${hh}:${min}`;

  };

  const countAccepted = meeting.rsvpParticipants?.filter((p) => p.rsvpStatus === "Accepted").length || 0;

  const totalParticipants = meeting.rsvpParticipants?.length || 0;

  return (
    <>
      <div

        className="modal fade show d-block"

        tabIndex="-1"

        style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: 'blur(4px)' }}

        onClick={onClose}
      >
        <div

          className="modal-dialog modal-dialog-scrollable modal-lg modal-dialog-centered"

          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
            <div className="modal-header border-0 pb-0" style={{ padding: '1.5rem 1.5rem 1rem' }}>
              <div>
                <h5 className="modal-title fw-bold mb-2">{meeting.meetingTitle}</h5>
                <p className="text-muted small mb-0">
                  <i className="bi bi-calendar3 me-1"></i>

                  {formatDateTime(meeting.meetingDate)}
                </p>
              </div>
              <button

                type="button"

                className="btn-close"

                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body" style={{ padding: '1rem 1.5rem' }}>

              {/* Attendance Stats */}
              <div className="card bg-light border-0 mb-4">
                <div className="card-body p-3">
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="text-muted small mb-1">Accepted</div>
                      <div className="fs-4 fw-bold text-success">{countAccepted}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small mb-1">Total Invited</div>
                      <div className="fs-4 fw-bold text-primary">{totalParticipants}</div>
                    </div>
                  </div>
                  <div className="progress mt-3" style={{ height: "8px" }}>
                    <div

                      className="progress-bar bg-success"

                      role="progressbar"

                      style={{

                        width: `${totalParticipants > 0

                            ? (countAccepted / totalParticipants) * 100

                            : 0

                          }%`,

                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Meeting Details */}

              {meeting.meetingLink && (
                <div className="mb-4">
                  <div className="p-3 rounded" style={{ backgroundColor: '#e3f2fd', border: '1px solid #bbdefb' }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-link-45deg text-primary"></i>
                      <small className="text-muted fw-semibold">Meeting Link</small>
                    </div>
                    <a

                      href={meeting.meetingLink}

                      target="_blank"

                      rel="noreferrer"

                      className="text-primary text-decoration-none d-flex align-items-center gap-2 fw-medium"
                    >
                      Join Meeting <i className="bi bi-box-arrow-up-right small"></i>
                    </a>
                  </div>
                </div>

              )}

              {/* Participants List */}
              <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-people text-primary"></i>

                Participants

                {totalParticipants > 0 && (
                  <span className="badge bg-light text-dark">{totalParticipants}</span>

                )}
              </h6>

              {meeting.rsvpParticipants?.length === 0 ? (
                <div className="alert alert-info d-flex align-items-center gap-2">
                  <i className="bi bi-info-circle"></i>

                  No participants found
                </div>

              ) : (
                <div className="d-flex flex-column gap-2">

                  {meeting.rsvpParticipants?.map((p) => (
                    <div

                      key={p.participantId}

                      className="p-3 rounded"

                      style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="fw-semibold mb-1">{p.employeeName}</div>

                          {p.rsvpComments && (
                            <small className="text-muted d-flex align-items-center gap-1">
                              <i className="bi bi-chat-dots"></i>

                              {p.rsvpComments}
                            </small>

                          )}
                        </div>
                        <span

                          className={`badge ${p.rsvpStatus === "Accepted"

                              ? "bg-success"

                              : p.rsvpStatus === "Declined"

                                ? "bg-danger"

                                : "bg-warning text-dark"

                            }`}
                        >

                          {p.rsvpStatus}
                        </span>
                      </div>
                    </div>

                  ))}
                </div>

              )}
            </div>
            <div className="modal-footer border-0 bg-light" style={{ padding: '1rem 1.5rem' }}>
              <button

                className="btn btn-secondary px-4"

                onClick={onClose}
              >

                Close
              </button>
             
            </div>
          </div>
        </div>
      </div>

      {showMomDetails && (
        <div

          className="modal fade show d-block"

          tabIndex="-1"

          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: 'blur(4px)' }}

          onClick={() => setShowMomDetails(false)}
        >
          <div

            className="modal-dialog modal-dialog-scrollable modal-lg modal-dialog-centered"

            onClick={(e) => e.stopPropagation()}
          >
            <MomDetailsView mom={meeting} onClose={() => setShowMomDetails(false)} />
          </div>
        </div>

      )}
    </>

  );

};

export default ManagerMeetingDetailsModal;

