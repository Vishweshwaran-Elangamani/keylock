const ViewOpportunityModal = ({ show, opportunity, onClose }) => {
  if (!show || !opportunity) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return { bg: "#dcfce7", text: "#166534", border: "#86efac" };
      case "closed":
        return { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" };
      case "pending":
        return { bg: "#fef3c7", text: "#92400e", border: "#fde68a" };
      default:
        return { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" };
    }
  };

  const statusColors = getStatusColor(opportunity.status);

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
        onClick={onClose}
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
              <i className="bi bi-eye"></i>
              Opportunity Details
            </div>
            <button
              type="button"
              onClick={onClose}
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
              padding: "20px",
              background: "#fff",
              textAlign: "left",
              overflowY: "auto",
              flex: 1,
            }}
          >
            {/* Opportunity Name & Status */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 20,
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <h4
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#1e293b",
                    margin: 0,
                    marginBottom: 8,
                  }}
                >
                  {opportunity.opportunityName}
                </h4>
                <div
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <i className="bi bi-building"></i>
                  {opportunity.departmentName || "N/A"}
                </div>
              </div>
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: statusColors.bg,
                  color: statusColors.text,
                  border: `1px solid ${statusColors.border}`,
                  whiteSpace: "nowrap",
                }}
              >
                {opportunity.status || "Pending"}
              </span>
            </div>

            {/* Key Info Grid */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#f9fafb",
                padding: "1rem",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 16,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 600,
                    }}
                  >
                    Posted By
                  </span>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#1e293b",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <i className="bi bi-person-circle"></i>
                    {opportunity.postedByName || "N/A"}
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 600,
                    }}
                  >
                    Deadline
                  </span>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#1e293b",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <i className="bi bi-calendar-event"></i>
                    {formatDate(opportunity.deadline)}
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 600,
                    }}
                  >
                    Created Date
                  </span>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#1e293b",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <i className="bi bi-clock-history"></i>
                    {formatDate(opportunity.createdAt)}
                  </div>
                </div>

                {opportunity.updatedAt && (
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        display: "block",
                        marginBottom: 4,
                        fontWeight: 600,
                      }}
                    >
                      Last Updated
                    </span>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#1e293b",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <i className="bi bi-arrow-clockwise"></i>
                      {formatDate(opportunity.updatedAt)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <h6
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <i className="bi bi-file-text"></i>
                Description
              </h6>
              <div
                style={{
                  padding: "12px 16px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "#475569",
                  lineHeight: 1.6,
                }}
              >
                {opportunity.description || "No description provided."}
              </div>
            </div>

            {/* Requirements */}
            <div style={{ marginBottom: 20 }}>
              <h6
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <i className="bi bi-list-check"></i>
                Requirements
              </h6>
              <div
                style={{
                  padding: "12px 16px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "#475569",
                  lineHeight: 1.6,
                }}
              >
                {opportunity.requirements || "No specific requirements listed."}
              </div>
            </div>

            {/* Info Box */}
            <div
              style={{
                padding: "12px 16px",
                background: "#d1ecf1",
                border: "1px solid #bee5eb",
                borderRadius: 8,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 13,
                color: "#0c5460",
              }}
            >
              <i
                className="bi bi-info-circle-fill"
                style={{
                  fontSize: 16,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              ></i>
              <div>
                <strong style={{ display: "block", marginBottom: 4 }}>
                  Note
                </strong>
                <p style={{ margin: 0 }}>
                  Interested candidates can submit their nominations before the
                  deadline. Please ensure you meet all the requirements before
                  applying.
                </p>
              </div>
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
              onClick={onClose}
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

export default ViewOpportunityModal;
