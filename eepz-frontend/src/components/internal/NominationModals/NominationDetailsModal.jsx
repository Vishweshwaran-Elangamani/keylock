const NominationDetailsModal = ({ show, onHide, nomination }) => {
  if (!show || !nomination) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "status-active";
      case "rejected":
        return "status-inactive";
      case "pending":
      case "pending_manager_review":
      case "pending_dept_head_approval":
        return "status-pending";
      default:
        return "status-inactive";
    }
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
              <i className="bi bi-info-circle"></i>
              Nomination Details
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
            {/* Opportunity Information */}
            <div
              style={{
                marginBottom: 24,
                padding: 16,
                background: "#f0f4ff",
                borderRadius: 8,
              }}
            >
              <h6
                style={{
                  color: "#27235c",
                  fontWeight: 600,
                  marginBottom: 12,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <i className="bi bi-briefcase"></i>
                Opportunity Information
              </h6>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#6c757d",
                      fontWeight: 500,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Opportunity Name:
                  </label>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      color: "#27235c",
                      fontSize: 14,
                    }}
                  >
                    {nomination.opportunityName || "N/A"}
                  </p>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#6c757d",
                      fontWeight: 500,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Opportunity ID:
                  </label>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      color: "#27235c",
                      fontSize: 14,
                    }}
                  >
                    #{nomination.opportunityId || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Nominee Information */}
            <div
              style={{
                marginBottom: 24,
                padding: 16,
                background: "#f0fdf4",
                borderRadius: 8,
              }}
            >
              <h6
                style={{
                  color: "#166534",
                  fontWeight: 600,
                  marginBottom: 12,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <i className="bi bi-person"></i>
                Nominee Information
              </h6>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#6c757d",
                      fontWeight: 500,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Nominee Name:
                  </label>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      color: "#166534",
                      fontSize: 14,
                    }}
                  >
                    {nomination.nomineeName || "N/A"}
                  </p>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#6c757d",
                      fontWeight: 500,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Nominee User ID:
                  </label>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      color: "#166534",
                      fontSize: 14,
                    }}
                  >
                    #{nomination.nomineeUserId || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Nomination Details */}
            <div
              style={{
                marginBottom: 24,
                padding: 16,
                background: "#fef3c7",
                borderRadius: 8,
              }}
            >
              <h6
                style={{
                  color: "#92400e",
                  fontWeight: 600,
                  marginBottom: 12,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <i className="bi bi-file-text"></i>
                Nomination Details
              </h6>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#6c757d",
                      fontWeight: 500,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Nominated By:
                  </label>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      color: "#92400e",
                      fontSize: 14,
                    }}
                  >
                    {nomination.nominatedByName || "N/A"}
                  </p>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#6c757d",
                      fontWeight: 500,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Nomination Type:
                  </label>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      color: "#92400e",
                      fontSize: 14,
                    }}
                  >
                    {nomination.nominationType
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()) || "N/A"}
                  </p>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#6c757d",
                      fontWeight: 500,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Submitted Date:
                  </label>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      color: "#92400e",
                      fontSize: 14,
                    }}
                  >
                    {formatDate(nomination.submittedAt)}
                  </p>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#6c757d",
                      fontWeight: 500,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Status:
                  </label>
                  <p style={{ margin: 0 }}>
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        nomination.status
                      )}`}
                    >
                      {nomination.status
                        ?.replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase()) || "N/A"}
                    </span>
                  </p>
                </div>
              </div>
              {nomination.justification && (
                <div style={{ marginTop: 12 }}>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#6c757d",
                      fontWeight: 500,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Justification:
                  </label>
                  <p
                    style={{
                      margin: 0,
                      padding: 12,
                      background: "#fff",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      color: "#374151",
                      lineHeight: 1.6,
                      fontSize: 13,
                      wordBreak: "break-word",
                    }}
                  >
                    {nomination.justification}
                  </p>
                </div>
              )}
            </div>

            {/* Review Information (if available) */}
            {(nomination.reviewRemarks || nomination.reviewedByName) && (
              <div
                style={{
                  padding: 16,
                  background: "#e0e7ff",
                  borderRadius: 8,
                }}
              >
                <h6
                  style={{
                    color: "#1e40af",
                    fontWeight: 600,
                    marginBottom: 12,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <i className="bi bi-chat-left-text"></i>
                  Review Information
                </h6>
                {nomination.reviewedByName && (
                  <div style={{ marginBottom: 12 }}>
                    <label
                      style={{
                        fontSize: 12,
                        color: "#6c757d",
                        fontWeight: 500,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Reviewed By:
                    </label>
                    <p
                      style={{
                        margin: 0,
                        color: "#374151",
                        lineHeight: 1.6,
                        fontSize: 14,
                      }}
                    >
                      {nomination.reviewedByName}
                    </p>
                  </div>
                )}
                {nomination.reviewedAt && (
                  <div style={{ marginBottom: 12 }}>
                    <label
                      style={{
                        fontSize: 12,
                        color: "#6c757d",
                        fontWeight: 500,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Reviewed At:
                    </label>
                    <p
                      style={{
                        margin: 0,
                        color: "#374151",
                        lineHeight: 1.6,
                        fontSize: 14,
                      }}
                    >
                      {formatDate(nomination.reviewedAt)}
                    </p>
                  </div>
                )}
                {nomination.reviewRemarks && (
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        color: "#6c757d",
                        fontWeight: 500,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Review Remarks:
                    </label>
                    <p
                      style={{
                        margin: 0,
                        padding: 12,
                        background: "#fff",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        color: "#374151",
                        lineHeight: 1.6,
                        fontSize: 13,
                      }}
                    >
                      {nomination.reviewRemarks}
                    </p>
                  </div>
                )}
              </div>
            )}
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
              <i className="bi bi-x-circle"></i> Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NominationDetailsModal;
