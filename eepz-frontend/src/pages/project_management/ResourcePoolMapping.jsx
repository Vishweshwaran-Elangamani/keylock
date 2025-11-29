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
import "../../styles/projectmanagement/ResourcePoolMapping.css";

const RESOURCE_POOL_PROJECT_NAME = "ORG.RZ.RESOURCEPOOL";

const ResourcePoolMapping = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  // Data
  const [allEmployees, setAllEmployees] = useState([]);
  const [resourcePoolMappedEmployees, setResourcePoolMappedEmployees] = useState([]);
  const [mappedEmployees, setMappedEmployees] = useState([]);
  const [resourcePoolProject, setResourcePoolProject] = useState(null);

  // UI state
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showClearModal, setShowClearModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  // Optimistic guard
  const [recentlyMappedIds, setRecentlyMappedIds] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);
    setRecentlyMappedIds([]);
    try {
      //  Fetch all employees (filter for role "Employee" only)
      const employeesResponse = await projectService.getInitialStageEmployees();
      console.log("Initial stage employees response:", employeesResponse);
      
      if (employeesResponse.success && employeesResponse.data) {
        const filteredEmployees = employeesResponse.data.filter(
          (emp) => emp.roleName?.toLowerCase() === "employee" //  Show only Employee role
        );
        setAllEmployees(filteredEmployees);
        console.log("Filtered employees (Employee role only):", filteredEmployees);
      } else {
        throw new Error(employeesResponse?.message || "Failed to load employees");
      }

      //  Fetch all projects to find Resource Pool
      const projectsResponse = await projectService.getAllProjects();
      console.log("All projects response:", projectsResponse);
      
      if (projectsResponse.success && projectsResponse.data) {
        const allMapped = [];
        let resourcePoolProj = null;

        projectsResponse.data.forEach((project) => {
          // Find Resource Pool project
          if (
            project.projectName &&
            project.projectName.toUpperCase() === RESOURCE_POOL_PROJECT_NAME.toUpperCase()
          ) {
            resourcePoolProj = project;
            console.log("Found Resource Pool project:", resourcePoolProj);
          }

          // Collect all mapped employees
          if (Array.isArray(project.mappedEmployees)) {
            project.mappedEmployees.forEach((emp) => {
              //  Filter for Employee role only
              if (emp.roleName?.toLowerCase() === "employee") {
                if (!allMapped.some((m) => m.employeeMasterId === emp.employeeMasterId)) {
                  allMapped.push(emp);
                }
              }
            });
          }
        });

        setMappedEmployees(allMapped);
        console.log("All mapped employees:", allMapped);

        // Fetch Resource Pool project details using getProjectById
        if (resourcePoolProj && resourcePoolProj.projectId) {
          try {
            const resourcePoolDetails = await projectService.getProjectById(
              resourcePoolProj.projectId
            );
            console.log("Resource Pool details response:", resourcePoolDetails);
            
            if (resourcePoolDetails.success && resourcePoolDetails.data) {
              setResourcePoolProject(resourcePoolDetails.data);
              
              //  Update resource pool mapped employees from detailed data
              if (Array.isArray(resourcePoolDetails.data.mappedEmployees)) {
                const rpMapped = resourcePoolDetails.data.mappedEmployees.filter(
                  (emp) => emp.roleName?.toLowerCase() === "employee"
                );
                setResourcePoolMappedEmployees(rpMapped);
                console.log("Resource Pool mapped employees:", rpMapped);
              } else {
                setResourcePoolMappedEmployees([]);
              }
            }
          } catch (err) {
            console.error("Failed to fetch Resource Pool details:", err);
            setResourcePoolMappedEmployees([]);
          }
        } else {
          console.warn("Resource Pool project not found");
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

  // Status helpers
  const isEmployeeSelected = (empId) =>
    selectedEmployees.some((emp) => emp.employeeMasterId === empId);
  
  const isEmployeeInResourcePool = (empId) => {
    const inPool = resourcePoolMappedEmployees.some((emp) => emp.employeeMasterId === empId);
    console.log(`Checking if employee ${empId} is in resource pool:`, inPool);
    return inPool;
  };
  
  const isEmployeeMappedToAny = (empId) =>
    mappedEmployees.some((emp) => emp.employeeMasterId === empId);
  
  const isRecentlyMapped = (empId) => recentlyMappedIds.includes(empId);

  const getEmployeeStatus = (empId) => {
    if (isRecentlyMapped(empId) || isEmployeeInResourcePool(empId)) {
      return { text: "In Resource Pool", badge: "rp-badge-secondary", icon: CheckCircle };
    }
    if (isEmployeeMappedToAny(empId)) {
      return { text: "Mapped to Project", badge: "rp-badge-warning", icon: AlertCircle };
    }
    return { text: "Available", badge: "rp-badge-success", icon: Check };
  };

  // Filter employees to exclude those already in resource pool
  const filteredEmployees = (
    searchTerm
      ? allEmployees.filter((emp) =>
          `${emp.firstName} ${emp.lastName} ${emp.roleName} ${emp.departmentName} ${emp.employeeCompanyId}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      : allEmployees
  ).filter((emp) => {
    //  Exclude employees already in resource pool
    const inResourcePool = isEmployeeInResourcePool(emp.employeeMasterId);
    const recentlyMapped = isRecentlyMapped(emp.employeeMasterId);
    return !inResourcePool && !recentlyMapped;
  });

  console.log("Filtered employees for display:", filteredEmployees);

  const availableCount = filteredEmployees.filter(
    (emp) => getEmployeeStatus(emp.employeeMasterId).text === "Available"
  ).length;

  // Actions
  const handleAddEmployee = (employee) => {
    //  Check if employee is already in resource pool
    if (isEmployeeInResourcePool(employee.employeeMasterId)) {
      toast.warning(
        `${employee.firstName} ${employee.lastName} is already mapped to Resource Pool`,
        { duration: 3000 }
      );
      return;
    }

    const status = getEmployeeStatus(employee.employeeMasterId);
    if (status.text === "Available" && !isEmployeeSelected(employee.employeeMasterId)) {
      setSelectedEmployees((prev) => [...prev, employee]);
      toast.success(`${employee.firstName} ${employee.lastName} added to selection`);
    } else if (status.text === "Mapped to Project") {
      toast.warning(
        `${employee.firstName} ${employee.lastName} is already mapped to another project. They will be moved to Resource Pool.`,
        { duration: 4000 }
      );
      setSelectedEmployees((prev) => [...prev, employee]);
    } else {
      toast.warning(`${employee.firstName} ${employee.lastName} is unavailable for mapping`);
    }
  };

  const handleRemoveEmployee = (empId) => {
    setSelectedEmployees((prev) => prev.filter((emp) => emp.employeeMasterId !== empId));
    toast.info("Employee removed from selection");
  };

  const handleSelectAll = () => {
    const canAdd = filteredEmployees.filter(
      (emp) => 
        getEmployeeStatus(emp.employeeMasterId).text === "Available" &&
        !isEmployeeInResourcePool(emp.employeeMasterId)
    );
    const addable = canAdd.filter((emp) => !isEmployeeSelected(emp.employeeMasterId));
    
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

    //  Check if any selected employees are already in resource pool
    const alreadyInPool = selectedEmployees.filter((emp) =>
      isEmployeeInResourcePool(emp.employeeMasterId)
    );

    if (alreadyInPool.length > 0) {
      const names = alreadyInPool.map((e) => `${e.firstName} ${e.lastName}`).join(", ");
      toast.error(
        `Cannot map: ${names} ${alreadyInPool.length > 1 ? "are" : "is"} already in Resource Pool`,
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
      console.log("Map to resource pool response:", response);

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
        `Successfully mapped ${response.data?.mappedCount || employeeIds.length} employee(s) to Resource Pool`,
        { duration: 3000 }
      );

      //  Refresh data after mapping
      await fetchInitialData();
    } catch (error) {
      console.error("Error mapping to resource pool:", error);
      setRecentlyMappedIds((prev) => prev.filter((id) => !employeeIds.includes(id)));
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
      <div className="rp-wrapper h-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }}></div>
          <p className="text-muted">Loading Resource Pool data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-wrapper h-100 d-flex flex-column">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0 p-3 rounded rp-breadcrumb">
          <li className="breadcrumb-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/hr/dashboard/projectmgmt");
              }}
              className="rp-breadcrumb-link"
            >
              <Home size={14} /> Dashboard
            </a>
          </li>
          <li className="breadcrumb-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/hr/dashboard/projectmgmt/list");
              }}
              className="rp-breadcrumb-link"
            >
              Projects
            </a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <span className="rp-breadcrumb-active">Resource Pool Mapping</span>
          </li>
        </ol>
      </nav>

      {/*  Resource Pool Info Section */}
      {resourcePoolProject && (
        <div className="alert alert-info mb-3 d-flex align-items-center" role="alert">
          <Database size={20} className="me-2" />
          <div>
            <strong>Resource Pool:</strong> {resourcePoolProject.projectName}
           
            {resourcePoolProject.l2Approver && (
              <span className="ms-3">
                <strong>L2 Manager:</strong> {resourcePoolProject.l2Approver.firstName} {resourcePoolProject.l2Approver.lastName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-danger rp-alert-error" role="alert">
          <AlertCircle size={20} />
          <div>
            <strong>Error:</strong> {error}
            <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchInitialData}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="row g-4 flex-grow-1">
        {/* Left: Employees List */}
        <div className="col-lg-8">
          <div className="rp-card rp-card-left">
            <div className="rp-card-header">
              <div className="rp-card-title">
                <Database size={20} /> Employees
              </div>
              <button
                className="btn btn-sm rp-btn-select-all"
                onClick={handleSelectAll}
                disabled={availableCount === 0}
              >
                Select All Available ({availableCount})
              </button>
            </div>

            <div className="rp-card-body">
              {/* Search */}
              <div className="rp-search-bar">
                <div className="input-group">
                  <span className="input-group-text">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, department, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Table */}
              <div className="rp-table-wrapper">
                <table className="table table-hover mb-0 rp-table">
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
                            {searchTerm 
                              ? "No matches for your search." 
                              : "All eligible employees are mapped."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const status = getEmployeeStatus(emp.employeeMasterId);
                        const isSelected = isEmployeeSelected(emp.employeeMasterId);
                        const inResourcePool = isEmployeeInResourcePool(emp.employeeMasterId);
                        
                        return (
                          <tr key={emp.employeeMasterId}>
                            <td className="rp-cell-employee">
                              <div className="rp-employee-name">{emp.firstName} {emp.lastName}</div>
                              <small className="rp-employee-id">{emp.employeeCompanyId}</small>
                              {emp.email && <small className="rp-employee-email">{emp.email}</small>}
                            </td>
                            <td>
                              <span className="rp-role-badge">{emp.roleName}</span>
                            </td>
                            <td>
                              <small className="rp-department">{emp.departmentName}</small>
                            </td>
                            <td>
                              <span className={`rp-status-badge ${status.badge}`}>
                                {React.createElement(status.icon, { size: 12 })} {status.text}
                              </span>
                            </td>
                            <td>
                              <button
                                className={`btn btn-sm ${
                                  isSelected
                                    ? "btn-outline-success"
                                    : inResourcePool
                                    ? "btn-outline-secondary"
                                    : status.text === "Available"
                                    ? "btn-success"
                                    : "btn-warning"
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

        {/* Right: Selected Employees */}
        <div className="col-lg-4">
          <div className="rp-card rp-card-right">
            <div className="rp-card-header">
              <div className="rp-card-title">
                <UserCheck size={20} /> Selected ({selectedEmployees.length})
              </div>
              {selectedEmployees.length > 0 && (
                <button className="btn btn-sm rp-btn-clear" onClick={handleClearAll}>
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
                    <small className="rp-empty-text">Select available employees from the left</small>
                  </div>
                ) : (
                  selectedEmployees.map((emp, index) => (
                    <div key={emp.employeeMasterId} className="rp-selected-item">
                      <div className="rp-selected-info">
                        <div className="rp-selected-name">
                          {index + 1}. {emp.firstName} {emp.lastName}
                        </div>
                        <div className="rp-selected-meta">
                          {emp.employeeCompanyId} • {emp.roleName} • {emp.departmentName}
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemoveEmployee(emp.employeeMasterId)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="rp-selected-footer">
                {/*  GRADIENT BUTTON */}
                <button
                  className="btn w-100 rp-btn-map"
                  onClick={handleMapToResourcePool}
                  disabled={selectedEmployees.length === 0 || isSubmitting}
                  style={{
                    background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                    color: 'white',
                    border: 'none',
                    fontWeight: '500',
                    padding: '0.75rem 1rem',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: selectedEmployees.length === 0 || isSubmitting ? 0.6 : 1,
                    cursor: selectedEmployees.length === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm"></span>
                      Mapping {selectedEmployees.length} employee(s)...
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} />
                      Map {selectedEmployees.length > 0 ? `${selectedEmployees.length} ` : ""}to Resource Pool
                    </>
                  )}
                </button>
                {selectedEmployees.length > 0 && (
                  <small className="rp-selected-note">
                    Enforces: single-project rule, L2 manager assignment, primary status
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear All Modal */}
      {showClearModal && (
        <div className="rp-modal-overlay" onClick={() => setShowClearModal(false)}>
          <div className="rp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="rp-modal-header">
              <div className="rp-modal-title">
                <AlertCircle size={24} />
                <h5>Clear All Selections</h5>
              </div>
              <button className="rp-modal-close" onClick={() => setShowClearModal(false)}>
                ×
              </button>
            </div>
            <div className="rp-modal-body">
              <p>Are you sure you want to clear all selected employees?</p>
              <div className="rp-modal-info">
                <Info size={18} />
                <span>{selectedEmployees.length} employee(s) will be removed from selection</span>
              </div>
            </div>
            <div className="rp-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowClearModal(false)}>
                Cancel
              </button>
              <button className="btn rp-btn-clear-confirm" onClick={confirmClearAll}>
                <X size={18} />
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map to Resource Pool Modal */}
      {showMapModal && (
        <div className="rp-modal-overlay" onClick={() => !isSubmitting && setShowMapModal(false)}>
          <div className="rp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="rp-modal-header">
              <div className="rp-modal-title">
                <UserCheck size={24} />
                <h5>Map to Resource Pool</h5>
              </div>
              <button 
                className="rp-modal-close" 
                onClick={() => setShowMapModal(false)}
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>
            <div className="rp-modal-body">
              <p>Confirm mapping <strong>{selectedEmployees.length} employee(s)</strong> to Resource Pool?</p>
              
              <div className="rp-modal-actions-list">
                <h6>This will:</h6>
                <ul>
                  <li>Assign them to '<strong>{RESOURCE_POOL_PROJECT_NAME}</strong>'</li>
                  <li>Set Resource Pool's L2 Approver as their reporting manager</li>
                  <li>Mark them as primary employees</li>
                  <li>Remove them from any other projects (if applicable)</li>
                </ul>
              </div>

              <div className="rp-modal-selected-list">
                <strong>Selected Employees:</strong>
                <div className="rp-modal-employees">
                  {selectedEmployees.map((emp) => (
                    <span key={emp.employeeMasterId} className="rp-modal-employee-badge">
                      {emp.firstName} {emp.lastName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="rp-modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowMapModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              {/* GRADIENT BUTTON FOR MODAL */}
              <button 
                className="btn"
                onClick={confirmMapToResourcePool}
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                  color: 'white',
                  border: 'none',
                  fontWeight: '500',
                  padding: '0.5rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    Mapping...
                  </>
                ) : (
                  <>
                    <UserCheck size={18} />
                    Confirm Mapping
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
