import React from "react";

const ViewDetailsModal = ({
  showModal,
  setShowModal,
  detailsLoading,
  selectedNominationDetails,
  THEME,
}) => {
  if (!showModal) return null;

  return (
    <div
      className={`modal fade show`}
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ background: THEME.card }}>
          <div
            className="modal-header"
            style={{
              background: THEME.primary,
              color: "#fff",
              borderBottom: "none",
              paddingBottom: "24px",
            }}
          >
            <h5 className="modal-title" style={{ fontWeight: "600", fontSize: "18px" }}>
              Nomination Details
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => setShowModal(false)}
            ></button>
          </div>
          <div className="modal-body" style={{ paddingTop: "24px" }}>
            {detailsLoading ? (
              <div className="text-center">
                <div className="spinner-border" role="status" style={{ color: THEME.primary }}></div>
                <p className="text-muted mt-2">Loading details...</p>
              </div>
            ) : selectedNominationDetails ? (
              <div>
                {/* Basic Details */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: THEME.textLight,
                        marginBottom: "8px",
                      }}
                    >
                      NOMINEE NAME
                    </label>
                    <p style={{ fontSize: "14px", color: THEME.text, fontWeight: "500", margin: 0 }}>
                      {selectedNominationDetails.nomineeName ||
                        (selectedNominationDetails.nominee?.firstName
                          ? `${selectedNominationDetails.nominee.firstName} ${selectedNominationDetails.nominee.lastName}`
                          : "N/A")}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: THEME.textLight,
                        marginBottom: "8px",
                      }}
                    >
                      EMPLOYEE ID
                    </label>
                    <p style={{ fontSize: "14px", color: THEME.text, fontWeight: "500", margin: 0 }}>
                      {selectedNominationDetails.nomineeEmployeeId ||
                        selectedNominationDetails.nominee?.employeeId ||
                        "N/A"}
                    </p>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: THEME.textLight,
                        marginBottom: "8px",
                      }}
                    >
                      OPPORTUNITY
                    </label>
                    <p style={{ fontSize: "14px", color: THEME.text, fontWeight: "500", margin: 0 }}>
                      {selectedNominationDetails.opportunityName ||
                        selectedNominationDetails.opportunity?.opportunityName ||
                        "N/A"}
                    </p>
                  </div>
                </div>

                {/* Justification */}
                <div className="mb-4">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: THEME.textLight,
                      marginBottom: "8px",
                      display: "block",
                    }}
                  >
                    JUSTIFICATION
                  </label>
                  <div
                    style={{
                      background: THEME.background,
                      padding: "12px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: THEME.text,
                      minHeight: "80px",
                    }}
                  >
                    {selectedNominationDetails.justification || "No justification provided"}
                  </div>
                </div>

                {/* Parameter Values Section */}
                {selectedNominationDetails.parameterValues &&
                  selectedNominationDetails.parameterValues.length > 0 && (
                    <div className="mb-4">
                      <label
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: THEME.textLight,
                          marginBottom: "12px",
                          display: "block",
                        }}
                      >
                        NOMINATION PARAMETERS
                      </label>
                      <div
                        style={{
                          background: THEME.background,
                          padding: "16px",
                          borderRadius: "6px",
                          border: `1px solid ${THEME.border}`,
                        }}
                      >
                        {selectedNominationDetails.parameterValues.map((param, index) => (
                          <div
                            key={param.parameterId || index}
                            style={{
                              marginBottom:
                                index < selectedNominationDetails.parameterValues.length - 1 ? "16px" : "0",
                              paddingBottom:
                                index < selectedNominationDetails.parameterValues.length - 1 ? "16px" : "0",
                              borderBottom:
                                index < selectedNominationDetails.parameterValues.length - 1
                                  ? `1px solid ${THEME.border}`
                                  : "none",
                            }}
                          >
                            <div className="row">
                              <div className="col-md-5">
                                <p
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: THEME.text,
                                    margin: 0,
                                  }}
                                >
                                  {param.parameterName}
                                  {param.isRequired && (
                                    <span style={{ color: THEME.danger, marginLeft: "4px" }}>*</span>
                                  )}
                                </p>
                                <p
                                  style={{
                                    fontSize: "11px",
                                    color: THEME.textLight,
                                    margin: "4px 0 0 0",
                                  }}
                                >
                                  Type: {param.parameterType}
                                </p>
                              </div>
                              <div className="col-md-7">
                                <div
                                  style={{
                                    background: THEME.card,
                                    padding: "8px 12px",
                                    borderRadius: "4px",
                                    border: `1px solid ${THEME.border}`,
                                  }}
                                >
                                  <p
                                    style={{
                                      fontSize: "14px",
                                      color: THEME.text,
                                      margin: 0,
                                      fontWeight: "500",
                                    }}
                                  >
                                    {param.parameterType === "Rating" && (
                                      <span>
                                        {"⭐".repeat(parseInt(param.parameterValue) || 0)}{" "}
                                        <span style={{ color: THEME.textLight }}>
                                          ({param.parameterValue}/5)
                                        </span>
                                      </span>
                                    )}
                                    {param.parameterType !== "Rating" && param.parameterValue}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Submission Details */}
                <div className="row">
                  <div className="col-md-6">
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: THEME.textLight,
                        marginBottom: "8px",
                      }}
                    >
                      SUBMITTED DATE
                    </label>
                    <p style={{ fontSize: "14px", color: THEME.text, fontWeight: "500", margin: 0 }}>
                      {selectedNominationDetails.submittedAt
                        ? new Date(selectedNominationDetails.submittedAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted">No details available</p>
            )}
          </div>
          <div className="modal-footer" style={{ borderTop: `1px solid ${THEME.border}` }}>
            <button
              type="button"
              className="btn"
              onClick={() => setShowModal(false)}
              style={{
                background: THEME.primary,
                color: "#fff",
                fontWeight: "600",
                border: "none",
              }}
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
