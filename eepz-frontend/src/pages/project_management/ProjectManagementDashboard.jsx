import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderPlus,
  FolderKanban,
  Users,
  UserCog,
  TrendingUp,
  Activity,
} from "lucide-react";
import projectService from "../../services/project_management/projectService";

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
    <div
      className="h-100 d-flex flex-column"
      style={{ maxWidth: "100%", width: "100%" }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2
            className="fw-bold mb-1"
            style={{ color: "var(--color-primary-1)" }}
          >
            Project Management Dashboard
          </h2>
          <p className="mb-0 medium" style={{ color: "var(--muted)", textAlign:"left"}}>
            Overview and quick actions
          </p>
        </div>
        <div className="d-flex gap-2 flex-shrink-0">
          {/* <button
            className="btn d-flex align-items-center gap-2"
            onClick={() => navigate("/hr/dashboard/projectmgmt/list")}
            style={{
              backgroundColor: "transparent",
              border: "1px solid var(--border)",
              color: "var(--color-primary-3)",
              borderRadius: "var(--radius-md)",
              padding: "0.5rem 0.9rem",
              fontWeight: "600",
              transition: "all 0.12s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-primary-5)";
              e.currentTarget.style.borderColor = "var(--color-primary-3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <FolderKanban size={18} />
            <span>View All</span>
          </button> */}
          {/* <button
            className="btn d-flex align-items-center gap-2"
            onClick={() => navigate("/hr/dashboard/projectmgmt/create")}
            style={{
              background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
              border: "none",
              color: "white",
              borderRadius: "9px",
              padding: "0.5rem 0.9rem",
              fontWeight: "600",
              boxShadow: "var(--shadow)",
              transition: "all 0.12s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <FolderPlus size={18} />
            <span>Create</span>
          </button> */}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row g-4 mb-4">
        {/* Total Projects Card */}
        <div className="col-md-6 col-lg-3">
          <div
            className="card border-0"
            style={{
              boxShadow: "var(--shadow)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="rounded p-3"
                  style={{
                    backgroundColor: "rgba(82, 79, 125, 0.1)",
                  }}
                >
                  <FolderKanban
                    size={24}
                    style={{ color: "var(--color-primary-3)" }}
                  />
                </div>
                <TrendingUp
                  size={20}
                  style={{ color: "var(--color-success)" }}
                />
              </div>
              <h3
                className="mb-1 fw-bold"
                style={{ color: "var(--color-primary-1)" }}
              >
                {stats.isLoading ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  stats.totalProjects
                )}
              </h3>
              <p className="mb-0 small" style={{ color: "var(--muted)" }}>
                Total Projects
              </p>
            </div>
          </div>
        </div>

        {/* Active Projects Card */}
        <div className="col-md-6 col-lg-3">
          <div
            className="card border-0"
            style={{
              boxShadow: "var(--shadow)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="rounded p-3"
                  style={{
                    backgroundColor: "rgba(36, 161, 72, 0.1)",
                  }}
                >
                  <Activity
                    size={24}
                    style={{ color: "var(--color-success)" }}
                  />
                </div>
                <span
                  className="badge"
                  style={{
                    backgroundColor: "rgba(36, 161, 72, 0.1)",
                    color: "var(--color-success)",
                    padding: "0.35rem 0.65rem",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  Active
                </span>
              </div>
              <h3
                className="mb-1 fw-bold"
                style={{ color: "var(--color-primary-1)" }}
              >
                {stats.isLoading ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  stats.activeProjects
                )}
              </h3>
              <p className="mb-0 small" style={{ color: "var(--muted)" }}>
                Active Projects
              </p>
            </div>
          </div>
        </div>

        {/* Total Employees Card */}
        <div className="col-md-6 col-lg-3">
          <div
            className="card border-0"
            style={{
              boxShadow: "var(--shadow)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="rounded p-3"
                  style={{
                    backgroundColor: "rgba(15, 98, 254, 0.1)",
                  }}
                >
                  <Users size={24} style={{ color: "var(--color-accent-5)" }} />
                </div>
                <TrendingUp
                  size={20}
                  style={{ color: "var(--color-accent-5)" }}
                />
              </div>
              <h3
                className="mb-1 fw-bold"
                style={{ color: "var(--color-primary-1)" }}
              >
                {stats.isLoading ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  stats.totalEmployees
                )}
              </h3>
              <p className="mb-0 small" style={{ color: "var(--muted)" }}>
                Total Employees
              </p>
            </div>
          </div>
        </div>

        {/* Managed Projects Card */}
        <div className="col-md-6 col-lg-3">
          <div
            className="card border-0"
            style={{
              boxShadow: "var(--shadow)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="rounded p-3"
                  style={{
                    backgroundColor: "rgba(151, 36, 126, 0.1)",
                  }}
                >
                  <UserCog
                    size={24}
                    style={{ color: "var(--color-accent-1)" }}
                  />
                </div>
                <TrendingUp
                  size={20}
                  style={{ color: "var(--color-success)" }}
                />
              </div>
              <h3
                className="mb-1 fw-bold"
                style={{ color: "var(--color-primary-1)" }}
              >
                {stats.isLoading ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  stats.projectsWithManagers
                )}
              </h3>
              <p className="mb-0 small" style={{ color: "var(--muted)" }}>
                Managed Projects
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Card */}
      <div
        className="card border-0 flex-grow-1"
        style={{
          boxShadow: "var(--shadow)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="card-body d-flex flex-column align-items-center justify-content-center text-center p-5">
          <FolderKanban
            size={64}
            className="mb-3"
            style={{
              color: "var(--color-primary-3)",
              opacity: 0.5,
            }}
          />
          <h4
            className="fw-bold mb-2"
            style={{ color: "var(--color-primary-1)" }}
          >
            Project Management
          </h4>
          <p className="mb-4 " style={{ color: "var(--muted)" }}>
            Create new projects, assign managers, map employees, and manage all
            project activities
          </p>
          <div className="d-flex gap-3 flex-wrap justify-content-center">
            <button
              className="btn btn-lg d-flex align-items-center gap-2"
              onClick={() => navigate("/hr/dashboard/projectmgmt/create")}
              style={{
                background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                border: "none",
                color: "white",
                borderRadius: "9px",
                padding: "0.6rem 1.2rem",
                fontWeight: "600",
                boxShadow: "var(--shadow)",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <FolderPlus size={20} />
              Create New Project
            </button>
            <button
              className="btn btn-lg d-flex align-items-center gap-2"
              onClick={() => navigate("/hr/dashboard/projectmgmt/list")}
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--border)",
                color: "var(--color-primary-3)",
                borderRadius: "var(--radius-md)",
                padding: "0.6rem 1.2rem",
                fontWeight: "600",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-primary-5)";
                e.currentTarget.style.borderColor = "var(--color-primary-3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
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
