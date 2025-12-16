import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getPendingAcknowledgments,
  acknowledgeRating,
} from "../../../services/performancemanagement/hr/api";
import { Toaster, toast } from "sonner";

const THEME = {
  primary: "#27235C",
  secondary: "#AC5098",
  accent: "#27235C",
  background: "#F8F9FA",
  card: "#FFFFFF",
  text: "#111827",
  textLight: "#6B7280",
  border: "#27235C",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
};

export default function EmployeeAcknowledgment() {
  const navigate = useNavigate();
  const [pendingRatings, setPendingRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRatingId, setExpandedRatingId] = useState(null);
  const [acknowledgingId, setAcknowledgingId] = useState(null);
  const [comments, setComments] = useState({});

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

  const breadcrumbItems = [
    { label: "Performance Rating Acknowledgment", path: null }
  ];

  return (
    <div style={styles.container}>
      <Toaster position="top-right" duration={3000} />

      {/* Breadcrumb Navigation */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: '#6c757d',
          flexWrap: 'wrap'
        }}
      >
        <i 
          className="bi bi-house-door"
          style={{ 
            cursor: 'pointer', 
            color: '#97247E', 
            fontSize: '1rem',
            flexShrink: 0 
          }}
          onClick={() => navigate("/employee/dashboard")}
          title="Go Back"
        />
        
        {breadcrumbItems.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>/</span>
            {item.path ? (
              <span
                onClick={() => navigate(item.path)}
                style={{
                  cursor: 'pointer',
                  color: '#97247E',
                  fontWeight: index === breadcrumbItems.length - 1 ? '600' : '400',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
              >
                {item.label}
              </span>
            ) : (
              <span
                style={{
                  fontWeight: '600',
                  color: '#212529'
                }}
              >
                {item.label}
              </span>
            )}
          </div>
        ))}
      </nav>

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

                    {/* View details button */}
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
                              <tr style={{ backgroundColor: THEME.primary }}>
                                <th style={styles.th}>COMPETENCY</th>
                                <th style={styles.th}>YOUR RATING</th>
                                <th style={styles.th}>YOUR COMMENTS</th>
                                <th style={styles.th}>L1 REVIEWER</th>
                                <th style={styles.th}>L1 RATING</th>
                                <th style={styles.th}>L1 COMMENTS</th>
                                <th style={styles.th}>L2 REVIEWER</th>
                                <th style={styles.th}>L2 RATING</th>
                                <th style={styles.th}>L2 COMMENTS</th>
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
                                      style={{ color: THEME.primary }}
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
                                    <strong style={{ color: THEME.primary }}>
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
                                    <strong style={{ color: THEME.primary }}>
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

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "1400px",
    margin: "0 auto",
    backgroundColor: THEME.background,
    minHeight: "100vh",
    fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont",
  },

  loadingCard: {
    backgroundColor: THEME.card,
    padding: 40,
    borderRadius: 12,
    textAlign: "center",
    border: `1px solid ${THEME.border}`,
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
    borderRadius: 12,
    textAlign: "center",
    border: `1px solid ${THEME.border}`,
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
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 20,
    border: `1px solid ${THEME.border}`,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    overflow: "hidden",
  },
  ratingCardHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(39, 35, 92, 0.15)",
  },
  cardAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 4,
    width: "100%",
    backgroundColor: THEME.primary,
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingTop: 4,
  },
  projectName: {
    fontSize: 20,
    fontWeight: 700,
    color: THEME.primary,
    margin: 0,
  },
  approvedDate: {
    fontSize: 13,
    color: THEME.textLight,
    marginTop: 6,
    margin: 0,
  },
  statusBadge: {
    padding: "8px 16px",
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    fontSize: 13,
    fontWeight: 600,
  },

  summarySection: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
    marginBottom: 16,
  },
  summaryItem: {
    backgroundColor: "#F9FAFB",
    padding: "12px 14px",
    borderRadius: 10,
    border: `1px solid ${THEME.border}`,
    textAlign: "center",
  },
  summaryLabel: {
    display: "block",
    fontSize: 12,
    color: THEME.textLight,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  summaryValue: {
    display: "block",
    fontSize: 18,
    fontWeight: 700,
    color: THEME.primary,
  },

  actionsRowTop: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 12,
  },

  viewDetailsButton: {
    padding: "8px 20px",
    borderRadius: 6,
    border: "none",
    backgroundColor: THEME.primary,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.15s ease, opacity 0.15s ease",
  },
  viewDetailsButtonHover: {
    transform: "translateY(-1px)",
    opacity: 0.9,
  },

  detailsSection: {
    marginTop: 12,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: THEME.text,
    marginBottom: 12,
    margin: 0,
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: 8,
    border: `1px solid ${THEME.border}`,
    marginTop: 12,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 1000,
    fontSize: "1rem",
  },
  th: {
    padding: "1rem",
    textAlign: "left",
    color: "#FFFFFF",
    fontWeight: 600,
    fontSize: "0.95rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: `2px solid ${THEME.border}`,
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: `1px solid #E5E7EB`,
    backgroundColor: "#FFFFFF",
  },
  td: {
    padding: "1rem",
    fontSize: "1rem",
    color: THEME.text,
    verticalAlign: "top",
    textAlign: "left",
    borderBottom: "1px solid #E5E7EB",
  },

  acknowledgmentSection: {
    marginTop: 16,
    backgroundColor: "#F9FAFB",
    padding: 18,
    borderRadius: 10,
    border: `1px solid ${THEME.border}`,
  },
  ackHeaderRow: {
    marginBottom: 12,
  },
  acknowledgmentTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: THEME.primary,
    margin: 0,
    marginBottom: 6,
    textAlign: "left",
  },
  acknowledgmentSubtext: {
    fontSize: 13,
    color: THEME.textLight,
    margin: 0,
    textAlign: "left",
  },
  textarea: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: `1px solid ${THEME.border}`,
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical",
    outline: "none",
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    boxSizing: "border-box",
  },
  characterRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 6,
  },
  characterCount: {
    fontSize: 12,
    color: THEME.textLight,
  },

  actionsRowBottom: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  acknowledgeButton: {
    padding: "10px 24px",
    borderRadius: 6,
    border: "none",
    backgroundColor: THEME.primary,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform 0.15s ease, opacity 0.15s ease",
  },
  acknowledgeButtonHover: {
    transform: "translateY(-1px)",
    opacity: 0.9,
  },
};
