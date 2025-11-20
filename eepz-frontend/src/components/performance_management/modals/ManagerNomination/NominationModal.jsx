import React, { useState } from "react";
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

  React.useEffect(() => {
    if (show && rewardTypes.length > 0) {
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
    setSelectedRewardType(rewardType);
    setParameters([]);
    setParameterValues({});
    if (rewardTypeId) {
      try {
        const { data } = await managerNominationApi.getNominationParameters(rewardTypeId);
        if (data.success) {
          setParameters(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching parameters:", error);
        toast.error("Error loading parameters. Please try again.");
      }
    }
  };

  const handleParameterChange = (parameterId, value) => {
    setParameterValues({
      ...parameterValues,
      [parameterId]: value,
    });
  };

  const resetForm = () => {
    setSelectedRewardType(null);
    setJustification("");
    setParameterValues({});
    setParameters([]);
    const recognitionRewards = rewardTypes.filter(
      (rt) => rt?.rewardCategory === "Recognition"
    );
    setCategoryRewards(recognitionRewards);
  };

  const handleClose = () => {
    resetForm();
    onHide();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRewardType) {
      toast.warning("Please select a reward type");
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
      if (data.success) {
        toast.success("Nomination submitted successfully!");
        resetForm();
        onNominationSuccess();
        onHide();
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        "Error submitting nomination: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const renderParameterField = (parameter) => {
    if (!parameter) return null;
    const value = parameterValues[parameter.parameterId] || "";
    switch (parameter.parameterType) {
      case "Text":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) =>
              handleParameterChange(parameter.parameterId, e.target.value)
            }
            placeholder={parameter.placeholderText || "Enter text..."}
            required={parameter.isRequired}
            style={inputStyle}
          />
        );
      case "TextArea":
        return (
          <textarea
            value={value}
            onChange={(e) =>
              handleParameterChange(parameter.parameterId, e.target.value)
            }
            placeholder={parameter.placeholderText || "Enter details..."}
            required={parameter.isRequired}
            rows={3}
            style={textareaStyle}
          />
        );
      case "Number":
      case "Rating":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) =>
              handleParameterChange(parameter.parameterId, e.target.value)
            }
            placeholder={parameter.placeholderText || "Enter number..."}
            min={parameter.minimumValue || undefined}
            max={parameter.maximumValue || undefined}
            required={parameter.isRequired}
            style={inputStyle}
          />
        );
      case "Date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) =>
              handleParameterChange(parameter.parameterId, e.target.value)
            }
            required={parameter.isRequired}
            style={inputStyle}
          />
        );
      default:
        return null;
    }
  };

  if (!show) return null;

  // THEME STYLES
  const modalOverlayStyle = {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(39, 35, 92, 0.4)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    zIndex: 1050
  };
  const modalContentStyle = {
    position: "fixed",
    top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(39,35,92,0.15)",
    maxWidth: 900,
    width: "98vw",
    padding: 0,
    zIndex: 1060,
    textAlign: "left",
    overflow: "visible",
    display: "flex",
    flexDirection: "column"
  };
  const modalHeaderStyle = {
    background: "#27235C",
    color: "#fff",
    padding: "18px 36px 5px 36px",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
    textAlign: "left",
    display: "flex",
    alignItems: "flex-start",
    minHeight: "unset",
    position: "relative",
    boxShadow: 'none',
    borderBottom: "none"
  };
  const modalTitleBlockStyle = { flex: 1, minWidth: 0 };
  const modalTitleStyle = {
    fontWeight: 700,
    fontSize: 24,
    lineHeight: 1.18,
    margin: 0,
    color: "#fff",
    textAlign: "left"
  };
  const modalSubtitleStyle = {
    fontWeight: 400,
    fontSize: 15,
    color: "#e7eafe",
    marginTop: 2,
    marginBottom: 0,
    textAlign: "left"
  };
  const modalCloseStyle = {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: 26,
    fontWeight: 400,
    cursor: 'pointer',
    marginLeft: 16,
    lineHeight: 1,
    opacity: 1
  };
  const scrollableBodyStyle = {
    flex: 1,
    overflowY: "auto",
    maxHeight: "66vh",
    padding: "0 36px 18px 36px",
    background: "#fff"
  };
  const formStyle = {
    padding: 0,
    background: "#fff",
    borderBottomLeftRadius: "16px",
    borderBottomRightRadius: "16px",
    margin: 0
  };
  const formSectionStyle = { marginBottom: 19, textAlign: "justify" };
  const labelStyle = {
    fontWeight: 600,
    fontSize: 15,
    color: "#334155",
    marginBottom: "7px",
    display: "block",
    textAlign: "left"
  };
  const requiredStyle = {
    color: '#ef4444',
    fontWeight: 700,
    marginLeft: 2,
    fontSize: '15px'
  };
  const inputStyle = {
    border: "1px solid #cbd5e1",
    borderRadius: 7,
    fontSize: 15,
    padding: "9px 14px",
    width: "100%",
    background: "#fff",
    marginTop: 2,
    marginBottom: 4,
    display: "block",
    textAlign: "justify"
  };
  const textareaStyle = {
    ...inputStyle,
    resize: "vertical",
    minHeight: 68,
    maxHeight: 130
  };
  const rewardCardStyle = (active) => ({
    border: `2px solid ${active ? "#97247E" : "#d1d5db"}`,
    borderRadius: 9,
    padding: "15px 18px",
    background: active ? "#fdf3fa" : "#fff",
    cursor: "pointer",
    minHeight: 72,
    boxShadow: active ? "0 2px 15px rgba(151,36,126,0.09)" : "none",
    textAlign: "left"
  });
  const rewardGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 18,
    width: "100%"
  };
  const selectedInfoStyle = {
    marginBottom: 18, fontWeight: 500, color: "#4C3F8F", textAlign: "left"
  };
  const parameterTitleStyle = {
    margin: "0 0 12px 0", fontWeight: 600, fontSize: 16, color: "#4C3F8F", textAlign: "justify"
  };
  const parameterFieldStyle = {
    marginBottom: 14, textAlign: "justify"
  };
  const actionsStyle = {
    display: "flex", justifyContent: "flex-end", gap: 15, marginTop: 20, textAlign: "left", padding: "15px 36px 18px 36px", background: "#fff", borderRadius: "0 0 16px 16px"
  };
  const cancelBtnStyle = {
    background: '#6c757d',
    color: '#fff',
    border: 'none',
    fontWeight: 600,
    padding: '10px 30px',
    fontSize: 15,
    borderRadius: 8,
    cursor: "pointer"
  };
  const submitBtnStyle = {
    background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 15,
    padding: "10px 30px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(151,36,126,0.18)"
  };

  return (
    <div style={modalOverlayStyle} onClick={handleClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <div style={modalTitleBlockStyle}>
            <div style={modalTitleStyle}>
              Nominate{" "}
              {selectedEmployee
                ? `${selectedEmployee.firstName || ""} ${selectedEmployee.lastName || ""}`
                : ""}
            </div>
            <div style={modalSubtitleStyle}>
              Select a Recognition reward type and fill in the details
            </div>
          </div>
          <button style={modalCloseStyle} onClick={handleClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={scrollableBodyStyle}>
            {/* Select Reward Type - Only Recognition */}
            {!selectedRewardType && (
              <div style={formSectionStyle}>
                <label style={labelStyle}>
                  Select Recognition Reward <span style={requiredStyle}>*</span>
                </label>
                <div style={rewardGridStyle}>
                  {categoryRewards.map((reward, i) => (
                    <div
                      key={reward?.rewardTypeId}
                      onClick={() => handleRewardTypeSelect(reward?.rewardTypeId)}
                      style={rewardCardStyle(false)}
                    >
                      <div style={{ fontWeight: 600, fontSize: 16, color: "#4C3F8F", marginBottom: 5 }}>
                        {reward?.rewardName || "N/A"}
                      </div>
                      {reward?.description && (
                        <div style={{ fontSize: 14, color: "#6B7280", textAlign: "justify" }}>
                          {reward.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Justification & Parameters */}
            {selectedRewardType && (
              <>
                <div style={selectedInfoStyle}>
                  <strong>Selected:</strong> {selectedRewardType?.rewardName || "N/A"}
                </div>
                <div style={formSectionStyle}>
                  <label style={labelStyle}>
                    Justification <span style={requiredStyle}>*</span>
                  </label>
                  <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Explain why this employee deserves this nomination..."
                    required
                    style={textareaStyle}
                  />
                </div>
                {/* Parameters */}
                {parameters.length > 0 && (
                  <div style={formSectionStyle}>
                    <h4 style={parameterTitleStyle}>
                      Additional Information ({parameters.length} fields)
                    </h4>
                    {parameters.map((parameter, index) => (
                      <div key={parameter?.parameterId || index} style={parameterFieldStyle}>
                        <label style={labelStyle}>
                          {index + 1}. {parameter?.parameterName || "N/A"}
                          {parameter?.isRequired && (
                            <span style={requiredStyle}> *</span>
                          )}
                          <span style={{ color: "#71717A", fontWeight: 400, marginLeft: 6 }}>
                            ({parameter?.parameterType || "Text"})
                          </span>
                        </label>
                        {renderParameterField(parameter)}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          {/* Submit Buttons - stick to bottom */}
          <div style={actionsStyle}>
            <button
              type="button"
              onClick={handleClose}
              style={cancelBtnStyle}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedRewardType}
              style={submitBtnStyle}
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
