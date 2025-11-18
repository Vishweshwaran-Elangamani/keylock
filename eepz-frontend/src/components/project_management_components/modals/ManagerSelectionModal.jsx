import React from 'react';
import { X, Search, Filter, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';

const ManagerSelectionModal = ({
  showManagerModal,
  selectedProject,
  allEmployees,
  selectedResourceOwner,
  setSelectedResourceOwner,
  selectedL1Approver,
  setSelectedL1Approver,
  selectedL2Approver,
  setSelectedL2Approver,
  activeManagerTab,
  setActiveManagerTab,
  managerSearchTerm,
  setManagerSearchTerm,
  managerFilterRole,
  setManagerFilterRole,
  managerFilterDepartment,
  setManagerFilterDepartment,
  managerCurrentPage,
  setManagerCurrentPage,
  managerItemsPerPage,
  isSubmitting,
  modalMessage,
  setModalMessage,
  handleUpdateManagers,
  setShowManagerModal
}) => {
  if (!showManagerModal) return null;

  // Filter managers
  const filteredManagers = allEmployees.filter(emp => {
    const searchMatch = managerSearchTerm === '' || 
      `${emp.firstName} ${emp.lastName} ${emp.roleName} ${emp.departmentName}`
        .toLowerCase()
        .includes(managerSearchTerm.toLowerCase());
    
    const roleMatch = managerFilterRole === 'All' || emp.roleName === managerFilterRole;
    const deptMatch = managerFilterDepartment === 'All' || emp.departmentName === managerFilterDepartment;
    
    return searchMatch && roleMatch && deptMatch;
  });

  // Get unique roles and departments
  const uniqueRoles = [...new Set(allEmployees.map(emp => emp.roleName))].sort();
  const uniqueDepartments = [...new Set(allEmployees.map(emp => emp.departmentName))].sort();

  // Pagination
  const totalPages = Math.ceil(filteredManagers.length / managerItemsPerPage);
  const startIndex = (managerCurrentPage - 1) * managerItemsPerPage;
  const endIndex = startIndex + managerItemsPerPage;
  const paginatedManagers = filteredManagers.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= Math.min(totalPages, 4); i++) pages.push(i);
    return pages;
  };

  const handleManagerSelection = (employee) => {
    if (activeManagerTab === 'resource') {
      setSelectedResourceOwner(employee);
    } else if (activeManagerTab === 'l1') {
      setSelectedL1Approver(employee);
    } else if (activeManagerTab === 'l2') {
      setSelectedL2Approver(employee);
    }
  };

  const getSelectedManager = () => {
    if (activeManagerTab === 'resource') return selectedResourceOwner;
    if (activeManagerTab === 'l1') return selectedL1Approver;
    if (activeManagerTab === 'l2') return selectedL2Approver;
    return null;
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '90%' }}>
        <div className="modal-content" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-people me-2"></i>
              Edit Reporting Managers - {selectedProject?.projectName}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowManagerModal(false)}
              disabled={isSubmitting}
            ></button>
          </div>

          <div className="modal-body" style={{ flex: '1 1 auto', overflowY: 'auto' }}>
            {modalMessage && (
              <div className={`alert alert-${modalMessage.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show d-flex align-items-center gap-2`}>
                {modalMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <div className="flex-grow-1">{modalMessage.text}</div>
                <button type="button" className="btn-close" onClick={() => setModalMessage(null)}></button>
              </div>
            )}

            {/* Tabs with Selected badges */}
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeManagerTab === 'resource' ? 'active' : ''}`}
                  onClick={() => setActiveManagerTab('resource')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  Resource Owner
                  {selectedResourceOwner && <span className="badge bg-success">Selected</span>}
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeManagerTab === 'l1' ? 'active' : ''}`}
                  onClick={() => setActiveManagerTab('l1')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  L1 Approver
                  {selectedL1Approver && <span className="badge bg-success">Selected</span>}
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeManagerTab === 'l2' ? 'active' : ''}`}
                  onClick={() => setActiveManagerTab('l2')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  L2 Approver
                  {selectedL2Approver && <span className="badge bg-success">Selected</span>}
                </button>
              </li>
            </ul>

            {/* Current Selection - Highlighted */}
            {getSelectedManager() && (
              <div className="alert alert-info mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-info-circle"></i>
                <div>
                  <strong>Current Selection:</strong>
                  <div className="badge bg-success ms-2">
                    {getSelectedManager().firstName} {getSelectedManager().lastName} - {getSelectedManager().roleName}
                  </div>
                </div>
              </div>
            )}

            {/* Search by name */}
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name..."
                    value={managerSearchTerm}
                    onChange={(e) => {
                      setManagerSearchTerm(e.target.value);
                      setManagerCurrentPage(1);
                    }}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={managerFilterRole}
                  onChange={(e) => {
                    setManagerFilterRole(e.target.value);
                    setManagerCurrentPage(1);
                  }}
                >
                  <option value="All">All Roles</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={managerFilterDepartment}
                  onChange={(e) => {
                    setManagerFilterDepartment(e.target.value);
                    setManagerCurrentPage(1);
                  }}
                >
                  <option value="All">All Departments</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Managers Table */}
            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="table table-hover">
                <thead className="table-light" style={{ position: 'sticky', top: 0 }}>
                  <tr>
                    <th>Employee Name</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedManagers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">
                        No managers found
                      </td>
                    </tr>
                  ) : (
                    paginatedManagers.map(emp => {
                      const isSelected = getSelectedManager()?.employeeMasterId === emp.employeeMasterId;
                      return (
                        <tr key={emp.employeeMasterId} className={isSelected ? 'table-success' : ''}>
                          <td>{emp.firstName} {emp.lastName}</td>
                          <td>{emp.roleName}</td>
                          <td>{emp.departmentName}</td>
                          <td>
                            {isSelected ? (
                              <span className="badge bg-success">✓ Selected</span>
                            ) : (
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleManagerSelection(emp)}
                              >
                                Select
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted small">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredManagers.length)} of {filteredManagers.length} employees
                </div>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${managerCurrentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setManagerCurrentPage(managerCurrentPage - 1)} disabled={managerCurrentPage === 1}>
                        <ChevronLeft size={14} />
                      </button>
                    </li>
                    {getPageNumbers().map(page => (
                      <li key={page} className={`page-item ${managerCurrentPage === page ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setManagerCurrentPage(page)}>{page}</button>
                      </li>
                    ))}
                    <li className={`page-item ${managerCurrentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setManagerCurrentPage(managerCurrentPage + 1)} disabled={managerCurrentPage === totalPages}>
                        <ChevronRight size={14} />
                      </button>
                    </li>
                  </ul>
                </nav>
                <div className="text-muted small">
                  Page {managerCurrentPage} of {totalPages}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowManagerModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleUpdateManagers}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Updating...
                </>
              ) : (
                'Update Managers'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerSelectionModal;
