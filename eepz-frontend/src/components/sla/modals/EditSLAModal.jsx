import React, { useState, useEffect } from "react";
import { X, Check, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

const EditSLAModal = ({ sla, onClose, onUpdate }) => {
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("");
  const [updateReason, setUpdateReason] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sla) {
      // Format date for input (YYYY-MM-DD)
      const date = new Date(sla.deadline);
      const formattedDate = date.toISOString().split("T")[0];
      setDeadline(formattedDate);
      setStatus(sla.status || "Open");
      setUpdateReason("");
    }
  }, [sla]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!deadline) {
      setError("Deadline is required");
      return;
    }

    if (!updateReason.trim()) {
      setError("Update reason is required");
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const updateData = {
        deadline: new Date(deadline).toISOString(),
        status: status,
        complianceStatus: status === "Closed" ? "OnTime" : sla.complianceStatus,
      };

      console.log("📝 Updating SLA with:", updateData);
      await onUpdate(sla.slaid, updateData);
    } catch (err) {
      setError(err.message || "Failed to update SLA");
    } finally {
      setUpdating(false);
    }
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "480px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Dark Purple Theme */}
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
              textAlign: "left"
            }}
          >
            Edit SLA - {sla?.employeeName}
          </h5>
          <button
            onClick={onClose}
            disabled={updating}
            style={{
              border: "none",
              backgroundColor: "transparent",
              cursor: updating ? "not-allowed" : "pointer",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: updating ? 0.5 : 0.8,
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!updating) {
                e.currentTarget.style.opacity = "1";
              }
            }}
            onMouseLeave={(e) => {
              if (!updating) {
                e.currentTarget.style.opacity = "0.8";
              }
            }}
          >
            <X size={24} color="white" />
          </button>
        </div>

        {/* Body - Light Gray Background */}
        <div style={{ padding: "1.75rem", backgroundColor: "#f8f9fa" }}>
          {/* Error Alert */}
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
                <p style={{ margin: 0, color: "#991b1b", fontSize: "0.95rem", textAlign: "left" }}>
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
                onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
              >
                <X size={18} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* SLA Info Box */}
            <div
              style={{
                backgroundColor: "white",
                padding: "0.875rem",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                marginBottom: "1.5rem",
              }}
            >
              <small 
                style={{ 
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.8125rem", 
                  fontWeight: 500,
                  color: "#6b7280",
                  textAlign: "left"
                }}
              >
                Current SLA
              </small>
              <strong 
                style={{ 
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.9375rem",
                  color: "#374151",
                  textAlign: "left"
                }}
              >
                {sla?.slatype}
              </strong>
              <small 
                style={{ 
                  display: "block",
                  fontSize: "0.8125rem",
                  color: "#6b7280",
                  textAlign: "left"
                }}
              >
                Employee: {sla?.employeeName}
              </small>
            </div>

            {/* Deadline Input */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label 
                style={{ 
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "0.9rem",
                  textAlign: "left"
                }}
              >
                Deadline <span style={{ color: "#E01950" }}>*</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={updating}
                style={{ 
                  width: "100%",
                  padding: "0.65rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  backgroundColor: "white",
                  textAlign: "left",
                  opacity: updating ? 0.6 : 1,
                  cursor: updating ? "not-allowed" : "text",
                }}
              />
            </div>

            {/* Status Select */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label 
                style={{ 
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "0.9rem",
                  textAlign: "left"
                }}
              >
                Status <span style={{ color: "#E01950" }}>*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={updating}
                style={{ 
                  width: "100%",
                  padding: "0.65rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  backgroundColor: "white",
                  textAlign: "left",
                  opacity: updating ? 0.6 : 1,
                  cursor: updating ? "not-allowed" : "pointer",
                }}
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Update Reason Textarea */}
            <div style={{ marginBottom: "1rem" }}>
              <label 
                style={{ 
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "0.9rem",
                  textAlign: "left"
                }}
              >
                Update Reason <span style={{ color: "#E01950" }}>*</span>
              </label>
              <textarea
                rows="3"
                placeholder="Why are you updating this SLA?"
                value={updateReason}
                onChange={(e) => setUpdateReason(e.target.value)}
                maxLength={250}
                disabled={updating}
                style={{ 
                  width: "100%",
                  padding: "0.65rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  backgroundColor: "white",
                  lineHeight: "1.6",
                  textAlign: "left",
                  resize: "none",
                  opacity: updating ? 0.6 : 1,
                  cursor: updating ? "not-allowed" : "text",
                }}
              />
              <small 
                style={{ 
                  display: "block",
                  marginTop: "0.375rem",
                  fontSize: "0.8125rem",
                  color: "#6b7280",
                  textAlign: "left"
                }}
              >
                {updateReason.length}/250 characters
              </small>
            </div>
          </form>
        </div>

        {/* Footer */}
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
            disabled={updating}
            style={{
              padding: "0.6rem 1.25rem",
              border: "none",
              backgroundColor: "#6b7280",
              color: "white",
              borderRadius: "8px",
              cursor: updating ? "not-allowed" : "pointer",
              fontSize: "0.95rem",
              fontWeight: 600,
              opacity: updating ? 0.5 : 1,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!updating) {
                e.currentTarget.style.backgroundColor = "#4b5563";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#6b7280";
            }}
          >
            Cancel
          </button>
          
          {/* Update Button - Gradient Theme */}
          <button
            onClick={handleSubmit}
            disabled={updating || !deadline || !updateReason.trim()}
            style={{
              padding: "0.6rem 1.5rem",
              background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: (updating || !deadline || !updateReason.trim()) ? "not-allowed" : "pointer",
              fontSize: "0.95rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              opacity: (updating || !deadline || !updateReason.trim()) ? 0.6 : 1,
              boxShadow: "0 4px 12px rgba(151, 36, 126, 0.3)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!(updating || !deadline || !updateReason.trim())) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(151, 36, 126, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(151, 36, 126, 0.3)";
            }}
          >
            {updating ? (
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
                Updating...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Update SLA
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

export default EditSLAModal;
