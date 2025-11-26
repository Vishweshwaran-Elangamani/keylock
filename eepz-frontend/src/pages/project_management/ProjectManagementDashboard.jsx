import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderPlus,
  FolderKanban,
  Users,
  UserCog,
  Activity,
} from "lucide-react";
import projectService from "../../services/project_management/projectService";
import "../../styles/projectmanagement/ProjectManagementDashboard.css";

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
      {/* Statistics Cards */}
      <div className="pm-dashboard__stats-grid">
        {/* Total Projects Card */}
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

        {/* Active Projects Card */}
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

        {/* Total Employees Card */}
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

        {/* Managed Projects Card */}
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

      {/* Main Action Card */}
      <div className="pm-dashboard__main-card">
        <div className="pm-dashboard__main-content">
          <FolderKanban size={64} className="pm-dashboard__main-icon" />
          <h4 className="pm-dashboard__main-title">Project Management</h4>
          <p className="pm-dashboard__main-description">
            Create new projects, assign managers, map employees, and manage all
            project activities
          </p>
          <div className="pm-dashboard__actions">
            <button
              className="pm-dashboard__btn pm-dashboard__btn--primary"
              onClick={() => navigate("/hr/dashboard/projectmgmt/create")}
            >
              <FolderPlus size={20} />
              Create New Project
            </button>
            <button
              className="pm-dashboard__btn pm-dashboard__btn--secondary"
              onClick={() => navigate("/hr/dashboard/projectmgmt/list")}
            >
              <FolderKanban size={20} />
              Manage Projects
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectManagementDashboard;
