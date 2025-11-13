import hrApi from "../../hrApi";

const costMappingService = {
  //  GET ALL DEPARTMENTS (REAL DATA FROM BACKEND)
  getAllDepartments: async () => {
    try {
      console.log(" Frontend: Fetching all departments from backend");
      const response = await hrApi.get("/Department/all");
      console.log(" Frontend: Departments response:", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching departments", error);
      throw error.response?.data || { message: "Failed to fetch departments" };
    }
  },

  // Get all cost mappings
  getAllCostMappings: async () => {
    try {
      console.log(" Frontend: Fetching all cost mappings");
      const response = await hrApi.get("/CostMapping/all");
      console.log(" Frontend: Response received", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching cost mappings", error);
      throw (
        error.response?.data || { message: "Failed to fetch cost mappings" }
      );
    }
  },

  // Get by ID
  getCostMappingById: async (budgetId) => {
    try {
      const response = await hrApi.get(`/CostMapping/${budgetId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch" };
    }
  },

  // Create new cost mapping
  createCostMapping: async (mappingData) => {
    try {
      console.log(" Frontend: Creating cost mapping", mappingData);
      const response = await hrApi.post("/CostMapping/create", mappingData);
      console.log(" Frontend: Created successfully", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error creating", error);
      throw (
        error.response?.data || { message: "Failed to create cost mapping" }
      );
    }
  },

  // Update cost mapping
  updateCostMapping: async (mappingData) => {
    try {
      console.log(" Frontend: Updating cost mapping", mappingData);
      const response = await hrApi.put("/CostMapping/update", mappingData);
      console.log(" Frontend: Updated successfully", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error updating", error);
      throw (
        error.response?.data || { message: "Failed to update cost mapping" }
      );
    }
  },

  // Delete cost mapping
  deleteCostMapping: async (budgetId) => {
    try {
      console.log(" Frontend: Deleting cost mapping", budgetId);
      const response = await hrApi.delete(`/CostMapping/${budgetId}`);
      console.log(" Frontend: Deleted successfully", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error deleting", error);
      throw (
        error.response?.data || { message: "Failed to delete cost mapping" }
      );
    }
  },

  // Get by department
  getCostMappingsByDepartment: async (departmentId) => {
    try {
      const response = await hrApi.get(
        `/CostMapping/by-department/${departmentId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch" };
    }
  },

  // GET DEPARTMENT HEADCOUNT
  getDepartmentHeadcount: async (departmentId) => {
    try {
      console.log(" Frontend: Fetching headcount for dept:", departmentId);
      const response = await hrApi.get(
        `/CostMapping/headcount/${departmentId}`
      );
      console.log(" Frontend: Headcount response:", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching headcount", error);
      throw error.response?.data || { message: "Failed to fetch headcount" };
    }
  },
};

export default costMappingService;
