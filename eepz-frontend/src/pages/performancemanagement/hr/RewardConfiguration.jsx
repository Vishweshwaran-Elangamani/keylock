import React, { useState, useEffect } from "react";
import * as api from "../../../services/performancemanagement/hr/api";
import RewardTypeModal from "../../../components/performance_management/modals/Recognition/RewardTypeModal";
import ParameterModal from "../../../components/performance_management/modals/Recognition/ParameterModal";
import DeleteConfirmModal from "../../../components/performance_management/modals/Recognition/DeleteConfirmModal";
import StatusConfirmModal from "../../../components/performance_management/modals/Recognition/StatusConfirmModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  // ✅ NEW: Store parameter counts for all reward types
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

  // ✅ NEW: Fetch parameter counts for all reward types
  useEffect(() => {
    if (rewardTypes.length > 0) {
      fetchAllParameterCounts();
    }
  }, [rewardTypes]);

  const fetchRewardTypes = async () => {
    setLoading(true);
    try {
      const { data } = await api.getRewardTypes(false);
      if (data.success) setRewardTypes(data.data);
    } catch (error) {
      toast.error("Failed to fetch reward types");
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Fetch parameter counts for all rewards
  const fetchAllParameterCounts = async () => {
    const counts = {};
    try {
      await Promise.all(
        rewardTypes.map(async (rt) => {
          const { data } = await api.getParametersByRewardType(rt.rewardTypeId);
          if (data.success) {
            counts[rt.rewardTypeId] = data.data.length;
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
      const { data } = await api.getParametersByRewardType(rewardTypeId);
      if (data.success) {
        setParameters(data.data);
        // ✅ Update the count for this specific reward type
        setParameterCounts(prev => ({
          ...prev,
          [rewardTypeId]: data.data.length
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
        const { data } = await api.updateRewardType(editingRewardTypeId, rewardTypeForm);
        if (data.success) {
          toast.success("Reward type updated successfully!");
          closeRewardTypeModal();
          fetchRewardTypes();
        }
      } else {
        const { data } = await api.createRewardType({
          ...rewardTypeForm,
          createdBy: 1,
        });
        if (data.success) {
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
      const { data } = await api.updateRewardType(rewardType.rewardTypeId, {
        ...rewardType,
        isActive: !rewardType.isActive,
      });
      if (data.success) {
        toast.success(`Reward type ${rewardType.isActive ? "deactivated" : "activated"} successfully!`);
        fetchRewardTypes();
        if (selectedRewardType?.rewardTypeId === rewardType.rewardTypeId) {
          setSelectedRewardType(null);
          setParameters([]);
        }
      }
    } catch {
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
        api.updateRewardType(rt.rewardTypeId, {
          ...rt,
          isVisibleForManagerNomination: newVisibility,
        })
      );

      await Promise.all(updatePromises);
      
      toast.success(
        `All active rewards ${newVisibility ? "now visible to" : "hidden from"} managers!`
      );
      fetchRewardTypes();
    } catch {
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
      const { data } = await api.createParameter({
        ...parameterForm,
        rewardTypeId: selectedRewardType.rewardTypeId,
        minimumValue: parameterForm.minimumValue ? parseInt(parameterForm.minimumValue) : null,
        maximumValue: parameterForm.maximumValue ? parseInt(parameterForm.maximumValue) : null,
      });
      if (data.success) {
        toast.success("Parameter created successfully!");
        closeParameterModal();
        // ✅ Refresh parameters for selected reward type
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
        const { data } = await api.deleteParameter(toDeleteId);
        if (data.success) {
          toast.success("Parameter deleted successfully");
          // ✅ Refresh parameters for selected reward type
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

  // ✅ UPDATED: Get parameter count from cached state
  const getParameterCount = (rewardTypeId) => {
    return parameterCounts[rewardTypeId] ?? 0;
  };

  const RL_PURPLE = "#97247e";
  const RL_DARK = "#27235c";
  const RL_BG = "#f8f9fc";
  const RL_BORDER = "#27235c";
  const BTN_RADIUS = "7px";
  const PREVIEW_CHAR_LIMIT = 280;

  function renderRewardDetails() {
    if (!selectedRewardType) return null;
    const desc = selectedRewardType.description || "No description provided";
    const needsCollapse = desc.length > PREVIEW_CHAR_LIMIT;
    const visibleDesc = descExpanded ? desc : desc.slice(0, PREVIEW_CHAR_LIMIT);
    const showReadMore = needsCollapse;

    return (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: "18px",
              color: RL_DARK,
              fontFamily: "Montserrat, Nunito, sans-serif",
              textAlign: "left",
              minWidth: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selectedRewardType.rewardName}
          </div>
          <span
            style={{
              background: "#F3EBFA",
              color: RL_PURPLE,
              fontWeight: 700,
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: 8,
              marginLeft: 4,
              display: "inline-block",
            }}
          >
            Recognition
          </span>
          <button
            onClick={openParameterModal}
            style={{
              marginLeft: "auto",
              padding: "6px 14px",
              background: "linear-gradient(90deg, #97247e 0%, #e01950 100%)",
              color: "#fff",
              borderRadius: BTN_RADIUS,
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              fontSize: 12,
              height: 28,
              boxShadow: "0 1px 4px rgba(39,35,92,0.08)",
              whiteSpace: "nowrap",
            }}
          >
            + Add Parameter
          </button>
        </div>
        <div
          style={{
            fontSize: "13px",
            color: "#8886b3",
            marginTop: 6,
            maxWidth: "100%",
            textAlign: "justify",
            lineHeight: 1.6,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            minHeight: needsCollapse ? 75 : "auto",
          }}
        >
          <span>
            {visibleDesc}
            {showReadMore && !descExpanded && <span style={{ color: RL_PURPLE }}>...</span>}
            {showReadMore && (
              <button
                onClick={() => setDescExpanded((e) => !e)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: RL_PURPLE,
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  outline: "none",
                  padding: 0,
                  whiteSpace: "nowrap",
                  marginLeft: 2,
                }}
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
      <button
        onClick={onClick}
        className="choose-btn"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1.3px solid ${RL_PURPLE}`,
          background: "#fff",
          color: RL_PURPLE,
          fontWeight: 700,
          borderRadius: "50%",
          width: 32,
          height: 32,
          fontSize: 15,
          cursor: "pointer",
          transition: "box-shadow 0.15s",
          marginLeft: 5,
        }}
        title="Select Reward Type"
      >
        <i className="bi bi-plus-circle"></i>
      </button>
    );
  }

  return (
    <div style={{ background: RL_BG, minHeight: "100vh", minWidth: 0 }}>
      <div
        style={{
          padding: "16px 28px 0 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: RL_BG,
          gap: 10,
          marginBottom: "1.2rem",
        }}
      >
        <nav className="cg-breadcrumbs" aria-label="breadcrumb" style={{ marginBottom: 0, background: "transparent" }}>
          <style>
            {`
              .cg-breadcrumb-item + .cg-breadcrumb-item::before {
                content: "/";
                margin: 0 0.25rem;
                color: #888;
                font-weight: normal;
              }
            `}
          </style>
          <ol className="cg-breadcrumb" style={{ margin: 0, padding: 0, listStyle: "none", display: "flex" }}>
            <li
              className="cg-breadcrumb-item"
              onClick={() => navigate("/hr/dashboard")}
              style={{ cursor: "pointer" }}
            >
              <i className="bi bi-house-door"></i>
            </li>
            <li
              className="cg-breadcrumb-item"
              onClick={() => navigate("/hr/dashboard/performance")}
              style={{ cursor: "pointer" }}
            >
              Performance
            </li>
            <li className="cg-breadcrumb-item active" aria-current="page">
              Rewards
            </li>
          </ol>
        </nav>

        <button
          onClick={openAddRewardTypeModal}
          style={{
            padding: "8px 16px",
            background: "linear-gradient(90deg, #97247e 0%, #e01950 100%)",
            color: "#fff",
            borderRadius: BTN_RADIUS,
            fontWeight: "700",
            fontSize: "13px",
            border: "none",
            boxShadow: "0 1.5px 6px rgba(151,36,126,0.12)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 32,
          }}
          title="Create a new Reward Type"
        >
          <i className="bi bi-plus-circle" style={{ fontSize: "15px" }}></i>
          Create Reward Type
        </button>
      </div>

      <div
        style={{
          margin: "0 auto",
          maxWidth: 1500,
          background: RL_BG,
          minHeight: "100vh",
          display: "flex",
          gap: "24px",
          padding: "0 32px 32px 32px",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            flex: 1.3,
            background: "#fff",
            borderRadius: 12,
            marginTop: 0,
            border: `1px solid ${RL_BORDER}`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            minHeight: 480,
            maxHeight: "75vh",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "14px 18px 8px 18px",
              borderRadius: "12px 12px 0 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                background: RL_DARK,
                padding: "5px",
                borderRadius: "40px",
                display: "inline-flex",
                gap: "5px",
              }}
            >
              <button
                onClick={() => setActiveTab("Active")}
                style={{
                  padding: "8px 26px",
                  background: activeTab === "Active" ? "#fff" : "transparent",
                  color: activeTab === "Active" ? RL_DARK : "#fff",
                  borderRadius: "40px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.18s ease",
                  whiteSpace: "nowrap",
                }}
              >
                Active ({activeRewardTypes.length})
              </button>
              <button
                onClick={() => setActiveTab("Inactive")}
                style={{
                  padding: "8px 26px",
                  background: activeTab === "Inactive" ? "#fff" : "transparent",
                  color: activeTab === "Inactive" ? RL_DARK : "#fff",
                  borderRadius: "40px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.18s ease",
                  whiteSpace: "nowrap",
                }}
              >
                Inactive ({inactiveRewardTypes.length})
              </button>
            </div>

            {activeTab === "Active" && activeRewardTypes.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ 
                  fontSize: "11px", 
                  fontWeight: "600", 
                  color: "#666",
                  whiteSpace: "nowrap" 
                }}>
                  Manager Visibility:
                </span>
                <button
                  onClick={handleBulkToggleActiveRewards}
                  style={{
                    width: "44px",
                    height: "22px",
                    borderRadius: "11px",
                    border: "none",
                    background: allActiveVisible ? "#10b981" : "#ef4444",
                    position: "relative",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                    flexShrink: 0
                  }}
                  title={allActiveVisible ? "Hide all active rewards from managers" : "Show all active rewards to managers"}
                >
                  <div style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#fff",
                    position: "absolute",
                    top: "3px",
                    left: allActiveVisible ? "25px" : "3px",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    color: allActiveVisible ? "#10b981" : "#ef4444",
                    fontWeight: "700",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                  }}>
                    <i className={allActiveVisible ? "bi bi-eye-fill" : "bi bi-eye-slash-fill"} />
                  </div>
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "6px 16px 14px 18px",
              minHeight: 0,
              maxHeight: "calc(75vh - 70px)",
            }}
          >
            {loading ? (
              <div style={{ textAlign: "center", color: "#aaa", padding: "36px 3px 14px 4px" }}>
                <div className="spinner-border" style={{ width: 18, height: 18 }}></div>
                <div style={{ fontSize: 12, marginTop: 5 }}>Loading...</div>
              </div>
            ) : displayedRewards.length === 0 ? (
              <div
                style={{
                  color: "#a1a9b9",
                  background: "#f7f5fa",
                  borderRadius: 8,
                  border: `1px dashed ${RL_BORDER}`,
                  padding: "30px 8px",
                  textAlign: "center",
                  fontSize: "13px",
                }}
              >
                No {activeTab.toLowerCase()} rewards
              </div>
            ) : (
              displayedRewards.map((rt) => (
                <div
                  key={rt.rewardTypeId}
                  style={{
                    padding: "11px 11px 12px 12px",
                    marginBottom: "12px",
                    borderRadius: 8,
                    background: "#fcfcfc",
                    border:
                      selectedRewardType?.rewardTypeId === rt.rewardTypeId
                        ? `1.5px solid ${RL_PURPLE}`
                        : `1px solid ${RL_BORDER}`,
                    boxShadow:
                      selectedRewardType?.rewardTypeId === rt.rewardTypeId
                        ? "0 1.5px 8px rgba(149,51,161,0.08)"
                        : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: ".14s",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: 700, 
                      fontSize: "14px", 
                      color: RL_DARK, 
                      marginBottom: 3,
                      textAlign: "left"
                    }}>
                      {rt.rewardName}
                    </div>
                    <div
                      style={{
                        fontSize: "11.5px",
                        color: "#85779c",
                        marginBottom: 6,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        maxWidth: 190,
                        textAlign: "left"
                      }}
                    >
                      {rt.description || "—"}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11 }}>
                      <span
                        style={{
                          padding: "1.5px 7px",
                          background: "#f3f4fa",
                          borderRadius: 3,
                          fontWeight: "500",
                        }}
                      >
                        {/* ✅ FIXED: Always show real-time parameter count */}
                        {getParameterCount(rt.rewardTypeId)} parameters
                      </span>
                      <span
                        style={{
                          padding: "2px 9px",
                          borderRadius: 4,
                          fontWeight: "600",
                          background: rt.isActive ? "#e7e0fa" : "#fbe2f3",
                          color: rt.isActive ? RL_PURPLE : "#bc387a",
                        }}
                      >
                        {rt.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => openEditRewardTypeModal(rt)}
                      title="Edit Reward Type"
                      style={{
                        padding: "6px 8px",
                        marginRight: 3,
                        background: "#fff",
                        color: RL_PURPLE,
                        border: `1.3px solid ${RL_PURPLE}`,
                        borderRadius: BTN_RADIUS,
                        fontSize: "15px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="bi bi-pencil-square" />
                    </button>
                    <button
                      onClick={() => confirmStatusChange(rt)}
                      title={rt.isActive ? "Deactivate Reward Type" : "Activate Reward Type"}
                      style={{
                        padding: "6px 8px",
                        background: "#fff",
                        color: rt.isActive ? "#E01950" : RL_PURPLE,
                        border: `1.3px solid ${rt.isActive ? "#E01950" : RL_PURPLE}`,
                        borderRadius: BTN_RADIUS,
                        fontSize: "15px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
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

        <div
          style={{
            flex: 2,
            background: "#fff",
            borderRadius: 12,
            marginTop: 0,
            border: `1px solid ${RL_BORDER}`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
            minHeight: 480,
            maxHeight: "75vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 26px 0px 26px",
              background: "#fff",
              zIndex: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          ></div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              minHeight: 0,
              padding: "3px 26px 18px 26px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {selectedRewardType ? (
              <>
                <div style={{ marginTop: 0 }}>{renderRewardDetails()}</div>
                <div style={{ height: 14 }} />
                {parameters.length === 0 ? (
                  <div
                    style={{
                      color: "#85799a",
                      padding: "40px 10px",
                      background: "#fcfbff",
                      borderRadius: "8px",
                      border: `1px dashed ${RL_BORDER}`,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "14px", marginBottom: 6 }}>No parameters configured</div>
                    <div style={{ fontSize: "12px", color: "#b9bace" }}>
                      Add parameters to customize nomination forms
                    </div>
                  </div>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "13px",
                      border: "2px solid #27235C",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#27235C",
                          borderBottom: "1.5px solid #27235C",
                        }}
                      >
                        <th
                          style={{
                            textAlign: "left",
                            padding: "11px",
                            fontWeight: 800,
                            color: "white",
                          }}
                        >
                          Parameter Name
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "11px",
                            fontWeight: 700,
                            color: "white",
                          }}
                        >
                          Type
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "11px",
                            fontWeight: 700,
                            color: "white",
                          }}
                        >
                          Required
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "11px",
                            fontWeight: 700,
                            color: "white",
                          }}
                        >
                          Order
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "11px",
                            fontWeight: 800,
                            color: "white",
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parameters.map((param) => (
                        <tr
                          key={param.parameterId}
                          style={{
                            borderBottom: "1px solid darkblue",
                          }}
                        >
                          <td
                            style={{
                              padding: "13px 11px",
                              fontWeight: "600",
                              color: "#000",
                              textAlign: "left",
                            }}
                          >
                            {param.parameterName}
                          </td>
                          <td
                            style={{
                              padding: "13px 11px",
                              color: "#000",
                              fontWeight: 500,
                              textAlign: "left",
                            }}
                          >
                            {param.parameterType}
                          </td>
                          <td
                            style={{
                              padding: "13px 11px",
                              textAlign: "left",
                              fontWeight: "700",
                            }}
                          >
                            {param.isRequired ? (
                              <span style={{ color: "green" }}>Yes</span>
                            ) : (
                              <span style={{ color: "red" }}>No</span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "13px 11px",
                              textAlign: "left",
                              color: "#000",
                            }}
                          >
                            {param.sortOrder}
                          </td>
                          <td
                            style={{
                              padding: "13px 11px",
                              textAlign: "left",
                            }}
                          >
                            <button
                              onClick={() => confirmDelete(param.parameterId, "parameter")}
                              style={{
                                padding: "6px 18px",
                                background: "#eee",
                                color: "#27235C",
                                borderRadius: 5,
                                fontWeight: "700",
                                border: "1px solid #27235C",
                                cursor: "pointer",
                                fontSize: 13,
                              }}
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
              <div
                style={{
                  textAlign: "center",
                  color: "#bbb",
                  padding: "70px 10px",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: 7 }}>
                  Select a recognition reward to view parameters
                </div>
                <div style={{ fontSize: 12 }}>Choose from Active or Inactive rewards</div>
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
