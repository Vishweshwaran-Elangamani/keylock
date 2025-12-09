import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Star,
  User,
  MessageSquare,
  Calendar,
  Filter,
  Eye,
  ThumbsUp,
  Clock,
  CheckCircle,
  Award,
  RefreshCw,
  Home,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { employeeApi, mentorFeedbackApi } from "../../../services/feedbackmanagement/feedbackApi";
import axios from "axios";

import "../../../styles/feedback/SMEDashboard.css";

const formatDate = (dateInput) => {
  if (!dateInput) return "—";
  try {
    const dateObj = new Date(dateInput);
    if (isNaN(dateObj.getTime())) return "—";
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

const getRatingColor = (rating) => {
  const num = Number(rating);
  if (num === 5) return "#24A148";
  if (num === 4) return "#0F62FE";
  if (num === 3) return "#E2B93B";
  if (num === 2) return "#E89E14";
  if (num === 1) return "#E01950";
  return "#64748b";
};

export default function MentorFeedbackDashboard() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored
        ? JSON.parse(stored)
        : { empId: 1, firstName: "John", lastName: "Smith" };
    } catch {
      return { empId: 1, firstName: "John", lastName: "Smith" };
    }
  }, []);

  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const [filters, setFilters] = useState({
    status: "all",
    rating: "all",
    skill: "all",
  });

  // Function to fetch employee name by ID
  const fetchEmployeeName = async (employeeId) => {
    try {
      const response = await axios.get(
        `http://localhost:5333/api/EmployeeManagement/${employeeId}`
      );
      
      if (response.data?.success && response.data.data) {
        const { firstName, lastName } = response.data.data;
        return `${firstName} ${lastName}`;
      }
      return `Employee ${employeeId}`;
    } catch (err) {
      console.error(`Failed to fetch employee ${employeeId}:`, err);
      return `Employee ${employeeId}`;
    }
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const empId = user?.empId || user?.employeeId || 1;

      console.log("📋 Fetching mentor feedback...");
      const response = await mentorFeedbackApi.aboutMe(empId);

      if (response.data?.success && Array.isArray(response.data.data)) {
        // Process each feedback to fetch mentee name
        const enrichedPromises = response.data.data.map(async (feedback) => {
          let menteeName = "Unknown";

          // Extract menteeEmployeeId from the MenteeName field (which contains the ID as string)
          if (feedback.menteeName) {
            // Convert string ID to number
            const menteeId = parseInt(feedback.menteeName, 10);
            
            if (!isNaN(menteeId)) {
              // Fetch the actual employee name
              menteeName = await fetchEmployeeName(menteeId);
              console.log(`✓ Fetched name for ID ${menteeId}: ${menteeName}`);
            }
          } else if (feedback.menteeEmployeeId) {
            // Fallback to menteeEmployeeId if menteeName is not available
            const menteeId = parseInt(feedback.menteeEmployeeId, 10);
            
            if (!isNaN(menteeId)) {
              menteeName = await fetchEmployeeName(menteeId);
              console.log(`✓ Fetched name for ID ${menteeId}: ${menteeName}`);
            }
          }

          return {
            ...feedback,
            menteeEmployeeId: feedback.menteeEmployeeId || parseInt(feedback.menteeName, 10),
            menteeName: menteeName,
            createdAtFormatted: formatDate(feedback.createdAt),
          };
        });

        const enriched = await Promise.all(enrichedPromises);

        setFeedbacks(enriched);
        setFilteredFeedbacks(enriched);
        console.log("✓ Feedback loaded:", enriched.length);
      } else {
        setFeedbacks([]);
        setFilteredFeedbacks([]);
      }
    } catch (err) {
      console.error("❌ Error fetching feedbacks:", err);
      setError("Failed to load feedback. Please try again.");
      setFeedbacks([]);
      setFilteredFeedbacks([]);
    } finally {
      setLoading(false);
    }
  }, [user?.empId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  useEffect(() => {
    let filtered = [...feedbacks];

    if (filters.status !== "all") {
      filtered = filtered.filter((f) => f.status === filters.status);
    }

    if (filters.rating !== "all") {
      filtered = filtered.filter((f) => f.rating === Number(filters.rating));
    }

    if (filters.skill !== "all") {
      filtered = filtered.filter((f) => f.skillName === filters.skill);
    }

    setFilteredFeedbacks(filtered);
  }, [filters, feedbacks]);

  const handleAcknowledge = async (trackingId) => {
    try {
      const response = await mentorFeedbackApi.acknowledge(trackingId);

      if (response.data?.success) {
        setFeedbacks((prev) =>
          prev.map((f) =>
            f.trackingId === trackingId ? { ...f, status: "Acknowledged" } : f
          )
        );
        alert("✓ Feedback acknowledged successfully!");
      }
    } catch (err) {
      console.error("Error acknowledging feedback:", err);
      alert("Failed to acknowledge feedback");
    }
  };

  const stats = useMemo(() => {
    const total = feedbacks.length;
    const avgRating =
      total > 0
        ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1)
        : 0;
    const pending = feedbacks.filter((f) => f.status === "Submitted").length;
    const acknowledged = feedbacks.filter(
      (f) => f.status === "Acknowledged"
    ).length;

    return { total, avgRating, pending, acknowledged };
  }, [feedbacks]);

  const uniqueSkills = useMemo(() => {
    return [...new Set(feedbacks.map((f) => f.skillName).filter(Boolean))];
  }, [feedbacks]);

  const renderStars = (rating) => {
    return (
      <div className="d-flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? "#FFB800" : "none"}
            stroke={star <= rating ? "#FFB800" : "#cbd5e1"}
            strokeWidth={2}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="sme-sla-wrapper h-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div
            className="spinner-border text-primary"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading feedback data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sme-sla-wrapper">
      {/* Breadcrumb Navigation */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol
          className="breadcrumb mb-0 d-flex align-items-center"
          style={{
            backgroundColor: "transparent",
            padding: 0,
            margin: 0,
          }}
        >
          <li
            className="breadcrumb-item"
            style={{ display: "flex", alignItems: "center" }}
          >
            <button
              onClick={() => navigate("/employee/dashboard")}
              style={{
                background: "none",
                border: "none",
                color: "#97247E",
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#7a1d65")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#97247E")}
            >
              <i className="bi bi-house-door" style={{ fontSize: '1rem' }}></i>
              Dashboard
            </button>
          </li>
          <li
            style={{
              display: "flex",
              alignItems: "center",
              color: "#97247E",
              margin: "0 8px",
              fontSize: "1rem",
            }}
          >
            /
          </li>
          
          <li
            className="breadcrumb-item"
            style={{ display: "flex", alignItems: "center" }}
          >
            <button
              onClick={() => navigate("/employee/dashboard/feedback")}
              style={{
                background: "none",
                border: "none",
                color: "#97247E",
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#7a1d65")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#97247E")}
            >
              Feedbacks
            </button>
          </li>
          <li
            style={{
              display: "flex",
              alignItems: "center",
              color: "#97247E",
              margin: "0 8px",
              fontSize: "1rem",
            }}
          >
            /
          </li>
          <li
            className="breadcrumb-item active"
            aria-current="page"
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "#1e293b",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              SME Dashboard
            </span>
          </li>
        </ol>
      </nav>

      {/* Header with Refresh */}
     

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger sme-sla-alert-error mb-3" role="alert">
          <p className="mb-0">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-3">
        {[
          {
            label: "Total Feedback",
            value: stats.total,
            icon: MessageSquare,
            bgColor: "#EEF2FF",
            iconColor: "#3B82F6",
          },
          {
            label: "Average Rating",
            value: stats.avgRating,
            icon: Star,
            bgColor: "#FEF3C7",
            iconColor: "#E2B93B",
          },
        
        ].map(({ label, value, icon: Icon, bgColor, iconColor }) => (
          <div key={label} className="col-lg-3 col-md-6 col-sm-6">
            <div className="sme-sla-stat-card">
              <div className="sme-sla-stat-icon" style={{ backgroundColor: bgColor }}>
                <Icon size={28} color={iconColor} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="sme-sla-stat-value">{value}</h3>
                <p className="sme-sla-stat-label">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Card */}
      <div className="sme-sla-filters-card">
        <div className="row g-3">
          <div className="col-md-4">
            <select
              className="form-select sme-sla-select"
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option value="all">All Status</option>
              <option value="Submitted">Submitted</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Reviewed">Reviewed</option>
            </select>
          </div>

          <div className="col-md-4">
            <select
              className="form-select sme-sla-select"
              value={filters.rating}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, rating: e.target.value }))
              }
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div className="col-md-4">
            <select
              className="form-select sme-sla-select"
              value={filters.skill}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, skill: e.target.value }))
              }
            >
              <option value="all">All Skills</option>
              {uniqueSkills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feedback Table */}
      {filteredFeedbacks.length === 0 ? (
        <div className="sme-sla-empty-state-wrapper">
          <div className="sme-sla-empty-state">
            <MessageSquare size={64} className="sme-sla-empty-icon" />
            <h6 className="sme-sla-empty-title">No feedback found</h6>
            <p className="sme-sla-empty-text">
              {feedbacks.length === 0
                ? "You haven't received any feedback from mentees yet"
                : "No feedback matches your current filters"}
            </p>
          </div>
        </div>
      ) : (
        <div className="sme-sla-table-wrapper">
          <div className="table-responsive">
            <table className="table table-hover mb-0 sme-sla-table">
              <thead className="sme-sla-table-header">
                <tr>
                  <th>EMPLOYEE</th>
                  <th>SKILL</th>
                  <th>RATING</th>
                  <th>SUBMITTED</th>
              
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.map((feedback) => (
                  <tr
                    key={feedback.trackingId}
                    className="sme-sla-clickable-row"
                    onClick={() => setSelectedFeedback(feedback)}
                  >
                    <td>
                      <div className="sme-sla-employee-cell">
                        <User size={16} className="sme-sla-employee-icon" />
                        <div className="sme-sla-employee-info">
                          <div className="sme-sla-employee-name">
                            {feedback.isAnonymous ? "Anonymous" : feedback.menteeName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="sme-sla-badge sme-sla-badge-skill">
                        {feedback.skillName}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2 justify-content-center">
                        <Star
                          size={16}
                          fill="#FFB800"
                          stroke="#FFB800"
                          strokeWidth={2}
                        />
                        <span className="sme-sla-rating-text">
                          {feedback.rating}/5
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="sme-sla-date-cell">
                        <Calendar size={14} className="sme-sla-date-icon" />
                        {feedback.createdAtFormatted}
                      </div>
                    </td>
                   
                    <td>
                      <div className="sme-sla-actions">
                        <button
                          className="btn btn-sm sme-sla-action-btn sme-sla-action-view"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFeedback(feedback);
                          }}
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                        {feedback.status === "Submitted" && (
                          <button
                            className="btn btn-sm sme-sla-action-btn sme-sla-action-acknowledge"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledge(feedback.trackingId);
                            }}
                            title="Acknowledge"
                          >
                            <ThumbsUp size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedFeedback && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
            onClick={() => setSelectedFeedback(null)}
          />
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ zIndex: 1050 }}
            onClick={(e) => {
              if (e.target.classList.contains("modal")) {
                setSelectedFeedback(null);
              }
            }}
          >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "700px" }}>
              <div className="modal-content sme-sla-modal-content">
                <div className="modal-header sme-sla-modal-header">
                  <h5 className="modal-title sme-sla-modal-title">
                    Feedback Details
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setSelectedFeedback(null)}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body sme-sla-modal-body">
                  <div className="row g-3 mb-4">
                    <div className="col-6">
                      <small className="sme-sla-modal-label">Skill</small>
                     
                 <div className="sme-sla-modal-value" style={{ textAlign: "left" }}>
                        {selectedFeedback.skillName}
                  </div>

                    </div>
                    <div className="col-6">
                      <small className="sme-sla-modal-label">Rating</small>
                      <div className="d-flex align-items-center gap-2">
                        {renderStars(selectedFeedback.rating)}
                        <span className="fw-bold">
                          {selectedFeedback.rating}/5
                        </span>
                      </div>
                    </div>
                    <div className="col-6">
                      <small className="sme-sla-modal-label" >From</small>
                      <div className="sme-sla-modal-value"  style={{ textAlign: "left" }}>
                        {selectedFeedback.isAnonymous
                          ? "Anonymous"
                          : selectedFeedback.menteeName}
                      </div>
                    </div>
                    <div className="col-6">
                      <small className="sme-sla-modal-label">Submitted</small>
                      <div className="sme-sla-modal-value"  style={{ textAlign: "left" }}>
                        {selectedFeedback.createdAtFormatted}
                      </div>
                    </div>
                  </div>

                  <div>
                    <small className="sme-sla-modal-label">
                      Feedback Comments
                    </small>
                    <div className="sme-sla-modal-comments">
                      {selectedFeedback.feedbackComments}
                    </div>
                  </div>
                </div>
                <div className="modal-footer sme-sla-modal-footer">
                  {selectedFeedback.status === "Submitted" && (
                    <button
                      className="btn sme-sla-btn-acknowledge-modal"
                      onClick={() => {
                        handleAcknowledge(selectedFeedback.trackingId);
                        setSelectedFeedback(null);
                      }}
                    >
                      <ThumbsUp size={16} />
                      Acknowledge
                    </button>
                  )}
                  <button
                    className="btn sme-sla-btn-close-modal"
                    onClick={() => setSelectedFeedback(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

