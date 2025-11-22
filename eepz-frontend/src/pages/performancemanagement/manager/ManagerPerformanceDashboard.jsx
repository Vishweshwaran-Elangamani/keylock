/**
 * ManagerDashboard Component
 *
 * Manager Evaluation Dashboard
 * Features:
 * - Tab-based view (Pending/Completed)
 * - Advanced filtering (Form name + Type)
 * - Simple professional form template
 * - Assessment submission and viewing
 *
 * @component
 */
 
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/performancemanagement/hr/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logoImage from "../../../assets/logodark.png";
import "../../../styles/performancemanagement/manager/ManagerPerformanceDashboard.css";
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
 
  // Filter states
  const [pendingFormNameFilter, setPendingFormNameFilter] = useState("");
  const [pendingTypeFilter, setPendingTypeFilter] = useState("");
  const [completedFormNameFilter, setCompletedFormNameFilter] = useState("");
  const [completedTypeFilter, setCompletedTypeFilter] = useState("");
 
  // ========================
  // EFFECTS
  // ========================
 
  useEffect(() => {
    if (userId) {
      fetchAssignments();
    }
  }, [userId]);
 
  // ========================
  // API FUNCTIONS
  // ========================
 
  const fetchAssignments = async () => {
    if (!userId) {
      toast.error("Unable to load manager ID. Please login again.");
      return;
    }
 
    setLoading(true);
    setAssignments([]);
 
    try {
      const roleResponse = await api.get(`/AppraisalProcess/user/${userId}/role`);
 
      if (!roleResponse.data.success) {
        toast.error("User not found.");
        return;
      }
 
      const userRole = roleResponse.data.data;
 
      if (!userRole.isManager) {
        toast.error("This user is not a Manager.");
        return;
      }
 
      const assignmentRes = await api.get(`/AppraisalProcess/employee/${userId}`);
 
      if (assignmentRes.data.success) {
        setAssignments(assignmentRes.data.data);
        const pending = assignmentRes.data.data.filter((a) => !a.isCompleted).length;
        const completed = assignmentRes.data.data.filter((a) => a.isCompleted).length;
        toast.success(`Found ${pending} pending and ${completed} completed assessments.`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load data.");
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
    const incomplete = assessmentData.filter((item) => !item.rating);
    if (incomplete.length > 0) {
      toast.warning("Please provide ratings for all competencies.");
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
        toast.success("Assessment submitted successfully!");
        setShowModal(false);
        await fetchAssignments();
      } else {
        toast.error(response.data?.message || "Failed.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed.");
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
        toast.info("Assessment loaded successfully");
      } else {
        toast.error("Failed to load submitted assessment.");
      }
    } catch (error) {
      console.error("View error:", error);
      toast.error("Error loading assessment: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };
 
  // ========================
  // FILTER & DATA PROCESSING
  // ========================
 
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
 
  // ========================
  // RENDER FUNCTIONS
  // ========================
 
  const renderTable = (data, isCompleted) => (
    <div className="manevap-table-container">
      <table className="manevap-table">
        <thead>
          <tr>
            <th><i className="bi bi-file-earmark-text"></i> Form Name</th>
            <th><i className="bi bi-tag"></i> Type</th>
            <th><i className="bi bi-calendar-event"></i> Assigned</th>
            <th><i className="bi bi-calendar-check"></i> Deadline</th>
            <th><i className="bi bi-info-circle"></i> Status</th>
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
                <span className={`manevap-badge ${isCompleted ? 'success' : 'warning'}`}>
                  <i className={`bi ${isCompleted ? 'bi-patch-check-fill' : 'bi-exclamation-circle-fill'}`}></i>
                  {assignment.status || (isCompleted ? "Submitted" : "Pending")}
                </span>
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
                  >
                    <i className="bi bi-send-fill"></i>
                    Submit
                  </button>
                ) : (
                  <button
                    className="manevap-btn manevap-btn-view"
                    onClick={() => handleViewCompleted(assignment)}
                  >
                    <i className="bi bi-eye-fill"></i>
                    View Details
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
 
  // ========================
  // MAIN RENDER - LOADING STATE
  // ========================
 
  if (loading) {
    return (
      <div className="manevap-container">
        <ToastContainer />
        <div className="manevap-loading-state">
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
    <div className="manevap-container">
      <ToastContainer />
 
      {/* Bootstrap Icons CDN */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
      />
 
      {/* Header Section - LEFT ALIGNED */}
      <div className="manevap-header-section">
        <div className="manevap-header-icon">
          <i className="bi bi-speedometer2"></i>
        </div>
        <div className="manevap-header-text">
          <h2 className="manevap-title">Team Evaluation</h2>
          <p className="manevap-subtitle">Manage and review your performance assessments</p>
        </div>
      </div>
 
      {/* Tab Navigation */}
      <div className="manevap-tab-container">
        <button
          className={`manevap-tab ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <i className="bi bi-hourglass-split"></i>
          Pending
          <span className="manevap-tab-badge">{pendingAssignments.length}</span>
        </button>
        <button
          className={`manevap-tab ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          <i className="bi bi-check-circle"></i>
          Completed
          <span className="manevap-tab-badge">{completedAssignments.length}</span>
        </button>
      </div>
 
      {/* Pending Tab */}
      {activeTab === "pending" && (
        <div className="manevap-card">
          {/* Filters */}
          <div className="manevap-filter-section">
            <div className="manevap-filter-group">
              <label className="manevap-filter-label">
                <i className="bi bi-search"></i>
                Search Form Name
              </label>
              <input
                type="text"
                placeholder="Search by form name..."
                value={pendingFormNameFilter}
                onChange={(e) => setPendingFormNameFilter(e.target.value)}
                className="manevap-filter-input"
              />
            </div>
            <div className="manevap-filter-group">
              <label className="manevap-filter-label">
                <i className="bi bi-funnel"></i>
                Filter by Type
              </label>
              <select
                value={pendingTypeFilter}
                onChange={(e) => setPendingTypeFilter(e.target.value)}
                className="manevap-filter-select"
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
 
      {/* Completed Tab */}
      {activeTab === "completed" && (
        <div className="manevap-card">
          {/* Filters */}
          <div className="manevap-filter-section">
            <div className="manevap-filter-group">
              <label className="manevap-filter-label">
                <i className="bi bi-search"></i>
                Search Form Name
              </label>
              <input
                type="text"
                placeholder="Search by form name..."
                value={completedFormNameFilter}
                onChange={(e) => setCompletedFormNameFilter(e.target.value)}
                className="manevap-filter-input"
              />
            </div>
            <div className="manevap-filter-group">
              <label className="manevap-filter-label">
                <i className="bi bi-funnel"></i>
                Filter by Type
              </label>
              <select
                value={completedTypeFilter}
                onChange={(e) => setCompletedTypeFilter(e.target.value)}
                className="manevap-filter-select"
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
 
      {/* Assessment Modal - Simple Professional Form */}
     
     {showModal && currentAssignment && (
  <div className="manevap-modal-overlay" onClick={() => setShowModal(false)}>
    <div className="manevap-modal-content" onClick={(e) => e.stopPropagation()}>
 
      <div className="manevap-form-header-strict">
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <img src={logoImage} alt="EEPZ Logo" className="manevap-modal-logo" />
          <div>
            <div className="manevap-form-logo-label">APPRAISAL FORM</div>
            <div className="manevap-form-title-main">Appraisal Form</div>
            <div className="manevap-form-title-small">{currentAssignment?.formName || ""}</div>
          </div>
        </div>
      </div>
     
      {submitting && modalMode === "view"
        ? <div className="manevap-modal-loading"><div className="spinner-border"></div><p>Loading assessment...</p></div>
        : (
          <>
            <div className="manevap-strict-form-body">
              <table className="manevap-strict-table">
                <thead>
                  <tr>
                    <th>COMPETENCY NAME</th>
                    <th>DESCRIPTION</th>
                    <th>RATING</th>
                    <th>COMMENTS</th>
                  </tr>
                </thead>
                <tbody>
                  {assessmentData.map((item, idx) => (
                    <tr key={item.competencyId || idx}>
                      <td className="manevap-cell-bold">{item.competencyName}</td>
                      <td>{item.competencyDescription || ""}</td>
                      <td>
                        {modalMode === "view" ? (
                          <div className="manevap-modal-cell-view">{item.rating ? `${item.rating} / 5` : '-'}</div>
                        ) : (
                          <select
                            value={item.rating}
                            onChange={e =>
                              updateAssessmentData(item.competencyId, "rating", e.target.value)
                            }
                            className="manevap-modal-cell-input"
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
            <div className="manevap-modal-actions">
              <button
                onClick={() => setShowModal(false)}
                className="manevap-btn-close"
              >Cancel</button>
              {modalMode === "submit" && (
                <button
                  onClick={handleSubmitAssessment}
                  disabled={submitting}
                  className="manevap-btn-submit-form"
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
 
 