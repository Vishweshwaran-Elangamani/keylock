import React from "react";
import "../../../../styles/performancemanagement/components/ViewDetailsModal.module.css";


const ViewDetailsModal = ({
  showModal,
  setShowModal,
  detailsLoading,
  selectedNominationDetails,
  THEME,
}) => {
  if (!showModal) return null;


  return (
    <div className="view-details-modal-overlay" tabIndex="-1">
      <div className="view-details-modal-dialog">
        <div
          className="view-details-modal-content"
          style={{ background: THEME.card }}
        >
         
          <div
            className="view-details-modal-header"
            style={{ background: THEME.primary }}
          >
            <h5 className="view-details-modal-title">
              Nomination Details
            </h5>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="view-details-modal-close-btn"
              aria-label="Close"
            >
              ×
            </button>
          </div>


          {/* Body - Scrollable */}
          <div className="view-details-modal-body">
            {detailsLoading ? (
              <div className="view-details-loading-container">
                <div
                  className="spinner-border view-details-spinner"
                  role="status"
                  style={{ color: THEME.primary }}
                ></div>
                <p className="view-details-loading-text">Loading details...</p>
              </div>
            ) : selectedNominationDetails ? (
              <div>
             
                <div className="view-details-info-card">
                  <div className="view-details-info-row">
                    <div
                      className="view-details-info-label"
                      style={{ color: THEME.textLight }}
                    >
                      Nominee Name
                    </div>
                    <div
                      className="view-details-info-value"
                      style={{ color: THEME.text }}
                    >
                      {selectedNominationDetails.nomineeName ||
                        (selectedNominationDetails.nominee?.firstName
                          ? `${selectedNominationDetails.nominee.firstName} ${selectedNominationDetails.nominee.lastName}`
                          : "N/A")}
                    </div>
                  </div>


                  <div className="view-details-info-row">
                    <div
                      className="view-details-info-label"
                      style={{ color: THEME.textLight }}
                    >
                      Employee ID
                    </div>
                    <div
                      className="view-details-info-value"
                      style={{ color: THEME.text }}
                    >
                      {selectedNominationDetails.nomineeEmployeeId ||
                        selectedNominationDetails.nominee?.employeeId ||
                        "N/A"}
                    </div>
                  </div>


                  <div className="view-details-info-row">
                    <div
                      className="view-details-info-label"
                      style={{ color: THEME.textLight }}
                    >
                      Opportunity
                    </div>
                    <div
                      className="view-details-info-value"
                      style={{ color: THEME.text }}
                    >
                      {selectedNominationDetails.opportunityName ||
                        selectedNominationDetails.opportunity?.opportunityName ||
                        "N/A"}
                    </div>
                  </div>


                  <div className="view-details-info-row">
                    <div
                      className="view-details-info-label"
                      style={{ color: THEME.textLight }}
                    >
                      Submitted Date
                    </div>
                    <div
                      className="view-details-info-value-medium"
                      style={{ color: THEME.text }}
                    >
                      {selectedNominationDetails.submittedAt
                        ? new Date(selectedNominationDetails.submittedAt).toLocaleString()
                        : "N/A"}
                    </div>
                  </div>
                </div>


                <hr className="view-details-divider" />

             
                <div className="view-details-section">
                  <div
                    className="view-details-section-title"
                    style={{ color: THEME.textLight }}
                  >
                    Justification
                  </div>
                  <div
                    className="view-details-justification-box"
                    style={{
                      background: THEME.background,
                      color: THEME.text,
                      border: `1.3px solid ${THEME.border}22`,
                    }}
                  >
                    {selectedNominationDetails.justification || "No justification provided"}
                  </div>
                </div>

             
                {selectedNominationDetails.parameterValues &&
                  selectedNominationDetails.parameterValues.length > 0 && (
                    <div className="view-details-section">
                      <div
                        className="view-details-section-title"
                        style={{ color: THEME.textLight }}
                      >
                        Nomination Parameters
                      </div>
                      <div
                        className="view-details-parameters-container"
                        style={{ border: `1.3px solid ${THEME.border}19` }}
                      >
                        {selectedNominationDetails.parameterValues.map((param, index) => (
                          <div
                            key={param.parameterId || index}
                            className={`view-details-parameter-row ${
                              index < selectedNominationDetails.parameterValues.length - 1
                                ? "has-border"
                                : ""
                            }`}
                          >
                            <div className="view-details-parameter-label-section">
                              <div
                                className="view-details-parameter-name"
                                style={{ color: THEME.text }}
                              >
                                {param.parameterName}
                                {param.isRequired && (
                                  <span className="view-details-parameter-required">*</span>
                                )}
                              </div>
                              <span
                                className="view-details-parameter-type"
                                style={{ color: THEME.textLight }}
                              >
                                Type: {param.parameterType}
                              </span>
                            </div>
                            <div className="view-details-parameter-value-section">
                              <div
                                className="view-details-parameter-value-box"
                                style={{
                                  border: `1px solid ${THEME.border}19`,
                                  color: THEME.text,
                                }}
                              >
                                {param.parameterType === "Rating" ? (
                                  <>
                                    {"⭐".repeat(parseInt(param.parameterValue) || 0)}
                                    <span
                                      className="view-details-rating-text"
                                      style={{ color: THEME.textLight }}
                                    >
                                      &nbsp;({param.parameterValue}/5)
                                    </span>
                                  </>
                                ) : (
                                  param.parameterValue
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <p className="view-details-no-data">No details available</p>
            )}
          </div>


          {/* Footer */}
          <div
            className="view-details-modal-footer"
          >
            <button
              type="button"
              className="view-details-btn-close"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default ViewDetailsModal;
