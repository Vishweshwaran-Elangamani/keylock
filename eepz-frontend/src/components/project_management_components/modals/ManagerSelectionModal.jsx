import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  UserCog,
  Info,
  ChevronDown,
} from 'lucide-react';

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
  // pagination
  itemsPerPage,
  onPageSizeChange,
  totalItems,
}) => {
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

  // UPDATED search handlers (same behavior as other pages)
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

  const roleOptions = ['All', ...uniqueRoles];
  const departmentOptions = ['All', ...uniqueDepartments];

  const safeTotal =
    typeof totalItems === 'number' ? totalItems : paginatedManagers.length;
  const perPage = itemsPerPage || paginatedManagers.length || 1;
  const startIndex = safeTotal === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endIndex =
    safeTotal === 0 ? 0 : Math.min(currentPage * perPage, safeTotal);

  const modalContent = (
    <>
      <style>
        {`
          @keyframes dropdownFadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .custom-radio {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            width: 16px;
            height: 16px;
            border: 1.5px solid #B7BACE;
            border-radius: 50%;
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

          .custom-radio:hover { border-color: #524F7D; }

          .custom-radio:checked {
            border-color: #27235C;
            background-color: #27235C;
            box-shadow: inset 0 0 0 2.5px #FFFFFF;
          }

          .custom-radio:focus { outline: none; }
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
                opacity: 0.9,
              }}
            >
              <X size={22} />
            </button>
          </div>

          {/* Body */}
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

            {/* Tabs */}
            <ul
              className="nav nav-pills mb-3"
              style={{
                borderBottom: 'none',
                gap: '0.5rem',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === 'resource' ? 'active' : ''
                  }`}
                  onClick={() => setActiveTab('resource')}
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    backgroundColor:
                      activeTab === 'resource'
                        ? 'var(--color-primary-1)'
                        : 'white',
                    color: activeTab === 'resource' ? 'white' : '#6b7280',
                    border:
                      activeTab === 'resource'
                        ? 'none'
                        : '1px solid #d1d5db',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Resource Owner{' '}
                  {selectedResourceOwner && (
                    <span
                      style={{
                        backgroundColor:
                          activeTab === 'resource'
                            ? 'rgba(255,255,255,0.3)'
                            : '#10b981',
                        color: 'white',
                        fontSize: '0.65rem',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle size={10} />
                    </span>
                  )}
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'l1' ? 'active' : ''}`}
                  onClick={() => setActiveTab('l1')}
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    backgroundColor:
                      activeTab === 'l1' ? 'var(--color-primary-1)' : 'white',
                    color: activeTab === 'l1' ? 'white' : '#6b7280',
                    border:
                      activeTab === 'l1' ? 'none' : '1px solid #d1d5db',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  L1 Approver{' '}
                  {selectedL1Approver && (
                    <span
                      style={{
                        backgroundColor:
                          activeTab === 'l1'
                            ? 'rgba(255,255,255,0.3)'
                            : '#10b981',
                        color: 'white',
                        fontSize: '0.65rem',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle size={10} />
                    </span>
                  )}
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'l2' ? 'active' : ''}`}
                  onClick={() => setActiveTab('l2')}
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    backgroundColor:
                      activeTab === 'l2' ? 'var(--color-primary-1)' : 'white',
                    color: activeTab === 'l2' ? 'white' : '#6b7280',
                    border:
                      activeTab === 'l2' ? 'none' : '1px solid #d1d5db',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  L2 Approver{' '}
                  {selectedL2Approver && (
                    <span
                      style={{
                        backgroundColor:
                          activeTab === 'l2'
                            ? 'rgba(255,255,255,0.3)'
                            : '#10b981',
                        color: 'white',
                        fontSize: '0.65rem',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle size={10} />
                    </span>
                  )}
                </button>
              </li>
            </ul>

            {/* Current Selection */}
            <div
              className="alert alert-info d-flex align-items-start gap-2 mb-3"
              style={{
                borderRadius: '8px',
                border: 'none',
                padding: '0.875rem',
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
                  Current Selection:
                </strong>
                <div className="mt-1">
                  {getSelectedManager() ? (
                    <span
                      className="badge"
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.4rem 0.65rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {getSelectedManager().firstName}{' '}
                      {getSelectedManager().lastName} -{' '}
                      {getSelectedManager().roleName}
                    </span>
                  ) : (
                    <span
                      className="text-muted"
                      style={{
                        fontSize: '0.8rem',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      None selected
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Search + Filters */}
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

                  {/* Search / Cancel button – same style as other pages */}
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
              <div className="col-md-3">
                <CustomDropdown
                  value={filterRole}
                  onChange={setFilterRole}
                  options={roleOptions}
                  placeholder="All Roles"
                />
              </div>
              <div className="col-md-3">
                <CustomDropdown
                  value={filterDepartment}
                  onChange={setFilterDepartment}
                  options={departmentOptions}
                  placeholder="All Departments"
                />
              </div>
            </div>

            {/* Manager List Table */}
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
                  </tr>
                </thead>
                <tbody>
                  {paginatedManagers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-4 text-muted"
                        style={{
                          fontSize: '0.875rem',
                          fontFamily: 'Poppins, sans-serif',
                        }}
                      >
                        {activeSearchTerm
                          ? 'No employees found matching your search'
                          : 'No employees found'}
                      </td>
                    </tr>
                  ) : (
                    paginatedManagers.map((emp) => {
                      const selected = isManagerSelected(emp);
                      return (
                        <tr
                          key={emp.employeeMasterId}
                          className={selected ? 'table-active' : ''}
                          style={{
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                          }}
                          onClick={() => onManagerSelect(emp)}
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
                              type="radio"
                              className="custom-radio"
                              name={`manager-${activeTab}`}
                              checked={selected}
                              onChange={() => onManagerSelect(emp)}
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
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination – aligned like ProjectList */}
            {totalPages > 1 && (
              <div
                className="prj-list-pagination-container mt-3 pt-2"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                {/* Left: page size */}
                <div
                  className="prj-list-pagination-left"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span className="prj-list-pagination-label">Show</span>
                  <select
                    className="prj-list-page-size-select"
                    value={itemsPerPage}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    style={{ minWidth: '72px' }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                  </select>
                  <span className="prj-list-pagination-label">entries</span>
                </div>

                {/* Center: status text */}
                <div
                  className="prj-list-pagination-center"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    minWidth: '180px',
                  }}
                >
                  <span className="prj-list-pagination-status">
                    Showing {startIndex} to {endIndex} of {safeTotal} entries
                  </span>
                </div>

                {/* Right: page controls */}
                <div
                  className="prj-list-pagination-right"
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    minWidth: '140px',
                  }}
                >
                  <ul className="prj-list-pagination-list">
                    <li
                      className={`prj-list-page-item ${
                        currentPage === 1 ? 'disabled' : ''
                      }`}
                    >
                      <button
                        className="prj-list-page-link prj-list-page-arrow"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </button>
                    </li>
                    {getPageNumbers().map((page, index) =>
                      page === '...' ? (
                        <li
                          key={`mgr-ellipsis-${index}`}
                          className="prj-list-page-ellipsis"
                        >
                          <span className="prj-list-page-dots">...</span>
                        </li>
                      ) : (
                        <li
                          key={`mgr-${page}`}
                          className={`prj-list-page-item ${
                            currentPage === page ? 'active' : ''
                          }`}
                        >
                          <button
                            className="prj-list-page-link"
                            onClick={() => goToPage(page)}
                          >
                            {page}
                          </button>
                        </li>
                      )
                    )}
                    <li
                      className={`prj-list-page-item ${
                        currentPage === totalPages ? 'disabled' : ''
                      }`}
                    >
                      <button
                        className="prj-list-page-link prj-list-page-arrow"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </li>
                  </ul>
                </div>
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
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontFamily: 'Poppins, sans-serif',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 16px rgba(192, 38, 211, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '0 4px 12px rgba(192, 38, 211, 0.3)';
              }}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    style={{ width: '14px', height: '14px' }}
                  />
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
