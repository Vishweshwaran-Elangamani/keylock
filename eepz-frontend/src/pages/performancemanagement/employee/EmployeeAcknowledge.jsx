import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPendingAcknowledgments,
  acknowledgeRating,
} from "../../../services/performancemanagement/hr/api";
import { Toaster, toast } from "sonner";
 
const THEME = {
  primary: "#27235C",
  secondary: "#AC5098",
  accent: "#3B4B8C",
  background: "#F3F4F6",
  card: "#FFFFFF",
  text: "#111827",
  textLight: "#6B7280",
  border: "#E5E7EB",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
};
 
export default function EmployeeAcknowledgment() {
  const [pendingRatings, setPendingRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRatingId, setExpandedRatingId] = useState(null);
  const [acknowledgingId, setAcknowledgingId] = useState(null);
  const [comments, setComments] = useState({});
 
  // for hover effects (futuristic)
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [hoveredViewBtnId, setHoveredViewBtnId] = useState(null);
  const [hoveredAckBtnId, setHoveredAckBtnId] = useState(null);
 
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
        Comments: comment.trim(),
      });
 
      if (res.data.success) {
        toast.success("Rating acknowledged successfully!");
        setPendingRatings((prev) =>
          prev.filter((r) => r.approvalId !== approvalId)
        );
        setComments((prev) => {
          const updated = { ...prev };
          delete updated[approvalId];
          return updated;
        });
      } else {
        toast.error(res.data?.message || "Acknowledgment failed");
      }
    } catch (err) {
      console.error("Error acknowledging rating:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to acknowledge rating";
      toast.error(errorMsg);
    } finally {
      setAcknowledgingId(null);
    }
  };
 
  const toggleDetails = (approvalId) => {
    setExpandedRatingId((prev) => (prev === approvalId ? null : approvalId));
  };
 
  const handleCommentChange = (approvalId, value) => {
    setComments((prev) => ({
      ...prev,
      [approvalId]: value,
    }));
  };
 
  const getAvgRating = (competencies, key) => {
    if (!competencies || competencies.length === 0) return "-";
    const vals = competencies
      .filter((c) => c[key] != null && c[key] !== -1)
      .map((c) => c[key]);
    if (vals.length === 0) return "-";
    const total = vals.reduce((a, b) => a + b, 0);
    return (total / vals.length).toFixed(2);
  };
 
  const Breadcrumbs = () => (
    <nav style={breadcrumbStyles.wrapper} aria-label="breadcrumb">
      <div style={breadcrumbStyles.inner}>
        <Link to="/employee/dashboard" style={breadcrumbStyles.link}>
          <i className="bi bi-house-door" style={{ fontSize: 12 }}></i>
        </Link>
        <span style={breadcrumbStyles.sep}>›</span>
        <span
          style={{
            ...breadcrumbStyles.current,
            fontSize: 12,
            fontWeight: 600,
            color: "#7C3AED",
          }}
        >
          Performance Rating Acknowledgment
        </span>
      </div>
    </nav>
  );
 
  return (
    <div style={{ ...styles.container, ...styles.pageWrapper }}>
      <Toaster position="top-right" duration={3000} />
 
      <div style={styles.breadcrumbWrapper}>
        <Breadcrumbs />
      </div>
 
      {loading && (
        <div style={styles.loadingCard}>
          <p style={{ margin: 0, color: THEME.textLight }}>
            Loading your ratings...
          </p>
        </div>
      )}
 
      {error && (
        <div style={styles.errorCard}>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}
 
      {!loading && !error && (
        <>
          {pendingRatings.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No pending acknowledgments</p>
              <p style={styles.emptySubtext}>
                You have acknowledged all your performance ratings.
              </p>
            </div>
          ) : (
            <div style={styles.ratingsContainer}>
              {pendingRatings.map((rating) => {
                const isCardHovered = hoveredCardId === rating.approvalId;
                const isViewHovered = hoveredViewBtnId === rating.approvalId;
                const isAckHovered = hoveredAckBtnId === rating.approvalId;
 
                return (
                  <div
                    key={rating.approvalId}
                    style={{
                      ...styles.ratingCard,
                      ...styles.compactCard,
                      ...(isCardHovered ? styles.ratingCardHover : {}),
                    }}
                    onMouseEnter={() => setHoveredCardId(rating.approvalId)}
                    onMouseLeave={() => setHoveredCardId(null)}
                  >
                    {/* Accent bar */}
                    <div style={styles.cardAccentBar} />
 
                    {/* Header */}
                    <div style={styles.cardHeader}>
                      <div>
                        <h3 style={styles.projectName}>
                          {rating.projectName}
                        </h3>
                        <p style={styles.approvedDate}>
                          Approved on{" "}
                          {new Date(rating.approvedAt).toLocaleString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
 
                      <span style={styles.statusBadge}>Pending</span>
                    </div>
 
                    {/* Summary chips */}
                    <div style={styles.summarySection}>
                      <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>Your Avg</span>
                        <span style={styles.summaryValue}>
                          {getAvgRating(
                            rating.competencies,
                            "employeeRating"
                          )}
                        </span>
                      </div>
                      <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>L1 Avg</span>
                        <span style={styles.summaryValue}>
                          {getAvgRating(rating.competencies, "l1Rating")}
                        </span>
                      </div>
                      <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>L2 Avg</span>
                        <span style={styles.summaryValue}>
                          {getAvgRating(rating.competencies, "l2Rating")}
                        </span>
                      </div>
                    </div>
 
                    {/* View details button (right aligned) */}
                    <div style={styles.actionsRowTop}>
                      <button
                        onClick={() => toggleDetails(rating.approvalId)}
                        style={{
                          ...styles.viewDetailsButton,
                          ...(isViewHovered ? styles.viewDetailsButtonHover : {}),
                        }}
                        onMouseEnter={() =>
                          setHoveredViewBtnId(rating.approvalId)
                        }
                        onMouseLeave={() => setHoveredViewBtnId(null)}
                      >
                        {expandedRatingId === rating.approvalId
                          ? "Hide Details"
                          : "View Details"}
                      </button>
                    </div>
 
                    {/* Details table */}
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
                                  <td style={styles.td}>
                                    {comp.competencyName}
                                  </td>
                                  <td style={styles.td}>
                                    <strong
                                      style={{ color: THEME.secondary }}
                                    >
                                      {comp.employeeRating || "-"}
                                    </strong>
                                  </td>
                                  <td style={styles.td}>
                                    {comp.employeeComments || "-"}
                                  </td>
                                  <td style={styles.td}>
                                    {comp.l1ReviewerName || "-"}
                                  </td>
                                  <td style={styles.td}>
                                    <strong style={{ color: THEME.accent }}>
                                      {comp.l1Rating || "-"}
                                    </strong>
                                  </td>
                                  <td style={styles.td}>
                                    {comp.l1Comments || "-"}
                                  </td>
                                  <td style={styles.td}>
                                    {comp.l2ReviewerName || "-"}
                                  </td>
                                  <td style={styles.td}>
                                    <strong style={{ color: THEME.accent }}>
                                      {comp.l2Rating || "-"}
                                    </strong>
                                  </td>
                                  <td style={styles.td}>
                                    {comp.l2Comments || "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
 
                    {/* Acknowledgment section */}
                    <div style={styles.acknowledgmentSection}>
                      <div style={styles.ackHeaderRow}>
                        <div>
                          <h4 style={styles.acknowledgmentTitle}>
                            Your Acknowledgment
                          </h4>
                          <p style={styles.acknowledgmentSubtext}>
                            Share your feedback or confirmation on the provided
                            ratings (minimum 10 characters).
                          </p>
                        </div>
                      </div>
 
                      <textarea
                        value={comments[rating.approvalId] || ""}
                        onChange={(e) =>
                          handleCommentChange(
                            rating.approvalId,
                            e.target.value
                          )
                        }
                        placeholder="Enter your comments here..."
                        style={styles.textarea}
                        rows={4}
                        maxLength={2000}
                        disabled={acknowledgingId === rating.approvalId}
                      />
                      <div style={styles.characterRow}>
                        <span style={styles.characterCount}>
                          {(comments[rating.approvalId] || "").length} / 2000
                        </span>
                      </div>
 
                      <div style={styles.actionsRowBottom}>
                        <button
                          onClick={() => handleAcknowledge(rating.approvalId)}
                          style={{
                            ...styles.acknowledgeButton,
                            ...(isAckHovered ? styles.acknowledgeButtonHover : {}),
                            opacity:
                              acknowledgingId === rating.approvalId ? 0.7 : 1,
                            cursor:
                              acknowledgingId === rating.approvalId
                                ? "not-allowed"
                                : "pointer",
                          }}
                          onMouseEnter={() =>
                            setHoveredAckBtnId(rating.approvalId)
                          }
                          onMouseLeave={() => setHoveredAckBtnId(null)}
                          disabled={acknowledgingId === rating.approvalId}
                        >
                          {acknowledgingId === rating.approvalId
                            ? "Acknowledging..."
                            : "Acknowledge"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
 
const breadcrumbStyles = {
  wrapper: {
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  inner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "transparent",
    padding: "4px 0",
  },
  link: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    color: THEME.primary,
    fontWeight: 400,
  },
  sep: {
    color: THEME.primary,
    fontWeight: 600,
  },
  current: {
    fontSize: 14,
    color: THEME.primary,
    fontWeight: 600,
  },
};
 
const styles = {
  container: {
    padding: "12px 32px 32px",
    maxWidth: "1400px",
    margin: "0 auto",
    backgroundColor: THEME.background,
    minHeight: "100vh",
    fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont",
  },
  pageWrapper: {
    paddingTop: 4,
  },
  breadcrumbWrapper: {
    marginBottom: 16,
  },
 
  loadingCard: {
    backgroundColor: THEME.card,
    padding: 40,
    borderRadius: 16,
    textAlign: "center",
    // boxShadow: "0 18px 45px rgba(15,23,42,0.12)",
  },
  errorCard: {
    backgroundColor: "#FEE2E2",
    color: THEME.danger,
    padding: 20,
    borderRadius: 12,
    border: `1px solid ${THEME.danger}`,
  },
  emptyState: {
    backgroundColor: THEME.card,
    padding: "40px 24px",
    borderRadius: 16,
    textAlign: "center",
    // boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 600,
    color: THEME.text,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: THEME.textLight,
  },
 
  ratingsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
 
  ratingCard: {
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 18,
    // boxShadow: "0 18px 40px rgba(15,23,42,0.18)",
    padding: 22,
    border: "1px solid rgba(148,163,184,0.3)",
    backdropFilter: "blur(6px)",
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
    overflow: "hidden",
  },
  ratingCardHover: {
    transform: "translateY(-4px)",
    // boxShadow: "0 26px 70px rgba(15,23,42,0.32)",
    border: "1px solid rgba(129,140,248,0.8)",
  },
  compactCard: {
    paddingTop: 20,
    paddingBottom: 22,
  },
  cardAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 4,
    width: "100%",
    borderRadius: "18px 18px 0 0",
    backgroundImage:
      "linear-gradient(90deg, #27235C 0%, #3B4B8C 40%, #AC5098 100%)",
  },
 
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    paddingTop: 4,
  },
  projectName: {
    fontSize: 22,
    fontWeight: 700,
    color: THEME.primary,
    margin: 0,
    letterSpacing: "0.03em",
  },
  approvedDate: {
    fontSize: 13,
    color: THEME.textLight,
    marginTop: 6,
  },
  statusBadge: {
    padding: "10px 18px",
    borderRadius: 22,
    backgroundImage:
      "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(250,204,21,0.7))",
    color: "#92400E",
    fontSize: 13,
    fontWeight: 600,
    // boxShadow: "0 8px 18px rgba(250,204,21,0.45)",
  },
 
  summarySection: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
    marginBottom: 18,
  },
  summaryItem: {
    backgroundColor: "#F9FAFB",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid rgba(209,213,219,0.9)",
    textAlign: "center",
  },
  summaryLabel: {
    display: "block",
    fontSize: 12,
    color: THEME.textLight,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  summaryValue: {
    display: "block",
    fontSize: 18,
    fontWeight: 700,
    color: THEME.accent,
  },
 
  actionsRowTop: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 4,
    marginBottom: 10,
  },
 
  viewDetailsButton: {
    padding: "8px 20px",
    borderRadius: 999,
    border: "none",
    backgroundImage:
      "linear-gradient(135deg, #27235C 0%, #3B4B8C 40%, #111827 100%)",
    color: "#F9FAFB",
    fontSize: 13,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    // boxShadow: "0 10px 24px rgba(15,23,42,0.45)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  viewDetailsButtonHover: {
    transform: "translateY(-1px) scale(1.03)",
    // boxShadow: "0 16px 38px rgba(15,23,42,0.7)",
  },
 
  detailsSection: {
    marginTop: 10,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: THEME.text,
    marginBottom: 10,
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: 12,
    border: `1px solid ${THEME.border}`,
    backgroundColor: "#F9FAFB",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 1000,
  },
  th: {
    padding: "10px 12px",
    textAlign: "left",
    backgroundColor: "#EEF2FF",
    fontWeight: 600,
    fontSize: 12,
    color: THEME.text,
    borderBottom: `1px solid ${THEME.border}`,
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: `1px solid ${THEME.border}`,
  },
  td: {
    padding: "9px 12px",
    fontSize: 13,
    color: THEME.text,
    verticalAlign: "top",
  },
 
  acknowledgmentSection: {
    marginTop: 4,
    backgroundColor: "#F9FAFB",
    padding: 18,
    borderRadius: 14,
    border: "1px solid rgba(209,213,219,0.9)",
  },
  ackHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  acknowledgmentTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: THEME.primary,
    margin: 0,
  },
  acknowledgmentSubtext: {
    fontSize: 13,
    color: THEME.textLight,
    marginTop: 4,
    marginBottom: 0,
  },
  textarea: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid rgba(209,213,219,0.9)",
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical",
    outline: "none",
    backgroundColor: "#FFFFFF",
  },
  characterRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  characterCount: {
    fontSize: 11,
    color: THEME.textLight,
  },
 
  actionsRowBottom: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  acknowledgeButton: {
    padding: "9px 24px",
    borderRadius: 999,
    border: "none",
    backgroundImage:
      "linear-gradient(135deg, #059669 0%, #10B981 40%, #22C55E 100%)",
    color: "#ECFEFF",
    fontSize: 14,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    // boxShadow: "0 14px 30px rgba(16,185,129,0.5)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  acknowledgeButtonHover: {
    transform: "translateY(-1px) scale(1.04)",
    // boxShadow: "0 20px 44px rgba(16,185,129,0.75)",
  },
};
 
 