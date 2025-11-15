import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import api from "../../../services/performancemanagement/hr/api";
import logoImage from "../../../assets/explogodark.png";
import "../../../styles/performancemanagement/hr/MyAssessments.css";

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


function UserAssignments() {
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

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/AppraisalProcess/employee/${userId}`);
      if (data.success) {
        setAssignments(data.data || []);
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

  const renderTable = (data) => (
    <div className="table-container">
      <table className="table">
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
                  <strong>{assignment.formName}</strong>
                </td>
                <td>
                  <span className="badge">{assignment.formType}</span>
                </td>
                <td>{new Date(assignment.deadline || new Date()).toLocaleDateString()}</td>
                <td>
                  <span className={assignment.isCompleted ? "badge-success" : "badge-pending"}>
                    {assignment.isCompleted ? "Completed" : "Pending"}
                  </span>
                </td>
                <td>
                  {!assignment.isCompleted ? (
                    <button className="btn btn-submit" onClick={() => openSubmitModal(assignment)}>
                      Submit
                    </button>
                  ) : (
                    <button className="btn btn-view" onClick={() => openViewModal(assignment)}>
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

  if (loading) {
    return (
      <div className="my-assessments-container">
        <Toaster position="top-right" richColors />
        <div style={{ textAlign: "center", padding: "60px" }}>
          <div className="spinner-border"></div>
          <p style={{ marginTop: "16px", color: "var(--text-light)" }}>
            Loading assessments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-assessments-container">
      <Toaster position="top-right" richColors />

     

      {/* Header Section */}
      <div className="header-section">
        <div className="header-content">
          <h2>
            <i className="bi bi-file-earmark-check"></i>
            My Performance Assessments
          </h2>
          <p>View and complete your assigned performance evaluations</p>
        </div>
        {showModal && currentAssignment && timers[currentAssignment.assignmentId] && (
          <div className="timer-container">
            <div className="timer-label">Time Remaining</div>
            <div className="timer-display">
              {timers[currentAssignment.assignmentId].days > 0
                ? `${timers[currentAssignment.assignmentId].days} days`
                : "Expired"}
            </div>
            <div className="timer-subtext">
              Deadline: {new Date(currentAssignment.deadline).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

       {/* TIMER BARS - ALWAYS VISIBLE FOR ALL PENDING FORMS */}
      {visibleTimers.length > 0 && (
        <div className="timer-bars-container">
          {visibleTimers.map((timer) => (
            <div key={timer.id} className={`timer-bar ${timer.isExpired ? 'expired' : ''}`}>
              <div className="timer-bar-content">
                <span className="timer-bar-label"> {timer.formName}</span>
                <span className="timer-bar-time">
                  ⏱ {timer.days > 0 ? `${timer.days} days left` : "Expired"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filter */}
      <div className="search-filter-container">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={formTypeFilter}
          onChange={(e) => setFormTypeFilter(e.target.value)}
        >
          {formTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="filter-select"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      {/* Tab Navigation */}
      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Assessments ({filteredPending.length})
        </button>
        <button
          className={`tab-button ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed Assessments ({filteredCompleted.length})
        </button>
      </div>

      {/* Content */}
      <div className="card">
        {activeTab === "pending" && (
          <>
            {filteredPending.length > 0 ? (
              renderTable(filteredPending)
            ) : (
              <div className="empty-state">
                <h3 className="empty-title">No Pending Assessments</h3>
                <p className="empty-text">
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
              <div className="empty-state">
                <h3 className="empty-title">No Completed Assessments</h3>
                <p className="empty-text">
                  Complete your pending assessments to see them here.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
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

export default UserAssignments;
