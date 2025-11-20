// src/components/project_management_components/modals/ManagerSelectionModal.jsx

import React, { useEffect } from 'react';
import { X, Search, Filter, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, UserCog, Info } from 'lucide-react';

const ManagerSelectionModal = ({
  show, // ✅ Changed from showManagerModal
  onClose, // ✅ Changed from setShowManagerModal
  project, // ✅ Changed from selectedProject
  selectedResourceOwner,
  selectedL1Approver,
  selectedL2Approver,
  onManagerSelect, // ✅ This will handle the selection
  activeTab, // ✅ Changed from activeManagerTab
  setActiveTab, // ✅ Changed from setActiveManagerTab
  searchTerm, // ✅ Changed from managerSearchTerm
  setSearchTerm, // ✅ Changed from setManagerSearchTerm
  filterRole, // ✅ Changed from managerFilterRole
  setFilterRole, // ✅ Changed from setManagerFilterRole
  filterDepartment, // ✅ Changed from managerFilterDepartment
  setFilterDepartment, // ✅ Changed from setManagerFilterDepartment
  paginatedManagers,
  currentPage, // ✅ Changed from managerCurrentPage
  totalPages, // ✅ Changed from managerTotalPages
  goToPage, // ✅ Changed from goToManagerPage
  getPageNumbers, // ✅ Changed from getManagerPageNumbers
  uniqueRoles,
  uniqueDepartments,
  onUpdate, // ✅ Changed from handleUpdateManagers
  isSubmitting,
  message, // ✅ Changed from modalMessage
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

  const getSelectedManager = () => {
    if (activeTab === 'resource') return selectedResourceOwner;
    if (activeTab === 'l1') return selectedL1Approver;
    if (activeTab === 'l2') return selectedL2Approver;
    return null;
  };

  const isManagerSelected = (emp) => {
    const selected = getSelectedManager();
    return selected?.employeeMasterId === emp.employeeMasterId;
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
                <UserCog size={24} style={{ color: "#0f62fe" }} />
                <span style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                  Edit Reporting Managers - {project?.projectName}
                </span>
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={isSubmitting}
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

              {/* Manager Tabs */}
              <ul className="nav nav-tabs mb-4" style={{ borderBottom: "2px solid #e2e8f0" }}>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "resource" ? "active" : ""}`}
                    onClick={() => setActiveTab("resource")}
                    style={{ fontSize: "0.95rem", fontWeight: 600 }}
                  >
                    Resource Owner{" "}
                    {selectedResourceOwner && (
                      <span className="badge bg-success ms-2">✓</span>
                    )}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "l1" ? "active" : ""}`}
                    onClick={() => setActiveTab("l1")}
                    style={{ fontSize: "0.95rem", fontWeight: 600 }}
                  >
                    L1 Approver{" "}
                    {selectedL1Approver && (
                      <span className="badge bg-success ms-2">✓</span>
                    )}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "l2" ? "active" : ""}`}
                    onClick={() => setActiveTab("l2")}
                    style={{ fontSize: "0.95rem", fontWeight: 600 }}
                  >
                    L2 Approver{" "}
                    {selectedL2Approver && (
                      <span className="badge bg-success ms-2">✓</span>
                    )}
                  </button>
                </li>
              </ul>

              {/* Current Selection Display */}
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
                  <strong style={{ fontSize: "0.95rem" }}>Current Selection:</strong>
                  <div className="mt-2">
                    {getSelectedManager() ? (
                      <span className="badge bg-success" style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}>
                        {getSelectedManager().firstName}{" "}
                        {getSelectedManager().lastName} -{" "}
                        {getSelectedManager().roleName}
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: "0.9rem" }}>None selected</span>
                    )}
                  </div>
                </div>
              </div>

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
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ fontSize: "0.95rem" }}
                    />
                  </div>
                </div>
                <div className="col-md-3">
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
                <div className="col-md-3">
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
              </div>

              {/* Manager List Table */}
              <div
                className="table-responsive"
                style={{ minHeight: "350px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
              >
                <table className="table table-hover mb-0">
                  <thead className="table-light" style={{ position: "sticky", top: 0 }}>
                    <tr>
                      <th style={{ width: "60px", fontSize: "0.9rem", padding: "1rem" }}>Select</th>
                      <th style={{ fontSize: "0.9rem", padding: "1rem" }}>Employee Name</th>
                      <th style={{ fontSize: "0.9rem", padding: "1rem" }}>Role</th>
                      <th style={{ fontSize: "0.9rem", padding: "1rem" }}>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedManagers.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center py-5 text-muted"
                          style={{ fontSize: "0.95rem" }}
                        >
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      paginatedManagers.map((emp) => {
                        const isSelected = isManagerSelected(emp);
                        return (
                          <tr
                            key={emp.employeeMasterId}
                            className={isSelected ? "table-active" : ""}
                            style={{ cursor: "pointer" }}
                            onClick={() => onManagerSelect(emp)}
                          >
                            <td onClick={(e) => e.stopPropagation()} style={{ padding: "1rem" }}>
                              <input
                                type="radio"
                                className="form-check-input"
                                name={`manager-${activeTab}`}
                                checked={isSelected}
                                onChange={() => onManagerSelect(emp)}
                                style={{ width: "18px", height: "18px" }}
                              />
                            </td>
                            <td style={{ fontSize: "0.9rem", padding: "1rem" }}>
                              {emp.firstName} {emp.lastName}
                            </td>
                            <td style={{ fontSize: "0.9rem", padding: "1rem" }}>{emp.roleName}</td>
                            <td style={{ fontSize: "0.9rem", padding: "1rem" }}>{emp.departmentName}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                  <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                    Page {currentPage} of {totalPages}
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
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
                          <ChevronLeft size={16} />
                        </button>
                      </li>
                      {getPageNumbers().map((page, index) =>
                        page === "..." ? (
                          <li
                            key={`mgr-ellipsis-${index}`}
                            className="page-item disabled"
                          >
                            <span className="page-link">...</span>
                          </li>
                        ) : (
                          <li
                            key={`mgr-${page}`}
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
                        )
                      )}
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
                          <ChevronRight size={16} />
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ padding: "1rem 1.5rem" }}>
              <button
                type="button"
                className="btn btn-lg btn-secondary"
                onClick={onClose}
                style={{ fontSize: "0.95rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-lg btn-primary"
                onClick={onUpdate}
                disabled={isSubmitting}
                style={{ fontSize: "0.95rem" }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Updating...
                  </>
                ) : (
                  "Update Managers"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManagerSelectionModal;
