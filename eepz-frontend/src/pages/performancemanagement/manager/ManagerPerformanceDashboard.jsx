import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/performancemanagement/api/api";
import { apiPort5113 } from "../../../services/performancemanagement/api/rolesapi";
import { apiPort5114 } from "../../../services/performancemanagement/api/nominationapi";
import { toast, Toaster } from "sonner";
import logoImage from "../../../assets/logodark.png";
import Breadcrumb from "../../../components/common/Breadcrumb";
import "../../../components/performance_management/modals/ManagerPerformanceDashboard/ManagerPerformanceDashboardModal";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user ? user.empId : null;

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("submit");
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [assessmentData, setAssessmentData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const recentToastsRef = useRef(new Set());
  const safeToast = (type, message, id, duration = 3000) => {
    const key = id || message;
    if (recentToastsRef.current.has(key)) return;
    recentToastsRef.current.add(key);

    const options = { duration, icon: null };
    switch (type) {
      case "success":
        console.info("SUCCESS:", message);
        break;
      case "info":
        break;
      case "warning":
        toast(message, options);
        break;
      case "error":
        toast.error(message, options);
        break;
      default:
        toast(message, options);
    }

    setTimeout(() => {
      recentToastsRef.current.delete(key);
    }, duration + 200);
  };


  const [pendingFormNameInput, setPendingFormNameInput] = useState("");
  const [pendingFormNameFilter, setPendingFormNameFilter] = useState("");
  const [pendingTypeFilter, setPendingTypeFilter] = useState("");
  const [completedFormNameInput, setCompletedFormNameInput] = useState("");
  const [completedFormNameFilter, setCompletedFormNameFilter] = useState("");
  const [completedTypeFilter, setCompletedTypeFilter] = useState("");

  useEffect(() => {
    if (userId) {
      fetchAssignments();
    }
  }, [userId]);

  const fetchAssignments = async () => {
    if (!userId) {
      safeToast("error", "Unable to load manager ID. Please login again.", "no-manager-id");
      return;
    }

    setLoading(true);
    setAssignments([]);
    try {
      const roleResponse = await apiPort5113.get(`/Employees/user/${userId}/role`);
      if (!roleResponse.data.success) {
        safeToast("error", "User not found.", "user-not-found");
        return;
      }
      const userRole = roleResponse.data.data;
      if (!userRole.isManager) {
        safeToast("error", "This user is not a Manager.", "not-manager");
        return;
      }
      const assignmentRes = await api.get(`/Assignments/employee/${userId}`);
      if (assignmentRes.data.success) {
        setAssignments(assignmentRes.data.data);
        const pending = assignmentRes.data.data.filter((a) => !a.isCompleted).length;
        const completed = assignmentRes.data.data.filter((a) => a.isCompleted).length;
        safeToast("success", `Found ${pending} pending and ${completed} completed assessments.`, "found-assignments");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      safeToast("error", "Failed to load data.", "fetch-failed");
    } finally {
      setLoading(false);
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
    const incompleteRating = assessmentData.filter((item) => !item.rating);
    if (incompleteRating.length > 0) {
      safeToast("warning", "Please provide ratings for all competencies.", "incomplete-ratings");
      return;
    }

    const incompleteComments = assessmentData.filter((item) => !item.comments || item.comments.trim() === "");
    if (incompleteComments.length > 0) {
      safeToast("warning", "Please provide comments for all competencies.", "incomplete-comments");
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
      const response = await api.post("/SelfAssessment/submit", payload);
      if (response.data?.success) {
        toast.success("Form submitted successfully!");
        setShowModal(false);
        await fetchAssignments();
      } else {
        safeToast("error", response.data?.message || "Failed.", "submit-failed");
      }
    } catch (error) {
      safeToast("error", error.response?.data?.message || "Failed.", "submit-error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewCompleted = async (assignment) => {
    setCurrentAssignment(assignment);
    setModalMode("view");
    setSubmitting(true);
    try {
      const { data } = await api.get(
        `/SelfAssessment/view/${assignment.formId}/user/${userId}`
      );
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
        safeToast("info", "Assessment loaded successfully", "assessment-loaded");
      } else {
        safeToast("error", "Failed to load submitted assessment.", "assessment-load-failed");
      }
    } catch (error) {
      console.error("View error:", error);
      safeToast("error", "Error loading assessment: " + (error.response?.data?.message || error.message), "assessment-load-error");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingAssignments = assignments
    .filter((a) => !a.isCompleted)
    .filter((a) => {
      const matchesFormName = a.formName.toLowerCase().includes(pendingFormNameFilter.toLowerCase());
      const matchesType = pendingTypeFilter === "" || a.formType === pendingTypeFilter;
      return matchesFormName && matchesType;
    });

  const completedAssignments = assignments
    .filter((a) => a.isCompleted)
    .filter((a) => {
      const matchesFormName = a.formName.toLowerCase().includes(completedFormNameFilter.toLowerCase());
      const matchesType = completedTypeFilter === "" || a.formType === completedTypeFilter;
      return matchesFormName && matchesType;
    });

  const allFormTypes = [...new Set(assignments.map(a => a.formType))];

  const renderTable = (data, isCompleted) => (
    <div className="manevap-table-container">
      <table className="manevap-table" style={{ border: "2px solid #26225A", borderRadius: "8px", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th><i className="bi bi-file-earmark-text"></i> Form Name</th>
            <th><i className="bi bi-tag"></i> Type</th>
            <th><i className="bi bi-calendar-event"></i> Assigned</th>
            <th><i className="bi bi-calendar-check"></i> Deadline</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((assignment) => (
            <tr key={assignment.assignmentId}>
              <td><strong>{assignment.formName}</strong></td>
              <td>
                <span className={`manevap-badge ${isCompleted ? 'success' : 'info'}`}>
                  <i className={`bi ${isCompleted ? 'bi-check-circle-fill' : 'bi-bookmark-fill'}`}></i>
                  {assignment.formType}
                </span>
              </td>
              <td>{new Date(assignment.assignedAt).toLocaleDateString()}</td>
              <td>
                {assignment.deadline
                  ? new Date(assignment.deadline).toLocaleDateString()
                  : "N/A"}
              </td>
              <td>
                {!isCompleted ? (
                  <button
                    className="manevap-btn manevap-btn-submit"
                    onClick={() => {
                      setCurrentAssignment(assignment);
                      setModalMode("submit");
                      const initialData = assignment.competencies?.map((comp) => ({
                        competencyId: comp.competencyId,
                        competencyName: comp.name,
                        competencyDescription: comp.description,
                        rating: "",
                        comments: "",
                      })) || [];
                      setAssessmentData(initialData);
                      setShowModal(true);
                    }}
                    style={{
                      background: "linear-gradient(135deg, #97247E 0%, #E01950 100%)",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(151, 36, 126, 0.3)",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "14px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "linear-gradient(135deg, #7d1a6a 0%, #c01640 100%)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(151, 36, 126, 0.4)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "linear-gradient(135deg, #97247E 0%, #E01950 100%)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(151, 36, 126, 0.3)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    
                    Submit
                  </button>
                ) : (
                  <button
                    className="manevap-btn manevap-btn-view"
                    onClick={() => handleViewCompleted(assignment)}
                  >
                    <i className="bi bi-eye-fill"></i>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const internalStyles = `
  /* Breadcrumb purple color and remove underline */
  .hrfcper-top-bar a {
    color: #97247E
  !important;
    text-decoration: none !important;
  }
  .hrfcper-top-bar a:hover {
    color:#97247E
  !important;
    text-decoration: none !important;
  }
  .hrfcper-top-bar span {
    color:#97247E
 !important;
  }

  .mgrdash-pill-toggle {
    display: flex;
    justify-content: center;
    width: 420px;
    max-width: 90vw;
    border-radius: 999px;
    background: #2E2B5F;
    padding: 4px;
    box-shadow: 0 2px 12px rgba(46,43,95,0.12);
    margin: 0 auto 28px auto;
    gap: 0;
  }
  .mgrdash-pill-tab {
    flex: 1 1 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: #fff;
    border: none;
    outline: none;
    border-radius: 999px;
    font-weight: 600;
    font-size: 15px;
    padding: 10px 0;
    cursor: pointer;
    transition: background 0.22s, color 0.22s;
    position: relative;
    margin: 0 2px;
    letter-spacing: 0.5px;
  }
  .mgrdash-pill-tab.active {
    background: #fff;
    color: #2E2B5F;
    box-shadow: 0 2px 8px rgba(46,43,95,.13);
    z-index: 1;
  }
  .mgrdash-pill-tab:not(.active):hover {
    background: #393874;
    color: #fff;
  }
  .mgrdash-pill-count {
    background: rgba(46, 43, 95, 0.09);
    color: #2E2B5F;
    font-size: 13px;
    padding: 2px 11px;
    border-radius: 14px;
    font-weight: 600;
    margin-left: 10px;
  }

  /* Remove background from filter section */
  .manevap-filter-section {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    margin-bottom: 20px !important;
  }

  /* Unified search bar styling */
  .unified-search-wrapper {
    display: flex;
    border: 1px solid #26225A;
    border-radius: 8px;
    overflow: hidden;
    background: white;
  }

  .unified-search-wrapper .manevap-filter-input {
    border: none !important;
    border-radius: 0 !important;
    margin: 0 !important;
  }

  .unified-search-wrapper .manevap-btn-primary {
    border-radius: 0 !important;
    margin: 0 !important;
    border: none !important;
    border-left: 2px solid #26225A !important;
  }

  /* Card with only outer border */
  .manevap-card {
    border: 2px solid #26225A !important;
    border-radius: 8px !important;
    box-shadow: none !important;
  }

  @media (max-width: 700px) {
    .mgrdash-pill-toggle {
      padding: 4px;
    }
    .mgrdash-pill-tab {
      padding: 11px 0;
      font-size: 14px;
    }
    .mgrdash-pill-count {
      margin-left: 6px;
    }
  }
  `;

  if (loading) {
    return (
      <div className="manevap-container">
        <style>{internalStyles}</style>
        <Toaster position="top-right" />
        <div style={{ position: 'relative', zIndex: 12000 }}>
          <Toaster position="top-right" />
        </div>
        <div className="manevap-loading-state">
          <div className="spinner-border"></div>
          <p>Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manevap-container">
      <style>{internalStyles}</style>
      <div style={{ position: 'relative', zIndex: 12000 }}>
        <Toaster position="top-right" />
      </div>
      {/* Breadcrumb */}
      <div className="hrfcper-top-bar">
        <div style={{ width: '100%' }}>
          <Breadcrumb
            items={[
              { label: 'Performance Management', path: '/manager/dashboard/performance' },
              { label: 'Manager Form' }
            ]}
          />
        </div>
      </div>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
      />

      {/* Updated Pill Toggle */}
      <div className="mgrdash-pill-toggle" role="tablist" aria-label="Assignments">
        <button
          className={`mgrdash-pill-tab ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
          type="button"
          aria-selected={activeTab === "pending"}
        >
          Pending <span className="mgrdash-pill-count">{pendingAssignments.length}</span>
        </button>
        <button
          className={`mgrdash-pill-tab ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
          type="button"
          aria-selected={activeTab === "completed"}
        >
          Completed <span className="mgrdash-pill-count">{completedAssignments.length}</span>
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="manevap-card">
          <div className="manevap-filter-section">
            <div className="manevap-filter-group" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="unified-search-wrapper">
                <input
                  type="text"
                  placeholder="Search by form name..."
                  value={pendingFormNameInput}
                  onChange={(e) => setPendingFormNameInput(e.target.value)}
                  className="manevap-filter-input"
                  style={{ flex: 1 }}
                />
                <button
                  className="manevap-btn-primary"
                  onClick={() => setPendingFormNameFilter(pendingFormNameInput)}
                  type="button"
                >
                  Search
                </button>
              </div>
            </div>
            <div className="manevap-filter-group">
              <select
                value={pendingTypeFilter}
                onChange={(e) => setPendingTypeFilter(e.target.value)}
                className="manevap-filter-select"
                style={{ border: '1px solid #26225A' }}
              >
                <option value="">All Types</option>
                {allFormTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {(pendingFormNameFilter || pendingTypeFilter) && (
              <button
                onClick={() => {
                  setPendingFormNameInput("");
                  setPendingFormNameFilter("");
                  setPendingTypeFilter("");
                }}
                className="manevap-clear-btn"
              >
                <i className="bi bi-x-circle"></i>
                Clear Filters
              </button>
            )}
          </div>
          {pendingAssignments.length === 0 ? (
            <div className="manevap-empty-state">
              <i className="bi bi-inbox"></i>
              <h3>
                {pendingFormNameFilter || pendingTypeFilter
                  ? "No Matching Assessments"
                  : "No Pending Assessments"}
              </h3>
              <p>
                {pendingFormNameFilter || pendingTypeFilter
                  ? "Try adjusting your filters"
                  : "All assessments have been completed!"}
              </p>
            </div>
          ) : (
            renderTable(pendingAssignments, false)
          )}
        </div>
      )}


      {activeTab === "completed" && (
        <div className="manevap-card">
          <div className="manevap-filter-section">
            <div className="manevap-filter-group" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="unified-search-wrapper">
                <input
                  type="text"
                  placeholder="Search by form name..."
                  value={completedFormNameInput}
                  onChange={(e) => setCompletedFormNameInput(e.target.value)}
                  className="manevap-filter-input"
                  style={{ flex: 1 }}
                />
                <button
                  className="manevap-btn-primary"
                  onClick={() => setCompletedFormNameFilter(completedFormNameInput)}
                  type="button"
                >
                  <i className="bi bi-search"></i> Search
                </button>
              </div>
            </div>
            <div className="manevap-filter-group">
              <select
                value={completedTypeFilter}
                onChange={(e) => setCompletedTypeFilter(e.target.value)}
                className="manevap-filter-select"
                style={{ border: '1px solid #26225A' }}
              >
                <option value="">All Types</option>
                {allFormTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {(completedFormNameFilter || completedTypeFilter) && (
              <button
                onClick={() => {
                  setCompletedFormNameInput("");
                  setCompletedFormNameFilter("");
                  setCompletedTypeFilter("");
                }}
                className="manevap-clear-btn"
              >
                <i className="bi bi-x-circle"></i>
                Clear Filters
              </button>
            )}
          </div>
          {completedAssignments.length === 0 ? (
            <div className="manevap-empty-state">
              <i className="bi bi-clipboard-check"></i>
              <h3>
                {completedFormNameFilter || completedTypeFilter
                  ? "No Matching Assessments"
                  : "No Completed Assessments"}
              </h3>
              <p>
                {completedFormNameFilter || completedTypeFilter
                  ? "Try adjusting your filters"
                  : "Complete your pending assessments to see them here."}
              </p>
            </div>
          ) : (
            renderTable(completedAssignments, true)
          )}
        </div>
      )}


{showModal && currentAssignment && (
  <div className="manevap-modal-overlay" onClick={() => setShowModal(false)}>
    <div 
      className="manevap-modal-content" 
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "flex",
        flexDirection: "column",
        maxHeight: "90vh"
      }}
    >
      {/* FIXED HEADER */}
      <div
        className="manevap-form-header-strict"
        style={{
          padding: "12px 20px",
          minHeight: "auto",
          borderBottom: "2px solid #2E2B5F",
          flexShrink: 0
        }}
      >
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          gap: "12px"
        }}>
          {/* Logo on LEFT */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <img
              src={logoImage}
              alt="EEPZ Logo"
              className="manevap-modal-logo"
              style={{ height: "32px", width: "auto" }}
            />
            <div style={{
              fontSize: "9px",
              marginTop: "2px",
              fontWeight: 600,
              color: "#26225A"
            }}>
              MANAGER FORM
            </div>
          </div>

          {/* Form name CENTERED */}
          <div style={{ 
            flex: 1, 
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "16px",
              fontWeight: 700,
              marginBottom: "2px",
              color: "#26225A"
            }}>
              Appraisal Form
            </div>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>
              {currentAssignment?.formName || ""}
            </div>
          </div>

          {/* Close button on RIGHT */}
          <button
            onClick={() => setShowModal(false)}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "32px",
              color: "#6b7280",
              cursor: "pointer",
              padding: "0",
              lineHeight: 1,
              transition: "color 0.2s",
              fontWeight: 300,
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#26225A"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
      </div>

      {/* SCROLLABLE BODY */}
      {submitting && modalMode === "view" ? (
        <div className="manevap-modal-loading">
          <div className="spinner-border"></div>
          <p>Loading assessment...</p>
        </div>
      ) : (
        <>
          <div className="manevap-strict-form-body">
            <table className="manevap-strict-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>COMPETENCY NAME</th>
                  <th style={{ textAlign: "left" }}>DESCRIPTION</th>
                  <th style={{ textAlign: "left" }}>RATING</th>
                  <th style={{ textAlign: "left" }}>COMMENTS</th>
                </tr>
              </thead>
              <tbody>
                {assessmentData.map((item, idx) => (
                  <tr key={item.competencyId || idx}>
                    <td className="manevap-cell-bold" style={{ textAlign: "left" }}>
                      {item.competencyName}
                    </td>
                    <td style={{ textAlign: "left" }}>
                      {item.competencyDescription || ""}
                    </td>
                    <td style={{ textAlign: "left" }}>
                      {modalMode === "view" ? (
                        <div className="manevap-modal-cell-view">
                          {item.rating ? `${item.rating} / 5` : '-'}
                        </div>
                      ) : (
                        <select
                          value={item.rating || ""}
                          onChange={e =>
                            updateAssessmentData(item.competencyId, "rating", e.target.value)
                          }
                          className="manevap-modal-cell-input"
                        >
                          <option value="">-</option>
                          <option value="1">1 - Poor</option>
                          <option value="2">2 - Fair</option>
                          <option value="3">3 - Good</option>
                          <option value="4">4 - Very Good</option>
                          <option value="5">5 - Excellent</option>
                        </select>
                      )}
                    </td>
                    <td style={{ textAlign: "left" }}>
                      {modalMode === "view" ? (
                        <div className="manevap-modal-cell-view">{item.comments || "-"}</div>
                      ) : (
                        <input
                          className="manevap-modal-cell-input"
                          type="text"
                          value={item.comments}
                          onChange={e =>
                            updateAssessmentData(item.competencyId, "comments", e.target.value)
                          }
                          placeholder="-"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FIXED FOOTER */}
          <div
            className="manevap-modal-actions"
            style={{
              padding: "10px 20px",
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
              borderTop: "1px solid #e5e7eb",
              flexShrink: 0
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              className="manevap-btn-close"
              style={{
                background: "#6b7280",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "14px",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#4b5563"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#6b7280"}
            >
              Cancel
            </button>
            {modalMode === "submit" && (
              <button
                onClick={handleSubmitAssessment}
                disabled={submitting}
                className="manevap-btn-submit-form"
                style={{
                  background: submitting
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #97247E 0%, #E01950 100%)",
                  color: "white",
                  border: "none",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: "14px",
                  boxShadow: submitting ? "none" : "0 4px 12px rgba(151, 36, 126, 0.3)",
                  transition: "all 0.2s",
                  opacity: submitting ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #7d1a6a 0%, #c01640 100%)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(151, 36, 126, 0.4)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #97247E 0%, #E01950 100%)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(151, 36, 126, 0.3)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
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
