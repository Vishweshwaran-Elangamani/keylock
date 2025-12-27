




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
import "../../../../styles/hr_operations/hr/PeriodAllocation.css";

/* Custom Department Dropdown - UNIFORM STYLE */
const DepartmentDropdown = ({ budgets, selectedBudget, onChange }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (budget) => {
    onChange(budget);
    setOpen(false);
  };

  const handleSelectPlaceholder = () => {
    onChange(null); // Clear selection
    setOpen(false);
  };

  if (budgets.length === 0) {
    return (
      <div className="period-uniform-dropdown disabled">
        <div className="period-uniform-selected">
          No departments available
        </div>
      </div>
    );
  }

  return (
    <div
      className="period-uniform-dropdown period-dept-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="period-uniform-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selectedBudget
          ? `${selectedBudget.departmentName} - FY ${selectedBudget.fiscalYear}`
          : "Select Department"}
        <i className={`bi bi-chevron-${open ? "up" : "down"} period-uniform-arrow`}></i>
      </div>

      {open && (
        <div className="period-uniform-menu">
          {/* ADD PLACEHOLDER OPTION AT TOP */}
          <div
            className={
              "period-uniform-option period-uniform-option-placeholder" +
              (!selectedBudget ? " period-uniform-option-active" : "")
            }
            onClick={handleSelectPlaceholder}
          >
            <div className="period-uniform-option-main">
              Select Department
            </div>
          </div>

          {/* THEN ALL DEPARTMENT OPTIONS */}
          {budgets.map((budget) => (
            <div
              key={budget.budgetId}
              className={
                "period-uniform-option" +
                (selectedBudget?.budgetId === budget.budgetId
                  ? " period-uniform-option-active"
                  : "")
              }
              onClick={() => handleSelect(budget)}
            >
              <div className="period-uniform-option-main">
                {budget.departmentName} - FY {budget.fiscalYear}
              </div>
              <div className="period-uniform-option-sub">
                {formatCurrency(budget.totalBudget)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* Custom Year Dropdown - UNIFORM STYLE */
const YearDropdown = ({ value, onChange, years }) => {
  const [open, setOpen] = useState(false);

  const allOptions = [
    { label: "All Years", value: "all" },
    ...years.map((year) => ({ label: year.toString(), value: year.toString() })),
  ];

  const selected = allOptions.find((o) => o.value === value) || allOptions[0];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="period-uniform-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="period-uniform-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <i className={`bi bi-chevron-${open ? "up" : "down"} period-uniform-arrow`}></i>
      </div>

      {open && (
        <div className="period-uniform-menu">
          {allOptions.map((opt) => (
            <div
              key={opt.value}
              className={
                "period-uniform-option" +
                (opt.value === value ? " period-uniform-option-active" : "")
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

  // Delete Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View & Pagination States
  const [viewType, setViewType] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting States
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  // Filters
  const [filters, setFilters] = useState({
    year: "all",
  });

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter Options
  const [filterOptions, setFilterOptions] = useState({
    years: [],
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    if (selectedBudget) {
      fetchPeriodAllocations(selectedBudget.budgetId);
    } else {
      setPeriodAllocations([]);
      setFilteredPeriods([]);
    }
  }, [selectedBudget]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [periodAllocations, filters, sortConfig, searchTerm]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetAllocationService.getAllDepartmentBudgets();

      if (response.success) {
        const yearFiltered = response.data || [];
        setBudgets(yearFiltered);
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

    setFilterOptions({
      years,
    });
  };

  const applyFilters = () => {
    let filtered = periodAllocations;

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((p) => {
        const period = (p.period || "").toLowerCase();
        return (
          period.includes(query) || p.periodYear?.toString().includes(query)
        );
      });
    }

    if (filters.year !== "all") {
      filtered = filtered.filter(
        (p) => p.periodYear === parseInt(filters.year)
      );
    }

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

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchClick = () => {
    setSearchTerm(searchInput.trim());
  };

  const clearFilters = () => {
    setFilters({
      year: "all",
    });
    setSearchInput("");
    setSearchTerm("");
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
      "Sub-Allocations",
    ];

    const csvData = filteredPeriods.map((period) => [
      period.period || "",
      period.periodYear || "",
      selectedBudget?.departmentName || "",
      period.allocatedAmount || 0,
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

  const handleDeletePeriod = (period) => {
    setPeriodToDelete(period);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!periodToDelete) return;

    setIsDeleting(true);
    try {
      const response = await periodAllocationService.deletePeriodAllocation(
        periodToDelete.periodAllocationId
      );

      if (response.success) {
        toast.success("Period allocation deleted successfully");
        fetchPeriodAllocations(selectedBudget.budgetId);
        fetchBudgets();
        setShowDeleteModal(false);
        setPeriodToDelete(null);
      } else {
        toast.error(response.message || "Failed to delete period allocation");
      }
    } catch (error) {
      console.error("Error deleting period allocation:", error);
      toast.error(error.message || "Failed to delete period allocation");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPeriodToDelete(null);
  };

  const handleSuccess = () => {
    if (selectedBudget) {
      fetchPeriodAllocations(selectedBudget.budgetId);
      fetchBudgets();
    }
  };

  const summaryStats = {
    totalAllocated: filteredPeriods.reduce(
      (sum, p) => sum + (p.allocatedAmount || 0),
      0
    ),
    totalPeriods: filteredPeriods.length,
    totalSubAllocations: filteredPeriods.reduce(
      (sum, p) => sum + (p.subAllocationCount || 0),
      0
    ),
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

      {selectedBudget && filteredPeriods.length > 0 && (
        <div className="period-summary-cards">
          <div className="period-summary-card total">
            <div className="period-summary-card-icon">
              <i className="bi bi-wallet2"></i>
            </div>
            <div className="period-summary-card-content">
              <div className="period-summary-card-value">
                {formatCurrency(summaryStats.totalAllocated)}
              </div>
              <div className="period-summary-card-label">Total Allocated</div>
            </div>
          </div>

          <div className="period-summary-card utilized">
            <div className="period-summary-card-icon">
              <i className="bi bi-calendar-range"></i>
            </div>
            <div className="period-summary-card-content">
              <div className="period-summary-card-value">
                {summaryStats.totalPeriods}
              </div>
              <div className="period-summary-card-label">Total Periods</div>
            </div>
          </div>

          <div className="period-summary-card remaining">
            <div className="period-summary-card-icon">
              <i className="bi bi-diagram-3"></i>
            </div>
            <div className="period-summary-card-content">
              <div className="period-summary-card-value">
                {summaryStats.totalSubAllocations}
              </div>
              <div className="period-summary-card-label">Sub-Allocations</div>
            </div>
          </div>
        </div>
      )}

      <div className="period-filter-section">
        {/* ALL FILTERS IN ONE SINGLE ROW */}
        <div className="period-filter-row-single">
          {/* Search Input */}
          <div className="period-search-wrapper">
            <input
              type="text"
              placeholder="Search by period or year..."
              value={searchInput}
              onChange={handleSearchInputChange}
              className="period-search-input"
            />
            <button
              type="button"
              className="period-search-btn"
              onClick={handleSearchClick}
            >
              Search
            </button>
          </div>

          {/* Department Dropdown */}
          <DepartmentDropdown
            budgets={budgets}
            selectedBudget={selectedBudget}
            onChange={setSelectedBudget}
          />

          {/* Year Dropdown */}
          <YearDropdown
            value={filters.year}
            onChange={(val) => setFilters((prev) => ({ ...prev, year: val }))}
            years={filterOptions.years}
          />

          {/* Clear Filters Button */}
          <button className="period-clear-btn" onClick={clearFilters}>
            Clear Filters
          </button>

          {/* SPACER */}
          <div className="period-filter-spacer"></div>

          {/* Export Button */}
          <button className="period-btn-export" onClick={exportToCSV}>
            <i className="bi bi-download"></i>
            Export
          </button>

          {/* Add Period Button */}
          <button className="period-btn-create" onClick={handleCreatePeriod}>
            <i className="bi bi-plus-circle"></i>
            Add Period
          </button>
        </div>

        {/* Results Count Row */}
        <div className="period-results-count-row">
          <span className="period-results-count-inline">
            Showing {currentPageData.length} of {filteredPeriods.length} periods
          </span>
        </div>
      </div>

      {selectedBudget ? (
        <>
          {filteredPeriods.length === 0 ? (
            <div className="period-alert-empty">
              <i className="bi bi-inbox"></i>
              <p>
                {searchTerm || filters.year !== "all"
                  ? "No period allocations found matching your filters"
                  : "No period allocations configured for this budget"}
              </p>
            </div>
          ) : (
            <>
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
                        <td>{period.subAllocationCount || 0}</td>
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
              </div>

              {filteredPeriods.length > 0 && (
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
                          if (
                            page >= currentPage - 1 &&
                            page <= currentPage + 1
                          )
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
        </>
      ) : (
        <div className="period-alert-empty">
          <i className="bi bi-info-circle"></i>
          <p>Please select a department to view period allocations</p>
        </div>
      )}

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

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this period allocation?"
        itemName={
          periodToDelete
            ? `${periodToDelete.period} - ${periodToDelete.periodYear}`
            : ""
        }
        isDeleting={isDeleting}
      />

      <div
        className="period-blur-backdrop"
        style={{
          display:
            showCreatePeriodModal ||
            showUpdatePeriodModal ||
            showAllocateModal ||
            showDetailsModal ||
            showDeleteModal
              ? "block"
              : "none",
        }}
      ></div>
    </div>
  );
};

export default PeriodAllocationManagement;

