import React, { useState } from "react";
import { X, Send, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import slaService from "../../services/sla/slaService";

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
        escalationLevel: "L1", // Always L1
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

  // Check if form is valid
  const isValid = formData.reason && formData.description.trim().length >= 10;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content border-0 shadow-lg"
          style={{ borderRadius: "12px" }}
        >
          {/* Header */}
          <div
            className="modal-header border-0 px-4 py-3"
            style={{ backgroundColor: "#FEF3C7" }}
          >
            <div className="d-flex align-items-center gap-2">
              <AlertCircle size={20} color="#E2B93B" />
              <h6 className="mb-0 fw-bold">Escalate to Manager?</h6>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            />
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4 py-3">
              {error && (
                <div
                  className="alert alert-danger alert-sm mb-3 py-2"
                  style={{ fontSize: "0.85rem", borderRadius: "6px" }}
                >
                  {error}
                </div>
              )}

              {/* SLA Info */}
              <div
                className="mb-3 p-2"
                style={{
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                }}
              >
                <small className="text-muted d-block">SLA Type</small>
                <strong>{sla?.slatype || "N/A"}</strong>
                <small className="text-danger d-block mt-1">
                  Deadline: {formatDate(sla?.deadline)}
                </small>
              </div>

              {/* Reason */}
              <div className="mb-3">
                <label className="form-label small fw-bold mb-2">
                  Reason *
                </label>
                <select
                  className="form-select form-select-sm"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  disabled={loading}
                  style={{ borderRadius: "6px", fontSize: "0.85rem" }}
                  required
                >
                  <option value="">-- Select --</option>
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="form-label small fw-bold mb-2">
                  Details *
                </label>
                <textarea
                  className="form-control form-control-sm"
                  rows="4"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Explain the issue..."
                  disabled={loading}
                  maxLength={500}
                  required
                  style={{
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    resize: "none",
                  }}
                />
                <div className="d-flex justify-content-between align-items-center mt-1">
                  <small className="text-muted">Min 10 characters</small>
                  <small
                    className={
                      formData.description.length >= 10
                        ? "text-success fw-bold"
                        : "text-muted"
                    }
                  >
                    {formData.description.length}/500
                  </small>
                </div>
              </div>

              {/* Info */}
              <div
                className="alert alert-info alert-sm py-2 d-flex align-items-center gap-2"
                style={{ fontSize: "0.75rem", borderRadius: "6px" }}
              >
                <Info size={16} className="flex-shrink-0" />
                <span>
                  <strong>Level 1 (L1)</strong> escalation to your manager for
                  immediate review.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-top px-4 py-2 gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={onClose}
                disabled={loading}
                style={{ borderRadius: "6px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-warning d-flex align-items-center gap-2"
                disabled={loading || !isValid}
                style={{ borderRadius: "6px" }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Submit</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EscalationForm;
