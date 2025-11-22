import { Modal, Badge, CloseButton } from "react-bootstrap";

const EscalationDetailModal = ({ 
  show, 
  onHide, 
  escalation,
  getSeverityBadge,
  getStatusBadge 
}) => {
  if (!show || !escalation) return null;

  // Custom Badge Component
  const CustomBadge = ({ variant, children }) => {
    const colors = {
      danger: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
      warning: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
      info: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
      success: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
      secondary: { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
    };

    const color = colors[variant] || colors.secondary;

    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 10px",
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 500,
          background: color.bg,
          color: color.text,
          border: `1px solid ${color.border}`,
        }}
      >
        {children}
      </span>
    );
  };

  return (
    <>
      {/* Blurred Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(39,35,92,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
        }}
        onClick={onHide}
      />

      {/* Modal Container with Scroll */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "800px",
          maxHeight: "75vh",
          zIndex: 1050,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            borderRadius: "0.5rem",
            background: "#fff",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            overflow: "hidden",
            width: "100%",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER - Fixed */}
          <div
            style={{
              background: "#27235C",
              color: "#fff",
              padding: "13px 15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "15px",
              fontWeight: 600,
              borderRadius: "0.5rem 0.5rem 0 0",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <i className="bi bi-exclamation-triangle"></i>
              SLA Escalation Details
            </div>
            <button
              type="button"
              onClick={onHide}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY - Scrollable */}
          <div
            style={{
              padding: "24px",
              background: "#fff",
              textAlign: "left",
              overflowY: "auto",
              flex: 1,
            }}
          >
            {/* Detail Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                fontSize: 14,
              }}
            >
              {/* Employee Name */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#475569",
                    fontSize: 13,
                  }}
                >
                  Employee Name:
                </label>
                <span style={{ color: "#1e293b" }}>
                  {escalation.employeeName || "N/A"}
                </span>
              </div>

              {/* Employee ID */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#475569",
                    fontSize: 13,
                  }}
                >
                  Employee ID:
                </label>
                <span style={{ color: "#1e293b" }}>
                  {escalation.employeeUserId}
                </span>
              </div>

              {/* Email */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#475569",
                    fontSize: 13,
                  }}
                >
                  Email:
                </label>
                <span style={{ color: "#1e293b" }}>
                  {escalation.employeeEmail || "N/A"}
                </span>
              </div>

              {/* SLA Type */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#475569",
                    fontSize: 13,
                  }}
                >
                  SLA Type:
                </label>
                <span style={{ color: "#1e293b" }}>
                  {escalation.slaType || "N/A"}
                </span>
              </div>

              {/* Escalation Level */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#475569",
                    fontSize: 13,
                  }}
                >
                  Escalation Level:
                </label>
                <span style={{ color: "#1e293b" }}>
                  {escalation.escalationLevel}
                </span>
              </div>

              {/* Severity */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#475569",
                    fontSize: 13,
                  }}
                >
                  Severity:
                </label>
                <div>
                  <CustomBadge variant={getSeverityBadge(escalation.severity)}>
                    {escalation.severity}
                  </CustomBadge>
                </div>
              </div>

              {/* Status */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#475569",
                    fontSize: 13,
                  }}
                >
                  Status:
                </label>
                <div>
                  <CustomBadge variant={getStatusBadge(escalation.escalationStatus)}>
                    {escalation.escalationStatus}
                  </CustomBadge>
                </div>
              </div>

              {/* Days Overdue */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#475569",
                    fontSize: 13,
                  }}
                >
                  Days Overdue:
                </label>
                <span
                  style={{
                    color: "#dc2626",
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  {escalation.daysOverdue} days
                </span>
              </div>

              {/* SLA Deadline */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#475569",
                    fontSize: 13,
                  }}
                >
                  SLA Deadline:
                </label>
                <span style={{ color: "#1e293b" }}>
                  {new Date(escalation.slaDeadline).toLocaleDateString()}
                </span>
              </div>

              {/* Escalated To */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#475569",
                    fontSize: 13,
                  }}
                >
                  Escalated To:
                </label>
                <span style={{ color: "#1e293b" }}>
                  {escalation.escalatedToName || "N/A"}
                </span>
              </div>

              {/* Escalated At */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#475569",
                    fontSize: 13,
                  }}
                >
                  Escalated At:
                </label>
                <span style={{ color: "#1e293b" }}>
                  {new Date(escalation.submittedAt).toLocaleString()}
                </span>
              </div>

              {/* Submitted By */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#475569",
                    fontSize: 13,
                  }}
                >
                  Submitted By:
                </label>
                <span style={{ color: "#1e293b" }}>
                  {escalation.submittedByName || "N/A"}
                </span>
              </div>

              {/* Reason - Full Width */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  gridColumn: "1 / -1",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#475569",
                    fontSize: 13,
                  }}
                >
                  Reason:
                </label>
                <p
                  style={{
                    margin: 0,
                    padding: 12,
                    background: "#f8fafc",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    color: "#334155",
                    lineHeight: 1.6,
                    fontSize: 13,
                  }}
                >
                  {escalation.reason}
                </p>
              </div>

              {/* Description - Full Width (Conditional) */}
              {escalation.description && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    gridColumn: "1 / -1",
                  }}
                >
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#475569",
                      fontSize: 13,
                    }}
                  >
                    Description:
                  </label>
                  <p
                    style={{
                      margin: 0,
                      padding: 12,
                      background: "#f8fafc",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      color: "#334155",
                      lineHeight: 1.6,
                      fontSize: 13,
                    }}
                  >
                    {escalation.description}
                  </p>
                </div>
              )}

              {/* Resolution Details (Conditional) */}
              {escalation.resolvedAt && (
                <>
                  {/* Resolved At */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <label
                      style={{
                        fontWeight: 600,
                        color: "#475569",
                        fontSize: 13,
                      }}
                    >
                      Resolved At:
                    </label>
                    <span style={{ color: "#1e293b" }}>
                      {new Date(escalation.resolvedAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Resolved By */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <label
                      style={{
                        fontWeight: 600,
                        color: "#475569",
                        fontSize: 13,
                      }}
                    >
                      Resolved By:
                    </label>
                    <span style={{ color: "#1e293b" }}>
                      {escalation.resolvedByName || "N/A"}
                    </span>
                  </div>

                  {/* Resolution Comments (Conditional) */}
                  {escalation.resolutionComments && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        gridColumn: "1 / -1",
                      }}
                    >
                      <label
                        style={{
                          fontWeight: 600,
                          color: "#475569",
                          fontSize: 13,
                        }}
                      >
                        Resolution Comments:
                      </label>
                      <p
                        style={{
                          margin: 0,
                          padding: 12,
                          background: "#f0fdf4",
                          borderRadius: 6,
                          border: "1px solid #86efac",
                          color: "#166534",
                          lineHeight: 1.6,
                          fontSize: 13,
                        }}
                      >
                        {escalation.resolutionComments}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* FOOTER - Fixed */}
          <div
            style={{
              padding: "10px 15px",
              borderTop: "1px solid #e2e8f0",
              background: "#fff",
              display: "flex",
              justifyContent: "flex-end",
              borderBottomLeftRadius: "0.5rem",
              borderBottomRightRadius: "0.5rem",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onHide}
              style={{
                background: "#6c757d",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "7px 12px",
                fontSize: 12,
                borderRadius: 5,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#5a6268";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#6c757d";
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EscalationDetailModal;
