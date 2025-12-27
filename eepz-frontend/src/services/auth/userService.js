import api from "./api";

const userService = {
  // ==================== EXISTING METHODS (UNCHANGED) ====================

  getAllUsers: async () => {
    try {
      const response = await api.get("/User/all");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getUserById: async (userId) => {
    try {
      const response = await api.get(`/User/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post("/User/create", userData);
      return response.data;
    } catch (error) {
      console.error("Create user error:", error.response?.data || error);
      throw error.response?.data || error.message;
    }
  },

  updateUser: async (userData) => {
    try {
      const response = await api.put("/User/update", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deactivateUser: async (userId) => {
    try {
      const response = await api.post(`/User/deactivate/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  activateUser: async (userId) => {
    try {
      const response = await api.post(`/User/activate/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  assignRoleDepartment: async (data) => {
    try {
      const response = await api.post("/User/assign-role-department", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getEmployeesByManager: async (managerId) => {
    try {
      const response = await api.get(`/User/manager/${managerId}/employees`);
      return response.data;
    } catch (error) {
      console.error(
        "Get employees by manager error:",
        error.response?.data || error
      );
      throw error.response?.data || error.message;
    }
  },

  // ==================== NEW METHODS FOR DEPARTMENT HOD ====================

  // Get all active employees (for HOD dropdown in department)
  getActiveEmployees: async () => {
    try {
      const response = await api.get("/User/all");
      // Filter only active users
      if (response.data.success && response.data.data) {
        return {
          ...response.data,
          data: response.data.data.filter((user) => user.status === "Active"),
        };
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get employees by role (optional - if you have this endpoint)
  getEmployeesByRole: async (roleId) => {
    try {
      const response = await api.get(`/User/role/${roleId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get employees by department
  getEmployeesByDepartment: async (departmentId) => {
    try {
      const response = await api.get(`/User/department/${departmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search employees (for HOD autocomplete)
  searchEmployees: async (searchTerm) => {
    try {
      const response = await api.get(
        `/User/search?term=${encodeURIComponent(searchTerm)}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get next available Employee Company ID
  getNextEmployeeCompanyId: async () => {
    try {
      const response = await api.get("/User/next-employee-id");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default userService;
