import React, { useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import slaService from "../../../services/sla/slaService";
import "../../../styles/sla/EscalationForm.css";

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
      const response = await slaService.submitEscalation(escalationData);

      if (response.success) {
        toast.success("Escalation submitted successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error("Escalation failed");
        setError(response.message);
      }
    } catch (err) {
      toast.error("Error submitting escalation");
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

  const isValid = formData.reason && formData.description.trim().length >= 10;

  return (
    <>
      <div
        className="esc-modal-backdrop"
        onClick={() => !loading && onClose()}
      />
      <div className="esc-modal-wrapper">
        <div className="esc-modal-container">
          <div className="esc-modal-header">
            <h3 className="esc-modal-title">Escalate SLA</h3>
            <button
              type="button"
              className="esc-modal-close-btn"
              onClick={onClose}
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>

          <div className="esc-modal-body">
            {error && (
              <div className="esc-error-alert">
                <AlertCircle size={18} />
                <div>
                  <p>{error}</p>
                </div>
                <button onClick={() => setError(null)} className="esc-error-close">
                  <X size={16} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="esc-sla-info">
                <div className="esc-info-row">
                  <span className="esc-info-label">SLA Type:</span>
                  <span className="esc-info-value">{sla?.slatype || "N/A"}</span>
                </div>
                <div className="esc-info-row">
                  <span className="esc-info-label">Employee:</span>
                  <span className="esc-info-value">{sla?.employeeName || "N/A"}</span>
                </div>
                <div className="esc-info-row">
                  <span className="esc-info-label">Deadline:</span>
                  <span className="esc-info-value esc-deadline">{formatDate(sla?.deadline)}</span>
                </div>
              </div>

              <div className="esc-form-group">
                <label className="esc-form-label">
                  Reason <span className="esc-required">*</span>
                </label>
                <select
                  className="esc-form-select"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  disabled={loading}
                  required
                >
                  <option value="">-- Select Reason --</option>
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="esc-form-group">
                <label className="esc-form-label">
                  Description <span className="esc-required">*</span>
                </label>
                <textarea
                  className="esc-form-textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Provide detailed context..."
                  disabled={loading}
                  maxLength={500}
                  required
                />
                <small className="esc-char-count">
                  {formData.description.length}/500
                </small>
              </div>
            </form>
          </div>

          <div className="esc-modal-footer">
            <button
              type="button"
              className="esc-btn esc-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="esc-btn esc-btn-primary"
              disabled={loading || !isValid}
            >
              {loading ? (
                <>
                  <span className="esc-spinner" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Escalate to Manager
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EscalationForm;
