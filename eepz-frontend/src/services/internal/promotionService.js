import internalApi from "./internalApi";

const API_BASE = "Promotion";

const promotionService = {
  getAllPromotions: async () => {
    try {
      const response = await internalApi.get(`/${API_BASE}/list`);

      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
      };
    } catch (error) {
      console.error("Get all promotions error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch promotions",
        data: [],
      };
    }
  },

  createPromotion: async (promotionData) => {
    try {
      const response = await internalApi.post(
        `/${API_BASE}/create`,
        promotionData
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Create promotion error:", error);
      console.error("Error details:", error.response?.data);

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.errors ||
          "Failed to create promotion",
      };
    }
  },

  getPendingHRApproval: async () => {
    try {
      const response = await internalApi.get(
        `/${API_BASE}/pending-hr-approval`
      );

      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
      };
    } catch (error) {
      console.error("Get pending HR approval error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch promotions",
        data: [],
      };
    }
  },

  getPendingLeadershipApproval: async () => {
    try {
      const response = await internalApi.get(
        `/${API_BASE}/pending-leadership-approval`
      );

      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
      };
    } catch (error) {
      console.error("Get pending leadership approval error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch promotions",
        data: [],
      };
    }
  },

  approvePromotion: async (promotionId, approvalData) => {
    try {
      const response = await internalApi.put(
        `/${API_BASE}/${promotionId}/approve`,
        approvalData
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Approve promotion error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to approve promotion",
      };
    }
  },

  rejectPromotion: async (promotionId) => {
    try {
      const response = await internalApi.put(
        `/${API_BASE}/${promotionId}/reject`
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Reject promotion error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to reject promotion",
      };
    }
  },

  leadershipApprove: async (promotionId, approvalData) => {
    try {
      const response = await internalApi.put(
        `/${API_BASE}/${promotionId}/leadership-approve`,
        approvalData
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Leadership approve error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to approve promotion",
      };
    }
  },

  leadershipReject: async (promotionId, rejectData) => {
    try {
      const response = await internalApi.put(
        `/${API_BASE}/${promotionId}/leadership-reject`,
        rejectData
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Leadership reject error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to reject promotion",
      };
    }
  },

  getPromotionById: async (id) => {
    try {
      const response = await internalApi.get(`/${API_BASE}/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch promotion",
      };
    }
  },

  getEmployeePromotions: async (employeeUserId) => {
    try {
      const response = await internalApi.get(
        `/${API_BASE}/employee/${employeeUserId}`
      );
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to fetch employee promotions",
      };
    }
  },

  getPromotionHistory: async (employeeUserId) => {
    try {
      const response = await internalApi.get(
        `/${API_BASE}/history/${employeeUserId}`
      );
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch promotion history",
      };
    }
  },
};

export default promotionService;
