import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Star, User, MessageSquare, Calendar, Eye, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mentorFeedbackApi } from "../../../services/feedbackmanagement/feedbackApi";
import axios from "axios";
import "../../../styles/feedback/components/MentorFeedbackDashboard.css";
import CustomDropdown from "../../../components/project-management/common/CustomDropdown";
import PaginationFooter from "../../../components/project-management/common/PaginationFooter";

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

const isNumericValue = (val) => {
  if (val === null || val === undefined) return false;
  const s = String(val).trim();
  if (!s) return false;
  return !isNaN(Number(s));
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
  const [error, setError] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [filters, setFilters] = useState({
    status: "all",
    rating: "all",
    skill: "all",
  });

  const employeeNameCacheRef = useRef(new Map());

  const fetchEmployeeName = async (employeeId) => {
    try {
      const id = Number(employeeId);
      if (!id || isNaN(id)) return "Unknown";

      if (employeeNameCacheRef.current.has(id)) {
        return employeeNameCacheRef.current.get(id);
      }

      const PROJECT_API_URL = import.meta.env.VITE_PROJECT_API_URL;

      const response = await axios.get(
        `${PROJECT_API_URL}/api/employees/${id}`
      );

      let name = `Employee ${id}`;

      if (response?.data) {
        const payload = response.data?.data ?? response.data;
        const firstName = payload?.firstName ?? payload?.FirstName;
        const lastName = payload?.lastName ?? payload?.LastName;

        if (firstName || lastName) {
          name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
        }
      }

      employeeNameCacheRef.current.set(id, name);
      return name;
    } catch {
      return `Employee ${employeeId}`;
    }
  };

  const resolveMenteeDisplayName = async (feedback) => {
    if (feedback?.isAnonymous) return "Anonymous";

    const menteeNameRaw = feedback?.menteeName;

    if (menteeNameRaw && !isNumericValue(menteeNameRaw)) {
      const clean = String(menteeNameRaw).trim();
      if (clean.length > 0) return clean;
    }

    const menteeId =
      feedback?.menteeEmployeeId ??
      (isNumericValue(menteeNameRaw) ? Number(menteeNameRaw) : null);

    if (!menteeId) return "Unknown";

    return await fetchEmployeeName(menteeId);
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const empId = user?.empId || user?.employeeId || 1;
      const response = await mentorFeedbackApi.aboutMentor(empId);

      if (response.data?.success && Array.isArray(response.data.data)) {
        const enrichedPromises = response.data.data.map(async (feedback) => {
          const menteeName = await resolveMenteeDisplayName(feedback);

          const menteeEmployeeId =
            feedback?.menteeEmployeeId ??
            (isNumericValue(feedback?.menteeName)
              ? Number(feedback?.menteeName)
              : null);

          return {
            ...feedback,
            menteeEmployeeId,
            menteeName,
            createdAtFormatted: formatDate(feedback.createdAt),
          };
        });

        const enriched = await Promise.all(enrichedPromises);
        setFeedbacks(enriched);
        setFilteredFeedbacks(enriched);
        setCurrentPage(1);
      } else {
        setFeedbacks([]);
        setFilteredFeedbacks([]);
      }
    } catch {
      setError("Failed to load feedback. Please try again.");
      setFeedbacks([]);
      setFilteredFeedbacks([]);
    } finally {
      setLoading(false);
    }
  }, [user?.empId, user?.employeeId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    let filtered = [...feedbacks];

    if (filters.status !== "all")
      filtered = filtered.filter((f) => f.status === filters.status);

    if (filters.rating !== "all")
      filtered = filtered.filter((f) => f.rating === Number(filters.rating));

    if (filters.skill !== "all")
      filtered = filtered.filter((f) => f.skillName === filters.skill);

    setFilteredFeedbacks(filtered);
    setCurrentPage(1);
  }, [filters, feedbacks]);

  const safeTotal = filteredFeedbacks.length;

  const totalPages = Math.max(1, Math.ceil(safeTotal / itemsPerPage));

  const startIndex =
    safeTotal === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;

  const endIndex =
    safeTotal === 0 ? 0 : Math.min(currentPage * itemsPerPage, safeTotal);

  const currentEntries = filteredFeedbacks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const stats = useMemo(() => {
    const total = feedbacks.length;
    const avgRating =
      total > 0
        ? (feedbacks.reduce((sum, f) => sum + (Number(f.rating) || 0), 0) / total)
            .toFixed(1)
        : 0;
    return { total, avgRating };
  }, [feedbacks]);

  const uniqueSkills = useMemo(() => {
    return [...new Set(feedbacks.map((f) => f.skillName).filter(Boolean))];
  }, [feedbacks]);

  const statusOptions = useMemo(
    () => [
      { label: "Select Status", value: "all" },
      { label: "Submitted", value: "Submitted" },
      { label: "Acknowledged", value: "Acknowledged" },
      { label: "Reviewed", value: "Reviewed" },
    ],
    []
  );

  const ratingOptions = useMemo(
    () => [
      { label: "Select Rating", value: "all" },
      { label: "5 Stars", value: "5" },
      { label: "4 Stars", value: "4" },
      { label: "3 Stars", value: "3" },
      { label: "2 Stars", value: "2" },
      { label: "1 Star", value: "1" },
    ],
    []
  );

  const skillOptions = useMemo(
    () => [
      { label: "Select Skill", value: "all" },
      ...uniqueSkills.map((s) => ({ label: s, value: s })),
    ],
    [uniqueSkills]
  );

  const entriesOptions = useMemo(() => [5, 10, 25, 50], []);

  const renderStars = (rating) => {
    const r = Number(rating) || 0;
    return (
      <div className="mfd-stars-wrapper">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= r ? "#FFB800" : "none"}
            stroke={star <= r ? "#FFB800" : "#cbd5e1"}
            strokeWidth={2}
          />
        ))}
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
              type="button"
            >
              <Home size={20} />
            </button>
          </li>
          <li className="mfd-breadcrumb-separator">/</li>
          <li className="mfd-breadcrumb-item">
            <button
              onClick={() => navigate("/employee/dashboard/feedback")}
              className="mfd-breadcrumb-link"
              type="button"
            >
              Feedback Management
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
            <CustomDropdown
              name="status"
              value={filters.status}
              options={statusOptions}
              placeholder="Select Status"
              onChange={(_, val) =>
                setFilters((prev) => ({ ...prev, status: val }))
              }
              className="mfd-dd"
            />
          </div>

          <div className="mfd-filter-col">
            <CustomDropdown
              name="rating"
              value={filters.rating}
              options={ratingOptions}
              placeholder="Select Rating"
              onChange={(_, val) =>
                setFilters((prev) => ({ ...prev, rating: val }))
              }
              className="mfd-dd"
            />
          </div>

          <div className="mfd-filter-col">
            <CustomDropdown
              name="skill"
              value={filters.skill}
              options={skillOptions}
              placeholder="Select Skill"
              onChange={(_, val) =>
                setFilters((prev) => ({ ...prev, skill: val }))
              }
              className="mfd-dd"
            />
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
                {currentEntries.map((feedback) => (
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
                            {feedback.isAnonymous
                              ? "Anonymous"
                              : feedback.menteeName}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="mfd-badge-skill">{feedback.skillName}</span>
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
                          type="button"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {safeTotal > 0 && (
            <div className="mfd-pf-wrap">
              <PaginationFooter
                currentPage={currentPage}
                totalItems={safeTotal}
                itemsPerPage={itemsPerPage}
                onPageChange={(p) => handlePageChange(p)}
                onItemsPerPageChange={(size) => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                }}
                pageSizeOptions={entriesOptions}
                showPageSizeDropdown={true}
                showStatusText={true}
              />
            </div>
          )}
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
              if (e.target.classList.contains("mfd-modal"))
                setSelectedFeedback(null);
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
                  <button
                    className="mfd-modal-btn mfd-modal-btn-close"
                    onClick={() => setSelectedFeedback(null)}
                    type="button"
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
