import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";

function ViewFormDetailsModal({ formDetails, onClose }) {
  const navigate = useNavigate();

  if (!formDetails) return null;

  return (
    <div className="hrformlist-modal-overlay" onClick={onClose}>
      <div
        className="hrformlist-view-modal hrformlist-view-modal-large"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="hrformlist-view-modal-header">
          <div className="hrformlist-modal-title-section">
            <i className="bi bi-file-earmark-text-fill"></i>
            <div>
              <h3>Form Details</h3>
              <p className="hrformlist-modal-subtitle">
                Complete form information and competencies
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="hrformlist-view-modal-body">
          {/* Form Basic Info Section */}
          <div className="hrformlist-info-section">
            <h4 className="hrformlist-section-heading">
              <i className="bi bi-info-circle-fill"></i>
              Basic Information
            </h4>
            <div className="hrformlist-info-grid">
              <div className="hrformlist-info-card">
                <div className="hrformlist-info-icon">
                  <i className="bi bi-file-text"></i>
                </div>
                <div className="hrformlist-info-content">
                  <span className="hrformlist-info-label">Form Name</span>
                  <span className="hrformlist-info-value">{formDetails.name}</span>
                </div>
              </div>
              <div className="hrformlist-info-card">
                <div className="hrformlist-info-icon">
                  <i className="bi bi-tag-fill"></i>
                </div>
                <div className="hrformlist-info-content">
                  <span className="hrformlist-info-label">Type</span>
                  <span className="hrformlist-type-badge-modal">{formDetails.type}</span>
                </div>
              </div>
              <div className="hrformlist-info-card">
                <div className="hrformlist-info-icon">
                  <i className="bi bi-briefcase-fill"></i>
                </div>
                <div className="hrformlist-info-content">
                  <span className="hrformlist-info-label">Category</span>
                  <span className="hrformlist-info-value">
                    {formDetails.deliveryEnablement || "N/A"}
                  </span>
                </div>
              </div>
              <div className="hrformlist-info-card">
                <div className="hrformlist-info-icon">
                  <i className="bi bi-list-check"></i>
                </div>
                <div className="hrformlist-info-content">
                  <span className="hrformlist-info-label">Total Competencies</span>
                  <span className="hrformlist-info-value-highlight">
                    {formDetails.competencies?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Competencies Table Section */}
          {formDetails.competencies && formDetails.competencies.length > 0 && (
            <div className="hrformlist-competencies-section-modal">
              <h4 className="hrformlist-section-heading">
                <i className="bi bi-grid-3x3-gap-fill"></i>
                Competencies Breakdown
              </h4>
              <div className="hrformlist-table-container">
                <table className="hrformlist-competencies-table">
                  <thead>
                    <tr>
                      <th className="hrformlist-table-order">#</th>
                      <th className="hrformlist-table-name">Competency Name</th>
                      <th className="hrformlist-table-description">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formDetails.competencies.map((comp, index) => (
                      <tr key={index}>
                        <td className="hrformlist-table-order">
                          <span className="hrformlist-order-badge">
                            {comp.displayOrder || index + 1}
                          </span>
                        </td>
                        <td className="hrformlist-table-name">
                          <div className="hrformlist-comp-name-cell">
                            <i className="bi bi-award-fill"></i>
                            <strong>{comp.name}</strong>
                          </div>
                        </td>
                        <td className="hrformlist-table-description">
                          {comp.description || (
                            <span className="hrformlist-no-description">
                              <i className="bi bi-dash-circle"></i>
                              No description provided
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Competencies Message */}
          {(!formDetails.competencies || formDetails.competencies.length === 0) && (
            <div className="hrformlist-no-competencies">
              <i className="bi bi-inbox"></i>
              <p>No competencies defined for this form</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="hrformlist-view-modal-footer">
          <button
            className="hrformlist-btn-edit-form"
            onClick={() => {
              onClose();
              navigate(`/hr/dashboard/performance/create/${formDetails.formId}`);
            }}
          >
            <i className="bi bi-pencil-square"></i> Edit Form
          </button>
          <button className="hrformlist-btn-close-modal" onClick={onClose}>
            <i className="bi bi-x-circle"></i> Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewFormDetailsModal;
