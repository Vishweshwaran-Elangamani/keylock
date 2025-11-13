import React, { useEffect, useState } from "react";
import {
  getDeptHeadSubmittedRatings,
  approveDeptHeadEmployee,
  getApprovedEmployees
} from "../../../services/performancemanagement/hr/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

export default function DeptHeadPage() {
  const [data, setData] = useState([]);
  const [approvedEmployees, setApprovedEmployees] = useState([]);
  const [expandedEmployeeIds, setExpandedEmployeeIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [approvingEmployeeId, setApprovingEmployeeId] = useState(null);
  const pageSize = 5;

  useEffect(() => {
    fetchDeptHeadRatings();
    fetchApprovedEmployees();
  }, [currentPage]);

  const fetchDeptHeadRatings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDeptHeadSubmittedRatings();
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError("Failed to load data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Error fetching data");
      toast.error("Failed to load submitted ratings");
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedEmployees = async () => {
    try {
      const res = await getApprovedEmployees(currentPage, pageSize);
      if (res.data.success) {
        setApprovedEmployees(res.data.data);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error("Error fetching approved employees:", err);
    }
  };

  const handleApprove = async (employee) => {
    setApprovingEmployeeId(employee.employeeId);
    try {
      const res = await approveDeptHeadEmployee({
        employeeId: employee.employeeId,
        projectId: employee.projectId,
        assessmentId: employee.assessmentId
      });

      if (res.data.success) {
        toast.success("Employee approved successfully!");
        setData(prevData =>
          prevData.filter(emp => emp.assessmentId !== employee.assessmentId)
        );
        await fetchApprovedEmployees();
      }
    } catch (err) {
      console.error("Error approving employee:", err);
      const errorMsg = err.response?.data?.message || "Failed to approve employee";
      toast.error(errorMsg);
    } finally {
      setApprovingEmployeeId(null);
    }
  };

  const toggleDetails = (uniqueKey) => {
    setExpandedEmployeeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(uniqueKey)) {
        newSet.delete(uniqueKey);
      } else {
        newSet.add(uniqueKey);
      }
      return newSet;
    });
  };

  const getAvgRating = (competencies, key) => {
    if (!competencies || competencies.length === 0) return "-";
    const vals = competencies
      .filter(c => c[key] != null && c[key] !== -1)
      .map(c => c[key]);
    if (vals.length === 0) return "-";
    const total = vals.reduce((a, b) => a + b, 0);
    return (total / vals.length).toFixed(2);
  };

  const getAvgChecklistProgress = (checklists) => {
    if (!checklists || checklists.length === 0) return 0;
    let totalProgress = 0;
    let count = 0;

    checklists.forEach(cl => {
      if (cl.progresses && cl.progresses.length) {
        cl.progresses.forEach(p => {
          count++;
          totalProgress += p.isCompleted ? 100 : 0;
        });
      }
    });

    if (count === 0) return 0;
    return Math.round(totalProgress / count);
  };

  return (
    <div style={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />

      <div style={styles.header}>
        <h2 style={styles.title}>Department Head Dashboard</h2>
        <p style={styles.subtitle}>Submitted Ratings & Goals Overview</p>
      </div>

      {loading && (
        <div style={styles.loadingCard}>
          <div style={styles.spinner}></div>
          <p>Loading data...</p>
        </div>
      )}

      {error && (
        <div style={styles.errorCard}>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Pending Approvals Section */}
          <div style={styles.tableCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>📋 Pending Approvals</h3>
              <span style={styles.badge}>{data.length} Employees</span>
            </div>

            {data.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>✓</div>
                <p style={styles.emptyText}>No pending approvals</p>
                <p style={styles.emptySubtext}>All submitted assessments have been reviewed</p>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Employee Name</th>
                    <th style={styles.th}>Project</th>
                    <th style={styles.th}>Avg Emp Rating</th>
                    <th style={styles.th}>Avg L1 Rating</th>
                    <th style={styles.th}>Avg L2 Rating</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((emp) => {
                    // Key combining employeeId, projectId, and assessmentId for uniqueness
                    const uniqueKey = `${emp.employeeId}-${emp.projectId}-${emp.assessmentId}`;

                    return (
                      <React.Fragment key={uniqueKey}>
                        <tr style={styles.tr}>
                          <td style={styles.td}>{emp.employeeName}</td>
                          <td style={styles.td}>{emp.projectName}</td>
                          <td style={styles.td}>
                            <span style={styles.ratingBadge}>
                              {getAvgRating(emp.competencies, "employeeRating")}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.ratingBadge}>
                              {getAvgRating(emp.competencies, "l1Rating")}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.ratingBadge}>
                              {getAvgRating(emp.competencies, "l2Rating")}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              <button
                                onClick={() => toggleDetails(uniqueKey)}
                                style={styles.viewButton}
                              >
                                {expandedEmployeeIds.has(uniqueKey) ? "Hide Details" : "View Details"}
                              </button>
                              <button
                                onClick={() => handleApprove(emp)}
                                style={{
                                  ...styles.approveButton,
                                  opacity: approvingEmployeeId === emp.employeeId ? 0.6 : 1,
                                  cursor: approvingEmployeeId === emp.employeeId ? "not-allowed" : "pointer"
                                }}
                                disabled={approvingEmployeeId === emp.employeeId}
                              >
                                {approvingEmployeeId === emp.employeeId ? "Approving..." : "Approve"}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {expandedEmployeeIds.has(uniqueKey) && (
                          <tr key={`${uniqueKey}-expanded`}>
                            <td colSpan={6} style={styles.expandedCell}>
                              <div style={styles.section}>
                                <h4 style={styles.sectionSubtitle}>📊 Competencies</h4>
                                <div style={styles.tableWrapper}>
                                  <table style={styles.innerTable}>
                                    <thead>
                                      <tr>
                                        <th style={styles.innerTh}>Competency</th>
                                        <th style={styles.innerTh}>Emp Rating</th>
                                        <th style={styles.innerTh}>Emp Comments</th>
                                        <th style={styles.innerTh}>L1 Reviewer</th>
                                        <th style={styles.innerTh}>L1 Rating</th>
                                        <th style={styles.innerTh}>L1 Comments</th>
                                        <th style={styles.innerTh}>L2 Reviewer</th>
                                        <th style={styles.innerTh}>L2 Rating</th>
                                        <th style={styles.innerTh}>L2 Comments</th>
                                        <th style={styles.innerTh}>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {emp.competencies && emp.competencies.length > 0 ? (
                                        emp.competencies.map((c, idx) => (
                                          <tr key={`${uniqueKey}-comp-${idx}`} style={styles.innerTr}>
                                            <td style={styles.innerTd}>{c.competencyName}</td>
                                            <td style={styles.innerTd}>
                                              <strong style={{ color: THEME.secondary }}>
                                                {c.employeeRating || "-"}
                                              </strong>
                                            </td>
                                            <td style={styles.innerTd}>{c.employeeComments || "-"}</td>
                                            <td style={styles.innerTd}>{c.l1ReviewerName || "No L1"}</td>
                                            <td style={styles.innerTd}>
                                              <strong style={{ color: THEME.accent }}>
                                                {c.l1Rating || "-"}
                                              </strong>
                                            </td>
                                            <td style={styles.innerTd}>{c.l1Comments || "-"}</td>
                                            <td style={styles.innerTd}>{c.l2ReviewerName || "No L2"}</td>
                                            <td style={styles.innerTd}>
                                              <strong style={{ color: THEME.accent }}>
                                                {c.l2Rating || "-"}
                                              </strong>
                                            </td>
                                            <td style={styles.innerTd}>{c.l2Comments || "-"}</td>
                                            <td style={styles.innerTd}>
                                              <span style={getStatusBadgeStyle(c.status)}>
                                                {c.status}
                                              </span>
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan={10} style={{ ...styles.innerTd, textAlign: "center" }}>
                                            No competencies found
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              <div style={styles.section}>
                                <h4 style={styles.sectionSubtitle}>🎯 Goals</h4>
                                {emp.goals && emp.goals.length === 0 ? (
                                  <p style={styles.noData}>No goals assigned.</p>
                                ) : (
                                  emp.goals.map((goal) => {
                                    const avgProgress = getAvgChecklistProgress(goal.goalChecklists);

                                    return (
                                      <div key={`${uniqueKey}-goal-${goal.goalId}`} style={styles.goalCard}>
                                        <div style={styles.goalHeader}>
                                          <div>
                                            <h5 style={styles.goalTitle}>{goal.goalTitle}</h5>
                                            <p style={styles.goalDescription}>{goal.goalDescription}</p>
                                          </div>
                                          <span style={getGoalStatusBadge(goal.goalstatus)}>
                                            {goal.goalstatus}
                                          </span>
                                        </div>

                                        <div style={styles.progressContainer}>
                                          <div style={styles.progressLabel}>
                                            <span>Progress</span>
                                            <span style={{ fontWeight: "700" }}>{avgProgress}%</span>
                                          </div>
                                          <div style={styles.progressBarBg}>
                                            <div style={{
                                              ...styles.progressBarFill,
                                              width: `${avgProgress}%`
                                            }} />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div style={styles.approvedSection}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.approvedTitle}>✅ Approved Employees</h3>
              <span style={styles.badge}>{approvedEmployees.length} on this page</span>
            </div>

            <div style={styles.approvedTableCard}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Employee Name</th>
                    <th style={styles.th}>Project Name</th>
                    <th style={styles.th}>Approved At</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ ...styles.td, textAlign: "center", padding: "32px" }}>
                        <div style={styles.emptyIcon}>📋</div>
                        <p style={styles.emptyText}>No approved employees yet</p>
                      </td>
                    </tr>
                  ) : (
                    approvedEmployees.map((emp) => (
                      <tr key={emp.approvalId} style={styles.tr}>
                        <td style={styles.td}>{emp.employeeName}</td>
                        <td style={styles.td}>{emp.projectName}</td>
                        <td style={styles.td}>
                          {new Date(emp.approvedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      ...styles.paginationButton,
                      opacity: currentPage === 1 ? 0.5 : 1
                    }}
                  >
                    ← Previous
                  </button>
                  <span style={styles.paginationInfo}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      ...styles.paginationButton,
                      opacity: currentPage === totalPages ? 0.5 : 1
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper functions here (retain previous ones)
function getStatusBadgeStyle(status) {
  let bg = "#E0E0E0";
  let color = "#6C757D";

  if (status === "Completed" || status === "Approved") {
    bg = "#10B98120";
    color = "#10B981";
  } else if (status === "Pending") {
    bg = "#F59E0B20";
    color = "#F59E0B";
  }

  return {
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: bg,
    color: color
  };
}

function getGoalStatusBadge(status) {
  const isCompleted = status && status.toLowerCase() === "completed";
  return {
    padding: "6px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    backgroundColor: isCompleted ? "#10B98120" : "#F59E0B20",
    color: isCompleted ? "#10B981" : "#F59E0B"
  };
}

const styles = {
  container: {
    padding: "32px",
    maxWidth: "1600px",
    margin: "0 auto",
    backgroundColor: THEME.background,
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  header: {
    marginBottom: "32px",
    textAlign: "center"
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: THEME.primary,
    margin: 0
  },
  subtitle: {
    fontSize: "16px",
    color: THEME.textLight,
    marginTop: "8px"
  },
  loadingCard: {
    backgroundColor: THEME.card,
    padding: "48px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: `4px solid ${THEME.border}`,
    borderTop: `4px solid ${THEME.primary}`,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 16px"
  },
  errorCard: {
    backgroundColor: "#FEE2E2",
    color: THEME.danger,
    padding: "20px",
    borderRadius: "12px",
    border: `2px solid ${THEME.danger}`
  },
  tableCard: {
    backgroundColor: THEME.card,
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    overflow: "hidden",
    marginBottom: "32px"
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: `2px solid ${THEME.border}`
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: THEME.primary,
    margin: 0
  },
  badge: {
    padding: "6px 14px",
    backgroundColor: `${THEME.primary}15`,
    color: THEME.primary,
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600"
  },
  emptyState: {
    padding: "60px 20px",
    textAlign: "center"
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px"
  },
  emptyText: {
    fontSize: "18px",
    fontWeight: "600",
    color: THEME.text,
    marginBottom: "8px"
  },
  emptySubtext: {
    fontSize: "14px",
    color: THEME.textLight
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    padding: "16px",
    textAlign: "left",
    backgroundColor: `${THEME.primary}08`,
    fontWeight: "700",
    fontSize: "14px",
    color: THEME.text,
    borderBottom: `3px solid ${THEME.primary}`,
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  tr: {
    borderBottom: `1px solid ${THEME.border}`,
    transition: "background 0.2s"
  },
  td: {
    padding: "16px",
    fontSize: "14px",
    color: THEME.text
  },
  ratingBadge: {
    padding: "6px 12px",
    backgroundColor: `${THEME.secondary}20`,
    color: THEME.secondary,
    borderRadius: "8px",
    fontWeight: "700",
    fontSize: "14px"
  },
  viewButton: {
    padding: "8px 16px",
    backgroundColor: THEME.primary,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.2s"
  },
  approveButton: {
    padding: "8px 16px",
    backgroundColor: THEME.success,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.2s"
  },
  expandedCell: {
    padding: "24px",
    backgroundColor: "#F9FAFB"
  },
  section: {
    marginBottom: "32px"
  },
  sectionSubtitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: THEME.primary,
    marginBottom: "16px"
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "8px",
    border: `1px solid ${THEME.border}`,
    backgroundColor: "#fff"
  },
  innerTable: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1200px"
  },
  innerTh: {
    padding: "12px",
    textAlign: "left",
    backgroundColor: `${THEME.primary}10`,
    fontWeight: "600",
    fontSize: "13px",
    color: THEME.text,
    borderBottom: `2px solid ${THEME.border}`,
    whiteSpace: "nowrap"
  },
  innerTr: {
    borderBottom: `1px solid ${THEME.border}`
  },
  innerTd: {
    padding: "12px",
    fontSize: "13px",
    color: THEME.text,
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  noData: {
    color: THEME.textLight,
    fontSize: "14px",
    fontStyle: "italic",
    padding: "20px"
  },
  goalCard: {
    backgroundColor: "#fff",
    border: `2px solid ${THEME.border}`,
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px"
  },
  goalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px"
  },
  goalTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: THEME.text,
    margin: 0
  },
  goalDescription: {
    fontSize: "14px",
    color: THEME.textLight,
    marginTop: "4px"
  },
  progressContainer: {
    marginTop: "16px"
  },
  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "600"
  },
  progressBarBg: {
    backgroundColor: THEME.border,
    borderRadius: "8px",
    height: "20px",
    overflow: "hidden"
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: THEME.success,
    transition: "width 0.5s",
    borderRadius: "8px"
  },
  approvedSection: {
    marginTop: "48px"
  },
  approvedTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: THEME.success,
    margin: 0
  },
  approvedTableCard: {
    backgroundColor: THEME.card,
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    overflow: "hidden"
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    borderTop: `1px solid ${THEME.border}`
  },
  paginationButton: {
    padding: "10px 20px",
    backgroundColor: THEME.primary,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s",
    cursor: "pointer"
  },
  paginationInfo: {
    fontSize: "14px",
    fontWeight: "600",
    color: THEME.text
  }
};
