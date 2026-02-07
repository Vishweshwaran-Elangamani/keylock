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
import "../../styles/projectmanagement/components/ProjectDetails.css";

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

        if (
          response.data.mappedEmployees &&
          response.data.mappedEmployees.length > 0
        ) {
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
      const normalized = Object.entries(response.data).reduce((acc, [k, v]) => {
        acc[String(k)] = v;
        return acc;
      }, {});
      setPrimaryProjectsMap(normalized);
    }
  } catch (err) {
    console.error("Error fetching primary projects:", err);
  }
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
        className={`prj-detail-status-badge prj-detail-status-${config.color}`}
      >
        <Icon size={16} />
        {status}
      </span>
    );
  };

 const isEmployeePrimaryForThisProject = (employee) => {
  const employeeIdKey = String(employee.employeeMasterId);
  const primaryProjectInfo = primaryProjectsMap?.[employeeIdKey];

  if (primaryProjectInfo && primaryProjectInfo.projectId != null) {
    return Number(primaryProjectInfo.projectId) === Number(projectId);
  }

 
  return (
    employee.isPrimary === true ||
    employee.isPrimary === 1 ||
    employee.isPrimary === "1"
  );
};
const formatDate = (dateLike) => {
  if (!dateLike) return "N/A";
  try {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

  if (isLoading) {
    return (
      <div className="prj-detail-wrapper prj-detail-wrapper--center">
        <div className="prj-detail-loading">
          <div className="prj-detail-spinner" role="status">
            <span className="prj-detail-visually-hidden">Loading...</span>
          </div>
          <p className="prj-detail-loading-text">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="prj-detail-wrapper prj-detail-wrapper--column">
        <nav aria-label="breadcrumb" className="prj-detail-breadcrumb-nav">
          <ol className="prj-detail-breadcrumb">
            <li className="prj-detail-breadcrumb-item">
              <button
                type="button"
                onClick={() => navigate("/hr/dashboard/projectmgmt")}
                className="prj-detail-breadcrumb-link"
              >
                <Home size={20} />
              </button>
            </li>
            <li className="prj-detail-breadcrumb-item">
              <button
                type="button"
                onClick={() => navigate("/hr/dashboard/projectmgmt/list")}
                className="prj-detail-breadcrumb-link"
              >
                <span>All Projects</span>
              </button>
            </li>
            <li className="prj-detail-breadcrumb-item prj-detail-breadcrumb-item-active">
              <span className="prj-detail-breadcrumb-active">
                {project.projectName}
              </span>
            </li>
          </ol>
        </nav>

        <div className="prj-detail-alert prj-detail-alert--danger">
          <AlertCircle size={20} />
          <span>{error || "Project not found"}</span>
        </div>
      </div>
    );
  }

  const clientName = project.clientName || project.ClientName || "N/A";

  return (
    <div className="prj-detail-wrapper prj-detail-wrapper--column">
      <nav aria-label="breadcrumb" className="prj-detail-breadcrumb-nav">
        <ol className="prj-detail-breadcrumb">
          <li className="prj-detail-breadcrumb-item">
            <button
              type="button"
              onClick={() => navigate("/hr/dashboard/projectmgmt")}
              className="prj-detail-breadcrumb-link"
            >
              <Home size={14} />
            </button>
          </li>
          <li className="prj-detail-breadcrumb-item">
            <button
              type="button"
              onClick={() => navigate("/hr/dashboard/projectmgmt/list")}
              className="prj-detail-breadcrumb-link"
            >
              <span>All Projects</span>
            </button>
          </li>
          <li className="prj-detail-breadcrumb-item prj-detail-breadcrumb-item-active">
            <span className="prj-detail-breadcrumb-active">
              {project.projectName}
            </span>
          </li>
        </ol>
      </nav>

      <div className="prj-detail-content">
        <div className="prj-detail-layout">
          <div className="prj-detail-col-main">
            <div className="prj-detail-card">
              <div className="prj-detail-card-header">
                <FileText size={20} className="prj-detail-header-icon" />
                <h5 className="prj-detail-card-title">Basic Information</h5>
              </div>
              <div className="prj-detail-card-body">
                <div className="prj-detail-grid prj-detail-grid--two">
                  <div className="prj-detail-grid-item">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-primary">
                        <Target size={20} />
                      </div>
                      <div className="prj-detail-info-content">
                        <label className="prj-detail-label">Project Name</label>
                        <p className="prj-detail-value">
                          {project.projectName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="prj-detail-grid-item">
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

                  <div className="prj-detail-grid-item">
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

                  <div className="prj-detail-grid-item">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-success">
                        <Building size={20} />
                      </div>
                      <div className="prj-detail-info-content">
                        <label className="prj-detail-label">
                          Business Unit
                        </label>
                        <p className="prj-detail-value">
                          {project.businessUnit || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="prj-detail-grid-item">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-warning">
                        <Briefcase size={20} />
                      </div>
                      <div className="prj-detail-info-content">
                        <label className="prj-detail-label">Department</label>
                        <p className="prj-detail-value">
                          {project.department || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="prj-detail-grid-item">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-secondary">
                        <Target size={20} />
                      </div>
                      <div className="prj-detail-info-content">
                        <label className="prj-detail-label">
                          Engagement Model
                        </label>
                        <p className="prj-detail-value">
                          {project.engagementModel || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="prj-detail-grid-item prj-detail-grid-item--full">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-info">
                        <FileText size={20} />
                      </div>
                      <div className="prj-detail-info-content">
                        <label className="prj-detail-label">Description</label>
                        <p className="prj-detail-value">
                          {project.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="prj-detail-card">
              <div className="prj-detail-card-header">
                <Calendar size={20} className="prj-detail-header-icon" />
                <h5 className="prj-detail-card-title">Project Timeline</h5>
              </div>
              <div className="prj-detail-card-body">
                <div className="prj-detail-grid prj-detail-grid--two">
                  <div className="prj-detail-grid-item">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-success">
                        <Calendar size={20} />
                      </div>
                      <div className="prj-detail-info-content">
                        <label className="prj-detail-label">Start Date</label>
                        <p className="prj-detail-value">
                          {formatDate(project.startDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="prj-detail-grid-item">
                    <div className="prj-detail-info-item">
                      <div className="prj-detail-icon-wrapper prj-detail-icon-danger">
                        <Calendar size={20} />
                      </div>
                      <div className="prj-detail-info-content">
                        <label className="prj-detail-label">End Date</label>
                        <p className="prj-detail-value">
                          {formatDate(project.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="prj-detail-card">
              <div className="prj-detail-card-header">
                <Users size={20} className="prj-detail-header-icon" />
                <h5 className="prj-detail-card-title">
                  Mapped Employees ({project.mappedEmployees?.length || 0})
                </h5>
              </div>
              <div className="prj-detail-card-body">
                {project.mappedEmployees &&
                project.mappedEmployees.length > 0 ? (
                  <div className="prj-detail-grid prj-detail-grid--two">
                    {project.mappedEmployees.map((employee) => {
                      const isPrimaryEmployee =
                        isEmployeePrimaryForThisProject(employee);
                      const employeeId = employee.employeeMasterId;
                      const primaryProject = primaryProjectsMap[employeeId];

                      return (
                        <div
                          key={employee.employeeMasterId}
                          className="prj-detail-grid-item"
                        >
                          <div
                            className={`prj-detail-employee-card ${
                              isPrimaryEmployee
                                ? "prj-detail-employee-card--primary"
                                : ""
                            }`}
                          >
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
                              <div
                                className={`prj-detail-employee-avatar ${
                                  isPrimaryEmployee
                                    ? "prj-detail-employee-avatar--primary"
                                    : ""
                                }`}
                              >
                                <User size={24} />
                              </div>

                              <div className="prj-detail-employee-info">
                                <h6 className="prj-detail-employee-name">
                                  {employee.firstName} {employee.lastName}
                                </h6>
                                <p className="prj-detail-employee-role">
                                  <Briefcase size={14} />
                                  <span>{employee.roleName}</span>
                                </p>
                                <p className="prj-detail-employee-dept">
                                  <Building size={14} />
                                  <span>{employee.departmentName}</span>
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
                    <p className="prj-detail-empty-text">
                      No employees mapped to this project
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="prj-detail-col-side">
            <div className="prj-detail-card prj-detail-card--sticky">
              <div className="prj-detail-card-header">
                <UserCog size={20} className="prj-detail-header-icon" />
                <h5 className="prj-detail-card-title">Reporting Managers</h5>
              </div>
              <div className="prj-detail-card-body">
                <div className="prj-detail-manager-section">
                  <label className="prj-detail-manager-label">
                    Resource Owner
                  </label>
                  {project.resourceOwner ? (
                    <div className="prj-detail-manager-card">
                      <div className="prj-detail-manager-avatar prj-detail-manager-avatar-primary">
                        <User size={20} />
                      </div>
                      <div className="prj-detail-manager-info">
                        <h6 className="prj-detail-manager-name">
                          {project.resourceOwner.firstName}{" "}
                          {project.resourceOwner.lastName}
                        </h6>
                        <p className="prj-detail-manager-role">
                          {project.resourceOwner.roleName}
                        </p>
                        <p className="prj-detail-manager-dept">
                          {project.resourceOwner.departmentName}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="prj-detail-manager-empty">
                      <p className="prj-detail-manager-empty-text">
                        Not Assigned
                      </p>
                    </div>
                  )}
                </div>

                <div className="prj-detail-manager-section">
                  <label className="prj-detail-manager-label">
                    L1 Approver (Manager)
                  </label>
                  {project.l1Approver ? (
                    <div className="prj-detail-manager-card">
                      <div className="prj-detail-manager-avatar prj-detail-manager-avatar-success">
                        <UserCog size={20} />
                      </div>
                      <div className="prj-detail-manager-info">
                        <h6 className="prj-detail-manager-name">
                          {project.l1Approver.firstName}{" "}
                          {project.l1Approver.lastName}
                        </h6>
                        <p className="prj-detail-manager-role">
                          {project.l1Approver.roleName}
                        </p>
                        <p className="prj-detail-manager-dept">
                          {project.l1Approver.departmentName}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="prj-detail-manager-empty">
                      <p className="prj-detail-manager-empty-text">
                        Not Assigned
                      </p>
                    </div>
                  )}
                </div>

                <div className="prj-detail-manager-section">
                  <label className="prj-detail-manager-label">
                    L2 Approver (Manager)
                  </label>
                  {project.l2Approver ? (
                    <div className="prj-detail-manager-card">
                      <div className="prj-detail-manager-avatar prj-detail-manager-avatar-warning">
                        <UserCog size={20} />
                      </div>
                      <div className="prj-detail-manager-info">
                        <h6 className="prj-detail-manager-name">
                          {project.l2Approver.firstName}{" "}
                          {project.l2Approver.lastName}
                        </h6>
                        <p className="prj-detail-manager-role">
                          {project.l2Approver.roleName}
                        </p>
                        <p className="prj-detail-manager-dept">
                          {project.l2Approver.departmentName}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="prj-detail-manager-empty">
                      <p className="prj-detail-manager-empty-text">
                        Not Assigned
                      </p>
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
