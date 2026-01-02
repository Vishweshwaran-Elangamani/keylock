import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Users,
  Building,
  Calendar as CalendarIcon,
  ChevronDown,
  UserCog,
  Search,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight,
  Home,
} from "lucide-react";
import projectService from "../../services/project_management/projectService";
import "../../styles/projectmanagement/components/CreateProject.css";

const PRIMARY = "#27235C";

const CreateProject = () => {
  const navigate = useNavigate();


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

  const [businessUnitsLoading, setBusinessUnitsLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const [showManagerModal, setShowManagerModal] = useState(false);
  const [activeManagerTab, setActiveManagerTab] = useState("resource");
  const [selectedResourceOwner, setSelectedResourceOwner] = useState(null);
  const [selectedL1Approver, setSelectedL1Approver] = useState(null);
  const [selectedL2Approver, setSelectedL2Approver] = useState(null);

  const [managerSearchInput, setManagerSearchInput] = useState("");
  const [managerSearchTerm, setManagerSearchTerm] = useState("");
  const [managerFilterRole, setManagerFilterRole] = useState("All");
  const [managerFilterDepartment, setManagerFilterDepartment] = useState("All");
  const [managerCurrentPage, setManagerCurrentPage] = useState(1);
  const managerItemsPerPage = 10;

  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);
  const startCalendarRef = useRef(null);
  const endCalendarRef = useRef(null);
  const [calendarMonth, setCalendarMonth] = useState(null);
  const [calendarYear, setCalendarYear] = useState(null);
  const [calendarField, setCalendarField] = useState(null);

  const endInputRef = useRef(null);
  const [endCalPos, setEndCalPos] = useState({ top: 0, left: 0 });

  const statusOptions = ["Active", "On Hold", "Completed", "Cancelled"];
  const engagementModels = [
    "Fixed Price",
    "Time and Materials",
    "Agile - Scrum",
    "Agile - Kanban",
    "Consulting",
    "Retainer",
  ];
  const PROJECTNAMEREGEX =
    /^ORG\.[A-Za-zA-Za-z0-9-]+\.[A-Za-zA-Za-z0-9-]+$/;

  useEffect(() => {
    setManagerCurrentPage(1);
  }, [managerSearchTerm, managerFilterRole, managerFilterDepartment]);

  useEffect(() => {
    const handler = (e) => {
      if (
        startCalendarOpen &&
        startCalendarRef.current &&
        !startCalendarRef.current.contains(e.target)
      ) {
        setStartCalendarOpen(false);
      }
      if (
        endCalendarOpen &&
        endCalendarRef.current &&
        !endCalendarRef.current.contains(e.target) &&
        !endInputRef.current?.contains(e.target)
      ) {
        setEndCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [startCalendarOpen, endCalendarOpen]);

  useEffect(() => {
    setBusinessUnitsLoading(true);
    setDepartmentsLoading(true);
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    setIsLoadingData(true);
    try {
      const [employeesRes, departmentsRes, businessUnitsRes] =
        await Promise.all([
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
    } else if (!PROJECTNAMEREGEX.test(formData.projectName.trim())) {
      newErrors.projectName =
        "Format must be ORG.Dept.Project, e.g., ORG.IT.INTRANET";
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = "Client name is required";
    } else if (formData.clientName.trim().length < 2) {
      newErrors.clientName =
        "Client name must be at least 2 characters";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.businessUnit.trim()) {
      newErrors.businessUnit = "Business unit is required";
    }

    if (!formData.department.trim()) {
      newErrors.department = "Department is required";
    }

    if (!formData.engagementModel) {
      newErrors.engagementModel = "Engagement model is required";
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
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
        message: "Please fix the errors in the form.",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const projectData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : null,
        resourceOwnerEmployeeId:
          selectedResourceOwner?.employeeMasterId || null,
        l1ApproverEmployeeId:
          selectedL1Approver?.employeeMasterId || null,
        l2ApproverEmployeeId:
          selectedL2Approver?.employeeMasterId || null,
      };

      await projectService.createProject(projectData);
      setSubmitStatus({
        type: "success",
        message: "Project created successfully! Redirecting...",
      });
      setTimeout(
        () => navigate("/hr/dashboard/projectmgmt/list"),
        2000
      );
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message:
          error.message ||
          "Failed to create project. Please try again.",
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
    setManagerSearchInput("");
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

 const handleManagerSearch = () => {
  if (!managerSearchInput.trim()) return;
  setManagerSearchTerm(managerSearchInput.trim());
  setManagerCurrentPage(1);
};

const handleCancelSearch = () => {
  setManagerSearchInput("");
  setManagerSearchTerm("");
  setManagerCurrentPage(1);
};

const handleManagerSearchKeyPress = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleManagerSearch();
  }
};



  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleManagerSearch();
    }
  };

  const getFilteredManagers = () => {
    return employees.filter((emp) => {
      const searchMatch =
        !managerSearchTerm ||
        `${emp.firstName} ${emp.lastName} ${emp.roleName} ${emp.departmentName}`
          .toLowerCase()
          .includes(managerSearchTerm.toLowerCase());
      const roleMatch =
        managerFilterRole === "All" ||
        emp.roleName === managerFilterRole;
      const deptMatch =
        managerFilterDepartment === "All" ||
        emp.departmentName === managerFilterDepartment;
      return searchMatch && roleMatch && deptMatch;
    });
  };

  const getUniqueManagerRoles = () => {
    const roles = [...new Set(employees.map((emp) => emp.roleName))];
    return roles.sort((a, b) => a.localeCompare(b));
  };

  const getUniqueManagerDepartments = () => {
    const depts = [
      ...new Set(employees.map((emp) => emp.departmentName)),
    ];
    return depts.sort((a, b) => a.localeCompare(b));
  };

  const filteredManagers = getFilteredManagers();
  const managerTotalPages = Math.ceil(
    filteredManagers.length / managerItemsPerPage
  );
  const managerStartIndex =
    (managerCurrentPage - 1) * managerItemsPerPage;
  const managerEndIndex = managerStartIndex + managerItemsPerPage;
  const paginatedManagers = filteredManagers.slice(
    managerStartIndex,
    managerEndIndex
  );

  const goToManagerPage = (page) => {
    setManagerCurrentPage(
      Math.max(1, Math.min(page, managerTotalPages))
    );
  };

  const getManagerPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (managerTotalPages <= maxPagesToShow) {
      for (let i = 1; i <= managerTotalPages; i++) pages.push(i);
    } else if (managerCurrentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("...");
      pages.push(managerTotalPages);
    } else if (managerCurrentPage >= managerTotalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (
        let i = managerTotalPages - 3;
        i <= managerTotalPages;
        i++
      )
        pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      for (
        let i = managerCurrentPage - 1;
        i <= managerCurrentPage + 1;
        i++
      )
        pages.push(i);
      pages.push("...");
      pages.push(managerTotalPages);
    }
    return pages;
  };

  const formatDisplayDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const monthNames = [
    "January","February","March","April","May","June","July","August","September","October","November","December",];
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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

    if (field === "startDate") {
      setStartCalendarOpen((o) => !o);
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
      setEndCalendarOpen((o) => !o);
      setStartCalendarOpen(false);
    }
  };

  const handleSelectCalendarDay = (day, current) => {
    if (!current || !calendarField) return;

    const month = calendarMonth;
    const year = calendarYear;
    const selected = new Date(year, month, day);
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, "0");
    const dd = String(selected.getDate()).padStart(2, "0");

    setFormData((prev) => ({
      ...prev,
      [calendarField]: `${yyyy}-${mm}-${dd}`,
    }));

    if (calendarField === "startDate") {
      setStartCalendarOpen(false);
    } else {
      setEndCalendarOpen(false);
    }

    if (errors[calendarField]) {
      setErrors((prev) => ({ ...prev, [calendarField]: "" }));
    }
  };

  const { cells, month, year } = getCalendarMatrix();
  const today = new Date();
  const selectedDate = calendarField
    ? formData[calendarField]
      ? new Date(formData[calendarField])
      : null
    : null;

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
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    setFormData((prev) => ({
      ...prev,
      [calendarField]: `${yyyy}-${mm}-${dd}`,
    }));

    if (calendarField === "startDate") {
      setStartCalendarOpen(false);
    } else {
      setEndCalendarOpen(false);
    }
  };

  const CustomSelect = ({
    label,
    name,
    value,
    onChange,
    options,
    error,
    required,
    placeholder = "Select",
    disabled = false,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    });

    const handleSelect = (optionValue) => {
      onChange(name, optionValue);
      setIsOpen(false);
    };

    const getDisplayValue = () => {
      if (!value) return placeholder;
      const option = options.find((opt) => opt.value === value);
      return option ? option.label : value;
    };

    return (
      <div className="prj-form-group" ref={dropdownRef}>
        <label className="prj-form-label">
          {label}
          {required && <span className="prj-required">*</span>}
        </label>
        <div className="prj-dropdown-wrapper">
          <button
            type="button"
            className={`prj-dropdown-select ${
              isOpen ? "open" : ""
            } ${error ? "error" : ""} ${
              disabled ? "prj-dropdown-disabled" : ""
            }`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
          >
            <span className="prj-dropdown-value">
              {!value ? placeholder : getDisplayValue()}
            </span>
            <span className="prj-dropdown-arrow">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                className={isOpen ? "prj-dropdown-arrow-svg-open" : ""}
              >
                <polyline
                  points="6 9 12 15 18 9"
                  fill="none"
                  stroke={PRIMARY}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
          {isOpen && (
            <ul className="prj-dropdown-list">
              {options.map((opt, idx) => {
                const optValue = opt.value ?? opt;
                const optLabel = opt.label ?? opt;
                return (
                  <li
                    key={idx}
                    className={`prj-dropdown-option ${
                      value === optValue ? "selected" : ""
                    } prj-dropdown-option-left`}
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

  const CustomFilterDropdown = ({
    value,
    onChange,
    options,
    placeholder,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    });

    const handleSelect = (optionValue) => {
      onChange(optionValue);
      setIsOpen(false);
    };

    return (
      <div
        className="prj-custom-filter-dropdown"
        ref={dropdownRef}
      >
        <button
          type="button"
          className={`prj-custom-filter-select ${
            isOpen ? "open" : ""
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="prj-custom-filter-value">
            {value || placeholder}
          </span>
          <span className="prj-custom-filter-arrow">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              className={
                isOpen ? "prj-custom-filter-arrow-svg-open" : ""
              }
            >
              <polyline
                points="6 9 12 15 18 9"
                fill="none"
                stroke={PRIMARY}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
        {isOpen && (
          <ul className="prj-custom-filter-list">
            {options.map((opt, idx) => (
              <li
                key={idx}
                className={`prj-custom-filter-option ${
                  value === opt ? "selected" : ""
                } prj-custom-filter-option-left`}
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

  const renderCalendarPopup = (variant) => (
    <div
      className={
        variant === "start"
          ? "prj-calendar-popup prj-calendar-popup-start"
          : "prj-calendar-popup prj-calendar-popup-end"
      }
      ref={variant === "start" ? startCalendarRef : endCalendarRef}
      style={
        variant === "end"
          ? {
              top: endCalPos.top,
              left: endCalPos.left,
            }
          : undefined
      }
    >
      <div className="prj-calendar-header">
        <button
          type="button"
          className="prj-calendar-nav-btn"
          onClick={goPrevMonth}
        >
          <ChevronLeftIcon size={16} />
        </button>
        <span className="prj-calendar-month-label">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          className="prj-calendar-nav-btn"
          onClick={goNextMonth}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="prj-calendar-weekdays">
        {weekdays.map((w) => (
          <div
            key={w}
            className="prj-calendar-weekday-cell"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="prj-calendar-grid">
        {cells.map((c, idx) => {
          const cellDate = new Date(year, month, c.day);
          const isToday =
            c.current &&
            cellDate.getDate() === today.getDate() &&
            cellDate.getMonth() === today.getMonth() &&
            cellDate.getFullYear() === today.getFullYear();
          const isSelected =
            selectedDate &&
            c.current &&
            cellDate.getDate() === selectedDate.getDate() &&
            cellDate.getMonth() === selectedDate.getMonth() &&
            cellDate.getFullYear() === selectedDate.getFullYear();

          let cellClass = "prj-calendar-day-cell";
          if (!c.current) cellClass += " prj-calendar-day-outside";
          if (isToday) cellClass += " prj-calendar-day-today";
          if (isSelected) cellClass += " prj-calendar-day-selected";

          return (
            <button
              key={idx}
              type="button"
              className={cellClass}
              onClick={() =>
                handleSelectCalendarDay(c.day, c.current)
              }
            >
              {c.day}
            </button>
          );
        })}
      </div>

      <div className="prj-calendar-footer">
        <button
          type="button"
          className="prj-calendar-today-btn"
          onClick={goToday}
        >
          Today
        </button>
      </div>
    </div>
  );

  return (
    <div className="prj-create-wrapper">
      <nav aria-label="breadcrumb" className="prj-breadcrumb">
        <ol className="prj-breadcrumb-list">
          <li className="prj-breadcrumb-item">
           <button
  type="button"
  onClick={() => navigate("/hr/dashboard/projectmgmt")}
  className="prj-breadcrumb-link"
>
  <Home size={16} />
</button>

          </li>
          <li className="prj-breadcrumb-item-active">
            <span className="prj-breadcrumb-current">
            Create Project
            </span>
          </li>
        </ol>
      </nav>

      {submitStatus && (
        <div
          className={`prj-alert prj-alert-${submitStatus.type}`}
        >
          <div className="prj-alert-content">
            {submitStatus.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{submitStatus.message}</span>
          </div>
          <button
            type="button"
            className="prj-alert-close"
            onClick={() => setSubmitStatus(null)}
          >
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
                  <h5 className="prj-section-title">
                    Basic Information
                  </h5>
                </div>
                <div className="prj-section-content">
                  <div className="prj-form-group">
                    <label className="prj-form-label">
                      Project Name
                      <span className="prj-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleChange}
                      placeholder="Example: ORG.IT.INTRANET"
                      className={`prj-form-input ${
                        errors.projectName ? "error" : ""
                      }`}
                    />
                    <div className="prj-form-hint">
                      Format:{" "}
                      <span className="prj-form-hint-strong">
                        ORG.Dept.Project
                      </span>
                    </div>
                    {errors.projectName && (
                      <div className="prj-error-message">
                        {errors.projectName}
                      </div>
                    )}
                  </div>

                  <div className="prj-form-group">
                    <label className="prj-form-label">
                      Client Name
                      <span className="prj-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      placeholder="Example: ACME CORPORATION"
                      className={`prj-form-input ${
                        errors.clientName ? "error" : ""
                      }`}
                    />
                    {errors.clientName && (
                      <div className="prj-error-message">
                        {errors.clientName}
                      </div>
                    )}
                  </div>

                  <CustomSelect
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    options={statusOptions.map((s) => ({
                      value: s,
                      label: s,
                    }))}
                    required
                    placeholder="Select"
                  />

                  <div className="prj-form-group">
                    <label className="prj-form-label">
                      Description
                    </label>
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

              <div className="prj-section-card">
                <div className="prj-section-header">
                  <Building
                    size={20}
                    className="prj-section-icon"
                  />
                  <h5 className="prj-section-title">
                    Organization Details
                  </h5>
                </div>
                <div className="prj-section-content">
                  <CustomSelect
                    label="Business Unit"
                    name="businessUnit"
                    value={formData.businessUnit}
                    onChange={handleSelectChange}
                    options={businessUnits.map((bu) => ({
                      value: bu,
                      label: bu,
                    }))}
                    error={errors.businessUnit}
                    required
                    placeholder="Select Business Unit"
                    disabled={businessUnitsLoading}
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
                    disabled={departmentsLoading}
                  />

                  <CustomSelect
                    label="Engagement Model"
                    name="engagementModel"
                    value={formData.engagementModel}
                    onChange={handleSelectChange}
                    options={engagementModels.map((em) => ({
                      value: em,
                      label: em,
                    }))}
                    error={errors.engagementModel}
                    required
                    placeholder="Select engagement model"
                  />
                </div>
              </div>

              <div className="prj-section-card">
                <div className="prj-section-header">
                  <CalendarIcon
                    size={20}
                    className="prj-section-icon"
                  />
                  <h5 className="prj-section-title">
                    Project Timeline
                  </h5>
                </div>
                <div className="prj-section-content">
                  <div className="prj-form-group">
                    <label className="prj-form-label">
                      Start Date
                      <span className="prj-required">*</span>
                    </label>
                    <div className="prj-date-input-wrapper">
                      <input
                        type="text"
                        readOnly
                        value={formatDisplayDate(
                          formData.startDate
                        )}
                        onClick={() =>
                          openCalendarForField("startDate")
                        }
                        placeholder="Select start date"
                        className={`prj-form-input prj-date-input ${
                          errors.startDate ? "error" : ""
                        }`}
                        ref={startCalendarRef}
                      />
                      <button
                        type="button"
                        className="prj-date-icon-btn"
                        onClick={() =>
                          openCalendarForField("startDate")
                        }
                      >
                        <CalendarIcon size={18} />
                      </button>
                      {startCalendarOpen &&
                        renderCalendarPopup("start")}
                    </div>
                    {errors.startDate && (
                      <div className="prj-error-message">
                        {errors.startDate}
                      </div>
                    )}
                  </div>

                  <div className="prj-form-group">
                    <label className="prj-form-label">
                      End Date
                      <span className="prj-optional">
                        Optional
                      </span>
                    </label>
                    <div className="prj-date-input-wrapper">
                      <input
                        ref={endInputRef}
                        type="text"
                        readOnly
                        value={formatDisplayDate(
                          formData.endDate
                        )}
                        onClick={() =>
                          openCalendarForField("endDate")
                        }
                        placeholder="Select end date"
                        className={`prj-form-input prj-date-input ${
                          errors.endDate ? "error" : ""
                        }`}
                      />
                      <button
                        type="button"
                        className="prj-date-icon-btn"
                        onClick={() =>
                          openCalendarForField("endDate")
                        }
                      >
                        <CalendarIcon size={18} />
                      </button>
                    </div>
                    {errors.endDate && (
                      <div className="prj-error-message">
                        {errors.endDate}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="prj-section-card">
                <div className="prj-section-header">
                  <Users
                    size={20}
                    className="prj-section-icon"
                  />
                  <h5 className="prj-section-title">
                    Reporting Managers
                  </h5>
                </div>
                <div className="prj-section-content">
                  {isLoadingData ? (
                    <div className="prj-loading-container">
                      <div className="prj-spinner-border prj-spinner" />
                    </div>
                  ) : (
                    <>
                      <div className="prj-form-group">
                        <label className="prj-form-label">
                          Resource Owner
                        </label>
                        <button
                          type="button"
                          className="prj-manager-box"
                          onClick={() =>
                            handleOpenManagerModal("resource")
                          }
                        >
                          {selectedResourceOwner ? (
                            <div>
                              <div className="prj-manager-name">
                                {selectedResourceOwner.firstName}{" "}
                                {
                                  selectedResourceOwner.lastName
                                }
                              </div>
                              <span className="prj-manager-role">
                                {selectedResourceOwner.roleName}
                              </span>
                            </div>
                          ) : (
                            <div className="prj-manager-placeholder">
                              <UserCog size={16} />
                              <span>Click to select</span>
                            </div>
                          )}
                        </button>
                      </div>

                      <div className="prj-form-group">
                        <label className="prj-form-label">
                          L1 Approver
                        </label>
                        <button
                          type="button"
                          className="prj-manager-box"
                          onClick={() =>
                            handleOpenManagerModal("l1")
                          }
                        >
                          {selectedL1Approver ? (
                            <div>
                              <div className="prj-manager-name">
                                {selectedL1Approver.firstName}{" "}
                                {selectedL1Approver.lastName}
                              </div>
                              <span className="prj-manager-role">
                                {selectedL1Approver.roleName}
                              </span>
                            </div>
                          ) : (
                            <div className="prj-manager-placeholder">
                              <UserCog size={16} />
                              <span>Click to select</span>
                            </div>
                          )}
                        </button>
                      </div>

                      <div className="prj-form-group">
                        <label className="prj-form-label">
                          L2 Approver
                        </label>
                        <button
                          type="button"
                          className="prj-manager-box"
                          onClick={() =>
                            handleOpenManagerModal("l2")
                          }
                        >
                          {selectedL2Approver ? (
                            <div>
                              <div className="prj-manager-name">
                                {selectedL2Approver.firstName}{" "}
                                {selectedL2Approver.lastName}
                              </div>
                              <span className="prj-manager-role">
                                {selectedL2Approver.roleName}
                              </span>
                            </div>
                          ) : (
                            <div className="prj-manager-placeholder">
                              <UserCog size={16} />
                              <span>Click to select</span>
                            </div>
                          )}
                        </button>
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
                <span>Reset</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="prj-btn prj-btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="prj-spinner-border prj-spinner-sm" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Create Project</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {endCalendarOpen && renderCalendarPopup("end")}

      {showManagerModal && (
        <>
          <div
            className="prj-modal-backdrop"
            onClick={() => setShowManagerModal(false)}
          />
          <div className="prj-modal-overlay">
            <div className="prj-modal-container">
              <div className="prj-modal-header">
                <div className="prj-modal-header-content">
                  <UserCog size={24} />
                  <h3 className="prj-modal-title">
                    Select Manager
                  </h3>
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
                  className={`prj-modal-tab ${
                    activeManagerTab === "resource"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setActiveManagerTab("resource")
                  }
                >
                  <span>Resource Owner</span>
                  {activeManagerTab === "resource" &&
                    selectedResourceOwner && (
                      <CheckCircle
                        size={16}
                        className="prj-tab-icon"
                      />
                    )}
                </button>
                <button
                  type="button"
                  className={`prj-modal-tab ${
                    activeManagerTab === "l1" ? "active" : ""
                  }`}
                  onClick={() => setActiveManagerTab("l1")}
                >
                  <span>L1 Approver</span>
                  {activeManagerTab === "l1" &&
                    selectedL1Approver && (
                      <CheckCircle
                        size={16}
                        className="prj-tab-icon"
                      />
                    )}
                </button>
                <button
                  type="button"
                  className={`prj-modal-tab ${
                    activeManagerTab === "l2" ? "active" : ""
                  }`}
                  onClick={() => setActiveManagerTab("l2")}
                >
                  <span>L2 Approver</span>
                  {activeManagerTab === "l2" &&
                    selectedL2Approver && (
                      <CheckCircle
                        size={16}
                        className="prj-tab-icon"
                      />
                    )}
                </button>
              </div>

              {(activeManagerTab === "resource" &&
                selectedResourceOwner) ||
              (activeManagerTab === "l1" &&
                selectedL1Approver) ||
              (activeManagerTab === "l2" &&
                selectedL2Approver) ? (
                <div className="prj-modal-info">
                  <span className="prj-info-icon" />
                  <div className="prj-info-content">
                    <span className="prj-info-label">
                      Currently Selected
                    </span>
                    <span className="prj-info-badge">
                      {activeManagerTab === "resource" &&
                      selectedResourceOwner
                        ? `${selectedResourceOwner.firstName} ${selectedResourceOwner.lastName}`
                        : ""}
                      {activeManagerTab === "l1" &&
                      selectedL1Approver
                        ? `${selectedL1Approver.firstName} ${selectedL1Approver.lastName}`
                        : ""}
                      {activeManagerTab === "l2" &&
                      selectedL2Approver
                        ? `${selectedL2Approver.firstName} ${selectedL2Approver.lastName}`
                        : ""}
                    </span>
                  </div>
                </div>
              ) : null}

           <div className="prj-modal-filters">
  <div className="prj-filter-search-container">
    <Search size={18} className="prj-search-icon-left" />
    <input
      type="text"
      className="prj-search-input-with-btn"
      placeholder="Search by name, role, or department..."
      value={managerSearchInput}
      onChange={(e) => setManagerSearchInput(e.target.value)}
      onKeyPress={handleManagerSearchKeyPress}
    />

    {managerSearchInput && (
      <button
        type="button"
        className="prj-search-clear-btn"
        onClick={handleCancelSearch}
      >
        <X size={16} />
      </button>
    )}

    {managerSearchTerm ? (
      <button
        type="button"
        className="prj-search-btn-inside prj-btn-cancel"
        onClick={handleCancelSearch}
      >
        <X size={16} />
        <span>Cancel</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={handleManagerSearch}
        className="prj-search-btn-inside"
      >
        <Search size={16} />
        <span>Search</span>
      </button>
    )}
  </div>

  <CustomFilterDropdown
    value={
      managerFilterRole === "All" ? "All Roles" : managerFilterRole
    }
    onChange={(v) =>
      setManagerFilterRole(v === "All Roles" ? "All" : v)
    }
    options={["All Roles", ...getUniqueManagerRoles()]}
    placeholder="All Roles"
  />

  <CustomFilterDropdown
    value={
      managerFilterDepartment === "All"
        ? "All Departments"
        : managerFilterDepartment
    }
    onChange={(v) =>
      setManagerFilterDepartment(
        v === "All Departments" ? "All" : v
      )
    }
    options={["All Departments", ...getUniqueManagerDepartments()]}
    placeholder="All Departments"
  />
</div>


<div className="prj-modal-body">
 <div className="prj-table-wrapper">
  <table className="prj-table">
    <thead>
      <tr>
        <th className="prj-table-select-col">Select</th>
        <th className="prj-col-name">Employee Name</th>
        <th className="prj-col-role">Role</th>
        <th className="prj-col-dept">Department</th>
      </tr>
    </thead>
    <tbody>
      {paginatedManagers.length === 0 ? (
        <tr>
          <td colSpan={4} className="prj-table-empty">
            No employees found for the selected filters.
          </td>
        </tr>
      ) : (
        paginatedManagers.map((emp) => {
          const isSelected =
            (activeManagerTab === "resource" &&
              selectedResourceOwner?.employeeMasterId ===
                emp.employeeMasterId) ||
            (activeManagerTab === "l1" &&
              selectedL1Approver?.employeeMasterId ===
                emp.employeeMasterId) ||
            (activeManagerTab === "l2" &&
              selectedL2Approver?.employeeMasterId ===
                emp.employeeMasterId);

          return (
            <tr
              key={emp.employeeMasterId}
              className={isSelected ? "prj-table-row-selected" : ""}
              onClick={() => handleManagerSelect(emp)}
            >
              <td className="prj-table-select-col">
                <input
                  type="radio"
                  className="prj-radio"
                  checked={isSelected}
                  onChange={() => handleManagerSelect(emp)}
                />
              </td>
              <td className="prj-col-name">
                {emp.firstName} {emp.lastName}
              </td>
              <td className="prj-col-role">
                {emp.roleName}
              </td>
              <td className="prj-col-dept">
                {emp.departmentName}
              </td>
            </tr>
          );
        })
      )}
    </tbody>
  </table>
</div>
</div>

              <div className="prj-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowManagerModal(false)}
                  className="prj-btn prj-btn-secondary"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSelection}
                  className="prj-btn prj-btn-primary"
                >
                  <CheckCircle size={18} />
                  <span>Confirm Selection</span>
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
