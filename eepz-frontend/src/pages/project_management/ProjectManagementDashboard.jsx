import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FolderPlus,
  FolderKanban,
  Users,
  UserCog,
  Activity,
  Home,
} from "lucide-react";
import projectService from "../../services/project_management/projectService";
import "../../styles/projectmanagement/components/ProjectManagementDashboard.css";

const ProjectManagementBreadcrumb = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="pm-breadcrumb">
      <ol className="pm-breadcrumb__list">
        <li className="pm-breadcrumb__item">
          <Link to="/hr/dashboard" className="pm-breadcrumb__link">
            <Home size={18} className="pm-breadcrumb__icon" />
          </Link>
        </li>
        {items && items.length > 0 && (
          <>
            <li className="pm-breadcrumb__separator">/</li>
            <li className="pm-breadcrumb__item pm-breadcrumb__item--active">
              <span className="pm-breadcrumb__text">{items[0].label}</span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
};

const ProjectManagementDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalEmployees: 0,
    projectsWithManagers: 0,
    isLoading: true,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [projectsResponse, employeesResponse] = await Promise.all([
        projectService.getAllProjects(),
        projectService.getAllEmployees(),
      ]);

      if (projectsResponse.success && projectsResponse.data) {
        const projects = projectsResponse.data;
        setStats({
          totalProjects: projects.length,
          activeProjects: projects.filter((p) => p.status === "Active").length,
          totalEmployees: employeesResponse.success
            ? employeesResponse.data.length
            : 0,
          projectsWithManagers: projects.filter(
            (p) => p.resourceOwner || p.l1Approver || p.l2Approver
          ).length,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setStats((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="pm-dashboard">
      <div className="pm-dashboard__container">
        <ProjectManagementBreadcrumb
          items={[{ label: "Project Management" }]}
        />
        <div className="pm-dashboard__stats-grid">
          <div className="pm-dashboard__stat-card pm-dashboard__stat-card--primary">
            <div className="pm-dashboard__stat-icon pm-dashboard__stat-icon--primary">
              <FolderKanban size={32} />
            </div>
            <div className="pm-dashboard__stat-content">
              <h3 className="pm-dashboard__stat-value">
                {stats.isLoading ? (
                  <span className="pm-dashboard__spinner" />
                ) : (
                  stats.totalProjects
                )}
              </h3>
              <p className="pm-dashboard__stat-label">Total Projects</p>
            </div>
          </div>

          <div className="pm-dashboard__stat-card pm-dashboard__stat-card--success">
            <div className="pm-dashboard__stat-icon pm-dashboard__stat-icon--success">
              <Activity size={32} />
            </div>
            <div className="pm-dashboard__stat-content">
              <h3 className="pm-dashboard__stat-value">
                {stats.isLoading ? (
                  <span className="pm-dashboard__spinner" />
                ) : (
                  stats.activeProjects
                )}
              </h3>
              <p className="pm-dashboard__stat-label">Active Projects</p>
            </div>
          </div>

          <div className="pm-dashboard__stat-card pm-dashboard__stat-card--info">
            <div className="pm-dashboard__stat-icon pm-dashboard__stat-icon--info">
              <Users size={32} />
            </div>
            <div className="pm-dashboard__stat-content">
              <h3 className="pm-dashboard__stat-value">
                {stats.isLoading ? (
                  <span className="pm-dashboard__spinner" />
                ) : (
                  stats.totalEmployees
                )}
              </h3>
              <p className="pm-dashboard__stat-label">Total Employees</p>
            </div>
          </div>

          <div className="pm-dashboard__stat-card pm-dashboard__stat-card--accent">
            <div className="pm-dashboard__stat-icon pm-dashboard__stat-icon--accent">
              <UserCog size={32} />
            </div>
            <div className="pm-dashboard__stat-content">
              <h3 className="pm-dashboard__stat-value">
                {stats.isLoading ? (
                  <span className="pm-dashboard__spinner" />
                ) : (
                  stats.projectsWithManagers
                )}
              </h3>
              <p className="pm-dashboard__stat-label">Managed Projects</p>
            </div>
          </div>
        </div>

        <div className="pm-dashboard__main-card">
          <div className="pm-dashboard__main-content">
            <FolderKanban size={64} className="pm-dashboard__main-icon" />
            <h4 className="pm-dashboard__main-title">Project Management</h4>
            <p className="pm-dashboard__main-description">
              Create new projects, assign managers, map employees, and manage
              all project activities
            </p>
            <div className="pm-dashboard__actions">
              <button
                className="pm-dashboard__btn pm-dashboard__btn--primary"
                onClick={() => navigate("/hr/dashboard/projectmgmt/create")}
              >
                <FolderPlus size={20} />
                <span>Create New Project</span>
              </button>
              <button
                className="pm-dashboard__btn pm-dashboard__btn--secondary"
                onClick={() => navigate("/hr/dashboard/projectmgmt/list")}
              >
                <FolderKanban size={20} />
                <span>Manage Projects</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectManagementDashboard;
