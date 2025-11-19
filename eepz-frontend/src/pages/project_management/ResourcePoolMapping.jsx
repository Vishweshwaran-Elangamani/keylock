import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Users,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Search,
  Home,
  UserCheck,
  Plus,
  X,
  Info,
  RefreshCw,
  Database,
  UserX,
  Check,
  Download,
} from "lucide-react";
import projectService from "../../services/project_management/projectService";
import { color } from "chart.js/helpers";

const RESOURCE_POOL_PROJECT_NAME = "ORG.RZ.RESOURCEPOOL";

const ResourcePoolMapping = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  // Data
  const [allEmployees, setAllEmployees] = useState([]);
  const [resourcePoolMappedEmployees, setResourcePoolMappedEmployees] =
    useState([]);
  const [mappedEmployees, setMappedEmployees] = useState([]);

  // UI state
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Optimistic guard: IDs just mapped in this session (used to disable action and remove from list immediately)
  const [recentlyMappedIds, setRecentlyMappedIds] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    // Clear session-optimistic flags on full refresh (backend becomes source of truth)
    setRecentlyMappedIds([]);
    try {
      // All employees
      const employeesResponse = await projectService.getAllEmployees();
      if (employeesResponse.success !== false && employeesResponse.data) {
        setAllEmployees(employeesResponse.data);
      } else {
        throw new Error(
          employeesResponse?.message || "Failed to load employees"
        );
      }

      // Projects with mapped employees
      const projectsResponse = await projectService.getAllProjects();
      if (projectsResponse.success !== false && projectsResponse.data) {
        const allMapped = [];
        const resourcePoolMapped = [];

        projectsResponse.data.forEach((project) => {
          if (Array.isArray(project.mappedEmployees)) {
            project.mappedEmployees.forEach((emp) => {
              if (
                !allMapped.some(
                  (m) => m.employeeMasterId === emp.employeeMasterId
                )
              ) {
                allMapped.push(emp);
              }
              if (
                project.projectName &&
                project.projectName.toUpperCase() ===
                  RESOURCE_POOL_PROJECT_NAME.toUpperCase()
              ) {
                if (
                  !resourcePoolMapped.some(
                    (m) => m.employeeMasterId === emp.employeeMasterId
                  )
                ) {
                  resourcePoolMapped.push(emp);
                }
              }
            });
          }
        });

        setMappedEmployees(allMapped);
        setResourcePoolMappedEmployees(resourcePoolMapped);
      } else {
        setMappedEmployees([]);
        setResourcePoolMappedEmployees([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Status helpers
  const isEmployeeSelected = (empId) =>
    selectedEmployees.some((emp) => emp.employeeMasterId === empId);
  const isEmployeeInResourcePool = (empId) =>
    resourcePoolMappedEmployees.some((emp) => emp.employeeMasterId === empId);
  const isEmployeeMappedToAny = (empId) =>
    mappedEmployees.some((emp) => emp.employeeMasterId === empId);
  const isRecentlyMapped = (empId) => recentlyMappedIds.includes(empId);

  const getEmployeeStatus = (empId) => {
    // Treat recently mapped as Unavailable immediately
    if (isRecentlyMapped(empId) || isEmployeeInResourcePool(empId)) {
      return { text: "Unavailable", badge: "bg-secondary", icon: CheckCircle };
    }
    if (isEmployeeMappedToAny(empId)) {
      return { text: "Unavailable", badge: "bg-warning", icon: AlertCircle };
    }
    return { text: "Available", badge: "bg-success", icon: Check };
  };

  // NOTE: The table below now removes employees just mapped (and those already in Resource Pool)
  // so that they do not appear again in the checklist immediately.
  const filteredEmployees = (
    searchTerm
      ? allEmployees.filter((emp) =>
          `${emp.firstName} ${emp.lastName} ${emp.roleName} ${emp.departmentName} ${emp.employeeCompanyId}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      : allEmployees
  )
    // Remove employees already in Resource Pool (server truth)
    .filter(
      (emp) =>
        !resourcePoolMappedEmployees.some(
          (e) => e.employeeMasterId === emp.employeeMasterId
        )
    )
    // Remove employees mapped in this session (optimistic removal)
    .filter((emp) => !recentlyMappedIds.includes(emp.employeeMasterId));

  // Counts
  const availableCount = filteredEmployees.filter(
    (emp) => getEmployeeStatus(emp.employeeMasterId).text === "Available"
  ).length;

  // Actions
  const handleAddEmployee = (employee) => {
    const status = getEmployeeStatus(employee.employeeMasterId);
    if (
      status.text === "Available" &&
      !isEmployeeSelected(employee.employeeMasterId)
    ) {
      setSelectedEmployees((prev) => [...prev, employee]);
      setMessage({
        type: "info",
        text: `${employee.firstName} ${employee.lastName} added to selection`,
      });
      setTimeout(() => setMessage(null), 1800);
    } else {
      setMessage({
        type: "warning",
        text: `${employee.firstName} ${employee.lastName} is unavailable for mapping`,
      });
      setTimeout(() => setMessage(null), 2200);
    }
  };

  const handleRemoveEmployee = (empId) => {
    setSelectedEmployees((prev) =>
      prev.filter((emp) => emp.employeeMasterId !== empId)
    );
    setMessage({ type: "info", text: "Employee removed from selection" });
    setTimeout(() => setMessage(null), 1500);
  };

  const handleSelectAll = () => {
    const canAdd = filteredEmployees.filter(
      (emp) => getEmployeeStatus(emp.employeeMasterId).text === "Available"
    );
    const addable = canAdd.filter(
      (emp) => !isEmployeeSelected(emp.employeeMasterId)
    );
    if (addable.length > 0) {
      setSelectedEmployees((prev) => [...prev, ...addable]);
      setMessage({
        type: "success",
        text: `${addable.length} employees added to selection`,
      });
      setTimeout(() => setMessage(null), 1800);
    }
  };

  const handleClearAll = () => {
    if (
      selectedEmployees.length > 0 &&
      window.confirm("Clear all selections?")
    ) {
      setSelectedEmployees([]);
      setMessage({ type: "info", text: "All selections cleared" });
      setTimeout(() => setMessage(null), 1500);
    }
  };

  const handleMapToResourcePool = async () => {
    if (selectedEmployees.length === 0) {
      setMessage({
        type: "error",
        text: "Please select at least one employee to map",
      });
      setTimeout(() => setMessage(null), 2200);
      return;
    }

    const employeeIds = selectedEmployees.map((emp) => emp.employeeMasterId);

    if (
      !window.confirm(
        `Confirm mapping ${selectedEmployees.length} employee(s) to Resource Pool?\n\n` +
          `This will:\n` +
          `• Assign them to '${RESOURCE_POOL_PROJECT_NAME}'\n` +
          `• Set Resource Pool's L2 Approver as their reporting manager\n` +
          `• Mark them as primary employees\n` +
          `• Remove them from any other projects\n\n` +
          `Selected: ${selectedEmployees
            .map((e) => `${e.firstName} ${e.lastName}`)
            .join(", ")}`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await projectService.mapToResourcePool(employeeIds);

      if (response.success === false) {
        throw new Error(response.message || "Mapping failed");
      }

      // 1) Optimistic: mark them as recently mapped so they are removed from the left list immediately
      setRecentlyMappedIds((prev) => [...new Set([...prev, ...employeeIds])]);

      // 2) Also optimistically treat them as mapped (for any other guards using these arrays)
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

      // 3) Clear the right-side selection
      setSelectedEmployees([]);

      setMessage({
        type: "success",
        text: `Successfully mapped ${
          response.data?.mappedCount || employeeIds.length
        } employee(s) to Resource Pool. They have been removed from the list.`,
        isLong: true,
      });

      // 4) Server sync (keeps totals and statuses consistent)
      fetchInitialData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      // Revert optimistic bits if server failed
      setRecentlyMappedIds((prev) =>
        prev.filter((id) => !employeeIds.includes(id))
      );
      setResourcePoolMappedEmployees((prev) =>
        prev.filter((emp) => !employeeIds.includes(emp.employeeMasterId))
      );
      setMappedEmployees((prev) =>
        prev.filter((emp) => !employeeIds.includes(emp.employeeMasterId))
      );

      setMessage({
        type: "error",
        text: error.message || "Failed to map employees to Resource Pool.",
        isLong: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInitialData();
    setIsRefreshing(false);
    setMessage({ type: "success", text: "Data refreshed" });
    setTimeout(() => setMessage(null), 1600);
  };

  const stats = {
    total: allEmployees.length,
    inResourcePool: resourcePoolMappedEmployees.length,
    available: availableCount,
    selected: selectedEmployees.length,
  };

  if (isLoading) {
    return (
      <div className="h-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div
            className="spinner-border text-primary mb-3"
            style={{ width: "3rem", height: "3rem" }}
          ></div>
          <p className="text-muted">Loading Resource Pool data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-100 d-flex flex-column">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol
          className="breadcrumb mb-0 p-3 rounded"
          style={{
            backgroundColor: "rgba(151, 36, 126, 0.05)",
            fontSize: "0.875rem",
          }}
        >
          <li className="breadcrumb-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/hr/dashboard/projectmgmt");
              }}
              style={{
                color: "var(--color-primary-3)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
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
              style={{
                color: "var(--color-primary-3)",
                textDecoration: "none",
              }}
            >
              Projects
            </a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <span style={{ color: "var(--color-primary-1)", fontWeight: 600 }}>
              Resource Pool Mapping
            </span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-link text-decoration-none p-0"
            onClick={() => navigate("/hr/dashboard/projectmgmt/list")}
          >
            <ArrowLeft size={24} />
          </button>
          {/* <Users size={36} className="text-primary" /> */}
          <div>
            <h2 className="mb-0 fw-bold" style={{textAlign:"left"}}>Resource Pool Mapping</h2>
            <p className="text-muted mb-0 medium">
              Manage employee mappings to {RESOURCE_POOL_PROJECT_NAME}{" "}
              (employees mapped now will disappear from the list)
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}{" "}
            Refresh
          </button>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() =>
              navigate(
                `/hr/dashboard/projectmgmt/details/${RESOURCE_POOL_PROJECT_NAME.toLowerCase().replace(
                  /\./g,
                  "-"
                )}`
              )
            }
          >
            <Download size={16} /> View Project
          </button>
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <div
          className={`alert alert-${
            message.type === "success"
              ? "success"
              : message.type === "info"
              ? "info"
              : message.type === "warning"
              ? "warning"
              : "danger"
          } d-flex align-items-center gap-2 mb-4 ${
            message.isLong ? "alert-dismissible fade show" : ""
          }`}
          role="alert"
        >
          {message.type === "success" && <CheckCircle size={20} />}
          {message.type === "info" && <Info size={20} />}
          {message.type === "warning" && (
            <AlertCircle size={20} className="text-warning" />
          )}
          {message.type === "error" && <AlertCircle size={20} />}
          <span className="flex-grow-1">{message.text}</span>
          {message.isLong && (
            <button
              type="button"
              className="btn-close"
              onClick={() => setMessage(null)}
              aria-label="Close"
            ></button>
          )}
        </div>
      )}
      {error && (
        <div
          className="alert alert-danger d-flex align-items-center gap-2 mb-4"
          role="alert"
        >
          <AlertCircle size={20} />
          <div>
            <strong>Error:</strong> {error}
            <button
              className="btn btn-sm btn-outline-danger ms-3"
              onClick={fetchInitialData}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="row g-4 h-100">
        {/* Left: Employees List */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm h-100 d-flex flex-column">
            <div className="card-header bg-light d-flex align-items-center justify-content-between">
              <h5 className="mb-0 d-flex align-items-center gap-2" style={{color:"white"}}>
                <Database size={20} /> Employees
              </h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleSelectAll}
                disabled={availableCount === 0} style={{color:"white"}}
              >
                Select All Available ({availableCount})
              </button>
            </div>

            <div className="card-body p-0 d-flex flex-column flex-grow-1">
              {/* Search */}
              <div className="p-3 border-bottom bg-light">
                <div className="input-group">
                  <span className="input-group-text">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, role, department, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive flex-grow-1">
                <table className="table table-hover mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th className="py-3 px-3">Employee</th>
                      <th className="py-3">Role</th>
                      <th className="py-3">Department</th>
                      <th
                        className="py-3 text-center"
                        style={{ width: "120px" }}
                      >
                        Status
                      </th>
                      <th
                        className="py-3 text-center"
                        style={{ width: "90px" }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-5 text-muted">
                          <UserX size={64} className="mb-3 opacity-25" />
                          <p className="mb-2 fs-5">No employees found</p>
                          <p className="small mb-0">
                            {searchTerm
                              ? "No matches for your search."
                              : "All eligible employees are mapped."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const status = getEmployeeStatus(emp.employeeMasterId);
                        const isUnavailable = status.text !== "Available";
                        return (
                          <tr key={emp.employeeMasterId}>
                            <td className="py-2 px-3 align-middle">
                              <div className="fw-semibold">
                                {emp.firstName} {emp.lastName}
                              </div>
                              <small className="text-muted d-block">
                                {emp.employeeCompanyId}
                              </small>
                              <small className="text-muted">{emp.email}</small>
                            </td>
                            <td className="py-2 align-middle">
                              <span className="badge bg-light text-dark fs-6">
                                {emp.roleName}
                              </span>
                            </td>
                            <td className="py-2 align-middle">
                              <small className="text-muted">
                                {emp.departmentName}
                              </small>
                            </td>
                            <td className="py-2 text-center align-middle">
                              <span className={`badge ${status.badge}`}>
                                {React.createElement(status.icon, {
                                  size: 12,
                                  className: "me-1",
                                })}{" "}
                                {status.text}
                              </span>
                            </td>
                            <td className="py-2 text-center align-middle">
                              <button
                                className={`btn btn-sm ${
                                  isEmployeeSelected(emp.employeeMasterId)
                                    ? "btn-outline-success"
                                    : isUnavailable
                                    ? "btn-outline-secondary"
                                    : "btn-success"
                                }`}
                                onClick={() => handleAddEmployee(emp)}
                                disabled={
                                  isEmployeeSelected(emp.employeeMasterId) ||
                                  isUnavailable
                                }
                                title={
                                  isUnavailable
                                    ? "Unavailable for mapping"
                                    : isEmployeeSelected(emp.employeeMasterId)
                                    ? "Already selected"
                                    : "Add to selection"
                                }
                              >
                                {isEmployeeSelected(emp.employeeMasterId) ? (
                                  <Check size={16} />
                                ) : isUnavailable ? (
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
          <div className="card border-0 shadow-sm h-100 d-flex flex-column">
            <div className="card-header bg-light d-flex align-items-center justify-content-between">
              <h5 className="mb-0 d-flex align-items-center gap-2" style={{color:"white"}}>
                <UserCheck size={20} className="text-success" /> Selected
                Employees ({selectedEmployees.length})
              </h5>
              {selectedEmployees.length > 0 && (
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleClearAll}
                    title="Clear all"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
            <div className="card-body d-flex flex-column flex-grow-1 p-0">
              <div
                className="flex-grow-1 p-3"
                style={{
                  minHeight: "300px",
                  maxHeight: "400px",
                  overflowY: "auto",
                  backgroundColor: "#f8f9fa",
                }}
              >
                {selectedEmployees.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <Users size={48} className="mb-3 opacity-25" />
                    <p className="mb-2">No employees selected</p>
                    <small className="text-muted">
                      Select available employees from the left to add here
                    </small>
                  </div>
                ) : (
                  <div className="list-unstyled">
                    {selectedEmployees.map((emp, index) => (
                      <div
                        key={emp.employeeMasterId}
                        className="d-flex align-items-center justify-content-between p-2 mb-2 bg-white rounded shadow-sm border"
                      >
                        <div className="flex-grow-1">
                          <div className="fw-semibold small">
                            {index + 1}. {emp.firstName} {emp.lastName}
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {emp.employeeCompanyId} • {emp.roleName} •{" "}
                            {emp.departmentName}
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-danger ms-2"
                          onClick={() =>
                            handleRemoveEmployee(emp.employeeMasterId)
                          }
                          title="Remove"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 border-top bg-light">
                <button
                  className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold py-2"
                  onClick={handleMapToResourcePool}
                  disabled={selectedEmployees.length === 0 || isSubmitting}
                  title={
                    selectedEmployees.length === 0
                      ? "Select employees first"
                      : isSubmitting
                      ? "Mapping..."
                      : "Map to Resource Pool"
                  }
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Mapping {selectedEmployees.length} employee(s)...
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} />
                      Map{" "}
                      {selectedEmployees.length > 0
                        ? `${selectedEmployees.length} `
                        : ""}
                      to Resource Pool
                    </>
                  )}
                </button>
                {selectedEmployees.length > 0 && (
                  <small className="text-muted d-block text-center mt-2">
                    Backend enforces: single-project rule, L2 manager
                    assignment, primary status
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcePoolMapping;
