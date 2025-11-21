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

  const navigate = useNavigate();

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

  const RL_PURPLE = "#97247e";
  const RL_DARK = "#27235c";
  const RL_BG = "#f8f9fc";
  const RL_BORDER = "#27235c";
  const RL_TABLE_HEADER = "#f8f6fb";
  const RL_LIGHT = "#f5f5fa";
  const BTN_RADIUS = "8px";
  const PREVIEW_CHAR_LIMIT = 340;

  function renderRewardDetails() {
    if (!selectedRewardType) return null;
    const desc = selectedRewardType.description || "No description provided";
    const needsCollapse = desc.length > PREVIEW_CHAR_LIMIT;
    const visibleDesc = descExpanded ? desc : desc.slice(0, PREVIEW_CHAR_LIMIT);
    const showReadMore = needsCollapse;

    return (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: "22px",
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
              fontSize: "13px",
              padding: "2px 10px",
              borderRadius: 10,
              marginLeft: 6,
              display: "inline-block",
            }}
          >
            Recognition
          </span>
          <button
            onClick={openParameterModal}
            style={{
              marginLeft: "auto",
              padding: "7px 16px",
             background: "linear-gradient(90deg, #97247e 0%, #e01950 100%)",
              color: "#fff",
              borderRadius: BTN_RADIUS,
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              fontSize: 14,
              height: 32,
              boxShadow: "0 1.5px 6px rgba(39,35,92,0.10)",
              whiteSpace: "nowrap",
            }}
          >
            + Add Parameter
          </button>
        </div>
        <div
          style={{
            fontSize: "15px",
            color: "#8886b3",
            marginTop: 8,
            maxWidth: "100%",
            textAlign: "justify",
            lineHeight: 1.7,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            minHeight: needsCollapse ? 90 : "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ flex: 1 }}>
            {visibleDesc}
            {showReadMore && !descExpanded && <span style={{ color: RL_PURPLE }}>...</span>}
          </span>
          {showReadMore && (
            <button
              onClick={() => setDescExpanded((e) => !e)}
              style={{
                background: "transparent",
                border: "none",
                color: RL_PURPLE,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                outline: "none",
                padding: 0,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {descExpanded ? "Read Less" : "Read More"}
            </button>
          )}
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
          border: `1.5px solid ${RL_PURPLE}`,
          background: "#fff",
          color: RL_PURPLE,
          fontWeight: 700,
          borderRadius: "50%",
          width: 38,
          height: 38,
          fontSize: 17,
          cursor: "pointer",
          transition: "box-shadow 0.15s",
          marginLeft: 6,
        }}
        title="Select Reward Type"
      >
        <i className="bi bi-plus-circle"></i>
      </button>
    );
  }

  return (
    <div style={{ background: RL_BG, minHeight: "100vh", minWidth: 0 }}>
      {/* Top Bar: Breadcrumbs + Create Button - MOVED HIGHER */}
      <div
        style={{
          padding: "20px 34px 0 34px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: RL_BG,
          gap: 12,
          marginBottom: "1.5rem",
        }}
      >
        <nav className="cg-breadcrumbs" style={{ marginBottom: 0, background: "transparent" }} aria-label="breadcrumb">
          <ol className="cg-breadcrumb" style={{ margin: 0 }}>
            <li className="cg-breadcrumb-item" onClick={() => navigate("/hr/dashboard")}>
              <i className="bi bi-house-door"></i>
            </li>
            <li className="cg-breadcrumb-item" onClick={() => navigate("/hr/dashboard/performance")}>
              Performance Management
            </li>
            <li className="cg-breadcrumb-item active" aria-current="page">
              Rewards
            </li>
          </ol>
        </nav>
        <button
          onClick={openAddRewardTypeModal}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(90deg, #97247e 0%, #e01950 100%)",
            color: "#fff",
            borderRadius: BTN_RADIUS,
            fontWeight: "700",
            fontSize: "15px",
            border: "none",
            boxShadow: "0 2px 10px rgba(151,36,126,0.15)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
          title="Create a new Reward Type"
        >
          <i className="bi bi-plus-circle" style={{ fontSize: "18px" }}></i>
          Create Reward Type
        </button>
      </div>

      {/* Two-Column Layout */}
      <div
        style={{
          margin: "0 auto",
          maxWidth: 1600,
          background: RL_BG,
          minHeight: "100vh",
          display: "flex",
          gap: "30px",
          padding: "0 40px 40px 40px",
          alignItems: "flex-start",
        }}
      >
        {/* LEFT COLUMN (Recognition Cards) */}
       <div
  style={{
    flex: 1.3,
    background: "#fff",
    borderRadius: 14,
    marginTop: 0,
    border: `1px solid ${RL_BORDER}`,
    boxShadow: "0 1.5px 6px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column",
    minHeight: 530,
    maxHeight: "81vh",
  }}
>
          {/* Tabs: Active/Inactive - NOT STICKY */}
           <div
    style={{
      background: "#fff",
      padding: "16px 22px 10px 22px",
      borderRadius: "14px 14px 0 0",
      display: "flex",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        background: RL_DARK,
        padding: "6px",
        borderRadius: "50px",
        display: "inline-flex",
        gap: "6px",
      }}
    >
      <button
        onClick={() => setActiveTab("Active")}
        style={{
          padding: "10px 32px",
          background: activeTab === "Active" ? "#fff" : "transparent",
          color: activeTab === "Active" ? RL_DARK : "#fff",
          borderRadius: "50px",
          fontWeight: "700",
          fontSize: "15px",
          cursor: "pointer",
          border: "none",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
      >
        Active ({activeRewardTypes.length})
      </button>
      <button
        onClick={() => setActiveTab("Inactive")}
        style={{
          padding: "10px 32px",
          background: activeTab === "Inactive" ? "#fff" : "transparent",
          color: activeTab === "Inactive" ? RL_DARK : "#fff",
          borderRadius: "50px",
          fontWeight: "700",
          fontSize: "15px",
          cursor: "pointer",
          border: "none",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
      >
        Inactive ({inactiveRewardTypes.length})
      </button>
    </div>
  </div>
  <div
    style={{
      flex: 1,
      overflowY: "auto",
      padding: "8px 19px 17px 22px",
      minHeight: 0,
      maxHeight: "calc(81vh - 80px)",
    }}
  >
            {loading ? (
              <div style={{ textAlign: "center", color: "#aaa", padding: "42px 3px 18px 5px" }}>
                <div className="spinner-border" style={{ width: 22, height: 22 }}></div>
                <div style={{ fontSize: 14, marginTop: 6 }}>Loading...</div>
              </div>
            ) : displayedRewards.length === 0 ? (
              <div
                style={{
                  color: "#a1a9b9",
                  background: "#f7f5fa",
                  borderRadius: 9,
                  border: `1.2px dashed ${RL_BORDER}`,
                  padding: "36px 10px",
                  textAlign: "center",
                }}
              >
                No {activeTab.toLowerCase()} rewards
              </div>
            ) : (
              displayedRewards.map((rt) => (
                <div
                  key={rt.rewardTypeId}
                  style={{
                    padding: "13px 13px 14px 14px",
                    marginBottom: "14px",
                    borderRadius: 10,
                    background: "#fcfcfc",
                    border:
                      selectedRewardType?.rewardTypeId === rt.rewardTypeId
                        ? `2px solid ${RL_PURPLE}`
                        : `1px solid ${RL_BORDER}`,
                    boxShadow:
                      selectedRewardType?.rewardTypeId === rt.rewardTypeId
                        ? "0 2px 10px rgba(149,51,161,0.10)"
                        : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: ".16s",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "16px", color: RL_DARK, marginBottom: 4 }}>
                      {rt.rewardName}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#85779c",
                        marginBottom: 8,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        maxWidth: 220,
                      }}
                    >
                      {rt.description || "\u2014"}
                    </div>
                    <div style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 12 }}>
                      <span
                        style={{
                          padding: "1.7px 8px",
                          background: "#f3f4fa",
                          borderRadius: 3,
                          fontWeight: "500",
                        }}
                      >
                        {rt.parameterCount} parameters
                      </span>
                      <span
                        style={{
                          padding: "2.5px 11px",
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
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={() => {
                        openEditRewardTypeModal(rt);
                      }}
                      title="Edit Reward Type"
                      style={{
                        padding: "7px 10px",
                        marginRight: 4,
                        background: "#fff",
                        color: RL_PURPLE,
                        border: `1.4px solid ${RL_PURPLE}`,
                        borderRadius: BTN_RADIUS,
                        fontSize: "17px",
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
                        padding: "7px 10px",
                        background: "#fff",
                        color: rt.isActive ? "#E01950" : RL_PURPLE,
                        border: `1.4px solid ${rt.isActive ? "#E01950" : RL_PURPLE}`,
                        borderRadius: BTN_RADIUS,
                        fontSize: "17px",
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

        {/* RIGHT COLUMN (Parameter Details) */}
        <div
          style={{
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
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "24px 32px 0px 32px",
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
              padding: "4px 32px 22px 32px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {selectedRewardType ? (
              <>
                <div style={{ marginTop: 0 }}>{renderRewardDetails()}</div>
                <div style={{ height: 18 }} />
                {parameters.length === 0 ? (
                  <div
                    style={{
                      color: "#85799a",
                      padding: "48px 12px",
                      background: "#fcfbff",
                      borderRadius: "10px",
                      border: `1.2px dashed ${RL_BORDER}`,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "16px", marginBottom: 8 }}>No parameters configured</div>
                    <div style={{ fontSize: "13px", color: "#b9bace" }}>
                      Add parameters to customize nomination forms
                    </div>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px" }}>
                    <thead>
                      <tr style={{ background: RL_TABLE_HEADER, borderBottom: `2px solid ${RL_BORDER}` }}>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "13px",
                            fontWeight: 800,
                            color: RL_PURPLE,
                          }}
                        >
                          Parameter Name
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "13px",
                            fontWeight: 700,
                            color: RL_DARK,
                          }}
                        >
                          Type
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            padding: "13px",
                            fontWeight: 700,
                            color: "#333",
                          }}
                        >
                          Required
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            padding: "13px",
                            fontWeight: 700,
                            color: "#333",
                          }}
                        >
                          Order
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            padding: "13px",
                            fontWeight: 800,
                            color: RL_DARK,
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
                            borderBottom: `1px solid ${RL_BORDER}`,
                          }}
                        >
                          <td
                            style={{
                              padding: "16px 13px",
                              fontWeight: "600",
                              color: RL_DARK,
                            }}
                          >
                            {param.parameterName}
                          </td>
                          <td
                            style={{
                              padding: "16px 13px",
                              color: RL_PURPLE,
                              fontWeight: 500,
                            }}
                          >
                            {param.parameterType}
                          </td>
                          <td
                            style={{
                              padding: "16px 13px",
                              textAlign: "center",
                              fontWeight: "700",
                            }}
                          >
                            {param.isRequired ? (
                              <span style={{ color: "#cb098f" }}>Yes</span>
                            ) : (
                              <span style={{ color: "#999" }}>No</span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "16px 13px",
                              textAlign: "center",
                              color: "#65599b",
                            }}
                          >
                            {param.sortOrder}
                          </td>
                          <td
                            style={{
                              padding: "16px 13px",
                              textAlign: "center",
                            }}
                          >
                            <button
                              onClick={() => confirmDelete(param.parameterId, "parameter")}
                              style={{
                                padding: "7px 22px",
                                background: RL_LIGHT,
                                color: RL_PURPLE,
                                borderRadius: 6,
                                fontWeight: "700",
                                border: `1.2px solid ${RL_PURPLE}22`,
                                cursor: "pointer",
                                fontSize: 15,
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
                  padding: "85px 12px",
                }}
              >
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
    </div>
  );
}

export default RewardConfiguration;
