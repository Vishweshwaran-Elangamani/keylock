// src/components/project_management_components/modals/EmployeeMappingModal.jsx

import React, { useEffect } from 'react';
import { Users, CheckCircle, AlertCircle, Info, Search } from 'lucide-react';

const EmployeeMappingModal = ({
  show, // ✅ Changed from showEmployeeModal
  onClose, // ✅ Changed from setShowEmployeeModal
  project, // ✅ Changed from selectedProject
  filteredEmployees,
  mappedEmployees,
  selectedEmployeeIds,
  primaryEmployeeIds,
  searchTerm, // ✅ Changed from employeeSearchTerm
  setSearchTerm, // ✅ Changed from setEmployeeSearchTerm
  filterRole, // ✅ Changed from employeeFilterRole
  setFilterRole, // ✅ Changed from setEmployeeFilterRole
  filterDepartment, // ✅ Changed from employeeFilterDepartment
  setFilterDepartment, // ✅ Changed from setEmployeeFilterDepartment
  filterStatus, // ✅ Changed from employeeFilterStatus
  setFilterStatus, // ✅ Changed from setEmployeeFilterStatus
  uniqueRoles,
  uniqueDepartments,
  onEmployeeSelect, // ✅ Changed from handleEmployeeToggle
  onPrimaryToggle, // ✅ Changed from handlePrimaryToggle
  onSelectAll, // ✅ Changed from handleSelectAllVisible
  onMap, // ✅ Changed from handleMapEmployees
  onUnmap, // ✅ Changed from handleUnmapEmployees
  isSubmitting,
  message, // ✅ Changed from modalMessage
  isLoadingData, // ✅ Changed from isLoadingModalData
  getMappedCount,
  getUnmappedCount,
  hasSelectedMapped, // ✅ Changed from hasSelectedMappedEmployees
  hasSelectedUnmapped, // ✅ Changed from hasSelectedUnmappedEmployees
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  if (!show) return null;

  const getProjectManagerIds = () => {
    if (!project) return [];
    const managerIds = [];
    if (project.resourceOwner?.employeeMasterId) {
      managerIds.push(project.resourceOwner.employeeMasterId);
    }
    if (project.l1Approver?.employeeMasterId) {
      managerIds.push(project.l1Approver.employeeMasterId);
    }
    if (project.l2Approver?.employeeMasterId) {
      managerIds.push(project.l2Approver.employeeMasterId);
    }
    return managerIds;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        style={{ zIndex: 1040 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1050 }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header" style={{ backgroundColor: "#f8f9fa", padding: "1.25rem 1.5rem" }}>
              <h5 className="modal-title d-flex align-items-center gap-2 mb-0">
                <Users size={24} style={{ color: "#0f62fe" }} />
                <span style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                  Map/Unmap Employees - {project?.projectName}
                </span>
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              />
            </div>

            <div className="modal-body" style={{ padding: "1.5rem" }}>
              {message && (
                <div
                  className={`alert alert-${
                    message.type === "success" ? "success" : "danger"
                  } d-flex align-items-center gap-2 mb-4`}
                  style={{
                    borderRadius: "8px",
                    border: "none",
                    padding: "1rem",
                  }}
                >
                  {message.type === "success" ? (
                    <CheckCircle size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                  <span style={{ fontSize: "0.95rem" }}>{message.text}</span>
                </div>
              )}

              {getProjectManagerIds().length > 0 && (
                <div
                  className="alert alert-info d-flex align-items-start gap-3 mb-4"
                  style={{
                    borderRadius: "8px",
                    border: "none",
                    padding: "1rem",
                  }}
                >
                  <Info size={20} className="flex-shrink-0 mt-1" />
                  <div>
                    <strong style={{ fontSize: "0.95rem" }}>Note:</strong> The following employees are
                    automatically associated with this project as managers:
                    <ul className="mb-0 mt-2" style={{ fontSize: "0.9rem" }}>
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
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }}></div>
                  <p className="mt-3 text-muted" style={{ fontSize: "0.95rem" }}>Loading employees...</p>
                </div>
              ) : (
                <>
                  {/* Filters */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div className="input-group input-group-lg">
                        <span className="input-group-text bg-white">
                          <Search size={20} />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search employees..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ fontSize: "0.95rem" }}
                        />
                      </div>
                    </div>
                    <div className="col-md-2">
                      <select
                        className="form-select form-select-lg"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        style={{ fontSize: "0.95rem" }}
                      >
                        <option value="All">All Roles</option>
                        {uniqueRoles.map((role, idx) => (
                          <option key={idx} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <select
                        className="form-select form-select-lg"
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        style={{ fontSize: "0.95rem" }}
                      >
                        <option value="All">All Departments</option>
                        {uniqueDepartments.map((dept, idx) => (
                          <option key={idx} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <select
                        className="form-select form-select-lg"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ fontSize: "0.95rem" }}
                      >
                        <option value="All">All Status</option>
                        <option value="Mapped">Mapped</option>
                        <option value="Unmapped">Unmapped</option>
                      </select>
                    </div>
                  </div>

                  {/* Selection Summary */}
                  <div className="mb-4 d-flex justify-content-between align-items-center">
                    <div>
                      <span className="badge bg-info me-2" style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}>
                        {selectedEmployeeIds.length} Selected
                      </span>
                      <span className="badge bg-success me-2" style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}>
                        Mapped: {getMappedCount()}
                      </span>
                      <span className="badge bg-warning text-dark" style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}>
                        Unmapped: {getUnmappedCount()}
                      </span>
                      {primaryEmployeeIds.length > 0 && (
                        <span className="badge bg-primary ms-2" style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}>
                          {primaryEmployeeIds.length} Primary Set
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={onSelectAll}
                      style={{ fontSize: "0.95rem" }}
                    >
                      Select/Deselect All
                    </button>
                  </div>

                  <div
                    className="alert alert-warning d-flex align-items-start gap-3 mb-4"
                    style={{
                      borderRadius: "8px",
                      border: "none",
                      padding: "1rem",
                    }}
                  >
                    <Info size={20} className="flex-shrink-0 mt-1" />
                    <div style={{ fontSize: "0.9rem" }}>
                      <strong>Primary Project:</strong> You can select multiple
                      employees and mark multiple as primary for this project.
                      Employees must be selected first before marking as primary.
                    </div>
                  </div>

                  {/* Employee Table */}
                  <div
                    className="table-responsive"
                    style={{
                      minHeight: "350px",
                      maxHeight: "600px",
                      overflowY: "auto",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <table className="table table-hover mb-0">
                      <thead className="table-light" style={{ position: "sticky", top: 0 }}>
                        <tr>
                          <th style={{ width: "60px", fontSize: "0.9rem", padding: "1rem" }}>Select</th>
                          <th style={{ fontSize: "0.9rem", padding: "1rem" }}>Employee Name</th>
                          <th style={{ fontSize: "0.9rem", padding: "1rem" }}>Role</th>
                          <th style={{ fontSize: "0.9rem", padding: "1rem" }}>Department</th>
                          <th style={{ width: "100px", fontSize: "0.9rem", padding: "1rem" }}>Status</th>
                          <th style={{ width: "120px", fontSize: "0.9rem", padding: "1rem" }}>Primary Project</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.length === 0 ? (
                          <tr>
                            <td
                              colSpan="6"
                              className="text-center py-5 text-muted"
                              style={{ fontSize: "0.95rem" }}
                            >
                              No employees match the filters
                            </td>
                          </tr>
                        ) : (
                          filteredEmployees.map((emp) => {
                            const isMapped = mappedEmployees.some(
                              (m) => m.employeeMasterId === emp.employeeMasterId
                            );
                            const isSelected = selectedEmployeeIds.includes(
                              emp.employeeMasterId
                            );
                            const isPrimary = primaryEmployeeIds.includes(
                              emp.employeeMasterId
                            );
                            const currentlyMappedAsPrimary = mappedEmployees.find(
                              (m) => m.employeeMasterId === emp.employeeMasterId
                            )?.isPrimary;

                            return (
                              <tr
                                key={emp.employeeMasterId}
                                className={isSelected ? "table-active" : ""}
                              >
                                <td onClick={(e) => e.stopPropagation()} style={{ padding: "1rem" }}>
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isSelected}
                                    onChange={() =>
                                      onEmployeeSelect(emp.employeeMasterId)
                                    }
                                    style={{ width: "18px", height: "18px" }}
                                  />
                                </td>
                                <td style={{ fontSize: "0.9rem", padding: "1rem" }}>
                                  {emp.firstName} {emp.lastName}
                                </td>
                                <td style={{ fontSize: "0.9rem", padding: "1rem" }}>{emp.roleName}</td>
                                <td style={{ fontSize: "0.9rem", padding: "1rem" }}>{emp.departmentName}</td>
                                <td style={{ padding: "1rem" }}>
                                  {isMapped ? (
                                    <span className="badge bg-success" style={{ fontSize: "0.85rem" }}>
                                      Mapped {currentlyMappedAsPrimary && "★"}
                                    </span>
                                  ) : (
                                    <span className="badge bg-secondary" style={{ fontSize: "0.85rem" }}>
                                      Unmapped
                                    </span>
                                  )}
                                </td>
                                <td onClick={(e) => e.stopPropagation()} style={{ padding: "1rem" }}>
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isPrimary}
                                    disabled={!isSelected}
                                    onChange={() =>
                                      onPrimaryToggle(emp.employeeMasterId)
                                    }
                                    title={
                                      !isSelected
                                        ? "Select employee first"
                                        : "Mark as primary"
                                    }
                                    style={{ width: "18px", height: "18px" }}
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

            <div className="modal-footer" style={{ padding: "1rem 1.5rem" }}>
              <button
                type="button"
                className="btn btn-lg btn-secondary"
                onClick={onClose}
                style={{ fontSize: "0.95rem" }}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-lg btn-success"
                onClick={onMap}
                disabled={!hasSelectedUnmapped || isSubmitting}
                style={{ fontSize: "0.95rem" }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Mapping...
                  </>
                ) : (
                  <>Map Selected ({getUnmappedCount()})</>
                )}
              </button>
              <button
                type="button"
                className="btn btn-lg btn-danger"
                onClick={onUnmap}
                disabled={!hasSelectedMapped || isSubmitting}
                style={{ fontSize: "0.95rem" }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Unmapping...
                  </>
                ) : (
                  <>Unmap Selected ({getMappedCount()})</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeMappingModal;
