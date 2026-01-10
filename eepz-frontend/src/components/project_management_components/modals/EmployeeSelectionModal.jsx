import React, { useState, useEffect, useRef } from "react";
import { UserCog, X, CheckCircle, Search } from "lucide-react";
import "../../../styles/projectmanagement/modals/EmployeeSelectionModal.css";

const PRIMARY = "#27235C";

const EmployeeSelectionModal = ({
  show,
  onClose,
  employees,
  activeTab,
  setActiveTab,
  selectedResourceOwner,
  selectedL1Approver,
  selectedL2Approver,
  onSelectManager,
  onConfirm,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterDepartment]);

  const handleSearch = () => {
    if (!searchInput.trim()) return;
    setSearchTerm(searchInput.trim());
    setCurrentPage(1);
  };

  const handleCancelSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const getFilteredManagers = () => {
    return employees.filter((emp) => {
      const searchMatch =
        !searchTerm ||
        `${emp.firstName} ${emp.lastName} ${emp.roleName} ${emp.departmentName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const roleMatch = filterRole === "All" || emp.roleName === filterRole;
      const deptMatch =
        filterDepartment === "All" || emp.departmentName === filterDepartment;
      return searchMatch && roleMatch && deptMatch;
    });
  };

  const getUniqueRoles = () => {
    const roles = [...new Set(employees.map((emp) => emp.roleName))];
    return roles.sort((a, b) => a.localeCompare(b));
  };

  const getUniqueDepartments = () => {
    const depts = [...new Set(employees.map((emp) => emp.departmentName))];
    return depts.sort((a, b) => a.localeCompare(b));
  };

  const filteredManagers = getFilteredManagers();
  const totalPages = Math.ceil(filteredManagers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedManagers = filteredManagers.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const CustomFilterDropdown = ({ value, onChange, options, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    });

    const handleSelect = (optionValue) => {
      onChange(optionValue);
      setIsOpen(false);
    };

    return (
      <div className="prj-custom-filter-dropdown" ref={dropdownRef}>
        <button
          type="button"
          className={`prj-custom-filter-select ${isOpen ? "open" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="prj-custom-filter-value">
            {value || placeholder}
          </span>
          <span className="prj-custom-filter-arrow">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              className={isOpen ? "prj-custom-filter-arrow-svg-open" : ""}
            >
              <polyline
                points="6 9 12 15 18 9"
                fill="none"
                stroke={PRIMARY}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
        {isOpen && (
          <ul className="prj-custom-filter-list">
            {options.map((opt, idx) => (
              <li
                key={idx}
                className={`prj-custom-filter-option ${
                  value === opt ? "selected" : ""
                } prj-custom-filter-option-left`}
                onClick={() => handleSelect(opt)}
              >
                {opt}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  if (!show) return null;

  const getCurrentSelection = () => {
    if (activeTab === "resource") return selectedResourceOwner;
    if (activeTab === "l1") return selectedL1Approver;
    if (activeTab === "l2") return selectedL2Approver;
    return null;
  };

  const currentSelection = getCurrentSelection();

  return (
    <>
      <div className="prj-modal-backdrop" onClick={onClose} />
      <div className="prj-modal-overlay">
        <div className="prj-modal-container">
          <div className="prj-modal-header">
            <div className="prj-modal-header-content">
              <UserCog size={24} />
              <h3 className="prj-modal-title">Select Manager</h3>
            </div>
            <button
              type="button"
              className="prj-modal-close"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>

          <div className="prj-modal-tabs">
            <button
              type="button"
              className={`prj-modal-tab ${
                activeTab === "resource" ? "active" : ""
              }`}
              onClick={() => setActiveTab("resource")}
            >
              <span>Resource Owner</span>
              {activeTab === "resource" && selectedResourceOwner && (
                <CheckCircle size={16} className="prj-tab-icon" />
              )}
            </button>
            <button
              type="button"
              className={`prj-modal-tab ${activeTab === "l1" ? "active" : ""}`}
              onClick={() => setActiveTab("l1")}
            >
              <span>L1 Approver</span>
              {activeTab === "l1" && selectedL1Approver && (
                <CheckCircle size={16} className="prj-tab-icon" />
              )}
            </button>
            <button
              type="button"
              className={`prj-modal-tab ${activeTab === "l2" ? "active" : ""}`}
              onClick={() => setActiveTab("l2")}
            >
              <span>L2 Approver</span>
              {activeTab === "l2" && selectedL2Approver && (
                <CheckCircle size={16} className="prj-tab-icon" />
              )}
            </button>
          </div>

          {currentSelection && (
            <div className="prj-modal-info">
              <span className="prj-info-icon">ℹ️</span>
              <div className="prj-info-content">
                <span className="prj-info-label">Currently Selected:</span>
                <span className="prj-info-badge">
                  {currentSelection.firstName} {currentSelection.lastName}
                </span>
              </div>
            </div>
          )}

          <div className="prj-modal-filters">
            <div className="prj-filter-search-container">
              <Search size={18} className="prj-search-icon-left" />
              <input
                type="text"
                className="prj-search-input-with-btn"
                placeholder="Search by name, role, or department..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              {searchInput && (
                <button
                  type="button"
                  className="prj-search-clear-btn"
                  onClick={handleCancelSearch}
                >
                  <X size={16} />
                </button>
              )}
              {searchTerm ? (
                <button
                  type="button"
                  className="prj-search-btn-inside prj-btn-cancel"
                  onClick={handleCancelSearch}
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSearch}
                  className="prj-search-btn-inside"
                >
                  <Search size={16} />
                  <span>Search</span>
                </button>
              )}
            </div>

            <CustomFilterDropdown
              value={filterRole === "All" ? "All Roles" : filterRole}
              onChange={(v) => setFilterRole(v === "All Roles" ? "All" : v)}
              options={["All Roles", ...getUniqueRoles()]}
              placeholder="All Roles"
            />

            <CustomFilterDropdown
              value={
                filterDepartment === "All"
                  ? "All Departments"
                  : filterDepartment
              }
              onChange={(v) =>
                setFilterDepartment(v === "All Departments" ? "All" : v)
              }
              options={["All Departments", ...getUniqueDepartments()]}
              placeholder="All Departments"
            />
          </div>

          <div className="prj-modal-body">
            <div className="prj-table-wrapper">
              <table className="prj-table">
                <thead>
                  <tr>
                    <th className="prj-table-select-col">Select</th>
                    <th className="prj-col-name">Employee Name</th>
                    <th className="prj-col-role">Role</th>
                    <th className="prj-col-dept">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedManagers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="prj-table-empty">
                        No employees found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedManagers.map((emp) => {
                      const isSelected =
                        (activeTab === "resource" &&
                          selectedResourceOwner?.employeeMasterId ===
                            emp.employeeMasterId) ||
                        (activeTab === "l1" &&
                          selectedL1Approver?.employeeMasterId ===
                            emp.employeeMasterId) ||
                        (activeTab === "l2" &&
                          selectedL2Approver?.employeeMasterId ===
                            emp.employeeMasterId);

                      return (
                        <tr
                          key={emp.employeeMasterId}
                          className={
                            isSelected ? "prj-table-row-selected" : ""
                          }
                          onClick={() => onSelectManager(emp)}
                        >
                          <td className="prj-table-select-col">
                            <input
                              type="radio"
                              className="prj-radio"
                              checked={isSelected}
                              onChange={() => onSelectManager(emp)}
                            />
                          </td>
                          <td className="prj-col-name">
                            {emp.firstName} {emp.lastName}
                          </td>
                          <td className="prj-col-role">{emp.roleName}</td>
                          <td className="prj-col-dept">{emp.departmentName}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="prj-pagination">
                <button
                  className="prj-page-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ‹
                </button>
                {getPageNumbers().map((page, idx) =>
                  page === "..." ? (
                    <span key={`dots-${idx}`} className="prj-page-dots">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      className={`prj-page-btn ${
                        currentPage === page ? "active" : ""
                      }`}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  className="prj-page-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  ›
                </button>
              </div>
            )}
          </div>

          <div className="prj-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="prj-btn prj-btn-secondary"
            >
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="prj-btn prj-btn-primary"
            >
              <CheckCircle size={18} />
              <span>Confirm Selection</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeSelectionModal;
