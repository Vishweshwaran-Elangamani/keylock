import React, { useEffect } from "react";
import ReactDOM from "react-dom";

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
    meeting.rsvpParticipants?.filter((p) => p.rsvpStatus === "Accepted")
      .length || 0;
  const totalParticipants = meeting.rsvpParticipants?.length || 0;

  const modalContent = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          maxWidth: "600px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
     
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid #e5e7eb",
            position: "relative",
            backgroundColor: PRIMARY,
            color: "#ffffff",
          }}
        >
          <h5
            style={{
              margin: 0,
              fontWeight: "bold",
              fontSize: "1.25rem",
              marginBottom: "0.5rem",
              color: "#ffffff",
            }}
          >
            {meeting.meetingTitle}
          </h5>
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              color: "#E5E7EB",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <i className="bi bi-calendar3"></i>
            {formatDateTime(meeting.meetingDate)}
          </p>
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "1.5rem",
              right: "1.5rem",
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#E5E7EB",
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "1.5rem" }}>
       
          <div
            style={{
              backgroundColor: "#f9fafb",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  Accepted
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#10b981",
                  }}
                >
                  {countAccepted}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  Total Invited
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#3b82f6",
                  }}
                >
                  {totalParticipants}
                </div>
              </div>
            </div>
            <div
              style={{
                height: "8px",
                backgroundColor: "#e5e7eb",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  backgroundColor: "#10b981",
                  width: `${
                    totalParticipants > 0
                      ? (countAccepted / totalParticipants) * 100
                      : 0
                  }%`,
                  transition: "width 0.3s ease",
                }}
              ></div>
            </div>
          </div>

 
          {meeting.meetingLink && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  backgroundColor: "#e3f2fd",
                  border: "1px solid #bbdefb",
                  padding: "1rem",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <i
                    className="bi bi-link-45deg"
                    style={{ color: "#3b82f6" }}
                  ></i>
                  <small
                    style={{ color: "#6b7280", fontWeight: 600 }}
                  >
                    Meeting Link
                  </small>
                </div>
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "#3b82f6",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: 500,
                  }}
                >
                  Join Meeting{" "}
                  <i
                    className="bi bi-box-arrow-up-right"
                    style={{ fontSize: "0.875rem" }}
                  ></i>
                </a>
              </div>
            </div>
          )}

       
          <h6
            style={{
              fontWeight: 600,
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <i
              className="bi bi-people"
              style={{ color: "#3b82f6" }}
            ></i>
            Participants
            {totalParticipants > 0 && (
              <span
                style={{
                  backgroundColor: "#f3f4f6",
                  color: "#1f2937",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                {totalParticipants}
              </span>
            )}
          </h6>

          {meeting.rsvpParticipants?.length === 0 ? (
            <div
              style={{
                backgroundColor: "#dbeafe",
                color: "#1e40af",
                padding: "0.75rem",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <i className="bi bi-info-circle"></i>
              No participants found
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {meeting.rsvpParticipants?.map((p) => (
                <div
                  key={p.participantId}
                  style={{
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    padding: "0.75rem",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: "0.25rem",
                        }}
                      >
                        {p.employeeName}
                      </div>
                      {p.rsvpComments && (
                        <small
                          style={{
                            color: "#6b7280",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
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

   
        <div
          style={{
            backgroundColor: "#f9fafb",
            padding: "1rem 1.5rem",
            borderTop: "1px solid #e5e7eb",
            borderRadius: "0 0 12px 12px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              padding: "0.5rem 1.5rem",
              borderRadius: "8px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor = "#4b5563")
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "#6b7280")
            }
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ManagerMeetingDetailsModal;
