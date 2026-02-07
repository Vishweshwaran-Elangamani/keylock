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
  UserCog,
  Home,
} from "lucide-react";
import projectService from "../../services/project_management/projectService";
import EmployeeSelectionModal from "../../components/project-management/modals/EmployeeSelectionModal";
import CustomCalendar from "../../components/project-management/common/CustomCalendar";
import CustomDropdown from "../../components/project-management/common/CustomDropdown";
import "../../styles/projectmanagement/components/CreateProject.css";

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
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const statusOptions = ["Active", "On Hold", "Completed", "Cancelled"];
  const [selectedL2Approver, setSelectedL2Approver] = useState(null);

  const engagementModels = [
    "Fixed Price",
    "Time and Materials",
    "Agile - Scrum",
    "Agile - Kanban",
    "Consulting",
    "Retainer",
  ];

  const PROJECTNAMEREGEX = /^ORG\.[A-Za-zA-Za-z0-9-]+\.[A-Za-zA-Za-z0-9-]+$/;

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    setIsLoadingData(true);
    setBusinessUnitsLoading(true);
    setDepartmentsLoading(true);

    try {
      const [employeesRes, departmentsRes, businessUnitsRes] =
        await Promise.all([
          projectService.getAllEmployees(),
          projectService.getAllDepartments(),
          projectService.getAllBusinessUnits(),
        ]);

      const employeesData = Array.isArray(employeesRes?.data)
        ? employeesRes.data
        : [];
      const departmentsData = Array.isArray(departmentsRes?.data)
        ? departmentsRes.data.map((dep) => ({
            value: dep.departmentId,
            label: dep.departmentName,
          }))
        : [];
      const businessUnitsData = Array.isArray(businessUnitsRes?.data)
        ? businessUnitsRes.data
        : [];

      setEmployees(employeesData);
      setDepartments(departmentsData);
      setBusinessUnits(businessUnitsData);
    } catch (error) {
      console.error("Dropdown Fetch Error:", error);
      setSubmitStatus({
        type: "error",
        message: "Failed to load dropdown data.",
      });
    } finally {
      setBusinessUnitsLoading(false);
      setDepartmentsLoading(false);
      setIsLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "projectName") formattedValue = value.toUpperCase();

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
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
      newErrors.clientName = "Client name must be at least 2 characters";
    }

    if (!formData.startDate) newErrors.startDate = "Start date is required";

    if (!String(formData.businessUnit || "").trim())
      newErrors.businessUnit = "Business unit is required";

    if (!String(formData.department || "").trim())
      newErrors.department = "Department is required";

    if (!formData.engagementModel)
      newErrors.engagementModel = "Engagement model is required";

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
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
      const selectedDepartment = departments.find(
        (dep) => dep.value === formData.department,
      );
      const departmentName = selectedDepartment ? selectedDepartment.label : "";

      const projectData = {
        ...formData,
        department: departmentName,
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
      setSubmitStatus({
        type: "error",
        message:
          error?.message || "Failed to create project. Please try again.",
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
    setStartCalendarOpen(false);
    setEndCalendarOpen(false);
  };

  const handleOpenManagerModal = (tab) => {
    setActiveManagerTab(tab);
    setShowManagerModal(true);
  };

  const handleManagerSelect = (employee) => {
    if (activeManagerTab === "resource") setSelectedResourceOwner(employee);
    if (activeManagerTab === "l1") setSelectedL1Approver(employee);
    if (activeManagerTab === "l2") setSelectedL2Approver(employee);
  };

  const handleConfirmSelection = () => {
    setShowManagerModal(false);
  };

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
              <Home size={18} />
            </button>
          </li>
          <li className="prj-breadcrumb-item-active">
            <span className="prj-breadcrumb-current">Create Project</span>
          </li>
        </ol>
      </nav>

      {submitStatus && (
        <div className={`prj-alert prj-alert-${submitStatus.type}`}>
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
                      Client Name <span className="prj-required">*</span>
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

                  <CustomDropdown
                    label="Status"
                    required
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    options={statusOptions}
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

              <div className="prj-section-card">
                <div className="prj-section-header">
                  <Building size={20} className="prj-section-icon" />
                  <h5 className="prj-section-title">Organization Details</h5>
                </div>

                <div className="prj-section-content">
                  <CustomDropdown
                    label="Business Unit"
                    required
                    name="businessUnit"
                    value={formData.businessUnit}
                    onChange={handleSelectChange}
                    options={businessUnits}
                    placeholder="Select Business Unit"
                    disabled={businessUnitsLoading}
                    error={errors.businessUnit}
                  />

                  <CustomDropdown
                    label="Department"
                    required
                    name="department"
                    value={formData.department}
                    onChange={handleSelectChange}
                    options={departments}
                    placeholder="Select Department"
                    disabled={departmentsLoading}
                    error={errors.department}
                  />

                  <CustomDropdown
                    label="Engagement Model"
                    required
                    name="engagementModel"
                    value={formData.engagementModel}
                    onChange={handleSelectChange}
                    options={engagementModels}
                    placeholder="Select engagement model"
                    error={errors.engagementModel}
                  />
                </div>
              </div>

              <div className="prj-section-card">
                <div className="prj-section-header">
                  <CalendarIcon size={20} className="prj-section-icon" />
                  <h5 className="prj-section-title">Project Timeline</h5>
                </div>

                <div className="prj-section-content">
                  <div className="prj-form-group">
                    <label className="prj-form-label">
                      Start Date <span className="prj-required">*</span>
                    </label>
                    <div className="prj-date-input-wrapper" ref={startDateRef}>
                      <input
                        type="text"
                        readOnly
                        value={formatDisplayDate(formData.startDate)}
                        onClick={() => setStartCalendarOpen(!startCalendarOpen)}
                        placeholder="Select start date"
                        className={`prj-form-input prj-date-input ${
                          errors.startDate ? "error" : ""
                        }`}
                      />
                      <button
                        type="button"
                        className="prj-date-icon-btn"
                        onClick={() => setStartCalendarOpen(!startCalendarOpen)}
                      >
                        <CalendarIcon size={18} />
                      </button>
                    </div>
                    {errors.startDate && (
                      <div className="prj-error-message">
                        {errors.startDate}
                      </div>
                    )}
                  </div>

                  <CustomCalendar
                    isOpen={startCalendarOpen}
                    onClose={() => setStartCalendarOpen(false)}
                    value={formData.startDate}
                    onChange={(value) => handleDateChange("startDate", value)}
                    anchorRef={startDateRef}
                    position="below-icon"
                    align="right"
                  />

                  <div className="prj-form-group">
                    <label className="prj-form-label">
                      End Date <span className="prj-optional">Optional</span>
                    </label>
                    <div className="prj-date-input-wrapper" ref={endDateRef}>
                      <input
                        type="text"
                        readOnly
                        value={formatDisplayDate(formData.endDate)}
                        onClick={() => setEndCalendarOpen(!endCalendarOpen)}
                        placeholder="Select end date"
                        className={`prj-form-input prj-date-input ${
                          errors.endDate ? "error" : ""
                        }`}
                      />
                      <button
                        type="button"
                        className="prj-date-icon-btn"
                        onClick={() => setEndCalendarOpen(!endCalendarOpen)}
                      >
                        <CalendarIcon size={18} />
                      </button>
                    </div>
                    {errors.endDate && (
                      <div className="prj-error-message">{errors.endDate}</div>
                    )}
                  </div>

                  <CustomCalendar
                    isOpen={endCalendarOpen}
                    onClose={() => setEndCalendarOpen(false)}
                    value={formData.endDate}
                    onChange={(value) => handleDateChange("endDate", value)}
                    anchorRef={endDateRef}
                    position="below-icon"
                    align="right"
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
                      <div className="prj-spinner-border prj-spinner" />
                    </div>
                  ) : (
                    <>
                      <div className="prj-form-group">
                        <label className="prj-form-label">Resource Owner</label>
                        <button
                          type="button"
                          className="prj-manager-box"
                          onClick={() => handleOpenManagerModal("resource")}
                        >
                          {selectedResourceOwner ? (
                            <div className="prj-manager-info">
                              <div className="prj-manager-name">
                                {selectedResourceOwner.firstName}{" "}
                                {selectedResourceOwner.lastName}
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
                        <label className="prj-form-label">L1 Approver</label>
                        <button
                          type="button"
                          className="prj-manager-box"
                          onClick={() => handleOpenManagerModal("l1")}
                        >
                          {selectedL1Approver ? (
                            <div className="prj-manager-info">
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
                        <label className="prj-form-label">L2 Approver</label>
                        <button
                          type="button"
                          className="prj-manager-box"
                          onClick={() => handleOpenManagerModal("l2")}
                        >
                          {selectedL2Approver ? (
                            <div className="prj-manager-info">
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

      <EmployeeSelectionModal
        show={showManagerModal}
        onClose={() => setShowManagerModal(false)}
        employees={employees}
        allEmployees={employees}
        activeTab={activeManagerTab}
        setActiveTab={setActiveManagerTab}
        selectedResourceOwner={selectedResourceOwner}
        selectedL1Approver={selectedL1Approver}
        selectedL2Approver={selectedL2Approver}
        onSelectManager={handleManagerSelect}
        onConfirm={handleConfirmSelection}
      />
    </div>
  );
};

export default CreateProject;
