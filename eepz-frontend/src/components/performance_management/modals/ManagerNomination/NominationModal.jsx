import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import * as managerNominationApi from "../../../../services/performancemanagement/manager/managernominationapi";

const NominationModal = ({
  show,
  onHide,
  onNominationSuccess,
  selectedEmployee,
  rewardTypes,
  managerId,
}) => {
  const [selectedRewardType, setSelectedRewardType] = useState(null);
  const [categoryRewards, setCategoryRewards] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [justification, setJustification] = useState("");
  const [parameterValues, setParameterValues] = useState({});
  const [existingNominations, setExistingNominations] = useState([]);
  const [loadingNominations, setLoadingNominations] = useState(false);

  // ✅ FIXED: Fetch manager's nominations and filter for this employee
  useEffect(() => {
    if (show && selectedEmployee?.employeeId && managerId) {
      fetchEmployeeNominations();
    }
  }, [show, selectedEmployee, managerId]);

  const fetchEmployeeNominations = async () => {
    try {
      setLoadingNominations(true);
      // ✅ Use existing API endpoint
      const { data } = await managerNominationApi.getMyNominations(managerId);
      
      if (data?.success) {
        // ✅ Filter to get only nominations for this specific employee
        const employeeNoms = (data.data || []).filter(
          (nom) => nom?.nominee?.employeeId === selectedEmployee.employeeId
        );
        setExistingNominations(employeeNoms);
      } else {
        setExistingNominations([]);
      }
    } catch (err) {
      console.error("Error fetching employee nominations:", err);
      setExistingNominations([]);
    } finally {
      setLoadingNominations(false);
    }
  };

  useEffect(() => {
    if (show && Array.isArray(rewardTypes)) {
      const recognitionRewards = rewardTypes.filter(
        (rt) => rt?.rewardCategory === "Recognition"
      );
      setCategoryRewards(recognitionRewards);
    }
  }, [show, rewardTypes]);

  const handleRewardTypeSelect = async (rewardTypeId) => {
    const rewardType = rewardTypes.find(
      (rt) => rt?.rewardTypeId === rewardTypeId
    );
    setSelectedRewardType(rewardType || null);
    setParameters([]);
    setParameterValues({});

    if (rewardTypeId) {
      try {
        const { data } =
          await managerNominationApi.getNominationParameters(rewardTypeId);
        if (data?.success) {
          setParameters(data.data || []);
        } else {
          setParameters([]);
        }
      } catch (err) {
        console.error("Error fetching parameters:", err);
        toast.error("Error loading parameters. Please try again.");
      }
    }
  };

  const handleParameterChange = (parameterId, value) => {
    setParameterValues((prev) => ({ ...prev, [parameterId]: value }));
  };

  const resetForm = () => {
    setSelectedRewardType(null);
    setJustification("");
    setParameterValues({});
    setParameters([]);
    setExistingNominations([]);
    const recognitionRewards = rewardTypes.filter(
      (rt) => rt?.rewardCategory === "Recognition"
    );
    setCategoryRewards(recognitionRewards);
  };

  const handleClose = () => {
    resetForm();
    onHide();
  };

  // ✅ Check if reward type is already nominated
  const isRewardAlreadyNominated = (rewardTypeId) => {
    return existingNominations.some(
      (nom) => nom.rewardTypeId === rewardTypeId
    );
  };

  // ✅ Get nominated reward names for warning banner
  const getNominatedRewardNames = () => {
    return existingNominations
      .map((nom) => {
        // Try to find reward name from rewardTypes array
        const reward = rewardTypes.find(rt => rt.rewardTypeId === nom.rewardTypeId);
        return reward?.rewardName || nom.rewardTypeName;
      })
      .filter(Boolean)
      .join(", ");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRewardType) {
      toast.warning("Please select a reward type");
      return;
    }

    // ✅ Check if already nominated for this reward
    if (isRewardAlreadyNominated(selectedRewardType.rewardTypeId)) {
      toast.error(
        `This employee has already been nominated for ${selectedRewardType.rewardName}`
      );
      return;
    }

    if (!justification.trim()) {
      toast.warning("Justification is required");
      return;
    }
    
    const requiredParams = parameters.filter((p) => p?.isRequired);
    const missingParams = requiredParams.filter(
      (p) =>
        !parameterValues[p.parameterId] ||
        parameterValues[p.parameterId].toString().trim() === ""
    );
    
    if (missingParams.length > 0) {
      toast.warning(
        `Please fill in all required fields: ${missingParams
          .map((p) => p.parameterName)
          .join(", ")}`
      );
      return;
    }

    try {
      const payload = {
        rewardTypeId: selectedRewardType.rewardTypeId,
        nomineeEmployeeId: selectedEmployee?.employeeId,
        nominatedByEmployeeId: parseInt(managerId),
        justification: justification,
        parameterValues: Object.entries(parameterValues).map(
          ([parameterId, value]) => ({
            parameterId: parseInt(parameterId),
            value: value.toString(),
          })
        ),
      };

      const { data } = await managerNominationApi.submitNomination(payload);
      if (data?.success) {
        toast.success("Nomination submitted successfully!");
        resetForm();
        onNominationSuccess();
      } else {
        toast.error(data?.message || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        "Error submitting nomination: " +
          (error?.response?.data?.message || error.message)
      );
    } finally {
      onHide();
    }
  };

  // Inline styles
  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(39, 35, 92, 0.45)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    zIndex: 1050,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  };

  const modalStyle = {
    width: "min(980px, 98vw)",
    maxHeight: "90vh",
    borderRadius: 12,
    overflow: "hidden",
    background: "#ffffff",
    boxShadow: "0 14px 40px rgba(15, 23, 42, 0.25)",
    display: "flex",
    flexDirection: "column",
    border: "2px solid #27235c",
  };

  const headerStyle = {
    background: "#26225A",
    color: "#ffffff",
    padding: "18px 24px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    flexShrink: 0,
  };

  const headerLeftStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
    flex: 1,
    textAlign: "left",
  };

  const titleStyle = {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.3,
    textAlign: "left",
  };

  const subtitleStyle = {
    margin: 0,
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: 500,
    textAlign: "left",
  };

  const closeBtnStyle = {
    background: "transparent",
    border: "none",
    color: "#ffffff",
    fontSize: 28,
    cursor: "pointer",
    lineHeight: 1,
    padding: 6,
    marginLeft: 8,
    alignSelf: "flex-start",
    flexShrink: 0,
  };

  const bodyWrapperStyle = {
    padding: 24,
    overflowY: "auto",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  };

  const rewardGridBaseStyle = {
    width: "100%",
    display: "grid",
    gap: 14,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    alignItems: "stretch",
  };

  const rewardCardStyle = (active, disabled) => ({
    border: `2px solid ${
      disabled ? "#d1d5db" : active ? "#26225A" : "#e6e8eb"
    }`,
    background: disabled ? "#f3f4f6" : active ? "#f8f9fa" : "#ffffff",
    borderRadius: 10,
    padding: "14px 14px",
    cursor: disabled ? "not-allowed" : "pointer",
    minHeight: 72,
    boxShadow: active ? "0 4px 12px rgba(38, 34, 90, 0.1)" : "none",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    transition: "all 0.18s ease",
    textAlign: "left",
    opacity: disabled ? 0.6 : 1,
    position: "relative",
  });

  const textInputStyle = {
    border: "1px solid #27235c",
    borderRadius: 8,
    padding: "10px 12px",
    width: "100%",
    fontSize: 14,
    boxSizing: "border-box",
    marginTop: 6,
    textAlign: "left",
  };

  const numberInputStyle = {
    ...textInputStyle,
    maxWidth: 180,
  };

  const textareaStyle = {
    ...textInputStyle,
    minHeight: 90,
    resize: "vertical",
    fontFamily: "inherit",
  };

  const actionsAreaStyle = {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    padding: "16px 24px",
    borderTop: "1px solid #eef2f6",
    background: "#ffffff",
    flexShrink: 0,
  };

  const cancelBtnStyle = {
    background: "#6b7280",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.2s",
  };

  const submitBtnStyle = {
    background: "#26225A",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(38, 34, 90, 0.2)",
    transition: "background 0.2s",
  };

  const emptyStateStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    textAlign: "center",
    background: "#f9fafb",
    borderRadius: 10,
    border: "2px dashed #d1d5db",
    minHeight: 200,
  };

  const warningBannerStyle = {
    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    border: "2px solid #f59e0b",
    borderRadius: 10,
    padding: "14px 16px",
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  };

  const renderParameterField = (parameter) => {
    if (!parameter) return null;
    const value = parameterValues[parameter.parameterId] ?? "";
    const type = (parameter.parameterType || "").toLowerCase();

    const isNumeric = type === "number" || type === "rating";

    const commonProps = {
      value,
      onChange: (e) =>
        handleParameterChange(parameter.parameterId, e.target.value),
      placeholder: parameter.placeholderText || "",
      required: !!parameter.isRequired,
      style:
        type === "textarea"
          ? textareaStyle
          : isNumeric
          ? numberInputStyle
          : textInputStyle,
    };

    switch (type) {
      case "text":
        return <input type="text" {...commonProps} />;
      case "textarea":
        return <textarea rows={3} {...commonProps} />;
      case "number":
      case "rating":
        return (
          <input
            type="number"
            {...commonProps}
            min={parameter.minimumValue ?? undefined}
            max={parameter.maximumValue ?? undefined}
          />
        );
      case "date":
        return <input type="date" {...commonProps} />;
      default:
        return <input type="text" {...commonProps} />;
    }
  };

  if (!show) return null;

  return (
    <div style={modalOverlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={headerLeftStyle}>
            <div style={titleStyle}>
              Nominate{" "}
              <span
                style={{
                  color: "#ffffff",
                  fontWeight: 800,
                }}
              >
                {selectedEmployee
                  ? `${selectedEmployee.firstName || ""} ${
                      selectedEmployee.lastName || ""
                    }`
                  : ""}
              </span>
            </div>
            <div style={subtitleStyle}>
              Select a Recognition reward type and provide nomination details
            </div>
          </div>

          <button
            aria-label="Close"
            onClick={handleClose}
            style={closeBtnStyle}
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <div style={bodyWrapperStyle}>
            {/* ✅ Warning banner if employee has existing nominations */}
            {existingNominations.length > 0 && (
              <div style={warningBannerStyle}>
                <i
                  className="bi bi-exclamation-triangle-fill"
                  style={{
                    fontSize: 20,
                    color: "#d97706",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                ></i>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#92400e",
                      fontSize: 14,
                      marginBottom: 4,
                    }}
                  >
                    Already Nominated
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#78350f",
                      lineHeight: 1.5,
                    }}
                  >
                    This employee has already been nominated for:{" "}
                    <strong>{getNominatedRewardNames()}</strong>
                    <br />
                    Please select a different award type.
                  </div>
                </div>
              </div>
            )}

            {!selectedRewardType && (
              <div style={{ width: "100%" }}>
                <label
                  style={{
                    fontWeight: 700,
                    marginBottom: 16,
                    display: "block",
                    color: "#26225A",
                    fontSize: 16,
                    textAlign: "center",
                  }}
                >
                  Choose Recognition Reward Type{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>

                {categoryRewards.length === 0 ? (
                  <div style={emptyStateStyle}>
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "#e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 16,
                      }}
                    >
                      <i
                        className="bi bi-award"
                        style={{
                          fontSize: 32,
                          color: "#9ca3af",
                        }}
                      ></i>
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 8,
                      }}
                    >
                      No Recognition Rewards Available
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        maxWidth: 400,
                        lineHeight: 1.5,
                      }}
                    >
                      There are currently no active recognition reward types
                      configured for nominations. Please contact HR
                      administration for assistance.
                    </div>
                  </div>
                ) : (
                  <div style={rewardGridBaseStyle}>
                    {categoryRewards.map((reward) => {
                      const isActive =
                        selectedRewardType?.rewardTypeId ===
                        reward.rewardTypeId;
                      const isDisabled = isRewardAlreadyNominated(
                        reward.rewardTypeId
                      );

                      return (
                        <div
                          key={reward?.rewardTypeId}
                          role="button"
                          tabIndex={isDisabled ? -1 : 0}
                          onClick={() =>
                            !isDisabled &&
                            handleRewardTypeSelect(reward.rewardTypeId)
                          }
                          onKeyDown={(e) =>
                            !isDisabled && e.key === "Enter"
                              ? handleRewardTypeSelect(reward.rewardTypeId)
                              : null
                          }
                          style={rewardCardStyle(isActive, isDisabled)}
                          onMouseEnter={(e) => {
                            if (!isDisabled) {
                              e.currentTarget.style.borderColor = "#26225A";
                              e.currentTarget.style.boxShadow =
                                "0 4px 12px rgba(38, 34, 90, 0.15)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive && !isDisabled) {
                              e.currentTarget.style.borderColor = "#e6e8eb";
                              e.currentTarget.style.boxShadow = "none";
                            } else if (isActive) {
                              e.currentTarget.style.borderColor = "#26225A";
                              e.currentTarget.style.boxShadow =
                                "0 4px 12px rgba(38, 34, 90, 0.1)";
                            }
                          }}
                          aria-pressed={isActive}
                          aria-disabled={isDisabled}
                        >
                          {/* ✅ Badge showing already nominated */}
                          {isDisabled && (
                            <div
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                background: "#f59e0b",
                                color: "#ffffff",
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: 4,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              Nominated
                            </div>
                          )}

                          <div
                            style={{
                              fontWeight: 700,
                              color: isDisabled ? "#9ca3af" : "#26225A",
                              fontSize: 15,
                              marginBottom: 4,
                              textAlign: "left",
                            }}
                          >
                            {reward?.rewardName || "Unnamed reward"}
                          </div>
                          {reward?.description && (
                            <div
                              style={{
                                color: isDisabled ? "#9ca3af" : "#6b7280",
                                fontSize: 13,
                                lineHeight: 1.4,
                                textAlign: "left",
                              }}
                            >
                              {reward.description}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {selectedRewardType && (
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      background: "#97247E",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "1px solid #26225A",
                      textAlign: "left",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 12,
                      boxShadow: "0 4px 12px rgba(38, 34, 90, 0.15)",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.15)",
                        borderRadius: "50%",
                        width: 36,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <i
                        className="bi bi-award-fill"
                        style={{
                          fontSize: 18,
                          color: "#ffffff",
                        }}
                      ></i>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255, 255, 255, 0.8)",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          fontWeight: 600,
                          textAlign: "left",
                        }}
                      >
                        Selected Reward
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#ffffff",
                          fontSize: 15,
                          textAlign: "left",
                        }}
                      >
                        {selectedRewardType.rewardName || "N/A"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRewardType(null);
                        setParameters([]);
                        setParameterValues({});
                        setJustification("");
                      }}
                      style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        border: "none",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        marginLeft: 8,
                        color: "#ffffff",
                        fontSize: 16,
                        flexShrink: 0,
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255, 255, 255, 0.3)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255, 255, 255, 0.2)")
                      }
                      aria-label="Change reward selection"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>

                <div style={{ width: "100%" }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: 8,
                      fontSize: 14,
                      textAlign: "left",
                    }}
                  >
                    Justification <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Explain why this employee deserves this nomination..."
                    required
                    style={textareaStyle}
                  />
                </div>

                {parameters.length > 0 && (
                  <div style={{ width: "100%" }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#26225A",
                        marginBottom: 12,
                        fontSize: 15,
                        textAlign: "left",
                      }}
                    >
                      Additional Information
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          parameters.length === 1
                            ? "1fr"
                            : "repeat(2, minmax(0, 1fr))",
                        columnGap: 18,
                        rowGap: 12,
                      }}
                    >
                      {parameters.map((param, idx) => (
                        <div
                          key={param.parameterId ?? idx}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          <label
                            style={{
                              fontWeight: 600,
                              color: "#334155",
                              fontSize: 13,
                              textAlign: "left",
                            }}
                          >
                            {param.parameterName}{" "}
                            {param.isRequired ? (
                              <span style={{ color: "#ef4444" }}>*</span>
                            ) : null}
                          </label>
                          {renderParameterField(param)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={actionsAreaStyle}>
            <button
              type="button"
              onClick={handleClose}
              style={cancelBtnStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#4b5563")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#6b7280")
              }
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...submitBtnStyle,
                opacity: !selectedRewardType ? 0.6 : 1,
                background: "linear-gradient(90deg,#97247e 0%,#e01950 100%)",
                boxShadow: "0 10px 28px rgba(224,25,80,0.18)",
                transition: "all 0.3s ease",
              }}
              disabled={!selectedRewardType}
              onMouseEnter={(e) => {
                if (selectedRewardType) {
                  e.currentTarget.style.filter = "brightness(0.9)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedRewardType) {
                  e.currentTarget.style.filter = "brightness(1)";
                }
              }}
            >
              Submit Nomination
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NominationModal;
