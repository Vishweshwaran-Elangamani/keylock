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
      console.log("Creating user with data:", userData);

      const response = await api.post("/User/create", userData);

      console.log("User created:", response.data);

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
      const response = await api.post(
        "/User/assign-role-department",

        data
      );

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getEmployeesByManager: async (managerId) => {
    try {
      console.log("👥 Fetching employees for manager ID:", managerId);

      const response = await api.get(
        `/User/manager/${managerId}/employees`
      );

      console.log("Employees fetched:", response.data);

      return response.data;
    } catch (error) {
      console.error(
        "Get employees by manager error:",
        error.response?.data || error
      );

      throw error.response?.data || error.message;
    }
  },
};


export default userService;
