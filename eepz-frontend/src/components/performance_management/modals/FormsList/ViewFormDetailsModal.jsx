import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../../../styles/performancemanagement/hr/ViewFormDetailsModal.css";
 
 
function ViewFormDetailsModal({ formDetails, onClose }) {
  const navigate = useNavigate();
 
  if (!formDetails) return null;
 
  return (
    <>
      <div className="vfdm-backdrop" onClick={onClose} />
     
      <div className="vfdm-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="vfdm-header">
          <div className="vfdm-title">
            <i className="bi bi-file-earmark-text-fill"></i>
            Form Details
          </div>
          <button
            className="vfdm-close-btn"
            onClick={onClose}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            ×
          </button>
        </div>
 
        <div className="vfdm-body">
          {/* Basic Info */}
          <div className="vfdm-basic-section">
            <h4 className="vfdm-section-title">
              <i className="bi bi-info-circle-fill"></i>
              Basic Information
            </h4>
            <div className="vfdm-grid">
              <div className="vfdm-info-card">
                <div className="vfdm-icon-box">
                  <i className="bi bi-file-text"></i>
                </div>
                <div className="vfdm-content">
                  <span className="vfdm-label">Form Name</span>
                  <span className="vfdm-value">{formDetails.name}</span>
                </div>
              </div>
 
              <div className="vfdm-info-card">
                <div className="vfdm-icon-box">
                  <i className="bi bi-tag-fill"></i>
                </div>
                <div className="vfdm-content">
                  <span className="vfdm-label">Type</span>
                  <span className="vfdm-type-badge">{formDetails.type}</span>
                </div>
              </div>
 
              <div className="vfdm-info-card">
                <div className="vfdm-icon-box">
                  <i className="bi bi-briefcase-fill"></i>
                </div>
                <div className="vfdm-content">
                  <span className="vfdm-label">Category</span>
                  <span className="vfdm-value">{formDetails.deliveryEnablement || "N/A"}</span>
                </div>
              </div>
 
              <div className="vfdm-info-card">
                <div className="vfdm-icon-box">
                  <i className="bi bi-list-check"></i>
                </div>
                <div className="vfdm-content">
                  <span className="vfdm-label">Total Competencies</span>
                  <span className="vfdm-total-count">{formDetails.competencies?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
 
          {/* Competencies Table */}
          {formDetails.competencies && formDetails.competencies.length > 0 && (
            <div className="vfdm-table-section">
              <h4 className="vfdm-section-title">
                <i className="bi bi-grid-3x3-gap-fill"></i>
                Competencies Breakdown
              </h4>
              <div className="vfdm-table-container">
                <table className="vfdm-table">
                  <thead>
                    <tr className="vfdm-table-head">
                      <th className="vfdm-table-th-sno">S.NO</th>
                      <th className="vfdm-table-th-name">Competency Name</th>
                      <th className="vfdm-table-th-desc">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formDetails.competencies.map((comp, index) => (
                      <tr
                        key={index}
                        className="vfdm-table-row"
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                      >
                        <td className="vfdm-table-td vfdm-td-sno">
                          <span className="vfdm-serial-number">
                            {comp.displayOrder || index + 1}
                          </span>
                        </td>
                        <td className="vfdm-table-td vfdm-td-name">
                          <div className="vfdm-comp-container">
                            <i className="bi bi-award-fill vfdm-comp-icon"></i>
                            <strong className="vfdm-comp-name">{comp.name}</strong>
                          </div>
                        </td>
                        <td className="vfdm-table-td vfdm-td-desc">
                          {comp.description || (
                            <span className="vfdm-no-desc">
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
 
          {(!formDetails.competencies || formDetails.competencies.length === 0) && (
            <div className="vfdm-empty-state">
              <i className="bi bi-inbox vfdm-empty-icon"></i>
              <p className="vfdm-empty-text">No competencies defined for this form</p>
            </div>
          )}
        </div>
 
        {/* Footer */}
        <div className="vfdm-footer">
          <button
            className="vfdm-btn vfdm-close-btn"
            onClick={onClose}
            onMouseEnter={(e) => e.currentTarget.style.background = '#5a6268'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#6c757d'}
          >
            Close
          </button>
          <button
            className="vfdm-btn vfdm-edit-btn"
            onClick={() => {
              onClose();
              navigate(`/hr/dashboard/performance/create/${formDetails.formId}`);
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <i className="bi bi-pencil-square"></i>
            Edit Form
          </button>
        </div>
      </div>
    </>
  );
}
 
export default ViewFormDetailsModal;
 
 
 