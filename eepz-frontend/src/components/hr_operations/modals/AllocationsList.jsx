import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";
import UpdateUtilizationModal from "./UpdateUtilizationModal";
import { FaSearch } from "react-icons/fa";
import { Form } from "react-bootstrap";
import "../../../styles/hr_operations/hr/AllocationsList.css";


const TypeDropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const allOptions = [{ label: "All Types", value: "all" }, ...options];
  const selected = allOptions.find((o) => o.value === value) || allOptions[0];

  const handleSelect = (val) => {
    onChange({ target: { name: "type", value: val } });
    setOpen(false);
  };

  return (
    <div
      className="allocations-filter-select allocations-custom-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="allocations-custom-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="allocations-custom-arrow" />
      </div>
      {open && (
        <div className="allocations-custom-menu">
          {allOptions.map((opt) => (
            <div
              key={opt.value}
              className={
                "allocations-custom-option" +
                (opt.value === value ? " allocations-custom-option-active" : "")
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


const AllocationNameDropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const allOptions = [{ label: "All Allocations", value: "" }, ...options];
  const selected = allOptions.find((o) => o.value === value) || allOptions[0];

  const handleSelect = (val) => {
    onChange({ target: { name: "allocationName", value: val } });
    setOpen(false);
  };

  return (
    <div
      className="allocations-filter-select allocations-custom-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="allocations-custom-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="allocations-custom-arrow" />
      </div>
      {open && (
        <div className="allocations-custom-menu">
          {allOptions.map((opt) => (
            <div
              key={opt.value || "all-allocations"}
              className={
                "allocations-custom-option" +
                (opt.value === value ? " allocations-custom-option-active" : "")
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


const AllocationsList = ({
  budget,
  allocations = [],
  onBack,
  onUtilizationUpdated,
}) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [filteredAllocations, setFilteredAllocations] = useState([]);
  const [viewType, setViewType] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");

  const [filters, setFilters] = useState({
    type: "all",
    allocationName: "",
  });

  const [filterOptions, setFilterOptions] = useState({
    types: [],
    allocationNames: [],
  });

  const userRole = localStorage.getItem("userRole");
  const isDeptHead = userRole === "Department Head";

  useEffect(() => {
    generateFilterOptions(allocations);
    setFilteredAllocations(allocations);
  }, [allocations]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [allocations, activeSearchTerm, filters]);

  const generateFilterOptions = (data) => {
    const types = [
      ...new Set(data.map((a) => a.allocationType).filter(Boolean)),
    ].sort();

    const allocationNames = [
      ...new Set(
        data
          .map((a) => a.notes || a.allocationType || "Unnamed Allocation")
          .filter(Boolean)
      ),
    ].sort();

    setFilterOptions({
      types: types.map((type) => ({ label: type, value: type })),
      allocationNames: allocationNames.map((name) => ({
        label: name,
        value: name,
      })),
    });
  };

  const applyFilters = () => {
    let filtered = allocations;

    if (activeSearchTerm.trim()) {
      const query = activeSearchTerm.toLowerCase();
      filtered = filtered.filter((a) => {
        const name = (
          a.notes ||
          a.allocationType ||
          "Unnamed Allocation"
        ).toLowerCase();
        const type = (a.allocationType || "").toLowerCase();
        return name.includes(query) || type.includes(query);
      });
    }

    if (filters.type !== "all") {
      filtered = filtered.filter((a) => a.allocationType === filters.type);
    }

    if (filters.allocationName) {
      filtered = filtered.filter((a) => {
        const name = a.notes || a.allocationType || "Unnamed Allocation";
        return name === filters.allocationName;
      });
    }

    setFilteredAllocations(filtered);
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
      type: "all",
      allocationName: "",
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

  const totalPages = Math.ceil(filteredAllocations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredAllocations.slice(startIndex, endIndex);

  const getTypeColor = (type) => {
    const colors = {
      Promotion: { bg: "#fce7f3", color: "#be185d" },
      Training: { bg: "#e0e7ff", color: "#4338ca" },
      Bonus: { bg: "#dcfce7", color: "#166534" },
      Other: { bg: "#f3e8ff", color: "#7c3aed" },
    };
    return colors[type] || colors.Other;
  };

  const handleUtilizationUpdate = (updatedAllocation) => {
    const updatedAllocations = allocations.map((a) =>
      a.allocationId === updatedAllocation.allocationId ? updatedAllocation : a
    );

    if (onUtilizationUpdated) {
      onUtilizationUpdated(updatedAllocations);
    }

    setShowUpdateModal(false);
    setSelectedAllocation(null);
  };

  const summaryStats = {
    totalAllocated: filteredAllocations.reduce(
      (sum, a) => sum + (a.amount || 0),
      0
    ),
    totalUtilized: filteredAllocations.reduce(
      (sum, a) => sum + (a.utilizedAmount || 0),
      0
    ),
    avgUtilization:
      filteredAllocations.length > 0
        ? (
            filteredAllocations.reduce(
              (sum, a) => sum + (a.utilizationPercentage || 0),
              0
            ) / filteredAllocations.length
          ).toFixed(2)
        : 0,
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

  return (
    <div className="allocations-root">
      {/* BREADCRUMB */}
      <div className="allocations-header-section">
        <div className="allocations-breadcrumb">
          <button className="allocations-back-btn" onClick={onBack}>
            <i className="bi bi-arrow-left"></i>
          </button>
          <h5 className="allocations-page-title">
            <i className="bi bi-diagram-3"></i>
            Allocations for {budget?.departmentName}
          </h5>
        </div>
      </div>

      {/* STATISTICS CARDS */}
      {filteredAllocations.length > 0 && (
        <div className="allocations-stats-grid">
          <div className="allocations-stat-card">
            <div className="allocations-stat-icon allocations-stat-icon-primary">
              <i className="bi bi-cash-stack"></i>
            </div>
            <div className="allocations-stat-content">
              <h3 className="allocations-stat-value">
                {formatCurrency(summaryStats.totalAllocated)}
              </h3>
              <p className="allocations-stat-label">Total Allocated</p>
            </div>
          </div>

          <div className="allocations-stat-card">
            <div className="allocations-stat-icon allocations-stat-icon-success">
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <div className="allocations-stat-content">
              <h3 className="allocations-stat-value">
                {formatCurrency(summaryStats.totalUtilized)}
              </h3>
              <p className="allocations-stat-label">Total Utilized</p>
            </div>
          </div>

          <div className="allocations-stat-card">
            <div className="allocations-stat-icon allocations-stat-icon-warning">
              <i className="bi bi-percent"></i>
            </div>
            <div className="allocations-stat-content">
              <h3 className="allocations-stat-value">
                {summaryStats.avgUtilization}%
              </h3>
              <p className="allocations-stat-label">
                Avg Utilization
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FILTERS CARD */}
      <div className="allocations-filters-card">
        <div className="allocations-filters-content">
          <div className="allocations-search-box">
            <div className="allocations-search-inner">
              <span className="allocations-search-icon">
                <FaSearch />
              </span>
              <Form.Control
                type="text"
                placeholder="Search allocations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="allocations-search-field"
              />
              <button
                type="button"
                className="allocations-search-btn"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
          </div>

          <TypeDropdown
            value={filters.type}
            onChange={handleFilterChange}
            options={filterOptions.types}
          />

          <AllocationNameDropdown
            value={filters.allocationName}
            onChange={handleFilterChange}
            options={filterOptions.allocationNames}
          />

          <button className="allocations-clear-btn" onClick={clearFilters}>
            Clear Filters
          </button>

          <div className="allocations-results-count">
            Showing {currentPageData.length} of {filteredAllocations.length}{" "}
            allocations
          </div>
        </div>
      </div>

      {filteredAllocations.length === 0 ? (
        <div className="allocations-empty-card">
          <div className="allocations-empty-state">
            <i className="bi bi-inbox"></i>
            <p>
              {activeSearchTerm || filters.type !== "all" || filters.allocationName
                ? "No allocations found matching your filters"
                : "No allocations created yet"}
            </p>
            <small>
              {activeSearchTerm || filters.type !== "all" || filters.allocationName
                ? "Try adjusting your search criteria"
                : 'Click "Allocate" button to create new allocations'}
            </small>
          </div>
        </div>
      ) : (
        <>
          <div className="allocations-table-card">
            <div className="allocations-table-wrapper">
              <table className="allocations-table">
                <thead>
                  <tr>
                    <th>Allocation Name</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Utilized</th>
                    <th>Utilization</th>
                    {isDeptHead && <th className="allocations-text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentPageData.map((alloc) => {
                    const typeColor = getTypeColor(alloc.allocationType);
                    const utilizedAmount = alloc.utilizedAmount || 0;

                    return (
                      <tr key={alloc.allocationId}>
                        <td>
                          <div className="allocations-name-cell">
                            <strong>
                              {alloc.notes ||
                                alloc.allocationType ||
                                "Unnamed Allocation"}
                            </strong>
                          </div>
                        </td>
                        <td>
                          <span
                            className="allocations-type-badge"
                            style={{
                              backgroundColor: typeColor.bg,
                              color: typeColor.color,
                            }}
                          >
                            {alloc.allocationType}
                          </span>
                        </td>
                        <td className="allocations-amount-cell">
                          {formatCurrency(alloc.amount)}
                        </td>
                        <td>
                          <span className="allocations-utilized-amount">
                            {formatCurrency(utilizedAmount)}
                          </span>
                        </td>
                        <td>
                          <div className="allocations-progress-container">
                            <div
                              className="allocations-progress-bar"
                              style={{
                                width: `${Math.min(
                                  alloc.utilizationPercentage || 0,
                                  100
                                )}%`,
                                backgroundColor:
                                  alloc.utilizationPercentage >= 90
                                    ? "#ef4444"
                                    : alloc.utilizationPercentage >= 75
                                    ? "#f59e0b"
                                    : alloc.utilizationPercentage >= 50
                                    ? "#10b981"
                                    : "#3b82f6",
                              }}
                            ></div>
                            <span className="allocations-progress-text">
                              {alloc.utilizationPercentage || 0}%
                            </span>
                          </div>
                        </td>
                        {isDeptHead && (
                          <td>
                            <div className="allocations-action-buttons">
                              <button
                                className="allocations-action-btn allocations-action-btn-update"
                                onClick={() => {
                                  setSelectedAllocation(alloc);
                                  setShowUpdateModal(true);
                                }}
                                title="Update Utilization"
                              >
                                <i className="bi bi-cash-coin"></i>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="allocations-pagination-container">
                <div className="allocations-pagination-info">
                  <span className="allocations-pagination-label">Show</span>
                  <select
                    className="allocations-pagination-select"
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                  <span className="allocations-pagination-label">entries</span>
                </div>

                <div className="allocations-pagination-status">
                  Showing{" "}
                  {Math.min(startIndex + 1, filteredAllocations.length)}-
                  {Math.min(endIndex, filteredAllocations.length)} of{" "}
                  {filteredAllocations.length} entries
                </div>

                <nav className="allocations-pagination-nav">
                  <ul className="allocations-pagination">
                    <li
                      className={`allocations-page-item ${
                        currentPage === 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="allocations-page-link"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>

                    {getPageNumbers().map((page, index) => (
                      <li
                        key={index}
                        className={`allocations-page-item ${
                          page === currentPage ? "active" : ""
                        } ${typeof page !== "number" ? "disabled" : ""}`}
                      >
                        <button
                          className="allocations-page-link"
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
                      className={`allocations-page-item ${
                        currentPage === totalPages ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="allocations-page-link"
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

      {showUpdateModal && selectedAllocation && (
        <UpdateUtilizationModal
          show={showUpdateModal}
          allocation={selectedAllocation}
          onHide={() => {
            setShowUpdateModal(false);
            setSelectedAllocation(null);
          }}
          onUtilizationUpdated={handleUtilizationUpdate}
        />
      )}
    </div>
  );
};


export default AllocationsList;
