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

  const PROJECT_NAME_REGEX =
    /^ORG\.[A-Za-z][A-Za-z0-9-]*\.[A-Za-z][A-Za-z0-9-]*$/;

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    setManagerCurrentPage(1);
  }, [managerSearchTerm, managerFilterRole, managerFilterDepartment]);

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
      newErrors.projectName =
        "Format must be ORG.(Dept).(Project), e.g., ORG.IT.INTRANET";
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = "Client name is required";
    } else if (formData.clientName.trim().length < 2) {
      newErrors.clientName = "Client name must be at least 2 characters";
    }

    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.businessUnit.trim())
      newErrors.businessUnit = "Business unit is required";
    if (!formData.department.trim())
      newErrors.department = "Department is required";
    if (!formData.engagementModel)
      newErrors.engagementModel = "Engagement model is required";

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
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : null,
        resourceOwnerEmployeeId:
          selectedResourceOwner?.employeeMasterId || null,
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

      const roleMatch =
        managerFilterRole === "All" || emp.roleName === managerFilterRole;
      const deptMatch =
        managerFilterDepartment === "All" ||
        emp.departmentName === managerFilterDepartment;

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
  const managerTotalPages = Math.ceil(
    filteredManagers.length / managerItemsPerPage
  );
  const managerStartIndex = (managerCurrentPage - 1) * managerItemsPerPage;
  const managerEndIndex = managerStartIndex + managerItemsPerPage;
  const paginatedManagers = filteredManagers.slice(
    managerStartIndex,
    managerEndIndex
  );

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
        for (let i = managerTotalPages - 3; i <= managerTotalPages; i++)
          pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = managerCurrentPage - 1; i <= managerCurrentPage + 1; i++)
          pages.push(i);
        pages.push("...");
        pages.push(managerTotalPages);
      }
    }
    return pages;
  };

  const CustomSelect = ({
    label,
    name,
    value,
    onChange,
    options,
    error,
    required,
    placeholder,
  }) => (
    <div className="mb-3">
      <label
        className="form-label d-flex align-items-center gap-2"
        style={{
          color: "var(--color-primary-2)",
          fontWeight: "500",
          fontSize: "0.9rem",
          marginBottom: "0.5rem",
        }}
      >
        {label}
        {required && <span style={{ color: "#E01950" }}>*</span>}
      </label>
      <div style={{ position: "relative" }}>
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`form-select ${error ? "is-invalid" : ""}`}
          style={{
            borderColor: error ? "#E01950" : "var(--border)",
            borderRadius: "8px",
            color: value ? "var(--color-primary-2)" : "var(--muted)",
            fontSize: "0.95rem",
            fontWeight: "500",
            padding: "0.65rem 2.5rem 0.65rem 0.75rem",
            appearance: "none",
            backgroundImage: "none",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
        >
          <option value="" style={{ color: "var(--muted)" }}>
            {placeholder}
          </option>
          {options.map((opt, idx) => (
            <option
              key={idx}
              value={opt.value || opt}
              style={{ color: "var(--color-primary-2)" }}
            >
              {opt.label || opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-primary-3)",
            pointerEvents: "none",
          }}
        />
      </div>
      {error && (
        <div
          style={{
            color: "#E01950",
            fontSize: "0.85rem",
            marginTop: "0.25rem",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-100 d-flex flex-column">
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol
          className="breadcrumb mb-0 p-3 rounded"
          style={{
            backgroundColor: "rgba(151, 36, 126, 0.05)",
            fontSize: "0.875rem",
          }}
        >
          <li className="breadcrumb-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/hr/dashboard/projectmgmt");
              }}
              style={{
                color: "var(--color-primary-3)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Home size={14} />
              Dashboard
            </a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <span style={{ color: "var(--color-primary-1)", fontWeight: 600 }}>
              Create Project
            </span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-link text-decoration-none p-0"
            onClick={() => navigate("/hr/dashboard/projectmgmt")}
            style={{ color: "var(--color-primary-3)" }}
          >
            <ArrowLeft size={24} />
          </button>
          <FolderPlus size={36} style={{ color: "#97247E" }} />
          <div>
            <h2
              className="mb-0 fw-bold"
              style={{ color: "var(--color-primary-1)" }}
            >
              Create New Project
            </h2>
            <p className="mb-0 small" style={{ color: "var(--muted)" }}>
              Initialize new project with details
            </p>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {submitStatus && (
        <div
          className="alert alert-dismissible fade show"
          role="alert"
          style={{
            backgroundColor:
              submitStatus.type === "success"
                ? "rgba(36, 161, 72, 0.1)"
                : "rgba(224, 25, 80, 0.1)",
            border: `1px solid ${
              submitStatus.type === "success" ? "#24A148" : "#E01950"
            }`,
            color: submitStatus.type === "success" ? "#24A148" : "#E01950",
            borderRadius: "8px",
            marginBottom: "1.5rem",
          }}
        >
          <div className="d-flex align-items-center gap-2">
            {submitStatus.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span style={{ fontWeight: "500" }}>{submitStatus.message}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setSubmitStatus(null)}
          ></button>
        </div>
      )}

      {/* Form Card */}
      <div
        className="card border-0 flex-grow-1"
        style={{
          boxShadow: "var(--shadow)",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <div className="card-body p-4 overflow-auto">
          <form onSubmit={handleSubmit} className="h-100 d-flex flex-column">
            <div className="flex-grow-1">
              {/* Basic Information */}
              <div className="mb-4">
                <h5
                  className="fw-bold mb-3 pb-2"
                  style={{
                    borderBottom: "2px solid var(--border)",
                    color: "var(--color-primary-1)",
                  }}
                >
                  Basic Information
                </h5>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label
                      className="form-label"
                      style={{
                        color: "var(--color-primary-2)",
                        fontWeight: "500",
                        fontSize: "0.9rem",
                      }}
                    >
                      Project Name <span style={{ color: "#E01950" }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleChange}
                      placeholder="Example: ORG.IT.INTRANET"
                      className={`form-control ${
                        errors.projectName ? "is-invalid" : ""
                      }`}
                      style={{
                        borderColor: errors.projectName
                          ? "#E01950"
                          : "var(--border)",
                        borderRadius: "8px",
                        padding: "0.65rem 0.75rem",
                        fontSize: "0.95rem",
                        letterSpacing: "0.5px",
                      }}
                    />
                    <div className="form-text" style={{ fontSize: "0.85rem" }}>
                      Use format <strong>ORG.(Dept).(Project)</strong> —
                      letters/numbers/hyphen only. No spaces.
                    </div>
                    {errors.projectName && (
                      <div
                        style={{
                          color: "#E01950",
                          fontSize: "0.85rem",
                          marginTop: "0.25rem",
                        }}
                      >
                        {errors.projectName}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label
                      className="form-label"
                      style={{
                        color: "var(--color-primary-2)",
                        fontWeight: "500",
                        fontSize: "0.9rem",
                      }}
                    >
                      Client Name <span style={{ color: "#E01950" }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      placeholder="Example: ACME CORPORATION"
                      className={`form-control ${
                        errors.clientName ? "is-invalid" : ""
                      }`}
                      style={{
                        borderColor: errors.clientName
                          ? "#E01950"
                          : "var(--border)",
                        borderRadius: "8px",
                        padding: "0.65rem 0.75rem",
                        fontSize: "0.95rem",
                      }}
                    />
                    {errors.clientName && (
                      <div
                        style={{
                          color: "#E01950",
                          fontSize: "0.85rem",
                          marginTop: "0.25rem",
                        }}
                      >
                        {errors.clientName}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <CustomSelect
                      label="Status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      options={statusOptions}
                      required
                      placeholder="Select status"
                    />
                  </div>

                  <div className="col-12">
                    <label
                      className="form-label"
                      style={{
                        color: "var(--color-primary-2)",
                        fontWeight: "500",
                        fontSize: "0.9rem",
                      }}
                    >
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter project description"
                      rows="3"
                      className="form-control"
                      style={{
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        padding: "0.65rem 0.75rem",
                        fontSize: "0.95rem",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Organization Details */}
              <div className="mb-4">
                <h5
                  className="fw-bold mb-3 pb-2 d-flex align-items-center gap-2"
                  style={{
                    borderBottom: "2px solid var(--border)",
                    color: "var(--color-primary-1)",
                  }}
                >
                  <Building size={20} style={{ color: "#97247E" }} />
                  Organization Details
                </h5>

                {isLoadingData ? (
                  <div className="text-center py-4">
                    <div
                      className="spinner-border"
                      style={{ color: "var(--color-primary-3)" }}
                    />
                    <p className="mt-2" style={{ color: "var(--muted)" }}>
                      Loading data...
                    </p>
                  </div>
                ) : (
                  <div className="row g-3">
                    <div className="col-md-6">
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
                    </div>

                    <div className="col-md-6">
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
                    </div>

                    <div className="col-md-6">
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
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="mb-4">
                <h5
                  className="fw-bold mb-3 pb-2 d-flex align-items-center gap-2"
                  style={{
                    borderBottom: "2px solid var(--border)",
                    color: "var(--color-primary-1)",
                  }}
                >
                  <Calendar size={20} style={{ color: "#0F62FE" }} />
                  Project Timeline
                </h5>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label
                      className="form-label"
                      style={{
                        color: "var(--color-primary-2)",
                        fontWeight: "500",
                        fontSize: "0.9rem",
                      }}
                    >
                      Start Date <span style={{ color: "#E01950" }}>*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      min={today}
                      className={`form-control ${
                        errors.startDate ? "is-invalid" : ""
                      }`}
                      style={{
                        borderColor: errors.startDate
                          ? "#E01950"
                          : "var(--border)",
                        borderRadius: "8px",
                        padding: "0.65rem 0.75rem",
                      }}
                    />
                    {errors.startDate && (
                      <div
                        style={{
                          color: "#E01950",
                          fontSize: "0.85rem",
                          marginTop: "0.25rem",
                        }}
                      >
                        {errors.startDate}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label
                      className="form-label"
                      style={{
                        color: "var(--color-primary-2)",
                        fontWeight: "500",
                        fontSize: "0.9rem",
                      }}
                    >
                      End Date{" "}
                      <span style={{ color: "var(--muted)" }}>(Optional)</span>
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      min={formData.startDate || today}
                      className={`form-control ${
                        errors.endDate ? "is-invalid" : ""
                      }`}
                      style={{
                        borderColor: errors.endDate
                          ? "#E01950"
                          : "var(--border)",
                        borderRadius: "8px",
                        padding: "0.65rem 0.75rem",
                      }}
                    />
                    {errors.endDate && (
                      <div
                        style={{
                          color: "#E01950",
                          fontSize: "0.85rem",
                          marginTop: "0.25rem",
                        }}
                      >
                        {errors.endDate}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reporting Managers */}
              <div className="mb-4">
                <h5
                  className="fw-bold mb-3 pb-2 d-flex align-items-center gap-2"
                  style={{
                    borderBottom: "2px solid var(--border)",
                    color: "var(--color-primary-1)",
                  }}
                >
                  <Users size={20} style={{ color: "#AC5098" }} />
                  Reporting Managers
                </h5>

                {isLoadingData ? (
                  <div className="text-center py-4">
                    <div
                      className="spinner-border"
                      style={{ color: "var(--color-primary-3)" }}
                    />
                  </div>
                ) : (
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label
                        className="form-label"
                        style={{
                          color: "var(--color-primary-2)",
                          fontWeight: "500",
                          fontSize: "0.9rem",
                        }}
                      >
                        Resource Owner
                      </label>
                      <div
                        className="p-3 border rounded"
                        style={{
                          cursor: "pointer",
                          borderColor: "var(--border)",
                          backgroundColor: selectedResourceOwner
                            ? "rgba(151, 36, 126, 0.05)"
                            : "transparent",
                          transition: "all 0.2s",
                        }}
                        onClick={() => handleOpenManagerModal("resource")}
                      >
                        {selectedResourceOwner ? (
                          <div>
                            <div className="fw-semibold">
                              {selectedResourceOwner.firstName}{" "}
                              {selectedResourceOwner.lastName}
                            </div>
                            <small className="text-muted">
                              {selectedResourceOwner.roleName}
                            </small>
                          </div>
                        ) : (
                          <div className="text-muted d-flex align-items-center gap-2">
                            <UserCog size={16} />
                            Click to select
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label
                        className="form-label"
                        style={{
                          color: "var(--color-primary-2)",
                          fontWeight: "500",
                          fontSize: "0.9rem",
                        }}
                      >
                        L1 Approver
                      </label>
                      <div
                        className="p-3 border rounded"
                        style={{
                          cursor: "pointer",
                          borderColor: "var(--border)",
                          backgroundColor: selectedL1Approver
                            ? "rgba(151, 36, 126, 0.05)"
                            : "transparent",
                          transition: "all 0.2s",
                        }}
                        onClick={() => handleOpenManagerModal("l1")}
                      >
                        {selectedL1Approver ? (
                          <div>
                            <div className="fw-semibold">
                              {selectedL1Approver.firstName}{" "}
                              {selectedL1Approver.lastName}
                            </div>
                            <small className="text-muted">
                              {selectedL1Approver.roleName}
                            </small>
                          </div>
                        ) : (
                          <div className="text-muted d-flex align-items-center gap-2">
                            <UserCog size={16} />
                            Click to select
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label
                        className="form-label"
                        style={{
                          color: "var(--color-primary-2)",
                          fontWeight: "500",
                          fontSize: "0.9rem",
                        }}
                      >
                        L2 Approver
                      </label>
                      <div
                        className="p-3 border rounded"
                        style={{
                          cursor: "pointer",
                          borderColor: "var(--border)",
                          backgroundColor: selectedL2Approver
                            ? "rgba(151, 36, 126, 0.05)"
                            : "transparent",
                          transition: "all 0.2s",
                        }}
                        onClick={() => handleOpenManagerModal("l2")}
                      >
                        {selectedL2Approver ? (
                          <div>
                            <div className="fw-semibold">
                              {selectedL2Approver.firstName}{" "}
                              {selectedL2Approver.lastName}
                            </div>
                            <small className="text-muted">
                              {selectedL2Approver.roleName}
                            </small>
                          </div>
                        ) : (
                          <div className="text-muted d-flex align-items-center gap-2">
                            <UserCog size={16} />
                            Click to select
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div
              className="d-flex gap-3 justify-content-end pt-3 mt-auto"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="btn d-flex align-items-center gap-2"
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--color-gray-6)",
                  borderRadius: "8px",
                  padding: "0.6rem 1rem",
                  fontWeight: "600",
                }}
              >
                <X size={18} />
                Reset
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn d-flex align-items-center gap-2 px-4"
                style={{
                  background:
                    "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  border: "none",
                  color: "white",
                  borderRadius: "8px",
                  padding: "0.6rem 1.5rem",
                  fontWeight: "600",
                  boxShadow: "var(--shadow)",
                }}
              >
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

      {/* Manager Selection Modal */}
      {showManagerModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <UserCog size={24} />
                  Select{" "}
                  {activeManagerTab === "resource"
                    ? "Resource Owner"
                    : activeManagerTab === "l1"
                    ? "L1 Approver"
                    : "L2 Approver"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowManagerModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Filters */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text bg-white">
                        <Search size={18} />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by name..."
                        value={managerSearchTerm}
                        onChange={(e) => setManagerSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={managerFilterRole}
                      onChange={(e) => setManagerFilterRole(e.target.value)}
                    >
                      <option value="All">All Roles</option>
                      {getUniqueManagerRoles().map((role, idx) => (
                        <option key={idx} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={managerFilterDepartment}
                      onChange={(e) =>
                        setManagerFilterDepartment(e.target.value)
                      }
                    >
                      <option value="All">All Departments</option>
                      {getUniqueManagerDepartments().map((dept, idx) => (
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
                  style={{ minHeight: "350px" }}
                >
                  <table className="table table-sm table-hover">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th style={{ width: "50px" }}>Select</th>
                        <th>Employee Name</th>
                        <th>Role</th>
                        <th>Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedManagers.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="text-center py-4 text-muted"
                          >
                            No employees found
                          </td>
                        </tr>
                      ) : (
                        paginatedManagers.map((emp) => {
                          let isSelected = false;
                          if (activeManagerTab === "resource")
                            isSelected =
                              selectedResourceOwner?.employeeMasterId ===
                              emp.employeeMasterId;
                          else if (activeManagerTab === "l1")
                            isSelected =
                              selectedL1Approver?.employeeMasterId ===
                              emp.employeeMasterId;
                          else if (activeManagerTab === "l2")
                            isSelected =
                              selectedL2Approver?.employeeMasterId ===
                              emp.employeeMasterId;

                          return (
                            <tr
                              key={emp.employeeMasterId}
                              className={isSelected ? "table-active" : ""}
                              style={{ cursor: "pointer" }}
                              onClick={() => handleManagerSelect(emp)}
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isSelected}
                                  onChange={() => handleManagerSelect(emp)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td>
                                {emp.firstName} {emp.lastName}
                              </td>
                              <td>{emp.roleName}</td>
                              <td>{emp.departmentName}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {managerTotalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                    <div className="text-muted small">
                      Showing {managerStartIndex + 1} to{" "}
                      {Math.min(managerEndIndex, filteredManagers.length)} of{" "}
                      {filteredManagers.length} employees
                    </div>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li
                          className={`page-item ${
                            managerCurrentPage === 1 ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() =>
                              setManagerCurrentPage(managerCurrentPage - 1)
                            }
                            disabled={managerCurrentPage === 1}
                          >
                            <ChevronLeftIcon size={14} />
                          </button>
                        </li>
                        {getManagerPageNumbers().map((page, index) =>
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
                                managerCurrentPage === page ? "active" : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => goToManagerPage(page)}
                              >
                                {page}
                              </button>
                            </li>
                          )
                        )}
                        <li
                          className={`page-item ${
                            managerCurrentPage === managerTotalPages
                              ? "disabled"
                              : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() =>
                              setManagerCurrentPage(managerCurrentPage + 1)
                            }
                            disabled={managerCurrentPage === managerTotalPages}
                          >
                            <ChevronRight size={14} />
                          </button>
                        </li>
                      </ul>
                    </nav>
                    <div className="text-muted small">
                      Page {managerCurrentPage} of {managerTotalPages}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowManagerModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmSelection}
                >
                  Confirm Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProject;
