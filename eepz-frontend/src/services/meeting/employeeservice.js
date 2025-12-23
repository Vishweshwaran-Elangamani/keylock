// src/services/meeting/employeeservice.js
import api_meet from "./index_meet"; // Use the same API instance as momService

const employeeService = {
  // ========= EMPLOYEE OPERATIONS =========

  /**
   * Get all active employees
   * Endpoint: GET /api/EmployeeManagement/all
   */
  getAllEmployees: async () => {
    try {
      const response = await api_meet.get("/EmployeeManagement/all");
      return response.data; // { success: true, data: [...] }
    } catch (error) {
      console.error("Get all employees error:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get employee by EmployeeMasterId
   * Endpoint: GET /api/EmployeeManagement/{employeeMasterId}
   */
  getEmployeeById: async (employeeMasterId) => {
    try {
      const response = await api_meet.get(
        `/EmployeeManagement/${employeeMasterId}`
      );
      return response.data; // { success: true, data: {...} }
    } catch (error) {
      console.error(`Get employee ${employeeMasterId} error:`, error);
      throw error.response?.data || error;
    }
  },

  /** Get only managers */
  getManagers: async () => {
    try {
      const response = await api_meet.get("/EmployeeManagement/managers");
      return response.data;
    } catch (error) {
      console.error("Get managers error:", error);
      throw error.response?.data || error;
    }
  },

  /** Search employees */
  searchEmployees: async (query) => {
    try {
      const response = await api_meet.get("/EmployeeManagement/search", {
        params: { query },
      });
      return response.data;
    } catch (error) {
      console.error("Search employees error:", error);
      throw error.response?.data || error;
    }
  },

  /** Get employees by department */
  getEmployeesByDepartment: async (departmentId) => {
    try {
      const response = await api_meet.get(
        `/EmployeeManagement/department/${departmentId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Get employees by department ${departmentId} error:`,
        error
      );
      throw error.response?.data || error;
    }
  },

  /** Get employees by role */
  getEmployeesByRole: async (roleId) => {
    try {
      const response = await api_meet.get(`/EmployeeManagement/role/${roleId}`);
      return response.data;
    } catch (error) {
      console.error(`Get employees by role ${roleId} error:`, error);
      throw error.response?.data || error;
    }
  },

  // ========= DEPARTMENT OPERATIONS =========

  getAllDepartments: async () => {
    try {
      const response = await api_meet.get("/EmployeeManagement/departments");
      return response.data;
    } catch (error) {
      console.error("Get all departments error:", error);
      throw error.response?.data || error;
    }
  },

  getDepartmentById: async (departmentId) => {
    try {
      const response = await api_meet.get(
        `/EmployeeManagement/departments/${departmentId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Get department ${departmentId} error:`, error);
      throw error.response?.data || error;
    }
  },

  getAllBusinessUnits: async () => {
    try {
      const response = await api_meet.get(
        "/EmployeeManagement/business-units"
      );
      return response.data;
    } catch (error) {
      console.error("Get all business units error:", error);
      throw error.response?.data || error;
    }
  },
};

export default employeeService;
