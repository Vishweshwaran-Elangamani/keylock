import apiClient from "./api";

const projectService = {
  // PROJECT CRUD OPERATIONS

  /**
   * Get all projects
   * @returns {Promise} Array of all projects
   */
  getAllProjects: async () => {
    try {
      const response = await apiClient.get("/ProjectManagement");
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: error.message || "Failed to fetch projects",
        }
      );
    }
  },

  /**
   * Get project by ID
   * @param {number} projectId - Project ID
   * @returns {Promise} Project details
   */
  getProjectById: async (projectId) => {
    try {
      const response = await apiClient.get(`/ProjectManagement/${projectId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch project" };
    }
  },

  /**
   * Create new project
   * @param {Object} projectData - Project data
   * @returns {Promise} Created project
   */
  createProject: async (projectData) => {
    try {
      const response = await apiClient.post("/ProjectManagement", projectData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to create project" };
    }
  },

  /**
   * Update project
   * @param {number} projectId - Project ID
   * @param {Object} projectData - Updated project data
   * @returns {Promise} Updated project
   */
  updateProject: async (projectId, projectData) => {
    try {
      const response = await apiClient.put(
        `/ProjectManagement/${projectId}`,
        projectData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to update project" };
    }
  },

  /**
   * Delete project
   * @param {number} projectId - Project ID
   * @returns {Promise} Deletion result
   */
  deleteProject: async (projectId) => {
    try {
      const response = await apiClient.delete(
        `/ProjectManagement/${projectId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to delete project" };
    }
  },

  //  REPORTING MANAGERS

  /**
   * Update reporting managers of a project
   * @param {number} projectId - Project ID
   * @param {Object} managersData - Managers data
   * @returns {Promise} Update result
   */
  updateReportingManagers: async (projectId, managersData) => {
    try {
      const response = await apiClient.put(
        `/ProjectManagement/${projectId}/reporting-managers`,
        managersData
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "Failed to update reporting managers",
        }
      );
    }
  },

  // EMPLOYEE MAPPING

  /**
   * Map employees to project with isPrimary support
   * @param {number} projectId - Project ID
   * @param {Array} employees - Array of employee objects with employeeId and isPrimary
   * @returns {Promise} Mapping result
   *
   * Expected payload format:
   * {
   *   projectId: 1,
   *   employees: [
   *     { employeeId: 5, isPrimary: true },
   *     { employeeId: 6, isPrimary: false }
   *   ]
   * }
   */
  mapEmployees: async (projectId, employees) => {
    try {
      const response = await apiClient.post(
        `/ProjectManagement/${projectId}/employees/map`,
        {
          projectId: projectId,
          employees: employees,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to map employees" };
    }
  },

  /**
   * Unmap employees from project
   * @param {number} projectId - Project ID
   * @param {Array} employeeIds - Array of employee IDs
   * @returns {Promise} Unmapping result
   */
  unmapEmployees: async (projectId, employeeIds) => {
    try {
      const response = await apiClient.post(
        `/ProjectManagement/${projectId}/employees/unmap`,
        { projectId, employeeIds }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to unmap employees" };
    }
  },

  /**
   * Get available employees for mapping
   * @returns {Promise} Array of available employees
   */
  getAvailableEmployees: async () => {
    try {
      const response = await apiClient.get(
        "/ProjectManagement/employees/available"
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "Failed to fetch available employees",
        }
      );
    }
  },

  //  EMPLOYEE DATA FOR DROPDOWNS

  /**
   * Get all active employees with details (for Resource Owner dropdown)
   * @returns {Promise} Array of all employees
   */
  getAllEmployees: async () => {
    try {
      const response = await apiClient.get("/EmployeeManagement/all");
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to fetch all employees" }
      );
    }
  },

  /**
   * Get managers only (for L1/L2 Approver dropdowns)
   * @returns {Promise} Array of managers
   */
  getManagers: async () => {
    try {
      const response = await apiClient.get("/EmployeeManagement/managers");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch managers" };
    }
  },

  /**
   * Get employee by ID
   * @param {number} employeeMasterId - Employee Master ID
   * @returns {Promise} Employee details
   */
  getEmployeeById: async (employeeMasterId) => {
    try {
      const response = await apiClient.get(
        `/EmployeeManagement/${employeeMasterId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch employee" };
    }
  },

  /**
   * Search employees by query
   * @param {string} query - Search query
   * @returns {Promise} Array of matching employees
   */
  searchEmployees: async (query) => {
    try {
      const response = await apiClient.get(
        `/EmployeeManagement/search?query=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to search employees" };
    }
  },

  //  DEPARTMENT & BUSINESS UNIT DATA

  /**
   * Get all departments (for Department dropdown)
   * @returns {Promise} Array of departments
   */
  getAllDepartments: async () => {
    try {
      const response = await apiClient.get("/EmployeeManagement/departments");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch departments" };
    }
  },

  /**
   * Get department by ID
   * @param {number} departmentId - Department ID
   * @returns {Promise} Department details
   */
  getDepartmentById: async (departmentId) => {
    try {
      const response = await apiClient.get(
        `/EmployeeManagement/departments/${departmentId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch department" };
    }
  },

  /**
   * Get all business units (for Business Unit dropdown)
   * @returns {Promise} Array of business units
   */
  getAllBusinessUnits: async () => {
    try {
      const response = await apiClient.get(
        "/EmployeeManagement/business-units"
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to fetch business units" }
      );
    }
  },

  /**
   * Get employees by department
   * @param {number} departmentId - Department ID
   * @returns {Promise} Array of employees in department
   */
  getEmployeesByDepartment: async (departmentId) => {
    try {
      const response = await apiClient.get(
        `/EmployeeManagement/department/${departmentId}`
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "Failed to fetch employees by department",
        }
      );
    }
  },

  /**
   * Get employees by role
   * @param {number} roleId - Role ID
   * @returns {Promise} Array of employees with role
   */
  getEmployeesByRole: async (roleId) => {
    try {
      const response = await apiClient.get(
        `/EmployeeManagement/role/${roleId}`
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to fetch employees by role" }
      );
    }
  },

  //  RESOURCE POOL OPERATIONS (NEW)

  /**
   * Get employees with null reporting manager (Initial Stage Employees)
   * @returns {Promise} Array of initial stage employees
   *
   * Returns employees who have:
   * - IsActive = true
   * - ReportingManagerEmployeeId = null
   */
  getInitialStageEmployees: async () => {
    try {
      const response = await apiClient.get("/EmployeeManagement/initial-stage");
      return response.data;
    } catch (error) {
      console.error("Error fetching initial stage employees:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch initial stage employees",
        }
      );
    }
  },

  getPrimaryProjects: async (employeeIds) => {
    try {
      const response = await apiClient.get(
        "/ProjectManagement/employees/primary-projects",
        { employeeIds }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching primary projects:", error);
      throw (
        error.response?.data || { message: "Failed to fetch primary projects" }
      );
    }
  },

  /**
   * Map employees to resource pool (org.rz.resourcepool)
   * @param {Array|Object} input - Array of employee master IDs or { employeeMasterIds: [...] }
   * @returns {Promise} Mapping result
   *
   * This function:
   * 1. Maps selected employees to the "org.rz.resourcepool" project
   * 2. Updates their ReportingManagerEmployeeId to the Resource Pool's L2 Approver
   * 3. Marks them as primary employees for the resource pool
   * 4. Removes from other projects (single project rule)
   *
   * Expected payload format:
   * {
   *   employeeMasterIds: [1, 2, 3, 4]
   * }
   */
  mapToResourcePool: async (input) => {
    try {
      let employeeMasterIds = [];

      if (Array.isArray(input)) {
        employeeMasterIds = input;
      } else if (
        input &&
        typeof input === "object" &&
        Array.isArray(input.employeeMasterIds)
      ) {
        employeeMasterIds = input.employeeMasterIds;
      } else if (input === null || input === undefined) {
        throw new Error(
          "Input cannot be null or undefined. Please provide an array of employeeMasterIds."
        );
      } else {
        // Try to extract array from unexpected input (e.g., if passed a non-array primitive)
        if (Array.isArray(input.value) || Array.isArray(input.ids)) {
          employeeMasterIds = input.value || input.ids || [];
        } else {
          throw new Error(
            `Invalid input type: Expected array or object with employeeMasterIds array. Received: ${JSON.stringify(
              input
            )}`
          );
        }
      }

      // Handle empty array gracefully (backend should return success with mappedCount: 0)
      if (employeeMasterIds.length === 0) {
        console.warn(
          "No employeeMasterIds provided - returning empty success response"
        );
        return { success: true, data: { mappedCount: 0, errors: [] } };
      }

      const payload = { employeeMasterIds };

      const response = await apiClient.post(
        "/EmployeeManagement/map-to-resource-pool",
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error mapping to resource pool:", error);
      throw (
        error.response?.data || {
          message: error.message || "Failed to map employees to resource pool",
          success: false,
        }
      );
    }
  },
};

export default projectService;
