import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPendingAcknowledgments,
  acknowledgeRating,
} from "../../../services/performancemanagement/api/rolesapi";
import { Toaster, toast } from "sonner";
import Breadcrumb from "../../../components/common/Breadcrumb";
import "../../../styles/performancemanagement/employee/EmployeeAcknowledge.css";

export default function EmployeeAcknowledgment() {
  const navigate = useNavigate();
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

  return (
    <div className="ea-container">
      <Toaster position="top-right" duration={3000} />

      <Breadcrumb
        items={[{ label: "Employee Acknowledgements", path: null }]}
      />

      {loading && (
        <div className="ea-loading-card">
          <div className="ea-spinner"></div>
          <p>Loading your ratings...</p>
        </div>
      )}

      {error && (
        <div className="ea-error-card">
          <i className="bi bi-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {pendingRatings.length === 0 ? (
            <div className="ea-empty-state">
              <i className="bi bi-inbox"></i>
              <h3 className="ea-empty-text">No Pending Acknowledgments</h3>
              <p className="ea-empty-subtext">
                You have acknowledged all your performance ratings.
              </p>
            </div>
          ) : (
            <div className="ea-ratings-container">
              {pendingRatings.map((rating) => (
                <div key={rating.approvalId} className="ea-rating-card">
                  <div className="ea-card-header">
                    <div className="ea-header-left">
                      <h3 className="ea-project-name">{rating.projectName}</h3>
                      <p className="ea-approved-date">
                        <i className="bi bi-calendar-check"></i>
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
                    <span className="ea-status-badge">
                      <i className="bi bi-clock-history"></i>
                      Pending
                    </span>
                  </div>

                  <div className="ea-summary-section">
                    <div className="ea-summary-item">
                      <div className="ea-summary-icon">
                        <i className="bi bi-person-fill"></i>
                      </div>
                      <div className="ea-summary-content">
                        <span className="ea-summary-label">Your Average</span>
                        <span className="ea-summary-value">
                          {getAvgRating(rating.competencies, "employeeRating")}
                        </span>
                      </div>
                    </div>
                    <div className="ea-summary-item">
                      <div className="ea-summary-icon">
                        <i className="bi bi-1-circle-fill"></i>
                      </div>
                      <div className="ea-summary-content">
                        <span className="ea-summary-label">L1 Average</span>
                        <span className="ea-summary-value">
                          {getAvgRating(rating.competencies, "l1Rating")}
                        </span>
                      </div>
                    </div>
                    <div className="ea-summary-item">
                      <div className="ea-summary-icon">
                        <i className="bi bi-2-circle-fill"></i>
                      </div>
                      <div className="ea-summary-content">
                        <span className="ea-summary-label">L2 Average</span>
                        <span className="ea-summary-value">
                          {getAvgRating(rating.competencies, "l2Rating")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ea-actions-row-top">
                    <button
                      onClick={() => toggleDetails(rating.approvalId)}
                      className="ea-view-details-button"
                    >
                      <i
                        className={`bi bi-chevron-${
                          expandedRatingId === rating.approvalId ? "up" : "down"
                        }`}
                      ></i>
                      {expandedRatingId === rating.approvalId
                        ? "Hide Details"
                        : "View Details"}
                    </button>
                  </div>

                  {expandedRatingId === rating.approvalId && (
                    <div className="ea-details-section">
                      <h4 className="ea-details-title">
                        <i className="bi bi-list-check"></i>
                        Competency Details
                      </h4>
                      <div className="ea-table-wrapper">
                        <table className="ea-table">
                          <thead>
                            <tr>
                              <th>COMPETENCY</th>
                              <th>YOUR RATING</th>
                              <th>YOUR COMMENTS</th>
                              <th>L1 REVIEWER</th>
                              <th>L1 RATING</th>
                              <th>L1 COMMENTS</th>
                              <th>L2 REVIEWER</th>
                              <th>L2 RATING</th>
                              <th>L2 COMMENTS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rating.competencies.map((comp, idx) => (
                              <tr key={idx}>
                                <td>
                                  <strong>{comp.competencyName}</strong>
                                </td>
                                <td>
                                  <span className="ea-rating-badge">
                                    {comp.employeeRating || "-"}
                                  </span>
                                </td>
                                <td>{comp.employeeComments || "-"}</td>
                                <td>{comp.l1ReviewerName || "-"}</td>
                                <td>
                                  <span className="ea-rating-badge">
                                    {comp.l1Rating || "-"}
                                  </span>
                                </td>
                                <td>{comp.l1Comments || "-"}</td>
                                <td>{comp.l2ReviewerName || "-"}</td>
                                <td>
                                  <span className="ea-rating-badge">
                                    {comp.l2Rating || "-"}
                                  </span>
                                </td>
                                <td>{comp.l2Comments || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="ea-acknowledgment-section">
                    <div className="ea-ack-header">
                      <div className="ea-ack-title-wrapper">
                        <i className="bi bi-pencil-square"></i>
                        <div>
                          <h4 className="ea-acknowledgment-title">
                            Acknowledge Rating
                          </h4>
                          <p className="ea-acknowledgment-subtext">
                            Provide your feedback (minimum 10 characters)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="ea-ack-body">
                      <div className="ea-textarea-wrapper">
                        <textarea
                          value={comments[rating.approvalId] || ""}
                          onChange={(e) =>
                            handleCommentChange(
                              rating.approvalId,
                              e.target.value
                            )
                          }
                          placeholder="Enter your acknowledgement comments here..."
                          className="ea-textarea"
                          rows={3}
                          maxLength={2000}
                          disabled={acknowledgingId === rating.approvalId}
                        />
                        <span className="ea-character-count-inline">
                          {(comments[rating.approvalId] || "").length} / 2000
                        </span>
                      </div>
                      <button
                        onClick={() => handleAcknowledge(rating.approvalId)}
                        className="ea-acknowledge-button"
                        disabled={acknowledgingId === rating.approvalId}
                      >
                        {acknowledgingId === rating.approvalId ? (
                          <>
                            <i className="bi bi-hourglass-split ea-spin"></i>
                            Acknowledging...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle"></i>
                            Acknowledge
                          </>
                        )}
                      </button>
                    </div>
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
