import api from "./api";
const departmentService = {
  getAllDepartments: async () => {
    try {
      const response = await api.get("/RoleDepartmentManagement/department/all");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getDepartmentById: async (departmentId) => {
    try {
      const response = await api.get(`/RoleDepartmentManagement/department/${departmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  createDepartment: async (departmentData) => {
    try {
      const response = await api.post("/RoleDepartmentManagement/department/create", departmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  updateDepartment: async (departmentData) => {
    try {
      const response = await api.put("/RoleDepartmentManagement/department/update", departmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  deleteDepartment: async (Id) => {
    try {
      const response = await api.delete(`/RoleDepartmentManagement/department/${Id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getActiveDepartments: async () => {
    try {
      const response = await api.get("/RoleDepartmentManagement/department/status/active");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getRootDepartments: async () => {
    try {
      const response = await api.get("/RoleDepartmentManagement/department/hierarchy/roots");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
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
  getChildDepartments: async (parentDepartmentId) => {
    try {
      const response = await api.get(`/RoleDepartmentManagement/department/${parentDepartmentId}/children`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getDepartmentPath: async (departmentId) => {
    try {
      const response = await api.get(`/RoleDepartmentManagement/department/${departmentId}/path`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
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
  getDepartmentByCode: async (departmentCode) => {
    try {
      const response = await api.get(`/RoleDepartmentManagement/department/code/${departmentCode}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
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
