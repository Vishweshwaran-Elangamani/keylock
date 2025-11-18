import React, { useState, useEffect } from "react";
import * as api from "../../../services/performancemanagement/hr/api";
import RewardTypeModal from "../../../components/performance_management/modals/Recognition/RewardTypeModal";
import ParameterModal from "../../../components/performance_management/modals/Recognition/ParameterModal";
import DeleteConfirmModal from "../../../components/performance_management/modals/Recognition/DeleteConfirmModal";
import StatusConfirmModal from "../../../components/performance_management/modals/Recognition/StatusConfirmModal";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

  useEffect(() => {
    fetchRewardTypes();
  }, []);

  const fetchRewardTypes = async () => {
    setLoading(true);
    try {
      const { data } = await api.getRewardTypes(false);
      if (data.success) setRewardTypes(data.data);
    } catch (error) {
      console.error("Error fetching reward types:", error);
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
      console.error("Error fetching parameters:", error);
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

  const closeRewardTypeModal = () => {
    setShowRewardTypeModal(false);
  };

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

  const closeParameterModal = () => {
    setShowParameterModal(false);
  };

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
    } catch (error) {
      toast.error(`Error ${isEditMode ? "updating" : "creating"} reward type: ${error.response?.data?.message}`);
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
    } catch (error) {
      toast.error("Error updating reward type: " + error.response?.data?.message);
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
    } catch (error) {
      toast.error("Error creating parameter: " + error.response?.data?.message);
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
    } catch (error) {
      toast.error("Error deleting: " + error.response?.data?.message);
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

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      
      <div style={{ padding: "30px 40px", maxWidth: "1600px", margin: "0 auto", background: "#F7F8FA", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "8px", letterSpacing: "-0.5px" }}>Recognition Configuration</h1>
            <p style={{ fontSize: "15px", color: "#6b7280" }}>Configure recognition reward types and nomination parameters</p>
          </div>
          <button onClick={openAddRewardTypeModal} style={{ padding: "12px 24px", background: "#27235C", color: "#fff", borderRadius: "8px", fontWeight: "600", cursor: "pointer", border: "none" }}>
            + Create Reward Type
          </button>
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", background: "#fff", padding: "6px", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
          <button onClick={() => setActiveTab("Active")} style={{ flex: 1, padding: "10px 16px", background: activeTab === "Active" ? "#27235C" : "transparent", color: activeTab === "Active" ? "#fff" : "#6b7280", borderRadius: "6px", fontWeight: "600", cursor: "pointer", border: "none" }}>Active ({activeRewardTypes.length})</button>
          <button onClick={() => setActiveTab("Inactive")} style={{ flex: 1, padding: "10px 16px", background: activeTab === "Inactive" ? "#27235C" : "transparent", color: activeTab === "Inactive" ? "#fff" : "#6b7280", borderRadius: "6px", fontWeight: "600", cursor: "pointer", border: "none" }}>Inactive ({inactiveRewardTypes.length})</button>
        </div>

        <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>Recognition Rewards</h3>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280" }}>
              <div className="spinner-border" role="status" style={{ width: "32px", height: "32px" }}>
                <span className="sr-only">Loading...</span>
              </div>
              <p style={{ marginTop: "12px", fontSize: "14px" }}>Loading...</p>
            </div>
          ) : (
            <div>
              {displayedRewards.length === 0 ? (
                <div style={{ color: "#9ca3af", background: "#f9fafb", borderRadius: "8px", border: "1px dashed #d1d5db", padding: "40px 20px", textAlign: "center" }}>No {activeTab.toLowerCase()} rewards</div>
              ) : (
                displayedRewards.map((rt) => (
                  <div key={rt.rewardTypeId} onClick={() => { setSelectedRewardType(rt); fetchParameters(rt.rewardTypeId); }} style={{
                    padding: "14px 16px",
                    marginBottom: "10px",
                    cursor: "pointer",
                    borderRadius: "8px",
                    background: selectedRewardType?.rewardTypeId === rt.rewardTypeId ? "#f0f9ff" : "#fff",
                    border: selectedRewardType?.rewardTypeId === rt.rewardTypeId ? "2px solid #27235C" : "1px solid #e5e7eb",
                    boxShadow: selectedRewardType?.rewardTypeId === rt.rewardTypeId ? "0 2px 8px rgba(39, 35, 92, 0.15)" : "none"
                  }}>
                    <div style={{ marginBottom: "10px", fontWeight: "600", fontSize: "15px", color: "#27235C" }}>{rt.rewardName}</div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", color: "#6b7280" }}>
                      <span style={{ padding: "2px 8px", background: "#f3f4f6", borderRadius: "4px", fontWeight: "500", fontSize: "12px" }}>{rt.parameterCount} parameters</span>
                      <span style={{ padding: "4px 10px", borderRadius: "4px", fontWeight: "600", fontSize: "11px", background: rt.isActive ? "#d1fae5" : "#fee2e2", color: rt.isActive ? "#065f46" : "#991b1b" }}>
                        {rt.isActive ? "● Active" : "● Inactive"}
                      </span>
                    </div>
                    <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
                      <button onClick={(e) => { e.stopPropagation(); openEditRewardTypeModal(rt); }} style={{ flex: 1, padding: "8px 12px", background: "#eff6ff", color: "#1e40af", borderRadius: "6px", fontWeight: "600", cursor: "pointer", border: "1px solid #bfdbfe" }}>
                        Edit
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); confirmStatusChange(rt); }} style={{
                        flex: 1,
                        padding: "8px 12px",
                        background: rt.isActive ? "#fee2e2" : "#d1fae5",
                        color: rt.isActive ? "#dc2626" : "#059669",
                        borderRadius: "6px",
                        fontWeight: "600",
                        cursor: "pointer",
                        border: rt.isActive ? "1px solid #fecaca" : "1px solid #a7f3d0"
                      }}>
                        {rt.isActive ? "⊘ Deactivate" : "✓ Activate"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: "24px", background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" }}>
          {selectedRewardType ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                    <h3 style={{ fontSize: "22px", fontWeight: "600", color: "#27235C", margin: 0 }}>{selectedRewardType.rewardName}</h3>
                    <span style={{ background: "#dbeafe", color: "#1e40af", padding: "4px 12px", borderRadius: "6px", fontWeight: "600", fontSize: "12px" }}>Recognition</span>
                  </div>
                  <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>{selectedRewardType.description || "No description provided"}</p>
                </div>
                <button onClick={openParameterModal} style={{ padding: "10px 20px", background: "#10b981", color: "#fff", borderRadius: "8px", fontWeight: "600", boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)", cursor: "pointer", border: "none" }}>
                  + Add Parameter
                </button>
              </div>
              {parameters.length === 0 ? (
                <div style={{ color: "#6b7280", padding: "60px 20px", background: "#f9fafb", borderRadius: "8px", border: "1px dashed #d1d5db", textAlign: "center" }}>
                  <div style={{ fontSize: "16px", marginBottom: 8 }}>No parameters configured</div>
                  <div style={{ fontSize: "14px", color: "#9ca3af" }}>Add parameters to customize nomination forms</div>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: "600", color: "#374151" }}>Parameter Name</th>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: "600", color: "#374151" }}>Type</th>
                      <th style={{ textAlign: "center", padding: "12px", fontWeight: "600", color: "#374151" }}>Required</th>
                      <th style={{ textAlign: "center", padding: "12px", fontWeight: "600", color: "#374151" }}>Order</th>
                      <th style={{ textAlign: "center", padding: "12px", fontWeight: "600", color: "#374151" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parameters.map((param) => (
                      <tr key={param.parameterId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "14px 12px", fontWeight: "500", color: "#111827" }}>{param.parameterName}</td>
                        <td style={{ padding: "14px 12px", color: "#6b7280" }}>{param.parameterType}</td>
                        <td style={{ padding: "14px 12px", textAlign: "center" }}>{param.isRequired ? <span style={{ color: "#ef4444", fontWeight: "600" }}>Yes</span> : <span style={{ color: "#6b7280" }}>No</span>}</td>
                        <td style={{ padding: "14px 12px", textAlign: "center", color: "#6b7280" }}>{param.sortOrder}</td>
                        <td style={{ padding: "14px 12px", textAlign: "center" }}>
                          <button onClick={() => confirmDelete(param.parameterId, "parameter")} style={{ padding: "6px 14px", background: "#fee2e2", color: "#dc2626", borderRadius: "6px", fontWeight: "500", border: "1px solid #fecaca", cursor: "pointer" }}>
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
            <div style={{ textAlign: "center", padding: "100px 20px", color: "#9ca3af" }}>
              <div style={{ fontSize: "18px", marginBottom: "8px", fontWeight: "500" }}>Select a recognition reward to view parameters</div>
              <div style={{ fontSize: "14px" }}>Choose from Active or Inactive rewards</div>
            </div>
          )}
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
          message={deleteType === "rewardType" ? "Are you sure you want to delete this reward type?" : "Are you sure you want to delete this parameter?"}
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
