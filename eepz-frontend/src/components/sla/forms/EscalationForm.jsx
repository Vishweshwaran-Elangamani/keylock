import React, { useState } from "react";
import { X, Send, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import slaService from "../../../services/sla/slaService";

const EscalationForm = ({ sla, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    reason: "",
    description: "",
    escalationLevel: "L1",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reasons = [
    "SLA Deadline Breach",
    "Performance Issue",
    "Process Violation",
    "Urgent Support Needed",
    "Other",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const escalationData = {
        slaid: sla.slaid,
        reason: formData.reason,
        description: formData.description,
        escalationLevel: "L1",
        escalatedToEmployeeId: sla.assignedToEmployeeId,
        submittedByEmployeeId: user.empId,
      };

      console.log("Escalation Data:", escalationData);
      const response = await slaService.submitEscalation(escalationData);

      if (response.success) {
        toast.success("Escalation submitted successfully!", {
          description: "Your manager will review this escalation.",
          duration: 4000,
        });
        onSuccess();
        onClose();
      } else {
        toast.error("Escalation Failed", {
          description: response.message || "Unable to submit escalation",
          duration: 5000,
        });
        setError(response.message);
      }
    } catch (err) {
      toast.error("Error", {
        description: err.message || "Failed to submit escalation",
        duration: 5000,
      });
      setError(err.message || "Failed to submit escalation");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle Ctrl+Enter shortcut
  const handleKeyDown = (e) => {
    if (
      e.ctrlKey &&
      e.key === "Enter" &&
      formData.reason &&
      formData.description.trim().length >= 10 &&
      !loading
    ) {
      handleSubmit(e);
    }
  };

  const isValid = formData.reason && formData.description.trim().length >= 10;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: "500px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content"
          style={{
            borderRadius: "16px",
            border: "none",
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
          }}
        >
          {/* Header - Dark Purple Theme */}
          <div
            style={{
              background: "#3E3A64",
              padding: "1.25rem 1.5rem",
              borderBottom: "none",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: "#fff" }}
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h5
                  className="mb-0 fw-bold"
                  style={{
                    color: "#fff",
                    fontSize: "1rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Add Escalation
                </h5>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  opacity: 0.8,
                  transition: "opacity 0.2s",
                  borderRadius: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0.8";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <X size={20} color="#fff" />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: "1.5rem" }}>
              {error && (
                <div
                  className="alert alert-danger d-flex align-items-start gap-2 mb-3"
                  style={{ borderRadius: "8px" }}
                >
                  <AlertCircle size={18} className="flex-shrink-0 mt-1" />
                  <small>{error}</small>
                </div>
              )}

              {/* Goal Section */}
              <div
                className="mb-3"
                style={{
                  background: "#F3F4F6",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#6B7280",
                    marginBottom: "0.25rem",
                    display: "block",
                  }}
                >
                  Goal:
                </label>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#1F2937",
                    fontWeight: 500,
                  }}
                >
                  {sla?.slatype || "N/A"}
                </div>
              </div>

              {/* Deadline */}
              <div className="mb-3">
                <small
                  style={{
                    fontSize: "0.813rem",
                    color: "#DC2626",
                    fontWeight: 500,
                  }}
                >
                  Deadline: {formatDate(sla?.deadline)}
                </small>
              </div>

              {/* Reason */}
              <div className="mb-3">
                <label
                  htmlFor="reason"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Reason <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <select
                  id="reason"
                  className="form-select"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  disabled={loading}
                  required
                  style={{
                    borderRadius: "8px",
                    border: "1px solid #D1D5DB",
                    padding: "0.625rem 0.875rem",
                    fontSize: "0.875rem",
                    color: formData.reason ? "#1F2937" : "#9CA3AF",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#3B82F6";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(59,130,246,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#D1D5DB";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option value="">-- Select --</option>
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Your Comment */}
              <div className="mb-2">
                <label
                  htmlFor="description"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Your Comment <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <textarea
                  id="description"
                  className="form-control"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="Write your comment here..."
                  disabled={loading}
                  maxLength={500}
                  required
                  style={{
                    borderRadius: "8px",
                    border: "1px solid #D1D5DB",
                    padding: "0.625rem 0.875rem",
                    fontSize: "0.875rem",
                    resize: "none",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#3B82F6";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(59,130,246,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#D1D5DB";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <div className="d-flex justify-content-between align-items-center mt-1">
                  <small
                    style={{
                      color: "#9CA3AF",
                      fontSize: "0.75rem",
                      fontStyle: "italic",
                    }}
                  >
                    ⓘ Press Ctrl+Enter to submit quickly
                  </small>
                  <small
                    style={{
                      color: "#9CA3AF",
                      fontSize: "0.75rem",
                    }}
                  >
                    {formData.description.length}/500
                  </small>
                </div>
              </div>

              {/* Info Alert */}
              <div
                style={{
                  background: "#DBEAFE",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  marginTop: "1rem",
                  display: "flex",
                  alignItems: "start",
                  gap: "0.5rem",
                  border: "1px solid #BFDBFE",
                }}
              >
                <Info
                  size={16}
                  color="#2563EB"
                  style={{ marginTop: "2px", flexShrink: 0 }}
                />
                <small
                  style={{
                    color: "#1E40AF",
                    fontSize: "0.813rem",
                    lineHeight: "1.4",
                  }}
                >
                  <strong>Level 1 (L1)</strong> escalation to your manager for
                  immediate review.
                </small>
              </div>

              {/* Buttons */}
              <div
                style={{
                  marginTop: "1.25rem",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                }}
              >
                <button
                  type="button"
                  className="btn"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    borderRadius: "8px",
                    padding: "0.5rem 1.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    border: "1px solid #D1D5DB",
                    background: "#fff",
                    color: "#6B7280",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.borderColor = "#9CA3AF";
                      e.currentTarget.style.color = "#374151";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.borderColor = "#D1D5DB";
                      e.currentTarget.style.color = "#6B7280";
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn d-flex align-items-center gap-2"
                  disabled={loading || !isValid}
                  style={{
                    borderRadius: "8px",
                    padding: "0.5rem 1.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    background: "#C2185B",
                    color: "#fff",
                    border: "none",
                    transition: "all 0.2s",
                    opacity: loading || !isValid ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && isValid) {
                      e.currentTarget.style.background = "#AD1457";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(194,24,91,0.25)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && isValid) {
                      e.currentTarget.style.background = "#C2185B";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Post Escalation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EscalationForm;
