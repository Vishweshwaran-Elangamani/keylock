import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Users,
  Building,
  Calendar,
  ChevronDown,
  UserCog,
  Search,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight,
  Home,
} from "lucide-react";
import projectService from "../../services/project_management/projectService";
import "../../styles/projectmanagement/CreateProject.css";

// Custom Calendar Component - FIXED TIMEZONE ISSUE
const CustomCalendar = ({ value, onChange, onClose, minDate }) => {
  const [currentDate, setCurrentDate] = useState(
    value ? new Date(value + 'T00:00:00') : new Date()
  );
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value + 'T00:00:00') : null
  );

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    const year = selected.getFullYear();
    const month = String(selected.getMonth() + 1).padStart(2, '0');
    const dayStr = String(selected.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayStr}`;
    
    if (minDate) {
      const minDateObj = new Date(minDate + 'T00:00:00');
      if (selected < minDateObj) {
        return;
      }
    }
    
    setSelectedDate(selected);
    onChange({ target: { name: '', value: formattedDate } });
    onClose();
  };

  const handleToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    setSelectedDate(today);
    onChange({ target: { name: '', value: formattedDate } });
    onClose();
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const minDateObj = minDate ? new Date(minDate + 'T00:00:00') : null;

    const prevMonthDays = daysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className="prj-calendar-day prj-calendar-day-other">
          {prevMonthDays - i}
        </div>
      );
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      date.setHours(0, 0, 0, 0);
      
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
      const isDisabled = minDateObj && date < minDateObj;

      days.push(
        <div
          key={day}
          className={`prj-calendar-day ${isToday ? 'prj-calendar-day-today' : ''} ${
            isSelected ? 'prj-calendar-day-selected' : ''
          } ${isDisabled ? 'prj-calendar-day-disabled' : ''}`}
          onClick={() => !isDisabled && handleDateClick(day)}
        >
          {day}
        </div>
      );
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <div key={`next-${day}`} className="prj-calendar-day prj-calendar-day-other">
          {day}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="prj-calendar-dropdown">
      <div className="prj-calendar-header">
        <button type="button" className="prj-calendar-nav" onClick={handlePrevMonth}>
          <ChevronLeftIcon size={16} />
        </button>
        <div className="prj-calendar-month">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
        <button type="button" className="prj-calendar-nav" onClick={handleNextMonth}>
          <ChevronRight size={16} />
        </button>
      </div>
      
      <div className="prj-calendar-weekdays">
        <div className="prj-calendar-weekday">Su</div>
        <div className="prj-calendar-weekday">Mo</div>
        <div className="prj-calendar-weekday">Tu</div>
        <div className="prj-calendar-weekday">We</div>
        <div className="prj-calendar-weekday">Th</div>
        <div className="prj-calendar-weekday">Fr</div>
        <div className="prj-calendar-weekday">Sa</div>
      </div>
      
      <div className="prj-calendar-days">
        {renderCalendarDays()}
      </div>
      
      <div className="prj-calendar-footer">
        <button type="button" className="prj-calendar-btn prj-calendar-btn-today" onClick={handleToday}>
          Today
        </button>
      </div>
    </div>
  );
};

const CreateProject = () => {
  const navigate = useNavigate();
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayFormatted = `${year}-${month}-${day}`;

  const [formData, setFormData] = useState({
    projectName: "",
    clientName: "",
    description: "",
    businessUnit: "",
    department: "",
    engagementModel: "",
    status: "Active",
    startDate: "",
    endDate: "",
  });

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const [showManagerModal, setShowManagerModal] = useState(false);
  const [activeManagerTab, setActiveManagerTab] = useState("resource");
  const [selectedResourceOwner, setSelectedResourceOwner] = useState(null);
  const [selectedL1Approver, setSelectedL1Approver] = useState(null);
  const [selectedL2Approver, setSelectedL2Approver] = useState(null);
  const [managerSearchTerm, setManagerSearchTerm] = useState("");
  const [managerFilterRole, setManagerFilterRole] = useState("All");
  const [managerFilterDepartment, setManagerFilterDepartment] = useState("All");
  const [managerCurrentPage, setManagerCurrentPage] = useState(1);
  const managerItemsPerPage = 10;

  const statusOptions = ["Active", "On Hold", "Completed", "Cancelled"];
  const engagementModels = [
    "Fixed Price",
    "Time and Materials",
    "Agile - Scrum",
    "Agile - Kanban",
    "Consulting",
    "Retainer",
  ];

  const PROJECT_NAME_REGEX = /^ORG\.[A-Za-z][A-Za-z0-9-]*\.[A-Za-z][A-Za-z0-9-]*$/;

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    setManagerCurrentPage(1);
  }, [managerSearchTerm, managerFilterRole, managerFilterDepartment]);

  const fetchDropdownData = async () => {
    setIsLoadingData(true);
    try {
      const [employeesRes, departmentsRes, businessUnitsRes] = await Promise.all([
        projectService.getAllEmployees(),
        projectService.getAllDepartments(),
        projectService.getAllBusinessUnits(),
      ]);

      if (employeesRes.success) setEmployees(employeesRes.data);
      if (departmentsRes.success) setDepartments(departmentsRes.data);
      if (businessUnitsRes.success) setBusinessUnits(businessUnitsRes.data);
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "Failed to load dropdown data.",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "projectName") {
      formattedValue = value.toUpperCase();
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.projectName.trim()) {
      newErrors.projectName = "Project name is required";
    } else if (!PROJECT_NAME_REGEX.test(formData.projectName.trim())) {
      newErrors.projectName = "Format must be ORG.(Dept).(Project), e.g., ORG.IT.INTRANET";
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = "Client name is required";
    } else if (formData.clientName.trim().length < 2) {
      newErrors.clientName = "Client name must be at least 2 characters";
    }

    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.businessUnit.trim()) newErrors.businessUnit = "Business unit is required";
    if (!formData.department.trim()) newErrors.department = "Department is required";
    if (!formData.engagementModel) newErrors.engagementModel = "Engagement model is required";

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate + 'T00:00:00') < new Date(formData.startDate + 'T00:00:00')) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitStatus({
        type: "error",
        message: "Please fix the errors in the form",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const projectData = {
        ...formData,
        startDate: new Date(formData.startDate + 'T00:00:00').toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate + 'T00:00:00').toISOString() : null,
        resourceOwnerEmployeeId: selectedResourceOwner?.employeeMasterId || null,
        l1ApproverEmployeeId: selectedL1Approver?.employeeMasterId || null,
        l2ApproverEmployeeId: selectedL2Approver?.employeeMasterId || null,
      };

      await projectService.createProject(projectData);

      setSubmitStatus({
        type: "success",
        message: "Project created successfully! Redirecting...",
      });

      setTimeout(() => navigate("/hr/dashboard/projectmgmt/list"), 2000);
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: error.message || "Failed to create project. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      projectName: "",
      clientName: "",
      description: "",
      businessUnit: "",
      department: "",
      engagementModel: "",
      status: "Active",
      startDate: "",
      endDate: "",
    });
    setSelectedResourceOwner(null);
    setSelectedL1Approver(null);
    setSelectedL2Approver(null);
    setErrors({});
    setSubmitStatus(null);
  };

  const handleOpenManagerModal = (tab) => {
    setActiveManagerTab(tab);
    setManagerSearchTerm("");
    setManagerFilterRole("All");
    setManagerFilterDepartment("All");
    setManagerCurrentPage(1);
    setShowManagerModal(true);
  };

  const handleManagerSelect = (employee) => {
    if (activeManagerTab === "resource") {
      setSelectedResourceOwner(employee);
    } else if (activeManagerTab === "l1") {
      setSelectedL1Approver(employee);
    } else if (activeManagerTab === "l2") {
      setSelectedL2Approver(employee);
    }
  };

  const handleConfirmSelection = () => {
    setShowManagerModal(false);
  };

  const getFilteredManagers = () => {
    return employees.filter((emp) => {
      const searchMatch =
        managerSearchTerm === "" ||
        `${emp.firstName} ${emp.lastName} ${emp.roleName} ${emp.departmentName}`
          .toLowerCase()
          .includes(managerSearchTerm.toLowerCase());

      const roleMatch = managerFilterRole === "All" || emp.roleName === managerFilterRole;
      const deptMatch = managerFilterDepartment === "All" || emp.departmentName === managerFilterDepartment;

      return searchMatch && roleMatch && deptMatch;
    });
  };

  const getUniqueManagerRoles = () => {
    const roles = [...new Set(employees.map((emp) => emp.roleName))];
    return roles.sort();
  };

  const getUniqueManagerDepartments = () => {
    const depts = [...new Set(employees.map((emp) => emp.departmentName))];
    return depts.sort();
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
    } else {
      if (managerCurrentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(managerTotalPages);
      } else if (managerCurrentPage >= managerTotalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = managerTotalPages - 3; i <= managerTotalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = managerCurrentPage - 1; i <= managerCurrentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(managerTotalPages);
      }
    }
    return pages;
  };

  const getCurrentSelectedManager = () => {
    if (activeManagerTab === "resource") return selectedResourceOwner;
    if (activeManagerTab === "l1") return selectedL1Approver;
    return selectedL2Approver;
  };

  const CustomSelect = ({ label, name, value, onChange, options, error, required, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef(null);
    const selectRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
      if (isOpen && selectRef.current) {
        const rect = selectRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    }, [isOpen]);

    const handleSelect = (optionValue) => {
      onChange(name, optionValue);
      setIsOpen(false);
    };

    const getDisplayValue = () => {
      if (!value) return placeholder || "Select";
      const option = options.find((opt) => (opt.value || opt) === value);
      return option ? (option.label || option) : value;
    };

    return (
      <div className="prj-form-group" ref={dropdownRef}>
        <label className="prj-form-label">
          {label}
          {required && <span className="prj-required">*</span>}
        </label>
        <div className="prj-dropdown-wrapper">
          <div
            ref={selectRef}
            className={`prj-dropdown-select ${isOpen ? "open" : ""} ${error ? "error" : ""}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className={`prj-dropdown-value ${!value ? "placeholder" : ""}`}>
              {getDisplayValue()}
            </span>
            <ChevronDown size={18} className={`prj-dropdown-arrow ${isOpen ? "rotate" : ""}`} />
          </div>
          {isOpen && (
            <ul 
              className="prj-dropdown-list"
              style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                zIndex: 99999
              }}
            >
              {options.map((opt, idx) => {
                const optValue = opt.value || opt;
                const optLabel = opt.label || opt;
                return (
                  <li
                    key={idx}
                    className={`prj-dropdown-option ${value === optValue ? "selected" : ""}`}
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

  const DateInput = ({ label, name, value, onChange, error, required, min, placeholder }) => {
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
    const calendarRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (calendarRef.current && !calendarRef.current.contains(event.target)) {
          setShowCalendar(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
      if (showCalendar && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        const calendarWidth = 220;
        
        setCalendarPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.right + window.scrollX - calendarWidth
        });
      }
    }, [showCalendar]);

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const [year, month, day] = dateStr.split('-');
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleDateChange = (e) => {
      const newEvent = { target: { name: name, value: e.target.value } };
      onChange(newEvent);
      setShowCalendar(false);
    };

    return (
      <div className="prj-form-group" ref={calendarRef}>
        <label className="prj-form-label">
          {label}
          {required && <span className="prj-required">*</span>}
          {!required && <span className="prj-optional">(Optional)</span>}
        </label>
        <div className="prj-date-input-wrapper" ref={inputRef}>
          <input
            type="text"
            name={name}
            value={value ? formatDate(value) : ''}
            readOnly
            placeholder={placeholder || "mm/dd/yyyy"}
            className={`prj-form-input prj-date-input ${error ? "error" : ""}`}
            onClick={() => setShowCalendar(true)}
          />
          <button
            type="button"
            className="prj-calendar-button"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <Calendar size={18} />
          </button>
        </div>
        {error && <div className="prj-error-message">{error}</div>}
        {showCalendar && (
          <div style={{ position: 'fixed', top: calendarPosition.top, left: calendarPosition.left, zIndex: 99999 }}>
            <CustomCalendar
              value={value}
              onChange={handleDateChange}
              onClose={() => setShowCalendar(false)}
              minDate={min}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="prj-create-wrapper">
      <nav aria-label="breadcrumb" className="prj-breadcrumb">
        <ol className="prj-breadcrumb-list">
          <li className="prj-breadcrumb-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/hr/dashboard/projectmgmt");
              }}
              className="prj-breadcrumb-link"
            >
              <Home size={14} />
              Dashboard
            </a>
          </li>
          <li className="prj-breadcrumb-item active">
            <span className="prj-breadcrumb-current">Create Project</span>
          </li>
        </ol>
      </nav>

      {submitStatus && (
        <div className={`prj-alert prj-alert-${submitStatus.type}`}>
          <div className="prj-alert-content">
            {submitStatus.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
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
            <div className="prj-form-grid">
              <div className="prj-section-card">
                <div className="prj-section-header">
                  <h5 className="prj-section-title">Basic Information</h5>
                </div>
                <div className="prj-section-content">
                  <div className="prj-form-group">
                    <label className="prj-form-label">
                      Project Name <span className="prj-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleChange}
                      placeholder="Example: ORG.IT.INTRANET"
                      className={`prj-form-input ${errors.projectName ? "error" : ""}`}
                    />
                    <div className="prj-form-hint">
                      Format: <strong>ORG.(Dept).(Project)</strong>
                    </div>
                    {errors.projectName && <div className="prj-error-message">{errors.projectName}</div>}
                  </div>

                  <div className="prj-form-group">
                    <label className="prj-form-label">
                      Client Name <span className="prj-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      placeholder="Example: ACME CORPORATION"
                      className={`prj-form-input ${errors.clientName ? "error" : ""}`}
                    />
                    {errors.clientName && <div className="prj-error-message">{errors.clientName}</div>}
                  </div>

                  <CustomSelect
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    options={statusOptions}
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
                      rows="3"
                      className="prj-form-textarea"
                    />
                  </div>
                </div>
              </div>

              <div className="prj-section-card">
                <div className="prj-section-header">
                  <Building size={20} className="prj-section-icon" />
                  <h5 className="prj-section-title">Organization Details</h5>
                </div>
                <div className="prj-section-content">
                  {isLoadingData ? (
                    <div className="prj-loading-container">
                      <div className="spinner-border prj-spinner" />
                      <p className="prj-loading-text">Loading data...</p>
                    </div>
                  ) : (
                    <>
                      <CustomSelect
                        label="Business Unit"
                        name="businessUnit"
                        value={formData.businessUnit}
                        onChange={handleSelectChange}
                        options={businessUnits}
                        error={errors.businessUnit}
                        required
                        placeholder="Select Business Unit"
                      />

                      <CustomSelect
                        label="Department"
                        name="department"
                        value={formData.department}
                        onChange={handleSelectChange}
                        options={departments.map((d) => ({
                          value: d.departmentName,
                          label: d.departmentName,
                        }))}
                        error={errors.department}
                        required
                        placeholder="Select Department"
                      />

                      <CustomSelect
                        label="Engagement Model"
                        name="engagementModel"
                        value={formData.engagementModel}
                        onChange={handleSelectChange}
                        options={engagementModels}
                        error={errors.engagementModel}
                        required
                        placeholder="Select engagement model"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="prj-section-card">
                <div className="prj-section-header">
                  <Calendar size={20} className="prj-section-icon" />
                  <h5 className="prj-section-title">Project Timeline</h5>
                </div>
                <div className="prj-section-content">
                  <DateInput
                    label="Start Date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={todayFormatted}
                    error={errors.startDate}
                    required
                    placeholder="Select start date"
                  />

                  <DateInput
                    label="End Date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate || todayFormatted}
                    error={errors.endDate}
                    required={false}
                    placeholder="Select end date"
                  />
                </div>
              </div>

              <div className="prj-section-card">
                <div className="prj-section-header">
                  <Users size={20} className="prj-section-icon" />
                  <h5 className="prj-section-title">Reporting Managers</h5>
                </div>
                <div className="prj-section-content">
                  {isLoadingData ? (
                    <div className="prj-loading-container">
                      <div className="spinner-border prj-spinner" />
                    </div>
                  ) : (
                    <>
                      <div className="prj-form-group">
                        <label className="prj-form-label">Resource Owner</label>
                        <div
                          className="prj-manager-box"
                          onClick={() => handleOpenManagerModal("resource")}
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
                              <UserCog size={16} />
                              Click to select
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="prj-form-group">
                        <label className="prj-form-label">L1 Approver</label>
                        <div
                          className="prj-manager-box"
                          onClick={() => handleOpenManagerModal("l1")}
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
                              <UserCog size={16} />
                              Click to select
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="prj-form-group">
                        <label className="prj-form-label">L2 Approver</label>
                        <div
                          className="prj-manager-box"
                          onClick={() => handleOpenManagerModal("l2")}
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
                              <UserCog size={16} />
                              Click to select
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
                <X size={18} />
                Reset
              </button>
              <button type="submit" disabled={isSubmitting} className="prj-btn prj-btn-primary">
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Create Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showManagerModal && (
        <>
          <div className="prj-modal-backdrop" onClick={() => setShowManagerModal(false)} />
          <div className="prj-modal-overlay">
            <div className="prj-modal-container">
              <div className="prj-modal-header">
                <div className="prj-modal-header-content">
                  <Users size={20} />
                  <h5 className="prj-modal-title">Select Manager</h5>
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
                  className={`prj-modal-tab ${activeManagerTab === "resource" ? "active" : ""}`}
                  onClick={() => setActiveManagerTab("resource")}
                >
                  <UserCog size={16} />
                  Resource Owner
                  {selectedResourceOwner && <span className="prj-tab-icon">✓</span>}
                </button>
                <button
                  type="button"
                  className={`prj-modal-tab ${activeManagerTab === "l1" ? "active" : ""}`}
                  onClick={() => setActiveManagerTab("l1")}
                >
                  <UserCog size={16} />
                  L1 Approver
                  {selectedL1Approver && <span className="prj-tab-icon">✓</span>}
                </button>
                <button
                  type="button"
                  className={`prj-modal-tab ${activeManagerTab === "l2" ? "active" : ""}`}
                  onClick={() => setActiveManagerTab("l2")}
                >
                  <UserCog size={16} />
                  L2 Approver
                  {selectedL2Approver && <span className="prj-tab-icon">✓</span>}
                </button>
              </div>

              {getCurrentSelectedManager() && (
                <div className="prj-modal-info">
                  <div className="prj-info-icon">ℹ️</div>
                  <div className="prj-info-content">
                    <div className="prj-info-label">Currently Selected:</div>
                    <span className="prj-info-badge">
                      {getCurrentSelectedManager().firstName} {getCurrentSelectedManager().lastName} -{" "}
                      {getCurrentSelectedManager().roleName}
                    </span>
                  </div>
                </div>
              )}

              <div className="prj-modal-filters">
                <div className="prj-filter-search">
                  <Search size={16} className="prj-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, role, or department..."
                    value={managerSearchTerm}
                    onChange={(e) => setManagerSearchTerm(e.target.value)}
                    className="prj-search-input"
                  />
                </div>
                <select
                  value={managerFilterRole}
                  onChange={(e) => setManagerFilterRole(e.target.value)}
                  className="prj-filter-dropdown"
                >
                  <option value="All">All Roles</option>
                  {getUniqueManagerRoles().map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <select
                  value={managerFilterDepartment}
                  onChange={(e) => setManagerFilterDepartment(e.target.value)}
                  className="prj-filter-dropdown"
                >
                  <option value="All">All Departments</option>
                  {getUniqueManagerDepartments().map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="prj-modal-body">
                <div className="prj-table-wrapper">
                  <table className="prj-table">
                    <thead>
                      <tr>
                        <th style={{ width: "50px" }}>Select</th>
                        <th>Employee Name</th>
                        <th>Role</th>
                        <th>Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedManagers.length > 0 ? (
                        paginatedManagers.map((emp) => (
                          <tr
                            key={emp.employeeMasterId}
                            className={`prj-table-row ${
                              getCurrentSelectedManager()?.employeeMasterId === emp.employeeMasterId
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => handleManagerSelect(emp)}
                          >
                            <td>
                              <input
                                type="radio"
                                name="selectedManager"
                                checked={
                                  getCurrentSelectedManager()?.employeeMasterId === emp.employeeMasterId
                                }
                                onChange={() => handleManagerSelect(emp)}
                                className="prj-radio"
                              />
                            </td>
                            <td>
                              {emp.firstName} {emp.lastName}
                            </td>
                            <td className="prj-table-secondary">{emp.roleName}</td>
                            <td className="prj-table-secondary">{emp.departmentName}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="prj-table-empty">
                            No employees found matching your criteria
                          </td>
                        </tr>
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

                    {getManagerPageNumbers().map((page, idx) =>
                      page === "..." ? (
                        <span key={`dots-${idx}`} className="prj-page-dots">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          type="button"
                          onClick={() => goToManagerPage(page)}
                          className={`prj-page-btn ${managerCurrentPage === page ? "active" : ""}`}
                        >
                          {page}
                        </button>
                      )
                    )}

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
                  disabled={!getCurrentSelectedManager()}
                  className="prj-btn prj-btn-primary"
                >
                  Confirm Selection
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
