import React, { useState, useEffect } from "react";
import { Toast } from "bootstrap";
import budgetAllocationService from "../../../../services/hr_operations/hr/budgetAllocationService";
import AllocateByCategoryModal from "../../../../components/hr_operations/modals/AllocateByCategoryModal";
import UpdateUtilizedAmountModal from "../../../../components/hr_operations/modals/UpdateUtilizedAmountModal";
import AllocationsList from "../../../../components/hr_operations/modals/AllocationsList";
import "../../../../styles/hr_operations/hr/budgetAllocation.css";
import "../../../../styles/hr_operations/hr/allocationsList.css";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";

const BudgetAllocationBreakdown = () => {
  // Budget States
  const [budgets, setBudgets] = useState([]);
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showUpdateUtilizedModal, setShowUpdateUtilizedModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);

  // View Control States
  const [selectedBudgetForAllocations, setSelectedBudgetForAllocations] =
    useState(null);
  const [viewType, setViewType] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter States
  const [filters, setFilters] = useState({
    search: "",
    department: "",
  });

  const [filterOptions, setFilterOptions] = useState({
    departments: [],
  });

  const currentUserId = parseInt(localStorage.getItem("userId"));
  const userRole = localStorage.getItem("userRole");
  const isHR = userRole === "HR";
  const isDeptHead = userRole === "Department Head";

  // Initial Load
  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [budgets, filters]);

  // Fetch Budgets from Backend
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

  // Generate Filter Options
  const generateFilterOptions = (data) => {
    const departments = [
      ...new Map(data.map((b) => [b.departmentId, b.departmentName])).entries(),
    ].map(([id, name]) => ({ id, name }));

    setFilterOptions({
      departments: departments.sort((a, b) => a.name.localeCompare(b.name)),
    });
  };

  // Apply Filters
  const applyFilters = () => {
    let filtered = budgets;

    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter((b) => {
        const dept = (b.departmentName || "").toLowerCase();
        return dept.includes(query) || b.fiscalYear.toString().includes(query);
      });
    }

    if (filters.department) {
      filtered = filtered.filter(
        (b) => b.departmentId === parseInt(filters.department)
      );
    }

    setFilteredBudgets(filtered);
  };

  // Filter Change Handlers
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
      department: "",
    });
  };

  // Pagination Handlers
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

  //  UPDATED: Calculate Allocated Percentage - Fetch from backend
  const calculateAllocatedPercentage = async (budgetId, allocatedAmount) => {
    try {
      const response =
        await budgetAllocationService.getBudgetAllocationsByBudget(budgetId);
      const allocations = response.data || [];
      const totalAllocated = allocations.reduce(
        (sum, a) => sum + (a.amount || 0),
        0
      );

      if (!allocatedAmount || allocatedAmount === 0) return 0;
      return Math.round((totalAllocated / allocatedAmount) * 100);
    } catch (error) {
      console.error("Error calculating allocated percentage:", error);
      return 0;
    }
  };

  // Allocation Handlers
  const handleAllocateClick = async (budget) => {
    try {
      // Fetch current allocations to check
      const response =
        await budgetAllocationService.getBudgetAllocationsByBudget(
          budget.budgetId
        );
      const currentAllocations = response.data || [];
      const totalAlreadyAllocated = currentAllocations.reduce(
        (sum, a) => sum + (a.amount || 0),
        0
      );

      const allocatedPercentage =
        budget.allocatedAmount > 0
          ? Math.round((totalAlreadyAllocated / budget.allocatedAmount) * 100)
          : 0;

      if (allocatedPercentage >= 100) {
        showToast(
          "Budget Fully Allocated",
          `This budget is 100% allocated (Rs.${totalAlreadyAllocated.toLocaleString(
            "en-IN"
          )} out of Rs.${budget.allocatedAmount.toLocaleString(
            "en-IN"
          )}). Please edit existing allocations instead.`,
          "warning"
        );
        return;
      }

      console.log(
        `Budget ${budget.budgetId}: Allocated ${budget.allocatedAmount}, Already used ${totalAlreadyAllocated}`
      );

      setSelectedBudget({
        ...budget,
        totalAlreadyAllocated: totalAlreadyAllocated,
      });
      setShowAllocateModal(true);
    } catch (error) {
      console.error("Error fetching allocations:", error);
      showToast("Error", "Failed to fetch allocation data", "danger");
    }
  };

  //  UPDATED: Re-fetch budgets after creating allocation
  const handleAllocationCreated = async (newAllocation) => {
    console.log(" Allocation created:", newAllocation);

    // Close modal
    setShowAllocateModal(false);
    setSelectedBudget(null);

    // Show success message
    showToast("Success", "Budget allocation created successfully", "success");

    //  RE-FETCH BUDGETS TO GET UPDATED DATA
    await fetchBudgets();
  };

  //  UPDATED: Show Allocations - Fetch from backend
  const handleShowAllocations = async (budget) => {
    console.log("Viewing allocations for budget:", budget.budgetId);

    try {
      setLoading(true);

      // Fetch allocations from backend
      const response =
        await budgetAllocationService.getBudgetAllocationsByBudget(
          budget.budgetId
        );
      const budgetAllocations = response.data || [];

      console.log("Fetched allocations:", budgetAllocations);

      const totalAllocated = budgetAllocations.reduce(
        (sum, a) => sum + (a.amount || 0),
        0
      );
      const allocatedPercentage =
        budget.allocatedAmount > 0
          ? Math.round((totalAllocated / budget.allocatedAmount) * 100)
          : 0;

      setSelectedBudgetForAllocations({
        ...budget,
        allocations: budgetAllocations,
        allocatedPercentage: allocatedPercentage,
        totalAlreadyAllocated: totalAllocated,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching allocations:", error);
      showToast("Error", "Failed to fetch allocations", "danger");
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    console.log("Back to budget list");
    setSelectedBudgetForAllocations(null);
    // Refresh budgets when going back
    fetchBudgets();
  };

  // Utilized Amount Handlers
  const handleUpdateUtilizedClick = (budget) => {
    setSelectedBudget(budget);
    setShowUpdateUtilizedModal(true);
  };

  const handleUtilizedUpdated = () => {
    setShowUpdateUtilizedModal(false);
    setSelectedBudget(null);
    fetchBudgets();
    showToast("Success", "Utilized amount updated successfully", "success");
  };

  // Toast Notification
  const showToast = (title, message, type) => {
    const toastElement = document.getElementById("budgetToast");
    if (!toastElement) return;

    const toastTitle = document.getElementById("budgetToastTitle");
    const toastBody = document.getElementById("budgetToastBody");
    const toastHeader = toastElement.querySelector(".toast-header");

    if (toastTitle) toastTitle.textContent = title;
    if (toastBody) toastBody.textContent = message;
    if (toastHeader)
      toastHeader.className = `toast-header bg-${type} text-white`;

    const toast = new Toast(toastElement);
    toast.show();
  };

  // Utility Functions
  const getUtilizationColor = (percentage) => {
    if (!percentage) return "#cbd5e1";
    if (percentage >= 90) return "#ef4444";
    if (percentage >= 75) return "#f59e0b";
    if (percentage >= 50) return "#10b981";
    return "#3b82f6";
  };

  const getAllocatedColor = (percentage) => {
    if (!percentage) return "#cbd5e1";
    if (percentage >= 100) return "#ef4444";
    if (percentage >= 75) return "#f59e0b";
    if (percentage >= 50) return "#10b981";
    return "#3b82f6";
  };

  //  Calculate allocated percentage for display (simplified version for table)
  const getDisplayAllocatedPercentage = (budget) => {
    // This is a placeholder - the real calculation happens when clicking
    return budget.allocatedPercentage || 0;
  };

  // Render
  return (
    <div className="budget-root">
      {error && (
        <div className="alert alert-danger budget-alert" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {!selectedBudgetForAllocations ? (
        <>
          {/* FILTER BAR */}
          <div className="budget-filters-container">
            <div className="filters-header">
              <h5 className="filters-title">
                <i className="bi bi-funnel"></i>
                Filters
              </h5>
              <div className="filters-right-section">
                <div className="budget-view-toggle">
                  <button
                    className={`toggle-btn ${
                      viewType === "card" ? "active" : ""
                    }`}
                    onClick={() => setViewType("card")}
                    title="Card View"
                  >
                    <i className="bi bi-grid-3x2-gap"></i>
                  </button>
                  <button
                    className={`toggle-btn ${
                      viewType === "table" ? "active" : ""
                    }`}
                    onClick={() => setViewType("table")}
                    title="Table View"
                  >
                    <i className="bi bi-list-ul"></i>
                  </button>
                </div>

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
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* CONTENT AREA */}
          {loading ? (
            <div className="budget-loading-container">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading budget allocation data...</p>
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="budget-alert-empty">
              <i className="bi bi-inbox"></i>
              <p>
                {filters.search || filters.department
                  ? "No budgets found matching your filters"
                  : "No department budgets configured"}
              </p>
            </div>
          ) : viewType === "card" ? (
            <>
              {/* CARD VIEW - Same as before */}
              <div className="budget-cards-grid">
                {currentPageData.map((budget) => {
                  const allocatedPercentage =
                    getDisplayAllocatedPercentage(budget);
                  const isFullyAllocated = allocatedPercentage >= 100;

                  return (
                    <div key={budget.budgetId} className="budget-card">
                      {/* Card content - same as your original */}
                      <div className="budget-card-header">
                        <div className="budget-card-avatar">
                          {budget.departmentName?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="budget-card-header-info">
                          <h5 className="budget-card-title">
                            {budget.departmentName}
                          </h5>
                          <p className="budget-card-year">
                            {budget.fiscalYear}
                          </p>
                        </div>
                      </div>

                      <div className="budget-card-body">
                        <div className="budget-card-row">
                          <span className="budget-card-label">
                            Total Budget
                          </span>
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
                          <span className="budget-card-label">
                            Utilization %
                          </span>
                          <span
                            className="budget-card-value"
                            style={{
                              color: getUtilizationColor(
                                budget.utilizationPercentage
                              ),
                              fontWeight: "700",
                            }}
                          >
                            {budget.utilizationPercentage || 0}%
                          </span>
                        </div>
                      </div>

                      <div className="budget-card-actions">
                        <button
                          className="budget-btn-card-action"
                          onClick={() => handleShowAllocations(budget)}
                          title="View Allocations"
                          style={{ background: "#8b5cf6", color: "#ffffff" }}
                        >
                          <i className="bi bi-eye"></i>
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PAGINATION - same as before */}
              {/* ... pagination code ... */}
            </>
          ) : (
            <>
              {/* TABLE VIEW - Same structure */}
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
                      <th className="budget-actions-header">Actions</th>
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
                        <td>
                          <div className="budget-actions">
                            <button
                              className="budget-btn-edit"
                              onClick={() => handleShowAllocations(budget)}
                              title="View Allocations"
                              style={{
                                background: "#8b5cf6",
                                color: "#ffffff",
                              }}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination same as card view */}
            </>
          )}

          {/* MODALS */}
          {showAllocateModal && selectedBudget && (
            <AllocateByCategoryModal
              show={showAllocateModal}
              budget={selectedBudget}
              onHide={() => {
                setShowAllocateModal(false);
                setSelectedBudget(null);
              }}
              onAllocationCreated={handleAllocationCreated}
            />
          )}

          {showUpdateUtilizedModal && selectedBudget && (
            <UpdateUtilizedAmountModal
              show={showUpdateUtilizedModal}
              budget={selectedBudget}
              onHide={() => {
                setShowUpdateUtilizedModal(false);
                setSelectedBudget(null);
              }}
              onUtilizedUpdated={handleUtilizedUpdated}
            />
          )}

          {/* TOAST */}
          <div className="budget-toast-container">
            <div id="budgetToast" className="toast" role="alert">
              <div className="toast-header">
                <strong className="me-auto" id="budgetToastTitle">
                  Notification
                </strong>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="toast"
                ></button>
              </div>
              <div className="toast-body" id="budgetToastBody">
                Toast message here
              </div>
            </div>
          </div>

          {/* BLUR BACKDROP */}
          <div
            className="budget-blur-backdrop"
            style={{
              display:
                showAllocateModal || showUpdateUtilizedModal ? "block" : "none",
            }}
          ></div>
        </>
      ) : (
        <>
          {/* SHOW ALLOCATIONS LIST */}
          <AllocationsList
            budget={selectedBudgetForAllocations}
            allocations={selectedBudgetForAllocations.allocations}
            onBack={handleBackToList}
            onUtilizationUpdated={(updatedAllocations) => {
              // Refresh budgets
              fetchBudgets();

              // Update current view
              setSelectedBudgetForAllocations({
                ...selectedBudgetForAllocations,
                allocations: updatedAllocations,
              });

              // Show success toast
              showToast(
                "Success",
                "Utilization updated successfully",
                "success"
              );
            }}
          />
        </>
      )}
    </div>
  );
};

export default BudgetAllocationBreakdown;
