import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import budgetAllocationService from "../../../../services/hr_operations/hr/budgetAllocationService";
import CreateBudgetModal from "../../../../components/hr_operations/modals/CreateBudgetModal";
import EditBudgetModal from "../../../../components/hr_operations/modals/EditBudgetModal";
import ViewBudgetDetailsModal from "../../../../components/hr_operations/modals/ViewBudgetDetailsModal";
import DeleteBudgetModal from "../../../../components/hr_operations/modals/DeleteBudgetModal";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import { FaSearch } from "react-icons/fa";
import { Form } from "react-bootstrap";
import "../../../../styles/hr_operations/hr/BudgetAllocation.css";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";

const YearDropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const allOptions = [{ label: "All Years", value: "all" }, ...options];
  const selected = allOptions.find((o) => o.value === value) || allOptions[0];

  const handleSelect = (val) => {
    onChange({ target: { name: "year", value: val } });
    setOpen(false);
  };

  return (
    <div
      className="ba-filter-select custom-ba-year-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="custom-ba-year-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="custom-ba-year-arrow" />
      </div>
      {open && (
        <div className="custom-ba-year-menu">
          {allOptions.map((opt) => (
            <div
              key={opt.value}
              className={
                "custom-ba-year-option" +
                (opt.value === value ? " custom-ba-year-option-active" : "")
              }
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DepartmentDropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const allOptions = [
    { label: "All Departments", value: "" },
    ...options.map((dept) => ({ label: dept, value: dept })),
  ];
  const selected = allOptions.find((o) => o.value === value) || allOptions[0];

  const handleSelect = (val) => {
    onChange({ target: { name: "department", value: val } });
    setOpen(false);
  };

  return (
    <div
      className="ba-filter-select custom-ba-department-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="custom-ba-department-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="custom-ba-department-arrow" />
      </div>
      {open && (
        <div className="custom-ba-department-menu">
          {allOptions.map((opt) => (
            <div
              key={opt.value || "all-dept"}
              className={
                "custom-ba-department-option" +
                (opt.value === value ? " custom-ba-department-option-active" : "")
              }
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const searchInputRef = useRef(null);
  const rowsDropdownRef = useRef(null);

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

  useEffect(() => {}, [userRole]);

  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [budgets, activeSearchTerm, filters]);

  // Click outside handler for rows dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        rowsDropdownRef.current &&
        !rowsDropdownRef.current.contains(event.target)
      ) {
        setShowRowsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await budgetAllocationService.getAllDepartmentBudgets();
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

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    if (searchInputRef.current) searchInputRef.current.blur();
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setFilters({
      year: "all",
      department: "",
    });
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
    setShowRowsDropdown(false);
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

  if (loading) {
    return (
      <div className="ba-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading department budgets...</p>
      </div>
    );
  }

  return (
    <div className="ba-page">
      <Breadcrumb
        items={[
          {
            label: "Department Budget Allocation",
          },
        ]}
      />

      {error && (
        <div className="alert alert-danger ba-alert" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {filteredBudgets.length > 0 && (
        <div className="stats-cards-ba">
          <div className="stat-card-ba stat-total-ba">
            <div className="stat-icon-ba">
              <i className="bi bi-wallet2"></i>
            </div>
            <div className="stat-content-ba">
              <div className="stat-value-ba">
                {formatCurrency(summaryStats.totalBudget)}
              </div>
              <div className="stat-label-ba">Total Budget</div>
            </div>
          </div>

          <div className="stat-card-ba stat-allocated-ba">
            <div className="stat-icon-ba">
              <i className="bi bi-cash-stack"></i>
            </div>
            <div className="stat-content-ba">
              <div className="stat-value-ba">
                {formatCurrency(summaryStats.totalAllocated)}
              </div>
              <div className="stat-label-ba">Total Allocated</div>
            </div>
          </div>

          <div className="stat-card-ba stat-utilized-ba">
            <div className="stat-icon-ba">
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <div className="stat-content-ba">
              <div className="stat-value-ba">
                {formatCurrency(summaryStats.totalUtilized)}
              </div>
              <div className="stat-label-ba">Total Utilized</div>
            </div>
          </div>
        </div>
      )}

      <div className="ba-controls">
        <div className="ba-search-input">
          <div className="ba-search-inner">
            <span className="ba-search-icon">
              <FaSearch />
            </span>
            <Form.Control
              ref={searchInputRef}
              type="text"
              placeholder="Search department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyDown}
              className="ba-search-field"
            />
            <button
              type="button"
              className="ba-search-btn"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </div>

        <YearDropdown
          value={filters.year}
          onChange={handleFilterChange}
          options={filterOptions.years.map((year) => ({
            label: year.toString(),
            value: year.toString(),
          }))}
        />

        <DepartmentDropdown
          value={filters.department}
          onChange={handleFilterChange}
          options={filterOptions.departments}
        />

        <button className="ba-btn-clear" onClick={clearFilters}>
          Clear Filters
        </button>

        <div className="ba-results-count">
          Showing {currentPageData.length} of {filteredBudgets.length} budgets
        </div>

        {isLeadership && (
          <button className="ba-btn-create" onClick={handleCreateBudget}>
            <i className="bi bi-plus-circle"></i> Add Budget
          </button>
        )}
      </div>

      {filteredBudgets.length === 0 ? (
        <div className="ba-empty-state">
          <div className="ba-empty-icon">
            <i className="bi bi-inbox"></i>
          </div>
          <h4>No budgets found</h4>
          <p>Adjust your search or filters</p>
        </div>
      ) : viewType === "card" ? (
        <>
          <div className="ba-cards-grid">
            {currentPageData.map((budget) => (
              <div key={budget.budgetId} className="ba-budget-card">
                <div className="ba-card-header">
                  <div className="ba-card-avatar">
                    {budget.departmentName?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="ba-card-header-info">
                    <h5 className="ba-card-title">{budget.departmentName}</h5>
                    <p className="ba-card-year">{budget.fiscalYear}</p>
                  </div>
                </div>

                <div className="ba-card-body">
                  <div className="ba-card-row">
                    <span className="ba-card-label">Total Budget</span>
                    <span className="ba-card-value">
                      {formatCurrency(budget.totalBudget)}
                    </span>
                  </div>
                  <div className="ba-card-row">
                    <span className="ba-card-label">Allocated</span>
                    <span className="ba-card-value">
                      {formatCurrency(budget.allocatedAmount)}
                    </span>
                  </div>
                  <div className="ba-card-row">
                    <span className="ba-card-label">Utilized</span>
                    <span className="ba-card-value">
                      {formatCurrency(budget.utilizedAmount)}
                    </span>
                  </div>
                  <div className="ba-card-row">
                    <span className="ba-card-label">Utilization</span>
                    <span className="ba-card-value">
                      {budget.utilizationPercentage || 0}%
                    </span>
                  </div>
                </div>

                {isLeadership && (
                  <div className="ba-card-actions">
                    <button
                      className="ba-action-btn ba-action-view"
                      onClick={() => handleViewDetails(budget)}
                      title="View Details"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    <button
                      className="ba-action-btn ba-action-edit"
                      onClick={() => handleEditClick(budget)}
                      title="Edit"
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="ba-action-btn ba-action-delete"
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
            <div className="ba-pagination-container">
              <div className="ba-pagination-info">
                <span className="ba-pagination-label">Show</span>
                <div ref={rowsDropdownRef} className="ba-rows-dropdown-wrapper">
                  <button
                    type="button"
                    onClick={() => setShowRowsDropdown(!showRowsDropdown)}
                    className="ba-rows-button"
                  >
                    <span>{itemsPerPage}</span>
                    <i
                      className={`bi bi-chevron-${showRowsDropdown ? "up" : "down"} ba-rows-chevron`}
                    ></i>
                  </button>

                  {showRowsDropdown && (
                    <div className="ba-rows-dropdown">
                      {[5, 10, 25, 50].map((size) => (
                        <div
                          key={size}
                          onClick={() => handleItemsPerPageChange(size)}
                          className={`ba-rows-option ${
                            itemsPerPage === size ? "ba-rows-active" : ""
                          }`}
                        >
                          {size}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="ba-pagination-label">entries</span>
              </div>

              <div className="ba-pagination-status">
                Showing {Math.min(startIndex + 1, filteredBudgets.length)}-
                {Math.min(endIndex, filteredBudgets.length)} of{" "}
                {filteredBudgets.length} entries
              </div>

              <nav className="ba-pagination-nav">
                <ul className="ba-pagination">
                  <li
                    className={`ba-page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="ba-page-link"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>

                  {getPageNumbers().map((page, index) => (
                    <li
                      key={index}
                      className={`ba-page-item ${
                        page === currentPage ? "active" : ""
                      } ${typeof page !== "number" ? "disabled" : ""}`}
                    >
                      <button
                        className="ba-page-link"
                        onClick={() =>
                          typeof page === "number" && goToPage(page)
                        }
                        disabled={typeof page !== "number"}
                      >
                        {page}
                      </button>
                    </li>
                  ))}

                  <li
                    className={`ba-page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="ba-page-link"
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
          <div className="ba-table-card">
            <div className="ba-table-wrapper">
              <table className="ba-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Fiscal Year</th>
                    <th>Total Budget</th>
                    <th>Allocated</th>
                    <th>Utilized</th>
                    {isLeadership && <th>Actions</th>}
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
                      {isLeadership && (
                        <td>
                          <div className="ba-action-buttons">
                            <button
                              className="ba-action-btn ba-action-view"
                              onClick={() => handleViewDetails(budget)}
                              title="View Details"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="ba-action-btn ba-action-edit"
                              onClick={() => handleEditClick(budget)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="ba-action-btn ba-action-delete"
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
              <div className="ba-pagination-container">
                <div className="ba-pagination-info">
                  <span className="ba-pagination-label">Show</span>
                  <div ref={rowsDropdownRef} className="ba-rows-dropdown-wrapper">
                    <button
                      type="button"
                      onClick={() => setShowRowsDropdown(!showRowsDropdown)}
                      className="ba-rows-button"
                    >
                      <span>{itemsPerPage}</span>
                      <i
                        className={`bi bi-chevron-${showRowsDropdown ? "up" : "down"} ba-rows-chevron`}
                      ></i>
                    </button>

                    {showRowsDropdown && (
                      <div className="ba-rows-dropdown">
                        {[5, 10, 25, 50].map((size) => (
                          <div
                            key={size}
                            onClick={() => handleItemsPerPageChange(size)}
                            className={`ba-rows-option ${
                              itemsPerPage === size ? "ba-rows-active" : ""
                            }`}
                          >
                            {size}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="ba-pagination-label">entries</span>
                </div>

                <div className="ba-pagination-status">
                  Showing {Math.min(startIndex + 1, filteredBudgets.length)}-
                  {Math.min(endIndex, filteredBudgets.length)} of{" "}
                  {filteredBudgets.length} entries
                </div>

                <nav className="ba-pagination-nav">
                  <ul className="ba-pagination">
                    <li
                      className={`ba-page-item ${
                        currentPage === 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="ba-page-link"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>

                    {getPageNumbers().map((page, index) => (
                      <li
                        key={index}
                        className={`ba-page-item ${
                          page === currentPage ? "active" : ""
                        } ${typeof page !== "number" ? "disabled" : ""}`}
                      >
                        <button
                          className="ba-page-link"
                          onClick={() =>
                            typeof page === "number" && goToPage(page)
                          }
                          disabled={typeof page !== "number"}
                        >
                          {page}
                        </button>
                      </li>
                    ))}

                    <li
                      className={`ba-page-item ${
                        currentPage === totalPages ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="ba-page-link"
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
          </div>
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
        className="ba-blur-backdrop"
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
