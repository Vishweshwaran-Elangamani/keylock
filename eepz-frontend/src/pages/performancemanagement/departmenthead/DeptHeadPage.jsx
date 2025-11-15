// import React, { useEffect, useState } from "react";
// import {
//   getDeptHeadSubmittedRatings,
//   approveDeptHeadEmployee,
//   getApprovedEmployees
// } from "../../../services/performancemanagement/hr/api";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const THEME = {
//   primary: "#27235C",
//   secondary: "#AC5098",
//   accent: "#3B4B8C",
//   background: "#F8F9FA",
//   card: "#FFFFFF",
//   text: "#2C3E50",
//   textLight: "#6C757D",
//   border: "#E0E0E0",
//   success: "#10B981",
//   warning: "#F59E0B",
//   danger: "#EF4444"
// };

// export default function DeptHeadPage() {
//   const [data, setData] = useState([]);
//   const [approvedEmployees, setApprovedEmployees] = useState([]);
//   const [expandedEmployeeIds, setExpandedEmployeeIds] = useState(new Set());
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [approvingEmployeeId, setApprovingEmployeeId] = useState(null);
//   const pageSize = 5;

//   useEffect(() => {
//     fetchDeptHeadRatings();
//     fetchApprovedEmployees();
//   }, [currentPage]);

//   const fetchDeptHeadRatings = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await getDeptHeadSubmittedRatings();
//       if (res.data.success) {
//         setData(res.data.data);
//       } else {
//         setError("Failed to load data");
//       }
//     } catch (err) {
//       console.error("Error fetching data:", err);
//       setError(err.response?.data?.message || "Error fetching data");
//       toast.error("Failed to load submitted ratings");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchApprovedEmployees = async () => {
//     try {
//       const res = await getApprovedEmployees(currentPage, pageSize);
//       if (res.data.success) {
//         setApprovedEmployees(res.data.data);
//         setTotalPages(res.data.totalPages);
//       }
//     } catch (err) {
//       console.error("Error fetching approved employees:", err);
//     }
//   };

//   const handleApprove = async (employee) => {
//     setApprovingEmployeeId(employee.employeeId);
//     try {
//       const res = await approveDeptHeadEmployee({
//         employeeId: employee.employeeId,
//         projectId: employee.projectId,
//         assessmentId: employee.assessmentId
//       });

//       if (res.data.success) {
//         toast.success("Employee approved successfully!");
//         setData(prevData =>
//           prevData.filter(emp => emp.assessmentId !== employee.assessmentId)
//         );
//         await fetchApprovedEmployees();
//       }
//     } catch (err) {
//       console.error("Error approving employee:", err);
//       const errorMsg = err.response?.data?.message || "Failed to approve employee";
//       toast.error(errorMsg);
//     } finally {
//       setApprovingEmployeeId(null);
//     }
//   };

//   const toggleDetails = (uniqueKey) => {
//     setExpandedEmployeeIds((prev) => {
//       const newSet = new Set(prev);
//       if (newSet.has(uniqueKey)) {
//         newSet.delete(uniqueKey);
//       } else {
//         newSet.add(uniqueKey);
//       }
//       return newSet;
//     });
//   };

//   const getAvgRating = (competencies, key) => {
//     if (!competencies || competencies.length === 0) return "-";
//     const vals = competencies
//       .filter(c => c[key] != null && c[key] !== -1)
//       .map(c => c[key]);
//     if (vals.length === 0) return "-";
//     const total = vals.reduce((a, b) => a + b, 0);
//     return (total / vals.length).toFixed(2);
//   };

//   const getAvgChecklistProgress = (checklists) => {
//     if (!checklists || checklists.length === 0) return 0;
//     let totalProgress = 0;
//     let count = 0;

//     checklists.forEach(cl => {
//       if (cl.progresses && cl.progresses.length) {
//         cl.progresses.forEach(p => {
//           count++;
//           totalProgress += p.isCompleted ? 100 : 0;
//         });
//       }
//     });

//     if (count === 0) return 0;
//     return Math.round(totalProgress / count);
//   };

//   return (
//     <div style={styles.container}>
//       <ToastContainer position="top-right" autoClose={3000} />

//       <div style={styles.header}>
//         <h2 style={styles.title}>Department Head Dashboard</h2>
//         <p style={styles.subtitle}>Submitted Ratings & Goals Overview</p>
//       </div>

//       {loading && (
//         <div style={styles.loadingCard}>
//           <div style={styles.spinner}></div>
//           <p>Loading data...</p>
//         </div>
//       )}

//       {error && (
//         <div style={styles.errorCard}>
//           <p>{error}</p>
//         </div>
//       )}

//       {!loading && !error && (
//         <>
//           {/* Pending Approvals Section */}
//           <div style={styles.tableCard}>
//             <div style={styles.sectionHeader}>
//               <h3 style={styles.sectionTitle}>📋 Pending Approvals</h3>
//               <span style={styles.badge}>{data.length} Employees</span>
//             </div>

//             {data.length === 0 ? (
//               <div style={styles.emptyState}>
//                 <div style={styles.emptyIcon}>✓</div>
//                 <p style={styles.emptyText}>No pending approvals</p>
//                 <p style={styles.emptySubtext}>All submitted assessments have been reviewed</p>
//               </div>
//             ) : (
//               <table style={styles.table}>
//                 <thead>
//                   <tr>
//                     <th style={styles.th}>Employee Name</th>
//                     <th style={styles.th}>Project</th>
//                     <th style={styles.th}>Avg Emp Rating</th>
//                     <th style={styles.th}>Avg L1 Rating</th>
//                     <th style={styles.th}>Avg L2 Rating</th>
//                     <th style={styles.th}>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {data.map((emp) => {
//                     // Key combining employeeId, projectId, and assessmentId for uniqueness
//                     const uniqueKey = `${emp.employeeId}-${emp.projectId}-${emp.assessmentId}`;

//                     return (
//                       <React.Fragment key={uniqueKey}>
//                         <tr style={styles.tr}>
//                           <td style={styles.td}>{emp.employeeName}</td>
//                           <td style={styles.td}>{emp.projectName}</td>
//                           <td style={styles.td}>
//                             <span style={styles.ratingBadge}>
//                               {getAvgRating(emp.competencies, "employeeRating")}
//                             </span>
//                           </td>
//                           <td style={styles.td}>
//                             <span style={styles.ratingBadge}>
//                               {getAvgRating(emp.competencies, "l1Rating")}
//                             </span>
//                           </td>
//                           <td style={styles.td}>
//                             <span style={styles.ratingBadge}>
//                               {getAvgRating(emp.competencies, "l2Rating")}
//                             </span>
//                           </td>
//                           <td style={styles.td}>
//                             <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
//                               <button
//                                 onClick={() => toggleDetails(uniqueKey)}
//                                 style={styles.viewButton}
//                               >
//                                 {expandedEmployeeIds.has(uniqueKey) ? "Hide Details" : "View Details"}
//                               </button>
//                               <button
//                                 onClick={() => handleApprove(emp)}
//                                 style={{
//                                   ...styles.approveButton,
//                                   opacity: approvingEmployeeId === emp.employeeId ? 0.6 : 1,
//                                   cursor: approvingEmployeeId === emp.employeeId ? "not-allowed" : "pointer"
//                                 }}
//                                 disabled={approvingEmployeeId === emp.employeeId}
//                               >
//                                 {approvingEmployeeId === emp.employeeId ? "Approving..." : "Approve"}
//                               </button>
//                             </div>
//                           </td>
//                         </tr>

//                         {expandedEmployeeIds.has(uniqueKey) && (
//                           <tr key={`${uniqueKey}-expanded`}>
//                             <td colSpan={6} style={styles.expandedCell}>
//                               <div style={styles.section}>
//                                 <h4 style={styles.sectionSubtitle}>📊 Competencies</h4>
//                                 <div style={styles.tableWrapper}>
//                                   <table style={styles.innerTable}>
//                                     <thead>
//                                       <tr>
//                                         <th style={styles.innerTh}>Competency</th>
//                                         <th style={styles.innerTh}>Emp Rating</th>
//                                         <th style={styles.innerTh}>Emp Comments</th>
//                                         <th style={styles.innerTh}>L1 Reviewer</th>
//                                         <th style={styles.innerTh}>L1 Rating</th>
//                                         <th style={styles.innerTh}>L1 Comments</th>
//                                         <th style={styles.innerTh}>L2 Reviewer</th>
//                                         <th style={styles.innerTh}>L2 Rating</th>
//                                         <th style={styles.innerTh}>L2 Comments</th>
//                                         <th style={styles.innerTh}>Status</th>
//                                       </tr>
//                                     </thead>
//                                     <tbody>
//                                       {emp.competencies && emp.competencies.length > 0 ? (
//                                         emp.competencies.map((c, idx) => (
//                                           <tr key={`${uniqueKey}-comp-${idx}`} style={styles.innerTr}>
//                                             <td style={styles.innerTd}>{c.competencyName}</td>
//                                             <td style={styles.innerTd}>
//                                               <strong style={{ color: THEME.secondary }}>
//                                                 {c.employeeRating || "-"}
//                                               </strong>
//                                             </td>
//                                             <td style={styles.innerTd}>{c.employeeComments || "-"}</td>
//                                             <td style={styles.innerTd}>{c.l1ReviewerName || "No L1"}</td>
//                                             <td style={styles.innerTd}>
//                                               <strong style={{ color: THEME.accent }}>
//                                                 {c.l1Rating || "-"}
//                                               </strong>
//                                             </td>
//                                             <td style={styles.innerTd}>{c.l1Comments || "-"}</td>
//                                             <td style={styles.innerTd}>{c.l2ReviewerName || "No L2"}</td>
//                                             <td style={styles.innerTd}>
//                                               <strong style={{ color: THEME.accent }}>
//                                                 {c.l2Rating || "-"}
//                                               </strong>
//                                             </td>
//                                             <td style={styles.innerTd}>{c.l2Comments || "-"}</td>
//                                             <td style={styles.innerTd}>
//                                               <span style={getStatusBadgeStyle(c.status)}>
//                                                 {c.status}
//                                               </span>
//                                             </td>
//                                           </tr>
//                                         ))
//                                       ) : (
//                                         <tr>
//                                           <td colSpan={10} style={{ ...styles.innerTd, textAlign: "center" }}>
//                                             No competencies found
//                                           </td>
//                                         </tr>
//                                       )}
//                                     </tbody>
//                                   </table>
//                                 </div>
//                               </div>

//                               <div style={styles.section}>
//                                 <h4 style={styles.sectionSubtitle}>🎯 Goals</h4>
//                                 {emp.goals && emp.goals.length === 0 ? (
//                                   <p style={styles.noData}>No goals assigned.</p>
//                                 ) : (
//                                   emp.goals.map((goal) => {
//                                     const avgProgress = getAvgChecklistProgress(goal.goalChecklists);

//                                     return (
//                                       <div key={`${uniqueKey}-goal-${goal.goalId}`} style={styles.goalCard}>
//                                         <div style={styles.goalHeader}>
//                                           <div>
//                                             <h5 style={styles.goalTitle}>{goal.goalTitle}</h5>
//                                             <p style={styles.goalDescription}>{goal.goalDescription}</p>
//                                           </div>
//                                           <span style={getGoalStatusBadge(goal.goalstatus)}>
//                                             {goal.goalstatus}
//                                           </span>
//                                         </div>

//                                         <div style={styles.progressContainer}>
//                                           <div style={styles.progressLabel}>
//                                             <span>Progress</span>
//                                             <span style={{ fontWeight: "700" }}>{avgProgress}%</span>
//                                           </div>
//                                           <div style={styles.progressBarBg}>
//                                             <div style={{
//                                               ...styles.progressBarFill,
//                                               width: `${avgProgress}%`
//                                             }} />
//                                           </div>
//                                         </div>
//                                       </div>
//                                     );
//                                   })
//                                 )}
//                               </div>
//                             </td>
//                           </tr>
//                         )}
//                       </React.Fragment>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             )}
//           </div>

//           <div style={styles.approvedSection}>
//             <div style={styles.sectionHeader}>
//               <h3 style={styles.approvedTitle}>✅ Approved Employees</h3>
//               <span style={styles.badge}>{approvedEmployees.length} on this page</span>
//             </div>

//             <div style={styles.approvedTableCard}>
//               <table style={styles.table}>
//                 <thead>
//                   <tr>
//                     <th style={styles.th}>Employee Name</th>
//                     <th style={styles.th}>Project Name</th>
//                     <th style={styles.th}>Approved At</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {approvedEmployees.length === 0 ? (
//                     <tr>
//                       <td colSpan={3} style={{ ...styles.td, textAlign: "center", padding: "32px" }}>
//                         <div style={styles.emptyIcon}>📋</div>
//                         <p style={styles.emptyText}>No approved employees yet</p>
//                       </td>
//                     </tr>
//                   ) : (
//                     approvedEmployees.map((emp) => (
//                       <tr key={emp.approvalId} style={styles.tr}>
//                         <td style={styles.td}>{emp.employeeName}</td>
//                         <td style={styles.td}>{emp.projectName}</td>
//                         <td style={styles.td}>
//                           {new Date(emp.approvedAt).toLocaleString('en-US', {
//                             year: 'numeric',
//                             month: 'short',
//                             day: 'numeric',
//                             hour: '2-digit',
//                             minute: '2-digit'
//                           })}
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>

//               {totalPages > 1 && (
//                 <div style={styles.pagination}>
//                   <button
//                     onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
//                     disabled={currentPage === 1}
//                     style={{
//                       ...styles.paginationButton,
//                       opacity: currentPage === 1 ? 0.5 : 1
//                     }}
//                   >
//                     ← Previous
//                   </button>
//                   <span style={styles.paginationInfo}>
//                     Page {currentPage} of {totalPages}
//                   </span>
//                   <button
//                     onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
//                     disabled={currentPage === totalPages}
//                     style={{
//                       ...styles.paginationButton,
//                       opacity: currentPage === totalPages ? 0.5 : 1
//                     }}
//                   >
//                     Next →
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// // Helper functions here (retain previous ones)
// function getStatusBadgeStyle(status) {
//   let bg = "#E0E0E0";
//   let color = "#6C757D";

//   if (status === "Completed" || status === "Approved") {
//     bg = "#10B98120";
//     color = "#10B981";
//   } else if (status === "Pending") {
//     bg = "#F59E0B20";
//     color = "#F59E0B";
//   }

//   return {
//     padding: "4px 12px",
//     borderRadius: "6px",
//     fontSize: "12px",
//     fontWeight: "600",
//     backgroundColor: bg,
//     color: color
//   };
// }

// function getGoalStatusBadge(status) {
//   const isCompleted = status && status.toLowerCase() === "completed";
//   return {
//     padding: "6px 14px",
//     borderRadius: "8px",
//     fontSize: "13px",
//     fontWeight: "700",
//     backgroundColor: isCompleted ? "#10B98120" : "#F59E0B20",
//     color: isCompleted ? "#10B981" : "#F59E0B"
//   };
// }

// const styles = {
//   container: {
//     padding: "32px",
//     maxWidth: "1600px",
//     margin: "0 auto",
//     backgroundColor: THEME.background,
//     minHeight: "100vh",
//     fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
//   },
//   header: {
//     marginBottom: "32px",
//     textAlign: "center"
//   },
//   title: {
//     fontSize: "32px",
//     fontWeight: "700",
//     color: THEME.primary,
//     margin: 0
//   },
//   subtitle: {
//     fontSize: "16px",
//     color: THEME.textLight,
//     marginTop: "8px"
//   },
//   loadingCard: {
//     backgroundColor: THEME.card,
//     padding: "48px",
//     borderRadius: "12px",
//     textAlign: "center",
//     boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
//   },
//   spinner: {
//     width: "40px",
//     height: "40px",
//     border: `4px solid ${THEME.border}`,
//     borderTop: `4px solid ${THEME.primary}`,
//     borderRadius: "50%",
//     animation: "spin 1s linear infinite",
//     margin: "0 auto 16px"
//   },
//   errorCard: {
//     backgroundColor: "#FEE2E2",
//     color: THEME.danger,
//     padding: "20px",
//     borderRadius: "12px",
//     border: `2px solid ${THEME.danger}`
//   },
//   tableCard: {
//     backgroundColor: THEME.card,
//     borderRadius: "12px",
//     boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
//     overflow: "hidden",
//     marginBottom: "32px"
//   },
//   sectionHeader: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: "20px 24px",
//     borderBottom: `2px solid ${THEME.border}`
//   },
//   sectionTitle: {
//     fontSize: "20px",
//     fontWeight: "700",
//     color: THEME.primary,
//     margin: 0
//   },
//   badge: {
//     padding: "6px 14px",
//     backgroundColor: `${THEME.primary}15`,
//     color: THEME.primary,
//     borderRadius: "20px",
//     fontSize: "13px",
//     fontWeight: "600"
//   },
//   emptyState: {
//     padding: "60px 20px",
//     textAlign: "center"
//   },
//   emptyIcon: {
//     fontSize: "64px",
//     marginBottom: "16px"
//   },
//   emptyText: {
//     fontSize: "18px",
//     fontWeight: "600",
//     color: THEME.text,
//     marginBottom: "8px"
//   },
//   emptySubtext: {
//     fontSize: "14px",
//     color: THEME.textLight
//   },
//   table: {
//     width: "100%",
//     borderCollapse: "collapse"
//   },
//   th: {
//     padding: "16px",
//     textAlign: "left",
//     backgroundColor: `${THEME.primary}08`,
//     fontWeight: "700",
//     fontSize: "14px",
//     color: THEME.text,
//     borderBottom: `3px solid ${THEME.primary}`,
//     textTransform: "uppercase",
//     letterSpacing: "0.5px"
//   },
//   tr: {
//     borderBottom: `1px solid ${THEME.border}`,
//     transition: "background 0.2s"
//   },
//   td: {
//     padding: "16px",
//     fontSize: "14px",
//     color: THEME.text
//   },
//   ratingBadge: {
//     padding: "6px 12px",
//     backgroundColor: `${THEME.secondary}20`,
//     color: THEME.secondary,
//     borderRadius: "8px",
//     fontWeight: "700",
//     fontSize: "14px"
//   },
//   viewButton: {
//     padding: "8px 16px",
//     backgroundColor: THEME.primary,
//     color: "#fff",
//     border: "none",
//     borderRadius: "8px",
//     cursor: "pointer",
//     fontWeight: "600",
//     fontSize: "13px",
//     transition: "all 0.2s"
//   },
//   approveButton: {
//     padding: "8px 16px",
//     backgroundColor: THEME.success,
//     color: "#fff",
//     border: "none",
//     borderRadius: "8px",
//     cursor: "pointer",
//     fontWeight: "600",
//     fontSize: "13px",
//     transition: "all 0.2s"
//   },
//   expandedCell: {
//     padding: "24px",
//     backgroundColor: "#F9FAFB"
//   },
//   section: {
//     marginBottom: "32px"
//   },
//   sectionSubtitle: {
//     fontSize: "18px",
//     fontWeight: "700",
//     color: THEME.primary,
//     marginBottom: "16px"
//   },
//   tableWrapper: {
//     overflowX: "auto",
//     borderRadius: "8px",
//     border: `1px solid ${THEME.border}`,
//     backgroundColor: "#fff"
//   },
//   innerTable: {
//     width: "100%",
//     borderCollapse: "collapse",
//     minWidth: "1200px"
//   },
//   innerTh: {
//     padding: "12px",
//     textAlign: "left",
//     backgroundColor: `${THEME.primary}10`,
//     fontWeight: "600",
//     fontSize: "13px",
//     color: THEME.text,
//     borderBottom: `2px solid ${THEME.border}`,
//     whiteSpace: "nowrap"
//   },
//   innerTr: {
//     borderBottom: `1px solid ${THEME.border}`
//   },
//   innerTd: {
//     padding: "12px",
//     fontSize: "13px",
//     color: THEME.text,
//     maxWidth: "200px",
//     overflow: "hidden",
//     textOverflow: "ellipsis"
//   },
//   noData: {
//     color: THEME.textLight,
//     fontSize: "14px",
//     fontStyle: "italic",
//     padding: "20px"
//   },
//   goalCard: {
//     backgroundColor: "#fff",
//     border: `2px solid ${THEME.border}`,
//     borderRadius: "12px",
//     padding: "20px",
//     marginBottom: "16px"
//   },
//   goalHeader: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     marginBottom: "16px"
//   },
//   goalTitle: {
//     fontSize: "16px",
//     fontWeight: "700",
//     color: THEME.text,
//     margin: 0
//   },
//   goalDescription: {
//     fontSize: "14px",
//     color: THEME.textLight,
//     marginTop: "4px"
//   },
//   progressContainer: {
//     marginTop: "16px"
//   },
//   progressLabel: {
//     display: "flex",
//     justifyContent: "space-between",
//     marginBottom: "8px",
//     fontSize: "14px",
//     fontWeight: "600"
//   },
//   progressBarBg: {
//     backgroundColor: THEME.border,
//     borderRadius: "8px",
//     height: "20px",
//     overflow: "hidden"
//   },
//   progressBarFill: {
//     height: "100%",
//     backgroundColor: THEME.success,
//     transition: "width 0.5s",
//     borderRadius: "8px"
//   },
//   approvedSection: {
//     marginTop: "48px"
//   },
//   approvedTitle: {
//     fontSize: "20px",
//     fontWeight: "700",
//     color: THEME.success,
//     margin: 0
//   },
//   approvedTableCard: {
//     backgroundColor: THEME.card,
//     borderRadius: "12px",
//     boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
//     overflow: "hidden"
//   },
//   pagination: {
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     gap: "16px",
//     padding: "20px",
//     borderTop: `1px solid ${THEME.border}`
//   },
//   paginationButton: {
//     padding: "10px 20px",
//     backgroundColor: THEME.primary,
//     color: "#fff",
//     border: "none",
//     borderRadius: "8px",
//     fontWeight: "600",
//     fontSize: "14px",
//     transition: "all 0.2s",
//     cursor: "pointer"
//   },
//   paginationInfo: {
//     fontSize: "14px",
//     fontWeight: "600",
//     color: THEME.text
//   }
// };


/**
 * DeptHeadPage Component
 * 
 * Department Head Dashboard for managing employee performance approvals.
 * Features:
 * - Tab-based view: Pending Approvals vs Approved Employees
 * - Advanced filtering: Search, project, date filters
 * - Real-time statistics dashboard
 * - Approve workflow with expandable details
 * - Auto-refresh every 30 seconds
 * - Pagination with customizable rows per page
 * - Toast notifications using Sonner for user feedback
 * 
 * @component
 */

import React, { useEffect, useState } from "react";
import {
  getDeptHeadSubmittedRatings,
  approveDeptHeadEmployee,
  getApprovedEmployees
} from "../../../services/performancemanagement/hr/api";
import { getEmployeeIdForFilter } from "../../../utils/PerformanceManagement/jwtDecoder";
import { toast } from "sonner";
import "../../../styles/performancemanagement/hr/DeptHeadPage.css";

export default function DeptHeadPage() {
  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Data States
   * - pendingRequests: Pending approval employees
   * - approvedRequests: Approved employees (all pages)
   * - loading: Loading state for initial data fetch
   * - lastUpdated: Timestamp of last data refresh
   */
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Tab State
   * Controls which tab is active: "pending" or "approved"
   */
  const [activeTab, setActiveTab] = useState("pending");

  /**
   * Filter States
   * - searchTerm: Text search across employee/project
   * - filterProject: Filter by project name
   * - filterDate: Filter by specific date
   */
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  /**
   * Pagination States
   * - rowsPerPage: Number of rows to display per page
   * - currentPage: Current active page number
   */
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Modal & Process States
   * - showApproveModal: Controls approve modal visibility
   * - showDetailsModal: Controls details modal visibility
   * - selectedEmployee: Currently selected employee
   * - expandedEmployeeIds: Set of expanded employee detail views in table
   * - approvingEmployeeId: ID of employee being approved
   */
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [expandedEmployeeIds, setExpandedEmployeeIds] = useState(new Set());
  const [approvingEmployeeId, setApprovingEmployeeId] = useState(null);

  // ========================
  // EFFECTS
  // ========================

  /**
   * Effect: Fetch Data & Setup Auto-Refresh
   * Runs when component mounts and when activeTab changes
   * Sets up 30-second interval for auto-refresh
   */
  useEffect(() => {
    fetchData();

    // Setup auto-refresh interval
    const refreshInterval = setInterval(() => {
      fetchData(true); // Silent refresh (no loading toast)
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [activeTab]);

  /**
   * Effect: Apply Filters
   * Runs whenever data or any filter criteria changes
   * Automatically refilters and resets pagination
   */
  useEffect(() => {
    applyFilters();
  }, [pendingRequests, approvedRequests, activeTab, searchTerm, filterProject, filterDate]);

  // ========================
  // API FUNCTIONS
  // ========================

  /**
   * Fetches pending and approved data from backend
   * Shows Sonner toast notifications for user feedback
   * 
   * @param {boolean} silent - If true, skips loading toast (for auto-refresh)
   */
  const fetchData = async (silent = false) => {
    try {
      setLoading(true);
      
      const departmentHeadId = getEmployeeIdForFilter();
      
      if (!departmentHeadId) {
        toast.error("Unable to identify department head. Please login again.");
        console.error("Department Head ID not found");
        return;
      }

      // Show loading toast only if not silent refresh
      if (!silent) {
        toast.loading("Loading employee assessments...");
      }

      // -------- Fetch Pending Approvals --------
      const pendingRes = await getDeptHeadSubmittedRatings(departmentHeadId);
      
      // -------- Fetch All Approved Employees --------
      // Fetch all pages of approved employees
      const approvedRes = await getApprovedEmployees(1, 1000, departmentHeadId); // Large page size to get all

      // -------- Handle Success Response --------
      if (pendingRes.data.success) {
        setPendingRequests(pendingRes.data.data || []);
      }

      if (approvedRes.data.success) {
        setApprovedRequests(approvedRes.data.data || []);
      }

      setLastUpdated(new Date());
      
      if (!silent) {
        toast.dismiss();
        toast.success(`Loaded ${pendingRes.data.data?.length || 0} pending and ${approvedRes.data.data?.length || 0} approved assessments`);
      }
    } catch (err) {
      // -------- Handle Exception --------
      console.error("Error fetching data:", err);
      toast.dismiss();
      toast.error("Failed to load employee assessments");
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // FILTER FUNCTIONS
  // ========================

  /**
   * Applies all active filters to requests
   * Filters by: tab (pending/approved), search term, project, and date
   * Updates filteredData state and resets pagination to page 1
   */
  const applyFilters = () => {
    let filtered = activeTab === "pending" ? [...pendingRequests] : [...approvedRequests];

    // -------- Search Filter --------
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.employeeName?.toLowerCase().includes(search) ||
          emp.projectName?.toLowerCase().includes(search) ||
          emp.employeeCompanyId?.toLowerCase().includes(search)
      );
    }

    // -------- Project Filter --------
    if (filterProject) {
      filtered = filtered.filter((emp) => emp.projectName === filterProject);
    }

    // -------- Date Filter --------
    if (filterDate) {
      filtered = filtered.filter((emp) => {
        const dateToCheck = activeTab === "pending" ? emp.requestedAt : emp.approvedAt;
        if (!dateToCheck) return false;
        const empDate = new Date(dateToCheck);
        const filterDateObj = new Date(filterDate);
        return empDate.toDateString() === filterDateObj.toDateString();
      });
    }

    // Update filtered data and reset pagination
    setFilteredData(filtered);
    setCurrentPage(1);
  };

  // ========================
  // APPROVE HANDLERS
  // ========================

  /**
   * Opens approve modal for selected employee
   */
  const handleApproveClick = (employee) => {
    setSelectedEmployee(employee);
    setShowApproveModal(true);
    toast.info(`Processing approval for ${employee.employeeName}`);
  };

  /**
   * Opens details modal for selected employee
   */
  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  /**
   * Submits the approval
   */
  const handleApproveSubmit = async () => {
    if (!selectedEmployee) return;

    setApprovingEmployeeId(selectedEmployee.employeeId);
    try {
      // Show loading toast
      toast.loading("Approving employee...");

      // -------- API Call --------
      const res = await approveDeptHeadEmployee({
        employeeId: selectedEmployee.employeeId,
        projectId: selectedEmployee.projectId,
        assessmentId: selectedEmployee.assessmentId
      });

      // -------- Handle Success Response --------
      if (res.data.success) {
        toast.dismiss();
        toast.success(`${selectedEmployee.employeeName} approved successfully!`);
        
        // Close modal and reset
        setShowApproveModal(false);
        setSelectedEmployee(null);
        
        // Refresh data (silent refresh)
        fetchData(true);
      }
    } catch (err) {
      console.error("Error approving employee:", err);
      const errorMsg = err.response?.data?.message || "Failed to approve employee";
      toast.dismiss();
      toast.error(errorMsg);
    } finally {
      setApprovingEmployeeId(null);
    }
  };

  /**
   * Closes modals and resets states
   */
  const handleModalClose = () => {
    setShowApproveModal(false);
    setShowDetailsModal(false);
    setSelectedEmployee(null);
  };

  // ========================
  // TABLE EXPAND/COLLAPSE
  // ========================

  /**
   * Toggles detail view for employee in table
   */
  const toggleDetails = (employeeId) => {
    setExpandedEmployeeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  // ========================
  // UI HELPER FUNCTIONS
  // ========================

  /**
   * Calculates average rating for competencies
   */
  const getAvgRating = (competencies, key) => {
    if (!competencies || competencies.length === 0) return "-";
    const vals = competencies
      .filter(c => c[key] != null && c[key] !== -1)
      .map(c => c[key]);
    if (vals.length === 0) return "-";
    const total = vals.reduce((a, b) => a + b, 0);
    return (total / vals.length).toFixed(2);
  };

  /**
   * Calculates average checklist progress
   */
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

  /**
   * Formats ISO date string to readable format
   */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Formats Date object to time string
   */
  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  /**
   * Generates user initials from full name
   */
  const getInitials = (name) => {
    if (!name) return "NA";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  /**
   * Gets unique project names for filter dropdown
   */
  const getUniqueProjects = () => {
    const projects = activeTab === "pending" 
      ? pendingRequests.map(emp => emp.projectName)
      : approvedRequests.map(emp => emp.projectName);
    return [...new Set(projects)].filter(Boolean);
  };

  // ========================
  // PAGINATION FUNCTIONS
  // ========================

  /**
   * Calculates total number of pages based on filtered data
   */
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  /**
   * Returns the slice of data for current page
   */
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  /**
   * Generates array of page numbers for pagination UI
   */
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages;
  };

  // ========================
  // RENDER FUNCTIONS
  // ========================

  /**
   * Renders the Approve Modal
   */
  const renderApproveModal = () => {
    if (!showApproveModal || !selectedEmployee) return null;

    return (
      <>
        <div className="dhp-modal-backdrop"></div>
        <div className="dhp-modal-wrapper">
          <div className="dhp-modal-dialog">
            
            {/* Modal Header */}
            <div className="dhp-modal-header dhp-modal-header-success">
              <h5 className="dhp-modal-title">
                <i className="bi bi-check-circle-fill"></i>
                Approve Employee Assessment
              </h5>
              <button
                type="button"
                className="dhp-modal-close-btn"
                onClick={handleModalClose}
                disabled={approvingEmployeeId}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="dhp-modal-body">
              
              {/* Employee Details Box */}
              <div className="dhp-details-box">
                <h6 className="dhp-details-title">
                  <i className="bi bi-person-badge me-2"></i>
                  Employee Information
                </h6>

                <div className="dhp-details-grid">
                  
                  <div className="dhp-detail-row">
                    <div className="dhp-detail-label">Employee Name:</div>
                    <div className="dhp-detail-value">
                      <strong>{selectedEmployee.employeeName}</strong>
                    </div>
                  </div>

                  <div className="dhp-detail-row">
                    <div className="dhp-detail-label">Project:</div>
                    <div className="dhp-detail-value">{selectedEmployee.projectName}</div>
                  </div>

                  <div className="dhp-detail-row">
                    <div className="dhp-detail-label">Avg Employee Rating:</div>
                    <div className="dhp-detail-value">
                      <span className="dhp-rating-badge emp-rating">
                        {getAvgRating(selectedEmployee.competencies, "employeeRating")}
                      </span>
                    </div>
                  </div>

                  <div className="dhp-detail-row">
                    <div className="dhp-detail-label">Avg L1 Rating:</div>
                    <div className="dhp-detail-value">
                      <span className="dhp-rating-badge l1-rating">
                        {getAvgRating(selectedEmployee.competencies, "l1Rating")}
                      </span>
                    </div>
                  </div>

                  <div className="dhp-detail-row">
                    <div className="dhp-detail-label">Avg L2 Rating:</div>
                    <div className="dhp-detail-value">
                      <span className="dhp-rating-badge l2-rating">
                        {getAvgRating(selectedEmployee.competencies, "l2Rating")}
                      </span>
                    </div>
                  </div>

                  <div className="dhp-detail-row">
                    <div className="dhp-detail-label">Goals Assigned:</div>
                    <div className="dhp-detail-value">
                      <span className="dhp-goals-badge">
                        <i className="bi bi-bullseye"></i>
                        {selectedEmployee.goals?.length || 0} Goals
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Alert */}
              <div className="dhp-info-alert">
                <i className="bi bi-info-circle"></i>
                <div>
                  <strong>Note:</strong> Approving this assessment will finalize the performance review process.
                  The employee will be notified via system notification.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="dhp-modal-footer">
              <button
                type="button"
                className="dhp-btn-cancel"
                onClick={handleModalClose}
                disabled={approvingEmployeeId}
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button
                type="button"
                className="dhp-btn-submit dhp-btn-success"
                onClick={handleApproveSubmit}
                disabled={approvingEmployeeId}
              >
                {approvingEmployeeId ? (
                  <>
                    <span className="dhp-spinner"></span>
                    Approving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Approve Assessment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  /**
   * Renders the Details Modal
   */
  const renderDetailsModal = () => {
    if (!showDetailsModal || !selectedEmployee) return null;

    return (
      <>
        <div className="dhp-modal-backdrop"></div>
        <div className="dhp-modal-wrapper dhp-modal-large">
          <div className="dhp-modal-dialog">
            
            {/* Modal Header */}
            <div className="dhp-modal-header dhp-modal-header-primary">
              <h5 className="dhp-modal-title">
                <i className="bi bi-file-text-fill"></i>
                Employee Assessment Details
              </h5>
              <button
                type="button"
                className="dhp-modal-close-btn"
                onClick={handleModalClose}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="dhp-modal-body">
              {renderEmployeeDetails(selectedEmployee)}
            </div>

            {/* Modal Footer */}
            <div className="dhp-modal-footer">
              <button
                type="button"
                className="dhp-btn-cancel"
                onClick={handleModalClose}
              >
                <i className="bi bi-x-circle"></i>
                Close
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  /**
   * Renders detailed employee information (competencies & goals)
   */
  function renderEmployeeDetails(emp) {
    return (
      <>
        {/* Competencies Section */}
        <div className="dhp-detail-section">
          <h4 className="dhp-detail-section-title">
            <i className="bi bi-graph-up"></i>
            Competencies
          </h4>
          <div className="dhp-inner-table-wrapper">
            <table className="dhp-inner-table">
              <thead>
                <tr>
                  <th>Competency</th>
                  <th>Emp Rating</th>
                  <th>Emp Comments</th>
                  <th>L1 Reviewer</th>
                  <th>L1 Rating</th>
                  <th>L1 Comments</th>
                  <th>L2 Reviewer</th>
                  <th>L2 Rating</th>
                  <th>L2 Comments</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {emp.competencies && emp.competencies.length > 0 ? (
                  emp.competencies.map((c, idx) => (
                    <tr key={idx}>
                      <td>{c.competencyName}</td>
                      <td>
                        <strong className="emp-rating">
                          {c.employeeRating || "-"}
                        </strong>
                      </td>
                      <td>{c.employeeComments || "-"}</td>
                      <td>{c.l1ReviewerName || "No L1"}</td>
                      <td>
                        <strong className="l1-rating">
                          {c.l1Rating || "-"}
                        </strong>
                      </td>
                      <td>{c.l1Comments || "-"}</td>
                      <td>{c.l2ReviewerName || "No L2"}</td>
                      <td>
                        <strong className="l2-rating">
                          {c.l2Rating || "-"}
                        </strong>
                      </td>
                      <td>{c.l2Comments || "-"}</td>
                      <td>
                        <span className={`dhp-status-badge status-${c.status?.toLowerCase()}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="dhp-no-data">
                      No competencies found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Goals Section */}
        <div className="dhp-detail-section">
          <h4 className="dhp-detail-section-title">
            <i className="bi bi-bullseye"></i>
            Goals
          </h4>
          {emp.goals && emp.goals.length === 0 ? (
            <p className="dhp-no-data">No goals assigned.</p>
          ) : (
            emp.goals?.map((goal) => {
              const avgProgress = getAvgChecklistProgress(goal.goalChecklists);

              return (
                <div key={goal.goalId} className="dhp-goal-card">
                  <div className="dhp-goal-header">
                    <div>
                      <h5 className="dhp-goal-title">{goal.goalTitle}</h5>
                      <p className="dhp-goal-description">{goal.goalDescription}</p>
                    </div>
                    <span className={`dhp-goal-status-badge status-${goal.goalstatus?.toLowerCase()}`}>
                      {goal.goalstatus}
                    </span>
                  </div>

                  <div className="dhp-progress-container">
                    <div className="dhp-progress-label">
                      <span>Progress</span>
                      <span className="dhp-progress-value">{avgProgress}%</span>
                    </div>
                    <div className="dhp-progress-bar-bg">
                      <div 
                        className="dhp-progress-bar-fill" 
                        style={{ width: `${avgProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </>
    );
  }

  // ========================
  // MAIN RENDER - LOADING STATE
  // ========================

  if (loading) {
    return (
      <div className="dhp-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // ========================
  // MAIN RENDER - PAGE CONTENT
  // ========================

  return (
    <div className="dhp-page">
      
      {/* Breadcrumb Navigation */}
      <nav className="dhp-breadcrumb-nav" aria-label="breadcrumb">
        <ol className="dhp-breadcrumb">
          <li className="dhp-breadcrumb-item">
            <i className="bi bi-house-door"></i>
            <span>Dashboard</span>
          </li>
          <li className="dhp-breadcrumb-item active" aria-current="page">
            Department Head Dashboard
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="dhp-page-header">
        <div className="dhp-header-content">
          <div className="dhp-header-text">
            <h2 className="dhp-page-title">Department Head Dashboard</h2>
            <p className="dhp-page-description">
              Review and approve employee performance assessments and track completed reviews
            </p>
          </div>
        </div>
        <div className="dhp-header-actions">
          {lastUpdated && (
            <span className="dhp-last-updated-text">
              <i className="bi bi-clock-history"></i>
              Last updated: {formatTime(lastUpdated)}
            </span>
          )}
          <button className="dhp-btn-refresh" onClick={() => fetchData()}>
            <i className="bi bi-arrow-clockwise"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs (Pending vs Approved) */}
      <div className="dhp-tabs">
        <button
          className={`dhp-tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <i className="bi bi-hourglass-split me-2"></i>
          Pending Approvals
          {pendingRequests.length > 0 && (
            <span className="badge bg-warning ms-2">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          className={`dhp-tab-btn ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          <i className="bi bi-check-circle me-2"></i>
          Approved Employees
        </button>
      </div>

      {/* Filters Section */}
      <div className="dhp-filters-card">
        <div className="dhp-filters-content">
          <div className="dhp-filters-left">
            
            {/* Search Box */}
            <div className="dhp-search-box">
              <i className="bi bi-search dhp-search-icon"></i>
              <input
                type="text"
                className="dhp-search-input"
                placeholder="Search employee or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Project Filter */}
            <select
              className="dhp-filter-select"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="">All Projects</option>
              {getUniqueProjects().map((project, idx) => (
                <option key={idx} value={project}>{project}</option>
              ))}
            </select>

            {/* Date Filter */}
            <input
              type="date"
              className="dhp-filter-date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="dhp-stats-grid">
        
        {/* Total Pending */}
        <div className="dhp-stat-card">
          <div className="dhp-stat-icon dhp-stat-icon-warning">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="dhp-stat-content">
            <h3 className="dhp-stat-value">{pendingRequests.length}</h3>
            <p className="dhp-stat-label">Pending Approvals</p>
          </div>
        </div>

        {/* Total Approved */}
        <div className="dhp-stat-card">
          <div className="dhp-stat-icon dhp-stat-icon-success">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="dhp-stat-content">
            <h3 className="dhp-stat-value">{approvedRequests.length}</h3>
            <p className="dhp-stat-label">Approved Employees</p>
          </div>
        </div>

        {/* Avg L2 Rating (Pending) */}
        <div className="dhp-stat-card">
          <div className="dhp-stat-icon dhp-stat-icon-primary">
            <i className="bi bi-star-fill"></i>
          </div>
          <div className="dhp-stat-content">
            <h3 className="dhp-stat-value">
              {(() => {
                let total = 0;
                let count = 0;
                pendingRequests.forEach(emp => {
                  const avg = getAvgRating(emp.competencies, "l2Rating");
                  if (avg !== "-") {
                    total += parseFloat(avg);
                    count++;
                  }
                });
                return count > 0 ? (total / count).toFixed(1) : "0";
              })()}
            </h3>
            <p className="dhp-stat-label">Avg L2 Rating</p>
          </div>
        </div>

        {/* Total Goals */}
        <div className="dhp-stat-card">
          <div className="dhp-stat-icon dhp-stat-icon-danger">
            <i className="bi bi-bullseye"></i>
          </div>
          <div className="dhp-stat-content">
            <h3 className="dhp-stat-value">
              {pendingRequests.reduce((sum, emp) => sum + (emp.goals?.length || 0), 0)}
            </h3>
            <p className="dhp-stat-label">Total Goals</p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="dhp-table-card">
        <div className="dhp-table-wrapper">
          <table className="dhp-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Project</th>
                <th>Avg Emp Rating</th>
                <th>Avg L1 Rating</th>
                <th>Avg L2 Rating</th>
                <th>Goals</th>
                {activeTab === "approved" && <th>Approved At</th>}
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedData().length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "approved" ? "8" : "7"} className="dhp-empty-state">
                    <i className="bi bi-inbox"></i>
                    <p>No {activeTab === "pending" ? "pending approvals" : "approved employees"} found</p>
                  </td>
                </tr>
              ) : (
                getPaginatedData().map((emp) => (
                  <React.Fragment key={emp.employeeId || emp.approvalId}>
                    <tr>
                      {/* Employee Info */}
                      <td>
                        <div className="dhp-user-info">
                          <div className="dhp-user-avatar">{getInitials(emp.employeeName)}</div>
                          <div>
                            <span className="dhp-user-name">{emp.employeeName}</span>
                            <small className="dhp-user-id">@{emp.employeeCompanyId}</small>
                          </div>
                        </div>
                      </td>
                      
                      {/* Project */}
                      <td>{emp.projectName}</td>
                      
                      {/* Avg Emp Rating */}
                      <td>
                        <span className="dhp-rating-badge emp-rating">
                          {getAvgRating(emp.competencies, "employeeRating")}
                        </span>
                      </td>
                      
                      {/* Avg L1 Rating */}
                      <td>
                        <span className="dhp-rating-badge l1-rating">
                          {getAvgRating(emp.competencies, "l1Rating")}
                        </span>
                      </td>
                      
                      {/* Avg L2 Rating */}
                      <td>
                        <span className="dhp-rating-badge l2-rating">
                          {getAvgRating(emp.competencies, "l2Rating")}
                        </span>
                      </td>
                      
                      {/* Goals */}
                      <td>
                        <span className="dhp-goals-badge">
                          <i className="bi bi-bullseye"></i>
                          {emp.goals?.length || 0}
                        </span>
                      </td>
                      
                      {/* Approved At (only in approved tab) */}
                      {activeTab === "approved" && (
                        <td className="text-muted">{formatDate(emp.approvedAt)}</td>
                      )}
                      
                      {/* Actions */}
                      <td>
                        <div className="dhp-action-buttons">
                          {activeTab === "pending" ? (
                            <>
                              <button
                                className="dhp-action-btn dhp-action-btn-view"
                                onClick={() => handleViewDetails(emp)}
                                title="View Details"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button
                                className="dhp-action-btn dhp-action-btn-approve"
                                onClick={() => handleApproveClick(emp)}
                                title="Approve"
                              >
                                <i className="bi bi-check-circle"></i>
                              </button>
                            </>
                          ) : (
                            <button
                              className="dhp-action-btn dhp-action-btn-view"
                              onClick={() => handleViewDetails(emp)}
                              title="View Details"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="dhp-pagination-container">
            
            {/* Rows Per Page Selector */}
            <div className="dhp-pagination-info">
              <span className="dhp-pagination-label">Show</span>
              <select
                className="dhp-pagination-select"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span className="dhp-pagination-label">entries</span>
            </div>

            {/* Pagination Status */}
            <div className="dhp-pagination-status">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredData.length)} of{" "}
              {filteredData.length} entries
            </div>

            {/* Pagination Navigation */}
            <nav className="dhp-pagination-nav">
              <ul className="dhp-pagination">
                <li className={`dhp-page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="dhp-page-link"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>

                {getPageNumbers().map((page, index) => (
                  <li
                    key={index}
                    className={`dhp-page-item ${
                      page === currentPage ? "active" : ""
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
                      className="dhp-page-link"
                      onClick={() => typeof page === "number" && setCurrentPage(page)}
                      disabled={typeof page !== "number"}
                    >
                      {page}
                    </button>
                  </li>
                ))}

                <li className={`dhp-page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button
                    className="dhp-page-link"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* Modals */}
      {renderApproveModal()}
      {renderDetailsModal()}
    </div>
  );
}
