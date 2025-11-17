/**
 * MyAssessments Component (formerly UserAssignments)
 * 
 * Employee Assessment Management Dashboard
 * Features:
 * - Real-time deadline timers for all pending assessments
 * - Tab-based view (Pending/Completed)
 * - Advanced search and filtering
 * - Modal-based assessment submission/viewing
 * - Professional form layout with company branding
 * 
 * @component
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import api from "../../../services/performancemanagement/hr/api";
import logoImage from "../../../assets/logodarkfull.png";
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
      // Show all pending form timers at the top
      setVisibleTimers(Object.entries(newTimers).map(([key, value]) => ({ id: key, ...value })));
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
    const initialData = assignment.competencies.map((comp) => ({
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
        const viewData = data.data.details.map((detail) => ({
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
      prev.map((item) =>
        item.competencyId === competencyId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmitAssessment = async () => {
    const incomplete = assessmentData.filter((item) => !item.rating);
    if (incomplete.length > 0) {
      toast.error("Please provide ratings for all competencies.");
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
        employeeComments: item.comments || "",
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
  // RENDER FUNCTIONS
  // ========================

  const renderTable = (data) => (
    <div className="aep-table-container">
      <table className="aep-table">
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
                  <div className="aep-form-name">
                    <i className="bi bi-file-earmark-text"></i>
                    <strong>{assignment.formName}</strong>
                  </div>
                </td>
                <td>
                  <span className="aep-badge">{assignment.formType}</span>
                </td>
                <td>
                  <div className="aep-date-cell">
                    <i className="bi bi-calendar-event"></i>
                    {new Date(assignment.deadline || new Date()).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                </td>
                <td>
                  <span className={assignment.isCompleted ? "aep-badge-success" : "aep-badge-pending"}>
                    <i className={`bi ${assignment.isCompleted ? 'bi-check-circle-fill' : 'bi-clock-fill'}`}></i>
                    {assignment.isCompleted ? "Completed" : "Pending"}
                  </span>
                </td>
                <td>
                  {!assignment.isCompleted ? (
                    <button className="aep-btn aep-btn-submit" onClick={() => openSubmitModal(assignment)}>
                      <i className="bi bi-pencil-square"></i>
                      Submit
                    </button>
                  ) : (
                    <button className="aep-btn aep-btn-view" onClick={() => openViewModal(assignment)}>
                      <i className="bi bi-eye-fill"></i>
                      View
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
      <div className="aep-container">
        <Toaster position="top-right" richColors />
        <div className="aep-loading-state">
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
    <div className="aep-container">
      <Toaster position="top-right" richColors />

      {/* Header Section */}
      <div className="aep-header-section">
        <div className="aep-header-content">
          <div className="aep-header-icon">
            <i className="bi bi-clipboard-check"></i>
          </div>
          <div className="aep-header-text">
            <h2 className="aep-header-title">My Performance Assessments</h2>
            <p className="aep-header-description">View and complete your assigned performance evaluations</p>
          </div>
        </div>
        {showModal && currentAssignment && timers[currentAssignment.assignmentId] && (
          <div className="aep-timer-container">
            <div className="aep-timer-label">Time Remaining</div>
            <div className="aep-timer-display">
              {timers[currentAssignment.assignmentId].days > 0
                ? `${timers[currentAssignment.assignmentId].days} days`
                : "Expired"}
            </div>
            <div className="aep-timer-subtext">
              Deadline: {new Date(currentAssignment.deadline).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* TIMER BARS - ALWAYS VISIBLE FOR ALL PENDING FORMS */}
      {visibleTimers.length > 0 && (
        <div className="aep-timer-bars-container">
          {visibleTimers.map((timer) => (
            <div key={timer.id} className={`aep-timer-bar ${timer.isExpired ? 'expired' : ''}`}>
              <div className="aep-timer-bar-content">
                <span className="aep-timer-bar-icon">
                  <i className="bi bi-alarm"></i>
                </span>
                <span className="aep-timer-bar-label">{timer.formName}</span>
                <span className="aep-timer-bar-time">
                  {timer.days > 0 ? `${timer.days} days left` : "Expired"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filter */}
      <div className="aep-search-filter-container">
        <div className="aep-search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search by form name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="aep-filter-select"
          value={formTypeFilter}
          onChange={(e) => setFormTypeFilter(e.target.value)}
        >
          <option value="">All Form Types</option>
          {formTypes.filter(t => t !== "All").map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="aep-filter-select"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          placeholder="Filter by deadline"
        />
      </div>

      {/* Statistics Cards */}
      <div className="aep-stats-grid">
        <div className="aep-stat-card aep-stat-pending">
          <div className="aep-stat-icon">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="aep-stat-content">
            <h3 className="aep-stat-value">{pendingAssignments.length}</h3>
            <p className="aep-stat-label">Pending</p>
          </div>
        </div>
        <div className="aep-stat-card aep-stat-completed">
          <div className="aep-stat-icon">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="aep-stat-content">
            <h3 className="aep-stat-value">{completedAssignments.length}</h3>
            <p className="aep-stat-label">Completed</p>
          </div>
        </div>
        <div className="aep-stat-card aep-stat-total">
          <div className="aep-stat-icon">
            <i className="bi bi-list-check"></i>
          </div>
          <div className="aep-stat-content">
            <h3 className="aep-stat-value">{assignments.length}</h3>
            <p className="aep-stat-label">Total</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="aep-tab-container">
        <button
          className={`aep-tab-button ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <i className="bi bi-hourglass-split"></i>
          Pending Assessments
          <span className="aep-tab-badge">{filteredPending.length}</span>
        </button>
        <button
          className={`aep-tab-button ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          <i className="bi bi-check-circle-fill"></i>
          Completed Assessments
          <span className="aep-tab-badge">{filteredCompleted.length}</span>
        </button>
      </div>

      {/* Content */}
      <div className="aep-card">
        {activeTab === "pending" && (
          <>
            {filteredPending.length > 0 ? (
              renderTable(filteredPending)
            ) : (
              <div className="aep-empty-state">
                <div className="aep-empty-icon">
                  <i className="bi bi-inbox"></i>
                </div>
                <h3 className="aep-empty-title">No Pending Assessments</h3>
                <p className="aep-empty-text">
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
              <div className="aep-empty-state">
                <div className="aep-empty-icon">
                  <i className="bi bi-clipboard-check"></i>
                </div>
                <h3 className="aep-empty-title">No Completed Assessments</h3>
                <p className="aep-empty-text">
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
                                className="ma-form-select"
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
                                placeholder="-"
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
