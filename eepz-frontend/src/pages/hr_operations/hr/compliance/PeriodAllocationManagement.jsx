import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import budgetAllocationService from "../../../../services/hr_operations/hr/budgetAllocationService";
import periodAllocationService from "../../../../services/hr_operations/hr/periodAllocationService";
import CreatePeriodAllocationModal from "../../../../components/hr_operations/modals/CreatePeriodAllocationModal";
import UpdatePeriodAllocationModal from "../../../../components/hr_operations/modals/UpdatePeriodAllocationModal";
import AllocateFromPeriodModal from "../../../../components/hr_operations/modals/AllocateFromPeriodModal";
import ViewPeriodDetailsModal from "../../../../components/hr_operations/modals/ViewPeriodDetailsModal";
import DeleteConfirmationModal from "../../../../components/hr_operations/modals/DeleteConfirmationModal";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";
import { Spinner } from "react-bootstrap";
import "../../../../styles/hr_operations/hr/periodAllocation.css";

const PeriodAllocationManagement = () => {
  // ===== STATE MANAGEMENT =====
  const [budgets, setBudgets] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [filteredPeriods, setFilteredPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    year: "all",
    period: "",
    utilizationRange: "all",
  });

  const [filterOptions, setFilterOptions] = useState({
    years: [],
    periods: [],
  });

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  // Summary statistics
  const [summaryStats, setSummaryStats] = useState({
    totalAllocated: 0,
    totalUtilized: 0,
    totalRemaining: 0,
    averageUtilization: 0,
  });

  // ===== EFFECTS =====
  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    if (selectedBudget) {
      fetchPeriods();
    }
  }, [selectedBudget]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [periods, filters, sortConfig]);

  useEffect(() => {
    calculateSummaryStats();
  }, [filteredPeriods]);

  // ===== DATA FETCHING =====
  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetAllocationService.getAllBudgetAllocations();
      if (response.success) {
        setBudgets(response.data || []);
        if (response.data && response.data.length > 0) {
          setSelectedBudget(response.data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast.error("Failed to load budget allocations");
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriods = async () => {
    if (!selectedBudget) return;

    try {
      setLoading(true);
      const response = await periodAllocationService.getPeriodsByBudgetId(
        selectedBudget.budgetAllocationId
      );
      if (response.success) {
        const periodsData = response.data || [];
        setPeriods(periodsData);
        extractFilterOptions(periodsData);
      }
    } catch (error) {
      console.error("Error fetching periods:", error);
      toast.error("Failed to load period allocations");
    } finally {
      setLoading(false);
    }
  };

  // ===== FILTER & SORT LOGIC =====
  const extractFilterOptions = (data) => {
    const years = [...new Set(data.map((p) => p.year))].sort((a, b) => b - a);
    const periodNames = [...new Set(data.map((p) => p.periodName))].sort();
    setFilterOptions({ years, periods: periodNames });
  };

  const applyFiltersAndSort = () => {
    let filtered = [...periods];

    // Apply search filter
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.periodName?.toLowerCase().includes(searchLower) ||
          p.year?.toString().includes(searchLower) ||
          p.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Apply year filter
    if (filters.year !== "all") {
      filtered = filtered.filter((p) => p.year === parseInt(filters.year));
    }

    // Apply period filter
    if (filters.period) {
      filtered = filtered.filter((p) => p.periodName === filters.period);
    }

    // Apply utilization range filter
    if (filters.utilizationRange !== "all") {
      filtered = filtered.filter((p) => {
        const util = p.utilizationPercentage;
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
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

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
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      year: "all",
      period: "",
      utilizationRange: "all",
    });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // ===== SUMMARY STATISTICS =====
  const calculateSummaryStats = () => {
    const stats = filteredPeriods.reduce(
      (acc, period) => {
        acc.totalAllocated += period.allocatedAmount || 0;
        acc.totalUtilized += period.utilizedAmount || 0;
        acc.totalRemaining += period.remainingAmount || 0;
        return acc;
      },
      { totalAllocated: 0, totalUtilized: 0, totalRemaining: 0 }
    );

    stats.averageUtilization =
      filteredPeriods.length > 0
        ? filteredPeriods.reduce(
            (sum, p) => sum + (p.utilizationPercentage || 0),
            0
          ) / filteredPeriods.length
        : 0;

    setSummaryStats(stats);
  };

  // ===== PAGINATION =====
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredPeriods.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredPeriods.length / itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // ===== MODAL HANDLERS =====
  const handleCreatePeriod = () => {
    if (!selectedBudget) {
      toast.error("Please select a budget first");
      return;
    }
    setShowCreateModal(true);
  };

  const handleUpdatePeriod = (period) => {
    setSelectedPeriod(period);
    setShowUpdateModal(true);
  };

  const handleAllocateFromPeriod = (period) => {
    setSelectedPeriod(period);
    setShowAllocateModal(true);
  };

  const handleViewDetails = (period) => {
    setSelectedPeriod(period);
    setShowDetailsModal(true);
  };

  const handleDeletePeriod = (period) => {
    setSelectedPeriod(period);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedPeriod) return;

    try {
      const response = await periodAllocationService.deletePeriodAllocation(
        selectedPeriod.periodAllocationId
      );
      if (response.success) {
        toast.success("Period allocation deleted successfully");
        fetchPeriods();
        setShowDeleteModal(false);
        setSelectedPeriod(null);
      }
    } catch (error) {
      console.error("Error deleting period:", error);
      toast.error("Failed to delete period allocation");
    }
  };

  // ===== EXPORT =====
  const handleExport = () => {
    if (filteredPeriods.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const headers = [
      "Period Name",
      "Year",
      "Allocated Amount",
      "Utilized Amount",
      "Remaining Amount",
      "Utilization %",
      "Notes",
    ];

    const rows = filteredPeriods.map((period) => [
      period.periodName,
      period.year,
      period.allocatedAmount,
      period.utilizedAmount,
      period.remainingAmount,
      period.utilizationPercentage?.toFixed(2),
      period.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `period_allocations_${new Date().getTime()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Data exported successfully");
  };

  // ===== UTILITY FUNCTIONS =====
  const getUtilizationColor = (percentage) => {
    if (percentage >= 90) return "#ef4444";
    if (percentage >= 75) return "#f59e0b";
    if (percentage >= 50) return "#10b981";
    return "#3b82f6";
  };

  // ===== LOADING STATE =====
  if (loading && periods.length === 0) {
    return (
      <div className="period-loading-container">
        <Spinner animation="border" variant="primary" />
        <p>Loading period allocations...</p>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div className="period-root">
      {/* Summary Statistics Cards */}
      <div className="period-summary-cards">
        <div className="period-summary-card total">
          <div className="summary-card-icon">
            <i className="bi bi-wallet2"></i>
          </div>
          <div className="summary-card-content">
            <div className="summary-card-label">Total Allocated</div>
            <div className="summary-card-value">
              {formatCurrency(summaryStats.totalAllocated)}
            </div>
          </div>
        </div>

        <div className="period-summary-card utilized">
          <div className="summary-card-icon">
            <i className="bi bi-graph-up-arrow"></i>
          </div>
          <div className="summary-card-content">
            <div className="summary-card-label">Total Utilized</div>
            <div className="summary-card-value">
              {formatCurrency(summaryStats.totalUtilized)}
            </div>
          </div>
        </div>

        <div className="period-summary-card remaining">
          <div className="summary-card-icon">
            <i className="bi bi-piggy-bank"></i>
          </div>
          <div className="summary-card-content">
            <div className="summary-card-label">Total Remaining</div>
            <div className="summary-card-value">
              {formatCurrency(summaryStats.totalRemaining)}
            </div>
          </div>
        </div>

        <div className="period-summary-card average">
          <div className="summary-card-icon">
            <i className="bi bi-percent"></i>
          </div>
          <div className="summary-card-content">
            <div className="summary-card-label">Avg Utilization</div>
            <div className="summary-card-value">
              {summaryStats.averageUtilization.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Integrated Filter Bar - Two Row Layout */}
      <div className="period-filter-section">
        {/* First Row - Budget Selector, Export, Add Period */}
        <div className="period-filter-row-top">
          <select
            className="period-filter-select period-budget-dropdown"
            value={selectedBudget?.budgetAllocationId || ""}
            onChange={(e) => {
              const budget = budgets.find(
                (b) => b.budgetAllocationId === parseInt(e.target.value)
              );
              setSelectedBudget(budget);
            }}
          >
            <option value="">Select Budget</option>
            {budgets.map((budget) => (
              <option
                key={budget.budgetAllocationId}
                value={budget.budgetAllocationId}
              >
                {budget.departmentName} - {budget.roleName} ({budget.year})
              </option>
            ))}
          </select>

          <div className="period-filter-actions-right">
            <button className="period-btn-export" onClick={handleExport}>
              <i className="bi bi-download"></i>
              Export
            </button>

            <button className="period-btn-create" onClick={handleCreatePeriod}>
              <i className="bi bi-plus-circle"></i>
              Add Period
            </button>
          </div>
        </div>

        {/* Second Row - Search and Filters */}
        <div className="period-filter-row-bottom">
          <div className="period-search-input-wrapper">
            <i className="bi bi-search period-search-icon"></i>
            <input
              type="text"
              name="search"
              placeholder="Search by period..."
              value={filters.search}
              onChange={handleSearchChange}
              className="period-filter-search"
            />
          </div>

          <select
            name="year"
            value={filters.year}
            onChange={handleFilterChange}
            className="period-filter-select"
          >
            <option value="all">All Years</option>
            {filterOptions.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            name="period"
            value={filters.period}
            onChange={handleFilterChange}
            className="period-filter-select"
          >
            <option value="">All Periods</option>
            {filterOptions.periods.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>

          <select
            name="utilizationRange"
            value={filters.utilizationRange}
            onChange={handleFilterChange}
            className="period-filter-select"
          >
            <option value="all">All Ranges</option>
            <option value="low">Low (&lt; 50%)</option>
            <option value="medium">Medium (50-75%)</option>
            <option value="high">High (75-90%)</option>
            <option value="critical">Critical (≥ 90%)</option>
          </select>

          <button className="period-clear-btn" onClick={clearFilters}>
            Clear Filters
          </button>

          <div className="period-results-count-inline">
            Showing {currentPageData.length} of {filteredPeriods.length} periods
          </div>
        </div>
      </div>

      {/* Main Content - Table View */}
      {filteredPeriods.length === 0 ? (
        <div className="period-alert-empty">
          <i className="bi bi-inbox"></i>
          <p>No period allocations found. Create one to get started!</p>
        </div>
      ) : (
        <>
          {/* TABLE VIEW */}
          <div className="period-table-container">
            <table className="period-table">
              <thead>
                <tr>
                  <th
                    className="period-sortable-header"
                    onClick={() => handleSort("periodName")}
                  >
                    Period Name
                    <i
                      className={`bi bi-arrow-${
                        sortConfig.direction === "asc" ? "up" : "down"
                      } period-sort-icon ${
                        sortConfig.key === "periodName" ? "active" : ""
                      }`}
                    ></i>
                  </th>
                  <th
                    className="period-sortable-header"
                    onClick={() => handleSort("year")}
                  >
                    Year
                    <i
                      className={`bi bi-arrow-${
                        sortConfig.direction === "asc" ? "up" : "down"
                      } period-sort-icon ${
                        sortConfig.key === "year" ? "active" : ""
                      }`}
                    ></i>
                  </th>
                  <th
                    className="period-sortable-header"
                    onClick={() => handleSort("allocatedAmount")}
                  >
                    Allocated
                    <i
                      className={`bi bi-arrow-${
                        sortConfig.direction === "asc" ? "up" : "down"
                      } period-sort-icon ${
                        sortConfig.key === "allocatedAmount" ? "active" : ""
                      }`}
                    ></i>
                  </th>
                  <th
                    className="period-sortable-header"
                    onClick={() => handleSort("utilizedAmount")}
                  >
                    Utilized
                    <i
                      className={`bi bi-arrow-${
                        sortConfig.direction === "asc" ? "up" : "down"
                      } period-sort-icon ${
                        sortConfig.key === "utilizedAmount" ? "active" : ""
                      }`}
                    ></i>
                  </th>
                  <th
                    className="period-sortable-header"
                    onClick={() => handleSort("remainingAmount")}
                  >
                    Remaining
                    <i
                      className={`bi bi-arrow-${
                        sortConfig.direction === "asc" ? "up" : "down"
                      } period-sort-icon ${
                        sortConfig.key === "remainingAmount" ? "active" : ""
                      }`}
                    ></i>
                  </th>
                  <th>Utilization</th>
                  <th className="period-text-center period-actions-header">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentPageData.map((period) => (
                  <tr key={period.periodAllocationId}>
                    <td>
                      <strong>{period.periodName}</strong>
                    </td>
                    <td>{period.year}</td>
                    <td>{formatCurrency(period.allocatedAmount)}</td>
                    <td>{formatCurrency(period.utilizedAmount)}</td>
                    <td>{formatCurrency(period.remainingAmount)}</td>
                    <td>
                      <div className="period-progress-container">
                        <div
                          className="period-progress-bar"
                          style={{
                            width: `${Math.min(
                              period.utilizationPercentage,
                              100
                            )}%`,
                            backgroundColor: getUtilizationColor(
                              period.utilizationPercentage
                            ),
                          }}
                        ></div>
                        <span className="period-progress-text">
                          {period.utilizationPercentage?.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn action-btn-edit"
                          onClick={() => handleViewDetails(period)}
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="action-btn action-btn-warning"
                          onClick={() => handleUpdatePeriod(period)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="action-btn action-btn-success"
                          onClick={() => handleAllocateFromPeriod(period)}
                          title="Sub-Allocate"
                          disabled={period.remainingAmount <= 0}
                        >
                          <i className="bi bi-diagram-3"></i>
                        </button>
                        <button
                          className="action-btn action-btn-delete"
                          onClick={() => handleDeletePeriod(period)}
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

            {/* PAGINATION */}
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
                  Showing {Math.min(startIndex + 1, filteredPeriods.length)}-
                  {Math.min(endIndex, filteredPeriods.length)} of{" "}
                  {filteredPeriods.length} entries
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
          </div>
        </>
      )}

      {/* MODALS */}
      {showCreateModal && (
        <CreatePeriodAllocationModal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          budgetAllocation={selectedBudget}
          onSuccess={() => {
            fetchPeriods();
            setShowCreateModal(false);
          }}
        />
      )}

      {showUpdateModal && selectedPeriod && (
        <UpdatePeriodAllocationModal
          show={showUpdateModal}
          onHide={() => {
            setShowUpdateModal(false);
            setSelectedPeriod(null);
          }}
          periodAllocation={selectedPeriod}
          onSuccess={() => {
            fetchPeriods();
            setShowUpdateModal(false);
            setSelectedPeriod(null);
          }}
        />
      )}

      {showAllocateModal && selectedPeriod && (
        <AllocateFromPeriodModal
          show={showAllocateModal}
          onHide={() => {
            setShowAllocateModal(false);
            setSelectedPeriod(null);
          }}
          periodAllocation={selectedPeriod}
          onSuccess={() => {
            fetchPeriods();
            setShowAllocateModal(false);
            setSelectedPeriod(null);
          }}
        />
      )}

      {showDetailsModal && selectedPeriod && (
        <ViewPeriodDetailsModal
          show={showDetailsModal}
          onHide={() => {
            setShowDetailsModal(false);
            setSelectedPeriod(null);
          }}
          periodAllocation={selectedPeriod}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmationModal
          show={showDeleteModal}
          onHide={() => {
            setShowDeleteModal(false);
            setSelectedPeriod(null);
          }}
          onConfirm={confirmDelete}
          itemName={selectedPeriod?.periodName}
          itemType="Period Allocation"
        />
      )}

      {/* Blur Backdrop */}
      {(showCreateModal ||
        showUpdateModal ||
        showAllocateModal ||
        showDetailsModal ||
        showDeleteModal) && <div className="period-blur-backdrop"></div>}
    </div>
  );
};

export default PeriodAllocationManagement;
