import internalApi from "./internalApi";

const API_BASE = "Nomination";

const nominationService = {
  // ✅ ALL nominations (mainly HR/Admin, analytics, etc.)
  getAllNominations: async (status = null) => {
    try {
      let url = `/${API_BASE}/all-nominations`;
      if (status) {
        url += `?status=${encodeURIComponent(status)}`;
      }

      const response = await internalApi.get(url);

      // backend might return: array OR { nominations, totalCount, ... }
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

  // ✅ self nomination (employee_self)
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

  // ✅ manager nomination (manager_nomination)
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

  // ✅ Manager dashboard – items waiting for manager review
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

  // ✅ DeptHead dashboard – items waiting for dept head review
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

  // ✅ Manager / DeptHead review action
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

  // ✅ Single nomination details
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

  // ✅ MAIN: Logged-in employee “My Nominations”
  getMyNominations: async () => {
    try {
      const response = await internalApi.get(`/${API_BASE}/my-nominations`);

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

  // ✅ eligibility check before self nomination
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

  // ✅ history (self + team nominated by user) – backend already filtered
  getMyNominationHistory: async (status = null) => {
    try {
      let url = `/${API_BASE}/my-history`;
      if (status) {
        url += `?status=${encodeURIComponent(status)}`;
      }

      console.log("Fetching nomination history:", url);

      const response = await internalApi.get(url);

      console.log("Nomination History Response:", response.data);

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

  // ✅ analytics – uses getAllNominations then computes counts
  getMyNominationAnalytics: async () => {
    try {
      const response = await nominationService.getAllNominations();
      if (!response.success || !response.data) {
        return { success: false, message: "Failed to fetch nominations" };
      }

      const nominations = response.data;

      console.log("=== ALL NOMINATIONS DEBUG ===");
      console.log("Total nominations fetched:", nominations.length);

      const totalCount = nominations.length;

      const normalize = (status) => {
        if (!status) return "";
        let s = String(status).trim().toLowerCase();
        // remove leading/trailing quotes if any
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

      console.log("=== FINAL COUNTS ===");
      console.log({
        totalNominations: totalCount,
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount,
      });

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
