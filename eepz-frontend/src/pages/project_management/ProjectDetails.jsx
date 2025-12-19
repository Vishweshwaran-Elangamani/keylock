import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
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
import "../../styles/projectmanagement/ProjectDetails.css";

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

      const response = await projectService.getPrimaryProjects(employeeIds);
      
      if (response.success && response.data) {
        setPrimaryProjectsMap(response.data);
      }
    } catch (err) {
      console.error("Error fetching primary projects:", err);
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
      <span className={`prj-detail-status-badge prj-detail-status-${config.color}`}>
        <Icon size={16} />
        {status}
      </span>
    );
  };

  const isEmployeePrimaryForThisProject = (employee) => {
    const employeeId = employee.employeeMasterId;
    const primaryProjectInfo = primaryProjectsMap[employeeId];
    
    if (!primaryProjectInfo) {
      return employee.isPrimary === 1 || employee.isPrimary === "1";
    }
    
    return primaryProjectInfo && 
           primaryProjectInfo.projectId === parseInt(projectId);
  };

  if (isLoading) {
    return (
      <div className="prj-detail-wrapper h-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading project details...</p>
        </div>
      </div>
    );
  };

  if (error || !project) {
    return (
      <div className="prj-detail-wrapper h-100 d-flex flex-column">
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb mb-0 p-3 rounded prj-detail-breadcrumb">
            <li className="breadcrumb-item">
              <a href="#" onClick={(e) => { e.preventDefault(); navigate("/hr/dashboard/projectmgmt"); }} className="prj-detail-breadcrumb-link">
                <Home size={14} />
                Dashboard
              </a>
            </li>
            <li className="breadcrumb-item">
              <a href="#" onClick={(e) => { e.preventDefault(); navigate("/hr/dashboard/projectmgmt/list"); }} className="prj-detail-breadcrumb-link">
                All Projects
              </a>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              <span className="prj-detail-breadcrumb-active">Project Details</span>
            </li>
          </ol>
        </nav>
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <AlertCircle size={20} />
          <span>{error || "Project not found"}</span>
        </div>
      </div>
    );
  }

  const clientName = project.clientName || project.ClientName || "N/A";

  return (
    <div className="prj-detail-wrapper h-100 d-flex flex-column">
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0 p-3 rounded prj-detail-breadcrumb">
          <li className="breadcrumb-item">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/hr/dashboard/projectmgmt"); }} className="prj-detail-breadcrumb-link">
              <Home size={14} />
              Dashboard
            </a>
          </li>
          <li className="breadcrumb-item">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/hr/dashboard/projectmgmt/list"); }} className="prj-detail-breadcrumb-link">
              All Projects
            </a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <span className="prj-detail-breadcrumb-active">{project.projectName}</span>
          </li>
        </ol>
      </nav>

      {/* Project Details Content */}
      <div className="flex-grow-1 overflow-auto">
        <div className="row g-4">
          {/* Left Column - Basic Information */}
          <div className="col-lg-8">
            {/* Basic Information Card */}
            <div className="prj-detail-card mb-4">
              <div className="prj-detail-card-header">
                <FileText size={20} className="prj-detail-header-icon" />
                <h5 className="prj-detail-card-title">Basic Information</h5>
              </div>
              <div className="prj-detail-card-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-primary">
                        <Target size={20} />
                      </div>
                      <div className="prj-detail-info-content">
                        <label className="prj-detail-label">Project Name</label>
                        <p className="prj-detail-value">{project.projectName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-secondary">
                        <User size={20} />
                      </div>
                      <div className="prj-detail-info-content">
                        <label className="prj-detail-label">Client Name</label>
                        <p className="prj-detail-value">{clientName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-info">
                        <Activity size={20} />
                      </div>
                      <div className="prj-detail-info-content">
                        <label className="prj-detail-label">Status</label>
                        <div>{getStatusBadge(project.status)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-success">
                        <Building size={20} />
                      </div>
                      <div className="prj-detail-info-content">
                        <label className="prj-detail-label">Business Unit</label>
                        <p className="prj-detail-value">{project.businessUnit || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-warning">
                        <Briefcase size={20} />
                      </div>
                      <div className="prj-detail-info-content">
                        <label className="prj-detail-label">Department</label>
                        <p className="prj-detail-value">{project.department || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-secondary">
                        <Target size={20} />
                      </div>
                      <div className="prj-detail-info-content">
                        <label className="prj-detail-label">Engagement Model</label>
                        <p className="prj-detail-value">{project.engagementModel || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-info">
                        <FileText size={20} />
                      </div>
                      <div className="prj-detail-info-content flex-grow-1">
                        <label className="prj-detail-label">Description</label>
                        <p className="prj-detail-value">{project.description || "No description provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="prj-detail-card mb-4">
              <div className="prj-detail-card-header">
                <Calendar size={20} className="prj-detail-header-icon" />
                <h5 className="prj-detail-card-title">Project Timeline</h5>
              </div>
              <div className="prj-detail-card-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-success">
                        <Calendar size={20} />
                      </div>
                      <div className="prj-detail-info-content">
                        <label className="prj-detail-label">Start Date</label>
                        <p className="prj-detail-value">{formatDate(project.startDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-danger">
                        <Calendar size={20} />
                      </div>
                      <div className="prj-detail-info-content">
                        <label className="prj-detail-label">End Date</label>
                        <p className="prj-detail-value">{formatDate(project.endDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mapped Employees Card */}
            <div className="prj-detail-card">
              <div className="prj-detail-card-header">
                <Users size={20} className="prj-detail-header-icon" />
                <h5 className="prj-detail-card-title">Mapped Employees ({project.mappedEmployees?.length || 0})</h5>
              </div>
              <div className="prj-detail-card-body">
                {project.mappedEmployees && project.mappedEmployees.length > 0 ? (
                  <div className="row g-3">
                    {project.mappedEmployees.map((employee) => {
                      const isPrimaryEmployee = isEmployeePrimaryForThisProject(employee);
                      const employeeId = employee.employeeMasterId;
                      const primaryProject = primaryProjectsMap[employeeId];
                      
                      return (
                        <div key={employee.employeeMasterId} className="col-md-6">
                          <div className={`prj-detail-employee-card ${isPrimaryEmployee ? "primary" : ""}`}>
                            <div className="prj-detail-employee-badge">
                              {isPrimaryEmployee ? (
                                <span className="prj-detail-badge prj-detail-badge-primary">
                                  <CheckCircle size={12} />
                                  Primary
                                </span>
                              ) : (
                                <span className="prj-detail-badge prj-detail-badge-secondary">
                                  Secondary
                                </span>
                              )}
                            </div>

                            <div className="prj-detail-employee-content">
                              <div className={`prj-detail-employee-avatar ${isPrimaryEmployee ? "primary" : ""}`}>
                                <User size={24} />
                              </div>

                              <div className="prj-detail-employee-info">
                                <h6 className="prj-detail-employee-name">
                                  {employee.firstName} {employee.lastName}
                                </h6>
                                <p className="prj-detail-employee-role">
                                  <Briefcase size={14} />
                                  {employee.roleName}
                                </p>
                                <p className="prj-detail-employee-dept">
                                  <Building size={14} />
                                  {employee.departmentName}
                                </p>
                                {primaryProject && !isPrimaryEmployee && (
                                  <p className="prj-detail-employee-primary-project">
                                    Primary: {primaryProject.projectName}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="prj-detail-empty-state">
                    <Users size={48} className="prj-detail-empty-icon" />
                    <p className="prj-detail-empty-text">No employees mapped to this project</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Reporting Managers */}
          <div className="col-lg-4">
            <div className="prj-detail-card prj-detail-sticky">
              <div className="prj-detail-card-header">
                <UserCog size={20} className="prj-detail-header-icon" />
                <h5 className="prj-detail-card-title">Reporting Managers</h5>
              </div>
              <div className="prj-detail-card-body">
                {/* Resource Owner */}
                <div className="prj-detail-manager-section">
                  <label className="prj-detail-manager-label">Resource Owner</label>
                  {project.resourceOwner ? (
                    <div className="prj-detail-manager-card">
                      <div className="prj-detail-manager-avatar prj-detail-manager-avatar-primary">
                        <User size={20} />
                      </div>
                      <div className="prj-detail-manager-info">
                        <h6 className="prj-detail-manager-name">
                          {project.resourceOwner.firstName} {project.resourceOwner.lastName}
                        </h6>
                        <p className="prj-detail-manager-role">{project.resourceOwner.roleName}</p>
                        <p className="prj-detail-manager-dept">{project.resourceOwner.departmentName}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="prj-detail-manager-empty">
                      <p className="prj-detail-manager-empty-text">Not Assigned</p>
                    </div>
                  )}
                </div>

                {/* L1 Approver */}
                <div className="prj-detail-manager-section">
                  <label className="prj-detail-manager-label">L1 Approver (Manager)</label>
                  {project.l1Approver ? (
                    <div className="prj-detail-manager-card">
                      <div className="prj-detail-manager-avatar prj-detail-manager-avatar-success">
                        <UserCog size={20} />
                      </div>
                      <div className="prj-detail-manager-info">
                        <h6 className="prj-detail-manager-name">
                          {project.l1Approver.firstName} {project.l1Approver.lastName}
                        </h6>
                        <p className="prj-detail-manager-role">{project.l1Approver.roleName}</p>
                        <p className="prj-detail-manager-dept">{project.l1Approver.departmentName}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="prj-detail-manager-empty">
                      <p className="prj-detail-manager-empty-text">Not Assigned</p>
                    </div>
                  )}
                </div>

                {/* L2 Approver */}
                <div className="prj-detail-manager-section">
                  <label className="prj-detail-manager-label">L2 Approver (Manager)</label>
                  {project.l2Approver ? (
                    <div className="prj-detail-manager-card">
                      <div className="prj-detail-manager-avatar prj-detail-manager-avatar-warning">
                        <UserCog size={20} />
                      </div>
                      <div className="prj-detail-manager-info">
                        <h6 className="prj-detail-manager-name">
                          {project.l2Approver.firstName} {project.l2Approver.lastName}
                        </h6>
                        <p className="prj-detail-manager-role">{project.l2Approver.roleName}</p>
                        <p className="prj-detail-manager-dept">{project.l2Approver.departmentName}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="prj-detail-manager-empty">
                      <p className="prj-detail-manager-empty-text">Not Assigned</p>
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
