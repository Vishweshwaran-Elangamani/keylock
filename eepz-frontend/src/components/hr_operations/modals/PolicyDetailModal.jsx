import employeePolicyService from "../../../services/hr_operations/employee/employeePolicyService";

const PolicyDetailModal = ({ show, policy, onClose }) => {
  if (!show || !policy) return null;

  const handleViewDocument = (documentUrl) => {
    const fullUrl = employeePolicyService.getFullDocumentUrl(documentUrl);
    window.open(fullUrl, "_blank");
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
        onClick={onClose}
      />

      {/* Modal Container */}
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
              <i className="bi bi-shield-check"></i>
              {policy.policyName}
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
            {/* Category and Status Badges */}
            <div
              style={{
                marginBottom: 20,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 14px",
                  borderRadius: 50,
                  fontSize: 12,
                  fontWeight: 600,
                  background: "rgba(151, 36, 126, 0.1)",
                  color: "#97247e",
                  border: "1px solid rgba(151, 36, 126, 0.3)",
                }}
              >
                <i
                  className="bi bi-folder-fill"
                  style={{ marginRight: 6, fontSize: 11 }}
                ></i>
                {policy.category}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 14px",
                  borderRadius: 50,
                  fontSize: 12,
                  fontWeight: 600,
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "#059669",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                <i
                  className="bi bi-check-circle-fill"
                  style={{ marginRight: 6, fontSize: 11 }}
                ></i>
                Published
              </span>
            </div>

            {/* Description Section */}
            <div style={{ marginBottom: 24 }}>
              <h6
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <i
                  className="bi bi-file-text"
                  style={{ fontSize: 14, color: "#64748b" }}
                ></i>
                Description
              </h6>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "#475569",
                  lineHeight: 1.6,
                  background: "#f8fafc",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                }}
              >
                {policy.description}
              </p>
            </div>

            {/* Compliance Guidance Section */}
            {policy.complianceGuidance && (
              <div style={{ marginBottom: 24 }}>
                <h6
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#334155",
                    marginBottom: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <i
                    className="bi bi-shield-check"
                    style={{ fontSize: 14, color: "#64748b" }}
                  ></i>
                  Compliance Guidance
                </h6>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "#475569",
                    lineHeight: 1.6,
                    background: "#fef3c7",
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: "1px solid #fcd34d",
                    borderLeft: "4px solid #f59e0b",
                  }}
                >
                  {policy.complianceGuidance}
                </p>
              </div>
            )}

            {/* Attached Document Section */}
            {policy.documentUrl && (
              <div
                style={{
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 24,
                }}
              >
                <h6
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#334155",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <i
                    className="bi bi-file-earmark-pdf-fill"
                    style={{ fontSize: 16, color: "#0284c7" }}
                  ></i>
                  Attached Document
                </h6>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    background: "#fff",
                    padding: "10px 12px",
                    borderRadius: 6,
                    border: "1px solid #93c5fd",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <i
                      className="bi bi-file-earmark-pdf"
                      style={{ fontSize: 24, color: "#dc2626" }}
                    ></i>
                    <div>
                      <strong
                        style={{
                          fontSize: 14,
                          color: "#1e293b",
                          display: "block",
                        }}
                      >
                        {policy.documentName}
                      </strong>
                      {policy.documentSizeFormatted && (
                        <small
                          style={{
                            color: "#64748b",
                            fontSize: 12,
                            display: "block",
                            marginTop: 2,
                          }}
                        >
                          Size: {policy.documentSizeFormatted}
                        </small>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleViewDocument(policy.documentUrl)}
                    style={{
                      background:
                        "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                      border: "none",
                      color: "#fff",
                      fontWeight: 600,
                      padding: "8px 14px",
                      fontSize: 12,
                      borderRadius: 6,
                      boxShadow: "0 2px 8px rgba(151,36,126,0.25)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = 0.93;
                      e.target.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = 1;
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    <i className="bi bi-download"></i>
                    View/Download
                  </button>
                </div>
              </div>
            )}

            {/* Published Date Info */}
            <div
              style={{
                padding: "12px 14px",
                background: "#f1f5f9",
                borderRadius: 6,
                borderLeft: "3px solid #97247E",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <i
                className="bi bi-calendar-event"
                style={{ fontSize: 16, color: "#64748b" }}
              ></i>
              <div>
                <small
                  style={{
                    color: "#64748b",
                    fontSize: 11,
                    display: "block",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Published On
                </small>
                <strong
                  style={{
                    color: "#334155",
                    fontSize: 13,
                    display: "block",
                    marginTop: 2,
                  }}
                >
                  {new Date(policy.publishedAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </strong>
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
              <i className="bi bi-x-circle"></i>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PolicyDetailModal;
