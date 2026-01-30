import internalApi from "./internalApi";

const API_BASE = "Nomination";

const nominationService = {
  getAllNominations: async (status = null) => {
    try {
      let url = `/${API_BASE}/all-nomination`; // Changed from all-nominations to all-nomination
      if (status) {
        url += `?status=${encodeURIComponent(status)}`;
      }
      const response = await internalApi.get(url);
      const nominations = response.data?.nominations || response.data || [];
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
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch nominations",
      };
    }
  },

  selfNominate: async (nominationData) => {
    try {
      const response = await internalApi.post(
        `/${API_BASE}/self-nominate`,
        nominationData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to submit self-nomination",
      };
    }
  },

  managerNominate: async (nominationData) => {
    try {
      const response = await internalApi.post(
        `/${API_BASE}/manager-nominate`,
        nominationData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to nominate team member",
      };
    }
  },

  getPendingManagerReview: async () => {
    try {
      const response = await internalApi.get(
        `/${API_BASE}/pending-manager-review`
      );
      let nominations = [];
      if (Array.isArray(response.data)) nominations = response.data;
      else nominations = response.data.nominations || response.data.data || [];
      return {
        success: true,
        data: Array.isArray(nominations) ? nominations : [],
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to fetch pending nominations",
      };
    }
  },

  getPendingDeptHeadReview: async () => {
    try {
      const response = await internalApi.get(
        `/${API_BASE}/pending-depthead-review`
      );
      let nominations = [];
      if (Array.isArray(response.data)) nominations = response.data;
      else nominations = response.data.nominations || response.data.data || [];
      return {
        success: true,
        data: Array.isArray(nominations) ? nominations : [],
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to fetch pending nominations",
      };
    }
  },

  reviewNomination: async (nominationId, reviewData, userRole) => {
    try {
      const endpoint =
        userRole === "Department Head"
          ? `/${API_BASE}/${nominationId}/department-head-review`
          : `/${API_BASE}/${nominationId}/manager-review`;
      const response = await internalApi.put(endpoint, reviewData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to submit review",
      };
    }
  },

  getNominationById: async (id) => {
    try {
      const response = await internalApi.get(`/${API_BASE}/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch nomination",
      };
    }
  },

  getMyNominations: async () => {
    try {
      const response = await internalApi.get(`/${API_BASE}/my-nomination`); // Changed from my-nominations to my-nomination
      let nominations = [];
      if (Array.isArray(response.data)) nominations = response.data;
      else nominations = response.data.nominations || response.data || [];
      return {
        success: true,
        data: Array.isArray(nominations) ? nominations : [],
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch your nominations",
      };
    }
  },

  checkEligibility: async (opportunityId) => {
    try {
      const response = await internalApi.post(
        `/${API_BASE}/check-eligibility`,
        { opportunityId }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to check eligibility",
      };
    }
  },

  getMyNominationHistory: async (status = null) => {
    try {
      let url = `/${API_BASE}/my-history`;
      if (status) {
        url += `?status=${encodeURIComponent(status)}`;
      }
      const response = await internalApi.get(url);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching nomination history:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to fetch nomination history",
      };
    }
  },

  getMyNominationAnalytics: async () => {
    try {
      const response = await nominationService.getAllNominations();
      if (!response.success || !response.data) {
        return { success: false, message: "Failed to fetch nominations" };
      }
      const nominations = response.data;
      const totalCount = nominations.length;
      const normalize = (status) => {
        if (!status) return "";
        let s = String(status).trim().toLowerCase();
        return s.replace(/^["']|["']$/g, "");
      };
      const approvedCount = nominations.filter((n) =>
        normalize(n.status).includes("approved")
      ).length;
      const pendingCount = nominations.filter((n) =>
        normalize(n.status).includes("pending")
      ).length;
      const rejectedCount = nominations.filter((n) =>
        normalize(n.status).includes("rejected")
      ).length;
      return {
        success: true,
        data: {
          totalNominations: totalCount,
          approved: approvedCount,
          pending: pendingCount,
          rejected: rejectedCount,
          data: [
            { label: "Total Nominations", value: totalCount, color: "#f3c5d8" },
            { label: "Approved", value: approvedCount, color: "#d4f4dd" },
            { label: "Pending", value: pendingCount, color: "#fff4e0" },
            { label: "Rejected", value: rejectedCount, color: "#ffd6d6" },
          ],
        },
      };
    } catch (error) {
      console.error("Analytics calculation error:", error);
      return { success: false, message: "Failed to calculate analytics" };
    }
  },
};

export default nominationService;
