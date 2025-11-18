import hrApi from "./hrApi";

const periodAllocationService = {
  // ========== PERIOD ALLOCATION CRUD ==========

  // Create Period Allocation (Leadership)
  createPeriodAllocation: async (data) => {
    try {
      console.log(" Creating period allocation:", data);
      const response = await hrApi.post("/PeriodAllocation/create", {
        budgetId: data.budgetId,
        period: data.period,
        periodYear: data.periodYear,
        allocatedAmount: data.allocatedAmount,
        allocatedByUserId: data.allocatedByUserId,
        notes: data.notes || "",
      });
      console.log(" Period allocation created:", response.data);
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
      console.log(" Updating period allocation:", data);
      const response = await hrApi.put("/PeriodAllocation/update", {
        periodAllocationId: data.periodAllocationId,
        allocatedAmount: data.allocatedAmount,
        notes: data.notes,
      });
      console.log(" Period allocation updated:", response.data);
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
      console.log(" Deleting period allocation:", periodAllocationId);
      const response = await hrApi.delete(
        `/PeriodAllocation/${periodAllocationId}`
      );
      console.log(" Period allocation deleted:", response.data);
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
      console.log(" Fetching period allocation:", periodAllocationId);
      const response = await hrApi.get(
        `/PeriodAllocation/${periodAllocationId}`
      );
      console.log(" Period allocation details:", response.data);
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
      console.log(" Fetching all period allocations");
      const response = await hrApi.get("/PeriodAllocation/all");
      console.log(" Period allocations:", response.data);
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
      console.log(" Fetching period allocations for budget:", budgetId);
      const response = await hrApi.get(
        `/PeriodAllocation/by-budget/${budgetId}`
      );
      console.log(" Period allocations for budget:", response.data);
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
