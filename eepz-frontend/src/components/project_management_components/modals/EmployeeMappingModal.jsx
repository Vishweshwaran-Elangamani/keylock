import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  Search,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';

// Custom Dropdown Component
const CustomDropdown = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (!value || value === 'All') return placeholder || 'Select';
    return value;
  };

  return (
    <div
      style={{ position: 'relative', fontFamily: 'Poppins, sans-serif' }}
      ref={dropdownRef}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          background: '#FFFFFF',
          border: isOpen ? '1px solid #27235C' : '1px solid #d1d5db',
          borderRadius: isOpen ? '8px 8px 0 0' : '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          outline: 'none',
          userSelect: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(39, 35, 92, 0.1)' : 'none',
          fontFamily: 'Poppins, sans-serif',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          style={{
            flex: 1,
            textAlign: 'left',
            color: value && value !== 'All' ? '#393939' : '#8D8D8D',
            fontWeight: 400,
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {getDisplayValue()}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: isOpen ? '#27235C' : '#6c757d',
            transition: 'all 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
            marginLeft: '0.5rem',
            cursor: 'pointer',
          }}
        />
      </div>
      {isOpen && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            border: '1px solid #27235C',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
            maxHeight: '220px',
            overflowY: 'auto',
            zIndex: 10000,
            listStyle: 'none',
            margin: 0,
            padding: 0,
            animation: 'dropdownFadeIn 0.2s ease',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {options.map((opt, idx) => {
            const optValue = opt.value || opt;
            const optLabel = opt.label || opt;
            return (
              <li
                key={idx}
                style={{
                  padding: '0.65rem 0.875rem',
                  fontSize: '0.875rem',
                  color: value === optValue ? '#FFFFFF' : '#393939',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  borderBottom:
                    idx === options.length - 1 ? 'none' : '1px solid #f0f0f0',
                  background: value === optValue ? '#27235C' : '#FFFFFF',
                  fontWeight: value === optValue ? 600 : 400,
                  borderRadius: idx === options.length - 1 ? '0 0 7px 7px' : '0',
                  fontFamily: 'Poppins, sans-serif',
                }}
                onClick={() => handleSelect(optValue)}
                onMouseEnter={(e) => {
                  if (value !== optValue) {
                    e.currentTarget.style.background = '#27235C';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== optValue) {
                    e.currentTarget.style.background = '#FFFFFF';
                    e.currentTarget.style.color = '#393939';
                  }
                }}
              >
                {optLabel}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

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

  // Search handlers (same pattern as Project List)
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    setActiveSearchTerm(searchTerm.trim());
  };

  const handleCancelSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

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

  // Filter out employees with "Admin" role
  const displayEmployees = filteredEmployees.filter(
    (emp) => emp.roleName && emp.roleName.toLowerCase() !== 'admin'
  );

  // Filter out "Admin" role from unique roles
  const displayUniqueRoles = uniqueRoles.filter(
    (role) => role && role.toLowerCase() !== 'admin'
  );

  const roleOptions = ['All', ...displayUniqueRoles];
  const departmentOptions = ['All', ...uniqueDepartments];
  const statusOptions = ['All', 'Mapped', 'Unmapped'];

  const modalContent = (
    <>
      <style>
        {`
          @keyframes dropdownFadeIn {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* Custom Checkbox Styles */
          .custom-checkbox {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            width: 16px;
            height: 16px;
            border: 1.5px solid #8D8D8D;
            border-radius: 3px;
            outline: none;
            cursor: pointer;
            position: relative;
            background-color: #FFFFFF;
            transition: all 0.2s ease;
            margin: 0;
            padding: 0;
            flex-shrink: 0;
            display: inline-block;
            vertical-align: middle;
          }
          
          .custom-checkbox:hover {
            border-color: #524F7D;
          }
          
          .custom-checkbox:checked {
            border-color: #27235C;
            background-color: #27235C;
          }
          
          .custom-checkbox:checked::after {
            content: '';
            position: absolute;
            left: 4px;
            top: 1px;
            width: 4px;
            height: 8px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
          }
          
          .custom-checkbox:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            border-color: #8D8D8D;
            background-color: #f3f4f6;
          }
          
          .custom-checkbox:disabled:hover {
            border-color: #8D8D8D;
          }
          
          .custom-checkbox:focus {
            outline: none;
          }
        `}
      </style>

      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000,
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
          maxHeight: '85vh',
          fontFamily: 'Poppins, sans-serif',
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
            backgroundColor: 'white',
            fontFamily: 'Poppins, sans-serif',
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
              justifyContent: 'space-between',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <h5
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'white',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
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
                opacity: 0.9,
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
              flex: 1,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {message && (
              <div
                className={`alert alert-${
                  message.type === 'success' ? 'success' : 'danger'
                } d-flex align-items-center gap-2 mb-3`}
                style={{
                  borderRadius: '8px',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor:
                    message.type === 'success'
                      ? 'rgba(36, 161, 72, 0.1)'
                      : 'rgba(224, 25, 80, 0.1)',
                  color: message.type === 'success' ? '#24A148' : '#E01950',
                  textAlign: 'left',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {message.type === 'success' ? (
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
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(13, 110, 253, 0.1)',
                  color: '#084298',
                  textAlign: 'left',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                <Info size={18} className="flex-shrink-0 mt-1" />
                <div style={{ textAlign: 'left' }}>
                  <strong
                    style={{
                      fontSize: '0.875rem',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    Note:
                  </strong>{' '}
                  The following employees are automatically associated with this
                  project as managers:
                  <ul
                    className="mb-0 mt-2"
                    style={{
                      fontSize: '0.85rem',
                      textAlign: 'left',
                      paddingLeft: '1.25rem',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {project.resourceOwner && (
                      <li>
                        <strong>Resource Owner:</strong>{' '}
                        {project.resourceOwner.firstName}{' '}
                        {project.resourceOwner.lastName}
                      </li>
                    )}
                    {project.l1Approver && (
                      <li>
                        <strong>L1 Approver:</strong>{' '}
                        {project.l1Approver.firstName}{' '}
                        {project.l1Approver.lastName}
                      </li>
                    )}
                    {project.l2Approver && (
                      <li>
                        <strong>L2 Approver:</strong>{' '}
                        {project.l2Approver.firstName}{' '}
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
                    color: 'var(--gradient-primary)',
                  }}
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p
                  className="mt-3 text-muted"
                  style={{
                    fontSize: '0.875rem',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Loading employees...
                </p>
              </div>
            ) : (
              <>
                {/* Filters with Search Button */}
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <div
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Search
                        size={16}
                        style={{
                          position: 'absolute',
                          left: '0.875rem',
                          color: '#6b7280',
                          pointerEvents: 'none',
                          zIndex: 2,
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
                          paddingRight: '7.5rem',
                          fontFamily: 'Poppins, sans-serif',
                        }}
                      />

                      {/* Search / Cancel button, square and full height */}
                      {activeSearchTerm ? (
                        <button
                          type="button"
                          onClick={handleCancelSearch}
                          style={{
                            position: 'absolute',
                            right: '3px',
                            top: '3px',
                            bottom: '3px',
                            background: '#6b7280',
                            border: '1px solid #6b7280',
                            color: 'white',
                            borderRadius: '0 8px 8px 0',
                            padding: '0 1rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            zIndex: 1,
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            fontFamily: 'Poppins, sans-serif',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#4b5563';
                            e.currentTarget.style.borderColor = '#4b5563';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#6b7280';
                            e.currentTarget.style.borderColor = '#6b7280';
                          }}
                        >
                          <X size={14} />
                          Cancel
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSearch}
                          style={{
                            position: 'absolute',
                            right: '3px',
                            top: '3px',
                            bottom: '3px',
                            background: '#252267',
                            border: 'none',
                            color: 'white',
                            borderRadius: '0 8px 8px 0',
                            padding: '0 1rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            zIndex: 1,
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            fontFamily: 'Poppins, sans-serif',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#1f1b5a';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#252267';
                          }}
                        >
                          <Search size={14} />
                          Search
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="col-md-2">
                    <CustomDropdown
                      value={filterRole}
                      onChange={setFilterRole}
                      options={roleOptions}
                      placeholder="All Roles"
                    />
                  </div>
                  <div className="col-md-2">
                    <CustomDropdown
                      value={filterDepartment}
                      onChange={setFilterDepartment}
                      options={departmentOptions}
                      placeholder="All Departments"
                    />
                  </div>
                  <div className="col-md-2">
                    <CustomDropdown
                      value={filterStatus}
                      onChange={setFilterStatus}
                      options={statusOptions}
                      placeholder="All Status"
                    />
                  </div>
                </div>

                {/* Selection Summary */}
                <div className="mb-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex gap-2 flex-wrap">
                    <span
                      className="badge"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.35rem 0.6rem',
                        backgroundColor: '#0ea5e9',
                        color: 'white',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {selectedEmployeeIds.length} Selected
                    </span>
                    <span
                      className="badge"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.35rem 0.6rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      Mapped: {getMappedCount()}
                    </span>
                    <span
                      className="badge"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.35rem 0.6rem',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      Unmapped: {getUnmappedCount()}
                    </span>
                    {primaryEmployeeIds.length > 0 && (
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.6rem',
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          fontFamily: 'Poppins, sans-serif',
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
                      padding: '0.35rem 0.75rem',
                      fontFamily: 'Poppins, sans-serif',
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
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: '#92400e',
                    textAlign: 'left',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <Info size={16} className="flex-shrink-0 mt-1" />
                  <div
                    style={{
                      fontSize: '0.8rem',
                      textAlign: 'left',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
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
                    backgroundColor: 'white',
                  }}
                >
                  <table
                    className="table table-hover mb-0"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    <thead
                      className="table-light"
                      style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                      }}
                    >
                      <tr style={{ textAlign: 'left' }}>
                        <th
                          style={{
                            width: '50px',
                            fontSize: '0.8rem',
                            padding: '0.75rem',
                            fontWeight: 600,
                            textAlign: 'left',
                            fontFamily: 'Poppins, sans-serif',
                          }}
                        >
                          Select
                        </th>
                        <th
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.75rem',
                            fontWeight: 600,
                            textAlign: 'left',
                            fontFamily: 'Poppins, sans-serif',
                          }}
                        >
                          Employee Name
                        </th>
                        <th
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.75rem',
                            fontWeight: 600,
                            textAlign: 'left',
                            fontFamily: 'Poppins, sans-serif',
                          }}
                        >
                          Role
                        </th>
                        <th
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.75rem',
                            fontWeight: 600,
                            textAlign: 'left',
                            fontFamily: 'Poppins, sans-serif',
                          }}
                        >
                          Department
                        </th>
                        <th
                          style={{
                            width: '90px',
                            fontSize: '0.8rem',
                            padding: '0.75rem',
                            fontWeight: 600,
                            textAlign: 'left',
                            fontFamily: 'Poppins, sans-serif',
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            width: '110px',
                            fontSize: '0.8rem',
                            padding: '0.75rem',
                            fontWeight: 600,
                            textAlign: 'center',
                            fontFamily: 'Poppins, sans-serif',
                          }}
                        >
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
                            style={{
                              fontSize: '0.875rem',
                              fontFamily: 'Poppins, sans-serif',
                            }}
                          >
                            {activeSearchTerm
                              ? 'No employees found matching your search'
                              : 'No employees match the filters'}
                          </td>
                        </tr>
                      ) : (
                        displayEmployees.map((emp) => {
                          const isMapped = mappedEmployees.some(
                            (m) =>
                              m.employeeMasterId === emp.employeeMasterId
                          );
                          const isSelected = selectedEmployeeIds.includes(
                            emp.employeeMasterId
                          );
                          const isPrimary = primaryEmployeeIds.includes(
                            emp.employeeMasterId
                          );

                          return (
                            <tr
                              key={emp.employeeMasterId}
                              className={isSelected ? 'table-active' : ''}
                              style={{
                                transition: 'background-color 0.15s ease',
                              }}
                            >
                              <td
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  padding: '0.75rem',
                                  textAlign: 'left',
                                  verticalAlign: 'middle',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  className="custom-checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    onEmployeeSelect(emp.employeeMasterId)
                                  }
                                />
                              </td>
                              <td
                                style={{
                                  fontSize: '0.875rem',
                                  padding: '0.75rem',
                                  textAlign: 'left',
                                  fontFamily: 'Poppins, sans-serif',
                                  verticalAlign: 'middle',
                                }}
                              >
                                <span style={{ fontWeight: 500 }}>
                                  {emp.firstName} {emp.lastName}
                                </span>
                              </td>
                              <td
                                style={{
                                  fontSize: '0.875rem',
                                  padding: '0.75rem',
                                  color: '#6b7280',
                                  textAlign: 'left',
                                  fontFamily: 'Poppins, sans-serif',
                                  verticalAlign: 'middle',
                                }}
                              >
                                {emp.roleName}
                              </td>
                              <td
                                style={{
                                  fontSize: '0.875rem',
                                  padding: '0.75rem',
                                  color: '#6b7280',
                                  textAlign: 'left',
                                  fontFamily: 'Poppins, sans-serif',
                                  verticalAlign: 'middle',
                                }}
                              >
                                {emp.departmentName}
                              </td>
                              <td
                                style={{
                                  padding: '0.75rem',
                                  textAlign: 'left',
                                  verticalAlign: 'middle',
                                }}
                              >
                                {isMapped ? (
                                  <span
                                    className="badge d-flex align-items-center gap-1"
                                    style={{
                                      fontSize: '0.75rem',
                                      backgroundColor: '#10b981',
                                      color: 'white',
                                      width: 'fit-content',
                                      fontFamily: 'Poppins, sans-serif',
                                    }}
                                  >
                                    <Check size={12} />
                                    Mapped
                                  </span>
                                ) : (
                                  <span
                                    className="badge"
                                    style={{
                                      fontSize: '0.75rem',
                                      backgroundColor: '#6b7280',
                                      color: 'white',
                                      fontFamily: 'Poppins, sans-serif',
                                    }}
                                  >
                                    Unmapped
                                  </span>
                                )}
                              </td>
                              <td
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  padding: '0.75rem',
                                  textAlign: 'center',
                                  verticalAlign: 'middle',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  className="custom-checkbox"
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
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: 'white',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              flexShrink: 0,
              fontFamily: 'Poppins, sans-serif',
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
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
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
                opacity: !hasSelectedUnmapped || isSubmitting ? 0.6 : 1,
                cursor:
                  !hasSelectedUnmapped || isSubmitting
                    ? 'not-allowed'
                    : 'pointer',
                fontFamily: 'Poppins, sans-serif',
              }}
              onMouseEnter={(e) => {
                if (!(!hasSelectedUnmapped || isSubmitting)) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 16px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    style={{ width: '14px', height: '14px' }}
                  />
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
                opacity: !hasSelectedMapped || isSubmitting ? 0.6 : 1,
                cursor:
                  !hasSelectedMapped || isSubmitting
                    ? 'not-allowed'
                    : 'pointer',
                fontFamily: 'Poppins, sans-serif',
              }}
              onMouseEnter={(e) => {
                if (!(!hasSelectedMapped || isSubmitting)) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 16px rgba(239, 68, 68, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    style={{ width: '14px', height: '14px' }}
                  />
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
