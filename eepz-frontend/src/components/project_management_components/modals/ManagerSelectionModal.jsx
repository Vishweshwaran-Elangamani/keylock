import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, UserCog, Info } from 'lucide-react';

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
  activeSearchTerm, // NEW: Receive from parent
  setActiveSearchTerm, // NEW: Receive from parent
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

  // Search handlers
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
  };

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

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000
        }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        style={{ 
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001,
          width: '950px',
          maxWidth: '90vw',
          maxHeight: '85vh'
        }}
      >
        <div 
          style={{ 
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white'
          }}
        >
          {/* Header */}
          <div 
            style={{ 
              backgroundColor: '#25235c',
              borderBottom: 'none',
              padding: '1.25rem 1.5rem',
              color: 'white',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <h5 style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'white'
            }}>
              <UserCog size={20} style={{ color: 'white' }} />
              <span>Edit Reporting Managers - {project?.projectName}</span>
            </h5>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1,
                opacity: 0.9
              }}
            >
              <X size={22} />
            </button>
          </div>

          <div 
            style={{ 
              padding: '1.25rem 1.5rem', 
              backgroundColor: '#f8f9fa',
              overflowY: 'auto',
              flex: 1
            }}
          >
            {message && (
              <div
                className={`alert alert-${
                  message.type === "success" ? "success" : "danger"
                } d-flex align-items-center gap-2 mb-3`}
                style={{
                  borderRadius: '8px',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor: message.type === 'success' 
                    ? 'rgba(36, 161, 72, 0.1)' 
                    : 'rgba(224, 25, 80, 0.1)',
                  color: message.type === 'success' ? '#24A148' : '#E01950',
                  textAlign: 'left'
                }}
              >
                {message.type === "success" ? (
                  <CheckCircle size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* Manager Tabs */}
            <ul 
              className="nav nav-pills mb-3" 
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
                    fontSize: '0.875rem', 
                    fontWeight: 600,
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    backgroundColor: activeTab === 'resource' ? 'var(--color-primary-1)' : 'white',
                    color: activeTab === 'resource' ? 'white' : '#6b7280',
                    border: activeTab === 'resource' ? 'none' : '1px solid #d1d5db',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  Resource Owner{" "}
                  {selectedResourceOwner && (
                    <span 
                      style={{ 
                        backgroundColor: activeTab === 'resource' ? 'rgba(255,255,255,0.3)' : '#10b981',
                        color: 'white',
                        fontSize: '0.65rem',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <CheckCircle size={10} />
                    </span>
                  )}
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "l1" ? "active" : ""}`}
                  onClick={() => setActiveTab("l1")}
                  style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600,
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    backgroundColor: activeTab === 'l1' ? 'var(--color-primary-1)' : 'white',
                    color: activeTab === 'l1' ? 'white' : '#6b7280',
                    border: activeTab === 'l1' ? 'none' : '1px solid #d1d5db',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  L1 Approver{" "}
                  {selectedL1Approver && (
                    <span 
                      style={{ 
                        backgroundColor: activeTab === 'l1' ? 'rgba(255,255,255,0.3)' : '#10b981',
                        color: 'white',
                        fontSize: '0.65rem',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <CheckCircle size={10} />
                    </span>
                  )}
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "l2" ? "active" : ""}`}
                  onClick={() => setActiveTab("l2")}
                  style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600,
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    backgroundColor: activeTab === 'l2' ? 'var(--color-primary-1)' : 'white',
                    color: activeTab === 'l2' ? 'white' : '#6b7280',
                    border: activeTab === 'l2' ? 'none' : '1px solid #d1d5db',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  L2 Approver{" "}
                  {selectedL2Approver && (
                    <span 
                      style={{ 
                        backgroundColor: activeTab === 'l2' ? 'rgba(255,255,255,0.3)' : '#10b981',
                        color: 'white',
                        fontSize: '0.65rem',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <CheckCircle size={10} />
                    </span>
                  )}
                </button>
              </li>
            </ul>

            {/* Current Selection Display */}
            <div
              className="alert alert-info d-flex align-items-start gap-2 mb-3"
              style={{
                borderRadius: '8px',
                border: 'none',
                padding: '0.875rem',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                color: '#084298',
                textAlign: 'left'
              }}
            >
              <Info size={18} className="flex-shrink-0 mt-1" />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '0.875rem' }}>Current Selection:</strong>
                <div className="mt-1">
                  {getSelectedManager() ? (
                    <span 
                      className="badge" 
                      style={{ 
                        fontSize: '0.8rem', 
                        padding: '0.4rem 0.65rem',
                        backgroundColor: '#10b981',
                        color: 'white'
                      }}
                    >
                      {getSelectedManager().firstName}{" "}
                      {getSelectedManager().lastName} -{" "}
                      {getSelectedManager().roleName}
                    </span>
                  ) : (
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>None selected</span>
                  )}
                </div>
              </div>
            </div>

            {/* Filters with Search Button and Clear Icon */}
            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search 
                    size={16} 
                    style={{ 
                      position: 'absolute',
                      left: '0.875rem',
                      color: '#6b7280',
                      pointerEvents: 'none',
                      zIndex: 2
                    }} 
                  />
                  <input
                    type="text"
                    className="form-control text-start"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    style={{ 
                      fontSize: '0.875rem',
                      border: '1px solid #d1d5db',
                      padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                      borderRadius: '8px',
                      width: '100%',
                      paddingRight: activeSearchTerm ? '130px' : '90px'
                    }}
                  />
                  {/* Clear Icon */}
                  {activeSearchTerm && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      style={{
                        position: 'absolute',
                        right: '85px',
                        background: 'transparent',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        padding: 0,
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#c82333';
                        e.currentTarget.style.transform = 'scale(1.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#dc3545';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Clear search"
                    >
                      <X size={18} style={{ strokeWidth: 2.5 }} />
                    </button>
                  )}
                  {/* Search Button */}
                  <button
                    type="button"
                    onClick={handleSearch}
                    style={{
                      position: 'absolute',
                      right: '4px',
                      background: '#5A5486',
                      border: 'none',
                      color: 'white',
                      borderRadius: '6px',
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      zIndex: 1,
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#4A4076';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(90, 84, 134, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#5A5486';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Search size={14} />
                    Search
                  </button>
                </div>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select text-start"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  style={{ 
                    fontSize: '0.875rem',
                    border: '1px solid #d1d5db',
                    padding: '0.5rem 0.75rem',
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
                    fontSize: '0.875rem',
                    border: '1px solid #d1d5db',
                    padding: '0.5rem 0.75rem',
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
                minHeight: '300px', 
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
                    <th style={{ width: '50px', fontSize: '0.8rem', padding: '0.75rem', fontWeight: 600, textAlign: 'left' }}>
                      Select
                    </th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', fontWeight: 600, textAlign: 'left' }}>
                      Employee Name
                    </th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', fontWeight: 600, textAlign: 'left' }}>
                      Role
                    </th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', fontWeight: 600, textAlign: 'left' }}>
                      Department
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedManagers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-4 text-muted"
                        style={{ fontSize: '0.875rem' }}
                      >
                        {activeSearchTerm ? 'No employees found matching your search' : 'No employees found'}
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
                            style={{ padding: '0.75rem', textAlign: 'left' }}
                          >
                            <input
                              type="radio"
                              className="form-check-input"
                              name={`manager-${activeTab}`}
                              checked={isSelected}
                              onChange={() => onManagerSelect(emp)}
                              style={{ 
                                width: '16px', 
                                height: '16px',
                                cursor: 'pointer'
                              }}
                            />
                          </td>
                          <td style={{ fontSize: '0.875rem', padding: '0.75rem', textAlign: 'left' }}>
                            <span style={{ fontWeight: 500 }}>
                              {emp.firstName} {emp.lastName}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.875rem', padding: '0.75rem', color: '#6b7280', textAlign: 'left' }}>
                            {emp.roleName}
                          </td>
                          <td style={{ fontSize: '0.875rem', padding: '0.75rem', color: '#6b7280', textAlign: 'left' }}>
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
              <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                  Page {currentPage} of {totalPages}
                </div>
                <nav>
                  <ul className="pagination mb-0" style={{ fontSize: '0.875rem' }}>
                    <li
                      className={`page-item ${
                        currentPage === 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{ borderRadius: '6px 0 0 6px', padding: '0.375rem 0.75rem' }}
                      >
                        <ChevronLeft size={14} />
                      </button>
                    </li>
                    {getPageNumbers().map((page, index) =>
                      page === "..." ? (
                        <li
                          key={`mgr-ellipsis-${index}`}
                          className="page-item disabled"
                        >
                          <span className="page-link" style={{ padding: '0.375rem 0.75rem' }}>...</span>
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
                            style={{ padding: '0.375rem 0.75rem' }}
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
                        style={{ borderRadius: '0 6px 6px 0', padding: '0.375rem 0.75rem' }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>

          {/* Footer */}
          <div 
            style={{ 
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: 'white',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              flexShrink: 0
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{ 
                fontSize: '0.875rem',
                fontWeight: 600,
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: '#6b7280',
                border: 'none',
                color: 'white',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
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
              onClick={onUpdate}
              disabled={isSubmitting}
              style={{ 
                fontSize: '0.875rem',
                fontWeight: 600,
                padding: '0.5rem 1.5rem',
                borderRadius: '8px',
                background: 'var(--gradient-primary)',
                border: 'none',
                color: 'white',
                boxShadow: '0 4px 12px rgba(192, 38, 211, 0.3)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
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
                  <span className="spinner-border spinner-border-sm" style={{ width: '14px', height: '14px' }} />
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

  // Render using React Portal
  return ReactDOM.createPortal(modalContent, document.body);
};

export default ManagerSelectionModal;
