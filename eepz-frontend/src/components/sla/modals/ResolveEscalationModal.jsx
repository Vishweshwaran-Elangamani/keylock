import React, { useState } from "react";
import { CheckCircle, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import "../../../styles/sla/modals/ResolveEscalationModal.css";

const ResolveEscalationModal = ({ escalation, onClose, onResolve }) => {
  const [resolutionComments, setResolutionComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResolve = async () => {
    if (!resolutionComments.trim()) {
      toast.warning("Resolution comments required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onResolve({
        escalationId: escalation.escalationId,
        resolutionComments: resolutionComments.trim(),
        escalationStatus: "Resolved",
      });

      toast.success("Escalation resolved successfully");
      onClose();
    } catch (err) {
      const errorMessage = err.message || "Failed to resolve escalation";
      setError(errorMessage);
      toast.error("Failed to resolve escalation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="resolve-modal-backdrop"
        onClick={() => !loading && onClose()}
      />
      <div className="resolve-modal-wrapper">
        <div className="resolve-modal-container">
          <div className="resolve-modal-header">
            <h3 className="resolve-modal-title">Resolve Escalation</h3>
            <button className="resolve-modal-close-btn" onClick={onClose} disabled={loading}>
              <X size={20} />
            </button>
          </div>

          <div className="resolve-modal-body">
            {error && (
              <div className="resolve-error-alert">
                <AlertCircle size={18} />
                <div>
                  <p>{error}</p>
                </div>
                <button onClick={() => setError(null)} className="resolve-error-close">
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="resolve-info-box">
              <div className="resolve-info-row">
                <span className="resolve-info-label">Employee:</span>
                <span className="resolve-info-value">{escalation.employeeName}</span>
              </div>

              <div className="resolve-info-row">
                <span className="resolve-info-label">Reason:</span>
                <span className="resolve-info-value">{escalation.reason}</span>
              </div>
            </div>

            <div className="resolve-form-group">
              <label className="resolve-form-label"> Resolution Comments
                <span className="resolve-required">*</span>
              </label>
              <textarea className="resolve-textarea"
                rows="3" value={resolutionComments} onChange={(e) => setResolutionComments(e.target.value)}
                placeholder="Provide resolution details..." disabled={loading} maxLength={500}/>
              <small className="resolve-char-count">
                {resolutionComments.length}/500
              </small>
            </div>
          </div>

          <div className="resolve-modal-footer">
            <button className="resolve-btn resolve-btn-secondary"
              onClick={onClose} disabled={loading}> Cancel </button>
           
            <button className="resolve-btn resolve-btn-primary"
              onClick={handleResolve} disabled={loading || !resolutionComments.trim()}>
              {loading ? (
                <>
                  <span className="resolve-spinner" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Resolve Escalation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResolveEscalationModal;
