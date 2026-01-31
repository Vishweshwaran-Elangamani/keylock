import React, { useMemo, useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import slaService from "../../../services/sla/slaService";
import CustomDropdown from "../../../components/project-management/common/CustomDropdown";
import "../../../styles/sla/components/EscalationForm.css";

const EscalationForm = ({ sla, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    reason: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reasonOptions = useMemo(
    () => [
      { value: "SLA Deadline Breach", label: "SLA Deadline Breach" },
      { value: "Performance Issue", label: "Performance Issue" },
      { value: "Process Violation", label: "Process Violation" },
      { value: "Urgent Support Needed", label: "Urgent Support Needed" },
      { value: "Other", label: "Other" },
    ],
    []
  );

  const handleDropdownChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return;

    if (!formData.reason) {
      toast.error("Please select a reason");
      return;
    }

    if (formData.description.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    if (!sla?.slaid) {
      toast.error("Invalid SLA data");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const escalationPayload = {
        reason: formData.reason,
        description: formData.description,
        escalatedToEmployeeId: sla.assignedToEmployeeId,
      };

      const response = await slaService.submitEscalation(
        sla.slaid,
        escalationPayload,
        "normal"
      );

      if (response.success) {
        toast.success("Escalation submitted successfully!");
        onSuccess();
        onClose();
      } else {
        setError(response.message);
        toast.error(response.message || "Escalation failed");
      }
    } catch (err) {
      console.error("Escalation error:", err);
      setError(err.message || "Failed to submit escalation");
      toast.error("Error submitting escalation");
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

  const isValid =
    formData.reason && formData.description.trim().length >= 10 && !loading;

  return (
    <>
      <div className="esc-modal-backdrop" onClick={() => !loading && onClose()} />
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
                <div><p>{error}</p></div>
                <button onClick={() => setError(null)} className="esc-error-close" type="button">
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
                  <span className="esc-info-value esc-deadline">
                    {formatDate(sla?.deadline)}
                  </span>
                </div>
              </div>

              <div className="esc-form-group">
                <CustomDropdown
                  label={<span className="esc-dd-label">Reason <span className="esc-required">*</span></span>}
                  required
                  name="reason"
                  value={formData.reason}
                  options={reasonOptions}
                  placeholder="Select Reason"
                  disabled={loading}
                  onChange={handleDropdownChange}
                  className="esc-dd"
                />
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
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Provide detailed context..."
                  disabled={loading}
                  maxLength={500}
                  required
                />
                <small className="esc-char-count">{formData.description.length}/500</small>
              </div>
            </form>
          </div>

          <div className="esc-modal-footer">
            <button type="button" className="esc-btn esc-btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>

            <button onClick={handleSubmit} className="esc-btn esc-btn-primary" disabled={!isValid} type="button">
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
