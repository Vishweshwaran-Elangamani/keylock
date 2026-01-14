import internalApi from "./internalApi";
const API_BASE = "InternalOpportunity";
const internalOpportunityService = {
  getAllOpportunities: async () => {
    try {
      const response = await internalApi.get(`/${API_BASE}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Get all opportunities error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch opportunities",
      };
    }
  },
  getOpportunityById: async (id) => {
    try {
      const response = await internalApi.get(`/${API_BASE}/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch opportunity",
      };
    }
  },
  createOpportunity: async (opportunityData) => {
    try {
      const response = await internalApi.post(
        `/${API_BASE}/create`,
        opportunityData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Create opportunity error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to create opportunity",
      };
    }
  },
  updateOpportunity: async (id, opportunityData) => {
    try {
      const response = await internalApi.put(
        `/${API_BASE}/update/${id}`,
        opportunityData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to update opportunity",
      };
    }
  },
  deleteOpportunity: async (id) => {
    try {
      await internalApi.delete(`/${API_BASE}/${id}`);
      return {
        success: true,
        message: "Opportunity deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to delete opportunity",
      };
    }
  },
  getActiveOpportunities: async () => {
    try {
      const response = await internalApi.get(`/${API_BASE}/active`);
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to fetch active opportunities",
      };
    }
  },
  getStatistics: async () => {
    try {
      const response = await internalApi.get(`/${API_BASE}/statistics`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch statistics",
      };
    }
  },
};
export default internalOpportunityService;
