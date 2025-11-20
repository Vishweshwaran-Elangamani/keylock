import React, { useState, useEffect } from "react";
import * as api from "../../../services/performancemanagement/hr/api";
import RewardTypeModal from "../../../components/performance_management/modals/Recognition/RewardTypeModal";
import ParameterModal from "../../../components/performance_management/modals/Recognition/ParameterModal";
import DeleteConfirmModal from "../../../components/performance_management/modals/Recognition/DeleteConfirmModal";
import StatusConfirmModal from "../../../components/performance_management/modals/Recognition/StatusConfirmModal";
import { toast } from "sonner";

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

  const [rewardTypeForm, setRewardTypeForm] = useState({
    rewardCategory: "Recognition",
    rewardName: "",
    description: "",
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

  useEffect(() => {
    fetchRewardTypes();
  }, []);

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

  const fetchParameters = async (rewardTypeId) => {
    try {
      const { data } = await api.getParametersByRewardType(rewardTypeId);
      if (data.success) setParameters(data.data);
    } catch (error) {
      toast.error("Failed to fetch parameters");
    }
  };

  const openAddRewardTypeModal = () => {
    setIsEditMode(false);
    setEditingRewardTypeId(null);
    setRewardTypeForm({ rewardCategory: "Recognition", rewardName: "", description: "" });
    setShowRewardTypeModal(true);
  };

  const openEditRewardTypeModal = (rt) => {
    setIsEditMode(true);
    setEditingRewardTypeId(rt.rewardTypeId);
    setRewardTypeForm({
      rewardCategory: rt.rewardCategory,
      rewardName: rt.rewardName,
      description: rt.description || "",
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
        const { data } = await api.createRewardType({ ...rewardTypeForm, createdBy: 1 });
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
        ...rewardType, isActive: !rewardType.isActive,
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
        fetchParameters(selectedRewardType.rewardTypeId);
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
      if (deleteType === "rewardType") {
        const { data } = await api.deleteRewardType(toDeleteId);
        if (data.success) {
          toast.success("Reward type deleted successfully");
          fetchRewardTypes();
          if (selectedRewardType?.rewardTypeId === toDeleteId) {
            setSelectedRewardType(null);
            setParameters([]);
          }
        }
      } else if (deleteType === "parameter") {
        const { data } = await api.deleteParameter(toDeleteId);
        if (data.success) {
          toast.success("Parameter deleted successfully");
          fetchParameters(selectedRewardType.rewardTypeId);
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

  const RL_PURPLE = "#9533A1";
  const RL_DARK = "#27235C";
  const RL_BG = "#F8F7FB";
  const RL_LIGHT = "#f5f5fa";
  const RL_BORDER = "#e5e7eb";
  const RL_TABLE_HEADER = "#F8F6FB";
  const PREVIEW_CHAR_LIMIT = 340;

  function renderRewardDetails() {
    if (!selectedRewardType) return null;
    const desc = selectedRewardType.description || "No description provided";
    const needsCollapse = desc.length > PREVIEW_CHAR_LIMIT;
    const visibleDesc = descExpanded ? desc : desc.slice(0, PREVIEW_CHAR_LIMIT);
    const showReadMore = needsCollapse;

    return (
      <>
        <div style={{
          fontWeight: 800,
          fontSize: "22px",
          color: RL_DARK,
          letterSpacing: -.5,
          fontFamily: "Montserrat, Nunito, sans-serif",
          textAlign: "left"
        }}>
          {selectedRewardType.rewardName}
        </div>
        <div style={{ textAlign: "left", marginTop: 8, marginBottom: 2 }}>
          <span
            style={{
              background: "#F3EBFA",
              color: RL_PURPLE,
              fontWeight: 700,
              fontSize: "13px",
              padding: "4px 14px",
              borderRadius: 10,
              display: "inline-block"
            }}>
            Recognition
          </span>
        </div>
        <div style={{
          fontSize: "15px",
          color: "#8886b3",
          marginTop: 14,
          maxWidth: '100%',
          textAlign: "justify",
          lineHeight: 1.7,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          minHeight: needsCollapse ? 90 : "auto"
        }}>
          {visibleDesc}
          {showReadMore && !descExpanded && <span style={{ color: RL_PURPLE }}>...</span>}
        </div>
        {showReadMore &&
          <button
            onClick={() => setDescExpanded(e => !e)}
            style={{
              background: "transparent",
              border: "none",
              color: RL_PURPLE,
              fontWeight: 700,
              cursor: "pointer",
              paddingLeft: 0,
              fontFamily: "inherit",
              fontSize: "15px",
              outline: "none",
              margin: 0
            }}>
            {descExpanded ? "Read Less" : "Read More"}
          </button>}
      </>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav style={{
        padding: "18px 38px 8px 38px",
        background: RL_BG,
        fontSize: 15,
        fontWeight: 400,
        display: "flex",
        alignItems: "center",
        marginBottom: 0
      }}>
        <a href="/hr/dashboard" style={{ display: "flex", alignItems: "center", color: RL_PURPLE, textDecoration: "none", fontWeight: 600 }}>
          <svg width="19" height="19" fill="none" viewBox="0 0 20 20" style={{ marginRight: 5 }}>
            <path d="M10 3.333L3.333 8.333V16.667h4.167v-4.167h5V16.667h4.167V8.333L10 3.333z" stroke={RL_PURPLE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Dashboard
        </a>
        <span style={{ color: "#b7bac5", margin: "0 10px" }}>/</span>
        <a href="/hr/dashboard/performance" style={{ color: "#807bb8", fontWeight: 500, textDecoration: "none" }}>
          Performance Management
        </a>
        <span style={{ color: "#b7bac5", margin: "0 10px" }}>/</span>
        <span style={{ color: RL_DARK, fontWeight: 700 }}>Rewards</span>
      </nav>
      <div
        style={{
          margin: "0 auto",
          maxWidth: 1600,
          background: RL_BG,
          minHeight: "100vh",
          display: "flex",
          gap: "30px",
          padding: "0 40px",
          alignItems: "flex-start"
        }}>

        {/* LEFT COLUMN */}
        <div style={{
          flex: 1.3,
          background: "#fff",
          borderRadius: 14,
          marginTop: 0,
          border: `1px solid ${RL_BORDER}`,
          boxShadow: "0 1.5px 6px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          minHeight: 530,
          maxHeight: "81vh"
        }}>
          {/* Sticky top: tabs and + button on the right */}
          <div style={{
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 1,
            padding: "20px 22px 9px 22px",
            borderRadius: "14px 14px 0 0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 13 }}>
              <div style={{
                flex: 1,
                display: "flex", gap: 7,
                background: RL_LIGHT, padding: 5, borderRadius: 12
              }}>
                <button
                  onClick={() => setActiveTab("Active")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: activeTab === "Active" ? RL_PURPLE : "#fff",
                    color: activeTab === "Active" ? "#fff" : RL_PURPLE,
                    borderRadius: 7,
                    fontWeight: "700",
                    cursor: "pointer",
                    border: activeTab === "Active" ? "0" : `1px solid ${RL_BORDER}`
                  }}>Active ({activeRewardTypes.length})
                </button>
                <button
                  onClick={() => setActiveTab("Inactive")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: activeTab === "Inactive" ? RL_PURPLE : "#fff",
                    color: activeTab === "Inactive" ? "#fff" : RL_PURPLE,
                    borderRadius: 7,
                    fontWeight: "700",
                    cursor: "pointer",
                    border: activeTab === "Inactive" ? "0" : `1px solid ${RL_BORDER}`
                  }}>Inactive ({inactiveRewardTypes.length})
                </button>
              </div>
              <button
                onClick={openAddRewardTypeModal}
                style={{
                  padding: "9px 18px",
                  background: RL_DARK,
                  color: "#fff",
                  borderRadius: 7,
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "none",
                  fontSize: 15,
                  letterSpacing: 0.2,
                  whiteSpace: "nowrap"
                }}>
                + Create Reward Type
              </button>
            </div>
          </div>
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "5px 18px 10px 22px",
            minHeight: 0,
            maxHeight: "calc(81vh - 115px)"
          }}>
            {loading ? (
              <div style={{ textAlign: "center", color: "#aaa", padding: "42px 3px 18px 5px" }}>
                <div className="spinner-border" style={{ width: 22, height: 22 }}></div>
                <div style={{ fontSize: 14, marginTop: 6 }}>Loading...</div>
              </div>
            ) : displayedRewards.length === 0 ? (
              <div style={{
                color: "#a1a9b9",
                background: "#f7f5fa",
                borderRadius: 9,
                border: `1.2px dashed ${RL_BORDER}`,
                padding: "36px 10px",
                textAlign: "center"
              }}>
                No {activeTab.toLowerCase()} rewards
              </div>
            ) : (
              displayedRewards.map((rt) => (
                <div key={rt.rewardTypeId}
                  onClick={() => { setSelectedRewardType(rt); fetchParameters(rt.rewardTypeId); setDescExpanded(false); }}
                  style={{
                    padding: "13px 13px 11px 14px",
                    marginBottom: "9px",
                    cursor: "pointer",
                    borderRadius: 7,
                    background: selectedRewardType?.rewardTypeId === rt.rewardTypeId ? "#f3e6fa" : "#fcfcfc",
                    border: selectedRewardType?.rewardTypeId === rt.rewardTypeId ? `2px solid ${RL_PURPLE}` : `1px solid ${RL_BORDER}`,
                    boxShadow: selectedRewardType?.rewardTypeId === rt.rewardTypeId ? "0 2px 10px rgba(149,51,161,0.10)" : "none",
                    transition: ".16s"
                  }}>
                  <div style={{ marginBottom: 4, fontWeight: 700, fontSize: "15px", color: RL_DARK }}>{rt.rewardName}</div>
                  <div style={{
                    fontSize: "13px",
                    color: "#85779c",
                    marginBottom: 6,
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    maxWidth: 220
                  }}>{rt.description}</div>
                  <div style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 12, marginBottom: 1 }}>
                    <span style={{
                      padding: "1.7px 8px",
                      background: "#f3f4fa",
                      borderRadius: 3,
                      fontWeight: "500"
                    }}>
                      {rt.parameterCount} parameters
                    </span>
                    <span style={{
                      padding: "2.5px 11px",
                      borderRadius: 4,
                      fontWeight: "600",
                      background: rt.isActive ? "#e7e0fa" : "#fbe2f3",
                      color: rt.isActive ? RL_PURPLE : "#bc387a"
                    }}>
                      {rt.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div style={{ marginTop: 7, display: "flex", gap: 4 }}>
                    <button
                      onClick={e => { e.stopPropagation(); openEditRewardTypeModal(rt); }}
                      style={{
                        flex: 1, padding: "8px 0",
                        background: "rgba(149,51,161,0.05)",
                        color: RL_PURPLE,
                        borderRadius: 5,
                        fontWeight: "700",
                        border: `1.2px solid ${RL_PURPLE}22`,
                        fontSize: 14,
                        cursor: "pointer"
                      }}>Edit</button>
                    <button
                      onClick={e => { e.stopPropagation(); confirmStatusChange(rt); }}
                      style={{
                        flex: 1, padding: "8px 0",
                        background: "#f8f5fa",
                        color: RL_PURPLE,
                        borderRadius: 5,
                        fontWeight: "700",
                        border: `1.2px solid ${RL_PURPLE}22`,
                        fontSize: 14,
                        cursor: "pointer"
                      }}>
                      {rt.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* RIGHT COLUMN */}
        <div style={{
          flex: 2,
          background: "#fff",
          borderRadius: 14,
          marginTop: 0,
          border: `1px solid ${RL_BORDER}`,
          boxShadow: "0 1.5px 6px rgba(0,0,0,0.02)",
          minHeight: 530,
          maxHeight: "81vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* header row (add button and sticky top only) */}
          <div style={{
            padding: "24px 32px 0px 32px",
            background: "#fff",
            zIndex: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start"
          }}>
            <div style={{ flex: 1, minWidth: 0 }}></div>
            {selectedRewardType && (
              <button
                onClick={openParameterModal}
                style={{
                  padding: "12px 28px",
                  background: RL_DARK,
                  color: "#fff",
                  borderRadius: 10,
                  fontWeight: "700",
                  cursor: "pointer",
                  border: "none",
                  fontSize: "17px",
                  boxShadow: "0 2px 8px rgba(39,35,92,0.08)"
                }}>
                + Add Parameter
              </button>
            )}
          </div>
          {/* This container scrolls ALL content: description + table */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
            padding: "4px 32px 22px 32px",
            width: "100%",
            boxSizing: "border-box"
          }}>
            {selectedRewardType ? (
              <>
                <div style={{ marginTop: 0 }}>
                  {renderRewardDetails()}
                </div>
                <div style={{ height: 18 }} />
                {parameters.length === 0 ? (
                  <div style={{
                    color: "#85799a",
                    padding: "48px 12px",
                    background: "#fcfbff",
                    borderRadius: "10px",
                    border: `1.2px dashed ${RL_BORDER}`,
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "16px", marginBottom: 8 }}>No parameters configured</div>
                    <div style={{ fontSize: "13px", color: "#b9bace" }}>Add parameters to customize nomination forms</div>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px" }}>
                    <thead>
                      <tr style={{ background: RL_TABLE_HEADER, borderBottom: `2px solid ${RL_BORDER}` }}>
                        <th style={{
                          textAlign: "left", padding: "13px",
                          fontWeight: 800, color: RL_PURPLE
                        }}>Parameter Name</th>
                        <th style={{
                          textAlign: "left", padding: "13px",
                          fontWeight: 700, color: RL_DARK
                        }}>Type</th>
                        <th style={{
                          textAlign: "center", padding: "13px",
                          fontWeight: 700, color: "#333"
                        }}>Required</th>
                        <th style={{
                          textAlign: "center", padding: "13px",
                          fontWeight: 700, color: "#333"
                        }}>Order</th>
                        <th style={{
                          textAlign: "center", padding: "13px",
                          fontWeight: 800, color: RL_DARK
                        }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parameters.map((param) => (
                        <tr key={param.parameterId} style={{
                          borderBottom: `1px solid ${RL_BORDER}`
                        }}>
                          <td style={{
                            padding: "16px 13px",
                            fontWeight: "600",
                            color: RL_DARK
                          }}>{param.parameterName}</td>
                          <td style={{
                            padding: "16px 13px",
                            color: RL_PURPLE,
                            fontWeight: 500
                          }}>{param.parameterType}</td>
                          <td style={{
                            padding: "16px 13px",
                            textAlign: "center",
                            fontWeight: "700"
                          }}>{param.isRequired ?
                            <span style={{ color: "#cb098f" }}>Yes</span> :
                            <span style={{ color: "#999" }}>No</span>
                          }</td>
                          <td style={{
                            padding: "16px 13px",
                            textAlign: "center",
                            color: "#65599b"
                          }}>{param.sortOrder}</td>
                          <td style={{
                            padding: "16px 13px",
                            textAlign: "center"
                          }}>
                            <button onClick={() => confirmDelete(param.parameterId, "parameter")}
                              style={{
                                padding: "7px 22px",
                                background: RL_LIGHT,
                                color: RL_PURPLE,
                                borderRadius: 6,
                                fontWeight: "700",
                                border: `1.2px solid ${RL_PURPLE}22`,
                                cursor: "pointer",
                                fontSize: 15
                              }}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            ) : (
              <div style={{
                textAlign: "center",
                color: "#bbb",
                padding: "85px 12px"
              }}>
                <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: 9 }}>
                  Select a recognition reward to view parameters
                </div>
                <div style={{ fontSize: 13 }}>Choose from Active or Inactive rewards</div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* MODALS */}
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
    </>
  );
}

export default RewardConfiguration;
