import api from "./api";

const departmentService = {
  // Get all departments
  getAllDepartments: async () => {
    try {
      const response = await api.get("/Department/all");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get department by ID
  getDepartmentById: async (departmentId) => {
    try {
      const response = await api.get(`/Department/${departmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new department
  createDepartment: async (departmentData) => {
    try {
      const response = await api.post("/Department/create", departmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update department
  updateDepartment: async (departmentData) => {
    try {
      const response = await api.put("/Department/update", departmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete department
  deleteDepartment: async (departmentId) => {
    try {
      const response = await api.delete(`/Department/${departmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default departmentService;
