import React, { useState } from "react";
import { X, Send, AlertCircle, AlertTriangle, FileText } from "lucide-react";
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
    <>
      <div
        className="escalation-modal-backdrop"
        onClick={() => !loading && onClose()}
      />
      <div className="escalation-modal-wrapper">
        <div className="escalation-modal-container">
          {/* Close Button */}
          <button
            type="button"
            className="escalation-modal-close-btn"
            onClick={onClose}
            disabled={loading}
          >
            <X size={20} />
          </button>

          {/* Header Section */}
          <div className="escalation-modal-header">
            <div className="escalation-modal-icon-wrapper">
              <AlertTriangle size={32} />
            </div>
            <h3 className="escalation-modal-title">Escalate SLA</h3>
            <p className="escalation-modal-description">
              Submit this SLA to your manager for immediate review and action.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="escalation-alert-error">
              <AlertCircle size={18} className="escalation-alert-icon" />
              <div className="escalation-alert-content">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {/* SLA Details Card */}
          <div className="escalation-sla-card">
            <div className="escalation-sla-card-header">
              <FileText size={18} />
              <span>SLA Details</span>
            </div>
            <div className="escalation-sla-card-body">
              <div className="escalation-sla-detail-row">
                <span className="escalation-sla-detail-label">SLA Type:</span>
                <span className="escalation-sla-detail-value">
                  {sla?.slatype || "N/A"}
                </span>
              </div>
              <div className="escalation-sla-detail-row">
                <span className="escalation-sla-detail-label">Employee:</span>
                <span className="escalation-sla-detail-value">
                  {sla?.employeeName || "N/A"}
                </span>
              </div>
              <div className="escalation-sla-detail-row">
                <span className="escalation-sla-detail-label">Deadline:</span>
                <span className="escalation-sla-detail-value escalation-deadline">
                  {formatDate(sla?.deadline)}
                </span>
              </div>
              <div className="escalation-sla-detail-row">
                <span className="escalation-sla-detail-label">
                  Escalation Level:
                </span>
                <span className="escalation-badge-l1">L1 - Manager</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="escalation-form">
            {/* Reason Field */}
            <div className="escalation-form-group">
              <label htmlFor="reason" className="escalation-form-label">
                Escalation Reason
                <span className="escalation-required">*</span>
              </label>
              <select
                id="reason"
                className="escalation-form-select"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                disabled={loading}
                required
              >
                <option value="">Select a reason</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Field */}
            <div className="escalation-form-group">
              <label htmlFor="description" className="escalation-form-label">
                Detailed Description
                <span className="escalation-required">*</span>
              </label>
              <textarea
                id="description"
                className="escalation-form-textarea"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                onKeyDown={handleKeyDown}
                placeholder="Provide detailed context for this escalation..."
                disabled={loading}
                maxLength={500}
                required
              />
              <div className="escalation-form-footer">
                <small className="escalation-form-hint">
                  💡 Press Ctrl+Enter to submit
                </small>
                <small className="escalation-form-counter">
                  {formData.description.length}/500
                </small>
              </div>
            </div>

            {/* Info Box */}
            <div className="escalation-info-box">
              <div className="escalation-info-icon">⚠️</div>
              <div className="escalation-info-content">
                <p className="escalation-info-title">Important</p>
                <p className="escalation-info-text">
                  This will notify your manager immediately. They will review and
                  take appropriate action on this SLA.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="escalation-modal-actions">
              <button
                type="button"
                className="escalation-btn escalation-btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="escalation-btn escalation-btn-primary"
                disabled={loading || !isValid}
              >
                {loading ? (
                  <>
                    <span className="escalation-spinner" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit Escalation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        /* ========================================
           ESCALATION MODAL - REDESIGNED
           ======================================== */

        .escalation-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 1050;
          animation: escalation-fade-in 0.2s ease;
        }

        @keyframes escalation-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .escalation-modal-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1055;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          overflow-y: auto;
          animation: escalation-slide-up 0.3s ease;
        }

        @keyframes escalation-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .escalation-modal-container {
          background: #FFFFFF;
          border-radius: 16px;
          max-width: 540px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          position: relative;
          padding: 2rem;
          text-align: left;
          margin: auto;
        }

        /* Close Button */
        .escalation-modal-close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: #F3F4F6;
          color: #6B7280;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 1;
        }

        .escalation-modal-close-btn:hover:not(:disabled) {
          background: #E5E7EB;
          color: #111827;
        }

        .escalation-modal-close-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Header */
        .escalation-modal-header {
          margin-bottom: 1.5rem;
        }

        .escalation-modal-icon-wrapper {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #D97706;
          margin-bottom: 1.25rem;
        }

        .escalation-modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.75rem;
          line-height: 1.2;
        }

        .escalation-modal-description {
          font-size: 0.9375rem;
          color: #6B7280;
          margin: 0;
          line-height: 1.5;
        }

        /* Error Alert */
        .escalation-alert-error {
          background: #FEF2F2;
          border: 1px solid #FEE2E2;
          border-radius: 10px;
          padding: 0.875rem;
          display: flex;
          align-items: start;
          gap: 0.625rem;
          margin-bottom: 1.25rem;
        }

        .escalation-alert-icon {
          flex-shrink: 0;
          color: #DC2626;
          margin-top: 2px;
        }

        .escalation-alert-content {
          flex: 1;
          font-size: 0.8125rem;
          color: #991B1B;
        }

        .escalation-alert-content strong {
          font-weight: 600;
        }

        /* SLA Details Card */
        .escalation-sla-card {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          overflow: hidden;
        }

        .escalation-sla-card-header {
          background: #27235C;
          color: #FFFFFF;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .escalation-sla-card-body {
          padding: 1rem;
        }

        .escalation-sla-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.625rem 0;
          border-bottom: 1px solid #E5E7EB;
        }

        .escalation-sla-detail-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .escalation-sla-detail-label {
          font-size: 0.8125rem;
          color: #6B7280;
          font-weight: 600;
        }

        .escalation-sla-detail-value {
          font-size: 0.875rem;
          color: #111827;
          font-weight: 600;
          text-align: right;
        }

        .escalation-deadline {
          color: #DC2626;
        }

        .escalation-badge-l1 {
          display: inline-flex;
          padding: 0.25rem 0.625rem;
          border-radius: 5px;
          font-size: 0.75rem;
          font-weight: 600;
          background: #DBEAFE;
          color: #1E40AF;
        }

        /* Form */
        .escalation-form {
          margin-top: 1.5rem;
        }

        .escalation-form-group {
          margin-bottom: 1.25rem;
        }

        .escalation-form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .escalation-required {
          color: #DC2626;
          margin-left: 0.25rem;
        }

        .escalation-form-select,
        .escalation-form-textarea {
          width: 100%;
          border-radius: 8px;
          border: 1.5px solid #E5E7EB;
          padding: 0.75rem;
          font-size: 0.875rem;
          color: #111827;
          outline: none;
          transition: all 0.2s;
          background: #FFFFFF;
        }

        .escalation-form-select:focus,
        .escalation-form-textarea:focus {
          border-color: #0F62FE;
          box-shadow: 0 0 0 3px rgba(15, 98, 254, 0.1);
        }

        .escalation-form-select:disabled,
        .escalation-form-textarea:disabled {
          background: #F9FAFB;
          color: #9CA3AF;
          cursor: not-allowed;
        }

        .escalation-form-select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          padding-right: 2.5rem;
        }

        .escalation-form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .escalation-form-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
        }

        .escalation-form-hint {
          color: #9CA3AF;
          font-size: 0.75rem;
          font-style: italic;
        }

        .escalation-form-counter {
          color: #9CA3AF;
          font-size: 0.75rem;
          font-weight: 500;
        }

        /* Info Box */
        .escalation-info-box {
          background: #FEF3C7;
          border: 1px solid #FDE68A;
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          gap: 0.75rem;
          align-items: start;
        }

        .escalation-info-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .escalation-info-content {
          flex: 1;
        }

        .escalation-info-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #92400E;
          margin: 0 0 0.375rem;
        }

        .escalation-info-text {
          font-size: 0.8125rem;
          color: #78350F;
          margin: 0;
          line-height: 1.5;
        }

        /* Action Buttons */
        .escalation-modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .escalation-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-size: 0.9375rem;
          font-weight: 600;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .escalation-btn-secondary {
          background: #FFFFFF;
          color: #6B7280;
          border: 1.5px solid #E5E7EB;
        }

        .escalation-btn-secondary:hover:not(:disabled) {
          background: #F9FAFB;
          border-color: #D1D5DB;
          color: #111827;
        }

        .escalation-btn-primary {
          background: linear-gradient(90deg, #F59E0B 0%, #D97706 100%);
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
        }

        .escalation-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }

        .escalation-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .escalation-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: escalation-spin 0.6s linear infinite;
        }

        @keyframes escalation-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Responsive */
        @media (max-width: 576px) {
          .escalation-modal-container {
            padding: 1.5rem;
          }

          .escalation-modal-actions {
            flex-direction: column;
          }

          .escalation-btn {
            width: 100%;
          }

          .escalation-sla-detail-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .escalation-sla-detail-value {
            text-align: left;
          }
        }
      `}</style>
    </>
  );
};

export default EscalationForm;
