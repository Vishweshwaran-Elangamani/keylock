import React from "react";
import employeePolicyService from "../../../services/hr_operations/employee/employeePolicyService";
import "../../../styles/hr_operations/employee/PolicyDetailModal.css";
const PolicyDetailModal = ({ show, policy, onClose }) => {
  if (!show || !policy) return null;
  const handleViewDocument = (documentUrl) => {
    const fullUrl = employeePolicyService.getFullDocumentUrl(documentUrl);
    window.open(fullUrl, "_blank");
  };
  return (
    <>
      <div className="pdm-backdrop" onClick={onClose} />
      <div className="pdm-modal-container">
        <div className="pdm-modal-dialog">
          {/* HEADER -  */}
          <div className="pdm-modal-header">
            <div className="pdm-header-title">
              <i className="bi bi-shield-check"></i>
              {policy.policyName}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="pdm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          {/* BODY - Scrollable */}
          <div className="pdm-modal-body">
            {/* Category and Status Badges */}
            <div className="pdm-badges-container">
              <span className="pdm-badge pdm-badge-category">
                <i className="bi bi-folder-fill pdm-badge-icon"></i>
                {policy.category}
              </span>
              <span className="pdm-badge pdm-badge-published">
                <i className="bi bi-check-circle-fill pdm-badge-icon"></i>
                Published
              </span>
            </div>
            {/* Description Section */}
            <div className="pdm-section">
              <h6 className="pdm-section-heading">
                <i className="bi bi-file-text pdm-section-icon"></i>
                Description
              </h6>
              <p className="pdm-description-text">{policy.description}</p>
            </div>
            {/* Compliance Guidance Section */}
            {policy.complianceGuidance && (
              <div className="pdm-section">
                <h6 className="pdm-section-heading">
                  <i className="bi bi-shield-check pdm-section-icon"></i>
                  Compliance Guidance
                </h6>
                <p className="pdm-compliance-text">
                  {policy.complianceGuidance}
                </p>
              </div>
            )}
            {/* Attached Document Section */}
            {policy.documentUrl && (
              <div className="pdm-document-section">
                <h6 className="pdm-document-heading">
                  <i className="bi bi-file-earmark-pdf-fill pdm-document-icon"></i>
                  Attached Document
                </h6>
                <div className="pdm-document-card">
                  <div className="pdm-document-info">
                    <i className="bi bi-file-earmark-pdf pdm-file-icon"></i>
                    <div>
                      <strong className="pdm-document-name">
                        {policy.documentName}
                      </strong>
                      {policy.documentSizeFormatted && (
                        <small className="pdm-document-size">
                          Size: {policy.documentSizeFormatted}
                        </small>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleViewDocument(policy.documentUrl)}
                    className="pdm-download-button"
                  >
                    <i className="bi bi-download"></i>
                    View/Download
                  </button>
                </div>
              </div>
            )}
            {/* Published Date Info */}
            <div className="pdm-published-info">
              <i className="bi bi-calendar-event pdm-calendar-icon"></i>
              <div>
                <small className="pdm-published-label">Published On</small>
                <strong className="pdm-published-date">
                  {new Date(policy.publishedAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </strong>
              </div>
            </div>
          </div>
          {/* FOOTER -  */}
          <div className="pdm-modal-footer">
            <button type="button" onClick={onClose} className="pdm-btn-close">
              <i className="bi bi-x-circle"></i>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default PolicyDetailModal;
