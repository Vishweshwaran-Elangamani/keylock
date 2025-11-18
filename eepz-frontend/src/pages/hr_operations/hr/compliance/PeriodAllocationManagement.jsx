import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import budgetAllocationService from "../../../../services/hr_operations/hr/budgetAllocationService";
import periodAllocationService from "../../../../services/hr_operations/hr/periodAllocationService";
import CreatePeriodAllocationModal from "../modals/CreatePeriodAllocationModal";
import UpdatePeriodAllocationModal from "../modals/UpdatePeriodAllocationModal";
import AllocateFromPeriodModal from "../modals/AllocateFromPeriodModal";
import ViewPeriodDetailsModal from "../modals/ViewPeriodDetailsModal";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";
import "../../../../styles/hr_operations/hr/periodAllocation.css";

const PeriodAllocationManagement = () => {
  const [budgets, setBudgets] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [periodAllocations, setPeriodAllocations] = useState([]);
  const [filteredPeriods, setFilteredPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showCreatePeriodModal, setShowCreatePeriodModal] = useState(false);
  const [showUpdatePeriodModal, setShowUpdatePeriodModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // View & Pagination States
  const [viewType, setViewType] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting States
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  // Filter States
  const [filters, setFilters] = useState({
    search: "",
    year: "all",
    period: "",
    utilizationRange: "all",
  });

  // Filter Options
  const [filterOptions, setFilterOptions] = useState({
    years: [],
    periods: [],
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    if (selectedBudget) {
      fetchPeriodAllocations(selectedBudget.budgetId);
    }
  }, [selectedBudget]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [periodAllocations, filters, sortConfig]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetAllocationService.getAllDepartmentBudgets();

      if (response.success) {
        const yearFiltered = response.data || [];
        setBudgets(yearFiltered);

        if (yearFiltered.length > 0 && !selectedBudget) {
          setSelectedBudget(yearFiltered[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching budgets:", err);
      setError(err.message || "Failed to load budgets");
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodAllocations = async (budgetId) => {
    try {
      const response =
        await periodAllocationService.getPeriodAllocationsByBudget(budgetId);

      if (response.success) {
        const data = response.data || [];
        setPeriodAllocations(data);
        setFilteredPeriods(data);
        generateFilterOptions(data);
      }
    } catch (err) {
      console.error("Error fetching period allocations:", err);
      toast.error("Failed to load period allocations");
    }
  };

  const generateFilterOptions = (data) => {
    const years = [...new Set(data.map((p) => p.periodYear))].sort(
      (a, b) => b - a
    );
    const periods = [
      ...new Set(data.map((p) => p.period).filter(Boolean)),
    ].sort();

    setFilterOptions({
      years,
      periods,
    });
  };

  const applyFilters = () => {
    let filtered = periodAllocations;

    // Search filter
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter((p) => {
        const period = (p.period || "").toLowerCase();
        return (
          period.includes(query) || p.periodYear?.toString().includes(query)
        );
      });
    }

    // Year filter
    if (filters.year !== "all") {
      filtered = filtered.filter(
        (p) => p.periodYear === parseInt(filters.year)
      );
    }

    // Period filter
    if (filters.period) {
      filtered = filtered.filter((p) => p.period === filters.period);
    }

    // Utilization Range Filter
    if (filters.utilizationRange !== "all") {
      filtered = filtered.filter((p) => {
        const util = p.utilizationPercentage || 0;
        switch (filters.utilizationRange) {
          case "low":
            return util < 50;
          case "medium":
            return util >= 50 && util < 75;
          case "high":
            return util >= 75 && util < 90;
          case "critical":
            return util >= 90;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) aValue = 0;
        if (bValue === null || bValue === undefined) bValue = 0;

        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredPeriods(filtered);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <i className="bi bi-arrow-down-up period-sort-icon"></i>;
    }
    return sortConfig.direction === "asc" ? (
      <i className="bi bi-arrow-up period-sort-icon active"></i>
    ) : (
      <i className="bi bi-arrow-down period-sort-icon active"></i>
    );
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
      period: "",
      utilizationRange: "all",
    });
    setSortConfig({ key: null, direction: "asc" });
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

  const exportToCSV = () => {
    if (filteredPeriods.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const headers = [
      "Period",
      "Period Year",
      "Department",
      "Allocated Amount",
      "Utilized Amount",
      "Remaining Amount",
      "Utilization %",
      "Sub-Allocations",
    ];

    const csvData = filteredPeriods.map((period) => [
      period.period || "",
      period.periodYear || "",
      selectedBudget?.departmentName || "",
      period.allocatedAmount || 0,
      period.utilizedAmount || 0,
      period.remainingAmount || 0,
      period.utilizationPercentage || 0,
      period.subAllocationCount || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `period_allocations_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Period allocations exported successfully");
  };

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filteredPeriods.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredPeriods.slice(startIndex, endIndex);

  const handleCreatePeriod = () => {
    if (!selectedBudget) {
      toast.error("Please select a budget first");
      return;
    }
    setShowCreatePeriodModal(true);
  };

  const handleUpdatePeriod = (period) => {
    setSelectedPeriod(period);
    setShowUpdatePeriodModal(true);
  };

  const handleAllocateFromPeriod = (period) => {
    setSelectedPeriod(period);
    setShowAllocateModal(true);
  };

  const handleViewDetails = (period) => {
    setSelectedPeriod(period);
    setShowDetailsModal(true);
  };

  const handleDeletePeriod = async (periodId) => {
    if (
      !window.confirm("Are you sure you want to delete this period allocation?")
    ) {
      return;
    }

    try {
      const response = await periodAllocationService.deletePeriodAllocation(
        periodId
      );

      if (response.success) {
        toast.success("Period allocation deleted successfully");
        fetchPeriodAllocations(selectedBudget.budgetId);
        fetchBudgets();
      } else {
        toast.error(response.message || "Failed to delete period allocation");
      }
    } catch (error) {
      console.error("Error deleting period allocation:", error);
      toast.error(error.message || "Failed to delete period allocation");
    }
  };

  const handleSuccess = () => {
    if (selectedBudget) {
      fetchPeriodAllocations(selectedBudget.budgetId);
      fetchBudgets();
    }
  };

  const getUtilizationColor = (percentage) => {
    if (!percentage) return "#cbd5e1";
    if (percentage >= 90) return "#ef4444";
    if (percentage >= 75) return "#f59e0b";
    if (percentage >= 50) return "#10b981";
    return "#3b82f6";
  };

  const getUtilizationBadgeClass = (percentage) => {
    if (!percentage) return "period-utilization-badge low";
    if (percentage >= 90) return "period-utilization-badge critical";
    if (percentage >= 75) return "period-utilization-badge high";
    if (percentage >= 50) return "period-utilization-badge medium";
    return "period-utilization-badge low";
  };

  // Calculate summary statistics
  const summaryStats = {
    totalAllocated: filteredPeriods.reduce(
      (sum, p) => sum + (p.allocatedAmount || 0),
      0
    ),
    totalUtilized: filteredPeriods.reduce(
      (sum, p) => sum + (p.utilizedAmount || 0),
      0
    ),
    totalRemaining: filteredPeriods.reduce(
      (sum, p) => sum + (p.remainingAmount || 0),
      0
    ),
    avgUtilization:
      filteredPeriods.length > 0
        ? filteredPeriods.reduce(
            (sum, p) => sum + (p.utilizationPercentage || 0),
            0
          ) / filteredPeriods.length
        : 0,
  };

  if (loading) {
    return (
      <div className="period-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading period allocations...</p>
      </div>
    );
  }

  return (
    <div className="period-root">
      {error && (
        <div className="alert alert-danger period-alert" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {/* HEADER WITH BUTTON */}
      <div className="period-header">
        <div className="period-header-left">
          <h4 className="period-title">
            <i className="bi bi-calendar3-range"></i>
            Period Budget Allocation Management
          </h4>
          <p className="period-subtitle">
            Manage and distribute departmental budgets across fiscal periods
          </p>
        </div>

        <div className="period-header-actions">
          <button
            className="period-btn-export"
            onClick={exportToCSV}
            title="Export to CSV"
          >
            <i className="bi bi-download"></i>
            Export
          </button>

          <button className="period-btn-create" onClick={handleCreatePeriod}>
            <i className="bi bi-plus-circle"></i>
            Add Period Allocation
          </button>
        </div>
      </div>

      {/* BUDGET SELECTOR */}
      <div className="period-budget-selector">
        <label className="budget-selector-label">
          <i className="bi bi-building"></i>
          Select Department Budget:
        </label>
        <select
          className="budget-selector-dropdown"
          value={selectedBudget?.budgetId || ""}
          onChange={(e) => {
            const budget = budgets.find(
              (b) => b.budgetId === parseInt(e.target.value)
            );
            setSelectedBudget(budget);
          }}
        >
          {budgets.length === 0 ? (
            <option value="">No budgets available</option>
          ) : (
            budgets.map((budget) => (
              <option key={budget.budgetId} value={budget.budgetId}>
                {budget.departmentName} - FY {budget.fiscalYear} (
                {formatCurrency(budget.totalBudget)})
              </option>
            ))
          )}
        </select>
      </div>

      {selectedBudget && (
        <>
          {/* SUMMARY STATISTICS */}
          {filteredPeriods.length > 0 && (
            <div className="period-summary-cards">
              <div className="period-summary-card total">
                <div className="summary-card-icon">
                  <i className="bi bi-cash-stack"></i>
                </div>
                <div className="summary-card-content">
                  <span className="summary-card-label">Total Allocated</span>
                  <span className="summary-card-value">
                    {formatCurrency(summaryStats.totalAllocated)}
                  </span>
                </div>
              </div>

              <div className="period-summary-card utilized">
                <div className="summary-card-icon">
                  <i className="bi bi-graph-down"></i>
                </div>
                <div className="summary-card-content">
                  <span className="summary-card-label">Total Utilized</span>
                  <span className="summary-card-value">
                    {formatCurrency(summaryStats.totalUtilized)}
                  </span>
                </div>
              </div>

              <div className="period-summary-card remaining">
                <div className="summary-card-icon">
                  <i className="bi bi-wallet2"></i>
                </div>
                <div className="summary-card-content">
                  <span className="summary-card-label">Total Remaining</span>
                  <span className="summary-card-value">
                    {formatCurrency(summaryStats.totalRemaining)}
                  </span>
                </div>
              </div>

              <div className="period-summary-card average">
                <div className="summary-card-icon">
                  <i className="bi bi-speedometer2"></i>
                </div>
                <div className="summary-card-content">
                  <span className="summary-card-label">Avg Utilization</span>
                  <span className="summary-card-value">
                    {summaryStats.avgUtilization.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* FILTER BAR WITH TOGGLES */}
          <div className="period-filters-container">
            <div className="filters-header">
              <h5 className="filters-title">
                <i className="bi bi-funnel"></i>
                Filters
              </h5>
              <div className="filters-right-section">
                {/* VIEW TOGGLE BUTTONS */}
                <div className="period-view-toggle">
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
                    placeholder="Search by period..."
                    value={filters.search}
                    onChange={handleSearchChange}
                    className="filter-search"
                  />
                </div>
              </div>

              {/* YEAR FILTER */}
              <div className="filter-group">
                <label className="filter-label">Period Year</label>
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

              {/* PERIOD FILTER */}
              <div className="filter-group">
                <label className="filter-label">Period</label>
                <select
                  name="period"
                  value={filters.period}
                  onChange={handleFilterChange}
                  className="filter-select"
                >
                  <option value="">All Periods</option>
                  {filterOptions.periods.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </div>

              {/* UTILIZATION RANGE FILTER */}
              <div className="filter-group">
                <label className="filter-label">Utilization Range</label>
                <select
                  name="utilizationRange"
                  value={filters.utilizationRange}
                  onChange={handleFilterChange}
                  className="filter-select"
                >
                  <option value="all">All Ranges</option>
                  <option value="low">Low (&lt; 50%)</option>
                  <option value="medium">Medium (50-75%)</option>
                  <option value="high">High (75-90%)</option>
                  <option value="critical">Critical (≥ 90%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          {filteredPeriods.length === 0 ? (
            <div className="period-alert-empty">
              <i className="bi bi-inbox"></i>
              <p>
                {filters.search || filters.year !== "all" || filters.period
                  ? "No period allocations found matching your filters"
                  : "No period allocations configured for this budget"}
              </p>
            </div>
          ) : viewType === "card" ? (
            <>
              {/* CARD VIEW */}
              <div className="period-cards-grid">
                {currentPageData.map((period) => (
                  <div key={period.periodAllocationId} className="period-card">
                    {/* CARD HEADER */}
                    <div className="period-card-header">
                      <div className="period-card-avatar">
                        <i className="bi bi-calendar-event"></i>
                      </div>
                      <div className="period-card-header-info">
                        <h5 className="period-card-title">{period.period}</h5>
                        <p className="period-card-year">
                          Year {period.periodYear}
                        </p>
                      </div>
                    </div>

                    {/* CARD BODY */}
                    <div className="period-card-body">
                      <div className="period-card-row">
                        <span className="period-card-label">Allocated</span>
                        <span className="period-card-value">
                          {formatCurrency(period.allocatedAmount)}
                        </span>
                      </div>

                      <div className="period-card-row">
                        <span className="period-card-label">Utilized</span>
                        <span className="period-card-value">
                          {formatCurrency(period.utilizedAmount)}
                        </span>
                      </div>

                      <div className="period-card-row">
                        <span className="period-card-label">Remaining</span>
                        <span className="period-card-value">
                          {formatCurrency(period.remainingAmount)}
                        </span>
                      </div>

                      <div className="period-card-row">
                        <span className="period-card-label">Utilization</span>
                        <span
                          className={getUtilizationBadgeClass(
                            period.utilizationPercentage
                          )}
                        >
                          {period.utilizationPercentage || 0}%
                        </span>
                      </div>

                      <div className="period-card-row">
                        <span className="period-card-label">
                          Sub-Allocations
                        </span>
                        <span className="period-card-value">
                          {period.subAllocationCount || 0}
                        </span>
                      </div>

                      {period.notes && (
                        <div className="period-card-notes">
                          <i className="bi bi-sticky"></i>
                          <span>{period.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* CARD ACTIONS */}
                    <div className="period-card-actions">
                      <button
                        className="period-btn-card-action period-btn-view"
                        onClick={() => handleViewDetails(period)}
                        title="View Details"
                      >
                        <i className="bi bi-eye"></i>
                        <span>View</span>
                      </button>
                      <button
                        className="period-btn-card-action period-btn-edit"
                        onClick={() => handleUpdatePeriod(period)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                        <span>Edit</span>
                      </button>
                      <button
                        className="period-btn-card-action period-btn-allocate"
                        onClick={() => handleAllocateFromPeriod(period)}
                        title="Sub-Allocate"
                        disabled={period.remainingAmount <= 0}
                      >
                        <i className="bi bi-diagram-3"></i>
                        <span>Allocate</span>
                      </button>
                      <button
                        className="period-btn-card-action period-btn-delete"
                        onClick={() =>
                          handleDeletePeriod(period.periodAllocationId)
                        }
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <div className="pagination-left">
                    <label className="pagination-label">
                      Records per page:
                    </label>
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
                      {Math.min(startIndex + 1, filteredPeriods.length)}-
                      {Math.min(endIndex, filteredPeriods.length)} of{" "}
                      {filteredPeriods.length}
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
              )}
            </>
          ) : (
            <>
              {/* TABLE VIEW */}
              <div className="period-table-container">
                <table className="period-table">
                  <thead>
                    <tr>
                      <th
                        onClick={() => handleSort("period")}
                        className="period-sortable-header"
                      >
                        Period {getSortIcon("period")}
                      </th>
                      <th
                        onClick={() => handleSort("periodYear")}
                        className="period-sortable-header"
                      >
                        Year {getSortIcon("periodYear")}
                      </th>
                      <th
                        onClick={() => handleSort("allocatedAmount")}
                        className="period-sortable-header"
                      >
                        Allocated {getSortIcon("allocatedAmount")}
                      </th>
                      <th
                        onClick={() => handleSort("utilizedAmount")}
                        className="period-sortable-header"
                      >
                        Utilized {getSortIcon("utilizedAmount")}
                      </th>
                      <th
                        onClick={() => handleSort("remainingAmount")}
                        className="period-sortable-header"
                      >
                        Remaining {getSortIcon("remainingAmount")}
                      </th>
                      <th
                        onClick={() => handleSort("utilizationPercentage")}
                        className="period-sortable-header"
                      >
                        Utilization % {getSortIcon("utilizationPercentage")}
                      </th>
                      <th
                        onClick={() => handleSort("subAllocationCount")}
                        className="period-sortable-header"
                      >
                        Sub-Allocations {getSortIcon("subAllocationCount")}
                      </th>
                      <th className="period-actions-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageData.map((period) => (
                      <tr key={period.periodAllocationId}>
                        <td>
                          <strong>{period.period || "Unknown"}</strong>
                        </td>
                        <td>{period.periodYear}</td>
                        <td>{formatCurrency(period.allocatedAmount)}</td>
                        <td>{formatCurrency(period.utilizedAmount)}</td>
                        <td>{formatCurrency(period.remainingAmount)}</td>
                        <td>
                          <div className="period-progress-container">
                            <div
                              className="period-progress-bar"
                              style={{
                                width: `${period.utilizationPercentage || 0}%`,
                                backgroundColor: getUtilizationColor(
                                  period.utilizationPercentage
                                ),
                              }}
                            ></div>
                            <span className="period-progress-text">
                              {period.utilizationPercentage || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="period-text-center">
                          {period.subAllocationCount || 0}
                        </td>
                        <td>
                          <div className="period-actions">
                            <button
                              className="period-btn-view"
                              onClick={() => handleViewDetails(period)}
                              title="View Details"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="period-btn-edit"
                              onClick={() => handleUpdatePeriod(period)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="period-btn-allocate"
                              onClick={() => handleAllocateFromPeriod(period)}
                              title="Sub-Allocate"
                              disabled={period.remainingAmount <= 0}
                            >
                              <i className="bi bi-diagram-3"></i>
                            </button>
                            <button
                              className="period-btn-delete"
                              onClick={() =>
                                handleDeletePeriod(period.periodAllocationId)
                              }
                              title="Delete"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <div className="pagination-left">
                    <label className="pagination-label">
                      Records per page:
                    </label>
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
                      {Math.min(startIndex + 1, filteredPeriods.length)}-
                      {Math.min(endIndex, filteredPeriods.length)} of{" "}
                      {filteredPeriods.length}
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
              )}
            </>
          )}
        </>
      )}

      {/* MODALS */}
      {showCreatePeriodModal && (
        <CreatePeriodAllocationModal
          budget={selectedBudget}
          onClose={() => setShowCreatePeriodModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showUpdatePeriodModal && selectedPeriod && (
        <UpdatePeriodAllocationModal
          period={selectedPeriod}
          budget={selectedBudget}
          onClose={() => setShowUpdatePeriodModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showAllocateModal && selectedPeriod && (
        <AllocateFromPeriodModal
          period={selectedPeriod}
          budget={selectedBudget}
          onClose={() => setShowAllocateModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showDetailsModal && selectedPeriod && (
        <ViewPeriodDetailsModal
          period={selectedPeriod}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* BLUR BACKDROP */}
      <div
        className="period-blur-backdrop"
        style={{
          display:
            showCreatePeriodModal ||
            showUpdatePeriodModal ||
            showAllocateModal ||
            showDetailsModal
              ? "block"
              : "none",
        }}
      ></div>
    </div>
  );
};

export default PeriodAllocationManagement;
