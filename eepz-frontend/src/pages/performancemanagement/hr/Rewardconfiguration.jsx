


import React, { useState, useEffect } from "react"; 
import * as api from "../../../services/performancemanagement/hr/api";
 
function RewardConfiguration() { 
  const [rewardTypes, setRewardTypes] = useState([]); 
  const [selectedRewardType, setSelectedRewardType] = useState(null); 
  const [parameters, setParameters] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [showRewardTypeModal, setShowRewardTypeModal] = useState(false); 
  const [showParameterModal, setShowParameterModal] = useState(false); 
  const [activeTab, setActiveTab] = useState("Active"); 
  const [isEditMode, setIsEditMode] = useState(false); 
  const [editingRewardTypeId, setEditingRewardTypeId] = useState(null); 
 
  const [rewardTypeForm, setRewardTypeForm] = useState({ 
    rewardCategory: "Recognition", 
    rewardName: "", 
    description: "" 
  }); 
 
  const [parameterForm, setParameterForm] = useState({ 
    parameterName: "", 
    parameterType: "Text", 
    isRequired: true, 
    placeholderText: "", 
    minimumValue: "", 
    maximumValue: "", 
    sortOrder: 1 
  }); 
 
  useEffect(() => { 
    fetchRewardTypes(); 
  }, []); 
 
  const fetchRewardTypes = async () => { 
    try { 
      setLoading(true); 
      const { data } = await api.getRewardTypes(false); 
      if (data.success) { 
        setRewardTypes(data.data); 
      } 
    } catch (error) { 
      console.error("Error fetching reward types:", error); 
    } finally { 
      setLoading(false); 
    } 
  }; 
 
  const fetchParameters = async (rewardTypeId) => { 
    try { 
      const { data } = await api.getParametersByRewardType(rewardTypeId); 
      if (data.success) { 
        setParameters(data.data); 
      } 
    } catch (error) { 
      console.error("Error fetching parameters:", error); 
    } 
  }; 
 
  const handleEditRewardType = (rewardType) => { 
    setIsEditMode(true); 
    setEditingRewardTypeId(rewardType.rewardTypeId); 
    setRewardTypeForm({ 
      rewardCategory: rewardType.rewardCategory, 
      rewardName: rewardType.rewardName, 
      description: rewardType.description || "" 
    }); 
    setShowRewardTypeModal(true); 
  }; 
 
  const handleToggleActive = async (rewardType) => { 
    try { 
      const payload = { 
        rewardTypeId: rewardType.rewardTypeId, 
        rewardCategory: rewardType.rewardCategory, 
        rewardName: rewardType.rewardName, 
        description: rewardType.description, 
        isActive: !rewardType.isActive 
      }; 
      const { data } = await api.updateRewardType(rewardType.rewardTypeId, payload); 
      if (data.success) { 
        alert(`Reward type ${!rewardType.isActive ? "activated" : "deactivated"} successfully!`); 
        fetchRewardTypes(); 
        if (selectedRewardType?.rewardTypeId === rewardType.rewardTypeId) { 
          setSelectedRewardType(null); 
        } 
      } 
    } catch (error) { 
      alert("Error updating reward type: " + error.response?.data?.message); 
    } 
  }; 
 
  const handleCreateRewardType = async (e) => { 
    e.preventDefault(); 
    try { 
      if (isEditMode) { 
        const payload = { 
          ...rewardTypeForm, 
          rewardTypeId: editingRewardTypeId 
        }; 
        const { data } = await api.updateRewardType(editingRewardTypeId, payload); 
        if (data.success) { 
          alert("Reward type updated successfully!"); 
          setShowRewardTypeModal(false); 
          setIsEditMode(false); 
          setEditingRewardTypeId(null); 
          fetchRewardTypes(); 
          setSelectedRewardType(null); 
        } 
      } else { 
        const payload = { ...rewardTypeForm, createdBy: 1 }; 
        const { data } = await api.createRewardType(payload); 
        if (data.success) { 
          alert("Reward type created successfully!"); 
          setShowRewardTypeModal(false); 
          fetchRewardTypes(); 
        } 
      } 
      setRewardTypeForm({ rewardCategory: "Recognition", rewardName: "", description: "" }); 
    } catch (error) { 
      alert(`Error ${isEditMode ? "updating" : "creating"} reward type: ` + error.response?.data?.message); 
    } 
  }; 
 
  const handleCreateParameter = async (e) => { 
    e.preventDefault(); 
    if (!selectedRewardType) { 
      alert("Please select a reward type first"); 
      return; 
    } 
 
    try { 
      const payload = { 
        ...parameterForm, 
        rewardTypeId: selectedRewardType.rewardTypeId, 
        minimumValue: parameterForm.minimumValue ? parseInt(parameterForm.minimumValue) : null, 
        maximumValue: parameterForm.maximumValue ? parseInt(parameterForm.maximumValue) : null 
      }; 
 
      const { data } = await api.createParameter(payload); 
      if (data.success) { 
        alert("Parameter created successfully!"); 
        setShowParameterModal(false); 
        setParameterForm({ 
          parameterName: "", 
          parameterType: "Text", 
          isRequired: true, 
          placeholderText: "", 
          minimumValue: "", 
          maximumValue: "", 
          sortOrder: parameters.length + 1 
        }); 
        fetchParameters(selectedRewardType.rewardTypeId); 
      } 
    } catch (error) { 
      alert("Error creating parameter: " + error.response?.data?.message); 
    } 
  }; 
 
  const handleDeleteParameter = async (parameterId) => { 
    if (!window.confirm("Are you sure you want to delete this parameter?")) return; 
 
    try { 
      const { data } = await api.deleteParameter(parameterId); 
      if (data.success) { 
        alert("Parameter deleted successfully"); 
        fetchParameters(selectedRewardType.rewardTypeId); 
      } 
    } catch (error) { 
      alert("Error deleting parameter: " + error.response?.data?.message); 
    } 
  }; 
 
  // Filter Active and Inactive Recognition Types
  const activeRewardTypes = rewardTypes.filter(rt => rt.isActive === true); 
  const inactiveRewardTypes = rewardTypes.filter(rt => rt.isActive === false); 
 
  const displayedRewards = activeTab === "Active" ? activeRewardTypes : inactiveRewardTypes; 
 
  const RewardTypeCard = ({ rewardType }) => ( 
    <div 
      onClick={() => { 
        setSelectedRewardType(rewardType); 
        fetchParameters(rewardType.rewardTypeId); 
      }} 
      style={{ 
        padding: "14px 16px", 
        border: "1px solid #e5e7eb", 
        borderRadius: "8px", 
        background: selectedRewardType?.rewardTypeId === rewardType.rewardTypeId ? "#f0f9ff" : "#fff", 
        borderColor: selectedRewardType?.rewardTypeId === rewardType.rewardTypeId ? "#27235C" : "#e5e7eb", 
        borderWidth: selectedRewardType?.rewardTypeId === rewardType.rewardTypeId ? "2px" : "1px", 
        transition: "all 0.2s", 
        boxShadow: selectedRewardType?.rewardTypeId === rewardType.rewardTypeId ? "0 2px 8px rgba(39, 35, 92, 0.15)" : "none", 
        cursor: "pointer", 
        marginBottom: "10px" 
      }} 
    > 
      <div style={{ marginBottom: "10px" }}> 
        <div style={{ fontWeight: "600", color: "#27235C", marginBottom: "6px", fontSize: "15px" }}> 
          {rewardType.rewardName} 
        </div> 
        <div style={{ fontSize: "13px", color: "#6b7280", display: "flex", alignItems: "center", gap: "8px" }}> 
          <span style={{ 
            padding: "2px 8px", 
            background: "#f3f4f6", 
            borderRadius: "4px", 
            fontSize: "12px", 
            fontWeight: "500" 
          }}> 
            {rewardType.parameterCount} parameters 
          </span> 
          <span style={{ 
            padding: "4px 10px", 
            background: rewardType.isActive ? "#d1fae5" : "#fee2e2", 
            color: rewardType.isActive ? "#065f46" : "#991b1b", 
            borderRadius: "4px", 
            fontSize: "11px", 
            fontWeight: "600" 
          }}> 
            {rewardType.isActive ? "● Active" : "● Inactive"} 
          </span> 
        </div> 
      </div> 
 
      <div style={{ display: "flex", gap: "6px" }}> 
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            handleEditRewardType(rewardType); 
          }} 
          style={{ 
            flex: 1, 
            padding: "8px 12px", 
            fontSize: "13px", 
            background: "#eff6ff", 
            color: "#1e40af", 
            border: "1px solid #bfdbfe", 
            borderRadius: "6px", 
            cursor: "pointer", 
            fontWeight: "600", 
            transition: "all 0.2s" 
          }} 
          onMouseOver={(e) => e.currentTarget.style.background = "#dbeafe"} 
          onMouseOut={(e) => e.currentTarget.style.background = "#eff6ff"} 
        > 
          Edit 
        </button> 
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            handleToggleActive(rewardType); 
          }} 
          style={{ 
            flex: 1, 
            padding: "8px 12px", 
            fontSize: "13px", 
            background: rewardType.isActive ? "#fee2e2" : "#d1fae5", 
            color: rewardType.isActive ? "#dc2626" : "#059669", 
            border: rewardType.isActive ? "1px solid #fecaca" : "1px solid #a7f3d0", 
            borderRadius: "6px", 
            cursor: "pointer", 
            fontWeight: "600", 
            transition: "all 0.2s" 
          }} 
          onMouseOver={(e) => e.currentTarget.style.opacity = "0.8"} 
          onMouseOut={(e) => e.currentTarget.style.opacity = "1"} 
        > 
          {rewardType.isActive ? "⊘ Deactivate" : "✓ Activate"} 
        </button> 
      </div> 
    </div> 
  ); 
 
  return ( 
    <div style={{ padding: "30px 40px", maxWidth: "1600px", margin: "0 auto", background: "#F7F8FA", minHeight: "100vh" }}> 
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}> 
        <div> 
          <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "8px", color: "#27235C", letterSpacing: "-0.5px" }}> 
            Recognition Configuration 
          </h1> 
          <p style={{ fontSize: "15px", color: "#6b7280" }}> 
            Configure recognition reward types and nomination parameters 
          </p> 
        </div> 
        <button 
          onClick={() => { 
            setIsEditMode(false); 
            setEditingRewardTypeId(null); 
            setRewardTypeForm({ 
              rewardCategory: "Recognition", 
              rewardName: "", 
              description: "" 
            }); 
            setShowRewardTypeModal(true); 
          }} 
          style={{ 
            padding: "12px 24px", 
            background: "#27235C", 
            color: "#fff", 
            border: "none", 
            borderRadius: "8px", 
            fontSize: "15px", 
            fontWeight: "600", 
            cursor: "pointer", 
            boxShadow: "0 2px 4px rgba(39, 35, 92, 0.2)", 
            transition: "all 0.2s" 
          }} 
        > 
          + Create Reward Type 
        </button> 
      </div> 
 
      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: "24px" }}> 
        {/* LEFT SIDEBAR */}
        <div> 
          <div style={{ 
            display: "flex", 
            gap: "8px", 
            marginBottom: "16px", 
            background: "#fff", 
            padding: "6px", 
            borderRadius: "10px", 
            border: "1px solid #e5e7eb" 
          }}> 
            <button 
              onClick={() => setActiveTab("Active")} 
              style={{ 
                flex: 1, 
                padding: "10px 16px", 
                background: activeTab === "Active" ? "#27235C" : "transparent", 
                color: activeTab === "Active" ? "#fff" : "#6b7280", 
                border: "none", 
                borderRadius: "6px", 
                fontSize: "14px", 
                fontWeight: "600", 
                cursor: "pointer", 
                transition: "all 0.2s" 
              }} 
            > 
              Active ({activeRewardTypes.length}) 
            </button> 
            <button 
              onClick={() => setActiveTab("Inactive")} 
              style={{ 
                flex: 1, 
                padding: "10px 16px", 
                background: activeTab === "Inactive" ? "#27235C" : "transparent", 
                color: activeTab === "Inactive" ? "#fff" : "#6b7280", 
                border: "none", 
                borderRadius: "6px", 
                fontSize: "14px", 
                fontWeight: "600", 
                cursor: "pointer", 
                transition: "all 0.2s" 
              }} 
            > 
              Inactive ({inactiveRewardTypes.length}) 
            </button> 
          </div> 
 
          <div style={{ 
            background: "#fff", 
            border: "1px solid #e5e7eb", 
            borderRadius: "12px", 
            padding: "20px", 
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" 
          }}> 
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "#27235C" }}> 
              Recognition Rewards 
            </h3> 
 
            {loading ? ( 
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280" }}> 
                <div className="spinner-border" role="status" style={{ color: "#27235C", width: "32px", height: "32px" }}> 
                  <span className="sr-only">Loading...</span> 
                </div> 
                <p style={{ marginTop: "12px", fontSize: "14px" }}>Loading...</p> 
              </div> 
            ) : ( 
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}> 
                {displayedRewards.length === 0 ? (
                  <div style={{ 
                    textAlign: "center", 
                    padding: "40px 20px", 
                    color: "#9ca3af", 
                    background: "#f9fafb", 
                    borderRadius: "8px", 
                    border: "1px dashed #d1d5db" 
                  }}> 
                    <div style={{ fontSize: "14px" }}>No {activeTab.toLowerCase()} rewards</div> 
                  </div> 
                ) : (
                  displayedRewards.map((rt) => ( 
                    <RewardTypeCard key={rt.rewardTypeId} rewardType={rt} /> 
                  ))
                )} 
              </div> 
            )} 
          </div> 
        </div> 
 
        {/* RIGHT PANEL */}
        <div style={{ 
          background: "#fff", 
          border: "1px solid #e5e7eb", 
          borderRadius: "12px", 
          padding: "24px", 
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" 
        }}> 
          {selectedRewardType ? ( 
            <> 
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}> 
                <div> 
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}> 
                    <h3 style={{ fontSize: "22px", fontWeight: "600", color: "#27235C", margin: 0 }}> 
                      {selectedRewardType.rewardName} 
                    </h3> 
                    <span style={{ 
                      padding: "4px 12px", 
                      background: "#dbeafe", 
                      color: "#1e40af", 
                      borderRadius: "6px", 
                      fontSize: "12px", 
                      fontWeight: "600" 
                    }}> 
                      Recognition 
                    </span> 
                  </div> 
                  <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}> 
                    {selectedRewardType.description || "No description provided"} 
                  </p> 
                </div> 
                <button 
                  onClick={() => setShowParameterModal(true)} 
                  style={{ 
                    padding: "10px 20px", 
                    background: "#10b981", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: "8px", 
                    fontSize: "14px", 
                    fontWeight: "600", 
                    cursor: "pointer", 
                    boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)" 
                  }} 
                > 
                  + Add Parameter 
                </button> 
              </div> 
 
              {parameters.length === 0 ? ( 
                <div style={{ 
                  textAlign: "center", 
                  padding: "60px 20px", 
                  background: "#f9fafb", 
                  borderRadius: "8px", 
                  border: "1px dashed #d1d5db" 
                }}> 
                  <div style={{ fontSize: "16px", color: "#6b7280", marginBottom: "8px" }}> 
                    No parameters configured 
                  </div> 
                  <div style={{ fontSize: "14px", color: "#9ca3af" }}> 
                    Add parameters to customize nomination forms 
                  </div> 
                </div> 
              ) : ( 
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}> 
                  <thead> 
                    <tr style={{ borderBottom: "2px solid #e5e7eb", background: "#f9fafb" }}> 
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#374151" }}>Parameter Name</th> 
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#374151" }}>Type</th> 
                      <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "#374151" }}>Required</th> 
                      <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "#374151" }}>Order</th> 
                      <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "#374151" }}>Actions</th> 
                    </tr> 
                  </thead> 
                  <tbody> 
                    {parameters.map((param) => ( 
                      <tr key={param.parameterId} style={{ borderBottom: "1px solid #f3f4f6" }}> 
                        <td style={{ padding: "14px 12px", fontWeight: "500", color: "#111827" }}>{param.parameterName}</td> 
                        <td style={{ padding: "14px 12px", color: "#6b7280" }}>{param.parameterType}</td> 
                        <td style={{ padding: "14px 12px", textAlign: "center" }}> 
                          {param.isRequired ? ( 
                            <span style={{ color: "#ef4444", fontWeight: "600" }}>Yes</span> 
                          ) : ( 
                            <span style={{ color: "#6b7280" }}>No</span> 
                          )} 
                        </td> 
                        <td style={{ padding: "14px 12px", textAlign: "center", color: "#6b7280" }}>{param.sortOrder}</td> 
                        <td style={{ padding: "14px 12px", textAlign: "center" }}> 
                          <button 
                            onClick={() => handleDeleteParameter(param.parameterId)} 
                            style={{ 
                              padding: "6px 14px", 
                              fontSize: "13px", 
                              background: "#fee2e2", 
                              color: "#dc2626", 
                              border: "1px solid #fecaca", 
                              borderRadius: "6px", 
                              cursor: "pointer", 
                              fontWeight: "500" 
                            }} 
                          > 
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
              <div style={{ fontSize: "18px", marginBottom: "8px", fontWeight: "500" }}> 
                Select a recognition reward to view parameters 
              </div> 
              <div style={{ fontSize: "14px" }}>Choose from Active or Inactive rewards</div> 
            </div> 
          )} 
        </div> 
      </div> 
 
      {/* MODALS */}
      {showRewardTypeModal && ( 
        <div 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: "rgba(0,0,0,0.5)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 1000 
          }} 
          onClick={() => { 
            setShowRewardTypeModal(false); 
            setIsEditMode(false); 
            setEditingRewardTypeId(null); 
          }} 
        > 
          <div 
            style={{ 
              background: "#fff", 
              borderRadius: "12px", 
              padding: "24px", 
              width: "500px", 
              maxWidth: "90%" 
            }} 
            onClick={(e) => e.stopPropagation()} 
          > 
            <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "20px", color: "#27235C" }}> 
              {isEditMode ? "Edit Recognition" : "Create Recognition"} 
            </h3> 
 
            <form onSubmit={handleCreateRewardType}> 
              <div style={{ marginBottom: "16px" }}> 
                <label style={{ display: "block", fontSize: "14px", marginBottom: "6px", fontWeight: "500" }}> 
                  Recognition Name 
                </label> 
                <input 
                  type="text" 
                  value={rewardTypeForm.rewardName} 
                  onChange={(e) => setRewardTypeForm({ ...rewardTypeForm, rewardName: e.target.value })} 
                  placeholder="e.g. Employee of the Year" 
                  style={{ 
                    width: "100%", 
                    padding: "10px", 
                    fontSize: "14px", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "6px", 
                    boxSizing: "border-box"
                  }} 
                  required 
                /> 
              </div> 
 
              <div style={{ marginBottom: "20px" }}> 
                <label style={{ display: "block", fontSize: "14px", marginBottom: "6px", fontWeight: "500" }}> 
                  Description 
                </label> 
                <textarea 
                  value={rewardTypeForm.description} 
                  onChange={(e) => setRewardTypeForm({ ...rewardTypeForm, description: e.target.value })} 
                  placeholder="Brief description of this recognition..." 
                  style={{ 
                    width: "100%", 
                    padding: "10px", 
                    fontSize: "14px", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "6px", 
                    minHeight: "80px", 
                    resize: "vertical",
                    boxSizing: "border-box"
                  }} 
                /> 
              </div> 
 
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}> 
                <button 
                  type="button" 
                  onClick={() => { 
                    setShowRewardTypeModal(false); 
                    setIsEditMode(false); 
                    setEditingRewardTypeId(null); 
                  }} 
                  style={{ 
                    padding: "10px 20px", 
                    fontSize: "14px", 
                    fontWeight: "600", 
                    background: "#fff", 
                    color: "#374151", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "6px", 
                    cursor: "pointer" 
                  }} 
                > 
                  Cancel 
                </button> 
                <button 
                  type="submit" 
                  style={{ 
                    padding: "10px 20px", 
                    fontSize: "14px", 
                    fontWeight: "600", 
                    background: "#27235C", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: "6px", 
                    cursor: "pointer" 
                  }} 
                > 
                  {isEditMode ? "Update" : "Create"} 
                </button> 
              </div> 
            </form> 
          </div> 
        </div> 
      )} 
 
      {showParameterModal && ( 
        <div 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: "rgba(0,0,0,0.5)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 1000 
          }} 
          onClick={() => setShowParameterModal(false)} 
        > 
          <div 
            style={{ 
              background: "#fff", 
              borderRadius: "12px", 
              padding: "24px", 
              width: "500px", 
              maxWidth: "90%", 
              maxHeight: "90vh", 
              overflowY: "auto" 
            }} 
            onClick={(e) => e.stopPropagation()} 
          > 
            <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "20px", color: "#27235C" }}> 
              Add Parameter 
            </h3> 
 
            <form onSubmit={handleCreateParameter}> 
              <div style={{ marginBottom: "16px" }}> 
                <label style={{ display: "block", fontSize: "14px", marginBottom: "6px", fontWeight: "500" }}> 
                  Parameter Name 
                </label> 
                <input 
                  type="text" 
                  value={parameterForm.parameterName} 
                  onChange={(e) => setParameterForm({ ...parameterForm, parameterName: e.target.value })} 
                  placeholder="e.g. Goal Achievement Rating" 
                  style={{ 
                    width: "100%", 
                    padding: "10px", 
                    fontSize: "14px", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "6px",
                    boxSizing: "border-box"
                  }} 
                  required 
                /> 
              </div> 
 
              <div style={{ marginBottom: "16px" }}> 
                <label style={{ display: "block", fontSize: "14px", marginBottom: "6px", fontWeight: "500" }}> 
                  Type 
                </label> 
                <select 
                  value={parameterForm.parameterType} 
                  onChange={(e) => setParameterForm({ ...parameterForm, parameterType: e.target.value })} 
                  style={{ 
                    width: "100%", 
                    padding: "10px", 
                    fontSize: "14px", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "6px",
                    boxSizing: "border-box"
                  }} 
                  required 
                > 
                  <option value="Text">Text</option> 
                  <option value="TextArea">Text Area</option> 
                  <option value="Number">Number</option> 
                  <option value="Rating">Rating</option> 
                  <option value="Date">Date</option> 
                </select> 
              </div> 
 
              <div style={{ marginBottom: "16px" }}> 
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}> 
                  <input 
                    type="checkbox" 
                    checked={parameterForm.isRequired} 
                    onChange={(e) => setParameterForm({ ...parameterForm, isRequired: e.target.checked })} 
                  /> 
                  <span style={{ fontWeight: "500" }}>Required Field</span> 
                </label> 
              </div> 
 
              <div style={{ marginBottom: "16px" }}> 
                <label style={{ display: "block", fontSize: "14px", marginBottom: "6px", fontWeight: "500" }}> 
                  Placeholder Text 
                </label> 
                <input 
                  type="text" 
                  value={parameterForm.placeholderText} 
                  onChange={(e) => setParameterForm({ ...parameterForm, placeholderText: e.target.value })} 
                  placeholder="Hint text for the field..." 
                  style={{ 
                    width: "100%", 
                    padding: "10px", 
                    fontSize: "14px", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "6px",
                    boxSizing: "border-box"
                  }} 
                /> 
              </div> 
 
              {(parameterForm.parameterType === "Number" || parameterForm.parameterType === "Rating") && ( 
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}> 
                  <div> 
                    <label style={{ display: "block", fontSize: "14px", marginBottom: "6px", fontWeight: "500" }}> 
                      Min Value 
                    </label> 
                    <input 
                      type="number" 
                      value={parameterForm.minimumValue} 
                      onChange={(e) => setParameterForm({ ...parameterForm, minimumValue: e.target.value })} 
                      style={{ 
                        width: "100%", 
                        padding: "10px", 
                        fontSize: "14px", 
                        border: "1px solid #d1d5db", 
                        borderRadius: "6px",
                        boxSizing: "border-box"
                      }} 
                    /> 
                  </div> 
                  <div> 
                    <label style={{ display: "block", fontSize: "14px", marginBottom: "6px", fontWeight: "500" }}> 
                      Max Value 
                    </label> 
                    <input 
                      type="number" 
                      value={parameterForm.maximumValue} 
                      onChange={(e) => setParameterForm({ ...parameterForm, maximumValue: e.target.value })} 
                      style={{ 
                        width: "100%", 
                        padding: "10px", 
                        fontSize: "14px", 
                        border: "1px solid #d1d5db", 
                        borderRadius: "6px",
                        boxSizing: "border-box"
                      }} 
                    /> 
                  </div> 
                </div> 
              )} 
 
              <div style={{ marginBottom: "20px" }}> 
                <label style={{ display: "block", fontSize: "14px", marginBottom: "6px", fontWeight: "500" }}> 
                  Sort Order 
                </label> 
                <input 
                  type="number" 
                  value={parameterForm.sortOrder} 
                  onChange={(e) => setParameterForm({ ...parameterForm, sortOrder: parseInt(e.target.value) })} 
                  min="1" 
                  style={{ 
                    width: "100%", 
                    padding: "10px", 
                    fontSize: "14px", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "6px",
                    boxSizing: "border-box"
                  }} 
                  required 
                /> 
              </div> 
 
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}> 
                <button 
                  type="button" 
                  onClick={() => setShowParameterModal(false)} 
                  style={{ 
                    padding: "10px 20px", 
                    fontSize: "14px", 
                    fontWeight: "600", 
                    background: "#fff", 
                    color: "#374151", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "6px", 
                    cursor: "pointer" 
                  }} 
                > 
                  Cancel 
                </button> 
                <button 
                  type="submit" 
                  style={{ 
                    padding: "10px 20px", 
                    fontSize: "14px", 
                    fontWeight: "600", 
                    background: "#10b981", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: "6px", 
                    cursor: "pointer" 
                  }} 
                > 
                  Add Parameter 
                </button> 
              </div> 
            </form> 
          </div> 
        </div> 
      )} 
    </div> 
  ); 
} 
 
export default RewardConfiguration;
