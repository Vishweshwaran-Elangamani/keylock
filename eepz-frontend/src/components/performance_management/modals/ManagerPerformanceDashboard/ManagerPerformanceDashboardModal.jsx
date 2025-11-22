import React from "react";
import logoImage from "../../../../assets/logodark.png"
import "../../../../styles/performancemanagement/manager/ManagerPerformanceDashboard.css"
 
const ManagerPerformanceDashboardModal = ({
  showModal,
  setShowModal,
  currentAssignment,
  assessmentData,
  modalMode,
  submitting,
  handleSubmitAssessment,
  updateAssessmentData,
}) => {
  if (!showModal || !currentAssignment) return null;
 
  return (
    <div className="manevap-modal-overlay" onClick={() => setShowModal(false)}>
      <div className="manevap-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="manevap-form-header-strict">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src={logoImage} alt="EEPZ Logo" className="manevap-modal-logo" />
            <div>
              <div className="manevap-form-logo-label">APPRAISAL FORM</div>
              <div className="manevap-form-title-main">Appraisal Form</div>
              <div className="manevap-form-title-small">{currentAssignment?.formName || ""}</div>
            </div>
          </div>
        </div>
 
        {submitting && modalMode === "view" ? (
          <div className="manevap-modal-loading">
            <div className="spinner-border"></div>
            <p>Loading assessment...</p>
          </div>
        ) : (
          <>
            <div className="manevap-strict-form-body">
              <table className="manevap-strict-table">
                <thead>
                  <tr>
                    <th>COMPETENCY NAME</th>
                    <th>DESCRIPTION</th>
                    <th>RATING</th>
                    <th>COMMENTS</th>
                  </tr>
                </thead>
                <tbody>
                  {assessmentData.map((item, idx) => (
                    <tr key={item.competencyId || idx}>
                      <td className="manevap-cell-bold">{item.competencyName}</td>
                      <td>{item.competencyDescription || ""}</td>
                      <td>
                        {modalMode === "view" ? (
                          <div className="manevap-modal-cell-view">
                            {item.rating ? `${item.rating} / 5` : '-'}
                          </div>
                        ) : (
                          <select
                            value={item.rating}
                            onChange={e =>
                              updateAssessmentData(item.competencyId, "rating", e.target.value)
                            }
                            className="manevap-modal-cell-input"
                          >
                            <option value="">-</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                          </select>
                        )}
                      </td>
                      <td>
                        {modalMode === "view" ? (
                          <div className="manevap-modal-cell-view">{item.comments || "-"}</div>
                        ) : (
                          <input
                            className="manevap-modal-cell-input"
                            type="text"
                            value={item.comments}
                            onChange={e =>
                              updateAssessmentData(item.competencyId, "comments", e.target.value)
                            }
                            placeholder="-"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="manevap-modal-actions">
              <button onClick={() => setShowModal(false)} className="manevap-btn-close">
                Cancel
              </button>
              {modalMode === "submit" && (
                <button
                  onClick={handleSubmitAssessment}
                  disabled={submitting}
                  className="manevap-btn-submit-form"
                >
                  {submitting ? "Submitting..." : "Submit Assessment"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
 
export default ManagerPerformanceDashboardModal;
 
 