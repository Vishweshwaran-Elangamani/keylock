import React from "react";
import "../../../../styles/performancemanagement/components/RewardTypeModal.module.css";


const RewardTypeModal = ({
  show,
  onClose,
  rewardTypeForm,
  setRewardTypeForm,
  onSubmit,
  isEditMode,
}) => {
  if (!show) return null;
  return (
    <div className="reward-type-overlay" onClick={onClose}>
      <div className="reward-type-modal" onClick={e => e.stopPropagation()}>
        <div className="reward-type-header">
          <span className="reward-type-header-title">{isEditMode ? "Edit Recognition" : "Create Recognition"}</span>
        </div>
        <div className="reward-type-body">
          <form onSubmit={onSubmit} autoComplete="off">
            <label className="reward-type-label">
              Recognition Name <span className="reward-type-required">*</span>
            </label>
            <input
              type="text"
              value={rewardTypeForm.rewardName}
              onChange={(e) => setRewardTypeForm({ ...rewardTypeForm, rewardName: e.target.value })}
              placeholder="Type recognition name"
              required
              className="reward-type-input"
            />
            <label className="reward-type-label">Description</label>
            <textarea
              value={rewardTypeForm.description}
              onChange={(e) => setRewardTypeForm({ ...rewardTypeForm, description: e.target.value })}
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
