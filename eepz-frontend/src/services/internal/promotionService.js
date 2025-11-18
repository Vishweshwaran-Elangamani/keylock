import internalApi from "../internalApi";

const API_BASE = "Promotion";

const promotionService = {
  getAllPromotions: async () => {
    try {
      const response = await internalApi.get(`/${API_BASE}/list`);
      console.log("Get all promotions response:", response.data);

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
      console.log("Creating promotion with data:", promotionData);
      const response = await internalApi.post(
        `/${API_BASE}/create`,
        promotionData
      );
      console.log("Create promotion response:", response.data);

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
      console.log("Pending HR approval response:", response.data);

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
      console.log("Pending leadership approval response:", response.data);

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
      console.log("Approving promotion:", promotionId, approvalData);
      const response = await internalApi.put(
        `/${API_BASE}/${promotionId}/approve`,
        approvalData
      );
      console.log("Approve promotion response:", response.data);

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
      console.log("Rejecting promotion:", promotionId);
      const response = await internalApi.put(
        `/${API_BASE}/${promotionId}/reject`
      );
      console.log("Reject promotion response:", response.data);

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
      console.log("Leadership approving promotion:", promotionId, approvalData);
      const response = await internalApi.put(
        `/${API_BASE}/${promotionId}/leadership-approve`,
        approvalData
      );
      console.log("Leadership approve response:", response.data);

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
      console.log("Leadership rejecting promotion:", promotionId, rejectData);
      const response = await internalApi.put(
        `/${API_BASE}/${promotionId}/leadership-reject`,
        rejectData
      );
      console.log("Leadership reject response:", response.data);

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
