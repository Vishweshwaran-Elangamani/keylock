import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import * as managerNominationApi from "../../../../services/performancemanagement/manager/managernominationapi";
 
/*
  NOTE: if you'd like the breadcrumb/home icons or other assets referenced inside the modal,
  use your uploaded local path which will be transformed by your environment, e.g.:
  "/mnt/data/8e6c36a7-b780-4b24-9adc-a06f876e35ec.png"
*/
 
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
 
  useEffect(() => {
    if (show && Array.isArray(rewardTypes)) {
      const recognitionRewards = rewardTypes.filter(
        (rt) => rt?.rewardCategory === "Recognition"
      );
      setCategoryRewards(recognitionRewards);
    }
  }, [show, rewardTypes]);
 
  // fetch dynamic parameters when selecting a reward type
  const handleRewardTypeSelect = async (rewardTypeId) => {
    const rewardType = rewardTypes.find((rt) => rt?.rewardTypeId === rewardTypeId);
    setSelectedRewardType(rewardType || null);
    setParameters([]);
    setParameterValues({});
    // only fetch parameters if rewardTypeId exists
    if (rewardTypeId) {
      try {
        const { data } = await managerNominationApi.getNominationParameters(rewardTypeId);
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
    const recognitionRewards = rewardTypes.filter((rt) => rt?.rewardCategory === "Recognition");
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
        parameterValues: Object.entries(parameterValues).map(([parameterId, value]) => ({
          parameterId: parseInt(parameterId),
          value: value.toString(),
        })),
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
      toast.error("Error submitting nomination: " + (error?.response?.data?.message || error.message));
    } finally {
      onHide();
    }
  };
 
  const renderParameterField = (parameter) => {
    if (!parameter) return null;
    const value = parameterValues[parameter.parameterId] ?? "";
    const commonProps = {
      value,
      onChange: (e) => handleParameterChange(parameter.parameterId, e.target.value),
      placeholder: parameter.placeholderText || "",
      required: !!parameter.isRequired,
      style: inputStyle,
    };
 
    switch ((parameter.parameterType || "").toLowerCase()) {
      case "text":
        return <input type="text" {...commonProps} />;
      case "textarea":
        return <textarea rows={3} {...commonProps} style={textareaStyle} />;
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
 
  // not shown if modal is hidden
  if (!show) return null;
 
  //
  // Dynamic layout decisions for reward card grid:
  //  - 1 item => center
  //  - 2 items => space-between (left & right)
  //  - >=3 => responsive grid (2 columns on desktop)
  //
  const rewardCount = categoryRewards.length;
  let rewardGridDynamicStyle = {};
  let rewardCardContainerStyle = {};
  if (rewardCount === 0) {
    rewardGridDynamicStyle = { display: "block" };
    rewardCardContainerStyle = { display: "flex", justifyContent: "center" };
  } else if (rewardCount === 1) {
    rewardGridDynamicStyle = { display: "grid", gridTemplateColumns: "1fr", justifyItems: "center" };
    rewardCardContainerStyle = { display: "flex", justifyContent: "center" };
  } else if (rewardCount === 2) {
    // two cards: left and right
    rewardGridDynamicStyle = { display: "flex", justifyContent: "space-between", gap: 18 };
    rewardCardContainerStyle = { display: "flex", justifyContent: "space-between" };
  } else {
    // 3 or more: responsive two-column grid (auto-fill on small screens)
    rewardGridDynamicStyle = {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(260px, 1fr))",
      gap: 18,
    };
    rewardCardContainerStyle = { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 };
  }
 
  // If only justification field (no parameters) after selecting reward, center the form body and narrow width
  const formHasOnlyJustification = selectedRewardType && parameters.length === 0;
 
  // Inline styles used by the component (kept centralized for clarity)
  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(39, 35, 92, 0.45)",
    backdropFilter: "blur(6px)",
    zIndex: 1050,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  };
 
  const modalStyle = {
    width: "min(980px, 98vw)",
    maxHeight: "86vh",
    borderRadius: 12,
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 14px 40px rgba(15, 23, 42, 0.25)",
    display: "flex",
    flexDirection: "column",
  };
 
  const headerStyle = {
    background: "#26225A",
    color: "#fff",
    padding: "18px 20px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  };
 
  const headerLeftStyle = { display: "flex", flexDirection: "column", gap: 6, minWidth: 0, flex: 1 };
  const titleStyle = { margin: 0, fontSize: 20, fontWeight: 800, lineHeight: 1.1 };
  const subtitleStyle = { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: 500 };
 
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
  };
 
  const bodyWrapperStyle = {
    padding: 20,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    alignItems: "stretch",
  };
 
  // reward grid styles combined with dynamic choices
  const rewardGridStyle = {
    ...rewardGridDynamicStyle,
    width: "100%",
    alignItems: "stretch",
  };
 
  const rewardCardStyle = (active) => ({
    border: `2px solid ${active ? "#97247e" : "#e6e8eb"}`,
    background: active ? "#fff6fb" : "#ffffff",
    borderRadius: 10,
    padding: "14px 16px",
    cursor: "pointer",
    minHeight: 72,
    boxShadow: active ? "0 8px 30px rgba(151,36,126,0.08)" : "none",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    width: rewardCount === 1 ? "60%" : "100%", // center card narrower when only one
  });
 
  const inputStyle = {
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "10px 12px",
    width: "100%",
    fontSize: 14,
    boxSizing: "border-box",
    marginTop: 6,
  };
 
  const textareaStyle = {
    ...inputStyle,
    minHeight: 90,
    resize: "vertical",
  };
 
  const actionsAreaStyle = {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    padding: "16px 20px",
    borderTop: "1px solid #eef2f6",
    background: "#fff",
  };
 
  const cancelBtnStyle = {
    background: "#6b7280",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer",
  };
 
  const submitBtnStyle = {
    background: "linear-gradient(90deg,#97247e 0%, #e01950 100%)",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(151,36,126,0.12)",
  };
 
  // Render
  return (
    <div style={modalOverlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={headerLeftStyle}>
            <div style={titleStyle}>
              Nominate{" "}
              <span style={{ color: "#FFFFFF", fontWeight: 800 }}>
                {selectedEmployee ? `${selectedEmployee.firstName || ""} ${selectedEmployee.lastName || ""}` : ""}
              </span>
            </div>
            <div style={subtitleStyle}>Select a Recognition reward type and fill in the details</div>
          </div>
 
          <button aria-label="Close" onClick={handleClose} style={closeBtnStyle}>
            ×
          </button>
        </div>
 
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={bodyWrapperStyle}>
            {/* Reward selection */}
            {!selectedRewardType && (
              <div style={{ width: "100%" }}>
                <label style={{ fontWeight: 700, marginBottom: 8, display: "block", color: "#374151" }}>
                  Select Recognition Reward <span style={{ color: "#ef4444" }}>*</span>
                </label>
 
                {/* Container that can center single item or distribute two items nicely */}
                <div style={{ width: "100%", display: "flex", justifyContent: rewardCount === 1 ? "center" : "stretch" }}>
                  <div style={rewardGridStyle}>
                    {categoryRewards.length === 0 && (
                      <div style={{ color: "#6b7280", padding: 12 }}>No recognition rewards available</div>
                    )}
                    {categoryRewards.map((reward) => (
                      <div
                        key={reward?.rewardTypeId}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleRewardTypeSelect(reward.rewardTypeId)}
                        onKeyDown={(e) => (e.key === "Enter" ? handleRewardTypeSelect(reward.rewardTypeId) : null)}
                        style={rewardCardStyle(false)}
                        aria-pressed={selectedRewardType?.rewardTypeId === reward.rewardTypeId}
                      >
                        <div style={{ fontWeight: 700, color: "#2b2352", fontSize: 15, marginBottom: 6 }}>
                          {reward?.rewardName || "Unnamed reward"}
                        </div>
                        {reward?.description && (
                          <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.3 }}>{reward.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
 
            {/* Selected reward + justification + parameters */}
            {selectedRewardType && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, alignItems: formHasOnlyJustification ? "center" : "stretch" }}>
                <div style={{ width: "100%", maxWidth: formHasOnlyJustification ? 720 : "100%" }}>
                  <div style={{ fontWeight: 700, color: "#2b2352", fontSize: 16, marginBottom: 6 }}>
                    Selected: {selectedRewardType.rewardName || "N/A"}
                  </div>
                </div>
 
                <div style={{ width: "100%", maxWidth: formHasOnlyJustification ? 720 : "100%" }}>
                  <label style={{ display: "block", fontWeight: 700, color: "#334155", marginBottom: 6 }}>
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
 
                {/* Parameters (if any) */}
                {parameters.length > 0 && (
                  <div style={{ width: "100%", maxWidth: 900 }}>
                    <div style={{ fontWeight: 700, color: "#2b2352", marginBottom: 8 }}>
                      Additional Information
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {parameters.map((param, idx) => (
                        <div key={param.parameterId ?? idx} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <label style={{ fontWeight: 600, color: "#334155" }}>
                            {idx + 1}. {param.parameterName} {param.isRequired ? <span style={{ color: "#ef4444" }}>*</span> : null}
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
 
          {/* Actions */}
          <div style={actionsAreaStyle}>
            <button type="button" onClick={handleClose} style={cancelBtnStyle}>
              Cancel
            </button>
            <button type="submit" style={submitBtnStyle} disabled={!selectedRewardType}>
              Submit Nomination
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
 
export default NominationModal;
 
 