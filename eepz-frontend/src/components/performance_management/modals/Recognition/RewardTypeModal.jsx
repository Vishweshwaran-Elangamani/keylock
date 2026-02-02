import React, { useState } from "react";
import "../../../../styles/performancemanagement/components/RewardTypeModal.css";

const RewardTypeModal = ({
  show,
  onClose,
  rewardTypeForm,
  setRewardTypeForm,
  onSubmit,
  isEditMode,
}) => {
  const [errors, setErrors] = useState({});

  if (!show) return null;

  const validateForm = () => {
    const newErrors = {};
    if (!rewardTypeForm.rewardName?.trim()) {
      newErrors.rewardName = "Recognition Name is required.";
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    onSubmit(e);
  };

  return (
    <div className="reward-type-overlay" onClick={onClose}>
      <div className="reward-type-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reward-type-header">
          <span className="reward-type-header-title">
            {isEditMode ? "Edit Recognition" : "Create Recognition"}
          </span>
        </div>
        <div className="reward-type-body">
          <form onSubmit={handleSubmit} autoComplete="off">


            <label className="reward-type-label">
              Recognition Name <span className="reward-type-required">*</span>
            </label>
            <input
              type="text"
              value={rewardTypeForm.rewardName}
              onChange={(e) =>
                setRewardTypeForm({
                  ...rewardTypeForm,
                  rewardName: e.target.value,
                })
              }
              placeholder="Type recognition name"
              className="reward-type-input"
            />
            {errors.rewardName && (
              <div className="reward-type-error">{errors.rewardName}</div>
            )}

            <label className="reward-type-label">Description</label>
            <textarea
              value={rewardTypeForm.description}
              onChange={(e) =>
                setRewardTypeForm({
                  ...rewardTypeForm,
                  description: e.target.value,
                })
              }
              placeholder="Type description (optional)"
              className="reward-type-textarea"
            />

            <div className="reward-type-action-row">
              <button
                type="button"
                onClick={onClose}
                className="reward-type-cancel-button"
              >
                Cancel
              </button>
              <button type="submit" className="reward-type-create-button">
                {isEditMode ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RewardTypeModal;
