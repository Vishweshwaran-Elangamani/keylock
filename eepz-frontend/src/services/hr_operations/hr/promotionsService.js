import hrApi from "./hrApi";

const careerProgressionService = {
  //  GET: All promotions
  getAllPromotions: async () => {
    try {
      console.log(" Fetching all promotions");
      const response = await hrApi.get("/CareerProgression/all");
      console.log(" Full Response Object:", response);
      console.log(" response.data:", response.data);

      //  Extract data array from ApiResponseDto
      if (response.data?.data && Array.isArray(response.data.data)) {
        console.log(" Extracted data array:", response.data.data);
        return response.data.data;
      }

      console.warn("⚠️ Unexpected response structure");
      return [];
    } catch (error) {
      console.error(" Error fetching promotions:", error);
      return [];
    }
  },

  //  GET: Promotions by status
  getPromotionsByStatus: async (status) => {
    try {
      console.log(" Fetching promotions by status:", status);
      const response = await hrApi.get(
        `/CareerProgression/by-status/${status}`
      );
      console.log(" Response:", response.data);

      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error(" Error fetching promotions by status:", error);
      return [];
    }
  },

  //  GET: Single promotion
  getPromotionById: async (promotionId) => {
    try {
      console.log(" Fetching promotion:", promotionId);
      const response = await hrApi.get(`/CareerProgression/${promotionId}`);
      console.log(" Response:", response.data);

      if (response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(" Error fetching promotion:", error);
      return null;
    }
  },

  //  GET: Promotions by employee
  getPromotionsByEmployee: async (employeeUserId) => {
    try {
      console.log(" Fetching promotions for employee:", employeeUserId);
      const response = await hrApi.get(
        `/CareerProgression/by-employee/${employeeUserId}`
      );
      console.log(" Response:", response.data);

      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error(" Error fetching employee promotions:", error);
      return [];
    }
  },

  //  CREATE: Create promotion
  createPromotion: async (promotionData) => {
    try {
      console.log(" Creating promotion:", promotionData);
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
      console.log(" Response:", response.data);
      return response.data;
    } catch (error) {
      console.error(" Error creating promotion:", error);
      throw error;
    }
  },

  //  APPROVE: Approve promotion
  approvePromotion: async (promotionId, approvedByUserId) => {
    try {
      console.log(" Approving promotion:", promotionId);
      const response = await hrApi.put(`/CareerProgression/approve`, {
        promotionId: promotionId,
        approvedByUserId: approvedByUserId,
      });
      console.log(" Response:", response.data);
      return response.data;
    } catch (error) {
      console.error(" Error approving promotion:", error);
      throw error;
    }
  },

  //  REJECT: Reject promotion
  rejectPromotion: async (promotionId) => {
    try {
      console.log(" Rejecting promotion:", promotionId);
      const response = await hrApi.put(`/CareerProgression/reject`, {
        promotionId: promotionId,
      });
      console.log(" Response:", response.data);
      return response.data;
    } catch (error) {
      console.error(" Error rejecting promotion:", error);
      throw error;
    }
  },

  //  UPDATE: Update promotion
  updatePromotion: async (promotionId, promotionData) => {
    try {
      console.log(" Updating promotion:", promotionId);
      const response = await hrApi.put(`/CareerProgression/update`, {
        promotionId: promotionId,
        ...promotionData,
      });
      console.log(" Response:", response.data);
      return response.data;
    } catch (error) {
      console.error(" Error updating promotion:", error);
      throw error;
    }
  },

  //  FAIRNESS CHECK: Check for favoritism
  checkFairness: async (promotionId) => {
    try {
      console.log(" Checking fairness for promotion:", promotionId);
      const response = await hrApi.get(
        `/CareerProgression/${promotionId}/favoritism-check`
      );
      console.log(" Response:", response.data);

      if (response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(" Error checking fairness:", error);
      return null;
    }
  },

  //  SUBMIT TO LEADERSHIP: Submit promotion
  submitToLeadership: async (promotionId) => {
    try {
      console.log(" Submitting promotion to leadership:", promotionId);
      const response = await hrApi.put(
        `/CareerProgression/${promotionId}/submit-to-leadership`
      );
      console.log(" Response:", response.data);
      return response.data;
    } catch (error) {
      console.error(" Error submitting to leadership:", error);
      throw error;
    }
  },

  //  UPDATE PAYROLL: Update payroll
  updatePayroll: async (payrollData) => {
    try {
      console.log(" Updating payroll:", payrollData);
      const response = await hrApi.post(
        `/CareerProgression/update-payroll`,
        payrollData
      );
      console.log(" Response:", response.data);
      return response.data;
    } catch (error) {
      console.error(" Error updating payroll:", error);
      throw error;
    }
  },

  //  CHECK PENDING: Check pending promotion
  checkPendingPromotion: async (employeeUserId) => {
    try {
      console.log(" Checking pending promotion for employee:", employeeUserId);
      const response = await hrApi.get(
        `/CareerProgression/check-pending/${employeeUserId}`
      );
      console.log(" Response:", response.data);

      if (response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(" Error checking pending promotion:", error);
      return null;
    }
  },

  //  PENDING REVIEWS: Get pending reviews
  getPendingReviews: async () => {
    try {
      console.log(" Fetching pending reviews");
      const response = await hrApi.get(`/CareerProgression/pending-review`);
      console.log(" Response:", response.data);

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
