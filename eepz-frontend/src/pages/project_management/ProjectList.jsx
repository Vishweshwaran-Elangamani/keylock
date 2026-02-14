import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {FolderKanban, Edit, Trash2, UserCog, Users, Calendar, Building, Briefcase, AlertCircle, Home,}
from "lucide-react";
import { toast } from "sonner";
import projectService from "../../services/project_management/projectService";
import ProjectListFilterBar from "./ProjectListFilterBar";
import "../../styles/projectmanagement/components/ProjectList.css";
import EditProjectModal from "../../components/project-management/modals/EditProjectModal";
import ManagerSelectionModal from "../../components/project-management/modals/ManagerSelectionModal";
import EmployeeMappingModal from "../../components/project-management/modals/EmployeeMappingModal";
import DeleteConfirmationModal from "../../components/project-management/modals/DeleteConfirmationModal";
import PaginationFooter from "../../components/project-management/common/PaginationFooter";
 
const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState(null);
  const [isLoadingModalData, setIsLoadingModalData] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [selectedResourceOwner, setSelectedResourceOwner] = useState(null);
  const [selectedL1Approver, setSelectedL1Approver] = useState(null);
  const [selectedL2Approver, setSelectedL2Approver] = useState(null);
  const [managerSearchTerm, setManagerSearchTerm] = useState("");
  const [activeManagerSearchTerm, setActiveManagerSearchTerm] = useState("");
  const [managerFilterRole, setManagerFilterRole] = useState("All");
  const [managerFilterDepartment, setManagerFilterDepartment] = useState("All");
  const [activeManagerTab, setActiveManagerTab] = useState("resource");
  const [mappedEmployees, setMappedEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [primaryEmployeeIds, setPrimaryEmployeeIds] = useState([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [activeEmployeeSearchTerm, setActiveEmployeeSearchTerm] = useState("");
  const [employeeFilterRole, setEmployeeFilterRole] = useState("All");
  const [employeeFilterDepartment, setEmployeeFilterDepartment] = useState("All");
  const [employeeFilterStatus, setEmployeeFilterStatus] = useState("All");
  const [managerCurrentPage, setManagerCurrentPage] = useState(1);
  const [managerItemsPerPage, setManagerItemsPerPage] = useState(10);
  const pageSizeOptions = useMemo(() => [5, 10, 25, 50], []);
 
  useEffect(() => {
    fetchProjects();
    fetchStaticDropdownData();
  }, []);
 
  useEffect(() => {
    filterProjectsList();
  }, [activeSearchTerm, filterStatus, projects]);
 
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchTerm, filterStatus]);
 
  useEffect(() => {
    setManagerCurrentPage(1);
  }, [activeManagerSearchTerm, managerFilterRole, managerFilterDepartment]);
 
  const fetchStaticDropdownData = async () => {
    try {
      const [employeesRes, deptRes, buRes] = await Promise.all([
        projectService.getAllEmployees(),
        projectService.getAllDepartments(),
        projectService.getAllBusinessUnits(),
      ]);
 
      if (employeesRes.success && employeesRes.data) {
        setAllEmployees(employeesRes.data);
      }
      if (deptRes.success) setDepartments(deptRes.data || []);
      if (buRes.success) setBusinessUnits(buRes.data || []);
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      toast.error("Failed to load dropdown data");
    }
  };
 
  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await projectService.getAllProjects();
      if (response.success && response.data) {
        setProjects(response.data);
      } else {
        setError("Failed to load projects");
        toast.error("Failed to load projects");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please try again.");
      toast.error("Failed to load projects. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
 
  const filterProjectsList = () => {
    let filtered = [...projects];
    if (activeSearchTerm) {
      const term = activeSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (project) => project.projectName?.toLowerCase().includes(term) ||
          project.department?.toLowerCase().includes(term) ||
          project.businessUnit?.toLowerCase().includes(term)
      );
    }
    if (filterStatus !== "All") {
      filtered = filtered.filter((project) => project.status === filterStatus);
    }
    setFilteredProjects(filtered);
  };
 
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    setActiveSearchTerm(searchTerm.trim());
    setCurrentPage(1);
  };
 
  const handleCancelSearch = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setCurrentPage(1);
  };
 
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };
 
  const getFilteredManagers = () => {
    return allEmployees.filter((emp) => {
      const searchMatch =activeManagerSearchTerm === "" ||
        `${emp.firstName} ${emp.lastName} ${emp.roleName} ${emp.departmentName}`
          .toLowerCase() .includes(activeManagerSearchTerm.toLowerCase());
      const roleMatch = managerFilterRole === "All" || emp.roleName === managerFilterRole;
      const deptMatch =
        managerFilterDepartment === "All" || emp.departmentName === managerFilterDepartment;
      return searchMatch && roleMatch && deptMatch;
    });
  };
 
  const getUniqueManagerRoles = () => {
    const roles = [...new Set(allEmployees.map((emp) => emp.roleName))];
    return roles.sort();
  };
 
  const getUniqueManagerDepartments = () => {
    const depts = [...new Set(allEmployees.map((emp) => emp.departmentName))];
    return depts.sort();
  };
 
  const filteredManagers = getFilteredManagers();
  const managerTotalPages = Math.ceil(filteredManagers.length / managerItemsPerPage) || 1;
  const managerStartIndex = (managerCurrentPage - 1) * managerItemsPerPage;
  const managerEndIndex = managerStartIndex + managerItemsPerPage;
  const paginatedManagers = filteredManagers.slice(managerStartIndex, managerEndIndex);
 
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
        for (let i = managerTotalPages - 3; i <= managerTotalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = managerCurrentPage - 1; i <= managerCurrentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(managerTotalPages);
      }
    }
    return pages;
  };
 
  const getProjectManagerIds = () => {
    if (!selectedProject) return [];
    const managerIds = [];
    if (selectedProject.resourceOwner?.employeeMasterId) {
      managerIds.push(selectedProject.resourceOwner.employeeMasterId);
    }
    if (selectedProject.l1Approver?.employeeMasterId) {
      managerIds.push(selectedProject.l1Approver.employeeMasterId);
    }
    if (selectedProject.l2Approver?.employeeMasterId) {
      managerIds.push(selectedProject.l2Approver.employeeMasterId);
    }
    return managerIds;
  };
 
  const getFilteredEmployees = () => {
    const managerIds = getProjectManagerIds();
    return allEmployees.filter((emp) => {
      if (managerIds.includes(emp.employeeMasterId)) return false;
      const isMapped = mappedEmployees.some((m) => m.employeeMasterId === emp.employeeMasterId);
      const searchMatch = activeEmployeeSearchTerm === "" ||
        `${emp.firstName} ${emp.lastName} ${emp.roleName} ${emp.departmentName}`.toLowerCase()
          .includes(activeEmployeeSearchTerm.toLowerCase());
      const roleMatch = employeeFilterRole === "All" || emp.roleName === employeeFilterRole;
      const deptMatch = employeeFilterDepartment === "All" || emp.departmentName === employeeFilterDepartment;
      const statusMatch =  employeeFilterStatus === "All" ||
        (employeeFilterStatus === "Mapped" && isMapped) ||
        (employeeFilterStatus === "Unmapped" && !isMapped);
 
      return searchMatch && roleMatch && deptMatch && statusMatch;
    });
  };
 
  const getUniqueRoles = () => {
    const managerIds = getProjectManagerIds();
    const availableEmployees = allEmployees.filter((emp) => !managerIds.includes(emp.employeeMasterId));
    const roles = [...new Set(availableEmployees.map((emp) => emp.roleName))];
    return roles.sort();
  };
 
  const getUniqueDepartments = () => {
    const managerIds = getProjectManagerIds();
    const availableEmployees = allEmployees.filter((emp) => !managerIds.includes(emp.employeeMasterId));
    const depts = [...new Set(availableEmployees.map((emp) => emp.departmentName))];
    return depts.sort();
  };
 
  const filteredEmployees = getFilteredEmployees();
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);
  const handleViewClick = (projectId) => {
    navigate(`/hr/dashboard/projectmgmt/view/${projectId}`);
  };
 
  const handleEditClick = (project) => {
    setSelectedProject(project);
    setEditFormData({
      projectId: project.projectId,  projectName: project.projectName || "",
      description: project.description || "",  businessUnit: project.businessUnit || "",
      department: project.department || "", engagementModel: project.engagementModel || "",
      status: project.status || "Active",
      startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
      endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
    });
    setShowEditModal(true);
    setModalMessage(null);
  };
 
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalMessage(null);
 
    try {
      const projectData = {
        ...editFormData, startDate: new Date(editFormData.startDate).toISOString(),
        endDate: editFormData.endDate ? new Date(editFormData.endDate).toISOString() : null,
      };
 
      const response = await projectService.updateProject(editFormData.projectId, projectData);
      if (response.success) {
        setModalMessage({ type: "success", text: "Project updated successfully!" });
        toast.success("Project updated successfully!");
        setTimeout(() => {
          setShowEditModal(false);
          fetchProjects();
        }, 1500);
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to update project";
      setModalMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const handleManagerClick = (project) => {
    setSelectedProject(project);
    setSelectedResourceOwner(project.resourceOwner || null);
    setSelectedL1Approver(project.l1Approver || null);
    setSelectedL2Approver(project.l2Approver || null);
    setActiveManagerTab("resource");
    setManagerSearchTerm("");
    setActiveManagerSearchTerm("");
    setManagerFilterRole("All");
    setManagerFilterDepartment("All");
    setManagerCurrentPage(1);
    setShowManagerModal(true);
    setModalMessage(null);
  };
 
  const handleManagerSelect = (employee) => {
    if (activeManagerTab === "resource") {
      setSelectedResourceOwner((prev) =>
        prev?.employeeMasterId === employee.employeeMasterId ? null : employee
      );
    } else if (activeManagerTab === "l1") {
      setSelectedL1Approver((prev) =>
        prev?.employeeMasterId === employee.employeeMasterId ? null : employee
      );
    } else if (activeManagerTab === "l2") {
      setSelectedL2Approver((prev) =>
        prev?.employeeMasterId === employee.employeeMasterId ? null : employee
      );
    }
  };
 
  const handleUpdateManagers = async () => {
    setIsSubmitting(true);
    setModalMessage(null);
 
    try {
      const managersData = {
        projectId: selectedProject.projectId,
        resourceOwnerEmployeeId: selectedResourceOwner?.employeeMasterId || null,
        l1ApproverEmployeeId: selectedL1Approver?.employeeMasterId || null,
        l2ApproverEmployeeId: selectedL2Approver?.employeeMasterId || null,
      };
 
      const response = await projectService.updateReportingManagers(selectedProject.projectId, managersData);
      if (response.success) {
        setModalMessage({ type: "success", text: "Reporting managers updated successfully!" });
        toast.success("Reporting managers updated successfully!");
        setTimeout(() => {
          setShowManagerModal(false);
          fetchProjects();
        }, 1500);
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to update managers";
      setModalMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const handleEmployeeClick = async (project) => {
    setSelectedProject(project);
    setSelectedEmployeeIds([]);
    setPrimaryEmployeeIds([]);
    setEmployeeSearchTerm("");
    setActiveEmployeeSearchTerm("");
    setEmployeeFilterRole("All");
    setEmployeeFilterDepartment("All");
    setEmployeeFilterStatus("All");
    setShowEmployeeModal(true);
    setModalMessage(null);
    setIsLoadingModalData(true);
 
    try {
      const projectResponse = await projectService.getProjectById(project.projectId);
      if (projectResponse.success && projectResponse.data) {
        setMappedEmployees(projectResponse.data.mappedEmployees || []);
        const primaryEmps =  projectResponse.data.mappedEmployees  ?.filter((emp) => emp.isPrimary)
            .map((emp) => emp.employeeMasterId) || [];
        setPrimaryEmployeeIds(primaryEmps);
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
      const errorMessage = "Failed to load employee data";
      setModalMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoadingModalData(false);
    }
  };
 
  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployeeIds((prev) => {
      if (prev.includes(employeeId)) {
        if (primaryEmployeeIds.includes(employeeId)) {
          setPrimaryEmployeeIds((prevPrimary) => prevPrimary.filter((id) => id !== employeeId));
        }
        return prev.filter((id) => id !== employeeId);
      }
      return [...prev, employeeId];
    });
  };
 
  const handlePrimaryToggle = (employeeId) => {
    if (!selectedEmployeeIds.includes(employeeId)) {
      const errorMessage = "Please select the employee first before marking as primary";
      setModalMessage({ type: "error", text: errorMessage });
      toast.warning(errorMessage);
      setTimeout(() => setModalMessage(null), 3000);
      return;
    }
    setPrimaryEmployeeIds((prev) => {
      if (prev.includes(employeeId)) return prev.filter((id) => id !== employeeId);
      return [...prev, employeeId];
    });
  };
 
  const handleSelectAllEmployees = () => {
    const visibleEmployees = filteredEmployees;
    const allVisible = visibleEmployees.every((emp) => selectedEmployeeIds.includes(emp.employeeMasterId));
 
    if (allVisible && visibleEmployees.length > 0) {
      const idsToRemove = visibleEmployees.map((emp) => emp.employeeMasterId);
      setSelectedEmployeeIds((prev) => prev.filter((id) => !idsToRemove.includes(id)));
      setPrimaryEmployeeIds((prev) => prev.filter((id) => !idsToRemove.includes(id)));
    } else {
      const newIds = visibleEmployees.map((emp) => emp.employeeMasterId);
      setSelectedEmployeeIds((prev) => [...new Set([...prev, ...newIds])]);
    }
  };
 
  const handleMapEmployees = async () => {
    const employeesToMap = selectedEmployeeIds.filter(
      (id) => !mappedEmployees.some((m) => m.employeeMasterId === id)
    );
 
    if (employeesToMap.length === 0) {
      const errorMessage = "Please select at least one unmapped employee";
      setModalMessage({ type: "error", text: errorMessage });
      toast.warning(errorMessage);
      setTimeout(() => setModalMessage(null), 3000);
      return;
    }
 
    setIsSubmitting(true);
    setModalMessage(null);
 
    try {
      const employeesWithPrimary = employeesToMap.map((employeeId) => ({
        employeeId, isPrimary: primaryEmployeeIds.includes(employeeId),
      }));
 
      const response = await projectService.mapEmployees(selectedProject.projectId, employeesWithPrimary);
      if (response.success) {
        const primaryCount = employeesWithPrimary.filter((e) => e.isPrimary).length;
        const successMessage = `${employeesToMap.length} employee(s) mapped successfully!${
          primaryCount > 0 ? ` (${primaryCount} marked as primary)` : ""
        }`;
 
        setModalMessage({ type: "success", text: successMessage });
        toast.success(successMessage);
        setSelectedEmployeeIds([]);
        setPrimaryEmployeeIds([]);
 
        setTimeout(async () => {
          const projectResponse = await projectService.getProjectById(selectedProject.projectId);
          if (projectResponse.success && projectResponse.data) {
            setMappedEmployees(projectResponse.data.mappedEmployees || []);
            const primaryEmps = projectResponse.data.mappedEmployees   ?.filter((emp) => emp.isPrimary)
                .map((emp) => emp.employeeMasterId) || [];
            setPrimaryEmployeeIds(primaryEmps);
          }
          fetchProjects();
          setModalMessage(null);
        }, 1500);
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to map employees";
      setModalMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const handleUnmapEmployees = async () => {
    const employeesToUnmap = selectedEmployeeIds.filter((id) => mappedEmployees.some((m) => m.employeeMasterId === id)
    );
    if (employeesToUnmap.length === 0) {
      const errorMessage = "Please select at least one mapped employee";
      setModalMessage({ type: "error", text: errorMessage });
      toast.warning(errorMessage);
      setTimeout(() => setModalMessage(null), 3000);
      return;
    }
 
    setIsSubmitting(true);
    setModalMessage(null);
 
    try {
      const response = await projectService.unmapEmployees(selectedProject.projectId, employeesToUnmap);
      if (response.success) {
        const successMessage = `${employeesToUnmap.length} employee(s) unmapped successfully!`;
        setModalMessage({ type: "success", text: successMessage });
        toast.success(successMessage);
        setSelectedEmployeeIds([]);
        setPrimaryEmployeeIds((prev) => prev.filter((id) => !employeesToUnmap.includes(id)));
 
        setTimeout(async () => {
          const projectResponse = await projectService.getProjectById(selectedProject.projectId);
          if (projectResponse.success && projectResponse.data) {
            setMappedEmployees(projectResponse.data.mappedEmployees || []);
            const primaryEmps =
              projectResponse.data.mappedEmployees
                ?.filter((emp) => emp.isPrimary)
                .map((emp) => emp.employeeMasterId) || [];
            setPrimaryEmployeeIds(primaryEmps);
          }
          fetchProjects();
          setModalMessage(null);
        }, 1500);
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to unmap employees";
      setModalMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };
 
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeletingProject(true);
    try {
      const response = await projectService.deleteProject(projectToDelete.projectId);
      if (response.success) {
        toast.success("Project deleted successfully!");
        setShowDeleteModal(false);
        setProjectToDelete(null);
        fetchProjects();
      } else {
        const errorMessage = response.message || "Failed to delete project";
        toast.error(errorMessage, { duration: 5000 });
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      const errorMessage =
        error.message || error.response?.data?.message || "Failed to delete project. Please try again.";
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsDeletingProject(false);
    }
  };
 
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };
 
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",  month: "short",  day: "numeric",
    });
  };
 
  const hasSelectedMappedEmployees = () => {
    return selectedEmployeeIds.some((id) => mappedEmployees.some((m) => m.employeeMasterId === id));
  };
 
  const hasSelectedUnmappedEmployees = () => {
    return selectedEmployeeIds.some((id) => !mappedEmployees.some((m) => m.employeeMasterId === id));
  };
 
  const getMappedCount = () => {
    return selectedEmployeeIds.filter((id) => mappedEmployees.some((m) => m.employeeMasterId === id)).length;
  };
 
  const getUnmappedCount = () => {
    return selectedEmployeeIds.filter((id) => !mappedEmployees.some((m) => m.employeeMasterId === id)).length;
  };
 
  return (
    <div className="prj-list-wrapper">
      <nav aria-label="breadcrumb" className="prj-list-breadcrumb-nav">
        <ol className="prj-list-breadcrumb breadcrumb">
          <li className="breadcrumb-item prj-list-breadcrumb-item">
            <button type="button" onClick={() => navigate("/hr/dashboard/projectmgmt")}
              className="prj-list-breadcrumb-link">
              <Home size={18} className="prj-list-breadcrumb-icon" />
              <span>Dashboard</span>
            </button>
          </li>
          <li className="breadcrumb-item active prj-list-breadcrumb-item" aria-current="page">
            <span className="prj-list-breadcrumb-active">All Projects</span>
          </li>
        </ol>
      </nav>
 
      <ProjectListFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeSearchTerm={activeSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onSearch={handleSearch}
        onCancelSearch={handleCancelSearch}
        onSearchKeyPress={handleSearchKeyPress}
        onNavigateResourcePool={() => navigate("/hr/dashboard/projectmgmt/resourcepool")}
        onNavigateCreateProject={() => navigate("/hr/dashboard/projectmgmt/create")}/>
 
      {isLoading && (
        <div className="prj-list-loading-container">
          <div className="prj-list-loading-inner">
            <div className="prj-list-loading-spinner">
              <span className="prj-detail-visually-hidden">Loading...</span>
            </div>
            <p className="prj-list-loading-text">Loading projects...</p>
          </div>
        </div>
      )}
 
      {error && !isLoading && (
        <div className="prj-list-alert prj-list-alert-danger">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
 
      {!isLoading && !error && (
        <div className="prj-list-table-wrapper">
          <table className="prj-list-table">
            <thead className="prj-list-table-header">
              <tr>
                <th>Project Name</th>
                <th>Status</th>
                <th>Business Unit</th>
                <th>Department</th>
                <th>Start Date</th>
                <th>Resource Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
 
            <tbody>
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="prj-list-empty-state">
                      <FolderKanban size={64} className="prj-list-empty-icon" />
                      <p className="prj-list-empty-title">No projects found</p>
                      <p className="prj-list-empty-subtitle">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((project) => (
                  <tr key={project.projectId}>
                    <td>
                      <div className="prj-list-project-cell">
                        <div
                          className="prj-list-project-name"
                          onClick={() => handleViewClick(project.projectId)}>
                          {project.projectName}
                        </div>
                      </div>
                    </td>
 
                    <td>
                      <span
                        className={`prj-list-badge prj-list-badge-${project.status
                          .toLowerCase()
                          .replace(" ", "-")}`}>
                        {project.status}
                      </span>
                    </td>
 
                    <td>
                      <div className="prj-list-cell-with-icon">
                        <div className="prj-list-icon-wrapper prj-list-icon-business">
                          <Building size={16} className="prj-list-icon-filled" />
                        </div>
                        <div className="prj-list-cell-text">{project.businessUnit || "N/A"}</div>
                      </div>
                    </td>
 
                    <td>
                      <div className="prj-list-cell-with-icon">
                        <div className="prj-list-icon-wrapper prj-list-icon-department">
                          <Briefcase size={16} className="prj-list-icon-filled" />
                        </div>
                        <div className="prj-list-cell-text">{project.department || "N/A"}</div>
                      </div>
                    </td>
 
                    <td>
                      <div className="prj-list-cell-with-icon">
                        <div className="prj-list-icon-wrapper prj-list-icon-calendar">
                          <Calendar size={16} className="prj-list-icon-filled" />
                        </div>
                        <div className="prj-list-cell-text">{formatDate(project.startDate)}</div>
                      </div>
                    </td>
 
                    <td>
                      {project.resourceOwner ? (
                        <div className="prj-list-resource-owner">
                          <div className="prj-list-owner-name">
                            {project.resourceOwner.firstName} {project.resourceOwner.lastName}
                          </div>
                          <span className="prj-list-owner-role">{project.resourceOwner.roleName}</span>
                        </div>
                      ) : (
                        <span className="prj-list-not-assigned">Not Assigned</span>
                      )}
                    </td>
 
                    <td>
                      <div className="prj-list-actions-cell">
                        <button
                          className="prj-list-action-btn prj-list-btn-edit"
                          type="button"
                          onClick={() => handleEditClick(project)}
                          title="Edit Project">
                          <Edit size={14} />
                        </button>
 
                        <button
                          className="prj-list-action-btn prj-list-btn-manager"
                          type="button"
                          onClick={() => handleManagerClick(project)}
                          title="Edit Managers" >
                          <UserCog size={14} />
                        </button>
 
                        <button
                          className="prj-list-action-btn prj-list-btn-employee"
                          type="button"
                          onClick={() => handleEmployeeClick(project)}
                          title="Map/Unmap Employees" >
                          <Users size={14} />
                        </button>
 
                        <button
                          className="prj-list-action-btn prj-list-btn-delete"
                          type="button"
                          onClick={() => handleDeleteClick(project)}
                          title="Delete Project">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
 
      <PaginationFooter
           totalItems={filteredProjects.length}
           currentPage={currentPage}
           setCurrentPage={setCurrentPage}
           itemsPerPage={itemsPerPage}
           setItemsPerPage={(size) => {
           setItemsPerPage(size);
           setCurrentPage(1);
            }}/>
         </div>
       )}
 
      <EditProjectModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        project={selectedProject}
        formData={editFormData}
        setFormData={setEditFormData}
        onSubmit={handleUpdateProject}
        isSubmitting={isSubmitting}
        message={modalMessage}
        departments={departments}
        businessUnits={businessUnits}/>
 
      <ManagerSelectionModal
        show={showManagerModal}
        onClose={() => setShowManagerModal(false)}
        project={selectedProject}
        selectedResourceOwner={selectedResourceOwner}
        selectedL1Approver={selectedL1Approver}
        selectedL2Approver={selectedL2Approver}
        onManagerSelect={handleManagerSelect}
        activeTab={activeManagerTab}
        setActiveTab={setActiveManagerTab}
        searchTerm={managerSearchTerm}
        setSearchTerm={setManagerSearchTerm}
        activeSearchTerm={activeManagerSearchTerm}
        setActiveSearchTerm={setActiveManagerSearchTerm}
        filterRole={managerFilterRole}
        setFilterRole={setManagerFilterRole}
        filterDepartment={managerFilterDepartment}
        setFilterDepartment={setManagerFilterDepartment}
        paginatedManagers={paginatedManagers}
        currentPage={managerCurrentPage}
        totalPages={managerTotalPages}
        goToPage={goToManagerPage}
        getPageNumbers={getManagerPageNumbers}
        uniqueRoles={getUniqueManagerRoles()}
        uniqueDepartments={getUniqueManagerDepartments()}
        onUpdate={handleUpdateManagers}
        isSubmitting={isSubmitting}
        message={modalMessage}
        itemsPerPage={managerItemsPerPage}
        onPageSizeChange={(size) => {
          setManagerItemsPerPage(size);
          setManagerCurrentPage(1);
        }}
        totalItems={filteredManagers.length}/>
 
      <EmployeeMappingModal
        show={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        project={selectedProject}
        filteredEmployees={filteredEmployees}
        mappedEmployees={mappedEmployees}
        selectedEmployeeIds={selectedEmployeeIds}
        primaryEmployeeIds={primaryEmployeeIds}
        onEmployeeSelect={handleEmployeeSelect}
        onPrimaryToggle={handlePrimaryToggle}
        onSelectAll={handleSelectAllEmployees}
        onMap={handleMapEmployees}
        onUnmap={handleUnmapEmployees}
        isSubmitting={isSubmitting}
        message={modalMessage}
        isLoadingData={isLoadingModalData}
        searchTerm={employeeSearchTerm}
        setSearchTerm={setEmployeeSearchTerm}
        activeSearchTerm={activeEmployeeSearchTerm}
        setActiveSearchTerm={setActiveEmployeeSearchTerm}
        filterRole={employeeFilterRole}
        setFilterRole={setEmployeeFilterRole}
        filterDepartment={employeeFilterDepartment}
        setFilterDepartment={setEmployeeFilterDepartment}
        filterStatus={employeeFilterStatus}
        setFilterStatus={setEmployeeFilterStatus}
        uniqueRoles={getUniqueRoles()}
        uniqueDepartments={getUniqueDepartments()}
        getMappedCount={getMappedCount}
        getUnmappedCount={getUnmappedCount}
        hasSelectedMapped={hasSelectedMappedEmployees}
        hasSelectedUnmapped={hasSelectedUnmappedEmployees}/>
 
      <DeleteConfirmationModal
        show={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        project={projectToDelete}
        isDeleting={isDeletingProject} />
    </div>
  );
};
 
export default ProjectList;
 
 