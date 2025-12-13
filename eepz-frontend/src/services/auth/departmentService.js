import api from "./api";


const departmentService = {
  // Get all departments
  getAllDepartments: async () => {
    try {
      const response = await api.get("/RoleDepartmentManagement/department/all");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },


  // Get department by ID
  getDepartmentById: async (departmentId) => {
    try {
      const response = await api.get(`/RoleDepartmentManagement/department/${departmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },


  // Create new department
  createDepartment: async (departmentData) => {
    try {
      const response = await api.post("/RoleDepartmentManagement/department/create", departmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },


  // Update department
  updateDepartment: async (departmentData) => {
    try {
      const response = await api.put("/RoleDepartmentManagement/department/update", departmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },


  // Delete department
  deleteDepartment: async (departmentId) => {
    try {
      const response = await api.delete(`/RoleDepartmentManagement/department/${departmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};


export default departmentService;
