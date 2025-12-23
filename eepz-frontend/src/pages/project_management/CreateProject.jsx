import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, AlertCircle, CheckCircle, Users, Building, Calendar as CalendarIcon, ChevronDown, UserCog, Search, ChevronLeft as ChevronLeftIcon, ChevronRight, Home } from 'lucide-react';
import projectService from '../../services/project_management/projectService';
import '../../styles/projectmanagement/CreateProject.css';

const PRIMARY = '#27235C';

const CreateProject = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    projectName: '',
    clientName: '',
    description: '',
    businessUnit: '',
    department: '',
    engagementModel: '',
    status: 'Active',
    startDate: '',
    endDate: '',
  });

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  
  // Individual loading states for dropdowns
  const [businessUnitsLoading, setBusinessUnitsLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Manager modal states
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [activeManagerTab, setActiveManagerTab] = useState('resource');
  const [selectedResourceOwner, setSelectedResourceOwner] = useState(null);
  const [selectedL1Approver, setSelectedL1Approver] = useState(null);
  const [selectedL2Approver, setSelectedL2Approver] = useState(null);
  
  const [managerSearchInput, setManagerSearchInput] = useState('');
  const [managerSearchTerm, setManagerSearchTerm] = useState('');
  const [managerFilterRole, setManagerFilterRole] = useState('All');
  const [managerFilterDepartment, setManagerFilterDepartment] = useState('All');
  const [managerCurrentPage, setManagerCurrentPage] = useState(1);
  const managerItemsPerPage = 10;

  // Calendar state
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);
  const startCalendarRef = useRef(null);
  const endCalendarRef = useRef(null);
  const [calendarMonth, setCalendarMonth] = useState(null);
  const [calendarYear, setCalendarYear] = useState(null);
  const [calendarField, setCalendarField] = useState(null);
  
  // End date viewport position
  const endInputRef = useRef(null);
  const [endCalPos, setEndCalPos] = useState({ top: 0, left: 0 });

  const statusOptions = ['Active', 'On Hold', 'Completed', 'Cancelled'];
  const engagementModels = ['Fixed Price', 'Time and Materials', 'Agile - Scrum', 'Agile - Kanban', 'Consulting', 'Retainer'];
  const PROJECTNAMEREGEX = /^ORG\.[A-Za-zA-Za-z0-9-]+\.[A-Za-zA-Za-z0-9-]+$/;

  // Reset pagination when filters change
  useEffect(() => {
    setManagerCurrentPage(1);
  }, [managerSearchTerm, managerFilterRole, managerFilterDepartment]);

  // Close calendars on outside click
  useEffect(() => {
    const handler = (e) => {
      if (startCalendarOpen && startCalendarRef.current && !startCalendarRef.current.contains(e.target)) {
        setStartCalendarOpen(false);
      }
      if (endCalendarOpen && endCalendarRef.current && !endCalendarRef.current.contains(e.target) && !endInputRef.current?.contains(e.target)) {
        setEndCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [startCalendarOpen, endCalendarOpen]);

  // Initialize loading states and fetch data
  useEffect(() => {
    setBusinessUnitsLoading(true);
    setDepartmentsLoading(true);
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    setIsLoadingData(true);
    try {
      const [employeesRes, departmentsRes, businessUnitsRes] = await Promise.all([
        projectService.getAllEmployees(),
        projectService.getAllDepartments(),
        projectService.getAllBusinessUnits(),
      ]);

      if (employeesRes.success) setEmployees(employeesRes.data);
      if (departmentsRes.success) {
        setDepartmentsLoading(false);
        setDepartments(departmentsRes.data);
      }
      if (businessUnitsRes.success) {
        setBusinessUnitsLoading(false);
        setBusinessUnits(businessUnitsRes.data);
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Failed to load dropdown data.' });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'projectName') {
      formattedValue = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    } else if (!PROJECTNAMEREGEX.test(formData.projectName.trim())) {
      newErrors.projectName = 'Format must be ORG.Dept.Project, e.g., ORG.IT.INTRANET';
    }
    
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    } else if (formData.clientName.trim().length < 2) {
      newErrors.clientName = 'Client name must be at least 2 characters';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.businessUnit.trim()) {
      newErrors.businessUnit = 'Business unit is required';
    }
    
    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }
    
    if (!formData.engagementModel) {
      newErrors.engagementModel = 'Engagement model is required';
    }
    
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setSubmitStatus({ type: 'error', message: 'Please fix the errors in the form.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const projectData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        resourceOwnerEmployeeId: selectedResourceOwner?.employeeMasterId || null,
        l1ApproverEmployeeId: selectedL1Approver?.employeeMasterId || null,
        l2ApproverEmployeeId: selectedL2Approver?.employeeMasterId || null,
      };

      await projectService.createProject(projectData);
      setSubmitStatus({ type: 'success', message: 'Project created successfully! Redirecting...' });
      setTimeout(() => navigate('/hrdashboard/projectmgmt/list'), 2000);
    } catch (error) {
      setSubmitStatus({ type: 'error', message: error.message || 'Failed to create project. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      projectName: '',
      clientName: '',
      description: '',
      businessUnit: '',
      department: '',
      engagementModel: '',
      status: 'Active',
      startDate: '',
      endDate: '',
    });
    setSelectedResourceOwner(null);
    setSelectedL1Approver(null);
    setSelectedL2Approver(null);
    setErrors({});
    setSubmitStatus(null);
  };

  const handleOpenManagerModal = (tab) => {
    setActiveManagerTab(tab);
    setManagerSearchInput('');
    setManagerSearchTerm('');
    setManagerFilterRole('All');
    setManagerFilterDepartment('All');
    setManagerCurrentPage(1);
    setShowManagerModal(true);
  };

  const handleManagerSelect = (employee) => {
    if (activeManagerTab === 'resource') {
      setSelectedResourceOwner(employee);
    } else if (activeManagerTab === 'l1') {
      setSelectedL1Approver(employee);
    } else if (activeManagerTab === 'l2') {
      setSelectedL2Approver(employee);
    }
  };

  const handleConfirmSelection = () => {
    setShowManagerModal(false);
  };

  const handleManagerSearch = () => {
    if (!managerSearchInput.trim()) return;
    setManagerSearchTerm(managerSearchInput.trim());
    setManagerCurrentPage(1);
  };

  const handleCancelSearch = () => {
    setManagerSearchInput('');
    setManagerSearchTerm('');
    setManagerCurrentPage(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManagerSearch();
    }
  };

  const getFilteredManagers = () => {
    return employees.filter(emp => {
      const searchMatch = !managerSearchTerm || 
        `${emp.firstName} ${emp.lastName} ${emp.roleName} ${emp.departmentName}`
          .toLowerCase().includes(managerSearchTerm.toLowerCase());
      const roleMatch = managerFilterRole === 'All' || emp.roleName === managerFilterRole;
      const deptMatch = managerFilterDepartment === 'All' || emp.departmentName === managerFilterDepartment;
      return searchMatch && roleMatch && deptMatch;
    });
  };

  const getUniqueManagerRoles = () => {
    const roles = [...new Set(employees.map(emp => emp.roleName))];
    return roles.sort((a, b) => a.localeCompare(b));
  };

  const getUniqueManagerDepartments = () => {
    const depts = [...new Set(employees.map(emp => emp.departmentName))];
    return depts.sort((a, b) => a.localeCompare(b));
  };

  const filteredManagers = getFilteredManagers();
  const managerTotalPages = Math.ceil(filteredManagers.length / managerItemsPerPage);
  const managerStartIndex = (managerCurrentPage - 1) * managerItemsPerPage;
  const managerEndIndex = managerStartIndex + managerItemsPerPage;
  const paginatedManagers = filteredManagers.slice(managerStartIndex, managerEndIndex);

  const goToManagerPage = (page) => {
    setManagerCurrentPage(Math.max(1, Math.min(page, managerTotalPages)));
  };

  const getManagerPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (managerTotalPages <= maxPagesToShow) {
      for (let i = 1; i <= managerTotalPages; i++) pages.push(i);
    } else if (managerCurrentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...');
      pages.push(managerTotalPages);
    } else if (managerCurrentPage >= managerTotalPages - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = managerTotalPages - 3; i <= managerTotalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = managerCurrentPage - 1; i <= managerCurrentPage + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(managerTotalPages);
    }
    return pages;
  };

  // Date utils
  const formatDisplayDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getCalendarMatrix = () => {
    const today = new Date();
    const month = calendarMonth ?? today.getMonth();
    const year = calendarYear ?? today.getFullYear();
    
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const cells = [];
    for (let i = startDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, current: true });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: cells.length % 7, current: false });
    }
    
    return { cells, month, year };
  };

  const openCalendarForField = (field) => {
    const currentValue = formData[field];
    const date = currentValue ? new Date(currentValue) : new Date();
    setCalendarMonth(date.getMonth());
    setCalendarYear(date.getFullYear());
    setCalendarField(field);

    if (field === 'startDate') {
      setStartCalendarOpen(o => !o);
      setEndCalendarOpen(false);
    } else {
      if (endInputRef.current) {
        const rect = endInputRef.current.getBoundingClientRect();
        const popupWidth = 260;
        setEndCalPos({
          top: rect.bottom + window.scrollY + 4,
          left: rect.right + window.scrollX - popupWidth,
        });
      }
      setEndCalendarOpen(o => !o);
      setStartCalendarOpen(false);
    }
  };

  const handleSelectCalendarDay = (day, current) => {
    if (!current || !calendarField) return;
    
    const month = calendarMonth;
    const year = calendarYear;
    const selected = new Date(year, month, day);
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, '0');
    const dd = String(selected.getDate()).padStart(2, '0');
    
    setFormData(prev => ({ ...prev, [calendarField]: `${yyyy}-${mm}-${dd}` }));
    
    if (calendarField === 'startDate') {
      setStartCalendarOpen(false);
    } else {
      setEndCalendarOpen(false);
    }
    
    if (errors[calendarField]) {
      setErrors(prev => ({ ...prev, [calendarField]: '' }));
    }
  };

  const { cells, month, year } = getCalendarMatrix();
  const today = new Date();
  const selectedDate = calendarField ? (formData[calendarField] ? new Date(formData[calendarField]) : null) : null;

  const goPrevMonth = () => {
    if (calendarMonth === null || calendarYear === null) return;
    let m = calendarMonth - 1;
    let y = calendarYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    setCalendarMonth(m);
    setCalendarYear(y);
  };

  const goNextMonth = () => {
    if (calendarMonth === null || calendarYear === null) return;
    let m = calendarMonth + 1;
    let y = calendarYear;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setCalendarMonth(m);
    setCalendarYear(y);
  };

  const goToday = () => {
    const t = new Date();
    setCalendarMonth(t.getMonth());
    setCalendarYear(t.getFullYear());
    
    if (!calendarField) return;
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, '0');
    const dd = String(t.getDate()).padStart(2, '0');
    setFormData(prev => ({ ...prev, [calendarField]: `${yyyy}-${mm}-${dd}` }));
    
    if (calendarField === 'startDate') {
      setStartCalendarOpen(false);
    } else {
      setEndCalendarOpen(false);
    }
  };

  // Custom select component - NO LOADING STATES
  const CustomSelect = ({ label, name, value, onChange, options, error, required, placeholder = "Select", disabled = false }) => {
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
    });

    const handleSelect = (optionValue) => {
      onChange(name, optionValue);
      setIsOpen(false);
    };

    const getDisplayValue = () => {
      if (!value) return placeholder;
      const option = options.find(opt => opt.value === value);
      return option ? option.label : value;
    };

    return (
      <div className="prj-form-group" ref={dropdownRef}>
        <label className="prj-form-label">
          {label}
          {required && <span className="prj-required">*</span>}
        </label>
        <div className="prj-dropdown-wrapper">
          <div 
            className={`prj-dropdown-select ${isOpen ? 'open' : ''} ${error ? 'error' : ''}`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          >
            <span className="prj-dropdown-value">
              {!value ? placeholder : getDisplayValue()}
            </span>
            <ChevronDown size={18} className={`prj-dropdown-arrow ${isOpen ? 'rotate' : ''}`} />
          </div>
          {isOpen && (
            <ul className="prj-dropdown-list">
              {options.map((opt, idx) => {
                const optValue = opt.value ?? opt;
                const optLabel = opt.label ?? opt;
                return (
                  <li 
                    key={idx} 
                    className={`prj-dropdown-option ${value === optValue ? 'selected' : ''}`}
                    onClick={() => handleSelect(optValue)}
                  >
                    {optLabel}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {error && <div className="prj-error-message">{error}</div>}
      </div>
    );
  };

  // Custom Filter Dropdown for Modal
  const CustomFilterDropdown = ({ value, onChange, options, placeholder }) => {
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
    });

    const handleSelect = (optionValue) => {
      onChange(optionValue);
      setIsOpen(false);
    };

    return (
      <div className="prj-custom-filter-dropdown" ref={dropdownRef}>
        <div 
          className={`prj-custom-filter-select ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="prj-custom-filter-value">
            {value || placeholder}
          </span>
          <ChevronDown size={18} className={`prj-custom-filter-arrow ${isOpen ? 'rotate' : ''}`} />
        </div>
        {isOpen && (
          <ul className="prj-custom-filter-list">
            {options.map((opt, idx) => (
              <li 
                key={idx} 
                className={`prj-custom-filter-option ${value === opt ? 'selected' : ''}`}
                onClick={() => handleSelect(opt)}
              >
                {opt}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="prj-create-wrapper">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="prj-breadcrumb">
        <ol className="prj-breadcrumb-list">
          <li className="prj-breadcrumb-item">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); navigate('/hrdashboard/projectmgmt'); }}
              className="prj-breadcrumb-link"
            >
              <Home size={14} /> Dashboard
            </a>
          </li>
          <li className="prj-breadcrumb-item active">
            <span className="prj-breadcrumb-current">Create Project</span>
          </li>
        </ol>
      </nav>

      {/* Submit Status */}
      {submitStatus && (
        <div className={`prj-alert prj-alert-${submitStatus.type}`}>
          <div className="prj-alert-content">
            {submitStatus.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{submitStatus.message}</span>
          </div>
          <button type="button" className="prj-alert-close" onClick={() => setSubmitStatus(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="prj-main-card">
        <div className="prj-card-body">
          <form onSubmit={handleSubmit}>
            {/* Basic info */}
            <div className="prj-form-grid">
              <div className="prj-section-card">
                <div className="prj-section-header">
                  <h5 className="prj-section-title">Basic Information</h5>
                </div>
                <div className="prj-section-content">
                  <div className="prj-form-group">
                    <label className="prj-form-label">Project Name<span className="prj-required">*</span></label>
                    <input 
                      type="text" 
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleChange}
                      placeholder="Example: ORG.IT.INTRANET"
                      className={`prj-form-input ${errors.projectName ? 'error' : ''}`}
                    />
                    <div className="prj-form-hint">
                      Format: <strong>ORG.Dept.Project</strong>
                    </div>
                    {errors.projectName && <div className="prj-error-message">{errors.projectName}</div>}
                  </div>

                  <div className="prj-form-group">
                    <label className="prj-form-label">Client Name<span className="prj-required">*</span></label>
                    <input 
                      type="text" 
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      placeholder="Example: ACME CORPORATION"
                      className={`prj-form-input ${errors.clientName ? 'error' : ''}`}
                    />
                    {errors.clientName && <div className="prj-error-message">{errors.clientName}</div>}
                  </div>

                  <CustomSelect 
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    options={statusOptions.map(s => ({ value: s, label: s }))}
                    required
                    placeholder="Select"
                  />

                  <div className="prj-form-group">
                    <label className="prj-form-label">Description</label>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter project description"
                      rows={3}
                      className="prj-form-textarea"
                    />
                  </div>
                </div>
              </div>

              {/* Organization details - FIXED VERSION: NO LOADING ON HOVER */}
              <div className="prj-section-card">
                <div className="prj-section-header">
                  <Building size={20} className="prj-section-icon" />
                  <h5 className="prj-section-title">Organization Details</h5>
                </div>
                <div className="prj-section-content">
                  {/* Business Unit - Always render with disabled state during loading */}
                  <CustomSelect 
                    label="Business Unit"
                    name="businessUnit"
                    value={formData.businessUnit}
                    onChange={handleSelectChange}
                    options={businessUnits.map(bu => ({ value: bu, label: bu }))}
                    error={errors.businessUnit}
                    required
                    placeholder="Select Business Unit"
                    disabled={businessUnitsLoading}
                  />
                  
                  {/* Department - Always render */}
                  <CustomSelect 
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleSelectChange}
                    options={departments.map(d => ({ value: d.departmentName, label: d.departmentName }))}
                    error={errors.department}
                    required
                    placeholder="Select Department"
                  />
                  
                  {/* Engagement Model - Static options, never loads */}
                  <CustomSelect 
                    label="Engagement Model"
                    name="engagementModel"
                    value={formData.engagementModel}
                    onChange={handleSelectChange}
                    options={engagementModels.map(em => ({ value: em, label: em }))}
                    error={errors.engagementModel}
                    required
                    placeholder="Select engagement model"
                  />
                </div>
              </div>

              {/* Project timeline */}
              <div className="prj-section-card">
                <div className="prj-section-header">
                  <CalendarIcon size={20} className="prj-section-icon" />
                  <h5 className="prj-section-title">Project Timeline</h5>
                </div>
                <div className="prj-section-content">
                  {/* Start Date */}
                  <div className="prj-form-group">
                    <label className="prj-form-label">Start Date<span className="prj-required">*</span></label>
                    <div ref={startCalendarRef} style={{ position: 'relative', width: '100%' }}>
                      <input 
                        type="text" 
                        readOnly
                        value={formatDisplayDate(formData.startDate)}
                        onClick={() => openCalendarForField('startDate')}
                        placeholder="Select start date"
                        className={`prj-form-input ${errors.startDate ? 'error' : ''}`}
                        style={{ padding: '0.6rem 2.5rem 0.6rem 0.75rem', cursor: 'pointer' }}
                      />
                      <button 
                        type="button"
                        onClick={() => openCalendarForField('startDate')}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          right: '10px',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: PRIMARY,
                        }}
                      >
                        <CalendarIcon size={18} />
                      </button>
                      
                      {startCalendarOpen && (
                        <div 
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '4px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                            border: '1px solid #e5e7eb',
                            zIndex: 9999,
                            width: 260,
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            borderBottom: '1px solid #e5e7eb',
                            backgroundColor: '#f9fafb',
                          }}>
                            <button 
                              type="button"
                              onClick={goPrevMonth}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: 4,
                              }}
                            >
                              <ChevronLeftIcon size={16} />
                            </button>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
                              {monthNames[month]} {year}
                            </span>
                            <button 
                              type="button"
                              onClick={goNextMonth}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: 4,
                              }}
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            padding: '0.25rem 0.5rem',
                            gap: 2,
                            fontSize: '0.75rem',
                            color: '#6b7280',
                          }}>
                            {weekdays.map(w => (
                              <div key={w} style={{ textAlign: 'center', padding: '0.25rem 0' }}>
                                {w}
                              </div>
                            ))}
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            padding: '0.25rem 0.5rem 0.5rem',
                            gap: 2,
                          }}>
                            {cells.map((c, idx) => {
                              const cellDate = new Date(year, month, c.day);
                              const isToday = c.current && 
                                cellDate.getDate() === today.getDate() &&
                                cellDate.getMonth() === today.getMonth() &&
                                cellDate.getFullYear() === today.getFullYear();
                              const isSelected = selectedDate && c.current &&
                                cellDate.getDate() === selectedDate.getDate() &&
                                cellDate.getMonth() === selectedDate.getMonth() &&
                                cellDate.getFullYear() === selectedDate.getFullYear();
                              
                              const baseStyle = {
                                textAlign: 'center',
                                padding: '0.35rem 0',
                                borderRadius: 6,
                                cursor: c.current ? 'pointer' : 'default',
                                fontSize: '0.8rem',
                              };
                              
                              let bg = 'transparent';
                              let color = c.current ? '#111827' : '#d1d5db';
                              
                              if (isToday) bg = 'rgba(39,35,92,0.08)';
                              if (isSelected) {
                                bg = PRIMARY;
                                color = '#ffffff';
                              }
                              
                              return (
                                <div 
                                  key={idx}
                                  style={{ ...baseStyle, backgroundColor: bg, color }}
                                  onClick={() => handleSelectCalendarDay(c.day, c.current)}
                                >
                                  {c.day}
                                </div>
                              );
                            })}
                          </div>
                          <div style={{
                            padding: '0.4rem 0.75rem 0.6rem',
                            borderTop: '1px solid #e5e7eb',
                            textAlign: 'right',
                          }}>
                            <button 
                              type="button"
                              onClick={goToday}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: PRIMARY,
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Today
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.startDate && <div className="prj-error-message">{errors.startDate}</div>}
                  </div>

                  {/* End Date */}
                  <div className="prj-form-group">
                    <label className="prj-form-label">End Date<span className="prj-optional">Optional</span></label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input 
                        ref={endInputRef}
                        type="text" 
                        readOnly
                        value={formatDisplayDate(formData.endDate)}
                        onClick={() => openCalendarForField('endDate')}
                        placeholder="Select end date"
                        className={`prj-form-input ${errors.endDate ? 'error' : ''}`}
                        style={{ padding: '0.6rem 2.5rem 0.6rem 0.75rem', cursor: 'pointer' }}
                      />
                      <button 
                        type="button"
                        onClick={() => openCalendarForField('endDate')}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          right: '10px',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: PRIMARY,
                        }}
                      >
                        <CalendarIcon size={18} />
                      </button>
                    </div>
                    {errors.endDate && <div className="prj-error-message">{errors.endDate}</div>}
                  </div>
                </div>
              </div>

              {/* Reporting managers */}
              <div className="prj-section-card">
                <div className="prj-section-header">
                  <Users size={20} className="prj-section-icon" />
                  <h5 className="prj-section-title">Reporting Managers</h5>
                </div>
                <div className="prj-section-content">
                  {isLoadingData ? (
                    <div className="prj-loading-container">
                      <div className="spinner-border prj-spinner"></div>
                    </div>
                  ) : (
                    <>
                      <div className="prj-form-group">
                        <label className="prj-form-label">Resource Owner</label>
                        <div 
                          className="prj-manager-box"
                          onClick={() => handleOpenManagerModal('resource')}
                        >
                          {selectedResourceOwner ? (
                            <div>
                              <div className="prj-manager-name">
                                {selectedResourceOwner.firstName} {selectedResourceOwner.lastName}
                              </div>
                              <small className="prj-manager-role">{selectedResourceOwner.roleName}</small>
                            </div>
                          ) : (
                            <div className="prj-manager-placeholder">
                              <UserCog size={16} /> Click to select
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="prj-form-group">
                        <label className="prj-form-label">L1 Approver</label>
                        <div 
                          className="prj-manager-box"
                          onClick={() => handleOpenManagerModal('l1')}
                        >
                          {selectedL1Approver ? (
                            <div>
                              <div className="prj-manager-name">
                                {selectedL1Approver.firstName} {selectedL1Approver.lastName}
                              </div>
                              <small className="prj-manager-role">{selectedL1Approver.roleName}</small>
                            </div>
                          ) : (
                            <div className="prj-manager-placeholder">
                              <UserCog size={16} /> Click to select
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="prj-form-group">
                        <label className="prj-form-label">L2 Approver</label>
                        <div 
                          className="prj-manager-box"
                          onClick={() => handleOpenManagerModal('l2')}
                        >
                          {selectedL2Approver ? (
                            <div>
                              <div className="prj-manager-name">
                                {selectedL2Approver.firstName} {selectedL2Approver.lastName}
                              </div>
                              <small className="prj-manager-role">{selectedL2Approver.roleName}</small>
                            </div>
                          ) : (
                            <div className="prj-manager-placeholder">
                              <UserCog size={16} /> Click to select
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="prj-form-actions">
              <button 
                type="button" 
                onClick={handleReset}
                disabled={isSubmitting}
                className="prj-btn prj-btn-secondary"
              >
                <X size={18} /> Reset
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="prj-btn prj-btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Create Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* End date popup - same calendar UI reused */}
      {endCalendarOpen && (
        <div 
          ref={endCalendarRef}
          style={{
            position: 'absolute',
            top: endCalPos.top,
            left: endCalPos.left,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            zIndex: 9999,
            width: 260,
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.75rem',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
          }}>
            <button 
              type="button"
              onClick={goPrevMonth}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <ChevronLeftIcon size={16} />
            </button>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
              {monthNames[month]} {year}
            </span>
            <button 
              type="button"
              onClick={goNextMonth}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            padding: '0.25rem 0.5rem',
            gap: 2,
            fontSize: '0.75rem',
            color: '#6b7280',
          }}>
            {weekdays.map(w => (
              <div key={w} style={{ textAlign: 'center', padding: '0.25rem 0' }}>
                {w}
              </div>
            ))}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            padding: '0.25rem 0.5rem 0.5rem',
            gap: 2,
          }}>
            {cells.map((c, idx) => {
              const cellDate = new Date(year, month, c.day);
              const isToday = c.current && 
                cellDate.getDate() === today.getDate() &&
                cellDate.getMonth() === today.getMonth() &&
                cellDate.getFullYear() === today.getFullYear();
              const isSelected = selectedDate && c.current &&
                cellDate.getDate() === selectedDate.getDate() &&
                cellDate.getMonth() === selectedDate.getMonth() &&
                cellDate.getFullYear() === selectedDate.getFullYear();
              
              const baseStyle = {
                textAlign: 'center',
                padding: '0.35rem 0',
                borderRadius: 6,
                cursor: c.current ? 'pointer' : 'default',
                fontSize: '0.8rem',
              };
              
              let bg = 'transparent';
              let color = c.current ? '#111827' : '#d1d5db';
              
              if (isToday) bg = 'rgba(39,35,92,0.08)';
              if (isSelected) {
                bg = PRIMARY;
                color = '#ffffff';
              }
              
              return (
                <div 
                  key={idx}
                  style={{ ...baseStyle, backgroundColor: bg, color }}
                  onClick={() => handleSelectCalendarDay(c.day, c.current)}
                >
                  {c.day}
                </div>
              );
            })}
          </div>
          <div style={{
            padding: '0.4rem 0.75rem 0.6rem',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'right',
          }}>
            <button 
              type="button"
              onClick={goToday}
              style={{
                border: 'none',
                background: 'transparent',
                color: PRIMARY,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}

      {/* Manager selection modal */}
      {showManagerModal && (
        <>
          <div className="prj-modal-backdrop" onClick={() => setShowManagerModal(false)} />
          <div className="prj-modal-overlay">
            <div className="prj-modal-container">
              <div className="prj-modal-header">
                <div className="prj-modal-header-content">
                  <UserCog size={24} />
                  <h3 className="prj-modal-title">Select Manager</h3>
                </div>
                <button 
                  type="button" 
                  className="prj-modal-close" 
                  onClick={() => setShowManagerModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="prj-modal-tabs">
                <button 
                  type="button"
                  className={`prj-modal-tab ${activeManagerTab === 'resource' ? 'active' : ''}`}
                  onClick={() => setActiveManagerTab('resource')}
                >
                  Resource Owner
                  {activeManagerTab === 'resource' && selectedResourceOwner && <CheckCircle size={16} className="prj-tab-icon" />}
                </button>
                <button 
                  type="button"
                  className={`prj-modal-tab ${activeManagerTab === 'l1' ? 'active' : ''}`}
                  onClick={() => setActiveManagerTab('l1')}
                >
                  L1 Approver
                  {activeManagerTab === 'l1' && selectedL1Approver && <CheckCircle size={16} className="prj-tab-icon" />}
                </button>
                <button 
                  type="button"
                  className={`prj-modal-tab ${activeManagerTab === 'l2' ? 'active' : ''}`}
                  onClick={() => setActiveManagerTab('l2')}
                >
                  L2 Approver
                  {activeManagerTab === 'l2' && selectedL2Approver && <CheckCircle size={16} className="prj-tab-icon" />}
                </button>
              </div>

              {(activeManagerTab === 'resource' && selectedResourceOwner) ||
               (activeManagerTab === 'l1' && selectedL1Approver) ||
               (activeManagerTab === 'l2' && selectedL2Approver) ? (
                <div className="prj-modal-info">
                  <span className="prj-info-icon"></span>
                  <div className="prj-info-content">
                    <span className="prj-info-label">Currently Selected</span>
                    <span className="prj-info-badge">
                      {activeManagerTab === 'resource' && selectedResourceOwner ? `${selectedResourceOwner.firstName} ${selectedResourceOwner.lastName}` : ''}
                      {activeManagerTab === 'l1' && selectedL1Approver ? `${selectedL1Approver.firstName} ${selectedL1Approver.lastName}` : ''}
                      {activeManagerTab === 'l2' && selectedL2Approver ? `${selectedL2Approver.firstName} ${selectedL2Approver.lastName}` : ''}
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="prj-modal-filters">
                <div className="prj-filter-search-container">
                  <Search size={18} className="prj-search-icon-left" />
                  <input 
                    type="text"
                    placeholder="Search by Employee Name, Role, Department..."
                    value={managerSearchInput}
                    onChange={(e) => setManagerSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyPress}
                    className={`prj-search-input-with-btn ${managerSearchTerm ? 'has-term' : ''}`}
                  />
                  {managerSearchTerm ? (
                    <button type="button" className="prj-search-clear-btn" onClick={handleCancelSearch}>
                      <X size={16} />
                    </button>
                  ) : null}
                  <button type="button" className="prj-search-btn-inside prj-btn-cancel" onClick={handleCancelSearch}>
                    <X size={16} /> Cancel
                  </button>
                  <button type="button" onClick={handleManagerSearch} className="prj-search-btn-inside">
                    <Search size={16} /> Search
                  </button>
                </div>

                <CustomFilterDropdown
                  value={managerFilterRole}
                  onChange={setManagerFilterRole}
                  options={['All', ...getUniqueManagerRoles()]}
                  placeholder="All Roles"
                />
                <CustomFilterDropdown
                  value={managerFilterDepartment}
                  onChange={setManagerFilterDepartment}
                  options={['All', ...getUniqueManagerDepartments()]}
                  placeholder="All Departments"
                />
              </div>

              <div className="prj-modal-body">
                <div className="prj-table-wrapper">
                  <table className="prj-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>Select</th>
                        <th>Employee Name</th>
                        <th>Role</th>
                        <th>Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedManagers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="prj-table-empty">
                            No employees found matching your criteria
                          </td>
                        </tr>
                      ) : (
                        paginatedManagers.map(emp => {
                          const isSelected = 
                            (activeManagerTab === 'resource' && selectedResourceOwner?.employeeMasterId === emp.employeeMasterId) ||
                            (activeManagerTab === 'l1' && selectedL1Approver?.employeeMasterId === emp.employeeMasterId) ||
                            (activeManagerTab === 'l2' && selectedL2Approver?.employeeMasterId === emp.employeeMasterId);
                          
                          return (
                            <tr 
                              key={emp.employeeMasterId}
                              className={isSelected ? 'selected' : ''}
                              onClick={() => handleManagerSelect(emp)}
                            >
                              <td>
                                <input 
                                  type="radio"
                                  name="manager"
                                  checked={isSelected}
                                  onChange={() => handleManagerSelect(emp)}
                                  className="prj-radio"
                                />
                              </td>
                              <td>{emp.firstName} {emp.lastName}</td>
                              <td>{emp.roleName}</td>
                              <td><span className="prj-table-secondary">{emp.departmentName}</span></td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {managerTotalPages > 1 && (
                  <div className="prj-pagination">
                    <button 
                      type="button"
                      onClick={() => goToManagerPage(managerCurrentPage - 1)}
                      disabled={managerCurrentPage === 1}
                      className="prj-page-btn"
                    >
                      <ChevronLeftIcon size={16} />
                    </button>
                    {getManagerPageNumbers().map((page, idx) => {
                      if (page === '...') {
                        return <span key={`dots-${idx}`} className="prj-page-dots">...</span>;
                      }
                      return (
                        <button 
                          key={page}
                          type="button"
                          onClick={() => goToManagerPage(page)}
                          className={`prj-page-btn ${managerCurrentPage === page ? 'active' : ''}`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button 
                      type="button"
                      onClick={() => goToManagerPage(managerCurrentPage + 1)}
                      disabled={managerCurrentPage === managerTotalPages}
                      className="prj-page-btn"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="prj-modal-footer">
                <button 
                  type="button"
                  onClick={() => setShowManagerModal(false)}
                  className="prj-btn prj-btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleConfirmSelection}
                  className="prj-btn prj-btn-primary"
                >
                  <CheckCircle size={18} /> Confirm Selection
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CreateProject;
