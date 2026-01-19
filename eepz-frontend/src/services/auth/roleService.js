import api from "./api";
const roleService = {
  getAllRoles: async () => {
    try {
      const response = await api.get("/RoleDepartmentManagement/role/all");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getRoleById: async (roleId) => {
    try {
      const response = await api.get(`/RoleDepartmentManagement/role/${roleId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  createRole: async (roleData) => {
    try {
      const response = await api.post("/RoleDepartmentManagement/role/create", roleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  updateRole: async (roleData) => {
    try {
      const response = await api.put("/RoleDepartmentManagement/role/update", roleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  deleteRole: async (Id) => {
    try {
      const response = await api.delete(`/RoleDepartmentManagement/role/${Id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
export default roleService;
