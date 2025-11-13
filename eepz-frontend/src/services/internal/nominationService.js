import internalApi from "../internalApi";

const API_BASE = "Nomination";

const nominationService = {
  getAllNominations: async () => {
    try {
      const response = await internalApi.get(`/${API_BASE}/all-nominations`);
      console.log("All nominations RAW response:", response.data);
      console.log("Response type:", typeof response.data);
      
      const nominations = response.data?.nominations || response.data || [];
      console.log("Extracted nominations:", nominations);
      console.log("Count:", nominations.length);
      
      return {
        success: true,
        data: Array.isArray(nominations) ? nominations : [],
        pagination: {
          totalCount: response.data?.totalCount || nominations.length,
          pageNumber: response.data?.pageNumber || 1,
          pageSize: response.data?.pageSize || 10,
          totalPages: response.data?.totalPages || 1,
        },
      };
    } catch (error) {
      console.error("Get all nominations error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch nominations",
      };
    }
  },

  selfNominate: async (nominationData) => {
    try {
      console.log("Self nominate request:", nominationData);
      const response = await internalApi.post(`/${API_BASE}/self-nominate`, nominationData);
      console.log("Self nominate response:", response.data);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Self nominate error:", error);
      console.error("Error response:", error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || "Failed to submit self-nomination",
      };
    }
  },

  managerNominate: async (nominationData) => {
    try {
      console.log("Manager nominate request:", nominationData);
      const response = await internalApi.post(`/${API_BASE}/manager-nominate`, nominationData);
      console.log("Manager nominate response:", response.data);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Manager nominate error:", error);
      console.error("Error response:", error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || "Failed to nominate team member",
      };
    }
  },

  getPendingManagerReview: async () => {
    try {
      const response = await internalApi.get(`/${API_BASE}/pending-manager-review`);
      console.log("Pending manager review RAW response:", response.data);
      console.log("Response type:", typeof response.data);
      console.log("Is Array?:", Array.isArray(response.data));
      
      let nominations;
      if (Array.isArray(response.data)) {
        nominations = response.data;
      } else if (response.data && typeof response.data === 'object') {
        nominations = response.data.nominations || response.data.data || [];
      } else {
        nominations = [];
      }
      
      console.log("Extracted nominations:", nominations);
      console.log("Count:", nominations.length);
      
      return {
        success: true,
        data: Array.isArray(nominations) ? nominations : [],
      };
    } catch (error) {
      console.error("Get pending manager review error:", error);
      console.error("Error response:", error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch pending nominations",
      };
    }
  },

  getPendingDeptHeadReview: async () => {
    try {
      const response = await internalApi.get(`/${API_BASE}/pending-depthead-review`);
      console.log("Pending dept head review RAW response:", response.data);
      console.log("Response type:", typeof response.data);
      console.log("Is Array?:", Array.isArray(response.data));
      console.log("Has nominations property?:", response.data?.nominations);
      
      let nominations;
      if (Array.isArray(response.data)) {
        nominations = response.data;
        console.log("Response is direct array");
      } else if (response.data && typeof response.data === 'object') {
        nominations = response.data.nominations || response.data.data || [];
        console.log("Response is paginated object, extracted nominations");
      } else {
        nominations = [];
        console.warn("Unknown response format");
      }
      
      console.log("Extracted nominations:", nominations);
      console.log("Count:", nominations.length);
      
      if (nominations.length > 0) {
        console.log("First nomination sample:", nominations[0]);
      }
      
      return {
        success: true,
        data: Array.isArray(nominations) ? nominations : [],
      };
    } catch (error) {
      console.error("Get pending dept head review error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch pending nominations",
      };
    }
  },

  reviewNomination: async (nominationId, reviewData, userRole) => {
    try {
      console.log("Reviewing nomination:", nominationId, reviewData, userRole);
      
      let endpoint;
      if (userRole === "Department Head") {
        endpoint = `/${API_BASE}/${nominationId}/department-head-review`;
      } else {
        endpoint = `/${API_BASE}/${nominationId}/manager-review`;
      }

      const response = await internalApi.put(endpoint, reviewData);

      console.log("Review response:", response.data);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Review nomination error:", error);
      console.error("Error response:", error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || "Failed to submit review",
      };
    }
  },

  managerReview: async (nominationId, reviewData) => {
    try {
      console.log(`Manager review - Nomination ID: ${nominationId}`, reviewData);
      const response = await internalApi.put(
        `/${API_BASE}/${nominationId}/manager-review`,
        reviewData
      );
      console.log("Manager review response:", response.data);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Manager review error:", error);
      console.error("Error response:", error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || "Failed to review nomination",
      };
    }
  },

  deptHeadReview: async (nominationId, reviewData) => {
    try {
      console.log(`Dept head review - Nomination ID: ${nominationId}`, reviewData);
      const response = await internalApi.put(
        `/${API_BASE}/${nominationId}/department-head-review`,
        reviewData
      );
      console.log("Dept head review response:", response.data);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Dept head review error:", error);
      console.error("Error response:", error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || "Failed to review nomination",
      };
    }
  },

  getNominationById: async (id) => {
    try {
      console.log(`Get nomination by ID: ${id}`);
      const response = await internalApi.get(`/${API_BASE}/${id}`);
      console.log("Nomination details:", response.data);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Get nomination by ID (${id}) error:`, error);
      
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch nomination",
      };
    }
  },

  getMyNominations: async () => {
    try {
      const response = await internalApi.get(`/${API_BASE}/my-nominations`);
      console.log("My nominations RAW response:", response.data);
      
      const nominations = response.data?.nominations || response.data || [];
      console.log("My nominations extracted:", nominations);
      console.log("Count:", nominations.length);
      
      return {
        success: true,
        data: Array.isArray(nominations) ? nominations : [],
      };
    } catch (error) {
      console.error("Get my nominations error:", error);
      console.error("Error response:", error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch your nominations",
      };
    }
  },

  checkEligibility: async (opportunityId) => {
    try {
      console.log(`Check eligibility for opportunity: ${opportunityId}`);
      const response = await internalApi.post(`/${API_BASE}/check-eligibility`, {
        opportunityId,
      });
      console.log("Eligibility check response:", response.data);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Check eligibility error:", error);
      console.error("Error response:", error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || "Failed to check eligibility",
      };
    }
  },
};

export default nominationService;
