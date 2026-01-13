import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import "../../../styles/mom/modals/ManagerMeetingDetailsModal.css";

const PRIMARY = "#27235C";

const ManagerMeetingDetailsModal = ({ meeting, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

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

  const countAccepted =
    meeting.rsvpParticipants?.filter((p) => p.rsvpStatus == 1).length || 0;
  const totalParticipants = meeting.rsvpParticipants?.length || 0;

  const acceptedPercentage =
    totalParticipants > 0 ? (countAccepted / totalParticipants) * 100 : 0;

  const modalContent = (
    <div className="mmdm-overlay" onClick={onClose}>
      <div className="mmdm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mmdm-header">
          <h5 className="mmdm-title">{meeting.meetingTitle}</h5>
          <p className="mmdm-subtitle">
            <i className="bi bi-calendar3"></i>
            {formatDateTime(meeting.meetingDate)}
          </p>
          <button className="mmdm-close-icon" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="mmdm-body">
          <div className="mmdm-stats-card">
            <div className="mmdm-stats-row">
              <div className="mmdm-stat">
                <div className="mmdm-stat-label">Accepted</div>
                <div className="mmdm-stat-value mmdm-stat-accepted">
                  {countAccepted}
                </div>
              </div>
              <div className="mmdm-stat">
                <div className="mmdm-stat-label">Total Invited</div>
                <div className="mmdm-stat-value mmdm-stat-total">
                  {totalParticipants}
                </div>
              </div>
            </div>
            <div className="mmdm-progress-bar">
              <div
                className="mmdm-progress-fill"
                style={{ width: `${acceptedPercentage}%` }}
              ></div>
            </div>
          </div>

          {meeting.meetingLink && (
            <div className="mmdm-meeting-link-wrapper">
              <div className="mmdm-meeting-link-card">
                <div className="mmdm-meeting-link-header">
                  <i className="bi bi-link-45deg mmdm-meeting-link-icon"></i>
                  <small className="mmdm-meeting-link-label">
                    Meeting Link
                  </small>
                </div>
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mmdm-meeting-link"
                >
                  Join Meeting
                  <i className="bi bi-box-arrow-up-right mmdm-meeting-link-external"></i>
                </a>
              </div>
            </div>
          )}

          <h6 className="mmdm-participants-title">
            <span className="mmdm-participants-label">
              <i className="bi bi-people mmdm-participants-icon"></i>
              Participants
            </span>
            {totalParticipants > 0 && (
              <span className="mmdm-participants-count">
                {totalParticipants}
              </span>
            )}
          </h6>

          {meeting.rsvpParticipants?.length === 0 ? (
            <div className="mmdm-no-participants">
              <i className="bi bi-info-circle"></i>
              No participants found
            </div>
          ) : (
            <div className="mmdm-participants-list">
              {meeting.rsvpParticipants?.map((p) => (
                <div key={p.participantId} className="mmdm-participant-card">
                  <div className="mmdm-participant-header">
                    <div className="mmdm-participant-main">
                      <div className="mmdm-participant-name">
                        {p.employeeName}
                      </div>
                      {p.rsvpComments && (
                        <small className="mmdm-participant-comment">
                          <i className="bi bi-chat-dots"></i>
                          {p.rsvpComments}
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mmdm-footer">
          <button className="mmdm-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ManagerMeetingDetailsModal;
