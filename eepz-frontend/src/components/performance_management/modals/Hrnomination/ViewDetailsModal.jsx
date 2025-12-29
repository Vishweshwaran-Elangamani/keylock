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
        backgroundColor: "rgba(39, 35, 92, 0.5)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 1050,
      }}
      tabIndex="-1"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowModal(false);
        }
      }}
    >
      <div 
        className="modal-dialog modal-lg" 
        style={{ 
          marginTop: 30, 
          marginBottom: 30, 
          maxWidth: 680 
        }}
      >
        <div 
          className="modal-content border-0" 
          style={{ 
            background: THEME.card, 
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
            boxShadow: "0 20px 60px rgba(39, 35, 92, 0.3)",
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div
            className="modal-header"
            style={{
              background: `linear-gradient(135deg, ${THEME.primary} 0%, #1e1a4d 100%)`,
              color: "#fff",
              borderBottom: "none",
              padding: "18px 28px",
              alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <h5
              className="modal-title"
              style={{
                fontWeight: "700",
                fontSize: 19,
                color: "#fff",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}
            >
              <i className="bi bi-file-earmark-text" style={{ fontSize: 20 }} />
              Nomination Details
            </h5>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                border: "none",
                color: "#fff",
                fontSize: 22,
                cursor: "pointer",
                lineHeight: 1,
                width: 32,
                height: 32,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div 
            className="modal-body" 
            style={{ 
              padding: "24px 28px",
              overflowY: "auto", 
              flex: 1,
              background: "#f8f9fc"
            }}
          >
            {detailsLoading ? (
              <div className="text-center my-4">
                <div 
                  className="spinner-border" 
                  role="status" 
                  style={{ color: THEME.primary, width: 40, height: 40 }}
                ></div>
                <p className="text-muted mt-3" style={{ fontSize: 14 }}>Loading details...</p>
              </div>
            ) : selectedNominationDetails ? (
              <div>
                {/* Info Grid */}
                <div
                  style={{
                    background: "#fff",
                    border: `2px solid ${THEME.primary}15`,
                    borderRadius: "12px",
                    padding: "18px 20px",
                    marginBottom: "18px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px"
                  }}
                >
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ 
                      fontSize: 10, 
                      fontWeight: 700, 
                      color: THEME.textLight, 
                      marginBottom: 5,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      textAlign: "left"
                    }}>
                      Nominee Name
                    </div>
                    <div style={{ 
                      fontSize: 16, 
                      color: THEME.text, 
                      fontWeight: 700,
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <i className="bi bi-person-circle" style={{ color: THEME.primary, fontSize: 18 }} />
                      {selectedNominationDetails.nomineeName ||
                        (selectedNominationDetails.nominee?.firstName
                          ? `${selectedNominationDetails.nominee.firstName} ${selectedNominationDetails.nominee.lastName}`
                          : "N/A")}
                    </div>
                  </div>

                  <div>
                    <div style={{ 
                      fontSize: 10, 
                      fontWeight: 700, 
                      color: THEME.textLight, 
                      marginBottom: 5,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      textAlign: "left"
                    }}>
                      Employee ID
                    </div>
                    <div style={{ 
                      fontSize: 15, 
                      color: THEME.text, 
                      fontWeight: 600,
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <i className="bi bi-hash" style={{ color: THEME.primary, fontSize: 14 }} />
                      {selectedNominationDetails.nomineeEmployeeId ||
                        selectedNominationDetails.nominee?.employeeId ||
                        "N/A"}
                    </div>
                  </div>

                  <div>
                    <div style={{ 
                      fontSize: 10, 
                      fontWeight: 700, 
                      color: THEME.textLight, 
                      marginBottom: 5,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      textAlign: "left"
                    }}>
                      Submitted Date
                    </div>
                    <div style={{ 
                      fontSize: 14, 
                      color: THEME.text, 
                      fontWeight: 600,
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <i className="bi bi-calendar-check" style={{ color: THEME.primary, fontSize: 14 }} />
                      {selectedNominationDetails.submittedAt
                        ? new Date(selectedNominationDetails.submittedAt).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ 
                      fontSize: 10, 
                      fontWeight: 700, 
                      color: THEME.textLight, 
                      marginBottom: 5,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      textAlign: "left"
                    }}>
                      Opportunity
                    </div>
                    <div style={{ 
                      fontSize: 15, 
                      color: THEME.text, 
                      fontWeight: 600,
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <i className="bi bi-award" style={{ color: THEME.primary, fontSize: 16 }} />
                      {selectedNominationDetails.opportunityName ||
                        selectedNominationDetails.opportunity?.opportunityName ||
                        "N/A"}
                    </div>
                  </div>
                </div>

                {/* Justification Section */}
                <div className="mb-3">
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: THEME.textLight,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <i className="bi bi-chat-left-quote-fill" style={{ fontSize: 13 }} />
                    Justification
                  </div>
                  <div
                    style={{
                      background: "#fff",
                      padding: "14px 16px",
                      borderRadius: 10,
                      fontSize: 14,
                      color: THEME.text,
                      minHeight: "50px",
                      fontWeight: 500,
                      lineHeight: "1.6",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                      border: `2px solid ${THEME.primary}15`,
                      textAlign: "left"
                    }}
                  >
                    {selectedNominationDetails.justification || "No justification provided"}
                  </div>
                </div>

                {/* Parameters Section - Improved Layout */}
                {selectedNominationDetails.parameterValues &&
                  selectedNominationDetails.parameterValues.length > 0 && (
                    <div className="mb-3">
                      <div style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: THEME.textLight,
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}>
                        <i className="bi bi-list-check" style={{ fontSize: 14 }} />
                        Nomination Parameters
                      </div>
                      <div style={{
                        borderRadius: 10,
                        overflow: "hidden",
                        border: `2px solid ${THEME.primary}15`,
                        background: "#fff",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
                      }}>
                        {selectedNominationDetails.parameterValues.map((param, index) => (
                          <div
                            key={param.parameterId || index}
                            style={{
                              padding: "12px 16px",
                              borderBottom:
                                index < selectedNominationDetails.parameterValues.length - 1
                                  ? `1px solid #e5e7eb`
                                  : "none",
                              background: index % 2 === 0 ? "#fff" : "#f8f9fc"
                            }}
                          >
                            {/* Parameter Name and Type */}
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: "8px"
                            }}>
                              <div style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: THEME.text,
                                textAlign: "left",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                              }}>
                                {param.parameterName}
                                {param.isRequired && (
                                  <span style={{ color: THEME.danger, fontSize: 12 }}>*</span>
                                )}
                              </div>
                              <span style={{
                                fontSize: 10,
                                color: THEME.textLight,
                                fontWeight: 600,
                                background: `${THEME.primary}10`,
                                padding: "3px 10px",
                                borderRadius: "12px",
                                textTransform: "uppercase",
                                letterSpacing: "0.3px"
                              }}>
                                {param.parameterType}
                              </span>
                            </div>

                            {/* Parameter Value */}
                            <div
                              style={{
                                background: index % 2 === 0 ? "#f8f9fc" : "#fff",
                                borderRadius: 6,
                                border: `1px solid ${THEME.primary}10`,
                                padding: "10px 12px",
                                fontSize: 15,
                                fontWeight: 600,
                                color: THEME.text,
                                textAlign: "left",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              {param.parameterType === "Rating" ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <div style={{ display: "flex", gap: "2px" }}>
                                    {[...Array(5)].map((_, i) => (
                                      <span 
                                        key={i}
                                        style={{ 
                                          fontSize: 18,
                                          color: i < parseInt(param.parameterValue) ? "#FFC107" : "#E0E0E0"
                                        }}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                  <span style={{ 
                                    color: THEME.text, 
                                    fontSize: 13,
                                    fontWeight: 600,
                                    marginLeft: "4px"
                                  }}>
                                    {param.parameterValue}/5
                                  </span>
                                </div>
                              ) : (
                                param.parameterValue
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <p 
                className="text-center text-muted" 
                style={{ 
                  fontSize: 14, 
                  padding: "30px 0",
                  textAlign: "center"
                }}
              >
                No details available
              </p>
            )}
          </div>

          {/* Footer */}
          <div 
            className="modal-footer" 
            style={{
              borderTop: `1px solid #e5e7eb`,
              justifyContent: "flex-end",
              padding: "14px 28px",
              background: "#fff",
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={() => setShowModal(false)}
              style={{
                background: THEME.primary,
                color: "#fff",
                fontWeight: "700",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontSize: 14,
                boxShadow: "0 2px 8px rgba(39, 35, 92, 0.2)",
                letterSpacing: "0.3px",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(39, 35, 92, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(39, 35, 92, 0.2)";
              }}
            >
              <i className="bi bi-x-lg" style={{ fontSize: 11 }} />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDetailsModal;
