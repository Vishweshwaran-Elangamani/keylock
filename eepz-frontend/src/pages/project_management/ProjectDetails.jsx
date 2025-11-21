import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Building,
  Briefcase,
  Users,
  UserCog,
  Clock,
  Activity,
  CheckCircle,
  AlertCircle,
  FileText,
  Target,
  User,
  Home,
} from "lucide-react";
import projectService from "../../services/project_management/projectService";

const ProjectDetails = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [primaryProjectsMap, setPrimaryProjectsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await projectService.getProjectById(projectId);
      if (response.success && response.data) {
        setProject(response.data);
        console.log("Project details:", response.data);

        // Fetch primary projects for all mapped employees
        if (response.data.mappedEmployees && response.data.mappedEmployees.length > 0) {
          await fetchPrimaryProjects(response.data.mappedEmployees);
        }
      } else {
        setError("Failed to load project details");
      }
    } catch (err) {
      console.error("Error fetching project details:", err);
      setError("Failed to load project details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrimaryProjects = async (employees) => {
    try {
      const employeeIds = employees.map((emp) => emp.employeeMasterId);
      console.log("Fetching primary projects for employees:", employeeIds);

      const response = await projectService.getPrimaryProjects(employeeIds);
      
      if (response.success && response.data) {
        console.log("Primary projects response:", response.data);
        setPrimaryProjectsMap(response.data);
      }
    } catch (err) {
      console.error("Error fetching primary projects:", err);
      // Don't fail the whole page if this fails - just log it
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Active: { color: "success", icon: CheckCircle },
      "On Hold": { color: "warning", icon: Clock },
      Completed: { color: "info", icon: CheckCircle },
      Cancelled: { color: "danger", icon: AlertCircle },
    };
    const config = statusConfig[status] || {
      color: "secondary",
      icon: Activity,
    };
    const Icon = config.icon;
    return (
      <span
        className={`badge bg-${config.color} d-flex align-items-center gap-2`}
      >
        <Icon size={16} />
        {status}
      </span>
    );
  };

  // Check if employee is primary for THIS project
  const isEmployeePrimaryForThisProject = (employee) => {
    const employeeId = employee.employeeMasterId;
    const primaryProjectInfo = primaryProjectsMap[employeeId];
    
    // If no primary project info, fall back to isPrimary field
    if (!primaryProjectInfo) {
      return employee.isPrimary === 1 || employee.isPrimary === "1";
    }
    
    // Check if the primary project matches THIS project
    return primaryProjectInfo && 
           primaryProjectInfo.projectId === parseInt(projectId);
  };

  if (isLoading) {
    return (
      <div className="h-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-100 d-flex flex-column">
        <div className="d-flex align-items-center mb-4">
          <button
            className="btn btn-link text-decoration-none p-0 me-3"
            onClick={() => navigate("/hr/dashboard/projectmgmt/list")}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="mb-0">Project Details</h2>
        </div>
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <AlertCircle size={20} />
          <span>{error || "Project not found"}</span>
        </div>
      </div>
    );
  }

  const clientName = project.clientName || project.ClientName || "N/A";

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
          <li className="breadcrumb-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/hr/dashboard/projectmgmt/list");
              }}
              style={{
                color: "var(--color-primary-3)",
                textDecoration: "none",
              }}
            >
              All Projects
            </a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <span style={{ color: "var(--color-primary-1)", fontWeight: 600 }}>
              {project.projectName}
            </span>
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-link text-decoration-none p-0"
            onClick={() => navigate("/hr/dashboard/projectmgmt/list")}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="mb-0 fw-bold">{project.projectName}</h2>
            <p className="text-muted mb-0 small">
              Complete project information and team details
            </p>
          </div>
        </div>
      </div>

      {/* Project Details Content */}
      <div className="flex-grow-1 overflow-auto">
        <div className="row g-4">
          {/* Left Column - Basic Information */}
          <div className="col-lg-8">
            {/* Basic Information Card */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-0 py-3">
                <h5
                  className="mb-0 d-flex align-items-center gap-2"
                  style={{ color: "white", fontWeight: 600 }}
                >
                  <FileText size={20} className="text-primary" />
                  Basic Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="d-flex align-items-start gap-3">
                      <div className="bg-primary-subtle rounded p-2">
                        <Target size={20} className="text-primary" />
                      </div>
                      <div>
                        <label className="text-muted small mb-1">
                          Project Name
                        </label>
                        <p className="mb-0 fw-semibold">
                          {project.projectName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="d-flex align-items-start gap-3">
                      <div className="bg-secondary-subtle rounded p-2">
                        <User size={20} className="text-secondary" />
                      </div>
                      <div>
                        <label className="text-muted small mb-1">
                          Client Name
                        </label>
                        <p className="mb-0 fw-semibold">{clientName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="d-flex align-items-start gap-3">
                      <div className="bg-info-subtle rounded p-2">
                        <Activity size={20} className="text-info" />
                      </div>
                      <div>
                        <label className="text-muted small mb-1">Status</label>
                        <div>{getStatusBadge(project.status)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="d-flex align-items-start gap-3">
                      <div className="bg-success-subtle rounded p-2">
                        <Building size={20} className="text-success" />
                      </div>
                      <div>
                        <label className="text-muted small mb-1">
                          Business Unit
                        </label>
                        <p className="mb-0 fw-semibold">
                          {project.businessUnit || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="d-flex align-items-start gap-3">
                      <div className="bg-warning-subtle rounded p-2">
                        <Briefcase size={20} className="text-warning" />
                      </div>
                      <div>
                        <label className="text-muted small mb-1">
                          Department
                        </label>
                        <p className="mb-0 fw-semibold">
                          {project.department || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="d-flex align-items-start gap-3">
                      <div className="bg-secondary-subtle rounded p-2">
                        <Target size={20} className="text-secondary" />
                      </div>
                      <div>
                        <label className="text-muted small mb-1">
                          Engagement Model
                        </label>
                        <p className="mb-0 fw-semibold">
                          {project.engagementModel || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="d-flex align-items-start gap-3">
                      <div className="bg-info-subtle rounded p-2">
                        <FileText size={20} className="text-info" />
                      </div>
                      <div className="flex-grow-1">
                        <label className="text-muted small mb-1">
                          Description
                        </label>
                        <p className="mb-0">
                          {project.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-0 py-3">
                <h5
                  className="mb-0 d-flex align-items-center gap-2"
                  style={{ color: "white", fontWeight: 600 }}
                >
                  <Calendar size={20} className="text-primary" />
                  Project Timeline
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="d-flex align-items-start gap-3">
                      <div className="bg-success-subtle rounded p-2">
                        <Calendar size={20} className="text-success" />
                      </div>
                      <div>
                        <label className="text-muted small mb-1">
                          Start Date
                        </label>
                        <p className="mb-0 fw-semibold">
                          {formatDate(project.startDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="d-flex align-items-start gap-3">
                      <div className="bg-danger-subtle rounded p-2">
                        <Calendar size={20} className="text-danger" />
                      </div>
                      <div>
                        <label className="text-muted small mb-1">
                          End Date
                        </label>
                        <p className="mb-0 fw-semibold">
                          {formatDate(project.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mapped Employees Card */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <h5
                  className="mb-0 d-flex align-items-center gap-2"
                  style={{ color: "white", fontWeight: 600 }}
                >
                  <Users size={20} className="text-primary" />
                  Mapped Employees ({project.mappedEmployees?.length || 0})
                </h5>
              </div>
              <div className="card-body">
                {project.mappedEmployees &&
                project.mappedEmployees.length > 0 ? (
                  <div className="row g-3">
                    {project.mappedEmployees.map((employee) => {
                      // ✅ NEW: Check primary status from API response
                      const isPrimaryEmployee = isEmployeePrimaryForThisProject(employee);
                      const employeeId = employee.employeeMasterId;
                      const primaryProject = primaryProjectsMap[employeeId];
                      
                      return (
                        <div key={employee.employeeMasterId} className="col-md-6">
                          <div
                            className={`border rounded p-3 h-100 position-relative ${
                              isPrimaryEmployee ? "border-primary border-2" : ""
                            }`}
                            style={{
                              transition: "all 0.2s ease-in-out",
                            }}
                          >
                            {/* Primary/Secondary Badge - Top Right */}
                            <div
                              className="position-absolute top-0 end-0 mt-2 me-2"
                              style={{ zIndex: 1 }}
                            >
                              {isPrimaryEmployee ? (
                                <span className="badge bg-primary d-flex align-items-center gap-1">
                                  <CheckCircle size={12} />
                                  Primary
                                </span>
                              ) : (
                                <span className="badge bg-light text-dark border d-flex align-items-center gap-1">
                                  Secondary
                                </span>
                              )}
                            </div>

                            <div className="d-flex align-items-center gap-3">
                              {/* Avatar with Primary Styling */}
                              <div
                                className={`rounded-circle d-flex align-items-center justify-content-center ${
                                  isPrimaryEmployee
                                    ? "bg-primary text-white"
                                    : "bg-primary-subtle"
                                }`}
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  transition: "all 0.2s ease-in-out",
                                }}
                              >
                                <User
                                  size={24}
                                  className={
                                    isPrimaryEmployee
                                      ? "text-white"
                                      : "text-primary"
                                  }
                                />
                              </div>

                              {/* Employee Info */}
                              <div className="flex-grow-1">
                                <h6 className="mb-1 fw-semibold">
                                  {employee.firstName} {employee.lastName}
                                </h6>
                                <p className="mb-0 small text-muted d-flex align-items-center gap-2">
                                  <Briefcase size={14} />
                                  {employee.roleName}
                                </p>
                                <p className="mb-0 small text-muted d-flex align-items-center gap-2">
                                  <Building size={14} />
                                  {employee.departmentName}
                                </p>
                                {/* ✅ NEW: Show primary project name if different */}
                                {primaryProject && !isPrimaryEmployee && (
                                  <p className="mb-0 small text-info mt-1">
                                    Primary: {primaryProject.projectName}
                                  </p>
                                )}
                              </div>

                              {/* Status Badge - Right Side */}
                              <div className="d-flex flex-column align-items-end gap-1">
                                <span className="badge bg-secondary">
                                  ID: {employee.employeeMasterId}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted">
                    <Users size={48} className="mb-3 opacity-25" />
                    <p className="mb-0">No employees mapped to this project</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Reporting Managers */}
          <div className="col-lg-4">
            <div
              className="card border-0 shadow-sm sticky-top"
              style={{ top: "20px" }}
            >
              <div className="card-header bg-white border-0 py-3">
                <h5
                  className="mb-0 d-flex align-items-center gap-2"
                  style={{ color: "white", fontWeight: 600 }}
                >
                  <UserCog size={20} className="text-primary" />
                  Reporting Managers
                </h5>
              </div>
              <div className="card-body">
                {/* Resource Owner */}
                <div className="mb-4">
                  <label className="text-muted small mb-2 d-block">
                    Resource Owner
                  </label>
                  {project.resourceOwner ? (
                    <div className="border rounded p-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-primary-subtle rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: "40px", height: "40px" }}
                        >
                          <User size={20} className="text-primary" />
                        </div>
                        <div>
                          <h6 className="mb-0">
                            {project.resourceOwner.firstName}{" "}
                            {project.resourceOwner.lastName}
                          </h6>
                          <p className="mb-0 small text-muted">
                            {project.resourceOwner.roleName}
                          </p>
                          <p className="mb-0 small text-muted">
                            {project.resourceOwner.departmentName}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded p-3 text-center text-muted">
                      <p className="mb-0 small fst-italic">Not Assigned</p>
                    </div>
                  )}
                </div>

                {/* L1 Approver */}
                <div className="mb-4">
                  <label className="text-muted small mb-2 d-block">
                    L1 Approver (Manager)
                  </label>
                  {project.l1Approver ? (
                    <div className="border rounded p-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-success-subtle rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: "40px", height: "40px" }}
                        >
                          <UserCog size={20} className="text-success" />
                        </div>
                        <div>
                          <h6 className="mb-0">
                            {project.l1Approver.firstName}{" "}
                            {project.l1Approver.lastName}
                          </h6>
                          <p className="mb-0 small text-muted">
                            {project.l1Approver.roleName}
                          </p>
                          <p className="mb-0 small text-muted">
                            {project.l1Approver.departmentName}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded p-3 text-center text-muted">
                      <p className="mb-0 small fst-italic">Not Assigned</p>
                    </div>
                  )}
                </div>

                {/* L2 Approver */}
                <div>
                  <label className="text-muted small mb-2 d-block">
                    L2 Approver (Manager)
                  </label>
                  {project.l2Approver ? (
                    <div className="border rounded p-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-warning-subtle rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: "40px", height: "40px" }}
                        >
                          <UserCog size={20} className="text-warning" />
                        </div>
                        <div>
                          <h6 className="mb-0">
                            {project.l2Approver.firstName}{" "}
                            {project.l2Approver.lastName}
                          </h6>
                          <p className="mb-0 small text-muted">
                            {project.l2Approver.roleName}
                          </p>
                          <p className="mb-0 small text-muted">
                            {project.l2Approver.departmentName}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded p-3 text-center text-muted">
                      <p className="mb-0 small fst-italic">Not Assigned</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
