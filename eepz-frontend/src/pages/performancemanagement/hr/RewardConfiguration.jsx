import React, { useState, useEffect } from "react";
import { getRewardTypes, getParametersByRewardType, createRewardType, updateRewardType, createParameter, deleteParameter } from "../../../services/performancemanagement/api/nominationapi";
import RewardTypeModal from "../../../components/performance_management/modals/Recognition/RewardTypeModal";
import ParameterModal from "../../../components/performance_management/modals/Recognition/ParameterModal";
import DeleteConfirmModal from "../../../components/performance_management/modals/Recognition/DeleteConfirmModal";
import StatusConfirmModal from "../../../components/performance_management/modals/Recognition/StatusConfirmModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../components/common/Breadcrumb";
import styles from "../../../styles/performancemanagement/hr/RewardConfiguration.module.css";

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
    if (!selectedRewardType) {
      toast.error("No reward type selected");
      setShowDeleteModal(false);
      return;
    }

    try {
      if (deleteType === "parameter") {
        await deleteParameter(toDeleteId);

        toast.success("Parameter deleted successfully");

        setParameters(prevParams =>
          prevParams.filter(param => param.parameterId !== toDeleteId)
        );

        setParameterCounts(prev => ({
          ...prev,
          [selectedRewardType.rewardTypeId]: Math.max((prev[selectedRewardType.rewardTypeId] || 1) - 1, 0)
        }));
      }
    } catch (error) {
      console.error("Delete error:", error);

      if (error?.response?.status === 200 || error?.response?.status === 204) {
        toast.success("Parameter deleted successfully");

        setParameters(prevParams =>
          prevParams.filter(param => param.parameterId !== toDeleteId)
        );

        setParameterCounts(prev => ({
          ...prev,
          [selectedRewardType.rewardTypeId]: Math.max((prev[selectedRewardType.rewardTypeId] || 1) - 1, 0)
        }));
      } else {
        toast.error(error?.response?.data?.message || "Error deleting parameter");
      }
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
        <div className={styles.rewardDetailsTitleRow}>
          <div className={styles.rewardDetailsTitle}>
            {selectedRewardType.rewardName}
          </div>
          <span className={styles.rewardCategoryBadge}>Recognition</span>
          <button onClick={openParameterModal} className={styles.addParameterBtn}>
            + Add Parameter
          </button>
        </div>
        <div
          className={styles.rewardDescription}
          style={{ minHeight: needsCollapse ? 75 : "auto" }}
        >
          <span>
            {visibleDesc}
            {showReadMore && !descExpanded && <span className={styles.ellipsis}>...</span>}
            {showReadMore && (
              <button onClick={() => setDescExpanded((e) => !e)} className={styles.readMoreBtn}>
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
      <button
        onClick={onClick}
        className={styles.chooseBtn}
        title="Select Reward Type"
      >
        <i className="bi bi-plus-circle"></i>
      </button>
    );
  }

  return (
    <div className={styles.rewardConfigContainer}>
      <div className={styles.rewardConfigHeader}>
        <Breadcrumb
          items={[
            { label: "Performance", path: "/hr/dashboard/performance" },
            { label: "Rewards", path: null }
          ]}
        />

        <button
          onClick={openAddRewardTypeModal}
          className={styles.createRewardBtn}
          title="Create a new Reward Type"
        >
          <i className="bi bi-plus-circle"></i>
          Create Reward Type
        </button>
      </div>

      <div className={styles.rewardConfigContent}>
        {/*Reward List */}
        <div className={styles.rewardListPanel}>
          <div className={styles.rewardListHeader}>
            <div className={styles.tabToggleContainer}>
              <button
                onClick={() => setActiveTab("Active")}
                className={`${styles.tabToggleBtn} ${activeTab === "Active" ? styles.active : styles.inactive}`}
              >
                Active ({activeRewardTypes.length})
              </button>
              <button
                onClick={() => setActiveTab("Inactive")}
                className={`${styles.tabToggleBtn} ${activeTab === "Inactive" ? styles.active : styles.inactive}`}
              >
                Inactive ({inactiveRewardTypes.length})
              </button>
            </div>

            {activeTab === "Active" && activeRewardTypes.length > 0 && (
              <div className={styles.visibilityWrapper}>
                <span className={styles.visibilityLabel}>Manager Visibility:</span>
                <button
                  onClick={handleBulkToggleActiveRewards}
                  className={`${styles.visibilityToggle} ${allActiveVisible ? styles.visible : styles.hidden}`}
                  title={allActiveVisible ? "Hide all active rewards from managers" : "Show all active rewards to managers"}
                >
                  <div className={`${styles.visibilityIndicator} ${allActiveVisible ? styles.visible : styles.hidden}`}>
                    <i className={allActiveVisible ? "bi bi-eye-fill" : "bi bi-eye-slash-fill"} />
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className={styles.rewardListContent}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={`spinner-border ${styles.loadingSpinner}`}></div>
                <div className={styles.loadingText}>Loading...</div>
              </div>
            ) : displayedRewards.length === 0 ? (
              <div className={styles.emptyState}>
                No {activeTab.toLowerCase()} rewards
              </div>
            ) : (
              displayedRewards.map((rt) => (
                <div
                  key={rt.rewardTypeId}
                  className={`${styles.rewardCard} ${selectedRewardType?.rewardTypeId === rt.rewardTypeId ? styles.selected : ""}`}
                >
                  <div className={styles.rewardCardContent}>
                    <div className={styles.rewardCardTitle}>{rt.rewardName}</div>
                    <div className={styles.rewardCardDesc}>
                      {rt.description || "—"}
                    </div>
                    <div className={styles.rewardCardTags}>
                      <span className={styles.paramCount}>
                        {getParameterCount(rt.rewardTypeId)} parameters
                      </span>
                      <span className={`${styles.statusBadge} ${rt.isActive ? styles.active : styles.inactive}`}>
                        {rt.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className={styles.rewardCardActions}>
                    <button
                      onClick={() => openEditRewardTypeModal(rt)}
                      title="Edit Reward Type"
                      className={`${styles.actionBtn} ${styles.edit}`}
                    >
                      <i className="bi bi-pencil-square" />
                    </button>
                    <button
                      onClick={() => confirmStatusChange(rt)}
                      title={rt.isActive ? "Deactivate Reward Type" : "Activate Reward Type"}
                      className={`${styles.actionBtn} ${styles.toggle} ${rt.isActive ? styles.deactivate : ""}`}
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

        {/* Right Panel - Details */}
        <div className={styles.rewardDetailsPanel}>
          <div className={styles.rewardDetailsHeader}></div>
          <div className={styles.rewardDetailsContent}>
            {selectedRewardType ? (
              <>
                <div style={{ marginTop: 0 }}>{renderRewardDetails()}</div>
                <div className={styles.spacer14} />
                {parameters.length === 0 ? (
                  <div className={styles.noParamsEmpty}>
                    <div className={styles.noParamsTitle}>No parameters configured</div>
                    <div className={styles.noParamsSubtitle}>
                      Add parameters to customize nomination forms
                    </div>
                  </div>
                ) : (
                  <table className={styles.paramsTable}>
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
                          <td className={styles.paramName}>{param.parameterName}</td>
                          <td className={styles.paramType}>{param.parameterType}</td>
                          <td className={styles.paramRequired}>
                            {param.isRequired ? (
                              <span className={styles.requiredYes}>Yes</span>
                            ) : (
                              <span className={styles.requiredNo}>No</span>
                            )}
                          </td>
                          <td className={styles.paramOrder}>{param.sortOrder}</td>
                          <td>
                            <button
                              onClick={() => confirmDelete(param.parameterId, "parameter")}
                              className={styles.deleteBtn}
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
              <div className={styles.selectEmpty}>
                <div className={styles.selectTitle}>
                  Select a recognition reward to view parameters
                </div>
                <div className={styles.selectSubtitle}>Choose from Active or Inactive rewards</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
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
