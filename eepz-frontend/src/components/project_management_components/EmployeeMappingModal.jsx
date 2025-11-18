import React from 'react';
import { X, Search, Filter, Users, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const EmployeeMappingModal = ({
  showEmployeeModal,
  selectedProject,
  allEmployees,
  mappedEmployees,
  selectedEmployeeIds,
  setSelectedEmployeeIds,
  employeeSearchTerm,
  setEmployeeSearchTerm,
  employeeFilterRole,
  setEmployeeFilterRole,
  employeeFilterDepartment,
  setEmployeeFilterDepartment,
  employeeFilterStatus,
  setEmployeeFilterStatus,
  employeeCurrentPage,
  setEmployeeCurrentPage,
  employeeItemsPerPage,
  isSubmitting,
  isLoadingModalData,
  modalMessage,
  setModalMessage,
  handleMapEmployees,
  handleUnmapEmployees,
  setShowEmployeeModal,
  getProjectManagerIds
}) => {
  if (!showEmployeeModal) return null;

  const managerIds = getProjectManagerIds();

  // Filter employees
  const filteredEmployees = allEmployees.filter(emp => {
    if (managerIds.includes(emp.employeeMasterId)) return false;

    const isMapped = mappedEmployees.some(m => m.employeeMasterId === emp.employeeMasterId);
    
    const searchMatch = employeeSearchTerm === '' || 
      `${emp.firstName} ${emp.lastName} ${emp.roleName} ${emp.departmentName}`
        .toLowerCase()
        .includes(employeeSearchTerm.toLowerCase());
    
    const roleMatch = employeeFilterRole === 'All' || emp.roleName === employeeFilterRole;
    const deptMatch = employeeFilterDepartment === 'All' || emp.departmentName === employeeFilterDepartment;
    const statusMatch = 
      employeeFilterStatus === 'All' || 
      (employeeFilterStatus === 'Mapped' && isMapped) ||
      (employeeFilterStatus === 'Unmapped' && !isMapped);
    
    return searchMatch && roleMatch && deptMatch && statusMatch;
  });

  const availableEmployees = allEmployees.filter(emp => !managerIds.includes(emp.employeeMasterId));
  const uniqueRoles = [...new Set(availableEmployees.map(emp => emp.roleName))].sort();
  const uniqueDepartments = [...new Set(availableEmployees.map(emp => emp.departmentName))].sort();

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / employeeItemsPerPage);
  const startIndex = (employeeCurrentPage - 1) * employeeItemsPerPage;
  const endIndex = startIndex + employeeItemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (employeeCurrentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (employeeCurrentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = employeeCurrentPage - 1; i <= employeeCurrentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handleEmployeeToggle = (employeeId) => {
    setSelectedEmployeeIds(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleSelectAllVisible = () => {
    const visibleIds = paginatedEmployees.map(emp => emp.employeeMasterId);
    const allVisibleSelected = visibleIds.every(id => selectedEmployeeIds.includes(id));
    
    if (allVisibleSelected) {
      setSelectedEmployeeIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedEmployeeIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const allVisibleSelected = paginatedEmployees.length > 0 && 
    paginatedEmployees.every(emp => selectedEmployeeIds.includes(emp.employeeMasterId));

  const hasSelectedMappedEmployees = selectedEmployeeIds.some(id => 
    mappedEmployees.some(m => m.employeeMasterId === id)
  );

  const hasSelectedUnmappedEmployees = selectedEmployeeIds.some(id => 
    !mappedEmployees.some(m => m.employeeMasterId === id)
  );

  const mappedCount = selectedEmployeeIds.filter(id => 
    mappedEmployees.some(m => m.employeeMasterId === id)
  ).length;

  const unmappedCount = selectedEmployeeIds.filter(id => 
    !mappedEmployees.some(m => m.employeeMasterId === id)
  ).length;

  // Get manager names for note
  const getManagerNames = () => {
    const resourceOwner = selectedProject?.resourceOwner ? 
      `${selectedProject.resourceOwner.firstName} ${selectedProject.resourceOwner.lastName}` : null;
    const l1Approver = selectedProject?.l1Approver ? 
      `${selectedProject.l1Approver.firstName} ${selectedProject.l1Approver.lastName}` : null;
    const l2Approver = selectedProject?.l2Approver ? 
      `${selectedProject.l2Approver.firstName} ${selectedProject.l2Approver.lastName}` : null;
    
    return { resourceOwner, l1Approver, l2Approver };
  };

  const managers = getManagerNames();

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '90%' }}>
        <div className="modal-content" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
          <div className="modal-header border-bottom">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <Users size={24} className="text-primary" />
              <span>Map/Unmap Employees - {selectedProject?.projectName}</span>
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowEmployeeModal(false)}
              disabled={isSubmitting}
            ></button>
          </div>

          <div className="modal-body" style={{ flex: '1 1 auto', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* Manager Note */}
            <div className="alert alert-info mb-3">
              <strong>Note:</strong> The following employees are automatically associated with this project as managers:
              <ul className="mb-0 mt-2">
                {managers.resourceOwner && <li><strong>Resource Owner:</strong> {managers.resourceOwner}</li>}
                {managers.l1Approver && <li><strong>L1 Approver:</strong> {managers.l1Approver}</li>}
                {managers.l2Approver && <li><strong>L2 Approver:</strong> {managers.l2Approver}</li>}
              </ul>
            </div>

            {modalMessage && (
              <div className={`alert alert-${modalMessage.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show d-flex align-items-center gap-2`}>
                {modalMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <div className="flex-grow-1">{modalMessage.text}</div>
                <button type="button" className="btn-close" onClick={() => setModalMessage(null)}></button>
              </div>
            )}

            {/* Filters */}
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search employees..."
                    value={employeeSearchTerm}
                    onChange={(e) => {
                      setEmployeeSearchTerm(e.target.value);
                      setEmployeeCurrentPage(1);
                    }}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <Filter size={18} />
                  </span>
                  <select
                    className="form-select"
                    value={employeeFilterRole}
                    onChange={(e) => {
                      setEmployeeFilterRole(e.target.value);
                      setEmployeeCurrentPage(1);
                    }}
                  >
                    <option value="All">All Roles</option>
                    {uniqueRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-3">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <Filter size={18} />
                  </span>
                  <select
                    className="form-select"
                    value={employeeFilterDepartment}
                    onChange={(e) => {
                      setEmployeeFilterDepartment(e.target.value);
                      setEmployeeCurrentPage(1);
                    }}
                  >
                    <option value="All">All Departments</option>
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-3">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <Filter size={18} />
                  </span>
                  <select
                    className="form-select"
                    value={employeeFilterStatus}
                    onChange={(e) => {
                      setEmployeeFilterStatus(e.target.value);
                      setEmployeeCurrentPage(1);
                    }}
                  >
                    <option value="All">All Status</option>
                    <option value="Mapped">Mapped</option>
                    <option value="Unmapped">Unmapped</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Selection Info with badges */}
            <div className="d-flex gap-2 mb-3">
              <span className="badge bg-primary">{selectedEmployeeIds.length} Selected</span>
              <span className="badge bg-success">Mapped: {mappedCount}</span>
              <span className="badge bg-warning text-dark">Unmapped: {unmappedCount}</span>
              {selectedEmployeeIds.length > 0 && (
                <button 
                  className="btn btn-sm btn-outline-secondary ms-auto" 
                  onClick={() => setSelectedEmployeeIds([])}
                >
                  Select/Deselect Page
                </button>
              )}
            </div>

            {/* Employees Table - FIXED HEIGHT */}
            {isLoadingModalData ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-3">Loading employees...</p>
              </div>
            ) : (
              <div className="flex-grow-1" style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div className="table-responsive" style={{ flex: '1 1 auto', maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="table table-hover mb-0">
                    <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th style={{ width: '50px' }}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={allVisibleSelected}
                            onChange={handleSelectAllVisible}
                            disabled={paginatedEmployees.length === 0}
                          />
                        </th>
                        <th>Select</th>
                        <th>Employee Name</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEmployees.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-muted">
                            No employees found
                          </td>
                        </tr>
                      ) : (
                        paginatedEmployees.map(emp => {
                          const isMapped = mappedEmployees.some(m => m.employeeMasterId === emp.employeeMasterId);
                          const isSelected = selectedEmployeeIds.includes(emp.employeeMasterId);
                          
                          return (
                            <tr key={emp.employeeMasterId} className={isSelected ? 'table-active' : ''}>
                              <td>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isSelected}
                                  onChange={() => handleEmployeeToggle(emp.employeeMasterId)}
                                />
                              </td>
                              <td>{emp.employeeMasterId}</td>
                              <td>{emp.firstName} {emp.lastName}</td>
                              <td>{emp.roleName}</td>
                              <td>{emp.departmentName}</td>
                              <td>
                                <span className={`badge ${isMapped ? 'bg-success' : 'bg-secondary'}`}>
                                  {isMapped ? 'Mapped' : 'Unmapped'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination - ALWAYS VISIBLE */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                    <div className="text-muted small">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length}
                    </div>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${employeeCurrentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setEmployeeCurrentPage(employeeCurrentPage - 1)}
                            disabled={employeeCurrentPage === 1}
                          >
                            <ChevronLeft size={14} />
                          </button>
                        </li>
                        {getPageNumbers().map((page, index) => (
                          page === '...' ? (
                            <li key={`ellipsis-${index}`} className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          ) : (
                            <li key={page} className={`page-item ${employeeCurrentPage === page ? 'active' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => setEmployeeCurrentPage(page)}
                              >
                                {page}
                              </button>
                            </li>
                          )
                        ))}
                        <li className={`page-item ${employeeCurrentPage === totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setEmployeeCurrentPage(employeeCurrentPage + 1)}
                            disabled={employeeCurrentPage === totalPages}
                          >
                            <ChevronRight size={14} />
                          </button>
                        </li>
                      </ul>
                    </nav>
                    <div className="text-muted small">
                      Page {employeeCurrentPage} of {totalPages}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer border-top">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowEmployeeModal(false)}
              disabled={isSubmitting}
            >
              Close
            </button>
            {hasSelectedUnmappedEmployees && (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleMapEmployees}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Mapping...
                  </>
                ) : (
                  <>
                    Map Selected ({unmappedCount})
                  </>
                )}
              </button>
            )}
            {hasSelectedMappedEmployees && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleUnmapEmployees}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Unmapping...
                  </>
                ) : (
                  <>
                    Unmap Selected ({mappedCount})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeMappingModal;
