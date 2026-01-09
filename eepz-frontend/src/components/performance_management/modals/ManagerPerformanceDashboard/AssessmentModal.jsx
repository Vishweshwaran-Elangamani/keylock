import React from "react";
import { RatingDropdown } from "../../../../pages/performancemanagement/manager/ManagerDashboardUtils";
import logoImage from "../../../../assets/logodark.png";

export default function AssessmentModal({
  showModal,
  setShowModal,
  modalMode,
  currentAssignment,
  assessmentData,
  submitting,
  updateAssessmentData,
  handleSubmitAssessment,
}) {
  return (
    <div className="manevap-modal-overlay" onClick={() => setShowModal(false)}>
      <div
        className="manevap-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="manevap-form-header-strict">
          <div className="manevap-header-inner">
            <div className="manevap-logo-section">
              <img
                src={logoImage}
                alt="EEPZ Logo"
                className="manevap-modal-logo"
              />
              <div className="manevap-logo-subtitle">MANAGER FORM</div>
            </div>

            <div className="manevap-title-section">
              <div className="manevap-title-main">MANAGER FORM</div>
              <div className="manevap-title-sub">
                {currentAssignment?.formName || ""}
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="manevap-close-btn"
              aria-label="Close modal"
            >
              ×
            </button>
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
              <div className="manevap-strict-form-wrapper">
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
                        <td className="manevap-cell-bold">
                          {item.competencyName}
                        </td>
                        <td>{item.competencyDescription || ""}</td>
                        <td>
                          {modalMode === "view" ? (
                            <div className="manevap-modal-cell-view">
                              {item.rating ? `${item.rating} / 5` : "-"}
                            </div>
                          ) : (
                            <RatingDropdown
                              value={item.rating || ""}
                              onChange={(val) =>
                                updateAssessmentData(
                                  item.competencyId,
                                  "rating",
                                  val
                                )
                              }
                            />
                          )}
                        </td>
                        <td>
                          {modalMode === "view" ? (
                            <div className="manevap-modal-cell-view-comment">
                              {item.comments || "-"}
                            </div>
                          ) : (
                            <textarea
                              className="manevap-modal-cell-textarea"
                              value={item.comments}
                              onChange={(e) =>
                                updateAssessmentData(
                                  item.competencyId,
                                  "comments",
                                  e.target.value
                                )
                              }
                              placeholder="Enter your comments here..."
                              rows="3"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="manevap-modal-actions">
              <button
                onClick={() => setShowModal(false)}
                className="manevap-btn-close"
              >
                <i className="bi bi-x-lg"></i> Cancel
              </button>
              {modalMode === "submit" && (
                <button
                  onClick={handleSubmitAssessment}
                  disabled={submitting}
                  className={`manevap-btn-submit-form ${
                    submitting ? "disabled" : ""
                  }`}
                >
                  <i className="bi bi-check-lg"></i>
                  {submitting ? "Submitting..." : "Submit Assessment"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
