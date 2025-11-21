import { useState } from "react";
import { toast } from "sonner";

const RejectEmailChangeModal = ({ show, request, onHide, onReject, processing }) => {
  const [adminRemarks, setAdminRemarks] = useState("");

  const handleSubmit = () => {
    if (!adminRemarks.trim()) {
      toast.error("Please provide remarks for rejection");
      return;
    }

    if (adminRemarks.trim().length < 5) {
      toast.error("Remarks must be at least 5 characters");
      return;
    }

    onReject(adminRemarks);
  };

  const handleClose = () => {
    setAdminRemarks("");
    onHide();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!show || !request) return null;

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
        onClick={handleClose}
      />

      {/* Modal Container with Scroll */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "700px",
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
          {/* HEADER - Standard Blue */}
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
              <i className="bi bi-x-circle-fill"></i>
              Reject Email Change Request
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={processing}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: processing ? "not-allowed" : "pointer",
                opacity: processing ? 0.7 : 1,
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
            {/* Request Details Box */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <h6
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1e293b",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <i className="bi bi-info-circle"></i>
                Request Details
              </h6>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Employee:</span>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ color: "#1e293b" }}>{request.employeeName}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Current Email:</span>
                  <code
                    style={{
                      background: "#fef3c7",
                      color: "#92400e",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    {request.currentValue || "Not set"}
                  </code>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>New Email:</span>
                  <code
                    style={{
                      background: "#fee2e2",
                      color: "#991b1b",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {request.newValue}
                  </code>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Requested At:</span>
                  <span style={{ color: "#1e293b" }}>{formatDate(request.requestedAt)}</span>
                </div>

                {request.reason && (
                  <div style={{ marginTop: 8 }}>
                    <span
                      style={{
                        color: "#64748b",
                        fontWeight: 600,
                        fontSize: 13,
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Employee Reason:
                    </span>
                    <div
                      style={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 6,
                        padding: 10,
                        fontSize: 13,
                        color: "#475569",
                        lineHeight: 1.6,
                      }}
                    >
                      {request.reason}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Remarks - REQUIRED */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#334155",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Admin Remarks <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
              </label>
              <textarea
                rows="4"
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder="Required: Provide detailed reason for rejection"
                disabled={processing}
                maxLength={500}
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: 13,
                  background: "#fff",
                  color: "#22223b",
                  resize: "vertical",
                }}
              />
              <small style={{ color: "#64748b", fontSize: 11 }}>
                {adminRemarks.length}/500 characters
              </small>
            </div>

            {/* Warning Alert */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                border: "2px solid #dc2626",
                color: "#7f1d1d",
                borderRadius: 6,
                fontSize: 12,
                padding: "10px 12px",
                gap: 8,
              }}
            >
              <i
                className="bi bi-exclamation-triangle-fill"
                style={{ fontSize: 16, marginTop: 2, color: "#dc2626" }}
              ></i>
              <div>
                <strong style={{ display: "block", marginBottom: 4, color: "#991b1b" }}>
                  Warning:
                </strong>
                Please provide a clear reason for rejection. The employee will be able to see
                your remarks.
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
              gap: 8,
              borderBottomLeftRadius: "0.5rem",
              borderBottomRightRadius: "0.5rem",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={processing}
              style={{
                background: "#6c757d",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "7px 12px",
                fontSize: 12,
                borderRadius: 5,
                cursor: processing ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                opacity: processing ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!processing) e.target.style.background = "#5a6268";
              }}
              onMouseLeave={(e) => {
                if (!processing) e.target.style.background = "#6c757d";
              }}
            >
              <i className="bi bi-x-circle"></i> Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={processing}
              style={{
                background:
                  "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "7px 12px",
                fontSize: 12,
                borderRadius: 5,
                boxShadow: "0 2px 8px rgba(151,36,126,0.25)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: processing ? "not-allowed" : "pointer",
                opacity: processing ? 0.85 : 1,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!processing) e.target.style.opacity = 0.93;
              }}
              onMouseLeave={(e) => {
                if (!processing) e.target.style.opacity = 1;
              }}
            >
              {processing ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid #fff",
                      borderTop: "2px solid #E01950",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                      marginRight: 6,
                    }}
                  />
                  Processing...
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg);}
                      100% { transform: rotate(360deg);}
                    }
                  `}</style>
                </>
              ) : (
                <>
                  <i className="bi bi-x-circle"></i> Reject
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RejectEmailChangeModal;
