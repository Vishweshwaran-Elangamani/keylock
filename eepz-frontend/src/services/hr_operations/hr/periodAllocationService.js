import hrApi from "./hrApi";

const periodAllocationService = {
  // ========== PERIOD ALLOCATION CRUD ==========

  // Create Period Allocation (Leadership)
  createPeriodAllocation: async (data) => {
    try {
      const response = await hrApi.post("/PeriodAllocation/create", {
        budgetId: data.budgetId,
        period: data.period,
        periodYear: data.periodYear,
        allocatedAmount: data.allocatedAmount,
        allocatedByUserId: data.allocatedByUserId,
        notes: data.notes || "",
      });
      return response.data;
    } catch (error) {
      console.error(" Error creating period allocation:", error);
      throw (
        error.response?.data || {
          message: "Failed to create period allocation",
        }
      );
    }
  },

  // Update Period Allocation (Leadership)
  updatePeriodAllocation: async (data) => {
    try {
      const response = await hrApi.put("/PeriodAllocation/update", {
        periodAllocationId: data.periodAllocationId,
        allocatedAmount: data.allocatedAmount,
        notes: data.notes,
      });
      return response.data;
    } catch (error) {
      console.error(" Error updating period allocation:", error);
      throw (
        error.response?.data || {
          message: "Failed to update period allocation",
        }
      );
    }
  },

  // Delete Period Allocation (Leadership)
  deletePeriodAllocation: async (periodAllocationId) => {
    try {
      const response = await hrApi.delete(
        `/PeriodAllocation/${periodAllocationId}`
      );
      return response.data;
    } catch (error) {
      console.error(" Error deleting period allocation:", error);
      throw (
        error.response?.data || {
          message: "Failed to delete period allocation",
        }
      );
    }
  },

  // Get Period Allocation by ID
  getPeriodAllocationById: async (periodAllocationId) => {
    try {
      const response = await hrApi.get(
        `/PeriodAllocation/${periodAllocationId}`
      );
      return response.data;
    } catch (error) {
      console.error(" Error fetching period allocation:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch period allocation",
        }
      );
    }
  },

  // Get All Period Allocations
  getAllPeriodAllocations: async () => {
    try {
      const response = await hrApi.get("/PeriodAllocation/all");
      return response.data;
    } catch (error) {
      console.error(" Error fetching period allocations:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch period allocations",
        }
      );
    }
  },

  // Get Period Allocations by Budget ID
  getPeriodAllocationsByBudget: async (budgetId) => {
    try {
      const response = await hrApi.get(
        `/PeriodAllocation/by-budget/${budgetId}`
      );
      return response.data;
    } catch (error) {
      console.error(" Error fetching period allocations by budget:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch period allocations",
        }
      );
    }
  },
};

export default periodAllocationService;
