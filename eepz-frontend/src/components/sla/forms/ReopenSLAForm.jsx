import React, { useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import slaService from "../../../services/sla/slaService";
import "../../../styles/sla/components/ReopenSLAForm.css";

const ReopenSLAForm = ({ sla, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    extensionDays: 1,
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

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

  const currentDeadlineLabel = new Date(sla.deadline).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return (
    <div
      className="rsf-scope rsf-backdrop"
      onClick={!loading ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div className="rsf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rsf-header">
          <h5 className="rsf-title">Reopen SLA (1 Day Extension)</h5>

          <button
            type="button"
            className="rsf-close-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="rsf-body">
          {error && (
            <div className="rsf-error-alert">
              <AlertCircle size={20} className="rsf-error-icon" />
              <div className="rsf-error-text">{error}</div>

              <button
                type="button"
                className="rsf-error-close"
                onClick={() => setError(null)}
                aria-label="Dismiss error"
                title="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <form className="rsf-form" onSubmit={handleSubmit}>
            <div className="rsf-deadline-box">
              <div className="rsf-deadline-grid">
                <div className="rsf-deadline-col">
                  <small className="rsf-small-label">Current Deadline</small>
                  <strong className="rsf-deadline-value">
                    {currentDeadlineLabel}
                  </strong>
                </div>

                <div className="rsf-deadline-col">
                  <small className="rsf-small-label">
                    New Deadline (+1 Day)
                  </small>
                  <strong className="rsf-deadline-value rsf-deadline-value--new">
                    {calculateNewDeadline()}
                  </strong>
                </div>
              </div>
            </div>

            <div className="rsf-info-alert">
              <AlertCircle size={18} className="rsf-info-icon" />
              <p className="rsf-info-text">
                This SLA will be extended by <strong>1 day only</strong>
              </p>
            </div>

            <div className="rsf-field">
              <label className="rsf-label">
                Reason for Reopening <span className="rsf-required">*</span>
              </label>

              <textarea
                className="rsf-textarea"
                rows="4"
                placeholder="Explain why this SLA needs 1 more day..."
                value={formData.reason}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, reason: e.target.value }))
                }
                maxLength={500}
                disabled={loading}
                required
              />

              <div className="rsf-help-row">
                <small className="rsf-help-left">
                  Provide clear justification
                </small>
                <small className="rsf-help-right">
                  {formData.reason.length}/500
                </small>
              </div>
            </div>
          </form>
        </div>

        <div className="rsf-footer">
          <button
            type="button"
            className="rsf-btn rsf-btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="rsf-btn rsf-btn-submit"
            onClick={handleSubmit}
            disabled={loading || !formData.reason.trim()}
          >
            {loading ? (
              <>
                <span className="rsf-spinner" />
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
    </div>
  );
};

export default ReopenSLAForm;
