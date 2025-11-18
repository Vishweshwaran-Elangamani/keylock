import React, { useState } from "react";
import { toast } from "react-toastify";
import * as managerNominationApi from "../../../../services/performancemanagement/manager/managernominationapi";
import '../../../../styles/performancemanagement/manager/ManagerNomination.css'


/**
 * NominationModal Component
 * Separate modal for nominating employees with reward types and parameters
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

  // Initialize with Recognition rewards on mount
  React.useEffect(() => {
    if (show && rewardTypes.length > 0) {
      const recognitionRewards = rewardTypes.filter(
        (rt) => rt?.rewardCategory === "Recognition"
      );
      setCategoryRewards(recognitionRewards);
    }
  }, [show, rewardTypes]);

  // Fetch parameters when reward type is selected
  const handleRewardTypeSelect = async (rewardTypeId) => {
    const rewardType = rewardTypes.find(
      (rt) => rt?.rewardTypeId === rewardTypeId
    );
    setSelectedRewardType(rewardType);
    setParameters([]);
    setParameterValues({});

    if (rewardTypeId) {
      try {
        const { data } =
          await managerNominationApi.getNominationParameters(rewardTypeId);
        if (data.success) {
          setParameters(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching parameters:", error);
        toast.error("Error loading parameters. Please try again.");
      }
    }
  };

  // Handle parameter value changes
  const handleParameterChange = (parameterId, value) => {
    setParameterValues({
      ...parameterValues,
      [parameterId]: value,
    });
  };

  // Reset form
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

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onHide();
  };

  // Submit nomination
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

  // Render parameter field based on type
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
            className="tlp-input"
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
            className="tlp-textarea"
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
            className="tlp-input"
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
            className="tlp-input"
          />
        );

      default:
        return null;
    }
  };

  if (!show) return null;

  return (
    <div className="tlp-modal-overlay" onClick={handleClose}>
      <div className="tlp-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="tlp-modal-header">
          <h3 className="tlp-modal-title">
            Nominate {selectedEmployee?.firstName || ""}{" "}
            {selectedEmployee?.lastName || ""}
          </h3>
          <p className="tlp-modal-subtitle">
            Select a Recognition reward type and fill in the details
          </p>
          <button className="tlp-modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tlp-modal-form">
          {/* Select Reward Type - Only Recognition */}
          {!selectedRewardType && (
            <div className="tlp-form-section">
              <label className="tlp-form-label">
                Select Recognition Reward <span className="tlp-required">*</span>
              </label>

              <div className="tlp-reward-grid">
                {categoryRewards.map((reward) => (
                  <div
                    key={reward?.rewardTypeId}
                    onClick={() =>
                      handleRewardTypeSelect(reward?.rewardTypeId)
                    }
                    className="tlp-reward-card"
                  >
                    <div className="tlp-reward-name">
                      {reward?.rewardName || "N/A"}
                    </div>
                    {reward?.description && (
                      <div className="tlp-reward-desc">
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
              <div className="tlp-selected-info">
                <strong>Selected:</strong>{" "}
                {selectedRewardType?.rewardName || "N/A"}
              </div>

              <div className="tlp-form-section">
                <label className="tlp-form-label">
                  Justification <span className="tlp-required">*</span>
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explain why this employee deserves this nomination..."
                  required
                  className="tlp-textarea"
                />
              </div>

              {/* Parameters */}
              {parameters.length > 0 && (
                <div className="tlp-form-section">
                  <h4 className="tlp-parameters-title">
                    Additional Information ({parameters.length} fields)
                  </h4>

                  {parameters.map((parameter, index) => (
                    <div
                      key={parameter?.parameterId || index}
                      className="tlp-parameter-field"
                    >
                      <label className="tlp-form-label">
                        {index + 1}. {parameter?.parameterName || "N/A"}
                        {parameter?.isRequired && (
                          <span className="tlp-required"> *</span>
                        )}
                        <span className="tlp-parameter-type">
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

          {/* Submit Buttons */}
          <div className="tlp-modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="tlp-cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedRewardType}
              className="tlp-submit-button"
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
