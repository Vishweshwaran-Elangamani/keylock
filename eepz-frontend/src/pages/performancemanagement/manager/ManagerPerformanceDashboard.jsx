import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/performancemanagement/hr/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ✅ Relevantz Theme Colors
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
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6"
};

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user ? user.empId : null;

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("submit");
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [assessmentData, setAssessmentData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  // ✅ NEW: Filter states
  const [pendingFormNameFilter, setPendingFormNameFilter] = useState("");
  const [pendingTypeFilter, setPendingTypeFilter] = useState("");
  const [completedFormNameFilter, setCompletedFormNameFilter] = useState("");
  const [completedTypeFilter, setCompletedTypeFilter] = useState("");

  useEffect(() => {
    if (userId) {
      fetchAssignments();
    }
  }, [userId]);

  const fetchAssignments = async () => {
    if (!userId) {
      toast.error("Unable to load manager ID. Please login again.");
      return;
    }

    setLoading(true);
    setAssignments([]);

    try {
      const roleResponse = await api.get(`/AppraisalProcess/user/${userId}/role`);

      if (!roleResponse.data.success) {
        toast.error("User not found.");
        return;
      }

      const userRole = roleResponse.data.data;

      if (!userRole.isManager) {
        toast.error("This user is not a Manager.");
        return;
      }

      const assignmentRes = await api.get(`/AppraisalProcess/employee/${userId}`);

      if (assignmentRes.data.success) {
        setAssignments(assignmentRes.data.data);
        const pending = assignmentRes.data.data.filter((a) => !a.isCompleted).length;
        const completed = assignmentRes.data.data.filter((a) => a.isCompleted).length;
        toast.success(`Found ${pending} pending and ${completed} completed assessments.`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const updateAssessmentData = (competencyId, field, value) => {
    setAssessmentData((prev) =>
      prev.map((item) =>
        item.competencyId === competencyId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmitAssessment = async () => {
    const incomplete = assessmentData.filter((item) => !item.rating);
    if (incomplete.length > 0) {
      toast.warning("Please provide ratings for all competencies.");
      return;
    }

    setSubmitting(true);
    const payload = {
      formId: currentAssignment.formId,
      userId: parseInt(userId),
      status: "Submitted",
      assessmentDetails: assessmentData.map((item) => ({
        competencyId: item.competencyId,
        employeeRating: parseInt(item.rating),
        employeeComments: item.comments || "",
      })),
    };

    try {
      const response = await api.post("/SelfAssessment/submit", payload);

      if (response.data?.success) {
        toast.success("Assessment submitted successfully!");
        setShowModal(false);
        await fetchAssignments();
      } else {
        toast.error(response.data?.message || "Failed.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewCompleted = async (assignment) => {
    setCurrentAssignment(assignment);
    setModalMode("view");
    setSubmitting(true);

    try {
      const { data } = await api.get(
        `/SelfAssessment/view/${assignment.formId}/user/${userId}`
      );

      if (data.success) {
        const viewData = data.data.details.map((detail) => ({
          competencyId: detail.competencyId,
          competencyName: detail.competencyName,
          competencyDescription: detail.competencyDescription,
          rating: detail.rating,
          comments: detail.comments || "",
        }));

        setAssessmentData(viewData);
        setShowModal(true);
        toast.info("Assessment loaded successfully");
      } else {
        toast.error("Failed to load submitted assessment.");
      }
    } catch (error) {
      console.error("View error:", error);
      toast.error("Error loading assessment: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Filter logic
  const pendingAssignments = assignments
    .filter((a) => !a.isCompleted)
    .filter((a) => {
      const matchesFormName = a.formName.toLowerCase().includes(pendingFormNameFilter.toLowerCase());
      const matchesType = pendingTypeFilter === "" || a.formType === pendingTypeFilter;
      return matchesFormName && matchesType;
    });

  const completedAssignments = assignments
    .filter((a) => a.isCompleted)
    .filter((a) => {
      const matchesFormName = a.formName.toLowerCase().includes(completedFormNameFilter.toLowerCase());
      const matchesType = completedTypeFilter === "" || a.formType === completedTypeFilter;
      return matchesFormName && matchesType;
    });

  // ✅ Get unique form types for dropdowns
  const allFormTypes = [...new Set(assignments.map(a => a.formType))];

  if (loading) {
    return (
      <div style={styles.container}>
        <ToastContainer />
        <div style={{ textAlign: "center", padding: "60px" }}>
          <div className="spinner-border" style={{ color: THEME.primary }}></div>
          <p style={{ marginTop: "16px", color: THEME.textLight }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <ToastContainer />

      {/* ✅ Bootstrap Icons CDN */}
      <link 
        rel="stylesheet" 
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
      />

      {/* ✅ SIMPLE HEADER - No Card */}
      <div style={styles.headerSection}>
        <div>
          <h2 style={styles.title}>
            <i className="bi bi-speedometer2" style={{ marginRight: "12px" }}></i>
            Team Evaluation
          </h2>
          <p style={styles.subtitle}>Manage and review your performance assessments</p>
        </div>
      </div>

      {/* ✅ TAB NAVIGATION (Only 2 Tabs) */}
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "pending" ? styles.activeTab : styles.inactiveTab),
          }}
          onClick={() => setActiveTab("pending")}
        >
          <i className="bi bi-hourglass-split" style={{ marginRight: "8px" }}></i>
          Pending ({pendingAssignments.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "completed" ? styles.activeTab : styles.inactiveTab),
          }}
          onClick={() => setActiveTab("completed")}
        >
          <i className="bi bi-check-circle" style={{ marginRight: "8px" }}></i>
          Completed ({completedAssignments.length})
        </button>
      </div>

      {/* ✅ PENDING TAB */}
      {activeTab === "pending" && (
        <div style={styles.card}>
          {/* ✅ FILTERS */}
          <div style={styles.filterSection}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>
                <i className="bi bi-search" style={{ marginRight: "6px" }}></i>
                Search Form Name
              </label>
              <input
                type="text"
                placeholder="Search by form name..."
                value={pendingFormNameFilter}
                onChange={(e) => setPendingFormNameFilter(e.target.value)}
                style={styles.filterInput}
              />
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>
                <i className="bi bi-funnel" style={{ marginRight: "6px" }}></i>
                Filter by Type
              </label>
              <select
                value={pendingTypeFilter}
                onChange={(e) => setPendingTypeFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Types</option>
                {allFormTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {(pendingFormNameFilter || pendingTypeFilter) && (
              <button
                onClick={() => {
                  setPendingFormNameFilter("");
                  setPendingTypeFilter("");
                }}
                style={styles.clearButton}
              >
                <i className="bi bi-x-circle" style={{ marginRight: "6px" }}></i>
                Clear Filters
              </button>
            )}
          </div>

          {pendingAssignments.length === 0 ? (
            <div style={styles.emptyState}>
              <i className="bi bi-inbox" style={styles.emptyIcon}></i>
              <h3 style={styles.emptyTitle}>
                {pendingFormNameFilter || pendingTypeFilter 
                  ? "No Matching Assessments" 
                  : "No Pending Assessments"}
              </h3>
              <p style={styles.emptyText}>
                {pendingFormNameFilter || pendingTypeFilter
                  ? "Try adjusting your filters"
                  : "All assessments have been completed!"}
              </p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      <i className="bi bi-file-earmark-text" style={{ marginRight: "6px" }}></i>
                      Form Name
                    </th>
                    <th style={styles.th}>
                      <i className="bi bi-tag" style={{ marginRight: "6px" }}></i>
                      Type
                    </th>
                    <th style={styles.th}>
                      <i className="bi bi-calendar-event" style={{ marginRight: "6px" }}></i>
                      Assigned
                    </th>
                    <th style={styles.th}>
                      <i className="bi bi-calendar-check" style={{ marginRight: "6px" }}></i>
                      Deadline
                    </th>
                    <th style={styles.th}>
                      <i className="bi bi-info-circle" style={{ marginRight: "6px" }}></i>
                      Status
                    </th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAssignments.map((assignment) => (
                    <tr key={assignment.assignmentId} style={styles.tr}>
                      <td style={styles.td}><strong>{assignment.formName}</strong></td>
                      <td style={styles.td}>
                        <span className="badge" style={styles.badgeInfo}>
                          <i className="bi bi-bookmark-fill" style={{ marginRight: "4px", fontSize: "10px" }}></i>
                          {assignment.formType}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(assignment.assignedAt).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        {assignment.deadline
                          ? new Date(assignment.deadline).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td style={styles.td}>
                        <span className="badge" style={styles.badgeWarning}>
                          <i className="bi bi-exclamation-circle-fill" style={{ marginRight: "4px", fontSize: "10px" }}></i>
                          {assignment.status || "Pending"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.actionButton}
                          onClick={() => {
                            setCurrentAssignment(assignment);
                            setModalMode("submit");
                            const initialData = assignment.competencies?.map((comp) => ({
                              competencyId: comp.competencyId,
                              competencyName: comp.name,
                              competencyDescription: comp.description,
                              rating: "",
                              comments: "",
                            })) || [];
                            setAssessmentData(initialData);
                            setShowModal(true);
                          }}
                          onMouseOver={(e) => {
                            e.target.style.background = `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`;
                            e.target.style.transform = "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = THEME.primary;
                            e.target.style.transform = "translateY(0)";
                          }}
                        >
                          <i className="bi bi-send-fill" style={{ marginRight: "6px" }}></i>
                          Submit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ✅ COMPLETED TAB */}
      {activeTab === "completed" && (
        <div style={styles.card}>
          {/* ✅ FILTERS */}
          <div style={styles.filterSection}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>
                <i className="bi bi-search" style={{ marginRight: "6px" }}></i>
                Search Form Name
              </label>
              <input
                type="text"
                placeholder="Search by form name..."
                value={completedFormNameFilter}
                onChange={(e) => setCompletedFormNameFilter(e.target.value)}
                style={styles.filterInput}
              />
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>
                <i className="bi bi-funnel" style={{ marginRight: "6px" }}></i>
                Filter by Type
              </label>
              <select
                value={completedTypeFilter}
                onChange={(e) => setCompletedTypeFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Types</option>
                {allFormTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {(completedFormNameFilter || completedTypeFilter) && (
              <button
                onClick={() => {
                  setCompletedFormNameFilter("");
                  setCompletedTypeFilter("");
                }}
                style={styles.clearButton}
              >
                <i className="bi bi-x-circle" style={{ marginRight: "6px" }}></i>
                Clear Filters
              </button>
            )}
          </div>

          {completedAssignments.length === 0 ? (
            <div style={styles.emptyState}>
              <i className="bi bi-clipboard-check" style={styles.emptyIcon}></i>
              <h3 style={styles.emptyTitle}>
                {completedFormNameFilter || completedTypeFilter
                  ? "No Matching Assessments"
                  : "No Completed Assessments"}
              </h3>
              <p style={styles.emptyText}>
                {completedFormNameFilter || completedTypeFilter
                  ? "Try adjusting your filters"
                  : "Complete your pending assessments to see them here."}
              </p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      <i className="bi bi-file-earmark-text" style={{ marginRight: "6px" }}></i>
                      Form Name
                    </th>
                    <th style={styles.th}>
                      <i className="bi bi-tag" style={{ marginRight: "6px" }}></i>
                      Type
                    </th>
                    <th style={styles.th}>
                      <i className="bi bi-calendar-event" style={{ marginRight: "6px" }}></i>
                      Assigned
                    </th>
                    <th style={styles.th}>
                      <i className="bi bi-calendar-check" style={{ marginRight: "6px" }}></i>
                      Deadline
                    </th>
                    <th style={styles.th}>
                      <i className="bi bi-check-circle" style={{ marginRight: "6px" }}></i>
                      Status
                    </th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {completedAssignments.map((assignment) => (
                    <tr key={assignment.assignmentId} style={styles.tr}>
                      <td style={styles.td}><strong>{assignment.formName}</strong></td>
                      <td style={styles.td}>
                        <span className="badge" style={styles.badgeSuccess}>
                          <i className="bi bi-check-circle-fill" style={{ marginRight: "4px", fontSize: "10px" }}></i>
                          {assignment.formType}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(assignment.assignedAt).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        {assignment.deadline
                          ? new Date(assignment.deadline).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td style={styles.td}>
                        <span className="badge" style={styles.badgeSuccess}>
                          <i className="bi bi-patch-check-fill" style={{ marginRight: "4px", fontSize: "10px" }}></i>
                          {assignment.status || "Submitted"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.viewButton}
                          onClick={() => handleViewCompleted(assignment)}
                          onMouseOver={(e) => {
                            e.target.style.background = "#2563EB";
                            e.target.style.transform = "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = THEME.accent;
                            e.target.style.transform = "translateY(0)";
                          }}
                        >
                          <i className="bi bi-eye-fill" style={{ marginRight: "6px" }}></i>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ✅ ASSESSMENT MODAL */}
      {showModal && currentAssignment && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <i 
                  className={modalMode === "view" ? "bi bi-eye-fill" : "bi bi-pencil-square"} 
                  style={{ marginRight: "12px" }}
                ></i>
                {modalMode === "view" ? "View Assessment" : "Submit Assessment"}
              </h3>
              <p style={styles.modalSubtitle}>
                <i className="bi bi-file-earmark-text" style={{ marginRight: "6px" }}></i>
                {currentAssignment?.formName}
              </p>
            </div>

            {submitting && modalMode === "view" ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div className="spinner-border" style={{ color: THEME.primary }}></div>
                <p style={{ marginTop: "16px", color: THEME.textLight }}>Loading assessment...</p>
              </div>
            ) : (
              <>
                <div style={styles.modalBody}>
                  <table style={styles.modalTable}>
                    <thead>
                      <tr>
                        <th style={styles.th}>
                          <i className="bi bi-star-fill" style={{ marginRight: "6px" }}></i>
                          Competency
                        </th>
                        <th style={styles.th}>
                          <i className="bi bi-info-circle" style={{ marginRight: "6px" }}></i>
                          Description
                        </th>
                        <th style={styles.th}>
                          <i className="bi bi-bar-chart-fill" style={{ marginRight: "6px" }}></i>
                          Rating
                        </th>
                        <th style={styles.th}>
                          <i className="bi bi-chat-left-text" style={{ marginRight: "6px" }}></i>
                          Comments
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessmentData.map((item) => (
                        <tr key={item.competencyId}>
                          <td style={styles.td}>
                            <strong>{item.competencyName}</strong>
                          </td>
                          <td style={styles.td}>
                            {item.competencyDescription || "N/A"}
                          </td>
                          <td style={styles.td}>
                            {modalMode === "view" ? (
                              <span style={styles.ratingDisplay}>
                                <i className="bi bi-star-fill" style={{ marginRight: "4px", color: THEME.warning }}></i>
                                {item.rating} / 5
                              </span>
                            ) : (
                              <select
                                value={item.rating}
                                onChange={(e) =>
                                  updateAssessmentData(
                                    item.competencyId,
                                    "rating",
                                    e.target.value
                                  )
                                }
                                style={styles.select}
                              >
                                <option value="">Select Rating</option>
                                <option value="1">1 - Poor</option>
                                <option value="2">2 - Below Average</option>
                                <option value="3">3 - Average</option>
                                <option value="4">4 - Good</option>
                                <option value="5">5 - Excellent</option>
                              </select>
                            )}
                          </td>
                          <td style={styles.td}>
                            {modalMode === "view" ? (
                              <span style={styles.commentsDisplay}>
                                {item.comments || <em style={{ color: THEME.textLight }}>No comments</em>}
                              </span>
                            ) : (
                              <textarea
                                value={item.comments}
                                onChange={(e) =>
                                  updateAssessmentData(
                                    item.competencyId,
                                    "comments",
                                    e.target.value
                                  )
                                }
                                placeholder="Optional comments..."
                                style={styles.textarea}
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={styles.modalActions}>
                  <button
                    onClick={() => setShowModal(false)}
                    style={styles.cancelButton}
                    onMouseOver={(e) => {
                      e.target.style.background = "#4B5563";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "#6B7280";
                    }}
                  >
                    <i className="bi bi-x-circle" style={{ marginRight: "6px" }}></i>
                    {modalMode === "view" ? "Close" : "Cancel"}
                  </button>
                  {modalMode === "submit" && (
                    <button
                      onClick={handleSubmitAssessment}
                      disabled={submitting}
                      style={{
                        ...styles.submitButton,
                        opacity: submitting ? 0.6 : 1,
                        cursor: submitting ? "not-allowed" : "pointer",
                      }}
                      onMouseOver={(e) => {
                        if (!submitting) {
                          e.target.style.background = `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`;
                          e.target.style.transform = "translateY(-2px)";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!submitting) {
                          e.target.style.background = THEME.primary;
                          e.target.style.transform = "translateY(0)";
                        }
                      }}
                    >
                      <i className="bi bi-send-check-fill" style={{ marginRight: "6px" }}></i>
                      {submitting ? "Submitting..." : "Submit Assessment"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
    background: THEME.background,
    minHeight: "100vh"
  },
  headerSection: {
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: `2px solid ${THEME.border}`
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    margin: 0,
    marginBottom: "8px",
    color: THEME.text,
    display: "flex",
    alignItems: "center"
  },
  subtitle: {
    fontSize: "14px",
    color: THEME.textLight,
    margin: 0
  },
  tabContainer: {
    display: "flex",
    gap: "0",
    marginBottom: "0",
    background: "#FFFFFF",
    borderRadius: "12px 12px 0 0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    overflow: "hidden"
  },
  tab: {
    flex: 1,
    padding: "16px 24px",
    background: "transparent",
    border: "none",
    borderBottom: `3px solid transparent`,
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    color: THEME.textLight,
    transition: "all 0.3s",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  activeTab: {
    background: THEME.primary,
    color: "#FFFFFF",
    borderBottom: `3px solid ${THEME.secondary}`
  },
  inactiveTab: {
    background: "#F8F9FA",
    color: THEME.textLight
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: "0 0 12px 12px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: `1px solid ${THEME.border}`,
    borderTop: "none",
    minHeight: "300px"
  },
  filterSection: {
    display: "flex",
    gap: "16px",
    marginBottom: "20px",
    padding: "16px",
    background: `${THEME.primary}05`,
    borderRadius: "8px",
    border: `1px solid ${THEME.border}`,
    alignItems: "flex-end",
    flexWrap: "wrap"
  },
  filterGroup: {
    flex: 1,
    minWidth: "200px"
  },
  filterLabel: {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: "600",
    color: THEME.text
  },
  filterInput: {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    border: `2px solid ${THEME.border}`,
    borderRadius: "6px",
    outline: "none",
    transition: "border 0.3s"
  },
  filterSelect: {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    border: `2px solid ${THEME.border}`,
    borderRadius: "6px",
    outline: "none",
    transition: "border 0.3s",
    cursor: "pointer"
  },
  clearButton: {
    padding: "8px 16px",
    background: THEME.danger,
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.3s",
    display: "flex",
    alignItems: "center",
    whiteSpace: "nowrap"
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    background: "transparent"
  },
  emptyIcon: {
    fontSize: "64px",
    color: THEME.textLight,
    marginBottom: "16px",
    opacity: 0.3
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: THEME.text,
    marginBottom: "8px"
  },
  emptyText: {
    fontSize: "14px",
    color: THEME.textLight,
    margin: 0
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "14px 16px",
    textAlign: "left",
    background: `${THEME.primary}10`,
    fontWeight: "600",
    fontSize: "13px",
    color: THEME.text,
    borderBottom: `2px solid ${THEME.primary}`,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap"
  },
  tr: {
    borderBottom: `1px solid ${THEME.border}`,
    transition: "all 0.2s"
  },
  td: {
    padding: "14px 16px",
    fontSize: "14px",
    color: THEME.text,
    verticalAlign: "middle"
  },
  badgeInfo: {
    padding: "4px 12px",
    background: `${THEME.accent}20`,
    color: THEME.accent,
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
    whiteSpace: "nowrap"
  },
  badgeWarning: {
    padding: "4px 12px",
    background: `${THEME.warning}20`,
    color: THEME.warning,
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
    whiteSpace: "nowrap"
  },
  badgeSuccess: {
    padding: "4px 12px",
    background: `${THEME.success}20`,
    color: THEME.success,
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
    whiteSpace: "nowrap"
  },
  actionButton: {
    padding: "8px 18px",
    background: THEME.primary,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.3s",
    boxShadow: `0 2px 6px ${THEME.primary}40`,
    whiteSpace: "nowrap"
  },
  viewButton: {
    padding: "8px 18px",
    background: THEME.accent,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.3s",
    boxShadow: `0 2px 6px ${THEME.accent}40`,
    whiteSpace: "nowrap"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100vh",
    backgroundColor: "rgba(39, 35, 92, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(4px)"
  },
  modalContent: {
    backgroundColor: THEME.card,
    borderRadius: "16px",
    maxWidth: "900px",
    width: "90%",
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    position: "relative",
  },
  modalHeader: {
    background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.accent})`,
    padding: "24px 32px",
    borderRadius: "16px 16px 0 0",
    color: "#fff"
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: "700",
    margin: 0,
    marginBottom: "4px",
    display: "flex",
    alignItems: "center"
  },
  modalSubtitle: {
    fontSize: "15px",
    opacity: 0.9,
    margin: 0,
    display: "flex",
    alignItems: "center"
  },
  modalBody: {
    padding: "24px 32px",
    maxHeight: "calc(85vh - 200px)",
    overflowY: "auto"
  },
  modalTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  select: {
    padding: "8px 10px",
    fontSize: "14px",
    border: `2px solid ${THEME.border}`,
    borderRadius: "6px",
    width: "100%",
    outline: "none",
    transition: "border 0.3s"
  },
  textarea: {
    padding: "10px",
    fontSize: "14px",
    border: `2px solid ${THEME.border}`,
    borderRadius: "6px",
    width: "100%",
    minHeight: "70px",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
    outline: "none",
    transition: "border 0.3s"
  },
  ratingDisplay: {
    fontWeight: "700",
    fontSize: "15px",
    color: THEME.secondary,
    display: "flex",
    alignItems: "center"
  },
  commentsDisplay: {
    fontSize: "14px",
    color: THEME.text
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    padding: "20px 32px",
    borderTop: `1px solid ${THEME.border}`
  },
  cancelButton: {
    padding: "12px 28px",
    background: "#6B7280",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
    transition: "all 0.3s",
    display: "flex",
    alignItems: "center"
  },
  submitButton: {
    padding: "12px 28px",
    background: THEME.primary,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
    transition: "all 0.3s",
    boxShadow: `0 4px 12px ${THEME.primary}40`,
    display: "flex",
    alignItems: "center"
  },
};
