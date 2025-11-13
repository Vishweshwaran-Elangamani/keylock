import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as managerNominationApi from "../../../services/performancemanagement/manager/managernominationapi";

// Theme Colors
const THEME = {
  primary: "#27235C",
  secondary: "#AC5098",
  accent: "#3B4B8C",
  background: "#F8F9FA",
  card: "#FFFFFF",
  text: "#2C3E50",
  textLight: "#6C757D",
  border: "#E0E0E0",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444"
};

function ManagerNomination() {
  // Get manager ID from JWT token
  const user = JSON.parse(localStorage.getItem("user"));
  const empId = user ? user.empId : null;
  const [managerId] = useState(() => empId);

  // State management
  const [rewardTypes, setRewardTypes] = useState([]);
  const [selectedRewardType, setSelectedRewardType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryRewards, setCategoryRewards] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [justification, setJustification] = useState("");
  const [parameterValues, setParameterValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [myNominations, setMyNominations] = useState([]);
  const [showNominationModal, setShowNominationModal] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  // Fetch reward types on mount
  useEffect(() => {
    fetchRewardTypes();
  }, []);

  // Auto-fetch data when managerId is available
  useEffect(() => {
    if (managerId) {
      fetchTeamMembers();
      fetchMyNominations();
    }
  }, [managerId]);

  // ============ API CALLS ============
  const fetchRewardTypes = async () => {
    try {
      const { data } = await managerNominationApi.getRewardTypes();
      if (data.success) {
        setRewardTypes(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching reward types:", error);
      let errorMsg = "Failed to load reward types";
      if (error.response && error.response.data) {
        errorMsg += `\nDetails: ${JSON.stringify(error.response.data)}`;
      } else if (error.message) {
        errorMsg += `\nError: ${error.message}`;
      }
      toast.error(errorMsg);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const { data } = await managerNominationApi.getTeamMembers(managerId);
      if (data.success) {
        setTeamMembers(data.data || []);
        toast.success(`Loaded ${data.data?.length || 0} team members`);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      let errorMsg = "Error loading team members. Please check the Manager ID.";
      if (error.response && error.response.data) {
        errorMsg += `\nDetails: ${JSON.stringify(error.response.data)}`;
      } else if (error.message) {
        errorMsg += `\nError: ${error.message}`;
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyNominations = async () => {
    try {
      const { data } = await managerNominationApi.getMyNominations(managerId);
      if (data.success) {
        setMyNominations(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching nominations:", error);
      let errorMsg = "Failed to load nominations";
      if (error.response && error.response.data) {
        errorMsg += `\nDetails: ${JSON.stringify(error.response.data)}`;
      } else if (error.message) {
        errorMsg += `\nError: ${error.message}`;
      }
      toast.error(errorMsg);
    }
  };

  // ============ HELPER FUNCTIONS ============
  const getNominationStatus = (employeeId) => {
    const nomination = myNominations.find((n) => n?.nominee?.employeeId === employeeId);
    if (!nomination) return "No nomination yet";
    return nomination.status || "Unknown";
  };

  const resetNominationForm = () => {
    setSelectedCategory(null);
    setSelectedRewardType(null);
    setSelectedEmployee(null);
    setJustification("");
    setParameterValues({});
    setParameters([]);
    setCategoryRewards([]);
  };

  // ============ EVENT HANDLERS ============
  const handleNominateClick = (employee) => {
    setSelectedEmployee(employee);
    setSelectedCategory(null);
    setSelectedRewardType(null);
    setCategoryRewards([]);
    setParameters([]);
    setJustification("");
    setParameterValues({});
    setShowNominationModal(true);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedRewardType(null);
    setParameters([]);
    setParameterValues({});
    
    const rewards = rewardTypes.filter((rt) => rt?.rewardCategory === category);
    setCategoryRewards(rewards);
  };

  const handleRewardTypeSelect = async (rewardTypeId) => {
    const rewardType = rewardTypes.find((rt) => rt?.rewardTypeId === rewardTypeId);
    setSelectedRewardType(rewardType);
    setParameters([]);
    setParameterValues({});

    if (rewardTypeId) {
      try {
        const { data } = await managerNominationApi.getNominationParameters(rewardTypeId);
        if (data.success) {
          setParameters(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching parameters:", error);
        toast.error("Error loading parameters. Please try again.");
      }
    }
  };

  const handleParameterChange = (parameterId, value) => {
    setParameterValues({
      ...parameterValues,
      [parameterId]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
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
        `Please fill in all required fields: ${missingParams.map((p) => p.parameterName).join(", ")}`
      );
      return;
    }

    // Submit nomination
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
        setShowNominationModal(false);
        resetNominationForm();
        fetchMyNominations();
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        "Error submitting nomination: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // ============ RENDER FUNCTIONS ============
  const renderParameterField = (parameter) => {
    if (!parameter) return null;
    
    const value = parameterValues[parameter.parameterId] || "";

    const inputStyle = {
      width: "100%",
      padding: "10px 12px",
      fontSize: "14px",
      border: `2px solid ${THEME.border}`,
      borderRadius: "6px",
      outline: "none",
      boxSizing: "border-box"
    };

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
            style={inputStyle}
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
            style={{
              ...inputStyle,
              minHeight: "100px",
              resize: "vertical",
              fontFamily: "inherit",
            }}
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
            style={inputStyle}
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
            style={inputStyle}
          />
        );

      default:
        return null;
    }
  };

  // Filter nominations by status
  const approvedNominations = myNominations.filter((n) => n && n.status === "Approved");
  const pendingNominations = myNominations.filter((n) => n && n.status === "Pending");
  const rejectedNominations = myNominations.filter((n) => n && n.status === "Rejected");

  // Get approved team members
  const approvedMembers = approvedNominations
    .filter((nom) => nom && nom.rewardType && nom.nominee)
    .map((nom) => ({
      name: `${nom.nominee.firstName || ""} ${nom.nominee.lastName || ""}`.trim(),
      rewardName: nom.rewardType.rewardName || "N/A"
    }));

  return (
    <div style={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Congratulations Banner */}
      {approvedMembers.length > 0 && (
        <div style={styles.congratsCard}>
          <div style={styles.congratsHeader}>
            <div style={styles.congratsIcon}>🎉</div>
            <div>
              <h2 style={styles.congratsTitle}>
                Congratulations! {approvedMembers.length} Team {approvedMembers.length === 1 ? "Member" : "Members"} Approved by HR
              </h2>
              <p style={styles.congratsSubtitle}>
                Your nominations have been successfully approved
              </p>
            </div>
          </div>
          
          <div style={styles.approvedMembersList}>
            {approvedMembers.map((member, index) => (
              <div key={index} style={styles.approvedMember}>
                <div style={styles.approvedMemberInfo}>
                  <div style={styles.approvedMemberNumber}>{index + 1}</div>
                  <div>
                    <div style={styles.approvedMemberName}>{member.name}</div>
                    <div style={styles.approvedRewardName}>{member.rewardName}</div>
                  </div>
                </div>
                <div style={styles.approvedBadge}>Approved</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manager Info Display */}
      <div style={styles.card}>
        <div style={styles.infoBar}>
          <span style={styles.infoLabel}>Manager ID: {managerId || "Loading..."}</span>
          {loading && <span style={styles.loadingSpinner}>⏳ Loading data...</span>}
        </div>
      </div>

      {/* Team Members Section with Tabs */}
      {teamMembers.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>My Team Nominations</h2>

          {/* Tabs */}
          <div style={styles.tabContainer}>
            <button
              onClick={() => setActiveTab("pending")}
              style={{
                ...styles.tab,
                ...(activeTab === "pending" ? styles.activeTab : {})
              }}
            >
              Pending ({pendingNominations.length})
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              style={{
                ...styles.tab,
                ...(activeTab === "approved" ? styles.activeTab : {})
              }}
            >
              Approved ({approvedNominations.length})
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              style={{
                ...styles.tab,
                ...(activeTab === "rejected" ? styles.activeTab : {})
              }}
            >
              Rejected ({rejectedNominations.length})
            </button>
          </div>

          {/* Nominations Table */}
          <div style={{ marginTop: "20px" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Reward Type</th>
                  <th style={styles.th}>Status</th>
                  {activeTab === "pending" && <th style={styles.th}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {activeTab === "pending" && pendingNominations.map((nom, index) => (
                  <tr key={nom?.nominationId || index} style={styles.tr}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      {nom?.nominee?.firstName || ""} {nom?.nominee?.lastName || ""}
                    </td>
                    <td style={styles.td}>{nom?.nominee?.department?.departmentName || "N/A"}</td>
                    <td style={styles.td}>{nom?.rewardType?.rewardName || "N/A"}</td>
                    <td style={styles.td}>
                      <span style={styles.badgePending}>Pending</span>
                    </td>
                    <td style={styles.td}>
                      <button style={styles.viewButton}>View Details</button>
                    </td>
                  </tr>
                ))}

                {activeTab === "approved" && approvedNominations.map((nom, index) => (
                  <tr key={nom?.nominationId || index} style={styles.tr}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      {nom?.nominee?.firstName || ""} {nom?.nominee?.lastName || ""}
                    </td>
                    <td style={styles.td}>{nom?.nominee?.department?.departmentName || "N/A"}</td>
                    <td style={styles.td}>{nom?.rewardType?.rewardName || "N/A"}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeApproved}>Approved</span>
                    </td>
                  </tr>
                ))}

                {activeTab === "rejected" && rejectedNominations.map((nom, index) => (
                  <tr key={nom?.nominationId || index} style={styles.tr}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      {nom?.nominee?.firstName || ""} {nom?.nominee?.lastName || ""}
                    </td>
                    <td style={styles.td}>{nom?.nominee?.department?.departmentName || "N/A"}</td>
                    <td style={styles.td}>{nom?.rewardType?.rewardName || "N/A"}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeRejected}>Rejected</span>
                    </td>
                  </tr>
                ))}

                {((activeTab === "pending" && pendingNominations.length === 0) ||
                  (activeTab === "approved" && approvedNominations.length === 0) ||
                  (activeTab === "rejected" && rejectedNominations.length === 0)) && (
                  <tr>
                    <td colSpan={activeTab === "pending" ? 6 : 5} style={styles.emptyRow}>
                      No {activeTab} nominations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Available for Nomination */}
          <div style={{ marginTop: "32px" }}>
            <h3 style={styles.subsectionTitle}>Available for Nomination</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers
                  .filter((member) => getNominationStatus(member?.employeeId) === "No nomination yet")
                  .map((member, index) => (
                    <tr key={member?.employeeId || index} style={styles.tr}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>
                        {member?.firstName || ""} {member?.lastName || ""}
                      </td>
                      <td style={styles.td}>{member?.department?.departmentName || "N/A"}</td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleNominateClick(member)}
                          style={styles.nominateButton}
                        >
                          Nominate
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Nomination Modal */}
      {showNominationModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowNominationModal(false)}
        >
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                Nominate {selectedEmployee?.firstName || ""} {selectedEmployee?.lastName || ""}
              </h3>
              <p style={styles.modalSubtitle}>
                Select a category and reward type, then fill in the details
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
              {/* Step 1: Select Category */}
              {!selectedCategory && (
                <div style={{ marginBottom: "24px" }}>
                  <label style={styles.formLabel}>
                    Step 1: Select Category <span style={{ color: THEME.danger }}>*</span>
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div
                      onClick={() => handleCategorySelect("Recognition")}
                      style={styles.categoryCard}
                    >
                      <div style={styles.categoryTitle}>Recognition</div>
                      <div style={styles.categoryDesc}>Reward employee achievements</div>
                    </div>

                    <div
                      onClick={() => handleCategorySelect("Promotion")}
                      style={styles.categoryCard}
                    >
                      <div style={styles.categoryTitle}>Promotion</div>
                      <div style={styles.categoryDesc}>Promote to new role</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Select Reward Type */}
              {selectedCategory && !selectedRewardType && (
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ marginBottom: "16px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(null);
                        setCategoryRewards([]);
                      }}
                      style={styles.backButton}
                    >
                      ← Back
                    </button>
                  </div>
                  <label style={styles.formLabel}>
                    Step 2: Select {selectedCategory} Type <span style={{ color: THEME.danger }}>*</span>
                  </label>

                  <div style={{ display: "grid", gap: "12px" }}>
                    {categoryRewards.map((reward) => (
                      <div
                        key={reward?.rewardTypeId}
                        onClick={() => handleRewardTypeSelect(reward?.rewardTypeId)}
                        style={styles.rewardCard}
                      >
                        <div style={{ fontSize: "16px", fontWeight: "600", color: THEME.text }}>
                          {reward?.rewardName || "N/A"}
                        </div>
                        {reward?.description && (
                          <div style={{ fontSize: "13px", color: THEME.textLight, marginTop: "4px" }}>
                            {reward.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Justification & Parameters */}
              {selectedRewardType && (
                <>
                  <div style={styles.selectedInfo}>
                    <strong>Selected:</strong> {selectedRewardType?.rewardName || "N/A"}
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={styles.formLabel}>
                      Justification <span style={{ color: THEME.danger }}>*</span>
                    </label>
                    <textarea
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Explain why this employee deserves this nomination..."
                      required
                      style={{
                        width: "100%",
                        padding: "12px",
                        fontSize: "14px",
                        border: `2px solid ${THEME.border}`,
                        borderRadius: "8px",
                        minHeight: "100px",
                        resize: "vertical",
                        fontFamily: "inherit",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  {/* Parameters */}
                  {parameters.length > 0 && (
                    <div style={{ marginBottom: "24px" }}>
                      <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>
                        Additional Information ({parameters.length} fields)
                      </h4>

                      {parameters.map((parameter, index) => (
                        <div key={parameter?.parameterId || index} style={styles.parameterField}>
                          <label style={styles.formLabel}>
                            {index + 1}. {parameter?.parameterName || "N/A"}
                            {parameter?.isRequired && <span style={{ color: THEME.danger }}> *</span>}
                            <span style={{ fontSize: "12px", color: THEME.textLight, fontWeight: "400", marginLeft: "8px" }}>
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
              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowNominationModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedRewardType}
                  style={{
                    ...styles.submitButton,
                    opacity: !selectedRewardType ? 0.5 : 1,
                    cursor: !selectedRewardType ? "not-allowed" : "pointer"
                  }}
                >
                  Submit Nomination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ STYLES ============
const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
    background: THEME.background,
    minHeight: "100vh"
  },
  
  congratsCard: {
    background: `linear-gradient(135deg, ${THEME.success}20, ${THEME.success}10)`,
    border: `3px solid ${THEME.success}`,
    borderRadius: "16px",
    padding: "32px",
    marginBottom: "24px",
    boxShadow: "0 8px 24px rgba(16, 185, 129, 0.2)"
  },
  
  congratsHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "24px"
  },
  
  congratsIcon: {
    fontSize: "48px",
    lineHeight: "1"
  },
  
  congratsTitle: {
    fontSize: "26px",
    fontWeight: "700",
    color: THEME.success,
    margin: 0,
    marginBottom: "4px"
  },
  
  congratsSubtitle: {
    fontSize: "15px",
    color: THEME.text,
    margin: 0,
    opacity: 0.8
  },
  
  approvedMembersList: {
    display: "grid",
    gap: "12px"
  },
  
  approvedMember: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    background: "#fff",
    borderRadius: "12px",
    border: `2px solid ${THEME.success}30`,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    transition: "all 0.3s"
  },
  
  approvedMemberInfo: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  
  approvedMemberNumber: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.accent})`,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px"
  },
  
  approvedMemberName: {
    fontSize: "16px",
    fontWeight: "600",
    color: THEME.text,
    marginBottom: "4px"
  },
  
  approvedRewardName: {
    fontSize: "13px",
    color: THEME.textLight,
    fontWeight: "500"
  },
  
  approvedBadge: {
    padding: "8px 16px",
    background: THEME.success,
    color: "#fff",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  
  card: {
    backgroundColor: THEME.card,
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: `1px solid ${THEME.border}`
  },
  
  infoBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  
  infoLabel: {
    fontSize: "16px",
    fontWeight: "600",
    color: THEME.text
  },
  
  loadingSpinner: {
    fontSize: "14px",
    color: THEME.textLight
  },
  
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: THEME.text,
    marginBottom: "20px",
    margin: 0
  },
  
  subsectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: THEME.text,
    marginBottom: "16px"
  },
  
  tabContainer: {
    display: "flex",
    gap: "8px",
    borderBottom: `2px solid ${THEME.border}`,
    marginTop: "20px"
  },
  
  tab: {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: "600",
    background: "transparent",
    color: THEME.textLight,
    border: "none",
    borderBottom: "3px solid transparent",
    cursor: "pointer",
    transition: "all 0.3s"
  },
  
  activeTab: {
    color: THEME.primary,
    borderBottomColor: THEME.primary
  },
  
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  
  th: {
    padding: "14px 12px",
    textAlign: "left",
    background: `linear-gradient(135deg, ${THEME.primary}15, ${THEME.accent}10)`,
    fontWeight: "600",
    fontSize: "13px",
    color: THEME.text,
    borderBottom: `2px solid ${THEME.primary}`,
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  
  tr: {
    borderBottom: `1px solid ${THEME.border}`
  },
  
  td: {
    padding: "14px 12px",
    fontSize: "14px",
    color: THEME.text
  },
  
  emptyRow: {
    padding: "32px",
    textAlign: "center",
    color: THEME.textLight,
    fontSize: "14px"
  },
  
  badgePending: {
    padding: "4px 12px",
    background: `${THEME.warning}20`,
    color: THEME.warning,
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600"
  },
  
  badgeApproved: {
    padding: "4px 12px",
    background: `${THEME.success}20`,
    color: THEME.success,
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600"
  },
  
  badgeRejected: {
    padding: "4px 12px",
    background: `${THEME.danger}20`,
    color: THEME.danger,
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600"
  },
  
  nominateButton: {
    padding: "8px 20px",
    fontSize: "14px",
    fontWeight: "600",
    background: THEME.primary,
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.3s"
  },
  
  viewButton: {
    padding: "6px 16px",
    fontSize: "13px",
    fontWeight: "600",
    background: THEME.accent,
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(39, 35, 92, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999
  },
  
  modalContent: {
    background: THEME.card,
    borderRadius: "16px",
    maxWidth: "800px",
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
  },
  
  modalHeader: {
    background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.accent})`,
    padding: "24px",
    borderRadius: "16px 16px 0 0",
    color: "#fff"
  },
  
  modalTitle: {
    fontSize: "22px",
    fontWeight: "700",
    margin: 0,
    marginBottom: "4px"
  },
  
  modalSubtitle: {
    fontSize: "14px",
    opacity: 0.9,
    margin: 0
  },
  
  formLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: THEME.text,
    marginBottom: "8px"
  },
  
  categoryCard: {
    padding: "24px",
    border: `2px solid ${THEME.border}`,
    borderRadius: "12px",
    cursor: "pointer",
    background: "#fff",
    textAlign: "center",
    transition: "all 0.3s"
  },
  
  categoryTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: THEME.text,
    marginBottom: "8px"
  },
  
  categoryDesc: {
    fontSize: "13px",
    color: THEME.textLight
  },
  
  backButton: {
    background: "none",
    border: "none",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    color: THEME.primary
  },
  
  rewardCard: {
    padding: "16px",
    border: `2px solid ${THEME.border}`,
    borderRadius: "8px",
    cursor: "pointer",
    background: "#fff",
    transition: "all 0.3s"
  },
  
  selectedInfo: {
    padding: "12px 16px",
    background: `${THEME.primary}10`,
    borderRadius: "8px",
    borderLeft: `4px solid ${THEME.primary}`,
    fontSize: "14px",
    color: THEME.text,
    marginBottom: "20px"
  },
  
  parameterField: {
    marginBottom: "16px",
    padding: "16px",
    background: THEME.background,
    borderRadius: "8px",
    border: `1px solid ${THEME.border}`
  },
  
  modalActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    paddingTop: "20px",
    borderTop: `1px solid ${THEME.border}`
  },
  
  cancelButton: {
    padding: "12px 28px",
    fontSize: "15px",
    fontWeight: "600",
    background: "#fff",
    color: THEME.text,
    border: `2px solid ${THEME.border}`,
    borderRadius: "8px",
    cursor: "pointer"
  },
  
  submitButton: {
    padding: "12px 28px",
    fontSize: "15px",
    fontWeight: "600",
    background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: `0 4px 12px ${THEME.primary}40`
  }
};

export default ManagerNomination;
