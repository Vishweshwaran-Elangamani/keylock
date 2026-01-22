import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Users,
  CheckCircle,
  AlertCircle,
  Search,
  Home,
  UserCheck,
  Plus,
  X,
  Info,
  Database,
  UserX,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import projectService from "../../services/project_management/projectService";
import "../../styles/projectmanagement/components/ResourcePoolMapping.css";

const RESOURCE_POOL_PROJECT_NAME = "ORG.RZ.RESOURCEPOOL";

const ResourcePoolMapping = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [allEmployees, setAllEmployees] = useState([]);
  const [resourcePoolMappedEmployees, setResourcePoolMappedEmployees] =
    useState([]);
  const [mappedEmployees, setMappedEmployees] = useState([]);
  const [resourcePoolProject, setResourcePoolProject] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [recentlyMappedIds, setRecentlyMappedIds] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);
    setRecentlyMappedIds([]);
    try {
      const employeesResponse = await projectService.getInitialStageEmployees();
      if (employeesResponse.success && employeesResponse.data) {
        const filteredEmployees = employeesResponse.data.filter(
          (emp) => emp.roleName?.toLowerCase() === "employee"
        );
        setAllEmployees(filteredEmployees);
      } else {
        throw new Error(
          employeesResponse?.message || "Failed to load employees"
        );
      }
      const projectsResponse = await projectService.getAllProjects();
      if (projectsResponse.success && projectsResponse.data) {
        const allMapped = [];
        let resourcePoolProj = null;
        projectsResponse.data.forEach((project) => {
          if (
            project.projectName &&
            project.projectName.toUpperCase() ===
              RESOURCE_POOL_PROJECT_NAME.toUpperCase()
          ) {
            resourcePoolProj = project;
          }
          if (Array.isArray(project.mappedEmployees)) {
            project.mappedEmployees.forEach((emp) => {
              if (emp.roleName?.toLowerCase() === "employee") {
                if (
                  !allMapped.some(
                    (m) => m.employeeMasterId === emp.employeeMasterId
                  )
                ) {
                  allMapped.push(emp);
                }
              }
            });
          }
        });
        setMappedEmployees(allMapped);
        if (resourcePoolProj && resourcePoolProj.projectId) {
          try {
            const resourcePoolDetails = await projectService.getProjectById(
              resourcePoolProj.projectId
            );
            if (resourcePoolDetails.success && resourcePoolDetails.data) {
              setResourcePoolProject(resourcePoolDetails.data);
              if (Array.isArray(resourcePoolDetails.data.mappedEmployees)) {
                const rpMapped =
                  resourcePoolDetails.data.mappedEmployees.filter(
                    (emp) => emp.roleName?.toLowerCase() === "employee"
                  );
                setResourcePoolMappedEmployees(rpMapped);
              } else {
                setResourcePoolMappedEmployees([]);
              }
            }
          } catch (err) {
            console.error("Failed to fetch Resource Pool details:", err);
            setResourcePoolMappedEmployees([]);
          }
        } else {
          setResourcePoolProject(null);
          setResourcePoolMappedEmployees([]);
        }
      } else {
        setMappedEmployees([]);
        setResourcePoolMappedEmployees([]);
        setResourcePoolProject(null);
      }
    } catch (err) {
      console.error("Error in fetchInitialData:", err);
      setError(err.message || "Failed to load data. Please try again.");
      toast.error(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    setActiveSearchTerm(searchTerm.trim());
  };
  const handleCancelSearch = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
  };
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const isEmployeeSelected = (empId) =>
    selectedEmployees.some((emp) => emp.employeeMasterId === empId);
  const isEmployeeInResourcePool = (empId) => {
    return resourcePoolMappedEmployees.some(
      (emp) => emp.employeeMasterId === empId
    );
  };

  const isEmployeeMappedToAny = (empId) =>
    mappedEmployees.some((emp) => emp.employeeMasterId === empId);

  const isRecentlyMapped = (empId) => recentlyMappedIds.includes(empId);

  const getEmployeeStatus = (empId) => {
    if (isRecentlyMapped(empId) || isEmployeeInResourcePool(empId)) {
      return {
        text: "In Resource Pool",
        badge: "rp-badge-secondary",
        icon: CheckCircle,
      };
    }
    if (isEmployeeMappedToAny(empId)) {
      return {
        text: "Mapped to Project",
        badge: "rp-badge-warning",
        icon: AlertCircle,
      };
    }
    return {
      text: "Available",
      badge: "rp-badge-success",
      icon: Check,
    };
  };

  const filteredEmployees = (
    activeSearchTerm
      ? allEmployees.filter((emp) =>
          `${emp.firstName} ${emp.lastName} 
  ${emp.roleName} ${emp.departmentName} ${emp.employeeCompanyId}`
            .toLowerCase()
            .includes(activeSearchTerm.toLowerCase())
        )
      : allEmployees
  ).filter((emp) => {
    const inResourcePool = isEmployeeInResourcePool(emp.employeeMasterId);
    const recentlyMapped = isRecentlyMapped(emp.employeeMasterId);
    return !inResourcePool && !recentlyMapped;
  });

  const availableCount = filteredEmployees.filter(
    (emp) => getEmployeeStatus(emp.employeeMasterId).text === "Available"
  ).length;

  const handleAddEmployee = (employee) => {
    if (isEmployeeInResourcePool(employee.employeeMasterId)) {
      toast.warning(
        `${employee.firstName} ${employee.lastName} is already mapped to Resource Pool`,
        { duration: 3000 }
      );
      return;
    }

    const status = getEmployeeStatus(employee.employeeMasterId);
    if (
      status.text === "Available" &&
      !isEmployeeSelected(employee.employeeMasterId)
    ) {
      setSelectedEmployees((prev) => [...prev, employee]);
      toast.success(
        `${employee.firstName} ${employee.lastName} added to selection`
      );
    } else if (status.text === "Mapped to Project") {
      toast.warning(
        `${employee.firstName} ${employee.lastName} is already mapped to another project. They will be moved to Resource Pool.`,
        { duration: 4000 }
      );
      setSelectedEmployees((prev) => [...prev, employee]);
    } else {
      toast.warning(
        `${employee.firstName} ${employee.lastName} is unavailable for mapping`
      );
    }
  };

  const handleRemoveEmployee = (empId) => {
    setSelectedEmployees((prev) =>
      prev.filter((emp) => emp.employeeMasterId !== empId)
    );
    toast.info("Employee removed from selection");
  };

  const handleSelectAll = () => {
    const canAdd = filteredEmployees.filter(
      (emp) =>
        getEmployeeStatus(emp.employeeMasterId).text === "Available" &&
        !isEmployeeInResourcePool(emp.employeeMasterId)
    );
    const addable = canAdd.filter(
      (emp) => !isEmployeeSelected(emp.employeeMasterId)
    );
    if (addable.length > 0) {
      setSelectedEmployees((prev) => [...prev, ...addable]);
      toast.success(`${addable.length} employees added to selection`);
    } else {
      toast.info("No available employees to select");
    }
  };

  const handleClearAll = () => {
    if (selectedEmployees.length > 0) {
      setShowClearModal(true);
    }
  };

  const confirmClearAll = () => {
    setSelectedEmployees([]);
    setShowClearModal(false);
    toast.info("All selections cleared");
  };

  const handleMapToResourcePool = () => {
    if (selectedEmployees.length === 0) {
      toast.error("Please select at least one employee to map");
      return;
    }

    const alreadyInPool = selectedEmployees.filter((emp) =>
      isEmployeeInResourcePool(emp.employeeMasterId)
    );

    if (alreadyInPool.length > 0) {
      const names = alreadyInPool
        .map((e) => `${e.firstName} ${e.lastName}`)
        .join(", ");
      toast.error(
        `Cannot map: ${names} ${
          alreadyInPool.length > 1 ? "are" : "is"
        } already in Resource Pool`,
        { duration: 4000 }
      );
      return;
    }

    setShowMapModal(true);
  };

  const confirmMapToResourcePool = async () => {
    const employeeIds = selectedEmployees.map((emp) => emp.employeeMasterId);

    setIsSubmitting(true);
    try {
      const response = await projectService.mapToResourcePool(employeeIds);
      if (response.success === false) {
        throw new Error(response.message || "Mapping failed");
      }
      setRecentlyMappedIds((prev) => [...new Set([...prev, ...employeeIds])]);

      const newlyMappedEmployees = selectedEmployees.map((emp) => ({
        ...emp,
        projectName: RESOURCE_POOL_PROJECT_NAME,
      }));

      setResourcePoolMappedEmployees((prev) => [
        ...prev,
        ...newlyMappedEmployees.filter(
          (ne) => !prev.some((p) => p.employeeMasterId === ne.employeeMasterId)
        ),
      ]);
      setMappedEmployees((prev) => [
        ...prev,
        ...newlyMappedEmployees.filter(
          (ne) => !prev.some((p) => p.employeeMasterId === ne.employeeMasterId)
        ),
      ]);
      setSelectedEmployees([]);
      setShowMapModal(false);
      toast.success(
        `Successfully mapped ${
          response.data?.mappedCount || employeeIds.length
        } employee(s) to Resource Pool`,
        { duration: 3000 }
      );
      await fetchInitialData();
    } catch (error) {
      console.error("Error mapping to resource pool:", error);
      setRecentlyMappedIds((prev) =>
        prev.filter((id) => !employeeIds.includes(id))
      );
      setResourcePoolMappedEmployees((prev) =>
        prev.filter((emp) => !employeeIds.includes(emp.employeeMasterId))
      );
      setMappedEmployees((prev) =>
        prev.filter((emp) => !employeeIds.includes(emp.employeeMasterId))
      );
      toast.error(error.message || "Failed to map employees to Resource Pool");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rp-wrapper rp-wrapper--center">
        <div className="rp-loading">
          <div className="rp-loading-spinner"></div>
          <p className="rp-loading-text">Loading Resource Pool data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-wrapper">
      <nav aria-label="breadcrumb" className="rp-breadcrumb-nav">
        <ol className="breadcrumb rp-breadcrumb">
          <li className="breadcrumb-item">
            <button
              type="button"
              className="rp-breadcrumb-link"
              onClick={() => navigate("/hr/dashboard/projectmgmt")}
              aria-label="Dashboard"
              title="Dashboard"
            >
              <Home size={18} />
            </button>
          </li>

          <li className="breadcrumb-item">
            <button
              type="button"
              className="rp-breadcrumb-link"
              onClick={() => navigate("/hr/dashboard/projectmgmt/list")}
            >
              Projects
            </button>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <span className="rp-breadcrumb-active">Resource Pool Mapping</span>
          </li>
        </ol>
      </nav>

      {resourcePoolProject && (
        <div className="rp-alert-info" role="alert">
          <Database size={20} className="rp-alert-icon" />
          <div className="rp-alert-content">
            <span className="rp-alert-title">Resource Pool:</span>{" "}
            <span>{resourcePoolProject.projectName}</span>{" "}
            {resourcePoolProject.l2Approver && (
              <span className="rp-alert-extra">
                <span className="rp-alert-title">L2 Manager:</span>{" "}
                {resourcePoolProject.l2Approver.firstName}{" "}
                {resourcePoolProject.l2Approver.lastName}
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rp-alert-error" role="alert">
          <AlertCircle size={20} />
          <div className="rp-alert-error-body">
            <span className="rp-alert-error-text">Error: {error}</span>
            <button
              type="button"
              className="rp-error-retry-btn"
              onClick={fetchInitialData}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="rp-main-layout">
        <div className="rp-col-left">
          <div className="rp-card rp-card-left">
            <div className="rp-card-header">
              <div className="rp-card-title">
                <Database size={20} />
                <span>Employees</span>
              </div>
              <button
                type="button"
                className="rp-btn rp-btn-select-all"
                onClick={handleSelectAll}
                disabled={availableCount === 0}
              >
                Select All Available ({availableCount})
              </button>
            </div>
            <div className="rp-card-body">
              <div className="rp-search-bar">
                <div className="rp-search-wrapper">
                  <Search size={18} className="rp-search-icon" />
                  <input
                    type="text"
                    className="rp-search-input"
                    placeholder="Search by name, department, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="rp-clear-btn"
                      onClick={handleCancelSearch}
                    >
                      <X size={14} />
                    </button>
                  )}
                  {activeSearchTerm ? (
                    <button
                      type="button"
                      className="rp-search-btn rp-search-btn-cancel"
                      onClick={handleCancelSearch}
                    >
                      <X size={14} />
                      <span>Cancel</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rp-search-btn"
                      onClick={handleSearch}
                    >
                      <Search size={14} />
                      <span>Search</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="rp-table-wrapper">
                <table className="rp-table">
                  <thead className="rp-table-header">
                    <tr>
                      <th>Employee</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="rp-empty-state">
                          <UserX size={64} className="rp-empty-icon" />
                          <p className="rp-empty-title">No employees found</p>
                          <p className="rp-empty-text">
                            {activeSearchTerm
                              ? "No matches for your search."
                              : "All eligible employees are mapped."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const status = getEmployeeStatus(emp.employeeMasterId);
                        const isSelected = isEmployeeSelected(
                          emp.employeeMasterId
                        );
                        const inResourcePool = isEmployeeInResourcePool(
                          emp.employeeMasterId
                        );
                        return (
                          <tr key={emp.employeeMasterId}>
                            <td className="rp-cell-employee">
                              <div className="rp-employee-name">
                                {emp.firstName} {emp.lastName}
                              </div>
                              <span className="rp-employee-id">
                                {emp.employeeCompanyId}
                              </span>
                              {emp.email && (
                                <span className="rp-employee-email">
                                  {" "}
                                  {emp.email}
                                </span>
                              )}
                            </td>
                            <td>
                              <span className="rp-role-badge">
                                {emp.roleName}
                              </span>
                            </td>
                            <td>
                              <span className="rp-department">
                                {emp.departmentName}{" "}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`rp-status-badge ${status.badge}`}
                              >
                                {React.createElement(status.icon, { size: 12 })}
                                <span>{status.text}</span>
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={`rp-emp-action-btn ${
                                  isSelected
                                    ? "rp-emp-action-btn--selected"
                                    : inResourcePool
                                    ? "rp-emp-action-btn--in-pool"
                                    : status.text === "Available"
                                    ? "rp-emp-action-btn--add"
                                    : "rp-emp-action-btn--warn"
                                }`}
                                onClick={() => handleAddEmployee(emp)}
                                disabled={isSelected || inResourcePool}
                                title={
                                  inResourcePool
                                    ? "Already in Resource Pool"
                                    : isSelected
                                    ? "Selected"
                                    : "Add to selection"
                                }
                              >
                                {isSelected ? (
                                  <Check size={16} />
                                ) : inResourcePool ? (
                                  <X size={16} />
                                ) : (
                                  <Plus size={16} />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="rp-col-right">
          <div className="rp-card rp-card-right">
            <div className="rp-card-header">
              <div className="rp-card-title">
                <UserCheck size={20} />
                <span>Selected ({selectedEmployees.length})</span>
              </div>
              {selectedEmployees.length > 0 && (
                <button
                  type="button"
                  className="rp-btn rp-btn-clear"
                  onClick={handleClearAll}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="rp-card-body rp-selected-body">
              <div className="rp-selected-list">
                {selectedEmployees.length === 0 ? (
                  <div className="rp-selected-empty">
                    <Users size={48} className="rp-empty-icon" />
                    <p className="rp-empty-title">No employees selected</p>
                    <span className="rp-empty-text">
                      {" "}
                      Select available employees from the left
                    </span>
                  </div>
                ) : (
                  selectedEmployees.map((emp, index) => (
                    <div
                      key={emp.employeeMasterId}
                      className="rp-selected-item"
                    >
                      <div className="rp-selected-info">
                        <div className="rp-selected-name">
                          {index + 1}. {emp.firstName} {emp.lastName}
                        </div>
                        <div className="rp-selected-meta">
                          {emp.employeeCompanyId} • {emp.roleName} •{" "}
                          {emp.departmentName}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rp-selected-remove-btn"
                        onClick={() =>
                          handleRemoveEmployee(emp.employeeMasterId)
                        }
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="rp-selected-footer">
                <button
                  type="button"
                  className="rp-btn-map"
                  onClick={handleMapToResourcePool}
                  disabled={selectedEmployees.length === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="rp-inline-spinner" />
                      <span>
                        {" "}
                        Mapping {selectedEmployees.length} employee(s)...
                      </span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} />
                      <span>
                        Map{" "}
                        {selectedEmployees.length > 0
                          ? `${selectedEmployees.length} `
                          : ""}
                        to Resource Pool
                      </span>
                    </>
                  )}
                </button>
                {selectedEmployees.length > 0 && (
                  <span className="rp-selected-note">
                    Enforces: single-project rule, L2 manager assignment,
                    primary status
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showClearModal && (
        <div
          className="rp-modal-overlay"
          onClick={() => setShowClearModal(false)}
        >
          <div
            className="rp-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rp-modal-header">
              <div className="rp-modal-title">
                <AlertCircle size={24} />
                <h5>Clear All Selections</h5>
              </div>
              <button
                type="button"
                className="rp-modal-close"
                onClick={() => setShowClearModal(false)}
              >
                ×{" "}
              </button>
            </div>
            <div className="rp-modal-body">
              <p>Are you sure you want to clear all selected employees?</p>
              <div className="rp-modal-info">
                <Info size={18} />
                <span>
                  {" "}
                  {selectedEmployees.length} employee(s) will be removed from
                  selection
                </span>
              </div>
            </div>
            <div className="rp-modal-footer">
              <button
                type="button"
                className="rp-modal-btn rp-modal-btn--secondary"
                onClick={() => setShowClearModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rp-modal-btn rp-btn-clear-confirm"
                onClick={confirmClearAll}
              >
                <X size={18} />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {showMapModal && (
        <div
          className="rp-modal-overlay"
          onClick={() => !isSubmitting && setShowMapModal(false)}
        >
          <div
            className="rp-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rp-modal-header">
              <div className="rp-modal-title">
                <UserCheck size={24} />
                <h5>Map to Resource Pool</h5>
              </div>
              <button
                type="button"
                className="rp-modal-close"
                onClick={() => setShowMapModal(false)}
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>
            <div className="rp-modal-body">
              <p>
                Confirm mapping{" "}
                <strong>{selectedEmployees.length} employee(s)</strong> to
                Resource Pool?
              </p>
              <div className="rp-modal-actions-list">
                <h6>This will:</h6>
                <ul>
                  <li>
                    {" "}
                    Assign them to <strong>{RESOURCE_POOL_PROJECT_NAME}</strong>
                  </li>
                  <li>
                    Set Resource Pool&apos;s L2 Approver as their
                    reportingmanager
                  </li>
                  <li>Mark them as primary employees</li>
                  <li>Remove them from any other projects (if applicable)</li>
                </ul>
              </div>
              <div className="rp-modal-selected-list">
                <strong>Selected Employees:</strong>
                <div className="rp-modal-employees">
                  {selectedEmployees.map((emp) => (
                    <span
                      key={emp.employeeMasterId}
                      className="rp-modal-employee-badge"
                    >
                      {" "}
                      {emp.firstName} {emp.lastName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="rp-modal-footer">
              <button
                type="button"
                className="rp-modal-btn rp-modal-btn--secondary"
                onClick={() => setShowMapModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rp-modal-btn rp-btn-map-confirm"
                onClick={confirmMapToResourcePool}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="rp-inline-spinner" />
                    <span>Mapping...</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={18} />
                    <span>Confirm Mapping</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcePoolMapping;
