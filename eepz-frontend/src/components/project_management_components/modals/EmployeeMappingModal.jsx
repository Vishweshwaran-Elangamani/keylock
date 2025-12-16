import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Users, CheckCircle, AlertCircle, Info, Search, Check, X } from 'lucide-react';


const EmployeeMappingModal = ({
  show,
  onClose,
  project,
  filteredEmployees,
  mappedEmployees,
  selectedEmployeeIds,
  primaryEmployeeIds,
  searchTerm,
  setSearchTerm,
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


  //  Filter out employees with "Admin" role
  const displayEmployees = filteredEmployees.filter(
    emp => emp.roleName && emp.roleName.toLowerCase() !== 'admin'
  );


  // Filter out "Admin" role from unique roles
  const displayUniqueRoles = uniqueRoles.filter(
    role => role && role.toLowerCase() !== 'admin'
  );


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

      {/* Modal Container - SMALLER SIZE */}
      <div
        style={{ 
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001,
          width: '1200px',
          maxWidth: '95vw',
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
              padding: '1rem 1.5rem',
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
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'white'
            }}>
              <Users size={20} style={{ color: 'white' }} />
              <span>Map/Unmap Employees - {project?.projectName}</span>
            </h5>
            <button
              type="button"
              onClick={onClose}
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
              <X size={20} />
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
                  padding: '0.875rem',
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


            {getProjectManagerIds().length > 0 && (
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
                  <strong style={{ fontSize: '0.875rem' }}>Note:</strong> The following employees are
                  automatically associated with this project as managers:
                  <ul className="mb-0 mt-2" style={{ fontSize: '0.85rem', textAlign: 'left' }}>
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
                <div 
                  className="spinner-border" 
                  role="status"
                  style={{ 
                    width: '2.5rem', 
                    height: '2.5rem',
                    color: 'var(--gradient-primary)'
                  }}
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted" style={{ fontSize: '0.875rem' }}>Loading employees...</p>
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <div className="input-group">
                      <span 
                        className="input-group-text"
                        style={{
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderRight: 'none',
                          borderRadius: '8px 0 0 8px'
                        }}
                      >
                        <Search size={18} style={{ color: '#6b7280' }} />
                      </span>
                      <input
                        type="text"
                        className="form-control text-start"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ 
                          fontSize: '0.875rem',
                          border: '1px solid #d1d5db',
                          borderLeft: 'none',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0 8px 8px 0'
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
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
                      {displayUniqueRoles.map((role, idx) => (
                        <option key={idx} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
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
                  <div className="col-md-2">
                    <select
                      className="form-select text-start"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      style={{ 
                        fontSize: '0.875rem',
                        border: '1px solid #d1d5db',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px'
                      }}
                    >
                      <option value="All">All Status</option>
                      <option value="Mapped">Mapped</option>
                      <option value="Unmapped">Unmapped</option>
                    </select>
                  </div>
                </div>


                {/* Selection Summary */}
                <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex gap-2 flex-wrap">
                    <span 
                      className="badge" 
                      style={{ 
                        fontSize: '0.8rem', 
                        padding: '0.4rem 0.65rem',
                        backgroundColor: '#0ea5e9',
                        color: 'white'
                      }}
                    >
                      {selectedEmployeeIds.length} Selected
                    </span>
                    <span 
                      className="badge" 
                      style={{ 
                        fontSize: '0.8rem', 
                        padding: '0.4rem 0.65rem',
                        backgroundColor: '#10b981',
                        color: 'white'
                      }}
                    >
                      Mapped: {getMappedCount()}
                    </span>
                    <span 
                      className="badge" 
                      style={{ 
                        fontSize: '0.8rem', 
                        padding: '0.4rem 0.65rem',
                        backgroundColor: '#f59e0b',
                        color: 'white'
                      }}
                    >
                      Unmapped: {getUnmappedCount()}
                    </span>
                    {primaryEmployeeIds.length > 0 && (
                      <span 
                        className="badge" 
                        style={{ 
                          fontSize: '0.8rem', 
                          padding: '0.4rem 0.65rem',
                          backgroundColor: '#8b5cf6',
                          color: 'white'
                        }}
                      >
                        {primaryEmployeeIds.length} Primary Set
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onSelectAll}
                    style={{ 
                      fontSize: '0.8rem',
                      borderRadius: '8px',
                      padding: '0.4rem 0.85rem'
                    }}
                  >
                    Select/Deselect All
                  </button>
                </div>


                <div
                  className="alert alert-warning d-flex align-items-start gap-2 mb-3"
                  style={{
                    borderRadius: '8px',
                    border: 'none',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: '#92400e',
                    textAlign: 'left'
                  }}
                >
                  <Info size={18} className="flex-shrink-0 mt-1" />
                  <div style={{ fontSize: '0.85rem', textAlign: 'left' }}>
                    <strong>Primary Project:</strong> You can select multiple
                    employees and mark multiple as primary for this project.
                    Employees must be selected first before marking as primary.
                  </div>
                </div>


                {/* Employee Table */}
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
                        <th style={{ width: '90px', fontSize: '0.8rem', padding: '0.75rem', fontWeight: 600, textAlign: 'left' }}>
                          Status
                        </th>
                        <th style={{ width: '110px', fontSize: '0.8rem', padding: '0.75rem', fontWeight: 600, textAlign: 'left' }}>
                          Primary Project
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayEmployees.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="text-center py-4 text-muted"
                            style={{ fontSize: '0.875rem' }}
                          >
                            No employees match the filters
                          </td>
                        </tr>
                      ) : (
                        displayEmployees.map((emp) => {
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
                              className={isSelected ? 'table-active' : ''}
                              style={{ 
                                transition: 'background-color 0.15s ease'
                              }}
                            >
                              <td 
                                onClick={(e) => e.stopPropagation()} 
                                style={{ padding: '0.75rem', textAlign: 'left' }}
                              >
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isSelected}
                                  onChange={() =>
                                    onEmployeeSelect(emp.employeeMasterId)
                                  }
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
                              <td style={{ padding: '0.75rem', textAlign: 'left' }}>
                                {isMapped ? (
                                  <span 
                                    className="badge d-flex align-items-center gap-1" 
                                    style={{ 
                                      fontSize: '0.75rem',
                                      backgroundColor: '#10b981',
                                      color: 'white',
                                      width: 'fit-content'
                                    }}
                                  >
                                    <Check size={12} />
                                    Mapped {currentlyMappedAsPrimary && <span style={{ marginLeft: '2px' }}>Primary</span>}
                                  </span>
                                ) : (
                                  <span 
                                    className="badge" 
                                    style={{ 
                                      fontSize: '0.75rem',
                                      backgroundColor: '#6b7280',
                                      color: 'white'
                                    }}
                                  >
                                    Unmapped
                                  </span>
                                )}
                              </td>
                              <td 
                                onClick={(e) => e.stopPropagation()} 
                                style={{ padding: '0.75rem', textAlign: 'left' }}
                              >
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
                                      ? 'Select employee first'
                                      : 'Mark as primary'
                                  }
                                  style={{ 
                                    width: '16px', 
                                    height: '16px',
                                    cursor: isSelected ? 'pointer' : 'not-allowed'
                                  }}
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


          {/* Footer */}
          <div 
            style={{ 
              padding: '0.875rem 1.5rem',
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
                padding: '0.5rem 1.1rem',
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
              Close
            </button>
            <button
              type="button"
              onClick={onMap}
              disabled={!hasSelectedUnmapped || isSubmitting}
              style={{ 
                fontSize: '0.875rem',
                fontWeight: 600,
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: '#10b981',
                border: 'none',
                color: 'white',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: (!hasSelectedUnmapped || isSubmitting) ? 0.6 : 1,
                cursor: (!hasSelectedUnmapped || isSubmitting) ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!(!hasSelectedUnmapped || isSubmitting)) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" style={{ width: '14px', height: '14px' }} />
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
              style={{ 
                fontSize: '0.875rem',
                fontWeight: 600,
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: '#ef4444',
                border: 'none',
                color: 'white',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: (!hasSelectedMapped || isSubmitting) ? 0.6 : 1,
                cursor: (!hasSelectedMapped || isSubmitting) ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!(!hasSelectedMapped || isSubmitting)) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" style={{ width: '14px', height: '14px' }} />
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

  // Render using React Portal
  return ReactDOM.createPortal(modalContent, document.body);
};


export default EmployeeMappingModal;
