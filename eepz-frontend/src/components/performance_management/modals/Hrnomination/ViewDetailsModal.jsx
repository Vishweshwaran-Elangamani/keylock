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
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(39, 35, 92, 0.21)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1500,
      }}
      onClick={() => setShowModal(false)}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 18,
          boxShadow: "0 10px 38px rgba(39,35,92,0.19)",
          maxWidth: 700,
          width: "96vw",
          minWidth: 320,
          maxHeight: "92vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            backgroundColor: "#27235C",
            color: "#fff",
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: ".01em",
            padding: "20px 28px 16px 28px",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            textAlign: "left",
          }}
        >
          Nomination Details
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px 28px",
            overflowY: "auto",
            flex: 1,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {detailsLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "#6b7280",
                fontSize: 14,
              }}
            >
              <div
                style={{
                  border: "3px solid #f3f4f6",
                  borderTop: "3px solid #27235C",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  margin: "0 auto 16px",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Loading details...
            </div>
          ) : selectedNominationDetails ? (
            <>
              <div style={{ display: "flex", gap: 40, marginBottom: 28 }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#6b7280",
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    NOMINEE NAME
                  </label>
                  <p
                    style={{
                      fontSize: 15,
                      color: "#27235C",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {selectedNominationDetails.nomineeName ||
                      (selectedNominationDetails.nominee?.firstName
                        ? `${selectedNominationDetails.nominee.firstName} ${selectedNominationDetails.nominee.lastName}`
                        : "N/A")}
                  </p>
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#6b7280",
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    EMPLOYEE ID
                  </label>
                  <p
                    style={{
                      fontSize: 15,
                      color: "#27235C",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {selectedNominationDetails.nomineeEmployeeId ||
                      selectedNominationDetails.nominee?.employeeId ||
                      "N/A"}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#6b7280",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    display: "block",
                  }}
                >
                  OPPORTUNITY
                </label>
                <p
                  style={{
                    fontSize: 15,
                    color: "#27235C",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  {selectedNominationDetails.opportunityName ||
                    selectedNominationDetails.opportunity?.opportunityName ||
                    "N/A"}
                </p>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#6b7280",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    display: "block",
                  }}
                >
                  JUSTIFICATION
                </label>
                <div
                  style={{
                    backgroundColor: "#f9fafb",
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 14,
                    color: "#27235C",
                    minHeight: 80,
                    border: "1px solid #e5e7eb",
                    lineHeight: 1.6,
                  }}
                >
                  {selectedNominationDetails.justification || "No justification provided"}
                </div>
              </div>

              {selectedNominationDetails.parameterValues &&
                selectedNominationDetails.parameterValues.length > 0 && (
                  <div
                    style={{
                      marginBottom: 28,
                    }}
                  >
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#6b7280",
                        marginBottom: 12,
                        textTransform: "uppercase",
                        display: "block",
                      }}
                    >
                      NOMINATION PARAMETERS
                    </label>
                    <div
                      style={{
                        backgroundColor: "#f9fafb",
                        padding: 16,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      {selectedNominationDetails.parameterValues.map((param, index) => (
                        <div
                          key={param.parameterId || index}
                          style={{
                            marginBottom:
                              index < selectedNominationDetails.parameterValues.length - 1
                                ? 16
                                : 0,
                            paddingBottom:
                              index < selectedNominationDetails.parameterValues.length - 1
                                ? 16
                                : 0,
                            borderBottom:
                              index < selectedNominationDetails.parameterValues.length - 1
                                ? "1px solid #e5e7eb"
                                : "none",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: "#27235C",
                                  margin: 0,
                                }}
                              >
                                {param.parameterName}
                                {param.isRequired && (
                                  <span
                                    style={{ color: "#E01950", marginLeft: 4 }}
                                  >
                                    *
                                  </span>
                                )}
                              </p>
                              <p
                                style={{
                                  fontSize: 11.5,
                                  color: "#6b7280",
                                  margin: "4px 0 0 0",
                                }}
                              >
                                Type: {param.parameterType}
                              </p>
                            </div>
                            <div
                              style={{
                                backgroundColor: "#fff",
                                padding: "10px 14px",
                                borderRadius: 6,
                                border: "1px solid #e5e7eb",
                                minWidth: 160,
                                textAlign: "center",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 14,
                                  color: "#27235C",
                                  margin: 0,
                                  fontWeight: 600,
                                }}
                              >
                                {param.parameterType === "Rating" ? (
                                  <>
                                    {"⭐".repeat(parseInt(param.parameterValue) || 0)}{" "}
                                    <span style={{ color: "#6b7280" }}>
                                      ({param.parameterValue}/5)
                                    </span>
                                  </>
                                ) : (
                                  param.parameterValue
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div style={{ display: "flex", gap: 40 }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#6b7280",
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    SUBMITTED DATE
                  </label>
                  <p
                    style={{
                      fontSize: 15,
                      color: "#27235C",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {selectedNominationDetails.submittedAt
                      ? new Date(selectedNominationDetails.submittedAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p
              style={{
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 15,
                padding: "40px 0",
              }}
            >
              No details available
            </p>
          )}
        </div>

        <div
          style={{
            backgroundColor: "#F5F5F7",
            borderTop: "1px solid #E5E7EB",
            padding: "18px 28px",
            display: "flex",
            justifyContent: "flex-end",
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
          }}
        >
          <button
            style={{
              padding: "10px 28px",
              borderRadius: 8,
              border: "none",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
              boxShadow: "0 2px 8px rgba(151,36,126,0.1)",
              cursor: "pointer",
              letterSpacing: ".02em",
              transition: "filter 0.13s",
            }}
            onClick={() => setShowModal(false)}
            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
          >
            Close
          </button>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          div[style*="overflow-y: auto"]::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </div>
  );
};

export default ViewDetailsModal;
