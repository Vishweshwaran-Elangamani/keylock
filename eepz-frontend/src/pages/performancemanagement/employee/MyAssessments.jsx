import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/performancemanagement/hr/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ✅ Relevantz Theme Colors (Dark Purple & Blue)
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
  warning: "#F59E0B"
};

function UserAssignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("submit");
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [assessmentData, setAssessmentData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user ? user.empId : null;

  useEffect(() => {
    if (!userId) {
      navigate("/employee/login");
      return;
    }
    fetchAssignments();
  }, [userId, navigate]);

  const fetchAssignments = async () => {
    setLoading(true);

    try {
      const { data } = await api.get(`/AppraisalProcess/employee/${userId}`);
      console.log("API Response:", data);

      if (data.success) {
        setAssignments(data.data);

        const pending = data.data.filter((a) => !a.isCompleted).length;
        const completed = data.data.filter((a) => a.isCompleted).length;

        toast.success(
          `Found ${pending} pending and ${completed} completed assessments.`,
          {
            position: "top-right",
            autoClose: 4000,
          }
        );
      } else {
        toast.error(data.message || "Failed to fetch assignments.", {
          position: "top-right",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load assignments.", {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openSubmitModal = (assignment) => {
    setCurrentAssignment(assignment);
    setModalMode("submit");

    const initialData = assignment.competencies.map((comp) => ({
      competencyId: comp.competencyId,
      competencyName: comp.name,
      competencyDescription: comp.description,
      rating: "",
      comments: "",
    }));

    setAssessmentData(initialData);
    setShowModal(true);

    toast.info(`Starting assessment: ${assignment.formName}`, {
      position: "top-right",
      autoClose: 2000,
    });
  };

  const openViewModal = async (assignment) => {
    setCurrentAssignment(assignment);
    setModalMode("view");
    setSubmitting(true);

    console.log("Opening view for assignment:", assignment);

    try {
      const { data } = await api.get(
        `/SelfAssessment/view/${assignment.formId}/user/${userId}`
      );

      console.log("View API Response:", data);

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

        toast.info("Assessment loaded successfully", {
          position: "top-right",
          autoClose: 2000,
        });
      } else {
        toast.error("Failed to load submitted assessment.", {
          position: "top-right",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error("View error:", error);
      console.error("Error details:", error.response?.data);
      toast.error(
        "Error loading assessment: " + 
        (error.response?.data?.message || error.message),
        {
          position: "top-right",
          autoClose: 4000,
        }
      );
    } finally {
      setSubmitting(false);
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
      toast.warning("Please provide ratings for all competencies.", {
        position: "top-center",
        autoClose: 4000,
      });
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

    console.log("Submitting:", payload);

    try {
      const { data } = await api.post("/SelfAssessment/submit", payload);
      console.log("Submit response:", data);

      if (data.success) {
        toast.success(
          `Assessment submitted successfully for "${currentAssignment.formName}"!`,
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
        setShowModal(false);
        await fetchAssignments();
      } else {
        toast.error("Submission failed: " + (data.message || "Unknown error"), {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        "Submission failed: " +
          (error.response?.data?.message || error.message),
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const pendingAssignments = assignments.filter((a) => !a.isCompleted);
  const completedAssignments = assignments.filter((a) => a.isCompleted);

  if (loading) {
    return (
      <div style={styles.container}>
        <ToastContainer />
        <div style={{ textAlign: "center", padding: "60px" }}>
          <div className="spinner-border" style={{ color: THEME.primary }}></div>
          <p style={{ marginTop: "16px", color: THEME.textLight }}>Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <ToastContainer />
      
      {/* Header */}
      <div style={styles.headerCard}>
        <h2 style={styles.title}>My Performance Assessments</h2>
        <p style={styles.subtitle}>View and complete your assigned performance evaluations</p>
      </div>

      {/* ✅ TAB NAVIGATION */}
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "pending" && styles.activeTab),
          }}
          onClick={() => setActiveTab("pending")}
        >
          Pending Assessments ({pendingAssignments.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "completed" && styles.activeTab),
          }}
          onClick={() => setActiveTab("completed")}
        >
          Completed Assessments ({completedAssignments.length})
        </button>
      </div>

      {assignments.length === 0 && (
        <div style={styles.emptyState}>
          <h3 style={styles.emptyTitle}>No Assessments Found</h3>
          <p style={styles.emptyText}>You don't have any assessments assigned yet.</p>
        </div>
      )}

      {/* ✅ PENDING TAB CONTENT */}
      {activeTab === "pending" && (
        <div style={styles.card}>
          {pendingAssignments.length > 0 ? (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Form Name</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Assigned</th>
                    <th style={styles.th}>Deadline</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAssignments.map((assignment, index) => (
                    <tr key={assignment.assignmentId} style={styles.tr}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}><strong>{assignment.formName}</strong></td>
                      <td style={styles.td}>
                        <span style={styles.badge}>{assignment.formType}</span>
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
                        <span style={styles.badgePending}>{assignment.status}</span>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.actionButton}
                          onClick={() => openSubmitModal(assignment)}
                          onMouseOver={(e) => {
                            e.target.style.background = `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`;
                            e.target.style.transform = "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = THEME.primary;
                            e.target.style.transform = "translateY(0)";
                          }}
                        >
                          Submit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <h3 style={styles.emptyTitle}>No Pending Assessments</h3>
              <p style={styles.emptyText}>All assessments have been completed!</p>
            </div>
          )}
        </div>
      )}

      {/* ✅ COMPLETED TAB CONTENT */}
      {activeTab === "completed" && (
        <div style={styles.card}>
          {completedAssignments.length > 0 ? (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Form Name</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Assigned</th>
                    <th style={styles.th}>Deadline</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {completedAssignments.map((assignment, index) => (
                    <tr key={assignment.assignmentId} style={styles.tr}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}><strong>{assignment.formName}</strong></td>
                      <td style={styles.td}>
                        <span style={styles.badgeCompleted}>
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
                        <span style={styles.badgeSuccess}>{assignment.status}</span>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.viewButton}
                          onClick={() => openViewModal(assignment)}
                          onMouseOver={(e) => {
                            e.target.style.background = "#059669";
                            e.target.style.transform = "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = THEME.success;
                            e.target.style.transform = "translateY(0)";
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <h3 style={styles.emptyTitle}>No Completed Assessments</h3>
              <p style={styles.emptyText}>Complete your pending assessments to see them here.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL (keeping your existing modal code) */}
      {showModal && currentAssignment && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {modalMode === "view" ? "View Assessment" : "Submit Assessment"}
              </h3>
              <p style={styles.modalSubtitle}>{currentAssignment?.formName}</p>
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
                        <th style={styles.th}>#</th>
                        <th style={styles.th}>COMPETENCY NAME</th>
                        <th style={styles.th}>DESCRIPTION</th>
                        <th style={styles.th}>RATING</th>
                        <th style={styles.th}>COMMENTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessmentData.map((item, index) => (
                        <tr key={item.competencyId}>
                          <td style={styles.td}>{index + 1}</td>
                          <td style={styles.td}>
                            <strong>{item.competencyName}</strong>
                          </td>
                          <td style={styles.td}>
                            {item.competencyDescription || "N/A"}
                          </td>
                          <td style={styles.td}>
                            {modalMode === "view" ? (
                              <span style={styles.ratingDisplay}>
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
                                <option value="">Select</option>
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
                              <span style={styles.commentsDisplay}>{item.comments || "-"}</span>
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
                                placeholder="Optional comments"
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
                    {modalMode === "view" ? "Close" : "Cancel"}
                  </button>
                  {modalMode === "submit" && (
                    <button
                      onClick={handleSubmitAssessment}
                      disabled={submitting}
                      style={styles.submitButton}
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
  headerCard: {
    background: "#FFFFFF",
    borderRadius: "12px",
    padding: "24px 32px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: `1px solid ${THEME.border}`
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    margin: 0,
    marginBottom: "8px",
    color: THEME.text
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
    textAlign: "center"
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
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    background: "transparent"
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
    padding: "14px 12px",
    textAlign: "left",
    background: `${THEME.primary}10`,
    fontWeight: "600",
    fontSize: "13px",
    color: THEME.text,
    borderBottom: `2px solid ${THEME.primary}`,
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  tr: {
    borderBottom: `1px solid ${THEME.border}`,
    transition: "all 0.2s"
  },
  td: {
    padding: "14px 12px",
    fontSize: "14px",
    color: THEME.text
  },
  badge: {
    padding: "4px 12px",
    background: `${THEME.accent}20`,
    color: THEME.accent,
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block"
  },
  badgePending: {
    padding: "4px 12px",
    background: `${THEME.warning}20`,
    color: THEME.warning,
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block"
  },
  badgeCompleted: {
    padding: "4px 12px",
    background: `${THEME.success}20`,
    color: THEME.success,
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block"
  },
  badgeSuccess: {
    padding: "4px 12px",
    background: `${THEME.success}20`,
    color: THEME.success,
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block"
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
    boxShadow: `0 2px 6px ${THEME.primary}40`
  },
  viewButton: {
    padding: "8px 18px",
    background: THEME.success,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.3s",
    boxShadow: `0 2px 6px ${THEME.success}40`
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
    marginBottom: "4px"
  },
  modalSubtitle: {
    fontSize: "15px",
    opacity: 0.9,
    margin: 0
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
  },
  commentsDisplay: {
    fontSize: "14px",
    color: THEME.text,
    fontStyle: "italic"
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
    transition: "all 0.3s"
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
    boxShadow: `0 4px 12px ${THEME.primary}40`
  },
};

export default UserAssignments;
