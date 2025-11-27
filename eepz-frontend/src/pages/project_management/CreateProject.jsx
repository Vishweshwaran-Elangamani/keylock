import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderPlus,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
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

const CreateProject = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

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

  // Manager selection states
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
      console.error("Error fetching data:", error);
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
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
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
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
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
      console.error("Error creating project:", error);
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

  const CustomSelect = ({ label, name, value, onChange, options, error, required, placeholder }) => (
    <div className="mb-3">
      <label
        className="prj-form-label d-flex align-items-center gap-2 text-start"
      >
        {label}
        {required && <span className="prj-required">*</span>}
      </label>
      <div className="prj-select-wrapper">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`form-select text-start prj-custom-select ${error ? "is-invalid" : ""}`}
        >
          <option value="" className="prj-select-placeholder">
            {placeholder}
          </option>
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value || opt} className="prj-select-option">
              {opt.label || opt}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="prj-select-icon" />
      </div>
      {error && <div className="prj-error-text text-start">{error}</div>}
    </div>
  );

  return (
    <div className="prj-create-wrapper h-100 d-flex flex-column">
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="prj-breadcrumb-list">
          <li className="breadcrumb-item">
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
          <li className="breadcrumb-item active" aria-current="page">
            <span className="prj-breadcrumb-active">Create Project</span>
          </li>
        </ol>
      </nav>

      

      {/* Alert Messages */}
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

      {/* Form Card with 2x2 Grid Layout */}
      <div className="prj-main-card">
        <div className="prj-card-content">
          <form onSubmit={handleSubmit} className="h-100 d-flex flex-column">
            <div className="flex-grow-1">
              {/* 2x2 GRID LAYOUT */}
              <div className="row g-4">
                {/* TOP LEFT: Basic Information */}
                <div className="col-md-6">
                  <div className="prj-section-card h-100">
                    <div className="prj-section-header">
                      <h5 className="prj-section-title">Basic Information</h5>
                    </div>
                    <div className="prj-section-body">
                      <div className="mb-3">
                        <label className="prj-form-label text-start">
                          Project Name <span className="prj-required">*</span>
                        </label>
                        <input
                          type="text"
                          name="projectName"
                          value={formData.projectName}
                          onChange={handleChange}
                          placeholder="Example: ORG.IT.INTRANET"
                          className={`form-control text-start prj-input-field ${errors.projectName ? "is-invalid" : ""}`}
                        />
                        <div className="prj-input-hint text-start">
                          Format: <strong>ORG.(Dept).(Project)</strong>
                        </div>
                        {errors.projectName && <div className="prj-error-text text-start">{errors.projectName}</div>}
                      </div>

                      <div className="mb-3">
                        <label className="prj-form-label text-start">
                          Client Name <span className="prj-required">*</span>
                        </label>
                        <input
                          type="text"
                          name="clientName"
                          value={formData.clientName}
                          onChange={handleChange}
                          placeholder="Example: ACME CORPORATION"
                          className={`form-control text-start prj-input-field ${errors.clientName ? "is-invalid" : ""}`}
                        />
                        {errors.clientName && <div className="prj-error-text text-start">{errors.clientName}</div>}
                      </div>

                      <CustomSelect
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        options={statusOptions}
                        required
                        placeholder="Select status"
                      />

                      <div className="mb-0">
                        <label className="prj-form-label text-start">Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Enter project description"
                          rows="3"
                          className="form-control text-start prj-textarea-field"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* TOP RIGHT: Organization Details */}
                <div className="col-md-6">
                  <div className="prj-section-card h-100">
                    <div className="prj-section-header">
                      <Building size={20} className="prj-section-icon" />
                      <h5 className="prj-section-title">Organization Details</h5>
                    </div>
                    <div className="prj-section-body">
                      {isLoadingData ? (
                        <div className="prj-loading-state">
                          <div className="spinner-border prj-spinner" />
                          <p className="prj-loading-text">Loading data...</p>
                        </div>
                      ) : (
                        <>
                          <CustomSelect
                            label="Business Unit"
                            name="businessUnit"
                            value={formData.businessUnit}
                            onChange={handleChange}
                            options={businessUnits}
                            error={errors.businessUnit}
                            required
                            placeholder="Select Business Unit"
                          />

                          <CustomSelect
                            label="Department"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
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
                            onChange={handleChange}
                            options={engagementModels}
                            error={errors.engagementModel}
                            required
                            placeholder="Select engagement model"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* BOTTOM LEFT: Project Timeline */}
                <div className="col-md-6">
                  <div className="prj-section-card h-100">
                    <div className="prj-section-header">
                      <Calendar size={20} className="prj-section-icon" />
                      <h5 className="prj-section-title">Project Timeline</h5>
                    </div>
                    <div className="prj-section-body">
                      <div className="mb-3">
                        <label className="prj-form-label text-start">
                          Start Date <span className="prj-required">*</span>
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          min={today}
                          className={`form-control text-start prj-input-field ${errors.startDate ? "is-invalid" : ""}`}
                        />
                        {errors.startDate && <div className="prj-error-text text-start">{errors.startDate}</div>}
                      </div>

                      <div className="mb-0">
                        <label className="prj-form-label text-start">
                          End Date <span className="prj-optional">(Optional)</span>
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          min={formData.startDate || today}
                          className={`form-control text-start prj-input-field ${errors.endDate ? "is-invalid" : ""}`}
                        />
                        {errors.endDate && <div className="prj-error-text text-start">{errors.endDate}</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTTOM RIGHT: Reporting Managers */}
                <div className="col-md-6">
                  <div className="prj-section-card h-100">
                    <div className="prj-section-header">
                      <Users size={20} className="prj-section-icon" />
                      <h5 className="prj-section-title">Reporting Managers</h5>
                    </div>
                    <div className="prj-section-body">
                      {isLoadingData ? (
                        <div className="prj-loading-state">
                          <div className="spinner-border prj-spinner" />
                        </div>
                      ) : (
                        <>
                          <div className="mb-3">
                            <label className="prj-form-label text-start">Resource Owner</label>
                            <div
                              className="prj-manager-select-box"
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

                          <div className="mb-3">
                            <label className="prj-form-label text-start">L1 Approver</label>
                            <div
                              className="prj-manager-select-box"
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

                          <div className="mb-0">
                            <label className="prj-form-label text-start">L2 Approver</label>
                            <div
                              className="prj-manager-select-box"
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
              </div>
            </div>

            {/* Form Actions */}
            <div className="prj-form-actions">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="prj-btn prj-btn-reset"
              >
                <X size={18} />
                Reset
              </button>
              <button type="submit" disabled={isSubmitting} className="prj-btn prj-btn-submit">
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

      {/* Manager Selection Modal - STYLED LIKE IMAGE */}
      {showManagerModal && (
        <>
          <div className="prj-modal-backdrop" onClick={() => setShowManagerModal(false)} />
          <div className="prj-modal-overlay">
            <div className="prj-modal-container">
              {/* Purple Header */}
              <div className="prj-modal-header">
                <div className="prj-modal-header-content">
                  <UserCog size={20} />
                  <h5 className="prj-modal-title">
                    Edit Reporting Managers - {formData.projectName || "ORG.R2DC.EEPZ"}
                  </h5>
                </div>
                <button className="prj-modal-close-btn" onClick={() => setShowManagerModal(false)}>
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="prj-modal-tabs">
                <button
                  className={`prj-modal-tab ${activeManagerTab === "resource" ? "active" : ""}`}
                  onClick={() => setActiveManagerTab("resource")}
                >
                  Resource Owner
                  {selectedResourceOwner && <CheckCircle size={16} className="prj-tab-check" />}
                </button>
                <button
                  className={`prj-modal-tab ${activeManagerTab === "l1" ? "active" : ""}`}
                  onClick={() => setActiveManagerTab("l1")}
                >
                  L1 Approver
                  {selectedL1Approver && <CheckCircle size={16} className="prj-tab-check" />}
                </button>
                <button
                  className={`prj-modal-tab ${activeManagerTab === "l2" ? "active" : ""}`}
                  onClick={() => setActiveManagerTab("l2")}
                >
                  L2 Approver
                  {selectedL2Approver && <CheckCircle size={16} className="prj-tab-check" />}
                </button>
              </div>

              {/* Current Selection */}
              {getCurrentSelectedManager() && (
                <div className="prj-modal-current-selection">
                  <div className="prj-selection-icon">ℹ️</div>
                  <div className="prj-selection-content">
                    <strong className="prj-selection-label">Current Selection:</strong>
                    <span className="prj-selection-badge">
                      {getCurrentSelectedManager().firstName} {getCurrentSelectedManager().lastName} -{" "}
                      {getCurrentSelectedManager().roleName}
                    </span>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="prj-modal-filters">
                <div className="prj-filter-search">
                  <Search size={16} className="prj-search-icon" />
                  <input
                    type="text"
                    className="prj-search-input"
                    placeholder="Search by name..."
                    value={managerSearchTerm}
                    onChange={(e) => setManagerSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="prj-filter-select"
                  value={managerFilterRole}
                  onChange={(e) => setManagerFilterRole(e.target.value)}
                >
                  <option value="All">All Roles</option>
                  {getUniqueManagerRoles().map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <select
                  className="prj-filter-select"
                  value={managerFilterDepartment}
                  onChange={(e) => setManagerFilterDepartment(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  {getUniqueManagerDepartments().map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className="prj-modal-body">
                <div className="prj-modal-table-wrapper">
                  <table className="prj-modal-table">
                    <thead>
                      <tr>
                        <th style={{ width: "60px" }}>Select</th>
                        <th>Employee Name</th>
                        <th>Role</th>
                        <th>Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedManagers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="prj-table-empty">
                            No employees found
                          </td>
                        </tr>
                      ) : (
                        paginatedManagers.map((emp) => {
                          let isSelected = false;
                          if (activeManagerTab === "resource")
                            isSelected = selectedResourceOwner?.employeeMasterId === emp.employeeMasterId;
                          else if (activeManagerTab === "l1")
                            isSelected = selectedL1Approver?.employeeMasterId === emp.employeeMasterId;
                          else if (activeManagerTab === "l2")
                            isSelected = selectedL2Approver?.employeeMasterId === emp.employeeMasterId;

                          return (
                            <tr
                              key={emp.employeeMasterId}
                              className={`prj-table-row ${isSelected ? "selected" : ""}`}
                              onClick={() => handleManagerSelect(emp)}
                            >
                              <td>
                                <input
                                  type="radio"
                                  name="manager-radio"
                                  checked={isSelected}
                                  onChange={() => handleManagerSelect(emp)}
                                  className="prj-radio-input"
                                />
                              </td>
                              <td>
                                {emp.firstName} {emp.lastName}
                              </td>
                              <td className="prj-table-muted">{emp.roleName}</td>
                              <td className="prj-table-muted">{emp.departmentName}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {managerTotalPages > 1 && (
                  <div className="prj-modal-pagination">
                    <button
                      className="prj-page-btn"
                      onClick={() => goToManagerPage(managerCurrentPage - 1)}
                      disabled={managerCurrentPage === 1}
                    >
                      <ChevronLeftIcon size={16} />
                    </button>
                    {getManagerPageNumbers().map((page, idx) => {
                      if (page === "...") {
                        return (
                          <span key={`ellipsis-${idx}`} className="prj-page-ellipsis">
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          className={`prj-page-btn ${page === managerCurrentPage ? "active" : ""}`}
                          onClick={() => goToManagerPage(page)}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      className="prj-page-btn"
                      onClick={() => goToManagerPage(managerCurrentPage + 1)}
                      disabled={managerCurrentPage === managerTotalPages}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="prj-modal-footer">
                <button type="button" className="prj-modal-btn prj-btn-cancel" onClick={() => setShowManagerModal(false)}>
                  Cancel
                </button>
                <button type="button" className="prj-modal-btn prj-btn-confirm" onClick={handleConfirmSelection}>
                  <CheckCircle size={18} />
                  Update Managers
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
