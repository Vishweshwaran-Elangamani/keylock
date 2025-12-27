import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Star,
  User,
  MessageSquare,
  Calendar,
  Eye,
  ThumbsUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mentorFeedbackApi } from "../../../services/feedbackmanagement/feedbackApi";
import axios from "axios";
import "../../../styles/feedback/components/MentorFeedbackDashboard.css";

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

  const [openDropdown, setOpenDropdown] = useState(null);

  const fetchEmployeeName = async (employeeId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PROJECT_API_URL}/api/EmployeeManagement/${employeeId}`
      );
      if (response.data?.success && response.data.data) {
        const { firstName, lastName } = response.data.data;
        return `${firstName} ${lastName}`;
      }
      return `Employee ${employeeId}`;
    } catch (err) {
      return `Employee ${employeeId}`;
    }
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const empId = user?.empId || user?.employeeId || 1;

      const response = await mentorFeedbackApi.aboutMe(empId);

      if (response.data?.success && Array.isArray(response.data.data)) {
        const enrichedPromises = response.data.data.map(async (feedback) => {
          let menteeName = "Unknown";

          if (feedback.menteeName) {
            const menteeId = parseInt(feedback.menteeName, 10);

            if (!isNaN(menteeId)) {
              menteeName = await fetchEmployeeName(menteeId);
            }
          } else if (feedback.menteeEmployeeId) {
            const menteeId = parseInt(feedback.menteeEmployeeId, 10);

            if (!isNaN(menteeId)) {
              menteeName = await fetchEmployeeName(menteeId);
            }
          }

          return {
            ...feedback,
            menteeEmployeeId:
              feedback.menteeEmployeeId || parseInt(feedback.menteeName, 10),
            menteeName: menteeName,
            createdAtFormatted: formatDate(feedback.createdAt),
          };
        });

        const enriched = await Promise.all(enrichedPromises);

        setFeedbacks(enriched);
        setFilteredFeedbacks(enriched);
      } else {
        setFeedbacks([]);
        setFilteredFeedbacks([]);
      }
    } catch (err) {
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
      <div className="mfd-stars-wrapper">
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

  const statusOptions = [
    { label: "Select Status", value: "all" },
    { label: "Submitted", value: "Submitted" },
    { label: "Acknowledged", value: "Acknowledged" },
    { label: "Reviewed", value: "Reviewed" },
  ];

  const ratingOptions = [
    { label: "Select Rating", value: "all" },
    { label: "5 Stars", value: "5" },
    { label: "4 Stars", value: "4" },
    { label: "3 Stars", value: "3" },
    { label: "2 Stars", value: "2" },
    { label: "1 Star", value: "1" },
  ];

  const skillOptions = [
    { label: "Select Skill", value: "all" },
    ...uniqueSkills.map((s) => ({ label: s, value: s })),
  ];

  const getLabel = (list, value) => {
    const match = list.find((o) => o.value === value);
    return match ? match.label : list[0].label;
  };

  const renderDropdown = (name, options) => {
    const isOpen = openDropdown === name;
    const selectedValue = filters[name];
    const selectedLabel = getLabel(options, selectedValue);

    return (
      <div className="mfd-dropdown">
        <button
          type="button"
          className={`mfd-dropdown-trigger ${isOpen ? "mfd-dropdown-trigger-open" : ""}`}
          onClick={() =>
            setOpenDropdown((prev) => (prev === name ? null : name))
          }
        >
          <span className="mfd-dropdown-placeholder">{selectedLabel}</span>
          <span className={`mfd-dropdown-arrow ${isOpen ? "mfd-dropdown-arrow-open" : ""}`}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <polyline
                points="6 9 12 15 18 9"
                fill="none"
                stroke="#27235C"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        {isOpen && (
          <div className="mfd-dropdown-menu">
            {options.map((opt) => (
              <div
                key={opt.value}
                className={`mfd-dropdown-item ${
                  opt.value === selectedValue ? "mfd-dropdown-item-selected" : ""
                }`}
                onClick={() => {
                  setFilters((prev) => ({ ...prev, [name]: opt.value }));
                  setOpenDropdown(null);
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mfd-loading-wrapper">
        <div className="mfd-loading-content">
          <div className="mfd-loading-spinner">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mfd-loading-text">Loading feedback data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mfd-wrapper">
      <nav aria-label="breadcrumb" className="mfd-breadcrumb-nav">
        <ol className="mfd-breadcrumb">
          <li className="mfd-breadcrumb-item">
            <button
              onClick={() => navigate("/employee/dashboard")}
              className="mfd-breadcrumb-link"
            >
              <i className="bi bi-house-door mfd-breadcrumb-icon"></i>
              Dashboard
            </button>
          </li>
          <li className="mfd-breadcrumb-separator">/</li>
          <li className="mfd-breadcrumb-item">
            <button
              onClick={() => navigate("/employee/dashboard/feedback")}
              className="mfd-breadcrumb-link"
            >
              Feedbacks
            </button>
          </li>
          <li className="mfd-breadcrumb-separator">/</li>
          <li className="mfd-breadcrumb-item mfd-breadcrumb-active">
            <span>SME Dashboard</span>
          </li>
        </ol>
      </nav>

      {error && (
        <div className="mfd-alert-error">
          <p className="mfd-alert-message">{error}</p>
        </div>
      )}

      <div className="mfd-stats-grid">
        {[
          {
            label: "Total Feedback",
            value: stats.total,
            icon: MessageSquare,
            bgClass: "mfd-stat-icon-blue",
            iconColor: "#3B82F6",
          },
          {
            label: "Average Rating",
            value: stats.avgRating,
            icon: Star,
            bgClass: "mfd-stat-icon-yellow",
            iconColor: "#E2B93B",
          },
        ].map(({ label, value, icon: Icon, bgClass, iconColor }) => (
          <div key={label} className="mfd-stat-col">
            <div className="mfd-stat-card">
              <div className={`mfd-stat-icon ${bgClass}`}>
                <Icon size={28} color={iconColor} strokeWidth={2.5} />
              </div>
              <div className="mfd-stat-content">
                <h3 className="mfd-stat-value">{value}</h3>
                <p className="mfd-stat-label">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mfd-filters-card">
        <div className="mfd-filters-grid">
          <div className="mfd-filter-col">
            {renderDropdown("status", statusOptions)}
          </div>
          <div className="mfd-filter-col">
            {renderDropdown("rating", ratingOptions)}
          </div>
          <div className="mfd-filter-col">
            {renderDropdown("skill", skillOptions)}
          </div>
        </div>
      </div>

      {filteredFeedbacks.length === 0 ? (
        <div className="mfd-empty-wrapper">
          <div className="mfd-empty-state">
            <MessageSquare size={64} className="mfd-empty-icon" />
            <h6 className="mfd-empty-title">No feedback found</h6>
            <p className="mfd-empty-text">
              {feedbacks.length === 0
                ? "You haven't received any feedback from mentees yet"
                : "No feedback matches your current filters"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mfd-table-wrapper">
          <div className="mfd-table-responsive">
            <table className="mfd-table">
              <thead className="mfd-table-header">
                <tr>
                  <th>EMPLOYEE</th>
                  <th>SKILL</th>
                  <th>RATING</th>
                  <th>SUBMITTED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody className="mfd-table-body">
                {filteredFeedbacks.map((feedback) => (
                  <tr
                    key={feedback.trackingId}
                    className="mfd-table-row"
                    onClick={() => setSelectedFeedback(feedback)}
                  >
                    <td>
                      <div className="mfd-employee-cell">
                        <User size={16} className="mfd-employee-icon" />
                        <div className="mfd-employee-info">
                          <div className="mfd-employee-name">
                            {feedback.isAnonymous ? "Anonymous" : feedback.menteeName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="mfd-badge-skill">
                        {feedback.skillName}
                      </span>
                    </td>
                    <td>
                      <div className="mfd-rating-cell">
                        <Star size={16} className="mfd-rating-star" />
                        <span className="mfd-rating-text">
                          {feedback.rating}/5
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="mfd-date-cell">
                        <Calendar size={14} className="mfd-date-icon" />
                        {feedback.createdAtFormatted}
                      </div>
                    </td>
                    <td>
                      <div className="mfd-actions">
                        <button
                          className="mfd-action-btn mfd-action-view"
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
                            className="mfd-action-btn mfd-action-acknowledge"
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

      {selectedFeedback && (
        <>
          <div
            className="mfd-modal-backdrop"
            onClick={() => setSelectedFeedback(null)}
          />
          <div
            className="mfd-modal"
            onClick={(e) => {
              if (e.target.classList.contains("mfd-modal")) {
                setSelectedFeedback(null);
              }
            }}
          >
            <div className="mfd-modal-dialog">
              <div className="mfd-modal-content">
                <div className="mfd-modal-header">
                  <h5 className="mfd-modal-title">Feedback Details</h5>
                  <button
                    type="button"
                    className="mfd-modal-close"
                    onClick={() => setSelectedFeedback(null)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="mfd-modal-body">
                  <div className="mfd-modal-grid">
                    <div className="mfd-modal-field">
                      <small className="mfd-modal-label">Skill</small>
                      <div className="mfd-modal-value">
                        {selectedFeedback.skillName}
                      </div>
                    </div>
                    <div className="mfd-modal-field">
                      <small className="mfd-modal-label">Rating</small>
                      <div className="mfd-modal-rating">
                        {renderStars(selectedFeedback.rating)}
                        <span className="mfd-modal-rating-value">
                          {selectedFeedback.rating}/5
                        </span>
                      </div>
                    </div>
                    <div className="mfd-modal-field">
                      <small className="mfd-modal-label">From</small>
                      <div className="mfd-modal-value">
                        {selectedFeedback.isAnonymous
                          ? "Anonymous"
                          : selectedFeedback.menteeName}
                      </div>
                    </div>
                    <div className="mfd-modal-field">
                      <small className="mfd-modal-label">Submitted</small>
                      <div className="mfd-modal-value">
                        {selectedFeedback.createdAtFormatted}
                      </div>
                    </div>
                  </div>

                  <div className="mfd-modal-comments-section">
                    <small className="mfd-modal-label">Feedback Comments</small>
                    <div className="mfd-modal-comments">
                      {selectedFeedback.feedbackComments}
                    </div>
                  </div>
                </div>
                <div className="mfd-modal-footer">
                  {selectedFeedback.status === "Submitted" && (
                    <button
                      className="mfd-modal-btn mfd-modal-btn-acknowledge"
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
                    className="mfd-modal-btn mfd-modal-btn-close"
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
