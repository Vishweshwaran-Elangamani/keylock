import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../../../styles/performancemanagement/components/ViewFormDetailsModal.css";
 
function ViewFormDetailsModal({ formDetails, onClose }) {
  const navigate = useNavigate();
 
  if (!formDetails) return null;
 
  return (
    <>
      <div className="view-form-backdrop" onClick={onClose} />
     
      <div className="view-form-container" onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <div className="view-form-header">
          <div className="header-title">
            <i className="bi bi-file-earmark-text-fill"></i>
            Form Details
          </div>
          <button
            className="header-close"
            onClick={onClose}
            onMouseEnter={e => e.currentTarget.classList.add('hover')}
            onMouseLeave={e => e.currentTarget.classList.remove('hover')}
          >
            ×
          </button>
        </div>
 
        <div className="view-form-body">
          {/* Basic Info */}
          <div className="basic-section">
            <h4 className="section-title">
              <i className="bi bi-info-circle-fill"></i>
              Basic Information
            </h4>
            <div className="info-grid">
              <div className="info-item">
                <div className="item-icon">
                  <i className="bi bi-file-text"></i>
                </div>
                <div className="item-content">
                  <span className="item-label">Form Name</span>
                  <span className="item-value">{formDetails.name}</span>
                </div>
              </div>
 
              <div className="info-item">
                <div className="item-icon">
                  <i className="bi bi-tag-fill"></i>
                </div>
                <div className="item-content">
                  <span className="item-label">Type</span>
                  <span className="type-tag">{formDetails.type}</span>
                </div>
              </div>
 
              <div className="info-item">
                <div className="item-icon">
                  <i className="bi bi-briefcase-fill"></i>
                </div>
                <div className="item-content">
                  <span className="item-label">Category</span>
                  <span className="item-value">{formDetails.deliveryEnablement || "N/A"}</span>
                </div>
              </div>
 
              <div className="info-item total-item">
                <div className="item-icon">
                  <i className="bi bi-list-check"></i>
                </div>
                <div className="item-content">
                  <span className="item-label">Total Competencies</span>
                  <span className="total-number">{formDetails.competencies?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
 
          {/* Table Section */}
          {formDetails.competencies?.length > 0 && (
            <div className="table-section">
              <h4 className="section-title">
                <i className="bi bi-grid-3x3-gap-fill"></i>
                Competencies Breakdown
              </h4>
              <div className="table-wrapper">
                <table className="competencies-table">
                  <thead>
                    <tr>
                      <th className="col-sno">S.NO</th>
                      <th className="col-name">Competency Name</th>
                      <th className="col-desc">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formDetails.competencies.map((comp, index) => (
                      <tr
                        className="table-row"
                        key={comp.id || index}
                        onMouseEnter={e => e.currentTarget.classList.add('hover')}
                        onMouseLeave={e => e.currentTarget.classList.remove('hover')}
                      >
                        <td className="sno-td">
                          <span className="sno-circle">
                            {comp.displayOrder || (index + 1)}
                          </span>
                        </td>
                        <td className="name-td">
                          <div className="name-wrapper">
                            <i className="bi bi-award-fill"></i>
                            <strong>{comp.name}</strong>
                          </div>
                        </td>
                        <td className="desc-td">
                          {comp.description || (
                            <span className="no-desc">
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
            <div className="no-data">
              <i className="bi bi-inbox"></i>
              <p>No competencies defined for this form</p>
            </div>
          )}
        </div>
 
        {/* Footer */}
        <div className="form-footer">
          <button
            className="footer-button close-button"
            onClick={onClose}
            onMouseEnter={e => e.currentTarget.classList.add('hover')}
            onMouseLeave={e => e.currentTarget.classList.remove('hover')}
          >
            Close
          </button>
          <button
            className="footer-button edit-button"
            onClick={() => {
              onClose();
              navigate(`/hr/dashboard/performance/create/${formDetails.formId}`);
            }}
            onMouseEnter={e => e.currentTarget.classList.add('hover')}
            onMouseLeave={e => e.currentTarget.classList.remove('hover')}
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
 
 