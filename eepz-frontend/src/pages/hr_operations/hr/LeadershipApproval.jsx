import React, { useState, useEffect } from "react";
import careerProgressionService from "../../../services/hr_operations/hr/careerProgressionService";
import { Spinner, Alert } from "react-bootstrap";
import "../../../styles/hr_operations/hr/leadershipApproval.css";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";

const LeadershipApproval = () => {
  const [promotions, setPromotions] = useState([]);
  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState("table");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter States
  const [filters, setFilters] = useState({
    email: "",
    currentRole: "",
    newRole: "",
    department: "",
    date: "",
  });

  // Filter Options
  const [filterOptions, setFilterOptions] = useState({
    emails: [],
    currentRoles: [],
    newRoles: [],
    departments: [],
    dates: [],
  });

  useEffect(() => {
    fetchSubmittedPromotions();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [filters, promotions]);

  const fetchSubmittedPromotions = async () => {
    try {
      setLoading(true);
      const response =
        await careerProgressionService.getSubmittedToLeadership();
      const data = Array.isArray(response) ? response : [];
      setPromotions(data);
      setFilteredPromotions(data);
      generateFilterOptions(data);
    } catch (error) {
      console.error("Error:", error);
      setPromotions([]);
      setFilteredPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const generateFilterOptions = (data) => {
    const emails = [
      ...new Set(data.map((p) => p.employeeEmail).filter(Boolean)),
    ];
    const currentRoles = [
      ...new Set(data.map((p) => p.oldRole).filter(Boolean)),
    ];
    const newRoles = [...new Set(data.map((p) => p.newRole).filter(Boolean))];
    const departments = [
      ...new Set(data.map((p) => p.departmentName).filter(Boolean)),
    ];
    const dates = [
      ...new Set(data.map((p) => formatDate(p.promotionDate)).filter(Boolean)),
    ];

    setFilterOptions({
      emails: emails.sort(),
      currentRoles: currentRoles.sort(),
      newRoles: newRoles.sort(),
      departments: departments.sort(),
      dates: dates.sort(),
    });
  };

  const applyFilters = () => {
    let filtered = promotions;

    if (filters.email) {
      filtered = filtered.filter((p) =>
        p.employeeEmail.toLowerCase().includes(filters.email.toLowerCase())
      );
    }

    if (filters.currentRole) {
      filtered = filtered.filter((p) => p.oldRole === filters.currentRole);
    }

    if (filters.newRole) {
      filtered = filtered.filter((p) => p.newRole === filters.newRole);
    }

    if (filters.department) {
      filtered = filtered.filter(
        (p) => p.departmentName === filters.department
      );
    }

    if (filters.date) {
      filtered = filtered.filter(
        (p) => formatDate(p.promotionDate) === filters.date
      );
    }

    setFilteredPromotions(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmailSearch = (e) => {
    const { value } = e.target;
    setFilters((prev) => ({
      ...prev,
      email: value,
    }));
  };

  const handleDateChange = (e) => {
    const { value } = e.target;
    setFilters((prev) => ({
      ...prev,
      date: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      email: "",
      currentRole: "",
      newRole: "",
      department: "",
      date: "",
    });
  };

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredPromotions.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatCurrencyVal = (amount) => {
    if (!amount || amount === 0) return "Not Set";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="leadership-approval-root">
      {/* FILTER BAR WITH TOGGLES */}
      <div className="leadership-filters-container">
        <div className="filters-header">
          <h5 className="filters-title">
            <i className="bi bi-funnel"></i>
            Filters
          </h5>
          <div className="filters-right-section">
            {/* VIEW TOGGLE BUTTONS */}
            <div className="leadership-view-toggle">
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
            <button
              className="btn-clear-filters"
              onClick={clearFilters}
              title="Clear all filters"
            >
              <i className="bi bi-x-circle"></i> Clear
            </button>
          </div>
        </div>

        <div className="filters-grid">
          {/* EMAIL SEARCH */}
          <div className="filter-group">
            <label className="filter-label">Email Search</label>
            <div className="search-wrapper">
              <i className="bi bi-search"></i>
              <input
                type="text"
                name="email"
                placeholder="Search by email..."
                value={filters.email}
                onChange={handleEmailSearch}
                className="filter-search"
              />
            </div>
          </div>

          {/* CURRENT ROLE FILTER */}
          <div className="filter-group">
            <label className="filter-label">Current Role</label>
            <select
              name="currentRole"
              value={filters.currentRole}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Roles</option>
              {filterOptions.currentRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* NEW ROLE FILTER */}
          <div className="filter-group">
            <label className="filter-label">New Role</label>
            <select
              name="newRole"
              value={filters.newRole}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All New Roles</option>
              {filterOptions.newRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
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

          {/* DATE PICKER */}
          <div className="filter-group">
            <label className="filter-label">Effective Date</label>
            <select
              name="date"
              value={filters.date}
              onChange={handleDateChange}
              className="filter-select"
            >
              <option value="">All Dates</option>
              {filterOptions.dates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="leadership-loading-container">
          <Spinner animation="border" variant="primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading promotions...</p>
        </div>
      ) : filteredPromotions.length === 0 ? (
        <Alert variant="info" className="leadership-alert">
          <i className="bi bi-info-circle me-2"></i>
          No promotions found matching your filters.
        </Alert>
      ) : viewType === "card" ? (
        <>
          {/* CARD VIEW */}
          <div className="leadership-cards-grid">
            {currentPageData.map((p) => (
              <div key={p.promotionId} className="leadership-card">
                {/* CARD HEADER */}
                <div className="card-header">
                  <div className="card-avatar">
                    {getInitials(p.employeeFullName || p.employeeEmail)}
                  </div>
                  <div className="card-header-info">
                    <h5 className="card-employee-name">
                      {p.employeeFullName || p.employeeEmail || "Unknown"}
                    </h5>
                    <p className="card-email">{p.employeeEmail || "N/A"}</p>
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="card-body">
                  <div className="card-row">
                    <span className="card-label">Department</span>
                    <span className="card-value">
                      {p.departmentName || "N/A"}
                    </span>
                  </div>

                  <div className="card-row">
                    <span className="card-label">Current Role</span>
                    <span className="card-value">{p.oldRole || "N/A"}</span>
                  </div>

                  <div className="card-row">
                    <span className="card-label">Promoted To</span>
                    <span className="card-value new-role">
                      {p.newRole || "N/A"}
                    </span>
                  </div>

                  <div className="card-row">
                    <span className="card-label">Current Salary</span>
                    <span className="card-value">
                      {formatCurrencyVal(p.oldSalary)}
                    </span>
                  </div>

                  <div className="card-row">
                    <span className="card-label">New Salary</span>
                    <span className="card-value new-salary">
                      {formatCurrencyVal(p.newSalary)}
                    </span>
                  </div>

                  <div className="card-row">
                    <span className="card-label">Increment</span>
                    <span className="card-value">
                      {p.incrementPercentage
                        ? `+${p.incrementPercentage.toFixed(2)}%`
                        : "N/A"}
                    </span>
                  </div>

                  <div className="card-row">
                    <span className="card-label">Effective Date</span>
                    <span className="card-value">
                      {formatDate(p.promotionDate)}
                    </span>
                  </div>

                  <div className="card-row">
                    <span className="card-label">Status</span>
                    <span className="card-status-badge status-approved">
                      {p.status || "Approved"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
                {Math.min(startIndex + 1, filteredPromotions.length)}-
                {Math.min(endIndex, filteredPromotions.length)} of{" "}
                {filteredPromotions.length}
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
          {/* TABLE VIEW */}
          <div className="leadership-table-container">
            <table className="leadership-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Current Role</th>
                  <th>New Role</th>
                  <th>Old Salary</th>
                  <th>New Salary</th>
                  <th>Increment %</th>
                  <th>Effective Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentPageData.map((p) => (
                  <tr key={p.promotionId}>
                    <td>
                      <div className="employee-cell">
                        <div className="employee-avatar">
                          {getInitials(p.employeeFullName || p.employeeEmail)}
                        </div>
                        <div>
                          <strong>
                            {p.employeeFullName || p.employeeEmail || "Unknown"}
                          </strong>
                          <small>{p.employeeEmail || "N/A"}</small>
                        </div>
                      </div>
                    </td>
                    <td>{p.departmentName || "N/A"}</td>
                    <td>{p.oldRole || "N/A"}</td>
                    <td className="new-role">{p.newRole || "N/A"}</td>
                    <td>{formatCurrencyVal(p.oldSalary)}</td>
                    <td className="new-salary">
                      {formatCurrencyVal(p.newSalary)}
                    </td>
                    <td className="text-center">
                      {p.incrementPercentage
                        ? `+${p.incrementPercentage.toFixed(2)}%`
                        : "N/A"}
                    </td>
                    <td>{formatDate(p.promotionDate)}</td>
                    <td className="text-center">
                      <span className="status-badge status-approved">
                        {p.status || "Approved"}
                      </span>
                    </td>
                  </tr>
                ))}
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
                {Math.min(startIndex + 1, filteredPromotions.length)}-
                {Math.min(endIndex, filteredPromotions.length)} of{" "}
                {filteredPromotions.length}
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
    </div>
  );
};

export default LeadershipApproval;
