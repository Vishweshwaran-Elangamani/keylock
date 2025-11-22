// Paste your JSX component code below (replace this entire file contents with your .jsx file)

/*
  MyAssessments_updated.jsx
  - Updated: search box now uses a separate Search button and Enter key to trigger filtering
  - Fixed: Form Type select default value now matches filter logic ("All")
  - Added: local input state `searchInput` so typing doesn't immediately filter results
  - Minor: Enter key submits search, and Search button placed next to input
*/

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Toaster, toast } from "sonner";
import api from "../../../services/performancemanagement/hr/api";
import logoImage from "../../../assets/logodark.png";
import "../../../styles/performancemanagement/employee/MyAssessments.css";

// Utility function to get days and hours left
function getTimeLeft(deadline) {
  const now = new Date();
  const dl = new Date(deadline);
  let ms = dl - now;
  if (ms < 0) ms = 0;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, expired: ms === 0 };
}

/**
 * Breadcrumbs component
 * items: [{ label: string, to: string }]
 */
function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="breadcrumb" className="empassper-breadcrumbs">
      <ol>
        {items.map((item, index) => {
          const last = index === items.length - 1;

          return (
            <li key={index} className={last ? "current" : ""}>
              {!last ? (
                <Link to={item.to || "#"} className="breadcrumb-link">
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumb-current" aria-current="page">{item.label}</span>
              )}

              {!last && <span className="breadcrumb-sep">{'>'}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}


function MyAssessments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("submit");
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [assessmentData, setAssessmentData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  // NEW: local input state so typing does NOT immediately filter
  const [searchInput, setSearchInput] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [formTypeFilter, setFormTypeFilter] = useState("All");
  const [timers, setTimers] = useState({}); // Store all pending form timers
  const [visibleTimers, setVisibleTimers] = useState([]); // Store visible timer bars

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user ? user.empId : null;

  // ========================
  // EFFECTS
  // ========================

  useEffect(() => {
    if (!userId) {
      navigate("/employee/login");
      return;
    }
    fetchAssignments();
  }, [userId, navigate]);

  // TIMER EFFECT - RUNS EVERY SECOND FOR ALL PENDING FORMS
  useEffect(() => {
    const interval = setInterval(() => {
      const pendingAssignments = assignments.filter((a) => !a.isCompleted);
      const newTimers = {};
      const now = new Date();

      pendingAssignments.forEach((assignment) => {
        if (assignment.deadline) {
          const deadline = new Date(assignment.deadline);
          const diffTime = deadline - now;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          newTimers[assignment.assignmentId] = {
            days: diffDays >= 0 ? diffDays : 0,
            formName: assignment.formName,
            deadline: assignment.deadline,
            isExpired: diffDays < 0,
          };
        }
      });

      setTimers(newTimers);
      // Show all pending form timers at the top, sorted by soonest deadline
      const sorted = Object.entries(newTimers)
        .map(([key, value]) => ({ id: key, ...value }))
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      setVisibleTimers(sorted);
    }, 1000);

    return () => clearInterval(interval);
  }, [assignments]);

  // ========================
  // API FUNCTIONS
  // ========================

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/AppraisalProcess/employee/${userId}`);
      if (data.success) {
        setAssignments(data.data || []);
        toast.success("Assessments loaded successfully");
      } else {
        toast.error(data.message || "Failed to fetch assignments.");
      }
    } catch (error) {
      toast.error("Failed to load assignments.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openSubmitModal = (assignment) => {
    setCurrentAssignment(assignment);
    setModalMode("submit");
    const initialData = (assignment.competencies || []).map((comp) => ({
      competencyId: comp.competencyId,
      competencyName: comp.name,
      competencyDescription: comp.description,
      rating: "",
      comments: "",
    }));
    setAssessmentData(initialData);
    setShowModal(true);
  };

  const openViewModal = async (assignment) => {
    setCurrentAssignment(assignment);
    setModalMode("view");
    setSubmitting(true);
    try {
      const { data } = await api.get(`/SelfAssessment/view/${assignment.formId}/user/${userId}`);
      if (data.success) {
        const viewData = (data.data.details || []).map((detail) => ({
          competencyId: detail.competencyId,
          competencyName: detail.competencyName,
          competencyDescription: detail.competencyDescription,
          rating: detail.rating,
          comments: detail.comments || "",
        }));
        setAssessmentData(viewData);
        setShowModal(true);
        toast.success("Assessment loaded successfully");
      } else {
        toast.error("Failed to load submitted assessment.");
      }
    } catch (error) {
      toast.error("Error loading assessment.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateAssessmentData = (competencyId, field, value) => {
    setAssessmentData((prev) =>
      prev.map((item) => (item.competencyId === competencyId ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmitAssessment = async () => {
    // ✅ Validate ratings
    const incompleteRatings = assessmentData.filter((item) => !item.rating);
    if (incompleteRatings.length > 0) {
      toast.error("Please provide ratings for all competencies.");
      return;
    }

    // ✅ Validate comments
    const incompleteComments = assessmentData.filter((item) => !item.comments || item.comments.trim() === "");
    if (incompleteComments.length > 0) {
      toast.error("Please provide comments for all competencies.");
      return;
    }

    setSubmitting(true);
    const payload = {
      formId: currentAssignment.formId,
      userId: parseInt(userId),
      status: "Submitted",
      assessmentDetails: assessmentData.map((item) => ({
        competencyId: item.competencyId,
        employeeRating: parseInt(item.rating),
        employeeComments: item.comments.trim(),
      })),
    };

    try {
      const { data } = await api.post("/SelfAssessment/submit", payload);
      if (data.success) {
        toast.success("Assessment submitted successfully!");
        setShowModal(false);

        // Remove timer for submitted form
        const assignmentIdToRemove = currentAssignment.assignmentId;
        setTimers((prev) => {
          const newTimers = { ...prev };
          delete newTimers[assignmentIdToRemove];
          return newTimers;
        });

        setCurrentAssignment(null);
        await fetchAssignments();
      } else {
        toast.error("Submission failed.");
      }
    } catch (error) {
      toast.error("Submission failed.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // ========================
  // FILTER & DATA PROCESSING
  // ========================

  const pendingAssignments = assignments.filter((a) => !a.isCompleted);
  const completedAssignments = assignments.filter((a) => a.isCompleted);

  const formTypes = ["All", ...new Set(assignments.map((a) => a.formType).filter(Boolean))];

  const filterAssignments = (assignmentList) => {
    return assignmentList.filter((assignment) => {
      const matchSearch =
        assignment.formName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.formType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDate = !dateFilter ||
        new Date(assignment.deadline).toLocaleDateString("en-GB") ===
        new Date(dateFilter).toLocaleDateString("en-GB");

      const matchType = formTypeFilter === "All" || assignment.formType === formTypeFilter;

      return matchSearch && matchDate && matchType;
    });
  };

  const filteredPending = filterAssignments(pendingAssignments);
  const filteredCompleted = filterAssignments(completedAssignments);

  // ========================
  // SEARCH HANDLER (NEW)
  // ========================
  const handleSearch = () => {
    // Trim input and update the actual query used for filtering
    setSearchQuery(searchInput.trim());
    // You could also reset pagination or other UI state here if present
  };

  // ========================
  // RENDER FUNCTIONS
  // ========================

  const renderTable = (data) => (
    <div className="empassper-table-container">
      <table className="empassper-table">
        <thead>
          <tr>
            <th>Form Name</th>
            <th>Type</th>
            <th>Deadline</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((assignment) => {
            return (
              <tr key={assignment.assignmentId}>
                <td>
                  <div className="empassper-form-name">
                    <i className="bi bi-file-earmark-text"></i>
                    <strong>{assignment.formName}</strong>
                  </div>
                </td>
                <td>
                  <span className="empassper-badge">{assignment.formType}</span>
                </td>
                <td>
                  <div className="empassper-date-cell">
                    <i className="bi bi-calendar-event"></i>
                    {new Date(assignment.deadline || new Date()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </td>
                <td>
                  <span className={assignment.isCompleted ? "empassper-badge-success" : "empassper-badge-pending"}>
                    <i className={`bi ${assignment.isCompleted ? 'bi-check-circle-fill' : 'bi-clock-fill'}`}></i>
                    {assignment.isCompleted ? "Completed" : "Pending"}
                  </span>
                </td>
                <td>
                  {!assignment.isCompleted ? (
                    <button className="empassper-btn empassper-btn-submit" onClick={() => openSubmitModal(assignment)}>
                      <i className="bi bi-pencil-square"></i>
                      Submit
                    </button>
                  ) : (
                    <button className="empassper-btn empassper-btn-view" onClick={() => openViewModal(assignment)}>
                      <i className="bi bi-eye-fill"></i>
                      
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // ========================
  // MAIN RENDER - LOADING STATE
  // ========================

  if (loading) {
    return (
      <div className="empassper-container">
        <Toaster position="top-right" richColors />
        <div className="empassper-loading-state">
          <div className="spinner-border"></div>
          <p>Loading assessments...</p>
        </div>
      </div>
    );
  }

  // ========================
  // MAIN RENDER - PAGE CONTENT
  // ========================

  return (
    <div className="empassper-container">
      <Toaster position="top-right" richColors />

      {/* Header Section with breadcrumbs */}
      <div className="empassper-header-section">
        <div className="empassper-header-content">
          <div className="empassper-header-text" style={{ flex: 1 }}>
            {/* Breadcrumbs */}
            <Breadcrumbs
              items={[
                { label: <i className="bi bi-house-fill" aria-hidden="true"></i>, to: "/employee/dashboard", isIcon: true },
                { label: "Performance Management", to: "/employee/dashboard/performance" },
                { label: <strong>My Performance Assessments</strong>, to: "/employee/dashboard/performance/my-assessments" }
              ]}
            />
          </div>
        </div>

        {showModal && currentAssignment && timers[currentAssignment.assignmentId] && (
          <div className="empassper-timer-container">
            <div className="empassper-timer-label">Time Remaining</div>
            <div className="empassper-timer-display">
              {timers[currentAssignment.assignmentId].days > 0
                ? `${timers[currentAssignment.assignmentId].days} days`
                : "Expired"}
            </div>
            <div className="empassper-timer-subtext">
              Deadline: {new Date(currentAssignment.deadline).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* TIMER BARS - ALWAYS VISIBLE FOR ALL PENDING FORMS */}
      {visibleTimers.length > 0 && (
        <div className="empassper-timer-bars-container">
          {visibleTimers.map((timer) => (
            <div key={timer.id} className={`empassper-timer-bar ${timer.isExpired ? 'expired' : ''}`}>
              <div className="empassper-timer-bar-content">
                <span className="empassper-timer-bar-icon">
                  <i className="bi bi-alarm"></i>
                </span>
                <span className="empassper-timer-bar-label">{timer.formName}</span>
                <span className="empassper-timer-bar-time">
                  {timer.days > 0 ? `${timer.days} days left` : "Expired"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filter */}
      <div className="empassper-search-filter-container">
        <div className="empassper-search-box">
         
          <input
            type="text"
            placeholder="Search by form name or type..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            aria-label="Search assessments"
          />
          {/* NEW: Separate Search button */}
          <button className="empassper-search-btn" onClick={handleSearch} aria-label="Search">Search</button>
        </div>
        <select
          className="empassper-filter-select"
          value={formTypeFilter}
          onChange={(e) => setFormTypeFilter(e.target.value)}
        >
          <option value="All">All Form Types</option>
          {formTypes.filter(t => t !== "All").map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="empassper-filter-select"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          placeholder="Filter by deadline"
        />
      </div>

      {/* Statistics Cards */}
      <div className="empassper-stats-grid">
        <div className="empassper-stat-card empassper-stat-pending">
          <div className="empassper-stat-icon">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="empassper-stat-content">
            <h3 className="empassper-stat-value">{pendingAssignments.length}</h3>
            <p className="empassper-stat-label">Pending</p>
          </div>
        </div>
        <div className="empassper-stat-card empassper-stat-completed">
          <div className="empassper-stat-icon">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="empassper-stat-content">
            <h3 className="empassper-stat-value">{completedAssignments.length}</h3>
            <p className="empassper-stat-label">Completed</p>
          </div>
        </div>
        <div className="empassper-stat-card empassper-stat-total">
          <div className="empassper-stat-icon">
            <i className="bi bi-list-check"></i>
          </div>
          <div className="empassper-stat-content">
            <h3 className="empassper-stat-value">{assignments.length}</h3>
            <p className="empassper-stat-label">Total</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="empassper-tab-container">
        <button
          className={`empassper-tab-button ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <i className="bi bi-hourglass-split"></i>
          Pending Assessments
          <span className="empassper-tab-badge">{filteredPending.length}</span>
        </button>
        <button
          className={`empassper-tab-button ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          <i className="bi bi-check-circle-fill"></i>
          Completed Assessments
          <span className="empassper-tab-badge">{filteredCompleted.length}</span>
        </button>
      </div>

      {/* Content */}
      <div className="empassper-card">
        {activeTab === "pending" && (
          <>
            {filteredPending.length > 0 ? (
              renderTable(filteredPending)
            ) : (
              <div className="empassper-empty-state">
                <div className="empassper-empty-icon">
                  <i className="bi bi-inbox"></i>
                </div>
                <h3 className="empassper-empty-title">No Pending Assessments</h3>
                <p className="empassper-empty-text">
                  {assignments.length === 0
                    ? "You don't have any assessments assigned yet."
                    : "All assessments have been completed or filtered out!"}
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "completed" && (
          <>
            {filteredCompleted.length > 0 ? (
              renderTable(filteredCompleted)
            ) : (
              <div className="empassper-empty-state">
                <div className="empassper-empty-icon">
                  <i className="bi bi-clipboard-check"></i>
                </div>
                <h3 className="empassper-empty-title">No Completed Assessments</h3>
                <p className="empassper-empty-text">
                  Complete your pending assessments to see them here.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal - KEEPING ORIGINAL FORMAT */}
      {showModal && currentAssignment && (
        <div
          className="modal-overlay"
          onClick={() => !submitting && setShowModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Form Header */}
            <div className="form-header">
              <div className="logo-section">
                <img src={logoImage} alt="Logo" className="logo-small" />
                <div className="appraisal-label">Appraisal Form</div>
              </div>
              <div className="form-title-container">
                <h2 className="form-title">{currentAssignment?.formName}</h2>
                <p className="form-subtitle">
                  {currentAssignment?.formType} Assessment Form
                </p>
              </div>
            </div>

            <div className="form-divider"></div>

            {submitting && modalMode === "view" ? (
              <div
                className="form-body"
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <div>
                  <div className="spinner-border"></div>
                  <p style={{ marginTop: "16px", color: "var(--text-light)", textAlign: "center" }}>
                    Loading assessment...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Form Body */}
                <div className="form-body">
                  <table className="form-table">
                    <thead>
                      <tr>
                        <th>Competency Name</th>
                        <th>Description</th>
                        <th>Rating</th>
                        <th>Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessmentData.map((item) => (
                        <tr key={item.competencyId}>
                          <td>
                            <strong>{item.competencyName}</strong>
                          </td>
                          <td>{item.competencyDescription || "N/A"}</td>
                          <td>
                            {modalMode === "view" ? (
                              <span className="rating-badge">
                                {item.rating} / 5
                              </span>
                            ) : (
                              <select
                                value={item.rating}
                                onChange={(e) =>
                                  updateAssessmentData(
                                    item.competencyId,
                                    "rating",
                                    e.target.value
                                  )
                                }
                                className="form-select"
                                disabled={submitting}
                              >
                                <option value="">-</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                              </select>
                            )}
                          </td>
                          <td>
                            {modalMode === "view" ? (
                              <span>{item.comments || "-"}</span>
                            ) : (
                              <textarea
                                value={item.comments}
                                onChange={(e) =>
                                  updateAssessmentData(
                                    item.competencyId,
                                    "comments",
                                    e.target.value
                                  )
                                }
                                placeholder="Justify through comments"
                                className="form-textarea"
                                disabled={submitting}

                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Form Footer */}
                <div className="form-footer">
                  <button
                    className="btn-cancel"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    {modalMode === "view" ? "Close" : "Cancel"}
                  </button>
                  {modalMode === "submit" && (
                    <button
                      className="btn-submit-form"
                      onClick={handleSubmitAssessment}
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Submit Assessment"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyAssessments;



/* Responsive: reduce spacing on small screens */
