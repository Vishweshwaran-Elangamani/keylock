import React from "react";
import "../../../styles/hr_operations/hr/UnpublishPolicyModal.css";

const UnpublishPolicyModal = ({
  show,
  policy,
  onHide,
  onUnpublish,
  unpublishing,
}) => {
  if (!show || !policy) return null;

  return (
    <>
      <div className="upm-backdrop" onClick={onHide} />

      <div className="upm-modal-container">
        <div className="upm-modal-dialog">
          {/* HEADER */}
          <div className="upm-modal-header">
            <div className="upm-header-title">
              <i className="bi bi-eye-slash-fill"></i>
              Unpublish Policy
            </div>
            <button
              type="button"
              onClick={onHide}
              disabled={unpublishing}
              aria-label="Close"
              className="upm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY */}
          <div className="upm-modal-body">
            {/* Main Message */}
            <p className="upm-main-message">
              You are about to unpublish the following policy:
            </p>

            {/* Policy Info Box */}
            <div className="upm-policy-info-box">
              <div className="upm-policy-content">
                <div>
                  <strong className="upm-policy-name">
                    {policy.policyName}
                  </strong>
                </div>
                <div className="upm-policy-category">
                  <i className="bi bi-tag upm-category-icon"></i>
                  {policy.category || "General"}
                </div>
                {policy.description && (
                  <div className="upm-policy-description">
                    {policy.description.substring(0, 100)}
                    {policy.description.length > 100 && "..."}
                  </div>
                )}
              </div>
            </div>

            {/* Info Message */}
            <p className="upm-info-message">
              This policy will be hidden from employees and moved to draft
              status.
            </p>

            {/* Warning Info */}
            <div className="upm-warning-info">
              <i className="bi bi-exclamation-triangle-fill upm-warning-icon"></i>
              <div>
                <strong className="upm-warning-note-label">Warning:</strong>
                Employees will no longer be able to view or acknowledge this
                policy.
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="upm-modal-footer">
            <button
              type="button"
              onClick={onHide}
              disabled={unpublishing}
              className="upm-btn-cancel"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onUnpublish}
              disabled={unpublishing}
              className="upm-btn-unpublish"
            >
              {unpublishing ? (
                <>
                  <span className="upm-spinner" />
                  Unpublishing...
                </>
              ) : (
                <>
                  <i className="bi bi-eye-slash-fill"></i>
                  Unpublish Policy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UnpublishPolicyModal;
