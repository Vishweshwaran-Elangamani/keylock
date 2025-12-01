import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
        ApprovalId: approvalId,
        Comments: comment.trim()
      });

      if (res.data.success) {
        toast.success("Rating acknowledged successfully!");
        setPendingRatings(prev => prev.filter(r => r.approvalId !== approvalId));
        setComments(prev => {
          const updated = { ...prev };
          delete updated[approvalId];
          return updated;
        });
      } else {
        toast.error(res.data?.message || "Acknowledgment failed");
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

  const Breadcrumbs = () => (
    <div style={breadcrumbStyles.wrapper}>
      <div style={breadcrumbStyles.inner}>
        <Link to="/employee/dashboard" style={breadcrumbStyles.link}>
          <li
            className="cg-breadcrumb-item"
            onClick={() => navigate("/hr/dashboard")}
            style={{ cursor: "pointer" }}>
            <i className="bi bi-house-door" style={{ fontSize: "12px" }}></i>
          </li>
        </Link>

        <span style={breadcrumbStyles.sep}>›</span>

        <span style={{ ...breadcrumbStyles.current, fontSize: "11px", fontStyle: "bold", color: "purple" }}>Performance Rating Acknowledgment</span>
      </div>
    </div>
  );

  return (
    <div style={{ ...styles.container, ...styles.pageWrapper }}>
      <ToastContainer position="top-right" autoClose={3000} />

      <div style={styles.breadcrumbWrapper}>
        <Breadcrumbs />
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
              <div style={styles.emptyIcon}></div>
              <p style={styles.emptyText}>No pending acknowledgments</p>
              <p style={styles.emptySubtext}>You have acknowledged all your performance ratings</p>
            </div>
          ) : (
            <div style={styles.ratingsContainer}>
              {pendingRatings.map((rating) => (
                <div key={rating.approvalId} style={{ ...styles.ratingCard, ...styles.compactCard }}>
                  <div style={styles.cardHeader}>
                    <div>
                      <h3
                        style={{
                          ...styles.projectName,
                          textAlign: "left",
                          marginBottom: "8px"
                        }}
                      >
                        {rating.projectName}
                      </h3>
                      <p
                        style={{
                          ...styles.approvedDate,
                          textAlign: "left",
                          marginTop: 0
                        }}
                      >
                        Approved on:{" "}
                        {new Date(rating.approvedAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <span style={styles.statusBadge}>Pending Acknowledgment</span>
                  </div>

                  <div style={styles.summarySection}>
                    <div
                      style={{
                        ...styles.summaryItem,
                        border: "1px solid black",
                        borderRadius: "8px",
                        padding: "12px",
                        margin: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}
                    >
                      <span style={styles.summaryLabel}>Your Average Rating</span>
                      <span style={styles.summaryValue}>
                        {getAvgRating(rating.competencies, "employeeRating")}
                      </span>
                    </div>

                    <div
                      style={{
                        ...styles.summaryItem,
                        border: "1px solid black",
                        borderRadius: "8px",
                        padding: "12px",
                        margin: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}
                    >
                      <span style={styles.summaryLabel}>L1 Average Rating</span>
                      <span style={styles.summaryValue}>
                        {getAvgRating(rating.competencies, "l1Rating")}
                      </span>
                    </div>

                    <div
                      style={{
                        ...styles.summaryItem,
                        border: "1px solid black",
                        borderRadius: "8px",
                        padding: "12px",
                        margin: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}
                    >
                      <span style={styles.summaryLabel}>L2 Average Rating</span>
                      <span style={styles.summaryValue}>
                        {getAvgRating(rating.competencies, "l2Rating")}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleDetails(rating.approvalId)}
                    style={styles.viewDetailsButton}
                  >
                    {expandedRatingId === rating.approvalId ? "Hide Details" : "View Details"}
                  </button>

                  {expandedRatingId === rating.approvalId && (
                    <div style={styles.detailsSection}>
                      <h4 style={styles.detailsTitle}>Competency Details</h4>
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
                                <td style={styles.td}>{comp.l1ReviewerName || "-"}</td>
                                <td style={styles.td}>
                                  <strong style={{ color: THEME.accent }}>
                                    {comp.l1Rating || "-"}
                                  </strong>
                                </td>
                                <td style={styles.td}>{comp.l1Comments || "-"}</td>
                                <td style={styles.td}>{comp.l2ReviewerName || "-"}</td>
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

                  <div style={styles.acknowledgmentSection}>
                    <h4 style={{ ...styles.acknowledgmentTitle, color: "rgb(39, 35, 92)" }}>
                      Your Acknowledgment
                    </h4>
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
                      {acknowledgingId === rating.approvalId ? "Acknowledging..." : "Acknowledge Rating"}
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

const breadcrumbStyles = {
  wrapper: {
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start"
  },
  inner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "transparent",
    padding: "4px 0"
  },
  link: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    color: THEME.primary,
    fontWeight: 300,
    marginRight: "6px"
  },
  sep: {
    color: THEME.primary,
    fontWeight: 700
  },
  current: {
    fontSize: 16,
    color: THEME.primary,
    fontWeight: 700
  }
};

const styles = {
  container: {
    padding: "0px 32px",
    maxWidth: "1400px",
    margin: "0 auto",
    backgroundColor: THEME.background,
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },

  pageWrapper: {
    paddingTop: "8px",
    marginTop: "0px"
  },


  breadcrumbWrapper: {
    marginTop: "0px",
    paddingTop: "0px",
    marginBottom: "12px"
  },

  compactCard: {
    paddingTop: "12px",
    paddingBottom: "12px",
    marginTop: "0px"
  },

  loadingCard: {
    backgroundColor: THEME.card,
    padding: "48px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
  },
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
    gap: "18px"
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
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: `2px solid ${THEME.border}`
  },
  projectName: {
    fontSize: "22px",
    fontWeight: "700",
    color: THEME.primary,
    margin: 0
  },
  approvedDate: {
    fontSize: "13px",
    color: THEME.textLight,
    marginTop: "6px"
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
    gap: "16px",
    marginBottom: "18px"
  },
  summaryItem: {
    backgroundColor: THEME.background,
    padding: "12px",
    borderRadius: "8px",
    textAlign: "center"
  },
  summaryLabel: {
    display: "block",
    fontSize: "13px",
    color: THEME.textLight,
    marginBottom: "6px",
    fontWeight: "600"
  },
  summaryValue: {
    display: "block",
    fontSize: "20px",
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
    marginBottom: "14px",
    transition: "all 0.2s"
  },
  detailsSection: {
    marginBottom: "16px"
  },
  detailsTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: THEME.primary,
    marginBottom: "12px"
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "8px",
    border: `1px solid ${THEME.border}`
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1100px"
  },
  th: {
    padding: "10px",
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
    padding: "10px",
    fontSize: "13px",
    color: THEME.text
  },
  acknowledgmentSection: {
    backgroundColor: THEME.background,
    padding: "20px",
    borderRadius: "8px",
    border: `2px solid ${THEME.success}`
  },
  acknowledgmentTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: THEME.success,
    marginBottom: "8px"
  },
  acknowledgmentSubtext: {
    fontSize: "14px",
    color: THEME.textLight,
    marginBottom: "12px"
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
    marginBottom: "12px"
  },
  acknowledgeButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: THEME.success,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s"
  }
};
