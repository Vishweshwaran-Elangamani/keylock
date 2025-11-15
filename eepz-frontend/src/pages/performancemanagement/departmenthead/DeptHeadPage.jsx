/**
 * DeptHeadPage Component
 * 
 * Department Head Dashboard for managing employee performance approvals.
 * Features:
 * - Tab-based view: Pending Approvals vs Approved Employees
 * - Advanced filtering: Search, project, date filters
 * - Real-time statistics dashboard
 * - Approve workflow with expandable details
 * - Auto-refresh every 30 seconds
 * - Pagination with customizable rows per page
 * - Toast notifications using Sonner for user feedback
 * 
 * @component
 */

import React, { useEffect, useState } from "react";
import {
  getDeptHeadSubmittedRatings,
  approveDeptHeadEmployee,
  getApprovedEmployees
} from "../../../services/performancemanagement/hr/api";
import { getEmployeeIdForFilter } from "../../../utils/PerformanceManagement/jwtDecoder";
import { toast } from "sonner";
import "../../../styles/performancemanagement/hr/DeptHeadPage.css";

export default function DeptHeadPage() {
  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Data States
   * - pendingRequests: Pending approval employees
   * - approvedRequests: Approved employees (all pages)
   * - loading: Loading state for initial data fetch
   * - lastUpdated: Timestamp of last data refresh
   */
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Tab State
   * Controls which tab is active: "pending" or "approved"
   */
  const [activeTab, setActiveTab] = useState("pending");

  /**
   * Filter States
   * - searchTerm: Text search across employee/project
   * - filterProject: Filter by project name
   * - filterDate: Filter by specific date
   */
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  /**
   * Pagination States
   * - rowsPerPage: Number of rows to display per page
   * - currentPage: Current active page number
   */
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Modal & Process States
   * - showApproveModal: Controls approve modal visibility
   * - showDetailsModal: Controls details modal visibility
   * - selectedEmployee: Currently selected employee
   * - expandedEmployeeIds: Set of expanded employee detail views in table
   * - approvingEmployeeId: ID of employee being approved
   */
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [expandedEmployeeIds, setExpandedEmployeeIds] = useState(new Set());
  const [approvingEmployeeId, setApprovingEmployeeId] = useState(null);

  // ========================
  // EFFECTS
  // ========================

  /**
   * Effect: Fetch Data & Setup Auto-Refresh
   * Runs when component mounts and when activeTab changes
   * Sets up 30-second interval for auto-refresh
   */
  useEffect(() => {
    fetchData();

    // Setup auto-refresh interval
    const refreshInterval = setInterval(() => {
      fetchData(true); // Silent refresh (no loading toast)
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [activeTab]);

  /**
   * Effect: Apply Filters
   * Runs whenever data or any filter criteria changes
   * Automatically refilters and resets pagination
   */
  useEffect(() => {
    applyFilters();
  }, [pendingRequests, approvedRequests, activeTab, searchTerm, filterProject, filterDate]);

  // ========================
  // API FUNCTIONS
  // ========================

  /**
   * Fetches pending and approved data from backend
   * Shows Sonner toast notifications for user feedback
   * 
   * @param {boolean} silent - If true, skips loading toast (for auto-refresh)
   */
  const fetchData = async (silent = false) => {
    try {
      setLoading(true);
      
      const departmentHeadId = getEmployeeIdForFilter();
      
      if (!departmentHeadId) {
        toast.error("Unable to identify department head. Please login again.");
        console.error("Department Head ID not found");
        return;
      }

      // Show loading toast only if not silent refresh
      if (!silent) {
        toast.loading("Loading employee assessments...");
      }

      // -------- Fetch Pending Approvals --------
      const pendingRes = await getDeptHeadSubmittedRatings(departmentHeadId);
      
      // -------- Fetch All Approved Employees --------
      // Fetch all pages of approved employees
      const approvedRes = await getApprovedEmployees(1, 1000, departmentHeadId); // Large page size to get all

      // -------- Handle Success Response --------
      if (pendingRes.data.success) {
        setPendingRequests(pendingRes.data.data || []);
      }

      if (approvedRes.data.success) {
        setApprovedRequests(approvedRes.data.data || []);
      }

      setLastUpdated(new Date());
      
      if (!silent) {
        toast.dismiss();
        toast.success(`Loaded ${pendingRes.data.data?.length || 0} pending and ${approvedRes.data.data?.length || 0} approved assessments`);
      }
    } catch (err) {
      // -------- Handle Exception --------
      console.error("Error fetching data:", err);
      toast.dismiss();
      toast.error("Failed to load employee assessments");
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // FILTER FUNCTIONS
  // ========================

  /**
   * Applies all active filters to requests
   * Filters by: tab (pending/approved), search term, project, and date
   * Updates filteredData state and resets pagination to page 1
   */
  const applyFilters = () => {
    let filtered = activeTab === "pending" ? [...pendingRequests] : [...approvedRequests];

    // -------- Search Filter --------
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.employeeName?.toLowerCase().includes(search) ||
          emp.projectName?.toLowerCase().includes(search) ||
          emp.employeeCompanyId?.toLowerCase().includes(search)
      );
    }

    // -------- Project Filter --------
    if (filterProject) {
      filtered = filtered.filter((emp) => emp.projectName === filterProject);
    }

    // -------- Date Filter --------
    if (filterDate) {
      filtered = filtered.filter((emp) => {
        const dateToCheck = activeTab === "pending" ? emp.requestedAt : emp.approvedAt;
        if (!dateToCheck) return false;
        const empDate = new Date(dateToCheck);
        const filterDateObj = new Date(filterDate);
        return empDate.toDateString() === filterDateObj.toDateString();
      });
    }

    // Update filtered data and reset pagination
    setFilteredData(filtered);
    setCurrentPage(1);
  };

  // ========================
  // APPROVE HANDLERS
  // ========================

  /**
   * Opens approve modal for selected employee
   */
  const handleApproveClick = (employee) => {
    setSelectedEmployee(employee);
    setShowApproveModal(true);
    toast.info(`Processing approval for ${employee.employeeName}`);
  };

  /**
   * Opens details modal for selected employee
   */
  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  /**
   * Submits the approval
   */
  const handleApproveSubmit = async () => {
    if (!selectedEmployee) return;

    setApprovingEmployeeId(selectedEmployee.employeeId);
    try {
      // Show loading toast
      toast.loading("Approving employee...");

      // -------- API Call --------
      const res = await approveDeptHeadEmployee({
        employeeId: selectedEmployee.employeeId,
        projectId: selectedEmployee.projectId,
        assessmentId: selectedEmployee.assessmentId
      });

      // -------- Handle Success Response --------
      if (res.data.success) {
        toast.dismiss();
        toast.success(`${selectedEmployee.employeeName} approved successfully!`);
        
        // Close modal and reset
        setShowApproveModal(false);
        setSelectedEmployee(null);
        
        // Refresh data (silent refresh)
        fetchData(true);
      }
    } catch (err) {
      console.error("Error approving employee:", err);
      const errorMsg = err.response?.data?.message || "Failed to approve employee";
      toast.dismiss();
      toast.error(errorMsg);
    } finally {
      setApprovingEmployeeId(null);
    }
  };

  /**
   * Closes modals and resets states
   */
  const handleModalClose = () => {
    setShowApproveModal(false);
    setShowDetailsModal(false);
    setSelectedEmployee(null);
  };

  // ========================
  // TABLE EXPAND/COLLAPSE
  // ========================

  /**
   * Toggles detail view for employee in table
   */
  const toggleDetails = (employeeId) => {
    setExpandedEmployeeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  // ========================
  // UI HELPER FUNCTIONS
  // ========================

  /**
   * Calculates average rating for competencies
   */
  const getAvgRating = (competencies, key) => {
    if (!competencies || competencies.length === 0) return "-";
    const vals = competencies
      .filter(c => c[key] != null && c[key] !== -1)
      .map(c => c[key]);
    if (vals.length === 0) return "-";
    const total = vals.reduce((a, b) => a + b, 0);
    return (total / vals.length).toFixed(2);
  };

  /**
   * Calculates average checklist progress
   */
  const getAvgChecklistProgress = (checklists) => {
    if (!checklists || checklists.length === 0) return 0;
    let totalProgress = 0;
    let count = 0;

    checklists.forEach(cl => {
      if (cl.progresses && cl.progresses.length) {
        cl.progresses.forEach(p => {
          count++;
          totalProgress += p.isCompleted ? 100 : 0;
        });
      }
    });

    if (count === 0) return 0;
    return Math.round(totalProgress / count);
  };

  /**
   * Formats ISO date string to readable format
   */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Formats Date object to time string
   */
  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  /**
   * Generates user initials from full name
   */
  const getInitials = (name) => {
    if (!name) return "NA";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  /**
   * Gets unique project names for filter dropdown
   */
  const getUniqueProjects = () => {
    const projects = activeTab === "pending" 
      ? pendingRequests.map(emp => emp.projectName)
      : approvedRequests.map(emp => emp.projectName);
    return [...new Set(projects)].filter(Boolean);
  };

  // ========================
  // PAGINATION FUNCTIONS
  // ========================

  /**
   * Calculates total number of pages based on filtered data
   */
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  /**
   * Returns the slice of data for current page
   */
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  /**
   * Generates array of page numbers for pagination UI
   */
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages;
  };

  // ========================
  // RENDER FUNCTIONS
  // ========================

  /**
   * Renders the Approve Modal
   */
  const renderApproveModal = () => {
    if (!showApproveModal || !selectedEmployee) return null;

    return (
      <>
        <div className="dp-modal-backdrop"></div>
        <div className="dp-modal-wrapper">
          <div className="dp-modal-dialog">
            
            {/* Modal Header */}
            <div className="dp-modal-header dp-modal-header-success">
              <h5 className="dp-modal-title">
                <i className="bi bi-check-circle-fill"></i>
                Approve Employee Assessment
              </h5>
              <button
                type="button"
                className="dp-modal-close-btn"
                onClick={handleModalClose}
                disabled={approvingEmployeeId}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="dp-modal-body">
              
              {/* Employee Details Box */}
              <div className="dp-details-box">
                <h6 className="dp-details-title">
                  <i className="bi bi-person-badge me-2"></i>
                  Employee Information
                </h6>

                <div className="dp-details-grid">
                  
                  <div className="dp-detail-row">
                    <div className="dp-detail-label">Employee Name:</div>
                    <div className="dp-detail-value">
                      <strong>{selectedEmployee.employeeName}</strong>
                    </div>
                  </div>

                  <div className="dp-detail-row">
                    <div className="dp-detail-label">Project:</div>
                    <div className="dp-detail-value">{selectedEmployee.projectName}</div>
                  </div>

                  <div className="dp-detail-row">
                    <div className="dp-detail-label">Avg Employee Rating:</div>
                    <div className="dp-detail-value">
                      <span className="dp-rating-badge emp-rating">
                        {getAvgRating(selectedEmployee.competencies, "employeeRating")}
                      </span>
                    </div>
                  </div>

                  <div className="dp-detail-row">
                    <div className="dp-detail-label">Avg L1 Rating:</div>
                    <div className="dp-detail-value">
                      <span className="dp-rating-badge l1-rating">
                        {getAvgRating(selectedEmployee.competencies, "l1Rating")}
                      </span>
                    </div>
                  </div>

                  <div className="dp-detail-row">
                    <div className="dp-detail-label">Avg L2 Rating:</div>
                    <div className="dp-detail-value">
                      <span className="dp-rating-badge l2-rating">
                        {getAvgRating(selectedEmployee.competencies, "l2Rating")}
                      </span>
                    </div>
                  </div>

                  <div className="dp-detail-row">
                    <div className="dp-detail-label">Goals Assigned:</div>
                    <div className="dp-detail-value">
                      <span className="dp-goals-badge">
                        <i className="bi bi-bullseye"></i>
                        {selectedEmployee.goals?.length || 0} Goals
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Alert */}
              <div className="dp-info-alert">
                <i className="bi bi-info-circle"></i>
                <div>
                  <strong>Note:</strong> Approving this assessment will finalize the performance review process.
                  The employee will be notified via system notification.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="dp-modal-footer">
              <button
                type="button"
                className="dp-btn-cancel"
                onClick={handleModalClose}
                disabled={approvingEmployeeId}
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button
                type="button"
                className="dp-btn-submit dp-btn-success"
                onClick={handleApproveSubmit}
                disabled={approvingEmployeeId}
              >
                {approvingEmployeeId ? (
                  <>
                    <span className="dp-spinner"></span>
                    Approving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Approve Assessment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  /**
   * Renders the Details Modal
   */
  const renderDetailsModal = () => {
    if (!showDetailsModal || !selectedEmployee) return null;

    return (
      <>
        <div className="dp-modal-backdrop"></div>
        <div className="dp-modal-wrapper dp-modal-large">
          <div className="dp-modal-dialog">
            
            {/* Modal Header */}
            <div className="dp-modal-header dp-modal-header-primary">
              <h5 className="dp-modal-title">
                <i className="bi bi-file-text-fill"></i>
                Employee Assessment Details
              </h5>
              <button
                type="button"
                className="dp-modal-close-btn"
                onClick={handleModalClose}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="dp-modal-body">
              {renderEmployeeDetails(selectedEmployee)}
            </div>

            {/* Modal Footer */}
            <div className="dp-modal-footer">
              <button
                type="button"
                className="dp-btn-cancel"
                onClick={handleModalClose}
              >
                <i className="bi bi-x-circle"></i>
                Close
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  /**
   * Renders detailed employee information (competencies & goals)
   */
  function renderEmployeeDetails(emp) {
    return (
      <>
        {/* Competencies Section */}
        <div className="dp-detail-section">
          <h4 className="dp-detail-section-title">
            <i className="bi bi-graph-up"></i>
            Competencies
          </h4>
          <div className="dp-inner-table-wrapper">
            <table className="dp-inner-table">
              <thead>
                <tr>
                  <th>Competency</th>
                  <th>Emp Rating</th>
                  <th>Emp Comments</th>
                  <th>L1 Reviewer</th>
                  <th>L1 Rating</th>
                  <th>L1 Comments</th>
                  <th>L2 Reviewer</th>
                  <th>L2 Rating</th>
                  <th>L2 Comments</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {emp.competencies && emp.competencies.length > 0 ? (
                  emp.competencies.map((c, idx) => (
                    <tr key={idx}>
                      <td>{c.competencyName}</td>
                      <td>
                        <strong className="emp-rating">
                          {c.employeeRating || "-"}
                        </strong>
                      </td>
                      <td>{c.employeeComments || "-"}</td>
                      <td>{c.l1ReviewerName || "No L1"}</td>
                      <td>
                        <strong className="l1-rating">
                          {c.l1Rating || "-"}
                        </strong>
                      </td>
                      <td>{c.l1Comments || "-"}</td>
                      <td>{c.l2ReviewerName || "No L2"}</td>
                      <td>
                        <strong className="l2-rating">
                          {c.l2Rating || "-"}
                        </strong>
                      </td>
                      <td>{c.l2Comments || "-"}</td>
                      <td>
                        <span className={`dp-status-badge status-${c.status?.toLowerCase()}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="dp-no-data">
                      No competencies found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Goals Section */}
        <div className="dp-detail-section">
          <h4 className="dp-detail-section-title">
            <i className="bi bi-bullseye"></i>
            Goals
          </h4>
          {emp.goals && emp.goals.length === 0 ? (
            <p className="dp-no-data">No goals assigned.</p>
          ) : (
            emp.goals?.map((goal) => {
              const avgProgress = getAvgChecklistProgress(goal.goalChecklists);

              return (
                <div key={goal.goalId} className="dp-goal-card">
                  <div className="dp-goal-header">
                    <div>
                      <h5 className="dp-goal-title">{goal.goalTitle}</h5>
                      <p className="dp-goal-description">{goal.goalDescription}</p>
                    </div>
                    <span className={`dp-goal-status-badge status-${goal.goalstatus?.toLowerCase()}`}>
                      {goal.goalstatus}
                    </span>
                  </div>

                  <div className="dp-progress-container">
                    <div className="dp-progress-label">
                      <span>Progress</span>
                      <span className="dp-progress-value">{avgProgress}%</span>
                    </div>
                    <div className="dp-progress-bar-bg">
                      <div 
                        className="dp-progress-bar-fill" 
                        style={{ width: `${avgProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </>
    );
  }

  // ========================
  // MAIN RENDER - LOADING STATE
  // ========================

  if (loading) {
    return (
      <div className="dp-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // ========================
  // MAIN RENDER - PAGE CONTENT
  // ========================

  return (
    <div className="dp-page">
      
      {/* Breadcrumb Navigation */}
      <nav className="dp-breadcrumb-nav" aria-label="breadcrumb">
        <ol className="dp-breadcrumb">
          <li className="dp-breadcrumb-item">
            <i className="bi bi-house-door"></i>
            <span>Dashboard</span>
          </li>
          <li className="dp-breadcrumb-item active" aria-current="page">
            Department Head Dashboard
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="dp-page-header">
        <div className="dp-header-content">
          <div className="dp-header-text">
            <h2 className="dp-page-title">Department Head Dashboard</h2>
            <p className="dp-page-description">
              Review and approve employee performance assessments and track completed reviews
            </p>
          </div>
        </div>
        <div className="dp-header-actions">
          {lastUpdated && (
            <span className="dp-last-updated-text">
              <i className="bi bi-clock-history"></i>
              Last updated: {formatTime(lastUpdated)}
            </span>
          )}
          <button className="dp-btn-refresh" onClick={() => fetchData()}>
            <i className="bi bi-arrow-clockwise"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs (Pending vs Approved) */}
      <div className="dp-tabs">
        <button
          className={`dp-tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <i className="bi bi-hourglass-split me-2"></i>
          Pending Approvals
          {pendingRequests.length > 0 && (
            <span className="badge bg-warning ms-2">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          className={`dp-tab-btn ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          <i className="bi bi-check-circle me-2"></i>
          Approved Employees
        </button>
      </div>

      {/* Filters Section */}
      <div className="dp-filters-card">
        <div className="dp-filters-content">
          <div className="dp-filters-left">
            
            {/* Search Box */}
            <div className="dp-search-box">
              <i className="bi bi-search dp-search-icon"></i>
              <input
                type="text"
                className="dp-search-input"
                placeholder="Search employee or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Project Filter */}
            <select
              className="dp-filter-select"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="">All Projects</option>
              {getUniqueProjects().map((project, idx) => (
                <option key={idx} value={project}>{project}</option>
              ))}
            </select>

            {/* Date Filter */}
            <input
              type="date"
              className="dp-filter-date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="dp-stats-grid">
        
        {/* Total Pending */}
        <div className="dp-stat-card">
          <div className="dp-stat-icon dp-stat-icon-warning">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="dp-stat-content">
            <h3 className="dp-stat-value">{pendingRequests.length}</h3>
            <p className="dp-stat-label">Pending Approvals</p>
          </div>
        </div>

        {/* Total Approved */}
        <div className="dp-stat-card">
          <div className="dp-stat-icon dp-stat-icon-success">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="dp-stat-content">
            <h3 className="dp-stat-value">{approvedRequests.length}</h3>
            <p className="dp-stat-label">Approved Employees</p>
          </div>
        </div>

        {/* Avg L2 Rating (Pending) */}
        <div className="dp-stat-card">
          <div className="dp-stat-icon dp-stat-icon-primary">
            <i className="bi bi-star-fill"></i>
          </div>
          <div className="dp-stat-content">
            <h3 className="dp-stat-value">
              {(() => {
                let total = 0;
                let count = 0;
                pendingRequests.forEach(emp => {
                  const avg = getAvgRating(emp.competencies, "l2Rating");
                  if (avg !== "-") {
                    total += parseFloat(avg);
                    count++;
                  }
                });
                return count > 0 ? (total / count).toFixed(1) : "0";
              })()}
            </h3>
            <p className="dp-stat-label">Avg L2 Rating</p>
          </div>
        </div>

        {/* Total Goals */}
        <div className="dp-stat-card">
          <div className="dp-stat-icon dp-stat-icon-danger">
            <i className="bi bi-bullseye"></i>
          </div>
          <div className="dp-stat-content">
            <h3 className="dp-stat-value">
              {pendingRequests.reduce((sum, emp) => sum + (emp.goals?.length || 0), 0)}
            </h3>
            <p className="dp-stat-label">Total Goals</p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="dp-table-card">
        <div className="dp-table-wrapper">
          <table className="dp-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Project</th>
                <th>Avg Emp Rating</th>
                <th>Avg L1 Rating</th>
                <th>Avg L2 Rating</th>
                <th>Goals</th>
                {activeTab === "approved" && <th>Approved At</th>}
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedData().length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "approved" ? "8" : "7"} className="dp-empty-state">
                    <i className="bi bi-inbox"></i>
                    <p>No {activeTab === "pending" ? "pending approvals" : "approved employees"} found</p>
                  </td>
                </tr>
              ) : (
                getPaginatedData().map((emp) => (
                  <React.Fragment key={emp.employeeId || emp.approvalId}>
                    <tr>
                      {/* Employee Info */}
                      <td>
                        <div className="dp-user-info">
                          <div className="dp-user-avatar">{getInitials(emp.employeeName)}</div>
                          <div>
                            <span className="dp-user-name">{emp.employeeName}</span>
                            <small className="dp-user-id">@{emp.employeeCompanyId}</small>
                          </div>
                        </div>
                      </td>
                      
                      {/* Project */}
                      <td>{emp.projectName}</td>
                      
                      {/* Avg Emp Rating */}
                      <td>
                        <span className="dp-rating-badge emp-rating">
                          {getAvgRating(emp.competencies, "employeeRating")}
                        </span>
                      </td>
                      
                      {/* Avg L1 Rating */}
                      <td>
                        <span className="dp-rating-badge l1-rating">
                          {getAvgRating(emp.competencies, "l1Rating")}
                        </span>
                      </td>
                      
                      {/* Avg L2 Rating */}
                      <td>
                        <span className="dp-rating-badge l2-rating">
                          {getAvgRating(emp.competencies, "l2Rating")}
                        </span>
                      </td>
                      
                      {/* Goals */}
                      <td>
                        <span className="dp-goals-badge">
                          <i className="bi bi-bullseye"></i>
                          {emp.goals?.length || 0}
                        </span>
                      </td>
                      
                      {/* Approved At (only in approved tab) */}
                      {activeTab === "approved" && (
                        <td className="text-muted">{formatDate(emp.approvedAt)}</td>
                      )}
                      
                      {/* Actions */}
                      <td>
                        <div className="dp-action-buttons">
                          {activeTab === "pending" ? (
                            <>
                              <button
                                className="dp-action-btn dp-action-btn-view"
                                onClick={() => handleViewDetails(emp)}
                                title="View Details"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button
                                className="dp-action-btn dp-action-btn-approve"
                                onClick={() => handleApproveClick(emp)}
                                title="Approve"
                              >
                                <i className="bi bi-check-circle"></i>
                              </button>
                            </>
                          ) : (
                            <button
                              className="dp-action-btn dp-action-btn-view"
                              onClick={() => handleViewDetails(emp)}
                              title="View Details"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="dp-pagination-container">
            
            {/* Rows Per Page Selector */}
            <div className="dp-pagination-info">
              <span className="dp-pagination-label">Show</span>
              <select
                className="dp-pagination-select"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span className="dp-pagination-label">entries</span>
            </div>

            {/* Pagination Status */}
            <div className="dp-pagination-status">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredData.length)} of{" "}
              {filteredData.length} entries
            </div>

            {/* Pagination Navigation */}
            <nav className="dp-pagination-nav">
              <ul className="dp-pagination">
                <li className={`dp-page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="dp-page-link"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>

                {getPageNumbers().map((page, index) => (
                  <li
                    key={index}
                    className={`dp-page-item ${
                      page === currentPage ? "active" : ""
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
                      className="dp-page-link"
                      onClick={() => typeof page === "number" && setCurrentPage(page)}
                      disabled={typeof page !== "number"}
                    >
                      {page}
                    </button>
                  </li>
                ))}

                <li className={`dp-page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button
                    className="dp-page-link"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* Modals */}
      {renderApproveModal()}
      {renderDetailsModal()}
    </div>
  );
}
