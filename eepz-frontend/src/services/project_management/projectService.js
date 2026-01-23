import apiClient from "./api";

const projectService = {
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

  getProjectById: async (projectId) => {
    try {
      const response = await apiClient.get(`/ProjectManagement/${projectId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch project" };
    }
  },

  createProject: async (projectData) => {
    try {
      const response = await apiClient.post("/ProjectManagement", projectData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to create project" };
    }
  },

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

  /**
   * Get employees (default = all active employees).
   * Supports optional filters:
   * - isManager
   * - departmentId
   * - roleId
   * - searchTerm
   *
   * @param {Object} params
   * @returns {Promise} API response
   */
  getEmployees: async (params = {}) => {
    try {
      const response = await apiClient.get("/employees", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch employees" };
    }
  },

  getAllEmployees: async () => {
    try {
      const response = await apiClient.get("/employees");
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to fetch all employees" }
      );
    }
  },

  getManagers: async () => {
    try {
      const response = await apiClient.get("/employees", {
        params: { isManager: true },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch managers" };
    }
  },

  getEmployeeById: async (employeeId) => {
    try {
      const response = await apiClient.get(`/employees/${employeeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch employee" };
    }
  },

  searchEmployees: async (searchTerm) => {
    try {
      const response = await apiClient.get("/employees", {
        params: { searchTerm },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to search employees" };
    }
  },

  getAllDepartments: async () => {
    try {
      const response = await apiClient.get("/employees/departments");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch departments" };
    }
  },

  getDepartmentById: async (departmentId) => {
    try {
      const response = await apiClient.get(
        `/employees/departments/${departmentId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch department" };
    }
  },

  getAllBusinessUnits: async () => {
    try {
      const response = await apiClient.get("/employees/business-units");
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to fetch business units" }
      );
    }
  },

  getEmployeesByDepartment: async (departmentId) => {
    try {
      const response = await apiClient.get("/employees", {
        params: { departmentId },
      });
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "Failed to fetch employees by department",
        }
      );
    }
  },

  getEmployeesByRole: async (roleId) => {
    try {
      const response = await apiClient.get("/employees", {
        params: { roleId },
      });
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to fetch employees by role" }
      );
    }
  },

  getInitialStageEmployees: async () => {
    try {
      const response = await apiClient.get("/employees/initial-stage");
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
      } else if (Array.isArray(input.value) || Array.isArray(input.ids)) {
        employeeMasterIds = input.value || input.ids || [];
      } else {
        throw new Error(
          `Invalid input type: Expected array or object with employeeMasterIds array. Received: ${JSON.stringify(
            input
          )}`
        );
      }

      if (employeeMasterIds.length === 0) {
        console.warn(
          "No employeeMasterIds provided - returning empty success response"
        );
        return { success: true, data: { mappedCount: 0, errors: [] } };
      }

      const payload = { employeeMasterIds };

      const response = await apiClient.post(
        "/employees/map-to-resource-pool",
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
