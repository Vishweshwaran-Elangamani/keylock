import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  getEmployeeAssignments,
  submitSelfAssessment,
  viewSelfAssessment,
} from "../../../services/performancemanagement/api/api";
import { getUserRole } from "../../../services/performancemanagement/api/rolesapi";
import { toast, Toaster } from "sonner";
import logoImage from "../../../assets/logodark.png";
import Breadcrumb from "../../../components/common/Breadcrumb";
import "../../../styles/performancemanagement/manager/ManagerPerformanceDashboard.css";

const PaginationDropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="custom-mgr-pagination-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="custom-mgr-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {value}
        <span className="custom-mgr-arrow" />
      </div>

      {open && (
        <div className="custom-mgr-menu">
          {options.map((opt) => (
            <div
              key={opt}
              className={
                "custom-mgr-option" +
                (opt === value ? " custom-mgr-option-active" : "")
              }
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RatingDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const dropdownRef = useRef(null);

  const options = [
    { value: "", label: "-" },
    { value: "1", label: "1 - Poor" },
    { value: "2", label: "2 - Fair" },
    { value: "3", label: "3 - Good" },
    { value: "4", label: "4 - Very Good" },
    { value: "5", label: "5 - Excellent" },
  ];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || "-";

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!open && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 2,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      const menu = document.querySelector(".custom-modal-rating-menu");
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        menu &&
        !menu.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <>
      <div
        ref={dropdownRef}
        className="custom-modal-rating-dropdown"
        tabIndex={0}
      >
        <div className="custom-modal-rating-selected" onClick={handleToggle}>
          {selectedLabel}
          <span className="custom-modal-rating-arrow" />
        </div>
      </div>

      {open &&
        ReactDOM.createPortal(
          <div
            className="custom-modal-rating-menu"
            style={{
              position: "fixed",
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
              zIndex: 999999,
            }}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                className={
                  "custom-modal-rating-option" +
                  (opt.value === value
                    ? " custom-modal-rating-option-active"
                    : "")
                }
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(opt.value);
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};

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

  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPerPage, setPendingPerPage] = useState(5);
  const [completedPage, setCompletedPage] = useState(1);
  const [completedPerPage, setCompletedPerPage] = useState(5);

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
  const [completedFormNameInput, setCompletedFormNameInput] = useState("");
  const [completedFormNameFilter, setCompletedFormNameFilter] = useState("");

  useEffect(() => {
    if (userId) {
      fetchAssignments();
    }
  }, [userId]);

  const fetchAssignments = async () => {
    if (!userId) {
      safeToast(
        "error",
        "Unable to load manager ID. Please login again.",
        "no-manager-id"
      );
      return;
    }

    setLoading(true);
    setAssignments([]);
    try {
      const roleResponse = await getUserRole(userId);
      if (!roleResponse.data.success) {
        safeToast("error", "User not found.", "user-not-found");
        return;
      }
      const userRole = roleResponse.data.data;
      if (!userRole.isManager) {
        safeToast("error", "This user is not a Manager.", "not-manager");
        return;
      }
      const assignmentRes = await getEmployeeAssignments(userId);
      if (assignmentRes.data.success) {
        setAssignments(assignmentRes.data.data);
        const pending = assignmentRes.data.data.filter(
          (a) => !a.isCompleted
        ).length;
        const completed = assignmentRes.data.data.filter(
          (a) => a.isCompleted
        ).length;
        safeToast(
          "success",
          `Found ${pending} pending and ${completed} completed assessments.`,
          "found-assignments"
        );
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
      safeToast(
        "warning",
        "Please provide ratings for all competencies.",
        "incomplete-ratings"
      );
      return;
    }

    const incompleteComments = assessmentData.filter(
      (item) => !item.comments || item.comments.trim() === ""
    );
    if (incompleteComments.length > 0) {
      safeToast(
        "warning",
        "Please provide comments for all competencies.",
        "incomplete-comments"
      );
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
      const response = await submitSelfAssessment(payload);
      if (response.data?.success) {
        toast.success("Form submitted successfully!");
        setShowModal(false);
        await fetchAssignments();
      } else {
        safeToast(
          "error",
          response.data?.message || "Failed.",
          "submit-failed"
        );
      }
    } catch (error) {
      safeToast(
        "error",
        error.response?.data?.message || "Failed.",
        "submit-error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewCompleted = async (assignment) => {
    setCurrentAssignment(assignment);
    setModalMode("view");
    setSubmitting(true);
    try {
      const { data } = await viewSelfAssessment(assignment.formId, userId);
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
        safeToast(
          "info",
          "Assessment loaded successfully",
          "assessment-loaded"
        );
      } else {
        safeToast(
          "error",
          "Failed to load submitted assessment.",
          "assessment-load-failed"
        );
      }
    } catch (error) {
      console.error("View error:", error);
      safeToast(
        "error",
        "Error loading assessment: " +
          (error.response?.data?.message || error.message),
        "assessment-load-error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const pendingAssignments = assignments
    .filter((a) => !a.isCompleted)
    .filter((a) =>
      a.formName.toLowerCase().includes(pendingFormNameFilter.toLowerCase())
    );

  const completedAssignments = assignments
    .filter((a) => a.isCompleted)
    .filter((a) =>
      a.formName.toLowerCase().includes(completedFormNameFilter.toLowerCase())
    );

  const pendingTotalPages = Math.ceil(
    pendingAssignments.length / pendingPerPage
  );
  const pagedPendingAssignments = pendingAssignments.slice(
    (pendingPage - 1) * pendingPerPage,
    pendingPage * pendingPerPage
  );

  const completedTotalPages = Math.ceil(
    completedAssignments.length / completedPerPage
  );
  const pagedCompletedAssignments = completedAssignments.slice(
    (completedPage - 1) * completedPerPage,
    completedPage * completedPerPage
  );

  const handlePendingPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pendingTotalPages) {
      setPendingPage(newPage);
    }
  };

  const handleCompletedPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= completedTotalPages) {
      setCompletedPage(newPage);
    }
  };

  const renderTable = (data, isCompleted) => {
    const isPending = !isCompleted;
    const currentPage = isPending ? pendingPage : completedPage;
    const totalPages = isPending ? pendingTotalPages : completedTotalPages;
    const perPage = isPending ? pendingPerPage : completedPerPage;
    const totalItems = isPending
      ? pendingAssignments.length
      : completedAssignments.length;
    const onPageChange = isPending
      ? handlePendingPageChange
      : handleCompletedPageChange;
    const setPerPage = isPending ? setPendingPerPage : setCompletedPerPage;
    const setPage = isPending ? setPendingPage : setCompletedPage;

    return (
      <>
        <div className="manevap-table-container">
          <table className="manevap-table">
            <thead>
              <tr>
                <th>Form Name</th>
                <th>Type</th>
                <th>Assigned</th>
                <th>Deadline</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((assignment) => (
                <tr key={assignment.assignmentId}>
                  <td>
                    <strong>{assignment.formName}</strong>
                  </td>
                  <td>
                    <span
                      className={`manevap-badge ${
                        isCompleted ? "success" : "info"
                      }`}
                    >
                      <i
                        className={`bi ${
                          isCompleted
                            ? "bi-check-circle-fill"
                            : "bi-bookmark-fill"
                        }`}
                      ></i>
                      {assignment.formType}
                    </span>
                  </td>
                  <td>
                    {new Date(assignment.assignedAt).toLocaleDateString()}
                  </td>
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
                          const initialData =
                            assignment.competencies?.map((comp) => ({
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
                        Submit
                      </button>
                    ) : (
                      <button
                        className="manevap-btn manevap-btn-view"
                        onClick={() => handleViewCompleted(assignment)}
                      >
                        <i className="bi bi-eye-fill"></i> View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="manevap-pagination-container">
          <div className="manevap-pagination-info">
            <span className="manevap-pagination-label">Rows per page:</span>
            <PaginationDropdown
              value={perPage}
              onChange={(val) => {
                setPerPage(Number(val));
                setPage(1);
              }}
              options={[5, 10, 15, 20]}
            />
          </div>

          <nav className="manevap-pagination-nav">
            <ul className="manevap-pagination">
              <li
                className={`manevap-page-item ${
                  currentPage === 1 ? "manevap-disabled" : ""
                }`}
              >
                <button
                  className="manevap-page-link"
                  onClick={() => onPageChange(currentPage - 1)}
                >
                  &laquo;
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => (
                <li
                  key={i + 1}
                  className={`manevap-page-item ${
                    currentPage === i + 1 ? "manevap-active" : ""
                  }`}
                >
                  <button
                    className="manevap-page-link"
                    onClick={() => onPageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              <li
                className={`manevap-page-item ${
                  currentPage === totalPages ? "manevap-disabled" : ""
                }`}
              >
                <button
                  className="manevap-page-link"
                  onClick={() => onPageChange(currentPage + 1)}
                >
                  &raquo;
                </button>
              </li>
            </ul>
          </nav>

          <div className="manevap-pagination-status">
            {totalItems === 0
              ? "No items to display"
              : `Showing ${Math.min(
                  (currentPage - 1) * perPage + 1,
                  totalItems
                )}-${Math.min(
                  currentPage * perPage,
                  totalItems
                )} of ${totalItems} items`}
          </div>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="manevap-container">
        <Toaster position="top-right" />
        <div className="toaster-wrapper">
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
      <div className="toaster-wrapper">
        <Toaster position="top-right" />
      </div>
      <div className="hrfcper-top-bar">
        <div className="breadcrumb-wrapper">
          <Breadcrumb
            items={[
              {
                label: "Performance Management",
                path: "/manager/dashboard/performance",
              },
              { label: "Manager Form" },
            ]}
          />
        </div>
      </div>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
      />

      <div
        className="mgrdash-pill-toggle"
        role="tablist"
        aria-label="Assignments"
      >
        <button
          className={`mgrdash-pill-tab ${
            activeTab === "pending" ? "active" : ""
          }`}
          onClick={() => setActiveTab("pending")}
          type="button"
          aria-selected={activeTab === "pending"}
        >
          Pending{" "}
          <span className="mgrdash-pill-count">
            {pendingAssignments.length}
          </span>
        </button>
        <button
          className={`mgrdash-pill-tab ${
            activeTab === "completed" ? "active" : ""
          }`}
          onClick={() => setActiveTab("completed")}
          type="button"
          aria-selected={activeTab === "completed"}
        >
          Completed{" "}
          <span className="mgrdash-pill-count">
            {completedAssignments.length}
          </span>
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="manevap-card">
          <div className="manevap-filter-section">
            <div className="manevap-filter-group">
              <div className="unified-search-wrapper">
                <input
                  type="text"
                  placeholder="Search by form name..."
                  value={pendingFormNameInput}
                  onChange={(e) => setPendingFormNameInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      setPendingFormNameFilter(pendingFormNameInput);
                    }
                  }}
                  className="manevap-filter-input"
                />
                <button
                  className="manevap-btn-primary"
                  onClick={() => setPendingFormNameFilter(pendingFormNameInput)}
                  type="button"
                >
                  Search
                </button>
              </div>
              <button
                onClick={() => {
                  setPendingFormNameInput("");
                  setPendingFormNameFilter("");
                }}
                className="manevap-clear-btn"
                disabled={!pendingFormNameFilter}
                style={{
                  opacity: pendingFormNameFilter ? 1 : 0.6,
                  cursor: pendingFormNameFilter ? "pointer" : "not-allowed",
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
          {pendingAssignments.length === 0 ? (
            <div className="manevap-empty-state">
              <i className="bi bi-inbox"></i>
              <h3>
                {pendingFormNameFilter
                  ? "No Matching Assessments"
                  : "No Pending Assessments"}
              </h3>
              <p>
                {pendingFormNameFilter
                  ? "Try adjusting your filters"
                  : "All assessments have been completed!"}
              </p>
            </div>
          ) : (
            renderTable(pagedPendingAssignments, false)
          )}
        </div>
      )}

      {activeTab === "completed" && (
        <div className="manevap-card">
          <div className="manevap-filter-section">
            <div className="manevap-filter-group">
              <div className="unified-search-wrapper">
                <input
                  type="text"
                  placeholder="Search by form name..."
                  value={completedFormNameInput}
                  onChange={(e) => setCompletedFormNameInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      setCompletedFormNameFilter(completedFormNameInput);
                    }
                  }}
                  className="manevap-filter-input"
                />
                <button
                  className="manevap-btn-primary"
                  onClick={() =>
                    setCompletedFormNameFilter(completedFormNameInput)
                  }
                  type="button"
                >
                  Search
                </button>
              </div>
              <button
                onClick={() => {
                  setCompletedFormNameInput("");
                  setCompletedFormNameFilter("");
                }}
                className="manevap-clear-btn"
                disabled={!completedFormNameFilter}
                style={{
                  opacity: completedFormNameFilter ? 1 : 0.6,
                  cursor: completedFormNameFilter ? "pointer" : "not-allowed",
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
          {completedAssignments.length === 0 ? (
            <div className="manevap-empty-state">
              <i className="bi bi-clipboard-check"></i>
              <h3>
                {completedFormNameFilter
                  ? "No Matching Assessments"
                  : "No Completed Assessments"}
              </h3>
              <p>
                {completedFormNameFilter
                  ? "Try adjusting your filters"
                  : "Complete your pending assessments to see them here."}
              </p>
            </div>
          ) : (
            renderTable(pagedCompletedAssignments, true)
          )}
        </div>
      )}

      {showModal && currentAssignment && (
        <div
          className="manevap-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="manevap-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="manevap-form-header-strict">
              <div className="manevap-header-inner">
                <div className="manevap-logo-section">
                  <img
                    src={logoImage}
                    alt="EEPZ Logo"
                    className="manevap-modal-logo"
                  />
                  <div className="manevap-logo-subtitle">MANAGER FORM</div>
                </div>

                <div className="manevap-title-section">
                  <div className="manevap-title-main">MANAGER FORM</div>
                  <div className="manevap-title-sub">
                    {currentAssignment?.formName || ""}
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="manevap-close-btn"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
            </div>

            {submitting && modalMode === "view" ? (
              <div className="manevap-modal-loading">
                <div className="spinner-border"></div>
                <p>Loading assessment...</p>
              </div>
            ) : (
              <>
                <div className="manevap-strict-form-body">
                  <div className="manevap-strict-form-wrapper">
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
                            <td className="manevap-cell-bold">
                              {item.competencyName}
                            </td>
                            <td>{item.competencyDescription || ""}</td>
                            <td>
                              {modalMode === "view" ? (
                                <div className="manevap-modal-cell-view">
                                  {item.rating ? `${item.rating} / 5` : "-"}
                                </div>
                              ) : (
                                <RatingDropdown
                                  value={item.rating || ""}
                                  onChange={(val) =>
                                    updateAssessmentData(
                                      item.competencyId,
                                      "rating",
                                      val
                                    )
                                  }
                                />
                              )}
                            </td>
                            <td>
  {modalMode === "view" ? (
    <div className="manevap-modal-cell-view-comment">
      {item.comments || "-"}
    </div>
  ) : (
    <textarea
      className="manevap-modal-cell-textarea"
      value={item.comments}
      onChange={(e) =>
        updateAssessmentData(
          item.competencyId,
          "comments",
          e.target.value
        )
      }
      placeholder="Enter your comments here..."
      rows="3"
    />
  )}
</td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="manevap-modal-actions">
                  <button
                    onClick={() => setShowModal(false)}
                    className="manevap-btn-close"
                  >
                    Cancel
                  </button>
                  {modalMode === "submit" && (
                    <button
                      onClick={handleSubmitAssessment}
                      disabled={submitting}
                      className={`manevap-btn-submit-form ${
                        submitting ? "disabled" : ""
                      }`}
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
