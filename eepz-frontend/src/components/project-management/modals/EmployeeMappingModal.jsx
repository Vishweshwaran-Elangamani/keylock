
import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import {
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  Search,
  Check,
  X,
} from "lucide-react";
import CustomDropdown from "../../../components/project-management/common/CustomDropdown";
import "../../../styles/projectmanagement/modals/EmployeeMappingModal.css";

const EmployeeMappingModal = ({
  show,
  onClose,
  project,
  filteredEmployees,
  mappedEmployees,
  selectedEmployeeIds,
  primaryEmployeeIds,
  setPrimaryEmployeeIds,
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  setActiveSearchTerm,
  filterRole,
  setFilterRole,
  filterDepartment,
  setFilterDepartment,
  filterStatus,
  setFilterStatus,
  uniqueRoles,
  uniqueDepartments,
  onEmployeeSelect,
  onPrimaryToggle,
  onSelectAll,
  onMap,
  onUnmap,
  isSubmitting,
  message,
  isLoadingData,
  getMappedCount,
  getUnmappedCount,
  hasSelectedMapped,
  hasSelectedUnmapped,
}) => {
 
  useEffect(() => {
    if (show) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [show]);

  useEffect(() => {
    if (!show) return;
    if (!Array.isArray(mappedEmployees) || mappedEmployees.length === 0) return;
    if (typeof setPrimaryEmployeeIds !== "function") return;

    const serverPrimaryMasterIds = mappedEmployees
      .filter(
        (m) => m?.isPrimary === true && Number.isInteger(m?.employeeMasterId)
      )
      .map((m) => m.employeeMasterId);

    if (serverPrimaryMasterIds.length === 0) return;

    setPrimaryEmployeeIds((prev = []) => {
      const prevSet = new Set(prev);
      let changed = false;
      for (const id of serverPrimaryMasterIds) {
        if (!prevSet.has(id)) {
          prevSet.add(id);
          changed = true;
        }
      }
      return changed ? Array.from(prevSet) : prev;
    });
  }, [show, mappedEmployees, setPrimaryEmployeeIds]);

  if (!show) return null;

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

  const getProjectManagerIds = () => {
    if (!project) return [];
    const managerIds = [];
    if (project.resourceOwner?.employeeMasterId)
      managerIds.push(project.resourceOwner.employeeMasterId);
    if (project.l1Approver?.employeeMasterId)
      managerIds.push(project.l1Approver.employeeMasterId);
    if (project.l2Approver?.employeeMasterId)
      managerIds.push(project.l2Approver.employeeMasterId);
    return managerIds;
  };

  const displayEmployees = (filteredEmployees || []).filter(
    (emp) => emp.roleName && emp.roleName.toLowerCase() !== "admin"
  );

  const displayUniqueRoles = (uniqueRoles || []).filter(
    (role) => role && role.toLowerCase() !== "admin"
  );

  const roleOptions = ["All", ...displayUniqueRoles].map((r) => ({
    value: r,
    label: r === "All" ? "All Roles" : r,
  }));

  const departmentOptions = ["All", ...(uniqueDepartments || [])].map((d) => ({
    value: d,
    label: d === "All" ? "All Departments" : d,
  }));

  const statusOptions = ["All", "Mapped", "Unmapped"].map((s) => ({
    value: s,
    label: s === "All" ? "All Status" : s,
  }));

  const modalContent = (
    <>
      <div className="emm-overlay" onClick={onClose} />

      <div className="emm-modal-shell">
        <div className="emm-modal-card">
          <div className="emm-modal-header">
            <h5 className="emm-modal-title">
              <Users size={20} />
              <span>
                Map/Unmap Employees
                {project?.projectName && ` - ${project.projectName}`}
              </span>
            </h5>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="emm-modal-close"
              disabled={isSubmitting}
            >
              <X size={22} />
            </button>
          </div>

          <div className="emm-body">
            {message && (
              <div
                className={`emm-alert ${
                  message.type === "success"
                    ? "emm-alert--success"
                    : "emm-alert--error"
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

            {getProjectManagerIds().length > 0 && (
              <div className="emm-info-banner">
                <Info size={18} className="emm-info-icon" />
                <div className="emm-info-content">
                  <strong>Note:</strong> The following employees are
                  automatically associated with this project as managers:
                  <ul className="emm-info-list">
                    {project.resourceOwner && (
                      <li>
                        <strong>Resource Owner:</strong>{" "}
                        {project.resourceOwner.firstName}{" "}
                        {project.resourceOwner.lastName}
                      </li>
                    )}
                    {project.l1Approver && (
                      <li>
                        <strong>L1 Approver:</strong>{" "}
                        {project.l1Approver.firstName}{" "}
                        {project.l1Approver.lastName}
                      </li>
                    )}
                    {project.l2Approver && (
                      <li>
                        <strong>L2 Approver:</strong>{" "}
                        {project.l2Approver.firstName}{" "}
                        {project.l2Approver.lastName}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {isLoadingData ? (
              <div className="emm-loading">
                <div
                  className="emm-loading-spinner spinner-border"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="emm-loading-text">Loading employees...</p>
              </div>
            ) : (
              <>
                <div className="row g-2 mb-3 emm-filter-row">
                  <div className="col-md-6">
                    <div className="emm-search-wrapper">
                      <Search size={16} className="emm-search-icon" />
                      <input
                        type="text"
                        className="form-control text-start emm-search-input"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleSearchKeyPress}
                      />

                      {activeSearchTerm ? (
                        <button
                          type="button"
                          onClick={handleCancelSearch}
                          className="emm-search-btn emm-search-btn--cancel"
                        >
                          <X size={14} />
                          <span>Cancel</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSearch}
                          className="emm-search-btn"
                        >
                          <Search size={14} />
                          <span>Search</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="col-md-2">
                    <CustomDropdown
                      name="role"
                      value={filterRole}
                      onChange={(_, v) => setFilterRole(v)}
                      options={roleOptions}
                      placeholder="All Roles"
                      className="emm-filter-dd"
                      align="left"
                      offset={{ x: 0, y: 6 }}
                    />
                  </div>

                  <div className="col-md-2">
                    <CustomDropdown
                      name="department"
                      value={filterDepartment}
                      onChange={(_, v) => setFilterDepartment(v)}
                      options={departmentOptions}
                      placeholder="All Departments"
                      className="emm-filter-dd"
                      align="left"
                      offset={{ x: 0, y: 6 }}
                    />
                  </div>

                  <div className="col-md-2">
                    <CustomDropdown
                      name="status"
                      value={filterStatus}
                      onChange={(_, v) => setFilterStatus(v)}
                      options={statusOptions}
                      placeholder="All Status"
                      className="emm-filter-dd"
                      align="left"
                      offset={{ x: 0, y: 6 }}
                    />
                  </div>
                </div>

                <div className="emm-selection-summary">
                  <div className="emm-summary-badges">
                    <span className="emm-badge emm-badge--info">
                      {selectedEmployeeIds.length} Selected
                    </span>
                    <span className="emm-badge emm-badge--success">
                      Mapped: {getMappedCount()}
                    </span>
                    <span className="emm-badge emm-badge--warning">
                      Unmapped: {getUnmappedCount()}
                    </span>
                    {primaryEmployeeIds.length > 0 && (
                      <span className="emm-badge emm-badge--primary">
                        {primaryEmployeeIds.length} Primary Set
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="emm-btn-outline"
                    onClick={onSelectAll}
                  >
                    Select/Deselect All
                  </button>
                </div>

                <div className="emm-warning-banner">
                  <Info size={16} className="emm-info-icon" />
                  <div className="emm-warning-text">
                    <strong>Primary Project:</strong> You can select multiple
                    employees and mark multiple as primary for this project.
                    Employees must be selected first before marking as primary.
                  </div>
                </div>

                <div className="table-responsive emm-table-wrapper">
                  <table className="table table-hover mb-0 emm-table">
                    <thead className="table-light emm-thead">
                      <tr>
                        <th className="emm-th emm-th--select">Select</th>
                        <th className="emm-th">Employee Name</th>
                        <th className="emm-th">Role</th>
                        <th className="emm-th">Department</th>
                        <th className="emm-th emm-th--status">Status</th>
                        <th className="emm-th emm-th--primary">
                          Primary Project
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {displayEmployees.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="text-center py-4 text-muted emm-empty-text"
                          >
                            {activeSearchTerm
                              ? "No employees found matching your search"
                              : "No employees match the filters"}
                          </td>
                        </tr>
                      ) : (
                        displayEmployees.map((emp) => {
                          const isMapped = (mappedEmployees || []).some(
                            (m) => m.employeeMasterId === emp.employeeMasterId
                          );

                          const isSelected = selectedEmployeeIds.includes(
                            emp.employeeMasterId
                          );

                          const mappedRecord = (mappedEmployees || []).find(
                            (m) => m.employeeMasterId === emp.employeeMasterId
                          );

                          const isPrimaryFromServer =
                            mappedRecord?.isPrimary === true;

                          const isPrimary =
                            isPrimaryFromServer ||
                            primaryEmployeeIds.includes(emp.employeeMasterId);

                          return (
                            <tr
                              key={emp.employeeMasterId}
                              className={`emm-row ${
                                isSelected ? "emm-row--selected" : ""
                              }`}
                            >
                              <td
                                onClick={(e) => e.stopPropagation()}
                                className="emm-td emm-td--select"
                              >
                                <input
                                  type="checkbox"
                                  className="emm-checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    onEmployeeSelect(emp.employeeMasterId)
                                  }
                                />
                              </td>

                              <td className="emm-td emm-td--name">
                                <span className="emm-name">
                                  {emp.firstName} {emp.lastName}
                                </span>
                              </td>

                              <td className="emm-td emm-td--muted">
                                {emp.roleName}
                              </td>

                              <td className="emm-td emm-td--muted">
                                {emp.departmentName}
                              </td>

                              <td className="emm-td">
                                {isMapped ? (
                                  <span className="emm-status emm-status--mapped">
                                    <Check size={12} />
                                    Mapped
                                  </span>
                                ) : (
                                  <span className="emm-status emm-status--unmapped">
                                    Unmapped
                                  </span>
                                )}
                              </td>

                              <td
                                onClick={(e) => e.stopPropagation()}
                                className="emm-td emm-td--primary"
                              >
                                <input
                                  type="checkbox"
                                  className="emm-checkbox"
                                  checked={isPrimary}
                                  disabled={
                                    !isSelected && !mappedRecord
                                  } 
                                  onChange={() =>
                                    onPrimaryToggle(emp.employeeMasterId)
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="emm-footer">
            <button
              type="button"
              onClick={onClose}
              className="emm-btn emm-btn--secondary"
              disabled={isSubmitting}
            >
              Close
            </button>

            <button
              type="button"
              onClick={onMap}
              disabled={!hasSelectedUnmapped || isSubmitting}
              className="emm-btn emm-btn--map"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm emm-btn-spinner" />
                  Mapping...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Map Selected ({getUnmappedCount()})
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onUnmap}
              disabled={!hasSelectedMapped || isSubmitting}
              className="emm-btn emm-btn--unmap"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm emm-btn-spinner" />
                  Unmapping...
                </>
              ) : (
                <>
                  <AlertCircle size={16} />
                  Unmap Selected ({getMappedCount()})
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

export default EmployeeMappingModal;