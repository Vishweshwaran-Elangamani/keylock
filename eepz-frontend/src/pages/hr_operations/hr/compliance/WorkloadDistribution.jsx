import React, { useState, useEffect } from "react";
import { Toast } from "bootstrap";
import workloadService from "../../../../services/hr_operations/hr/workloadService";
import "../../../../styles/hr_operations/hr/workload.css";

const WorkloadDistribution = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View & Pagination States
  const [viewType, setViewType] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter States
  const [filters, setFilters] = useState({
    search: "",
    fairness: "all",
    department: "",
    manager: "",
  });

  // Filter Options
  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    managers: [],
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [projects, filters]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching all projects...");
      const response = await workloadService.getAllProjects();
      console.log("Projects received:", response);
      const data = response.data || [];
      setProjects(data);
      setFilteredProjects(data);
      generateFilterOptions(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.message || "Failed to fetch projects");
      showToast("Error", err.message || "Failed to fetch projects", "danger");
    } finally {
      setLoading(false);
    }
  };

  const generateFilterOptions = (data) => {
    const departments = [
      ...new Set(data.map((p) => p.teamName).filter(Boolean)),
    ].sort();
    const managers = [
      ...new Set(data.map((p) => p.reportingManagerName).filter(Boolean)),
    ].sort();

    setFilterOptions({
      departments,
      managers,
    });
  };

  const calculateFairness = (project) => {
    if (!project.workloadVariance && project.workloadVariance !== 0) {
      return "neutral";
    }

    const variance = parseFloat(project.workloadVariance);

    if (variance > 30) return "low";
    if (variance > 15) return "medium";
    return "high";
  };

  const applyFilters = () => {
    let filtered = projects;

    // Search filter
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter((p) => {
        const projectName = (p.teamName || "").toLowerCase();
        const managerName = (p.reportingManagerName || "").toLowerCase();
        return projectName.includes(query) || managerName.includes(query);
      });
    }

    // Fairness filter
    if (filters.fairness !== "all") {
      filtered = filtered.filter(
        (p) => calculateFairness(p) === filters.fairness
      );
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter((p) => p.teamName === filters.department);
    }

    // Manager filter
    if (filters.manager) {
      filtered = filtered.filter(
        (p) => p.reportingManagerName === filters.manager
      );
    }

    setFilteredProjects(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearchChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      search: e.target.value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      fairness: "all",
      department: "",
      manager: "",
    });
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredProjects.slice(startIndex, endIndex);

  const showToast = (title, message, type) => {
    const toastElement = document.getElementById("workloadToast");
    if (!toastElement) return;

    const toastTitle = document.getElementById("workloadToastTitle");
    const toastBody = document.getElementById("workloadToastBody");
    const toastHeader = toastElement.querySelector(".toast-header");

    if (toastTitle) toastTitle.textContent = title;
    if (toastBody) toastBody.textContent = message;
    if (toastHeader)
      toastHeader.className = `toast-header bg-${type} text-white`;

    const toast = new Toast(toastElement);
    toast.show();
  };

  const getFairnessStyle = (fairness) => {
    const styles = {
      high: {
        background: "#dcfce7",
        color: "#166534",
        icon: "bi-check-circle-fill",
      },
      medium: {
        background: "#fef3c7",
        color: "#92400e",
        icon: "bi-minus-circle-fill",
      },
      low: {
        background: "#fee2e2",
        color: "#991b1b",
        icon: "bi-exclamation-circle-fill",
      },
      neutral: {
        background: "#e5e7eb",
        color: "#374151",
        icon: "bi-question-circle-fill",
      },
    };
    return styles[fairness] || styles.neutral;
  };

  const getProgressColor = (fairness) => {
    const colors = {
      high: "#10b981",
      medium: "#f59e0b",
      low: "#ef4444",
      neutral: "#6b7280",
    };
    return colors[fairness] || colors.neutral;
  };

  return (
    <div className="workload-root">
      {error && (
        <div className="alert alert-danger workload-alert" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {/* HEADER */}
      <div className="workload-header">
        <div className="workload-header-left">
          <h4 className="workload-title">
            <i className="bi bi-briefcase"></i>
            Team Work Distribution Analysis
          </h4>
          <p className="workload-subtitle">
            Monitor workload fairness across teams to avoid favoritism
          </p>
        </div>
      </div>

      {/* FILTER BAR WITH TOGGLES */}
      <div className="workload-filters-container">
        <div className="filters-header">
          <h5 className="filters-title">
            <i className="bi bi-funnel"></i>
            Filters
          </h5>
          <div className="filters-right-section">
            {/* VIEW TOGGLE BUTTONS */}
            <div className="workload-view-toggle">
              <button
                className={`toggle-btn ${viewType === "card" ? "active" : ""}`}
                onClick={() => setViewType("card")}
                title="Card View"
              >
                <i className="bi bi-grid-3x2-gap"></i>
              </button>
              <button
                className={`toggle-btn ${viewType === "table" ? "active" : ""}`}
                onClick={() => setViewType("table")}
                title="Table View"
              >
                <i className="bi bi-list-ul"></i>
              </button>
            </div>

            {/* CLEAR BUTTON */}
            <button className="btn-clear-filters" onClick={clearFilters}>
              <i className="bi bi-x-circle"></i> Clear
            </button>
          </div>
        </div>

        <div className="filters-grid">
          {/* SEARCH */}
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <div className="search-wrapper">
              <i className="bi bi-search"></i>
              <input
                type="text"
                name="search"
                placeholder="Search by team or manager..."
                value={filters.search}
                onChange={handleSearchChange}
                className="filter-search"
              />
            </div>
          </div>

          {/* FAIRNESS FILTER */}
          <div className="filter-group">
            <label className="filter-label">Fairness Status</label>
            <select
              name="fairness"
              value={filters.fairness}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="high">High Fairness</option>
              <option value="medium">Medium Fairness</option>
              <option value="low">Low Fairness</option>
            </select>
          </div>

          {/* DEPARTMENT FILTER */}
          <div className="filter-group">
            <label className="filter-label">Department</label>
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Departments</option>
              {filterOptions.departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* MANAGER FILTER */}
          <div className="filter-group">
            <label className="filter-label">Manager</label>
            <select
              name="manager"
              value={filters.manager}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Managers</option>
              {filterOptions.managers.map((manager) => (
                <option key={manager} value={manager}>
                  {manager}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="workload-loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading team workload data from backend...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="workload-empty-container">
          <i className="bi bi-inbox"></i>
          <p>
            {filters.search ||
            filters.fairness !== "all" ||
            filters.department ||
            filters.manager
              ? "No teams found matching your filters"
              : "No teams configured"}
          </p>
        </div>
      ) : viewType === "card" ? (
        <>
          {/* CARD VIEW */}
          <div className="workload-cards-grid">
            {currentPageData.map((project) => {
              const fairness = calculateFairness(project);
              const fairnessStyle = getFairnessStyle(fairness);

              return (
                <div key={project.workloadId} className="workload-card">
                  {/* CARD HEADER */}
                  <div className="workload-card-header">
                    <div className="workload-card-title-section">
                      <h5 className="workload-card-title">
                        {project.teamName || "N/A"}
                      </h5>
                      <p className="workload-card-subtitle">
                        <i className="bi bi-person-circle"></i>
                        {project.reportingManagerName || "N/A"}
                      </p>
                      <p className="workload-card-members">
                        <i className="bi bi-people-fill"></i>
                        {project.memberCount || 0} Members
                      </p>
                    </div>
                    <div
                      className="workload-fairness-badge"
                      style={{
                        background: fairnessStyle.background,
                        color: fairnessStyle.color,
                      }}
                    >
                      <i className={`bi ${fairnessStyle.icon}`}></i>
                      <span>{fairness.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* CARD BODY - METRICS */}
                  <div className="workload-card-metrics">
                    <div className="metric-item">
                      <span className="metric-label">Avg Workload</span>
                      <div className="metric-progress">
                        <div
                          className="metric-progress-bar"
                          style={{
                            width: `${Math.min(project.avgWorkload, 100)}%`,
                            backgroundColor: getProgressColor(fairness),
                          }}
                        ></div>
                      </div>
                      <p className="metric-value">{project.avgWorkload}%</p>
                    </div>

                    <div className="metric-item">
                      <span className="metric-label">Max Workload</span>
                      <div className="metric-progress">
                        <div
                          className="metric-progress-bar"
                          style={{
                            width: `${Math.min(project.maxHours, 100)}%`,
                            backgroundColor: getProgressColor(fairness),
                          }}
                        ></div>
                      </div>
                      <p className="metric-value">{project.maxHours}%</p>
                    </div>

                    <div className="metric-item">
                      <span className="metric-label">Variance</span>
                      <p className="metric-value metric-variance">
                        {project.workloadVariance}%
                      </p>
                    </div>
                  </div>

                  {/* CARD FOOTER */}
                  <div className="workload-card-footer">
                    <small>{project.status || "Active"}</small>
                    <small>Tasks: {project.tasksDistributed || 0}</small>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION */}
          <div className="pagination-container">
            <div className="pagination-left">
              <label className="pagination-label">Records per page:</label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="pagination-select"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>

            <div className="pagination-center">
              <span className="pagination-info">
                Page {currentPage} of {totalPages} | Showing{" "}
                {Math.min(startIndex + 1, filteredProjects.length)}-
                {Math.min(endIndex, filteredProjects.length)} of{" "}
                {filteredProjects.length}
              </span>
            </div>

            <div className="pagination-right">
              <button
                className="pagination-btn"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="bi bi-chevron-left"></i> Prev
              </button>

              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(
                    Math.max(0, currentPage - 2),
                    Math.min(totalPages, currentPage + 1)
                  )
                  .map((page) => (
                    <button
                      key={page}
                      className={`pagination-number ${
                        currentPage === page ? "active" : ""
                      }`}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  ))}
              </div>

              <button
                className="pagination-btn"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* TABLE VIEW - WITH SINGLE TEAM COLUMN */}
          <div className="workload-table-container">
            <table className="workload-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Manager</th>
                  <th>Team Size</th>
                  <th>Avg Workload</th>
                  <th>Max Workload</th>
                  <th>Variance</th>
                  <th>Fairness</th>
                </tr>
              </thead>
              <tbody>
                {currentPageData.map((project) => {
                  const fairness = calculateFairness(project);
                  const fairnessStyle = getFairnessStyle(fairness);

                  return (
                    <tr key={project.workloadId}>
                      <td>
                        <strong>{project.teamName || "N/A"}</strong>
                      </td>
                      <td>{project.reportingManagerName || "N/A"}</td>
                      <td className="text-center">
                        {project.memberCount || 0}
                      </td>
                      <td className="text-center">
                        {project.avgWorkload || 0}%
                      </td>
                      <td className="text-center">{project.maxHours || 0}%</td>
                      <td className="text-center">
                        <strong>{project.workloadVariance || 0}%</strong>
                      </td>
                      <td>
                        <span
                          className="fairness-badge"
                          style={{
                            background: fairnessStyle.background,
                            color: fairnessStyle.color,
                          }}
                        >
                          <i className={`bi ${fairnessStyle.icon}`}></i>
                          {fairness.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="pagination-container">
            <div className="pagination-left">
              <label className="pagination-label">Records per page:</label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="pagination-select"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>

            <div className="pagination-center">
              <span className="pagination-info">
                Page {currentPage} of {totalPages} | Showing{" "}
                {Math.min(startIndex + 1, filteredProjects.length)}-
                {Math.min(endIndex, filteredProjects.length)} of{" "}
                {filteredProjects.length}
              </span>
            </div>

            <div className="pagination-right">
              <button
                className="pagination-btn"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="bi bi-chevron-left"></i> Prev
              </button>

              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(
                    Math.max(0, currentPage - 2),
                    Math.min(totalPages, currentPage + 1)
                  )
                  .map((page) => (
                    <button
                      key={page}
                      className={`pagination-number ${
                        currentPage === page ? "active" : ""
                      }`}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  ))}
              </div>

              <button
                className="pagination-btn"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </>
      )}

      {/* TOAST */}
      <div className="workload-toast-container">
        <div
          id="workloadToast"
          className="toast"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="toast-header">
            <strong className="me-auto" id="workloadToastTitle">
              Notification
            </strong>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="toast"
              aria-label="Close"
            ></button>
          </div>
          <div className="toast-body" id="workloadToastBody">
            Toast message here
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkloadDistribution;
