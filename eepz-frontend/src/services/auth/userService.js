import api from "./api";
const userService = {
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
  deactivateUser: async (Id) => {
    try {
      const response = await api.post(`/User/deactivate/${Id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  activateUser: async (Id) => {
    try {
      const response = await api.post(`/User/activate/${Id}`);
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
  getActiveEmployees: async () => {
    try {
      const response = await api.get("/User/all");
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
  getEmployeesByRole: async (roleId) => {
    try {
      const response = await api.get(`/User/role/${roleId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getEmployeesByDepartment: async (departmentId) => {
    try {
      const response = await api.get(`/User/department/${departmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
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
