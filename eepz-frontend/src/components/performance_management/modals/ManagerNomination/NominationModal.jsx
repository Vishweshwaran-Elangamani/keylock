import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import * as managerNominationApi from "../../../../services/performancemanagement/manager/managernominationapi";
import "../../../../styles/performancemanagement/components/NominationModal.module.css";

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


  useEffect(() => {
    if (show && selectedEmployee?.employeeId && managerId) {
      fetchEmployeeNominations();
    }
  }, [show, selectedEmployee, managerId]);

  const fetchEmployeeNominations = async () => {
    try {
      setLoadingNominations(true);
      const { data } = await managerNominationApi.getMyNominations(managerId);

      if (data?.success) {
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

  
  const isRewardAlreadyNominated = (rewardTypeId) => {
    return existingNominations.some(
      (nom) => nom.rewardTypeId === rewardTypeId
    );
  };

 
  const getNominatedRewardNames = () => {
    return existingNominations
      .map((nom) => {
        const reward = rewardTypes.find(
          (rt) => rt.rewardTypeId === nom.rewardTypeId
        );
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
    };

    switch (type) {
      case "text":
        return (
          <input
            type="text"
            {...commonProps}
            className="nomination-input-text"
          />
        );
      case "textarea":
        return (
          <textarea
            rows={3}
            {...commonProps}
            className="nomination-textarea"
          />
        );
      case "number":
      case "rating":
        return (
          <input
            type="number"
            {...commonProps}
            min={parameter.minimumValue ?? undefined}
            max={parameter.maximumValue ?? undefined}
            className="nomination-input-number"
          />
        );
      case "date":
        return (
          <input
            type="date"
            {...commonProps}
            className="nomination-input-text"
          />
        );
      default:
        return (
          <input
            type="text"
            {...commonProps}
            className="nomination-input-text"
          />
        );
    }
  };

  if (!show) return null;

  return (
    <div className="nomination-modal-overlay" onClick={handleClose}>
      <div
        className="nomination-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="nomination-modal-header">
          <div className="nomination-modal-header-left">
            <div className="nomination-modal-title">
              Nominate{" "}
              <span className="nomination-modal-employee-name">
                {selectedEmployee
                  ? `${selectedEmployee.firstName || ""} ${
                      selectedEmployee.lastName || ""
                    }`
                  : ""}
              </span>
            </div>
            <div className="nomination-modal-subtitle">
              Select a Recognition reward type and provide nomination details
            </div>
          </div>

          <button
            aria-label="Close"
            onClick={handleClose}
            className="nomination-modal-close-btn"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="nomination-modal-form">
          <div className="nomination-modal-body">
            {/* Warning banner if employee has existing nominations */}
            {existingNominations.length > 0 && (
              <div className="nomination-warning-banner">
                <i className="bi bi-exclamation-triangle-fill nomination-warning-icon"></i>
                <div className="nomination-warning-content">
                  <div className="nomination-warning-title">
                    Already Nominated
                  </div>
                  <div className="nomination-warning-text">
                    This employee has already been nominated for:{" "}
                    <strong>{getNominatedRewardNames()}</strong>
                    <br />
                    Please select a different award type.
                  </div>
                </div>
              </div>
            )}

            {/* Reward Type Selection */}
            {!selectedRewardType && (
              <div className="nomination-section">
                <label className="nomination-section-label">
                  Choose Recognition Reward Type{" "}
                  <span className="nomination-required">*</span>
                </label>

                {categoryRewards.length === 0 ? (
                  <div className="nomination-empty-state">
                    <div className="nomination-empty-icon-wrapper">
                      <i className="bi bi-award nomination-empty-icon"></i>
                    </div>
                    <div className="nomination-empty-title">
                      No Recognition Rewards Available
                    </div>
                    <div className="nomination-empty-description">
                      There are currently no active recognition reward types
                      configured for nominations. Please contact HR
                      administration for assistance.
                    </div>
                  </div>
                ) : (
                  <div className="nomination-reward-grid">
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
                          className={`nomination-reward-card ${
                            isActive
                              ? "active"
                              : isDisabled
                              ? "disabled"
                              : "inactive"
                          }`}
                          aria-pressed={isActive}
                          aria-disabled={isDisabled}
                        >
                          
                          {isDisabled && (
                            <div className="nomination-nominated-badge">
                              Nominated
                            </div>
                          )}

                          <div
                            className={`nomination-reward-name ${
                              isActive
                                ? "active"
                                : isDisabled
                                ? "disabled"
                                : ""
                            }`}
                          >
                            {reward?.rewardName || "Unnamed reward"}
                          </div>
                          {reward?.description && (
                            <div
                              className={`nomination-reward-description ${
                                isActive
                                  ? "active"
                                  : isDisabled
                                  ? "disabled"
                                  : ""
                              }`}
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

            {/* Selected Reward & Form Fields */}
            {selectedRewardType && (
              <div className="nomination-selected-section">
                {/* Selected Reward Badge */}
                <div className="nomination-selected-wrapper">
                  <div className="nomination-selected-badge">
                    <div className="nomination-selected-icon-wrapper">
                      <i className="bi bi-award-fill nomination-selected-icon"></i>
                    </div>
                    <div className="nomination-selected-content">
                      <div className="nomination-selected-label">
                        Selected Reward
                      </div>
                      <div className="nomination-selected-name">
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
                      className="nomination-change-btn"
                      aria-label="Change reward selection"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>

                {/* Justification */}
                <div className="nomination-field-wrapper">
                  <label className="nomination-field-label">
                    Justification{" "}
                    <span className="nomination-required">*</span>
                  </label>
                  <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Explain why this employee deserves this nomination..."
                    required
                    className="nomination-textarea"
                  />
                </div>

                {/* Additional Parameters */}
                {parameters.length > 0 && (
                  <div className="nomination-parameters-section">
                    <div className="nomination-parameters-title">
                      Additional Information
                    </div>
                    <div
                      className={`nomination-parameters-grid ${
                        parameters.length === 1
                          ? "single-column"
                          : "two-columns"
                      }`}
                    >
                      {parameters.map((param, idx) => (
                        <div
                          key={param.parameterId ?? idx}
                          className="nomination-parameter-field"
                        >
                          <label className="nomination-parameter-label">
                            {param.parameterName}{" "}
                            {param.isRequired ? (
                              <span className="nomination-required">*</span>
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

          {/* Footer */}
          <div className="nomination-modal-footer">
            <button
              type="button"
              onClick={handleClose}
              className="nomination-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="nomination-btn-submit"
              disabled={!selectedRewardType}
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
