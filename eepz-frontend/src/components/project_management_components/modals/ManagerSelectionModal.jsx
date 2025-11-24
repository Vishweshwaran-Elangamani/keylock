// src/components/project_management_components/modals/ManagerSelectionModal.jsx

import React, { useEffect } from 'react';
import { X, Search, Filter, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, UserCog, Info } from 'lucide-react';

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
        style={{ zIndex: 1040, backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1050 }}
        onClick={(e) => {
          if (e.target.classList.contains('modal')) {
            onClose();
          }
        }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div 
            className="modal-content" 
            style={{ 
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div 
              className="modal-header" 
              style={{ 
                backgroundColor: '#25235c',
                borderBottom: 'none',
                padding: '1.25rem 1.5rem',
                color: 'white'
              }}
            >
              <h5 className="modal-title d-flex align-items-center gap-2 mb-0 text-start">
                <UserCog size={22} style={{ color: 'white' }} />
                <span 
                  style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 600,
                    color: 'white'
                  }}
                >
                  Edit Reporting Managers - {project?.projectName}
                </span>
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close"
                style={{
                  opacity: 0.8,
                  filter: 'brightness(0) invert(1)'
                }}
              />
            </div>

            <div className="modal-body" style={{ padding: '1.75rem', backgroundColor: '#f8f9fa' }}>
              {message && (
                <div
                  className={`alert alert-${
                    message.type === "success" ? "success" : "danger"
                  } d-flex align-items-center gap-2 mb-4`}
                  style={{
                    borderRadius: '8px',
                    border: 'none',
                    padding: '1rem',
                    fontSize: '0.95rem',
                    backgroundColor: message.type === 'success' 
                      ? 'rgba(36, 161, 72, 0.1)' 
                      : 'rgba(224, 25, 80, 0.1)',
                    color: message.type === 'success' ? '#24A148' : '#E01950',
                    textAlign: 'left'
                  }}
                >
                  {message.type === "success" ? (
                    <CheckCircle size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Manager Tabs */}
              <ul 
                className="nav nav-pills mb-4" 
                style={{ 
                  borderBottom: 'none',
                  gap: '0.5rem'
                }}
              >
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "resource" ? "active" : ""}`}
                    onClick={() => setActiveTab("resource")}
                    style={{ 
                      fontSize: '0.95rem', 
                      fontWeight: 600,
                      borderRadius: '8px',
                      padding: '0.6rem 1.2rem',
                      backgroundColor: activeTab === 'resource' ? 'var(--color-primary-1)' : 'white',
                      color: activeTab === 'resource' ? 'white' : '#6b7280',
                      border: activeTab === 'resource' ? 'none' : '1px solid #d1d5db',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    Resource Owner{" "}
                    {selectedResourceOwner && (
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: activeTab === 'resource' ? 'rgba(255,255,255,0.3)' : '#10b981',
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                      >
                        <CheckCircle size={12} />
                      </span>
                    )}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "l1" ? "active" : ""}`}
                    onClick={() => setActiveTab("l1")}
                    style={{ 
                      fontSize: '0.95rem', 
                      fontWeight: 600,
                      borderRadius: '8px',
                      padding: '0.6rem 1.2rem',
                      backgroundColor: activeTab === 'l1' ? 'var(--color-primary-1)' : 'white',
                      color: activeTab === 'l1' ? 'white' : '#6b7280',
                      border: activeTab === 'l1' ? 'none' : '1px solid #d1d5db',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    L1 Approver{" "}
                    {selectedL1Approver && (
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: activeTab === 'l1' ? 'rgba(255,255,255,0.3)' : '#10b981',
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                      >
                        <CheckCircle size={12} />
                      </span>
                    )}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "l2" ? "active" : ""}`}
                    onClick={() => setActiveTab("l2")}
                    style={{ 
                      fontSize: '0.95rem', 
                      fontWeight: 600,
                      borderRadius: '8px',
                      padding: '0.6rem 1.2rem',
                      backgroundColor: activeTab === 'l2' ? 'var(--color-primary-1)' : 'white',
                      color: activeTab === 'l2' ? 'white' : '#6b7280',
                      border: activeTab === 'l2' ? 'none' : '1px solid #d1d5db',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    L2 Approver{" "}
                    {selectedL2Approver && (
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: activeTab === 'l2' ? 'rgba(255,255,255,0.3)' : '#10b981',
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                      >
                        <CheckCircle size={12} />
                      </span>
                    )}
                  </button>
                </li>
              </ul>

              {/* Current Selection Display */}
              <div
                className="alert alert-info d-flex align-items-start gap-3 mb-4"
                style={{
                  borderRadius: '8px',
                  border: 'none',
                  padding: '1rem',
                  backgroundColor: 'rgba(13, 110, 253, 0.1)',
                  color: '#084298',
                  textAlign: 'left'
                }}
              >
                <Info size={20} className="flex-shrink-0 mt-1" />
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ fontSize: '0.95rem' }}>Current Selection:</strong>
                  <div className="mt-2">
                    {getSelectedManager() ? (
                      <span 
                        className="badge" 
                        style={{ 
                          fontSize: '0.9rem', 
                          padding: '0.5rem 0.75rem',
                          backgroundColor: '#10b981',
                          color: 'white'
                        }}
                      >
                        {getSelectedManager().firstName}{" "}
                        {getSelectedManager().lastName} -{" "}
                        {getSelectedManager().roleName}
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.9rem' }}>None selected</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="input-group">
                    <span 
                      className="input-group-text"
                      style={{
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRight: 'none'
                      }}
                    >
                      <Search size={20} style={{ color: '#6b7280' }} />
                    </span>
                    <input
                      type="text"
                      className="form-control text-start"
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ 
                        fontSize: '0.95rem',
                        border: '1px solid #d1d5db',
                        borderLeft: 'none',
                        padding: '0.65rem 0.75rem'
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select text-start"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    style={{ 
                      fontSize: '0.95rem',
                      border: '1px solid #d1d5db',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px'
                    }}
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
                    className="form-select text-start"
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    style={{ 
                      fontSize: '0.95rem',
                      border: '1px solid #d1d5db',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px'
                    }}
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
                style={{ 
                  minHeight: '350px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white'
                }}
              >
                <table className="table table-hover mb-0">
                  <thead 
                    className="table-light" 
                    style={{ 
                      position: 'sticky', 
                      top: 0,
                      zIndex: 10
                    }}
                  >
                    <tr style={{ textAlign: 'left' }}>
                      <th style={{ width: '60px', fontSize: '0.9rem', padding: '1rem', fontWeight: 600, textAlign: 'left' }}>
                        Select
                      </th>
                      <th style={{ fontSize: '0.9rem', padding: '1rem', fontWeight: 600, textAlign: 'left' }}>
                        Employee Name
                      </th>
                      <th style={{ fontSize: '0.9rem', padding: '1rem', fontWeight: 600, textAlign: 'left' }}>
                        Role
                      </th>
                      <th style={{ fontSize: '0.9rem', padding: '1rem', fontWeight: 600, textAlign: 'left' }}>
                        Department
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedManagers.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center py-5 text-muted"
                          style={{ fontSize: '0.95rem' }}
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
                            className={isSelected ? 'table-active' : ''}
                            style={{ 
                              cursor: 'pointer',
                              transition: 'background-color 0.15s ease'
                            }}
                            onClick={() => onManagerSelect(emp)}
                          >
                            <td 
                              onClick={(e) => e.stopPropagation()} 
                              style={{ padding: '1rem', textAlign: 'left' }}
                            >
                              <input
                                type="radio"
                                className="form-check-input"
                                name={`manager-${activeTab}`}
                                checked={isSelected}
                                onChange={() => onManagerSelect(emp)}
                                style={{ 
                                  width: '18px', 
                                  height: '18px',
                                  cursor: 'pointer'
                                }}
                              />
                            </td>
                            <td style={{ fontSize: '0.9rem', padding: '1rem', textAlign: 'left' }}>
                              <span style={{ fontWeight: 500 }}>
                                {emp.firstName} {emp.lastName}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.9rem', padding: '1rem', color: '#6b7280', textAlign: 'left' }}>
                              {emp.roleName}
                            </td>
                            <td style={{ fontSize: '0.9rem', padding: '1rem', color: '#6b7280', textAlign: 'left' }}>
                              {emp.departmentName}
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
                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                  <div className="text-muted" style={{ fontSize: '0.9rem' }}>
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
                          style={{ borderRadius: '6px 0 0 6px' }}
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
                          style={{ borderRadius: '0 6px 6px 0' }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>

            {/* Footer */}
            <div 
              className="modal-footer" 
              style={{ 
                padding: '1rem 1.5rem',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: 'white',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}
            >
              <button
                type="button"
                className="btn"
                onClick={onClose}
                style={{ 
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: '#6b7280',
                  border: 'none',
                  color: 'white',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b7280';
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={onUpdate}
                disabled={isSubmitting}
                style={{ 
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  padding: '0.6rem 1.5rem',
                  borderRadius: '8px',
                  background: 'var(--gradient-primary)',
                  border: 'none',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(192, 38, 211, 0.3)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(192, 38, 211, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(192, 38, 211, 0.3)';
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Update Managers
                  </>
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
