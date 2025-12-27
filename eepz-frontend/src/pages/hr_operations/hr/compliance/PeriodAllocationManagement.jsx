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
import { FaSearch } from "react-icons/fa";
import "../../../../styles/hr_operations/hr/PeriodAllocation.css";

/* Custom Department Dropdown */
const DepartmentDropdown = ({ budgets, selectedBudget, onChange }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (budget) => {
    onChange(budget);
    setOpen(false);
  };

  const handleSelectPlaceholder = () => {
    onChange(null);
    setOpen(false);
  };

  if (budgets.length === 0) {
    return (
      <div className="pa-filter-select pa-select-disabled">
        <div className="pa-custom-selected">
          No departments available
          <span className="pa-custom-arrow" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="pa-filter-select pa-custom-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="pa-custom-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selectedBudget
          ? `${selectedBudget.departmentName} - FY ${selectedBudget.fiscalYear}`
          : "Select Department"}
        <span className="pa-custom-arrow" />
      </div>

      {open && (
        <div className="pa-custom-menu">
          <div
            className={`pa-custom-option ${!selectedBudget ? "pa-custom-option-active" : ""}`}
            onClick={handleSelectPlaceholder}
          >
            Select Department
          </div>

          {budgets.map((budget) => (
            <div
              key={budget.budgetId}
              className={`pa-custom-option ${
                selectedBudget?.budgetId === budget.budgetId
                  ? "pa-custom-option-active"
                  : ""
              }`}
              onClick={() => handleSelect(budget)}
            >
              <div className="pa-option-content">
                <span className="pa-option-title">
                  {budget.departmentName} - FY {budget.fiscalYear}
                </span>
                <span className="pa-option-subtitle">
                  Budget: {formatCurrency(budget.totalBudget)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* Custom Year Dropdown */
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
      className="pa-filter-select pa-custom-dropdown pa-select-compact"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="pa-custom-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="pa-custom-arrow" />
      </div>

      {open && (
        <div className="pa-custom-menu">
          {allOptions.map((opt) => (
            <div
              key={opt.value}
              className={`pa-custom-option ${
                opt.value === value ? "pa-custom-option-active" : ""
              }`}
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

  const [showCreatePeriodModal, setShowCreatePeriodModal] = useState(false);
  const [showUpdatePeriodModal, setShowUpdatePeriodModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const [filters, setFilters] = useState({
    year: "all",
  });

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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
      return <i className="bi bi-arrow-down-up pa-sort-icon"></i>;
    }
    return sortConfig.direction === "asc" ? (
      <i className="bi bi-arrow-up pa-sort-icon active"></i>
    ) : (
      <i className="bi bi-arrow-down pa-sort-icon active"></i>
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
      <div className="pa-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="pa-loading-text">Loading period allocations...</p>
      </div>
    );
  }

  return (
    <div className="pa-page-container">
      {error && (
        <div className="alert alert-danger pa-alert-banner">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <span>{error}</span>
        </div>
      )}

      {/* ULTRA COMPACT HEADER - EVERYTHING IN ONE LINE */}
<div className="pa-compact-header">
  <div className="pa-compact-left">
    <i className="bi bi-calendar3"></i>
    <span className="pa-compact-title">Period Allocations</span>
  </div>
  
  <div className="pa-compact-center">
    <DepartmentDropdown
      budgets={budgets}
      selectedBudget={selectedBudget}
      onChange={setSelectedBudget}
    />
  </div>
  
  <div className="pa-compact-right">
    <button className="pa-btn-export-compact" onClick={exportToCSV}>
      <i className="bi bi-download"></i>
      Export CSV
    </button>
    <button
      className="pa-btn-add-compact"
      onClick={handleCreatePeriod}
      disabled={!selectedBudget}
    >
      <i className="bi bi-plus-circle"></i>
      Add Period
    </button>
  </div>
</div>


      {selectedBudget ? (
        <>
          {/* STATISTICS CARDS */}
          {filteredPeriods.length > 0 && (
            <div className="pa-stats-grid">
              <div className="pa-stat-card">
                <div className="pa-stat-icon pa-stat-icon-primary">
                  <i className="bi bi-wallet2"></i>
                </div>
                <div className="pa-stat-content">
                  <h3 className="pa-stat-value">
                    {formatCurrency(summaryStats.totalAllocated)}
                  </h3>
                  <p className="pa-stat-label">Total Allocated</p>
                </div>
              </div>

              <div className="pa-stat-card">
                <div className="pa-stat-icon pa-stat-icon-success">
                  <i className="bi bi-calendar-check"></i>
                </div>
                <div className="pa-stat-content">
                  <h3 className="pa-stat-value">{summaryStats.totalPeriods}</h3>
                  <p className="pa-stat-label">Active Periods</p>
                </div>
              </div>

              <div className="pa-stat-card">
                <div className="pa-stat-icon pa-stat-icon-info">
                  <i className="bi bi-diagram-3"></i>
                </div>
                <div className="pa-stat-content">
                  <h3 className="pa-stat-value">
                    {summaryStats.totalSubAllocations}
                  </h3>
                  <p className="pa-stat-label">Sub-Allocations</p>
                </div>
              </div>
            </div>
          )}

          {/* FILTERS CARD */}
          <div className="pa-filters-card">
            <div className="pa-filters-content">
              {/* Search with Button */}
              <div className="pa-search-box">
                <div className="pa-search-inner">
                  <span className="pa-search-icon">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    placeholder="Search periods..."
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSearchClick();
                      }
                    }}
                    className="pa-search-input"
                  />
                  <button
                    type="button"
                    className="pa-search-btn"
                    onClick={handleSearchClick}
                  >
                    Search
                  </button>
                </div>
              </div>

              <YearDropdown
                value={filters.year}
                onChange={(val) => setFilters((prev) => ({ ...prev, year: val }))}
                years={filterOptions.years}
              />

              {(searchTerm || filters.year !== "all") && (
                <button className="pa-btn-clear" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}

              <div className="pa-results-count">
                Showing {filteredPeriods.length}{" "}
                {filteredPeriods.length === 1 ? "period" : "periods"}
              </div>
            </div>
          </div>

          {/* TABLE OR EMPTY STATE */}
          {filteredPeriods.length === 0 ? (
            <div className="pa-table-card">
              <div className="pa-empty-state">
                <i className="bi bi-calendar-x"></i>
                <p>
                  {searchTerm || filters.year !== "all"
                    ? "No matching periods found"
                    : "No period allocations yet"}
                </p>
                {!searchTerm && filters.year === "all" && (
                  <button
                    className="pa-btn pa-btn-primary"
                    onClick={handleCreatePeriod}
                  >
                    <i className="bi bi-plus-circle"></i>
                    Create Period
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="pa-table-card">
                <div className="pa-table-wrapper">
                  <table className="pa-table">
                    <thead>
                      <tr>
                        <th
                          onClick={() => handleSort("period")}
                          className="pa-th-sortable"
                        >
                          <div className="pa-th-content">
                            <span>Period</span>
                            {getSortIcon("period")}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("periodYear")}
                          className="pa-th-sortable"
                        >
                          <div className="pa-th-content">
                            <span>Year</span>
                            {getSortIcon("periodYear")}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("allocatedAmount")}
                          className="pa-th-sortable"
                        >
                          <div className="pa-th-content">
                            <span>Allocated Amount</span>
                            {getSortIcon("allocatedAmount")}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("subAllocationCount")}
                          className="pa-th-sortable"
                        >
                          <div className="pa-th-content">
                            <span>Sub-Allocations</span>
                            {getSortIcon("subAllocationCount")}
                          </div>
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPageData.map((period) => (
                        <tr key={period.periodAllocationId}>
                          <td>
                            <div className="pa-period-info">
                              <span className="pa-period-name">
                                {period.period || "Unknown"}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="pa-year-badge">
                              {period.periodYear}
                            </span>
                          </td>
                          <td>
                            <span className="pa-amount">
                              {formatCurrency(period.allocatedAmount)}
                            </span>
                          </td>
                          <td>
                            <span className="pa-sub-badge">
                              {period.subAllocationCount || 0}
                            </span>
                          </td>
                          <td>
                            <div className="pa-action-buttons">
                              <button
                                className="pa-action-btn pa-action-view"
                                onClick={() => handleViewDetails(period)}
                                title="View Details"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button
                                className="pa-action-btn pa-action-edit"
                                onClick={() => handleUpdatePeriod(period)}
                                title="Edit Period"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="pa-action-btn pa-action-allocate"
                                onClick={() => handleAllocateFromPeriod(period)}
                                title="Create Sub-Allocation"
                              >
                                <i className="bi bi-diagram-3"></i>
                              </button>
                              <button
                                className="pa-action-btn pa-action-delete"
                                onClick={() => handleDeletePeriod(period)}
                                title="Delete Period"
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
                  <div className="pa-pagination-container">
                    <div className="pa-pagination-info">
                      <span className="pa-pagination-label">Show</span>
                      <select
                        className="pa-pagination-select"
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                      </select>
                      <span className="pa-pagination-label">entries</span>
                    </div>

                    <div className="pa-pagination-status">
                      Showing {startIndex + 1} to{" "}
                      {Math.min(endIndex, filteredPeriods.length)} of{" "}
                      {filteredPeriods.length} entries
                    </div>

                    <nav className="pa-pagination-nav">
                      <ul className="pa-pagination">
                        <li
                          className={`pa-page-item ${
                            currentPage === 1 ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="pa-page-link"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                        </li>

                        {getPageNumbers().map((page, index) => (
                          <li
                            key={index}
                            className={`pa-page-item ${
                              page === currentPage ? "active" : ""
                            } ${typeof page !== "number" ? "disabled" : ""}`}
                          >
                            <button
                              className="pa-page-link"
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
                          className={`pa-page-item ${
                            currentPage === totalPages ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="pa-page-link"
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
        </>
      ) : (
        <div className="pa-table-card">
          <div className="pa-empty-state">
            <i className="bi bi-building"></i>
            <p>Select a Department to View</p>
          </div>
        </div>
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
    </div>
  );
};

export default PeriodAllocationManagement;
