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
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(39, 35, 92, 0.4)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 1050,
      }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-lg" style={{ marginTop: 36, marginBottom: 36, maxWidth: 700 }}>
        <div className="modal-content border-0 shadow-lg" style={{ background: THEME.card, borderRadius: 18 }}>
          {/* HEADER */}
          <div
  className="modal-header"
  style={{
    background: THEME.primary,
    color: "#fff",
    borderBottom: "none",
    padding: "24px 36px 15px 36px",
    alignItems: "center",
    minHeight: 60,
    display: "flex",
    justifyContent: "space-between"   // pushes title left, cross right
  }}
>
  <h5
    className="modal-title"
    style={{
      fontWeight: "700",
      fontSize: 21,
      color: "#fff",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }}
  >
    <i className="bi bi-pencil-square" style={{ fontSize: 18 }} title="Edit Details" />
    Nomination Details
  </h5>

  {/* Cross button on the right */}
  <button
    type="button"
    onClick={() => setShowModal(false)}   // closes the modal
    style={{
      background: "transparent",
      border: "none",
      color: "#fff",
      fontSize: 24,
      cursor: "pointer",
      lineHeight: 1
    }}
    aria-label="Close"
  >
    ×
  </button>
</div>

          {/* BODY */}
          <div className="modal-body" style={{ padding: "28px 38px 18px 38px" }}>
            {detailsLoading ? (
              <div className="text-center my-5">
                <div className="spinner-border" role="status" style={{ color: THEME.primary, width: 38, height: 38 }}></div>
                <p className="text-muted mt-3" style={{ fontSize: 16 }}>Loading details...</p>
              </div>
            ) : selectedNominationDetails ? (
              <div>
                {/* NOMINEE INFO */}
                <div
  style={{
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "16px 20px",
    marginBottom: "16px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    textAlign: "left"
  }}
>
  <div style={{ marginBottom: "12px" }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textLight, marginBottom: 3 }}>
      Nominee Name
    </div>
    <div style={{ fontSize: 16, color: THEME.text, fontWeight: 700 }}>
      {selectedNominationDetails.nomineeName ||
        (selectedNominationDetails.nominee?.firstName
          ? `${selectedNominationDetails.nominee.firstName} ${selectedNominationDetails.nominee.lastName}`
          : "N/A")}
    </div>
  </div>

  <div style={{ marginBottom: "12px" }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textLight, marginBottom: 3 }}>
      Employee ID
    </div>
    <div style={{ fontSize: 16, color: THEME.text, fontWeight: 700 }}>
      {selectedNominationDetails.nomineeEmployeeId ||
        selectedNominationDetails.nominee?.employeeId ||
        "N/A"}
    </div>
  </div>

  <div style={{ marginBottom: "12px" }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textLight, marginBottom: 3 }}>
      Opportunity
    </div>
    <div style={{ fontSize: 16, color: THEME.text, fontWeight: 700 }}>
      {selectedNominationDetails.opportunityName ||
        selectedNominationDetails.opportunity?.opportunityName ||
        "N/A"}
    </div>
  </div>

  <div>
    <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textLight, marginBottom: 3 }}>
      Submitted Date
    </div>
    <div style={{ fontSize: 15, color: THEME.text, fontWeight: 600 }}>
      {selectedNominationDetails.submittedAt
        ? new Date(selectedNominationDetails.submittedAt).toLocaleString()
        : "N/A"}
    </div>
  </div>
</div>
                
                {/* Divider */}
                <hr style={{ borderColor: "#e4e7eb", margin: "2px 0 22px 0" }} />

                {/* JUSTIFICATION */}
                <div className="mb-4">
                  <div style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: THEME.textLight,
                    marginBottom: 7,
                    textTransform: "uppercase",
                    letterSpacing: ".11em"
                  }}>
                    Justification
                  </div>
                  <div
                    style={{
                      background: THEME.background,
                      padding: 16,
                      borderRadius: 8,
                      fontSize: 15,
                      color: THEME.text,
                      minHeight: "54px",
                      fontWeight: 500,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.037)",
                      border: `1.3px solid ${THEME.border}22`,
                    }}
                  >
                    {selectedNominationDetails.justification || "No justification provided"}
                  </div>
                </div>
                {/* PARAMETERS */}
                {selectedNominationDetails.parameterValues &&
                  selectedNominationDetails.parameterValues.length > 0 && (
                    <div className="mb-3">
                      <div style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: THEME.textLight,
                        marginBottom: 7,
                        textTransform: "uppercase",
                        letterSpacing: ".11em"
                      }}>
                        Nomination Parameters
                      </div>
                      <div style={{
                        borderRadius: 7,
                        overflow: "hidden",
                        border: `1.3px solid ${THEME.border}19`,
                        background: "#fafbfc",
                        marginBottom: 2
                      }}>
                        {selectedNominationDetails.parameterValues.map((param, index) => (
                          <div
                            key={param.parameterId || index}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              padding: "11px 13px",
                              borderBottom:
                                index < selectedNominationDetails.parameterValues.length - 1
                                  ? `1px solid #e3e9ef`
                                  : "none",
                            }}
                          >
                            <div style={{ minWidth: 110, flex: "0 0 150px", marginTop: 2 }}>
                              <div style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: THEME.text,
                                marginBottom: 2
                              }}>
                                {param.parameterName}
                                {param.isRequired && (
                                  <span style={{ color: THEME.danger, marginLeft: 3 }}>*</span>
                                )}
                              </div>
                              <span style={{
                                display: "inline-block",
                                fontSize: 11.2,
                                color: THEME.textLight,
                                margin: "3px 0 0 0"
                              }}>
                                Type: {param.parameterType}
                              </span>
                            </div>
                            <div style={{ flex: 1, paddingLeft: 10, marginTop: 2 }}>
                              <div
                                style={{
                                  background: "#fff",
                                  borderRadius: 3,
                                  border: `1px solid ${THEME.border}19`,
                                  padding: "7px 11px",
                                  fontSize: 15,
                                  fontWeight: 500,
                                  color: THEME.text,
                                  minHeight: 28
                                }}
                              >
                                {param.parameterType === "Rating" ? (
                                  <>
                                    {"⭐".repeat(parseInt(param.parameterValue) || 0)}
                                    <span style={{ color: THEME.textLight }}>&nbsp;({param.parameterValue}/5)</span>
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
              <p className="text-center text-muted" style={{ fontSize: 16, padding: "22px 0" }}>No details available</p>
            )}
          </div>
          {/* FOOTER */}
          <div className="modal-footer" style={{
            borderTop: `1px solid ${THEME.border}`,
            justifyContent: "flex-end",
            padding: "16px 38px",
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
          }}>
            <button
              type="button"
              className="btn"
              onClick={() => setShowModal(false)}
              style={{
                background: "#52525B",
                color: "#fff",
                fontWeight: "700",
                border: "none",
                borderRadius: 12,
                padding: "9px 32px",
                fontSize: 15.5,
                boxShadow: "0 2px 5px rgba(0,0,0,0.07)",
                letterSpacing: ".025em",
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
