import { useState, useEffect } from "react";
import policyService from "../../../services/hr_operations/hr/policyService";
import "../../../styles/hr_operations/hr/PublishPolicyModal.css";

const PublishPolicyModal = ({
  show,
  policy,
  onHide,
  onPublish,
  publishing,
}) => {
  if (!show || !policy) return null;

  return (
    <>
      <div className="ppm-backdrop" onClick={onHide} />

      <div className="ppm-modal-container">
        <div className="ppm-modal-dialog">
          {/* HEADER */}
          <div className="ppm-modal-header">
            <div className="ppm-header-title">
              <i className="bi bi-send-fill"></i>
              Publish Policy
            </div>
            <button
              type="button"
              onClick={onHide}
              disabled={publishing}
              aria-label="Close"
              className="ppm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY */}
          <div className="ppm-modal-body">
            {/* Main Message */}
            <p className="ppm-main-message">
              You are about to publish the following policy:
            </p>

            {/* Policy Info Box */}
            <div className="ppm-policy-info-box">
              <div className="ppm-policy-content">
                <div>
                  <strong className="ppm-policy-name">
                    {policy.policyName}
                  </strong>
                </div>
                <div className="ppm-policy-category">
                  <i className="bi bi-tag ppm-category-icon"></i>
                  {policy.category || "General"}
                </div>
                {policy.description && (
                  <div className="ppm-policy-description">
                    {policy.description.substring(0, 100)}
                    {policy.description.length > 100 && "..."}
                  </div>
                )}
              </div>
            </div>

            {/* Info Message */}
            <p className="ppm-info-message">
              Once published, this policy will be visible to all employees.
            </p>

            {/* Success Info */}
            <div className="ppm-success-info">
              <i className="bi bi-info-circle ppm-success-icon"></i>
              <div>
                <strong className="ppm-success-note-label">Note:</strong>
                Employees will be able to view and acknowledge this policy after
                publishing.
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="ppm-modal-footer">
            <button
              type="button"
              onClick={onHide}
              disabled={publishing}
              className="ppm-btn-cancel"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onPublish}
              disabled={publishing}
              className="ppm-btn-publish"
            >
              {publishing ? (
                <>
                  <span className="ppm-spinner" />
                  Publishing...
                </>
              ) : (
                <>
                  <i className="bi bi-send-fill"></i>
                  Publish Policy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublishPolicyModal;
