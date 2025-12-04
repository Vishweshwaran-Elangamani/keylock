import api from "./api";

const roleService = {
  // Get all roles
  getAllRoles: async () => {
    try {
      const response = await api.get("/Role/all");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get role by ID
  getRoleById: async (roleId) => {
    try {
      const response = await api.get(`/Role/${roleId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new role
  createRole: async (roleData) => {
    try {
      const response = await api.post("/Role/create", roleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update role
  updateRole: async (roleData) => {
    try {
      const response = await api.put("/Role/update", roleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete role
  deleteRole: async (roleId) => {
    try {
      const response = await api.delete(`/Role/${roleId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default roleService;
