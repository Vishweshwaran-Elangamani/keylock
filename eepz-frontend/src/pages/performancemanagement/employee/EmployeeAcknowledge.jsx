import React, { useEffect, useState } from "react";
import { getPendingAcknowledgments, acknowledgeRating } from "../../../services/performancemanagement/hr/api";
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
 
export default function EmployeeAcknowledgment() {
  const [pendingRatings, setPendingRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRatingId, setExpandedRatingId] = useState(null);
  const [acknowledgingId, setAcknowledgingId] = useState(null);
  const [comments, setComments] = useState({});
 
  useEffect(() => {
    fetchPendingAcknowledgments();
  }, []);
 
  const fetchPendingAcknowledgments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPendingAcknowledgments();
      if (res.data.success) {
        setPendingRatings(res.data.data);
      } else {
        setError("Failed to load pending acknowledgments");
      }
    } catch (err) {
      console.error("Error fetching pending acknowledgments:", err);
      setError(err.response?.data?.message || "Error fetching data");
      toast.error("Failed to load pending acknowledgments");
    } finally {
      setLoading(false);
    }
  };
const handleAcknowledge = async (approvalId) => {
  const comment = comments[approvalId];
 
  if (!comment || comment.trim().length < 10) {
    toast.error("Please provide at least 10 characters in your comments");
    return;
  }
 
  setAcknowledgingId(approvalId);
  try {
    const res = await acknowledgeRating({
      ApprovalId: approvalId,   // ✅ FIXED: PascalCase to match DTO
      Comments: comment.trim()  // ✅ FIXED: PascalCase to match DTO
    });
 
    if (res.data.success) {
      toast.success("Rating acknowledged successfully!");
      setPendingRatings(prev => prev.filter(r => r.approvalId !== approvalId));
      setComments(prev => {
        const updated = { ...prev };
        delete updated[approvalId];
        return updated;
      });
    }
  } catch (err) {
    console.error("Error acknowledging rating:", err);
    const errorMsg = err.response?.data?.message || "Failed to acknowledge rating";
    toast.error(errorMsg);
  } finally {
    setAcknowledgingId(null);
  }
};
 
 
  const toggleDetails = (approvalId) => {
    setExpandedRatingId(prev => prev === approvalId ? null : approvalId);
  };
 
  const handleCommentChange = (approvalId, value) => {
    setComments(prev => ({
      ...prev,
      [approvalId]: value
    }));
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
 
  return (
    <div style={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />
 
      <div style={styles.header}>
        <h2 style={styles.title}>Performance Rating Acknowledgment</h2>
        <p style={styles.subtitle}>Review and acknowledge your performance ratings</p>
      </div>
 
      {loading && (
        <div style={styles.loadingCard}>
          <div style={styles.spinner}></div>
          <p>Loading your ratings...</p>
        </div>
      )}
 
      {error && (
        <div style={styles.errorCard}>
          <p>{error}</p>
        </div>
      )}
 
      {!loading && !error && (
        <>
          {pendingRatings.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>✅</div>
              <p style={styles.emptyText}>No pending acknowledgments</p>
              <p style={styles.emptySubtext}>You have acknowledged all your performance ratings</p>
            </div>
          ) : (
            <div style={styles.ratingsContainer}>
              {pendingRatings.map((rating) => (
                <div key={rating.approvalId} style={styles.ratingCard}>
                  {/* Card Header */}
                  <div style={styles.cardHeader}>
                    <div>
                      <h3 style={styles.projectName}>{rating.projectName}</h3>
                      <p style={styles.approvedDate}>
                        Approved on: {new Date(rating.approvedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span style={styles.statusBadge}>Pending Acknowledgment</span>
                  </div>
 
                  {/* Summary Ratings */}
                  <div style={styles.summarySection}>
                    <div style={styles.summaryItem}>
                      <span style={styles.summaryLabel}>Your Average Rating</span>
                      <span style={styles.summaryValue}>
                        {getAvgRating(rating.competencies, "employeeRating")}
                      </span>
                    </div>
                    <div style={styles.summaryItem}>
                      <span style={styles.summaryLabel}>L1 Average Rating</span>
                      <span style={styles.summaryValue}>
                        {getAvgRating(rating.competencies, "l1Rating")}
                      </span>
                    </div>
                    <div style={styles.summaryItem}>
                      <span style={styles.summaryLabel}>L2 Average Rating</span>
                      <span style={styles.summaryValue}>
                        {getAvgRating(rating.competencies, "l2Rating")}
                      </span>
                    </div>
                  </div>
 
                  {/* View Details Button */}
                  <button
                    onClick={() => toggleDetails(rating.approvalId)}
                    style={styles.viewDetailsButton}
                  >
                    {expandedRatingId === rating.approvalId ? "Hide Details" : "View Details"}
                  </button>
 
                  {/* Expanded Details */}
                  {expandedRatingId === rating.approvalId && (
                    <div style={styles.detailsSection}>
                      <h4 style={styles.detailsTitle}>📊 Competency Details</h4>
                      <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Competency</th>
                              <th style={styles.th}>Your Rating</th>
                              <th style={styles.th}>Your Comments</th>
                              <th style={styles.th}>L1 Reviewer</th>
                              <th style={styles.th}>L1 Rating</th>
                              <th style={styles.th}>L1 Comments</th>
                              <th style={styles.th}>L2 Reviewer</th>
                              <th style={styles.th}>L2 Rating</th>
                              <th style={styles.th}>L2 Comments</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rating.competencies.map((comp, idx) => (
                              <tr key={idx} style={styles.tr}>
                                <td style={styles.td}>{comp.competencyName}</td>
                                <td style={styles.td}>
                                  <strong style={{ color: THEME.secondary }}>
                                    {comp.employeeRating || "-"}
                                  </strong>
                                </td>
                                <td style={styles.td}>{comp.employeeComments || "-"}</td>
                                <td style={styles.td}>{comp.l1ReviewerName}</td>
                                <td style={styles.td}>
                                  <strong style={{ color: THEME.accent }}>
                                    {comp.l1Rating || "-"}
                                  </strong>
                                </td>
                                <td style={styles.td}>{comp.l1Comments || "-"}</td>
                                <td style={styles.td}>{comp.l2ReviewerName}</td>
                                <td style={styles.td}>
                                  <strong style={{ color: THEME.accent }}>
                                    {comp.l2Rating || "-"}
                                  </strong>
                                </td>
                                <td style={styles.td}>{comp.l2Comments || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
 
                  {/* Acknowledgment Section */}
                  <div style={styles.acknowledgmentSection}>
                    <h4 style={styles.acknowledgmentTitle}>✍️ Your Acknowledgment</h4>
                    <p style={styles.acknowledgmentSubtext}>
                      Please provide your comments or justification (minimum 10 characters):
                    </p>
                    <textarea
                      value={comments[rating.approvalId] || ""}
                      onChange={(e) => handleCommentChange(rating.approvalId, e.target.value)}
                      placeholder="Enter your comments here... (e.g., I agree with the ratings, or provide your justification)"
                      style={styles.textarea}
                      rows={4}
                      disabled={acknowledgingId === rating.approvalId}
                    />
                    <div style={styles.characterCount}>
                      {(comments[rating.approvalId] || "").length} / 2000 characters
                    </div>
                    <button
                      onClick={() => handleAcknowledge(rating.approvalId)}
                      style={{
                        ...styles.acknowledgeButton,
                        opacity: acknowledgingId === rating.approvalId ? 0.6 : 1,
                        cursor: acknowledgingId === rating.approvalId ? "not-allowed" : "pointer"
                      }}
                      disabled={acknowledgingId === rating.approvalId}
                    >
                      {acknowledgingId === rating.approvalId ? "Acknowledging..." : "✓ Acknowledge Rating"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
 
const styles = {
  container: {
    padding: "32px",
    maxWidth: "1400px",
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
  // spinner: {
  //   width: "40px",
  //   height: "40px",
  //   border: `4px solid ${THEME.border}`,
  //   borderTop: `4px solid ${THEME.primary}`,
  //   borderRadius: "50%",
  //   animation: "spin 1s linear infinite",
  //   margin: "0 auto 16px"
  // },
  errorCard: {
    backgroundColor: "#FEE2E2",
    color: THEME.danger,
    padding: "20px",
    borderRadius: "12px",
    border: `2px solid ${THEME.danger}`
  },
  emptyState: {
    backgroundColor: THEME.card,
    padding: "60px 20px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
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
  ratingsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  ratingCard: {
    backgroundColor: THEME.card,
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    padding: "24px",
    border: `2px solid ${THEME.border}`
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    paddingBottom: "20px",
    borderBottom: `2px solid ${THEME.border}`
  },
  projectName: {
    fontSize: "24px",
    fontWeight: "700",
    color: THEME.primary,
    margin: 0
  },
  approvedDate: {
    fontSize: "14px",
    color: THEME.textLight,
    marginTop: "8px"
  },
  statusBadge: {
    padding: "8px 16px",
    backgroundColor: `${THEME.warning}20`,
    color: THEME.warning,
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700"
  },
  summarySection: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginBottom: "24px"
  },
  summaryItem: {
    backgroundColor: THEME.background,
    padding: "16px",
    borderRadius: "8px",
    textAlign: "center"
  },
  summaryLabel: {
    display: "block",
    fontSize: "13px",
    color: THEME.textLight,
    marginBottom: "8px",
    fontWeight: "600"
  },
  summaryValue: {
    display: "block",
    fontSize: "24px",
    fontWeight: "700",
    color: THEME.secondary
  },
  viewDetailsButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: THEME.primary,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "20px",
    transition: "all 0.2s"
  },
  detailsSection: {
    marginBottom: "24px"
  },
  detailsTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: THEME.primary,
    marginBottom: "16px"
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "8px",
    border: `1px solid ${THEME.border}`
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1200px"
  },
  th: {
    padding: "12px",
    textAlign: "left",
    backgroundColor: `${THEME.primary}10`,
    fontWeight: "600",
    fontSize: "13px",
    color: THEME.text,
    borderBottom: `2px solid ${THEME.border}`
  },
  tr: {
    borderBottom: `1px solid ${THEME.border}`
  },
  td: {
    padding: "12px",
    fontSize: "13px",
    color: THEME.text
  },
  acknowledgmentSection: {
    backgroundColor: THEME.background,
    padding: "24px",
    borderRadius: "8px",
    border: `2px solid ${THEME.success}`
  },
  acknowledgmentTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: THEME.success,
    marginBottom: "8px"
  },
  acknowledgmentSubtext: {
    fontSize: "14px",
    color: THEME.textLight,
    marginBottom: "16px"
  },
  textarea: {
    width: "100%",
    padding: "12px",
    border: `2px solid ${THEME.border}`,
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    marginBottom: "8px",
    outline: "none",
    transition: "border 0.2s"
  },
  characterCount: {
    fontSize: "12px",
    color: THEME.textLight,
    textAlign: "right",
    marginBottom: "16px"
  },
  acknowledgeButton: {
    width: "100%",
    padding: "14px",
    backgroundColor: THEME.success,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s"
  }
};
 
 