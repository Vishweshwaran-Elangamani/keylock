import hrApi from "./hrApi";
const careerProgressionService = {
  getAllPromotions: async () => {
    try {
      const response = await hrApi.get("/CareerProgression/all");
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      console.warn(" Unexpected response structure");
      return [];
    } catch (error) {
      console.error(" Error fetching promotions:", error);
      return [];
    }
  },
  getPromotionsByStatus: async (status) => {
    try {
      const response = await hrApi.get(
        `/CareerProgression/by-status/${status}`
      );
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error(" Error fetching promotions by status:", error);
      return [];
    }
  },
  getPromotionById: async (promotionId) => {
    try {
      const response = await hrApi.get(`/CareerProgression/${promotionId}`);
      if (response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(" Error fetching promotion:", error);
      return null;
    }
  },
  getPromotionsByEmployee: async (employeeUserId) => {
    try {
      const response = await hrApi.get(
        `/CareerProgression/by-employee/${employeeUserId}`
      );
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error(" Error fetching employee promotions:", error);
      return [];
    }
  },
  createPromotion: async (promotionData) => {
    try {
      const response = await hrApi.post("/CareerProgression/create", {
        employeeUserId: promotionData.employeeUserId,
        departmentId: promotionData.departmentId,
        oldRole: promotionData.oldRole,
        newRole: promotionData.newRole,
        oldSalary: promotionData.oldSalary,
        newSalary: promotionData.newSalary,
        promotionDate: promotionData.promotionDate,
        justification: promotionData.justification,
        managerId: promotionData.managerId,
      });
      return response.data;
    } catch (error) {
      console.error(" Error creating promotion:", error);
      throw error;
    }
  },
  approvePromotion: async (promotionId, approvedByUserId) => {
    try {
      const response = await hrApi.put(`/CareerProgression/approve`, {
        promotionId: promotionId,
        approvedByUserId: approvedByUserId,
      });
      return response.data;
    } catch (error) {
      console.error(" Error approving promotion:", error);
      throw error;
    }
  },
  rejectPromotion: async (promotionId) => {
    try {
      const response = await hrApi.put(`/CareerProgression/reject`, {
        promotionId: promotionId,
      });
      return response.data;
    } catch (error) {
      console.error(" Error rejecting promotion:", error);
      throw error;
    }
  },
  updatePromotion: async (promotionId, promotionData) => {
    try {
      const response = await hrApi.put(`/CareerProgression/update`, {
        promotionId: promotionId,
        ...promotionData,
      });
      return response.data;
    } catch (error) {
      console.error(" Error updating promotion:", error);
      throw error;
    }
  },
  checkFairness: async (promotionId) => {
    try {
      const response = await hrApi.get(
        `/CareerProgression/${promotionId}/favoritism-check`
      );
      if (response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(" Error checking fairness:", error);
      return null;
    }
  },
  submitToLeadership: async (promotionId) => {
    try {
      const response = await hrApi.put(
        `/CareerProgression/${promotionId}/submit-to-leadership`
      );
      return response.data;
    } catch (error) {
      console.error(" Error submitting to leadership:", error);
      throw error;
    }
  },
  updatePayroll: async (payrollData) => {
    try {
      const response = await hrApi.post(
        `/CareerProgression/update-payroll`,
        payrollData
      );
      return response.data;
    } catch (error) {
      console.error(" Error updating payroll:", error);
      throw error;
    }
  },
  checkPendingPromotion: async (employeeUserId) => {
    try {
      const response = await hrApi.get(
        `/CareerProgression/check-pending/${employeeUserId}`
      );
      if (response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(" Error checking pending promotion:", error);
      return null;
    }
  },
  getPendingReviews: async () => {
    try {
      const response = await hrApi.get(`/CareerProgression/pending-review`);
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error(" Error fetching pending reviews:", error);
      return [];
    }
  },
};
export default careerProgressionService;
