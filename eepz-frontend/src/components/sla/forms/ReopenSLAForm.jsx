import React, { useState } from "react";
import { X, RotateCcw, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import slaService from "../../../services/sla/slaService";

const ReopenSLAForm = ({ sla, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    extensionDays: 1,
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const reopenData = {
        slaid: sla.slaid,
        extensionDays: 1,
        reopenReason: formData.reason,
        reopenedByEmployeeId: user.empId,
      };

      const response = await slaService.reopenSLA(reopenData);

      if (response.success) {
        toast.success("SLA reopened successfully");
        onSuccess();
        onClose();
      } else {
        toast.error("Failed to reopen SLA");
        setError(response.message || "Failed to reopen SLA");
      }
    } catch (err) {
      console.error("Reopen error:", err);
      toast.error("Error reopening SLA");
      setError(err.message || "Failed to reopen SLA");
    } finally {
      setLoading(false);
    }
  };

  const calculateNewDeadline = () => {
    const originalDeadline = new Date(sla.deadline);
    const newDeadline = new Date(originalDeadline);
    newDeadline.setDate(newDeadline.getDate() + 1);
    return newDeadline.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        backdropFilter: "blur(4px)",
      }}
      onClick={!loading ? onClose : undefined}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "520px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.25rem 1.5rem",
            backgroundColor: "#3c3862",
            borderBottom: "none",
          }}
        >
          <h5
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: "1.1rem",
              color: "white",
              textAlign: "left",
            }}
          >
            Reopen SLA (1 Day Extension)
          </h5>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              border: "none",
              backgroundColor: "transparent",
              cursor: loading ? "not-allowed" : "pointer",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: loading ? 0.5 : 0.8,
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = "1";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = "0.8";
              }
            }}
          >
            <X size={24} color="white" />
          </button>
        </div>

        <div style={{ padding: "1.75rem", backgroundColor: "#f8f9fa" }}>
          {error && (
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                padding: "1rem",
                backgroundColor: "rgba(224, 25, 80, 0.1)",
                border: "1px solid rgba(224, 25, 80, 0.3)",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                alignItems: "flex-start",
              }}
            >
              <AlertCircle
                size={20}
                style={{ color: "#E01950", flexShrink: 0, marginTop: "2px" }}
              />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    color: "#991b1b",
                    fontSize: "0.875rem",
                    textAlign: "left",
                  }}
                >
                  {error}
                </p>
              </div>
              <button
                onClick={() => setError(null)}
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  padding: "0",
                  display: "flex",
                  alignItems: "center",
                  color: "#E01950",
                  opacity: 0.7,
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
              >
                <X size={18} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div
              style={{
                backgroundColor: "white",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <small
                    style={{
                      display: "block",
                      marginBottom: "0.375rem",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      color: "#6b7280",
                      textAlign: "left",
                    }}
                  >
                    Current Deadline
                  </small>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "0.9375rem",
                      color: "#374151",
                      textAlign: "left",
                    }}
                  >
                    {new Date(sla.deadline).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </strong>
                </div>
                <div style={{ flex: 1 }}>
                  <small
                    style={{
                      display: "block",
                      marginBottom: "0.375rem",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      color: "#6b7280",
                      textAlign: "left",
                    }}
                  >
                    New Deadline (+1 Day)
                  </small>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "0.9375rem",
                      color: "#16A34A",
                      textAlign: "left",
                    }}
                  >
                    {calculateNewDeadline()}
                  </strong>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                padding: "0.875rem 1rem",
                backgroundColor: "#DBEAFE",
                border: "1px solid #BFDBFE",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                alignItems: "flex-start",
              }}
            >
              <AlertCircle
                size={18}
                style={{ color: "#1E40AF", flexShrink: 0, marginTop: "2px" }}
              />
              <p
                style={{
                  margin: 0,
                  color: "#1E40AF",
                  fontSize: "0.875rem",
                  textAlign: "left",
                }}
              >
                This SLA will be extended by <strong>1 day only</strong>
              </p>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "0.9rem",
                  textAlign: "left",
                }}
              >
                Reason for Reopening <span style={{ color: "#E01950" }}>*</span>
              </label>
              <textarea
                rows="4"
                placeholder="Explain why this SLA needs 1 more day..."
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                maxLength={500}
                disabled={loading}
                required
                style={{
                  width: "100%",
                  padding: "0.65rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  backgroundColor: "white",
                  lineHeight: "1.6",
                  textAlign: "left",
                  resize: "none",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "text",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "0.375rem",
                }}
              >
                <small
                  style={{
                    fontSize: "0.8125rem",
                    color: "#6b7280",
                    textAlign: "left",
                  }}
                >
                  Provide clear justification
                </small>
                <small
                  style={{
                    fontSize: "0.8125rem",
                    color: "#6b7280",
                    textAlign: "right",
                  }}
                >
                  {formData.reason.length}/500
                </small>
              </div>
            </div>
          </form>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            padding: "1rem 1.5rem",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "white",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "0.625rem 1.25rem",
              border: "none",
              backgroundColor: "#6b7280",
              color: "white",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              opacity: loading ? 0.5 : 1,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "#4b5563";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#6b7280";
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || !formData.reason.trim()}
            style={{
              padding: "0.625rem 1.5rem",
              background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor:
                loading || !formData.reason.trim() ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              opacity: loading || !formData.reason.trim() ? 0.6 : 1,
              boxShadow: "0 4px 12px rgba(151, 36, 126, 0.3)",
              transition: "all 0.2s ease",
              minWidth: "140px",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              if (!(loading || !formData.reason.trim())) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 16px rgba(151, 36, 126, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(151, 36, 126, 0.3)";
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Extending...
              </>
            ) : (
              <>
                <Send size={18} />
                Extend SLA
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ReopenSLAForm;
