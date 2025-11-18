import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import workloadService from "../../../../services/hr_operations/hr/workloadService";
import "../../../../styles/hr_operations/hr/workload.css";

const WorkloadDistribution = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View & Pagination States
  const [viewType, setViewType] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter States
  const [filters, setFilters] = useState({
    search: "",
    fairness: "all",
    department: "",
    manager: "",
  });

  // Filter Options
  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    managers: [],
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [projects, filters]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching all projects...");
      const response = await workloadService.getAllProjects();
      console.log("Projects received:", response);
      const data = response.data || [];
      setProjects(data);
      setFilteredProjects(data);
      generateFilterOptions(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.message || "Failed to fetch projects");
      showToast("Error", err.message || "Failed to fetch projects", "danger");
    } finally {
      setLoading(false);
    }
  };

  const generateFilterOptions = (data) => {
    const departments = [
      ...new Set(data.map((p) => p.teamName).filter(Boolean)),
    ].sort();
    const managers = [
      ...new Set(data.map((p) => p.reportingManagerName).filter(Boolean)),
    ].sort();

    setFilterOptions({
      departments,
      managers,
    });
  };

  const calculateFairness = (project) => {
    if (!project.workloadVariance && project.workloadVariance !== 0) {
      return "neutral";
    }

    const variance = parseFloat(project.workloadVariance);

    if (variance > 30) return "low";
    if (variance > 15) return "medium";
    return "high";
  };

  const applyFilters = () => {
    let filtered = projects;

    // Search filter
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter((p) => {
        const projectName = (p.teamName || "").toLowerCase();
        const managerName = (p.reportingManagerName || "").toLowerCase();
        return projectName.includes(query) || managerName.includes(query);
      });
    }

    // Fairness filter
    if (filters.fairness !== "all") {
      filtered = filtered.filter(
        (p) => calculateFairness(p) === filters.fairness
      );
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter((p) => p.teamName === filters.department);
    }

    // Manager filter
    if (filters.manager) {
      filtered = filtered.filter(
        (p) => p.reportingManagerName === filters.manager
      );
    }

    setFilteredProjects(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearchChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      search: e.target.value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      fairness: "all",
      department: "",
      manager: "",
    });
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredProjects.slice(startIndex, endIndex);

  const showToast = (title, message, type) => {
    const fullMessage = `${title}: ${message}`;

    switch (type) {
      case "success":
        toast.success(fullMessage);
        break;
      case "danger":
      case "error":
        toast.error(fullMessage);
        break;
      case "warning":
        toast.warning(fullMessage);
        break;
      case "info":
        toast.info(fullMessage);
        break;
      default:
        toast(fullMessage);
    }
  };

  const getFairnessStyle = (fairness) => {
    const styles = {
      high: {
        background: "#dcfce7",
        color: "#166534",
        icon: "bi-check-circle-fill",
      },
      medium: {
        background: "#fef3c7",
        color: "#92400e",
        icon: "bi-minus-circle-fill",
      },
      low: {
        background: "#fee2e2",
        color: "#991b1b",
        icon: "bi-exclamation-circle-fill",
      },
      neutral: {
        background: "#e5e7eb",
        color: "#374151",
        icon: "bi-question-circle-fill",
      },
    };
    return styles[fairness] || styles.neutral;
  };

  const getProgressColor = (fairness) => {
    const colors = {
      high: "#10b981",
      medium: "#f59e0b",
      low: "#ef4444",
      neutral: "#6b7280",
    };
    return colors[fairness] || colors.neutral;
  };

  return (
    <div className="coming-soon-container">
      <div className="coming-soon-icon">
        <i className="bi bi-briefcase"></i>
      </div>
      <h3 className="coming-soon-title">WorkLoad - Coming Soon</h3>
      <p className="coming-soon-subtitle">
        A smarter way to manage tasks, boost productivity, and simplify your
        workflow. Stay tuned for the launch!
      </p>
    </div>
  );
};

export default WorkloadDistribution;
