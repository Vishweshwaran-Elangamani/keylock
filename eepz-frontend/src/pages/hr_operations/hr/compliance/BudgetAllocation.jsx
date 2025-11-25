import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import budgetAllocationService from "../../../../services/hr_operations/hr/budgetAllocationService";
import CreateBudgetModal from "../../../../components/hr_operations/modals/CreateBudgetModal";
import EditBudgetModal from "../../../../components/hr_operations/modals/EditBudgetModal";
import ViewBudgetDetailsModal from "../../../../components/hr_operations/modals/ViewBudgetDetailsModal";
import DeleteBudgetModal from "../../../../components/hr_operations/modals/DeleteBudgetModal";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import { FaSearch } from "react-icons/fa";
import { Form } from "react-bootstrap";
import "../../../../styles/hr_operations/hr/budgetAllocation.css";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";

const BudgetAllocation = () => {
  const [budgets, setBudgets] = useState([]);
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [viewType, setViewType] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ✅ UPDATED: Two-state search approach
  const [searchTerm, setSearchTerm] = useState(""); // What user types
  const [activeSearchTerm, setActiveSearchTerm] = useState(""); // Used for filtering

  const [filters, setFilters] = useState({
    year: "all",
    department: "",
  });

  const [filterOptions, setFilterOptions] = useState({
    years: [],
    departments: [],
  });

  const currentUserId = parseInt(localStorage.getItem("userId"));
  const userRole = localStorage.getItem("userRole");
  const isLeadership = userRole === "Leadership";

  useEffect(() => {
    console.log("Current User Role:", userRole);
  }, [userRole]);

  useEffect(() => {
    fetchBudgets();
  }, []);

  // ✅ UPDATED: Include activeSearchTerm in dependencies
  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [budgets, activeSearchTerm, filters]);

  const fetchBudgets = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching all department budgets...");
      const response = await budgetAllocationService.getAllDepartmentBudgets();
      console.log("Budgets fetched:", response.data);
      const data = response.data || [];
      setBudgets(data);
      setFilteredBudgets(data);
      generateFilterOptions(data);
    } catch (err) {
      console.error("Error fetching budgets:", err);
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
    setFilterOptions({ years, departments });
  };

  // ✅ UPDATED: Use activeSearchTerm for filtering
  const applyFilters = () => {
    let filtered = budgets;

    if (activeSearchTerm.trim()) {
      const query = activeSearchTerm.toLowerCase();
      filtered = filtered.filter((b) => {
        const dept = (b.departmentName || "").toLowerCase();
        return dept.includes(query) || b.fiscalYear.toString().includes(query);
      });
    }

    if (filters.year !== "all") {
      filtered = filtered.filter(
        (b) => b.fiscalYear === parseInt(filters.year)
      );
    }

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

  // ✅ NEW: Handle search button click
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
  };

  // ✅ UPDATED: Clear all filters including activeSearchTerm
  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setFilters({
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

  const handleDeleteClick = (budget) => {
    setSelectedBudget(budget);
    setShowDeleteModal(true);
  };

  const handleBudgetDeleted = () => {
    setShowDeleteModal(false);
    setSelectedBudget(null);
    fetchBudgets();
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

  const summaryStats = {
    totalBudget: filteredBudgets.reduce(
      (sum, b) => sum + (b.totalBudget || 0),
      0
    ),
    totalAllocated: filteredBudgets.reduce(
      (sum, b) => sum + (b.allocatedAmount || 0),
      0
    ),
    totalUtilized: filteredBudgets.reduce(
      (sum, b) => sum + (b.utilizedAmount || 0),
      0
    ),
  };

  if (loading) {
    return (
      <div className="budget-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading department budgets...</p>
      </div>
    );
  }

  return (
    <div className="budget-root">
      <Breadcrumb
        items={[
          {
            label: "Department Budget Allocation",
          },
        ]}
      />

      {error && (
        <div className="alert alert-danger budget-alert" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {filteredBudgets.length > 0 && (
        <div className="budget-summary-cards">
          <div className="budget-summary-card total">
            <div className="summary-card-icon">
              <i className="bi bi-wallet2"></i>
            </div>
            <div className="summary-card-content">
              <div className="summary-card-value">
                {formatCurrency(summaryStats.totalBudget)}
              </div>
              <div className="summary-card-label">Total Budget</div>
            </div>
          </div>
          <div className="budget-summary-card allocated">
            <div className="summary-card-icon">
              <i className="bi bi-cash-stack"></i>
            </div>
            <div className="summary-card-content">
              <div className="summary-card-value">
                {formatCurrency(summaryStats.totalAllocated)}
              </div>
              <div className="summary-card-label">Total Allocated</div>
            </div>
          </div>
          <div className="budget-summary-card utilized">
            <div className="summary-card-icon">
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <div className="summary-card-content">
              <div className="summary-card-value">
                {formatCurrency(summaryStats.totalUtilized)}
              </div>
              <div className="summary-card-label">Total Utilized</div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ UPDATED: Filter Section with Search Button */}
      <div className="budget-filter-section">
        <div className="budget-filter-row-single">
          {/* ✅ NEW: Search with Button */}
          <div className="budget-search-input">
            <div className="budget-search-inner">
              <span className="budget-search-icon">
                <FaSearch />
              </span>
              <Form.Control
                type="text"
                placeholder="Search by department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="budget-search-field"
              />
              <button
                type="button"
                className="budget-search-btn"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
          </div>

          <select
            name="year"
            value={filters.year}
            onChange={handleFilterChange}
            className="budget-filter-select"
          >
            <option value="all">All Years</option>
            {filterOptions.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            name="department"
            value={filters.department}
            onChange={handleFilterChange}
            className="budget-filter-select"
          >
            <option value="">All Departments</option>
            {filterOptions.departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <button className="budget-clear-btn" onClick={clearFilters}>
            Clear Filters
          </button>

          <div className="budget-results-count-inline">
            Showing {currentPageData.length} of {filteredBudgets.length}{" "}
            budgets
          </div>

          {isLeadership && (
            <button className="budget-btn-create" onClick={handleCreateBudget}>
              <i className="bi bi-plus-circle"></i>
              Add Budget
            </button>
          )}
        </div>
      </div>

      {filteredBudgets.length === 0 ? (
        <div className="budget-alert-empty">
          <i className="bi bi-inbox"></i>
          <p>
            {searchTerm || filters.year !== "all" || filters.department
              ? "No budgets found matching your filters"
              : "No department budgets configured"}
          </p>
        </div>
      ) : viewType === "card" ? (
        <>
          <div className="budget-cards-grid">
            {currentPageData.map((budget) => (
              <div key={budget.budgetId} className="budget-card">
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
                      onClick={() => handleDeleteClick(budget)}
                      title="Delete"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                <span className="pagination-label">Show</span>
                <select
                  className="pagination-select"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span className="pagination-label">entries</span>
              </div>

              <div className="pagination-status">
                Showing {Math.min(startIndex + 1, filteredBudgets.length)}-
                {Math.min(endIndex, filteredBudgets.length)} of{" "}
                {filteredBudgets.length} entries
              </div>

              <nav className="pagination-nav">
                <ul className="pagination">
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 1 && page <= currentPage + 1)
                        return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      if (index > 0 && page - array[index - 1] > 1) {
                        return (
                          <React.Fragment key={`ellipsis-${page}`}>
                            <li className="page-item disabled">
                              <button className="page-link">...</button>
                            </li>
                            <li
                              className={`page-item ${
                                currentPage === page ? "active" : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => goToPage(page)}
                              >
                                {page}
                              </button>
                            </li>
                          </React.Fragment>
                        );
                      }
                      return (
                        <li
                          key={page}
                          className={`page-item ${
                            currentPage === page ? "active" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => goToPage(page)}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    })}

                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="budget-table-container">
            <table className="budget-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Fiscal Year</th>
                  <th>Total Budget</th>
                  <th>Allocated</th>
                  <th>Utilized</th>
                  <th>Headcount</th>
                  <th>Avg Cost/Employee</th>
                  {isLeadership && (
                    <th className="budget-text-center budget-actions-header">
                      Actions
                    </th>
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
                    <td className="budget-text-center">
                      {budget.headcount || 0}
                    </td>
                    <td>{formatCurrency(budget.avgCostPerEmployee)}</td>
                    {isLeadership && (
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn action-btn-edit"
                            onClick={() => handleViewDetails(budget)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="action-btn action-btn-warning"
                            onClick={() => handleEditClick(budget)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="action-btn action-btn-delete"
                            onClick={() => handleDeleteClick(budget)}
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

          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                <span className="pagination-label">Show</span>
                <select
                  className="pagination-select"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span className="pagination-label">entries</span>
              </div>

              <div className="pagination-status">
                Showing {Math.min(startIndex + 1, filteredBudgets.length)}-
                {Math.min(endIndex, filteredBudgets.length)} of{" "}
                {filteredBudgets.length} entries
              </div>

              <nav className="pagination-nav">
                <ul className="pagination">
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 1 && page <= currentPage + 1)
                        return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      if (index > 0 && page - array[index - 1] > 1) {
                        return (
                          <React.Fragment key={`ellipsis-${page}`}>
                            <li className="page-item disabled">
                              <button className="page-link">...</button>
                            </li>
                            <li
                              className={`page-item ${
                                currentPage === page ? "active" : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => goToPage(page)}
                              >
                                {page}
                              </button>
                            </li>
                          </React.Fragment>
                        );
                      }
                      return (
                        <li
                          key={page}
                          className={`page-item ${
                            currentPage === page ? "active" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => goToPage(page)}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    })}

                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}

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

      {showDeleteModal && selectedBudget && (
        <DeleteBudgetModal
          show={showDeleteModal}
          budget={selectedBudget}
          onHide={() => {
            setShowDeleteModal(false);
            setSelectedBudget(null);
          }}
          onBudgetDeleted={handleBudgetDeleted}
        />
      )}

      <div
        className="budget-blur-backdrop"
        style={{
          display:
            showCreateModal ||
            showEditModal ||
            showDetailsModal ||
            showDeleteModal
              ? "block"
              : "none",
        }}
      ></div>
    </div>
  );
};

export default BudgetAllocation;
