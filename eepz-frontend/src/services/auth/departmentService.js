import api from "./api";

const departmentService = {
  // ==================== EXISTING METHODS (UNCHANGED) ====================
  
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

  // ==================== NEW METHODS ====================

  // Get active departments (for parent dropdown)
  getActiveDepartments: async () => {
    try {
      const response = await api.get("/RoleDepartmentManagement/department/status/active");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get root departments
  getRootDepartments: async () => {
    try {
      const response = await api.get("/RoleDepartmentManagement/department/hierarchy/roots");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get department hierarchy tree
  getDepartmentHierarchyTree: async (rootDepartmentId = null) => {
    try {
      const url = rootDepartmentId 
        ? `/RoleDepartmentManagement/department/hierarchy/tree?rootDepartmentId=${rootDepartmentId}`
        : "/RoleDepartmentManagement/department/hierarchy/tree";
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get child departments
  getChildDepartments: async (parentDepartmentId) => {
    try {
      const response = await api.get(`/RoleDepartmentManagement/department/${parentDepartmentId}/children`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get department path (breadcrumb)
  getDepartmentPath: async (departmentId) => {
    try {
      const response = await api.get(`/RoleDepartmentManagement/department/${departmentId}/path`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update department status
  updateDepartmentStatus: async (departmentId, status) => {
    try {
      const response = await api.patch(
        `/RoleDepartmentManagement/department/${departmentId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Assign HOD to department
  assignHod: async (departmentId, hodEmployeeId) => {
    try {
      const response = await api.post(
        `/RoleDepartmentManagement/department/${departmentId}/hod/assign`,
        { hodEmployeeId }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Remove HOD from department
  removeHod: async (departmentId) => {
    try {
      const response = await api.delete(
        `/RoleDepartmentManagement/department/${departmentId}/hod/remove`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search departments
  searchDepartments: async (searchTerm) => {
    try {
      const response = await api.get(
        `/RoleDepartmentManagement/department/search?searchTerm=${encodeURIComponent(searchTerm)}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get department by code
  getDepartmentByCode: async (departmentCode) => {
    try {
      const response = await api.get(`/RoleDepartmentManagement/department/code/${departmentCode}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get department statistics
  getTotalDepartmentCount: async () => {
    try {
      const response = await api.get("/RoleDepartmentManagement/department/statistics/total");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getActiveDepartmentCount: async () => {
    try {
      const response = await api.get("/RoleDepartmentManagement/department/statistics/active-count");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default departmentService;
