import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import {
  X,
  Search,
  AlertCircle,
  CheckCircle,
  UserCog,
  Info,
} from "lucide-react";
import CustomDropdown from "../../../components/project-management/common/CustomDropdown";
import PaginationFooter from "../../../components/project-management/common/PaginationFooter";
import "../../../styles/projectmanagement/modals/ManagerSelectionModal.css";

const ManagerSelectionModal = ({
  show,
  onClose,
  project,
  selectedResourceOwner,
  selectedL1Approver,
  selectedL2Approver,
  onManagerSelect,
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  setActiveSearchTerm,
  filterRole,
  setFilterRole,
  filterDepartment,
  setFilterDepartment,
  paginatedManagers,
  currentPage,
  totalPages,
  goToPage,
  getPageNumbers,
  uniqueRoles,
  uniqueDepartments,
  onUpdate,
  isSubmitting,
  message,
  itemsPerPage,
  onPageSizeChange,
  totalItems,
}) => {
  useEffect(() => {
    if (show) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [show]);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    setActiveSearchTerm(searchTerm.trim());
  };

  const handleCancelSearch = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  if (!show) return null;

  const getSelectedManager = () => {
    if (activeTab === "resource") return selectedResourceOwner;
    if (activeTab === "l1") return selectedL1Approver;
    if (activeTab === "l2") return selectedL2Approver;
    return null;
  };

  const isManagerSelected = (emp) => {
    const selected = getSelectedManager();
    return selected?.employeeMasterId === emp.employeeMasterId;
  };

  const roleOptions = ["All", ...(uniqueRoles || [])].map((r) => ({
    value: r,
    label: r === "All" ? "All Roles" : r,
  }));

  const departmentOptions = ["All", ...(uniqueDepartments || [])].map((d) => ({
    value: d,
    label: d === "All" ? "All Departments" : d,
  }));

  const safeTotal =
    typeof totalItems === "number" ? totalItems : paginatedManagers.length;
  const perPage = itemsPerPage || paginatedManagers.length || 1;
  const startIndex = safeTotal === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endIndex =
    safeTotal === 0 ? 0 : Math.min(currentPage * perPage, safeTotal);

  const modalContent = (
    <>
      <div className="msm-overlay" onClick={onClose} />

      <div className="msm-modal-shell">
        <div className="msm-modal-card">
          <div className="msm-modal-header">
            <h5 className="msm-modal-title">
              <UserCog size={20} />
              <span>
                Edit Reporting Managers
                {project?.projectName && ` - ${project.projectName}`}
              </span>
            </h5>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close"
              className="msm-modal-close"
            >
              <X size={22} />
            </button>
          </div>

          <div className="msm-body">
            {message && (
              <div
                className={`msm-alert ${
                  message.type === "success"
                    ? "msm-alert--success"
                    : "msm-alert--error"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <ul className="nav nav-pills mb-3 msm-tab-list">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link msm-tab ${
                    activeTab === "resource" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("resource")}
                >
                  <span>Resource Owner</span>
                  {selectedResourceOwner && (
                    <span className="msm-tab-badge">
                      <CheckCircle size={10} />
                    </span>
                  )}
                </button>
              </li>

              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link msm-tab ${
                    activeTab === "l1" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("l1")}
                >
                  <span>L1 Approver</span>
                  {selectedL1Approver && (
                    <span className="msm-tab-badge">
                      <CheckCircle size={10} />
                    </span>
                  )}
                </button>
              </li>

              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link msm-tab ${
                    activeTab === "l2" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("l2")}
                >
                  <span>L2 Approver</span>
                  {selectedL2Approver && (
                    <span className="msm-tab-badge">
                      <CheckCircle size={10} />
                    </span>
                  )}
                </button>
              </li>
            </ul>

            <div className="alert alert-info d-flex align-items-start gap-2 mb-3 msm-current-banner">
              <Info size={18} className="msm-info-icon" />
              <div className="msm-current-content">
                <strong className="msm-current-label">
                  Current Selection:
                </strong>
                <div className="mt-1">
                  {getSelectedManager() ? (
                    <span className="badge msm-current-badge">
                      {getSelectedManager().firstName}{" "}
                      {getSelectedManager().lastName} -{" "}
                      {getSelectedManager().roleName}
                    </span>
                  ) : (
                    <span className="text-muted msm-current-none">
                      None selected
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <div className="msm-search-wrapper">
                  <Search size={16} className="msm-search-icon" />
                  <input
                    type="text"
                    className="form-control text-start msm-search-input"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                  />

                  {activeSearchTerm ? (
                    <button
                      type="button"
                      onClick={handleCancelSearch}
                      className="msm-search-btn msm-search-btn--cancel"
                    >
                      <X size={14} />
                      <span>Cancel</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="msm-search-btn"
                    >
                      <Search size={14} />
                      <span>Search</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="col-md-3">
                <CustomDropdown
                  name="role"
                  value={filterRole}
                  onChange={(_, v) => setFilterRole(v)}
                  options={roleOptions}
                  placeholder="All Roles"
                  className="msm-filter-dd"
                  align="left"
                  offset={{ x: 0, y: 6 }}
                />
              </div>

              <div className="col-md-3">
                <CustomDropdown
                  name="department"
                  value={filterDepartment}
                  onChange={(_, v) => setFilterDepartment(v)}
                  options={departmentOptions}
                  placeholder="All Departments"
                  className="msm-filter-dd"
                  align="left"
                  offset={{ x: 0, y: 6 }}
                />
              </div>
            </div>

            <div className="table-responsive msm-table-wrapper">
              <table className="table table-hover mb-0 msm-table">
                <thead className="table-light msm-thead">
                  <tr>
                    <th className="msm-th msm-th--select">Select</th>
                    <th className="msm-th">Employee Name</th>
                    <th className="msm-th">Role</th>
                    <th className="msm-th">Department</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedManagers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-4 text-muted msm-empty-text"
                      >
                        {activeSearchTerm
                          ? "No employees found matching your search"
                          : "No employees found"}
                      </td>
                    </tr>
                  ) : (
                    paginatedManagers.map((emp) => {
                      const selected = isManagerSelected(emp);

                      return (
                        <tr
                          key={emp.employeeMasterId}
                          className={`msm-row ${
                            selected ? "msm-row--selected" : ""
                          }`}
                          onClick={() => onManagerSelect(emp)}
                        >
                          <td
                            onClick={(e) => e.stopPropagation()}
                            className="msm-td msm-td--select"
                          >
                            <input
                              type="radio"
                              className="msm-radio"
                              name={`manager-${activeTab}`}
                              checked={selected}
                              onChange={() => onManagerSelect(emp)}
                            />
                          </td>

                          <td className="msm-td msm-td--name">
                            <span className="msm-name">
                              {emp.firstName} {emp.lastName}
                            </span>
                          </td>

                          <td className="msm-td msm-td--muted">
                            {emp.roleName}
                          </td>

                          <td className="msm-td msm-td--muted">
                            {emp.departmentName}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <PaginationFooter
              totalItems={totalItems}
              currentPage={currentPage}
              setCurrentPage={goToPage}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={onPageSizeChange}
            />
          </div>

          <div className="msm-footer">
            <button
              type="button"
              onClick={onClose}
              className="msm-btn msm-btn--secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onUpdate}
              disabled={isSubmitting}
              className="msm-btn msm-btn--primary"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm msm-btn-spinner" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Update Managers
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ManagerSelectionModal;
