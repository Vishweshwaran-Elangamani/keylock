import React, { useState, useEffect } from "react";
import { getRewardTypes, getParametersByRewardType, createRewardType, updateRewardType, createParameter, deleteParameter } from "../../../services/performancemanagement/api/nominationapi";
import RewardTypeModal from "../../../components/performance_management/modals/Recognition/RewardTypeModal";
import ParameterModal from "../../../components/performance_management/modals/Recognition/ParameterModal";
import DeleteConfirmModal from "../../../components/performance_management/modals/Recognition/DeleteConfirmModal";
import StatusConfirmModal from "../../../components/performance_management/modals/Recognition/StatusConfirmModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../components/common/Breadcrumb";
import "../../../styles/performancemanagement/hr/RewardConfiguration.css";

function RewardConfiguration() {
  const [rewardTypes, setRewardTypes] = useState([]);
  const [selectedRewardType, setSelectedRewardType] = useState(null);
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRewardTypeModal, setShowRewardTypeModal] = useState(false);
  const [showParameterModal, setShowParameterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusActionType, setStatusActionType] = useState("");
  const [rewardTypeForStatus, setRewardTypeForStatus] = useState(null);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [deleteType, setDeleteType] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRewardTypeId, setEditingRewardTypeId] = useState(null);
  const [parameterCounts, setParameterCounts] = useState({});

  const [rewardTypeForm, setRewardTypeForm] = useState({
    rewardCategory: "Recognition",
    rewardName: "",
    description: "",
    isVisibleForManagerNomination: false,
  });
  const [parameterForm, setParameterForm] = useState({
    parameterName: "",
    parameterType: "Text",
    isRequired: true,
    placeholderText: "",
    minimumValue: "",
    maximumValue: "",
    sortOrder: 1,
  });
  const [activeTab, setActiveTab] = useState("Active");
  const [descExpanded, setDescExpanded] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchRewardTypes();
  }, []);

  useEffect(() => {
    if (rewardTypes.length > 0) {
      fetchAllParameterCounts();
    }
  }, [rewardTypes]);

  const fetchRewardTypes = async () => {
    setLoading(true);
    try {
      const response = await getRewardTypes(false);
      if (response.data.success) {
        setRewardTypes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching reward types:", error);
      toast.error("Failed to fetch reward types");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllParameterCounts = async () => {
    const counts = {};
    try {
      await Promise.all(
        rewardTypes.map(async (rt) => {
          const response = await getParametersByRewardType(rt.rewardTypeId);
          if (response.data.success) {
            counts[rt.rewardTypeId] = response.data.data.length;
          }
        })
      );
      setParameterCounts(counts);
    } catch (error) {
      console.error("Failed to fetch parameter counts", error);
    }
  };

  const fetchParameters = async (rewardTypeId) => {
    try {
      const response = await getParametersByRewardType(rewardTypeId);
      if (response.data.success) {
        setParameters(response.data.data);
        setParameterCounts(prev => ({
          ...prev,
          [rewardTypeId]: response.data.data.length
        }));
      }
    } catch (error) {
      toast.error("Failed to fetch parameters");
    }
  };

  const openAddRewardTypeModal = () => {
    setIsEditMode(false);
    setEditingRewardTypeId(null);
    setRewardTypeForm({
      rewardCategory: "Recognition",
      rewardName: "",
      description: "",
      isVisibleForManagerNomination: false,
    });
    setShowRewardTypeModal(true);
  };

  const openEditRewardTypeModal = (rt) => {
    setIsEditMode(true);
    setEditingRewardTypeId(rt.rewardTypeId);
    setRewardTypeForm({
      rewardCategory: rt.rewardCategory,
      rewardName: rt.rewardName,
      description: rt.description || "",
      isVisibleForManagerNomination: rt.isVisibleForManagerNomination || false,
    });
    setShowRewardTypeModal(true);
  };

  const closeRewardTypeModal = () => setShowRewardTypeModal(false);

  const openParameterModal = () => {
    if (!selectedRewardType) {
      toast.warning("Please select a reward type first");
      return;
    }
    setParameterForm({
      parameterName: "",
      parameterType: "Text",
      isRequired: true,
      placeholderText: "",
      minimumValue: "",
      maximumValue: "",
      sortOrder: parameters.length + 1,
    });
    setShowParameterModal(true);
  };

  const closeParameterModal = () => setShowParameterModal(false);

  const handleCreateOrUpdateRewardType = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        const response = await updateRewardType(editingRewardTypeId, rewardTypeForm);
        if (response.data.success) {
          toast.success("Reward type updated successfully!");
          closeRewardTypeModal();
          fetchRewardTypes();
        }
      } else {
        const response = await createRewardType({
          ...rewardTypeForm,
          createdBy: 1,
        });
        if (response.data.success) {
          toast.success("Reward type created successfully!");
          closeRewardTypeModal();
          fetchRewardTypes();
        }
      }
    } catch {
      toast.error(`Error ${isEditMode ? "updating" : "creating"} reward type`);
    }
  };

  const handleToggleActive = async (rewardType) => {
    try {
      const response = await updateRewardType(rewardType.rewardTypeId, {
        rewardName: rewardType.rewardName,
        description: rewardType.description || "",
        isActive: !rewardType.isActive,
        isVisibleForManagerNomination: rewardType.isVisibleForManagerNomination || false
      });
      
      if (response.data.success) {
        toast.success(`Reward type ${rewardType.isActive ? "deactivated" : "activated"} successfully!`);
        fetchRewardTypes();
        if (selectedRewardType?.rewardTypeId === rewardType.rewardTypeId) {
          setSelectedRewardType(null);
          setParameters([]);
        }
      }
    } catch (error) {
      console.error("Toggle error:", error);
      toast.error("Error updating reward type");
    }
  };

  const handleBulkToggleActiveRewards = async () => {
    const activeRewards = rewardTypes.filter((rt) => rt.isActive === true);
    
    if (activeRewards.length === 0) {
      toast.warning("No active rewards to toggle");
      return;
    }
  
    const allVisible = activeRewards.every((rt) => rt.isVisibleForManagerNomination === true);
    const newVisibility = !allVisible;
  
    try {
      const updatePromises = activeRewards.map((rt) =>
        updateRewardType(rt.rewardTypeId, {
          rewardName: rt.rewardName,
          description: rt.description || "",
          isActive: rt.isActive,
          isVisibleForManagerNomination: newVisibility,
        })
      );
  
      await Promise.all(updatePromises);
      
      toast.success(
        `All active rewards ${newVisibility ? "now visible to" : "hidden from"} managers!`
      );
      fetchRewardTypes();
    } catch (error) {
      console.error("Bulk toggle error:", error);
      toast.error("Error updating bulk visibility");
    }
  };

  const handleCreateParameter = async (e) => {
    e.preventDefault();
    if (!selectedRewardType) {
      toast.warning("Please select a reward type first");
      return;
    }
    try {
      const response = await createParameter({
        ...parameterForm,
        rewardTypeId: selectedRewardType.rewardTypeId,
        minimumValue: parameterForm.minimumValue ? parseInt(parameterForm.minimumValue) : null,
        maximumValue: parameterForm.maximumValue ? parseInt(parameterForm.maximumValue) : null,
      });
      if (response.data.success) {
        toast.success("Parameter created successfully!");
        closeParameterModal();
        await fetchParameters(selectedRewardType.rewardTypeId);
      }
    } catch {
      toast.error("Error creating parameter");
    }
  };

  const confirmDelete = (id, type) => {
    setToDeleteId(id);
    setDeleteType(type);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteType === "parameter") {
        const response = await deleteParameter(toDeleteId);
        if (response.data.success) {
          toast.success("Parameter deleted successfully");
          await fetchParameters(selectedRewardType.rewardTypeId);
        }
      }
    } catch {
      toast.error("Error deleting");
    } finally {
      setShowDeleteModal(false);
      setToDeleteId(null);
      setDeleteType("");
    }
  };

  const confirmStatusChange = (rt) => {
    setRewardTypeForStatus(rt);
    setStatusActionType(rt.isActive ? "deactivate" : "activate");
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async () => {
    await handleToggleActive(rewardTypeForStatus);
    setShowStatusModal(false);
  };

  const activeRewardTypes = rewardTypes.filter((rt) => rt.isActive === true);
  const inactiveRewardTypes = rewardTypes.filter((rt) => rt.isActive === false);
  const displayedRewards = activeTab === "Active" ? activeRewardTypes : inactiveRewardTypes;

  const allActiveVisible = activeRewardTypes.length > 0 && activeRewardTypes.every((rt) => rt.isVisibleForManagerNomination === true);

  const getParameterCount = (rewardTypeId) => {
    return parameterCounts[rewardTypeId] ?? 0;
  };

  const PREVIEW_CHAR_LIMIT = 280;

  function renderRewardDetails() {
    if (!selectedRewardType) return null;
    const desc = selectedRewardType.description || "No description provided";
    const needsCollapse = desc.length > PREVIEW_CHAR_LIMIT;
    const visibleDesc = descExpanded ? desc : desc.slice(0, PREVIEW_CHAR_LIMIT);
    const showReadMore = needsCollapse;

    return (
      <>
        <div className="rc-reward-details-header">
          <div className="rc-reward-title-container">
            <div className="rc-reward-name">{selectedRewardType.rewardName}</div>
            <span className="rc-reward-category-badge">Recognition</span>
          </div>
          <button onClick={openParameterModal} className="rc-add-parameter-btn">
            + Add Parameter
          </button>
        </div>
        <div className="rc-reward-description">
          <span>
            {visibleDesc}
            {showReadMore && !descExpanded && <span className="rc-ellipsis">...</span>}
            {showReadMore && (
              <button
                onClick={() => setDescExpanded((e) => !e)}
                className="rc-read-more-btn"
              >
                {descExpanded ? "Read Less" : "Read More"}
              </button>
            )}
          </span>
        </div>
      </>
    );
  }

  function ChooseButton({ onClick }) {
    return (
      <button onClick={onClick} className="rc-choose-btn" title="Select Reward Type">
        <i className="bi bi-plus-circle"></i>
      </button>
    );
  }

  return (
    <div className="rc-container">
      <div className="rc-header">
        <Breadcrumb
          items={[
            { label: "Dashboard", path: "/hr/dashboard" },
            { label: "Performance", path: "/hr/dashboard/performance" },
            { label: "Rewards", path: null }
          ]}
        />

        <button onClick={openAddRewardTypeModal} className="rc-create-reward-btn" title="Create a new Reward Type">
          <i className="bi bi-plus-circle"></i>
          Create Reward Type
        </button>
      </div>

      <div className="rc-main-content">
        <div className="rc-left-panel">
          <div className="rc-tab-header">
            <div className="rc-tab-buttons">
              <button
                onClick={() => setActiveTab("Active")}
                className={`rc-tab-btn ${activeTab === "Active" ? "rc-tab-btn-active" : ""}`}
              >
                Active ({activeRewardTypes.length})
              </button>
              <button
                onClick={() => setActiveTab("Inactive")}
                className={`rc-tab-btn ${activeTab === "Inactive" ? "rc-tab-btn-active" : ""}`}
              >
                Inactive ({inactiveRewardTypes.length})
              </button>
            </div>

            {activeTab === "Active" && activeRewardTypes.length > 0 && (
              <div className="rc-visibility-toggle">
                <span className="rc-visibility-label">Manager Visibility:</span>
                <button
                  onClick={handleBulkToggleActiveRewards}
                  className={`rc-toggle-switch ${allActiveVisible ? "rc-toggle-on" : "rc-toggle-off"}`}
                  title={allActiveVisible ? "Hide all active rewards from managers" : "Show all active rewards to managers"}
                >
                  <div className="rc-toggle-knob">
                    <i className={allActiveVisible ? "bi bi-eye-fill" : "bi bi-eye-slash-fill"} />
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="rc-rewards-list">
            {loading ? (
              <div className="rc-loading-state">
                <div className="spinner-border"></div>
                <div className="rc-loading-text">Loading...</div>
              </div>
            ) : displayedRewards.length === 0 ? (
              <div className="rc-empty-state">
                No {activeTab.toLowerCase()} rewards
              </div>
            ) : (
              displayedRewards.map((rt) => (
                <div
                  key={rt.rewardTypeId}
                  className={`rc-reward-card ${selectedRewardType?.rewardTypeId === rt.rewardTypeId ? "rc-reward-card-selected" : ""}`}
                >
                  <div className="rc-reward-card-content">
                    <div className="rc-reward-card-title">{rt.rewardName}</div>
                    <div className="rc-reward-card-description">{rt.description || "—"}</div>
                    <div className="rc-reward-card-badges">
                      <span className="rc-param-count-badge">
                        {getParameterCount(rt.rewardTypeId)} parameters
                      </span>
                      <span className={`rc-status-badge ${rt.isActive ? "rc-status-active" : "rc-status-inactive"}`}>
                        {rt.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="rc-reward-card-actions">
                    <button
                      onClick={() => openEditRewardTypeModal(rt)}
                      title="Edit Reward Type"
                      className="rc-action-btn rc-edit-btn"
                    >
                      <i className="bi bi-pencil-square" />
                    </button>
                    <button
                      onClick={() => confirmStatusChange(rt)}
                      title={rt.isActive ? "Deactivate Reward Type" : "Activate Reward Type"}
                      className={`rc-action-btn ${rt.isActive ? "rc-deactivate-btn" : "rc-activate-btn"}`}
                    >
                      <i className={rt.isActive ? "bi bi-x-circle" : "bi bi-check2-circle"} />
                    </button>
                    <ChooseButton
                      onClick={() => {
                        setSelectedRewardType(rt);
                        fetchParameters(rt.rewardTypeId);
                        setDescExpanded(false);
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rc-right-panel">
          <div className="rc-parameters-section">
            {selectedRewardType ? (
              <>
                <div className="rc-parameters-header">{renderRewardDetails()}</div>
                <div className="rc-parameters-spacer" />
                {parameters.length === 0 ? (
                  <div className="rc-no-parameters">
                    <div className="rc-no-parameters-title">No parameters configured</div>
                    <div className="rc-no-parameters-subtitle">
                      Add parameters to customize nomination forms
                    </div>
                  </div>
                ) : (
                  <table className="rc-parameters-table">
                    <thead>
                      <tr>
                        <th>Parameter Name</th>
                        <th>Type</th>
                        <th>Required</th>
                        <th>Order</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parameters.map((param) => (
                        <tr key={param.parameterId}>
                          <td><strong>{param.parameterName}</strong></td>
                          <td>{param.parameterType}</td>
                          <td>
                            {param.isRequired ? (
                              <span className="rc-required-yes">Yes</span>
                            ) : (
                              <span className="rc-required-no">No</span>
                            )}
                          </td>
                          <td>{param.sortOrder}</td>
                          <td>
                            <button
                              onClick={() => confirmDelete(param.parameterId, "parameter")}
                              className="rc-delete-param-btn"
                              title="Delete Parameter"
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            ) : (
              <div className="rc-no-selection">
                <div className="rc-no-selection-title">
                  Select a recognition reward to view parameters
                </div>
                <div className="rc-no-selection-subtitle">Choose from Active or Inactive rewards</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRewardTypeModal && (
        <RewardTypeModal
          show={showRewardTypeModal}
          onClose={() => setShowRewardTypeModal(false)}
          rewardTypeForm={rewardTypeForm}
          setRewardTypeForm={setRewardTypeForm}
          onSubmit={handleCreateOrUpdateRewardType}
          isEditMode={isEditMode}
        />
      )}
      {showParameterModal && (
        <ParameterModal
          show={showParameterModal}
          onClose={closeParameterModal}
          parameterForm={parameterForm}
          setParameterForm={setParameterForm}
          onSubmit={handleCreateParameter}
        />
      )}
      {showDeleteModal && (
        <DeleteConfirmModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          message={
            deleteType === "rewardType"
              ? "Are you sure you want to delete this reward type?"
              : "Are you sure you want to delete this parameter?"
          }
        />
      )}
      <StatusConfirmModal
        show={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleConfirmStatusChange}
        actionType={statusActionType}
        rewardName={rewardTypeForStatus?.rewardName}
      />
    </div>
  );
}

export default RewardConfiguration;
