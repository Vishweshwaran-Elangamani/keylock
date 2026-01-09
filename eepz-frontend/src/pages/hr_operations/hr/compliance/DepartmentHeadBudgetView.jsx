import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import budgetAllocationService from "../../../../services/hr_operations/hr/budgetAllocationService";
import AllocationsList from "../../../../components/hr_operations/modals/AllocationsList";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import { FaSearch } from "react-icons/fa";
import { Form } from "react-bootstrap";
import "../../../../styles/hr_operations/hr/DeptHeadReviewModal.css";
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
      className="budget-filter-select custom-status-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
      style={{ position: "relative" }}
    >
      <div
        className="custom-status-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="custom-status-arrow" />
      </div>
      {open && (
        <div className="custom-status-menu">
          {allOptions.map((opt) => (
            <div
              key={opt.value}
              className={
                "custom-status-option" +
                (opt.value === value ? " custom-status-option-active" : "")
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
      className="budget-filter-select custom-status-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
      style={{ position: "relative" }}
    >
      <div
        className="custom-status-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="custom-status-arrow" />
      </div>
      {open && (
        <div className="custom-status-menu">
          {allOptions.map((opt) => (
            <div
              key={opt.value || "all-dept"}
              className={
                "custom-status-option" +
                (opt.value === value ? " custom-status-option-active" : "")
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
const DepartmentHeadBudgetView = () => {
  const [budgets, setBudgets] = useState([]);
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBudgetForAllocations, setSelectedBudgetForAllocations] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    year: "all",
    department: "",
  });
  const [filterOptions, setFilterOptions] = useState({
    years: [],
    departments: [],
  });
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userDepartmentName = user.departmentName || "";
  const userName = ((user.firstName || "") + " " + (user.lastName || "")).trim();
  useEffect(() => {
    if (!userDepartmentName) {
      setError("Department information not found. Please log in again.");
      setLoading(false);
      return;
    }
    fetchBudgets();
  }, []);
  useEffect(() => {
    applyFilters();
  }, [budgets, activeSearchTerm, filters]);
  const fetchBudgets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await budgetAllocationService.getAllDepartmentBudgets();
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch budgets");
      }
      const departmentBudgets = response.data.filter((budget) => {
        return (
          budget.departmentName?.trim().toLowerCase() ===
          userDepartmentName?.trim().toLowerCase()
        );
      });
      setBudgets(departmentBudgets);
      setFilteredBudgets(departmentBudgets);
      generateFilterOptions(departmentBudgets);
      if (departmentBudgets.length === 0) {
        console.warn(`No budget found for department "${userDepartmentName}"`);
        setError(
          `No budget allocated for ${userDepartmentName} department yet. Contact HR or Leadership to create a budget.`
        );
      }
    } catch (err) {
      console.error("Error fetching budgets:", err);
      setError(err.message || "Failed to fetch budgets");
      toast.error(err.message || "Failed to fetch budgets");
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
  };
  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setFilters({
      year: "all",
      department: "",
    });
  };
  const handleShowAllocations = async (budget) => {
    try {
      setLoading(true);
      const response = await budgetAllocationService.getBudgetAllocationsByBudget(
        budget.budgetId
      );
      let budgetAllocations = [];
      if (response && response.success) {
        budgetAllocations = response.data || [];
      } else if (response && response.data) {
        budgetAllocations = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.data)
          ? response.data.data
          : [];
      }
      setSelectedBudgetForAllocations({
        ...budget,
        allocations: budgetAllocations,
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching allocations:", err);
      toast.error("Failed to fetch allocations");
      setLoading(false);
    }
  };
  const handleBackToList = () => {
    setSelectedBudgetForAllocations(null);
    fetchBudgets();
  };
  const getUtilizationColor = (percentage) => {
    if (!percentage) return "#cbd5e1";
    if (percentage >= 90) return "#ef4444";
    if (percentage >= 75) return "#f59e0b";
    if (percentage >= 50) return "#10b981";
    return "#3b82f6";
  };
  const getUtilizationStatus = (percentage) => {
    if (!percentage) return { text: "No Usage", color: "#94a3b8" };
    if (percentage >= 90) return { text: "Critical", color: "#ef4444" };
    if (percentage >= 75) return { text: "High", color: "#f59e0b" };
    if (percentage >= 50) return { text: "Medium", color: "#10b981" };
    return { text: "Low", color: "#3b82f6" };
  };
  const summaryStats = filteredBudgets.length > 0 ? {
    totalBudget: filteredBudgets.reduce((sum, b) => sum + (b.totalBudget || 0), 0),
    totalAllocated: filteredBudgets.reduce((sum, b) => sum + (b.allocatedAmount || 0), 0),
    totalUtilized: filteredBudgets.reduce((sum, b) => sum + (b.utilizedAmount || 0), 0),
  } : {
    totalBudget: 0,
    totalAllocated: 0,
    totalUtilized: 0,
  };
  if (loading) {
    return (
      <div className="budget-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="budget-page">
      {!selectedBudgetForAllocations ? (
        <>
          <Breadcrumb
            items={[
              {
                label: `${userDepartmentName} Department Budget`,
              },
            ]}
          />
          {filteredBudgets.length > 0 && (
            <div className="stats-cards-budget">
              <div className="stat-card-budget stat-total-budget">
                <div className="stat-icon-budget">
                  <i className="bi bi-wallet2"></i>
                </div>
                <div className="stat-content-budget">
                  <div className="stat-value-budget">{formatCurrency(summaryStats.totalBudget)}</div>
                  <div className="stat-label-budget">Total Budget</div>
                </div>
              </div>
              <div className="stat-card-budget stat-allocated-budget">
                <div className="stat-icon-budget">
                  <i className="bi bi-cash-stack"></i>
                </div>
                <div className="stat-content-budget">
                  <div className="stat-value-budget">{formatCurrency(summaryStats.totalAllocated)}</div>
                  <div className="stat-label-budget">Total Allocated</div>
                </div>
              </div>
              <div className="stat-card-budget stat-utilized-budget">
                <div className="stat-icon-budget">
                  <i className="bi bi-graph-up-arrow"></i>
                </div>
                <div className="stat-content-budget">
                  <div className="stat-value-budget">{formatCurrency(summaryStats.totalUtilized)}</div>
                  <div className="stat-label-budget">Total Utilized</div>
                </div>
              </div>
            </div>
          )}
          {/* CONTROLS */}
          <div className="budget-controls">
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
            <div className="budget-year-filter">
              <YearDropdown
                value={filters.year}
                onChange={handleFilterChange}
                options={filterOptions.years.map((year) => ({
                  label: year.toString(),
                  value: year.toString(),
                }))}
              />
            </div>
            <div className="budget-department-filter">
              <DepartmentDropdown
                value={filters.department}
                onChange={handleFilterChange}
                options={filterOptions.departments}
              />
            </div>
            <button className="budget-btn-clear" onClick={clearFilters}>
              Clear Filters
            </button>
            <div className="budget-results-count">
              Showing {filteredBudgets.length}{" "}
              {filteredBudgets.length === 1 ? "budget" : "budgets"}
            </div>
          </div>
          {filteredBudgets.length === 0 ? (
            <div className="budget-table-card">
              <div className="budget-empty-state">
                <div className="budget-empty-content">
                  <i className="bi bi-inbox"></i>
                  <h4>No Budget Found</h4>
                  <p>
                    {budgets.length === 0
                      ? `No budget has been allocated for ${userDepartmentName} department yet.`
                      : "No budgets match your search criteria."}
                  </p>
                  {budgets.length === 0 && (
                    <small>
                      Contact HR or Leadership to allocate budget for your department.
                    </small>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="budget-table-card">
              <div className="budget-table-wrapper">
                <table className="budget-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Fiscal Year</th>
                      <th>Total Budget</th>
                      <th>Allocated</th>
                      <th>Utilized</th>
                      <th>Remaining</th>
                      <th>Utilization</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBudgets.map((budget) => {
                      const remaining =
                        (budget.allocatedAmount || 0) -
                        (budget.utilizedAmount || 0);
                      const status = getUtilizationStatus(
                        budget.utilizationPercentage
                      );
                      return (
                        <tr key={budget.budgetId}>
                          <td>
                            <strong>{budget.departmentName}</strong>
                          </td>
                          <td>{budget.fiscalYear}</td>
                          <td>{formatCurrency(budget.totalBudget)}</td>
                          <td className="budget-allocated-cell">
                            {formatCurrency(budget.allocatedAmount || 0)}
                          </td>
                          <td className="budget-utilized-cell">
                            {formatCurrency(budget.utilizedAmount || 0)}
                          </td>
                          <td className="budget-remaining-cell">
                            {formatCurrency(remaining)}
                          </td>
                          <td>
                            <div className="budget-progress-container">
                              <div
                                className="budget-progress-bar"
                                style={{
                                  width: `${Math.min(budget.utilizationPercentage || 0, 100)}%`,
                                  backgroundColor: getUtilizationColor(
                                    budget.utilizationPercentage
                                  ),
                                }}
                              ></div>
                              <span className="budget-progress-text">
                                {Math.round(budget.utilizationPercentage || 0)}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              className="budget-status-badge"
                              style={{
                                backgroundColor: status.color,
                              }}
                            >
                              {status.text}
                            </span>
                          </td>
                          <td>
                            <div className="budget-table-actions">
                              <button
                                className="budget-action-view"
                                onClick={() => handleShowAllocations(budget)}
                                title="View & Update Allocations"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <AllocationsList
          budget={selectedBudgetForAllocations}
          allocations={selectedBudgetForAllocations.allocations || []}
          onBack={handleBackToList}
          onUtilizationUpdated={(updatedAllocations) => {
            fetchBudgets();
            setSelectedBudgetForAllocations(null);
            toast.success("Utilization updated successfully");
          }}
        />
      )}
    </div>
  );
};
export default DepartmentHeadBudgetView;
