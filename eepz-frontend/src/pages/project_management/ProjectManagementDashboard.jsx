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
      {/* Statistics Cards */}
      <div className="row g-4 mb-4">
        {/* Total Projects Card */}
        <div className="col-md-6 col-lg-3">
          <div
            className="card border-2"
            style={{
              boxShadow: "var(--shadow)",
              borderRadius: "var(--radius-lg)",
              border: "2px solid #27235C",
            }}
          >
            <div className="card-body">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded p-2"
                  style={{
                    backgroundColor: "rgba(82, 79, 125, 0.1)",
                    flexShrink: 0,
                  }}
                >
                  <FolderKanban
                    size={20}
                    style={{ color: "var(--color-primary-3)" }}
                  />
                </div>
                <div className="flex-grow-1">
                  <h3
                    className="mb-0 fw-bold"
                    style={{ color: "var(--color-primary-1)", fontSize: "1.5rem" }}
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
          </div>
        </div>

        {/* Active Projects Card */}
        <div className="col-md-6 col-lg-3">
          <div
            className="card border-2"
            style={{
              boxShadow: "var(--shadow)",
              borderRadius: "var(--radius-lg)",
              border: "2px solid #27235C",
            }}
          >
            <div className="card-body">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded p-2"
                  style={{
                    backgroundColor: "rgba(36, 161, 72, 0.1)",
                    flexShrink: 0,
                  }}
                >
                  <Activity
                    size={20}
                    style={{ color: "var(--color-success)" }}
                  />
                </div>
                <div className="flex-grow-1">
                  <h3
                    className="mb-0 fw-bold"
                    style={{ color: "var(--color-primary-1)", fontSize: "1.5rem" }}
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
          </div>
        </div>

        {/* Total Employees Card */}
        <div className="col-md-6 col-lg-3">
          <div
            className="card border-2"
            style={{
              boxShadow: "var(--shadow)",
              borderRadius: "var(--radius-lg)",
              border: "2px solid #27235C",
            }}
          >
            <div className="card-body">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded p-2"
                  style={{
                    backgroundColor: "rgba(15, 98, 254, 0.1)",
                    flexShrink: 0,
                  }}
                >
                  <Users size={20} style={{ color: "var(--color-accent-5)" }} />
                </div>
                <div className="flex-grow-1">
                  <h3
                    className="mb-0 fw-bold"
                    style={{ color: "var(--color-primary-1)", fontSize: "1.5rem" }}
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
          </div>
        </div>

        {/* Managed Projects Card */}
        <div className="col-md-6 col-lg-3">
          <div
            className="card border-2"
            style={{
              boxShadow: "var(--shadow)",
              borderRadius: "var(--radius-lg)",
              border: "2px solid #27235C",
            }}
          >
            <div className="card-body">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded p-2"
                  style={{
                    backgroundColor: "rgba(151, 36, 126, 0.1)",
                    flexShrink: 0,
                  }}
                >
                  <UserCog
                    size={20}
                    style={{ color: "var(--color-accent-1)" }}
                  />
                </div>
                <div className="flex-grow-1">
                  <h3
                    className="mb-0 fw-bold"
                    style={{ color: "var(--color-primary-1)", fontSize: "1.5rem" }}
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
        </div>
      </div>

      {/* Main Action Card */}
      <div
        className="card border-0 flex-grow-1"
        style={{
          boxShadow: "var(--shadow)",
          borderRadius: "var(--radius-lg)",
          border: "2px solid #27235C",
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
          <p className="mb-4" style={{ color: "var(--muted)" }}>
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
                border: "2px solid #27235C",
                color: "var(--color-primary-3)",
                borderRadius: "var(--radius-md)",
                padding: "0.6rem 1.2rem",
                fontWeight: "600",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-primary-5)";
                e.currentTarget.style.borderColor = "#27235C";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "#27235C";
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
