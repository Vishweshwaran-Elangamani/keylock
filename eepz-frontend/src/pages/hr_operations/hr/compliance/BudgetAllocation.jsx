import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import budgetAllocationService from "../../../../services/hr_operations/hr/budgetAllocationService";
import CreateBudgetModal from "../modals/CreateBudgetModal";
import EditBudgetModal from "../modals/EditBudgetModal";
import ViewBudgetDetailsModal from "../modals/ViewBudgetDetailsModal";
import "../../../../styles/hr_operations/hr/budgetAllocation.css";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";

const BudgetAllocation = () => {
  const [budgets, setBudgets] = useState([]);
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);

  // View & Pagination States
  const [viewType, setViewType] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter States
  const [filters, setFilters] = useState({
    search: "",
    year: "all",
    department: "",
  });

  // Filter Options
  const [filterOptions, setFilterOptions] = useState({
    years: [],
    departments: [],
  });

  const currentUserId = parseInt(localStorage.getItem("userId"));
  const userRole = localStorage.getItem("userRole");
  const isLeadership = userRole === "Leadership";

  useEffect(() => {
    console.log(" Current User Role:", userRole);
  }, [userRole]);

  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [budgets, filters]);

  const fetchBudgets = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(" Fetching all department budgets...");
      const response = await budgetAllocationService.getAllDepartmentBudgets();
      console.log(" Budgets fetched:", response.data);
      const data = response.data || [];
      setBudgets(data);
      setFilteredBudgets(data);
      generateFilterOptions(data);
    } catch (err) {
      console.error(" Error fetching budgets:", err);
      setError(err.message || "Failed to fetch budgets");
      showToast("Error", err.message || "Failed to fetch budgets", "danger");
    } finally {
      setLoading(false);
    }
  };

  const generateFilterOptions = (data) => {
    const years = [...new Set(data.map((b) => b.fiscalYear))].sort(
      (a, b) => b - a
    );
    const departments = [
      ...new Set(data.map((b) => b.departmentName).filter(Boolean)),
    ].sort();

    setFilterOptions({
      years,
      departments,
    });
  };

  const applyFilters = () => {
    let filtered = budgets;

    // Search filter
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter((b) => {
        const dept = (b.departmentName || "").toLowerCase();
        return dept.includes(query) || b.fiscalYear.toString().includes(query);
      });
    }

    // Year filter
    if (filters.year !== "all") {
      filtered = filtered.filter(
        (b) => b.fiscalYear === parseInt(filters.year)
      );
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter(
        (b) => b.departmentName === filters.department
      );
    }

    setFilteredBudgets(filtered);
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
      year: "all",
      department: "",
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
  const totalPages = Math.ceil(filteredBudgets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredBudgets.slice(startIndex, endIndex);

  const handleCreateBudget = () => {
    setShowCreateModal(true);
  };

  const handleBudgetCreated = () => {
    setShowCreateModal(false);
    fetchBudgets();
    showToast("Success", "Department budget created successfully", "success");
  };

  const handleEditClick = (budget) => {
    setSelectedBudget(budget);
    setShowEditModal(true);
  };

  const handleBudgetUpdated = () => {
    setShowEditModal(false);
    setSelectedBudget(null);
    fetchBudgets();
    showToast("Success", "Department budget updated successfully", "success");
  };

  const handleDeleteClick = async (budgetId) => {
    if (
      !window.confirm("Are you sure you want to delete this department budget?")
    ) {
      return;
    }

    try {
      console.log(" Deleting budget:", budgetId);
      await budgetAllocationService.deleteDepartmentBudget(budgetId);
      fetchBudgets();
      showToast("Success", "Department budget deleted successfully", "success");
    } catch (err) {
      console.error(" Error deleting budget:", err);
      showToast("Error", err.message || "Failed to delete budget", "danger");
    }
  };

  const handleViewDetails = (budget) => {
    setSelectedBudget(budget);
    setShowDetailsModal(true);
  };

  const showToast = (title, message, type) => {
    const fullMessage = `${title}: ${message}`;

    switch (type) {
      case "success":
        toast.success(fullMessage);
        break;
      case "danger":
      case "error":
        toast.error(fullMessage);
        break;
      case "warning":
        toast.warning(fullMessage);
        break;
      case "info":
        toast.info(fullMessage);
        break;
      default:
        toast(fullMessage);
    }
  };

  const getUtilizationColor = (percentage) => {
    if (!percentage) return "#cbd5e1";
    if (percentage >= 90) return "#ef4444";
    if (percentage >= 75) return "#f59e0b";
    if (percentage >= 50) return "#10b981";
    return "#3b82f6";
  };

  return (
    <div className="budget-root">
      {error && (
        <div className="alert alert-danger budget-alert" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {/* HEADER WITH BUTTON */}
      <div className="budget-header">
        <div className="budget-header-left">
          <h4 className="budget-title">
            <i className="bi bi-cash-coin"></i>
            Department Budget Management
          </h4>
          <p className="budget-subtitle">
            Manage departmental budgets, allocations, and utilization tracking
          </p>
        </div>

        {/* SHOW BUTTON ONLY FOR LEADERSHIP */}
        {isLeadership && (
          <button className="budget-btn-create" onClick={handleCreateBudget}>
            <i className="bi bi-plus-circle"></i>
            Add Department Budget
          </button>
        )}
      </div>

      {/* FILTER BAR WITH TOGGLES */}
      <div className="budget-filters-container">
        <div className="filters-header">
          <h5 className="filters-title">
            <i className="bi bi-funnel"></i>
            Filters
          </h5>
          <div className="filters-right-section">
            {/* VIEW TOGGLE BUTTONS */}
            <div className="budget-view-toggle">
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
          {/* SEARCH */}
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <div className="search-wrapper">
              <i className="bi bi-search"></i>
              <input
                type="text"
                name="search"
                placeholder="Search by department..."
                value={filters.search}
                onChange={handleSearchChange}
                className="filter-search"
              />
            </div>
          </div>

          {/* YEAR FILTER */}
          <div className="filter-group">
            <label className="filter-label">Fiscal Year</label>
            <select
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">All Years</option>
              {filterOptions.years.map((year) => (
                <option key={year} value={year}>
                  {year}
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
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="budget-loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading department budgets...</p>
        </div>
      ) : filteredBudgets.length === 0 ? (
        <div className="budget-alert-empty">
          <i className="bi bi-inbox"></i>
          <p>
            {filters.search || filters.year !== "all" || filters.department
              ? "No budgets found matching your filters"
              : "No department budgets configured"}
          </p>
        </div>
      ) : viewType === "card" ? (
        <>
          {/* CARD VIEW */}
          <div className="budget-cards-grid">
            {currentPageData.map((budget) => (
              <div key={budget.budgetId} className="budget-card">
                {/* CARD HEADER */}
                <div className="budget-card-header">
                  <div className="budget-card-avatar">
                    {budget.departmentName?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="budget-card-header-info">
                    <h5 className="budget-card-title">
                      {budget.departmentName}
                    </h5>
                    <p className="budget-card-year">{budget.fiscalYear}</p>
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="budget-card-body">
                  <div className="budget-card-row">
                    <span className="budget-card-label">Total Budget</span>
                    <span className="budget-card-value">
                      {formatCurrency(budget.totalBudget)}
                    </span>
                  </div>

                  <div className="budget-card-row">
                    <span className="budget-card-label">Allocated</span>
                    <span className="budget-card-value">
                      {formatCurrency(budget.allocatedAmount)}
                    </span>
                  </div>

                  <div className="budget-card-row">
                    <span className="budget-card-label">Utilized</span>
                    <span className="budget-card-value">
                      {formatCurrency(budget.utilizedAmount)}
                    </span>
                  </div>

                  <div className="budget-card-row">
                    <span className="budget-card-label">Utilization</span>
                    <span className="budget-card-value">
                      {budget.utilizationPercentage || 0}%
                    </span>
                  </div>

                  <div className="budget-card-row">
                    <span className="budget-card-label">Headcount</span>
                    <span className="budget-card-value">
                      {budget.headcount || 0}
                    </span>
                  </div>

                  <div className="budget-card-row">
                    <span className="budget-card-label">Avg Cost/Employee</span>
                    <span className="budget-card-value">
                      {formatCurrency(budget.avgCostPerEmployee)}
                    </span>
                  </div>
                </div>

                {/* CARD ACTIONS */}
                {isLeadership && (
                  <div className="budget-card-actions">
                    <button
                      className="budget-btn-card-action budget-btn-view"
                      onClick={() => handleViewDetails(budget)}
                      title="View Details"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    <button
                      className="budget-btn-card-action budget-btn-edit"
                      onClick={() => handleEditClick(budget)}
                      title="Edit"
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="budget-btn-card-action budget-btn-delete"
                      onClick={() => handleDeleteClick(budget.budgetId)}
                      title="Delete"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                )}
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
                {Math.min(startIndex + 1, filteredBudgets.length)}-
                {Math.min(endIndex, filteredBudgets.length)} of{" "}
                {filteredBudgets.length}
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
          <div className="budget-table-container">
            <table className="budget-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Fiscal Year</th>
                  <th>Total Budget</th>
                  <th>Allocated</th>
                  <th>Utilized</th>
                  <th>Utilization %</th>
                  <th>Headcount</th>
                  <th>Avg Cost/Employee</th>
                  {isLeadership && (
                    <th className="budget-actions-header">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentPageData.map((budget) => (
                  <tr key={budget.budgetId}>
                    <td>
                      <strong>{budget.departmentName || "Unknown"}</strong>
                    </td>
                    <td>{budget.fiscalYear}</td>
                    <td>{formatCurrency(budget.totalBudget)}</td>
                    <td>{formatCurrency(budget.allocatedAmount)}</td>
                    <td>{formatCurrency(budget.utilizedAmount)}</td>
                    <td>
                      <div className="budget-progress-container">
                        <div
                          className="budget-progress-bar"
                          style={{
                            width: `${budget.utilizationPercentage || 0}%`,
                            backgroundColor: getUtilizationColor(
                              budget.utilizationPercentage
                            ),
                          }}
                        ></div>
                        <span className="budget-progress-text">
                          {budget.utilizationPercentage || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="budget-text-center">
                      {budget.headcount || 0}
                    </td>
                    <td>{formatCurrency(budget.avgCostPerEmployee)}</td>
                    {isLeadership && (
                      <td>
                        <div className="budget-actions">
                          <button
                            className="budget-btn-view"
                            onClick={() => handleViewDetails(budget)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="budget-btn-edit"
                            onClick={() => handleEditClick(budget)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="budget-btn-delete"
                            onClick={() => handleDeleteClick(budget.budgetId)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    )}
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
                {Math.min(startIndex + 1, filteredBudgets.length)}-
                {Math.min(endIndex, filteredBudgets.length)} of{" "}
                {filteredBudgets.length}
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

      {/* MODALS */}
      {showCreateModal && (
        <CreateBudgetModal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onBudgetCreated={handleBudgetCreated}
        />
      )}

      {showEditModal && selectedBudget && (
        <EditBudgetModal
          show={showEditModal}
          budget={selectedBudget}
          onHide={() => {
            setShowEditModal(false);
            setSelectedBudget(null);
          }}
          onBudgetUpdated={handleBudgetUpdated}
        />
      )}

      {showDetailsModal && selectedBudget && (
        <ViewBudgetDetailsModal
          show={showDetailsModal}
          budget={selectedBudget}
          onHide={() => {
            setShowDetailsModal(false);
            setSelectedBudget(null);
          }}
        />
      )}

      {/* BLUR BACKDROP */}
      <div
        className="budget-blur-backdrop"
        style={{
          display:
            showCreateModal || showEditModal || showDetailsModal
              ? "block"
              : "none",
        }}
      ></div>
    </div>
  );
};

export default BudgetAllocation;
