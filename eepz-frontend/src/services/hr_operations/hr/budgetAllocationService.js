import hrApi from "./hrApi";

const budgetAllocationService = {
  // LEADERSHIP: Create Department Budget
  createDepartmentBudget: async (budgetData) => {
    try {
      console.log("Creating department budget:", budgetData);
      const response = await hrApi.post(
        "/FundAllocation/department-budgets/create",
        {
          departmentId: budgetData.departmentId,
          fiscalYear: budgetData.fiscalYear,
          totalBudget: budgetData.totalBudget,
          allocatedAmount: budgetData.allocatedAmount || 0,
        }
      );
      console.log("Department budget created:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating department budget:", error);
      throw (
        error.response?.data || {
          message: "Failed to create department budget",
        }
      );
    }
  },

  // LEADERSHIP: Update Department Budget
  updateDepartmentBudget: async (budgetData) => {
    try {
      console.log("Updating department budget:", budgetData);
      const response = await hrApi.put(
        "/FundAllocation/department-budgets/update",
        {
          budgetId: budgetData.budgetId,
          departmentId: budgetData.departmentId,
          fiscalYear: budgetData.fiscalYear,
          totalBudget: budgetData.totalBudget,
          allocatedAmount: budgetData.allocatedAmount,
        }
      );
      console.log("Department budget updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating department budget:", error);
      throw (
        error.response?.data || {
          message: "Failed to update department budget",
        }
      );
    }
  },

  // LEADERSHIP: Delete Department Budget
  deleteDepartmentBudget: async (budgetId) => {
    try {
      console.log("Deleting department budget:", budgetId);
      const response = await hrApi.delete(
        `/FundAllocation/department-budgets/${budgetId}`
      );
      console.log("Department budget deleted:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error deleting department budget:", error);
      throw (
        error.response?.data || {
          message: "Failed to delete department budget",
        }
      );
    }
  },

  // GET: All Department Budgets
  getAllDepartmentBudgets: async () => {
    try {
      console.log("Fetching all department budgets");
      const response = await hrApi.get(
        "/FundAllocation/department-budgets/all"
      );
      console.log("Department budgets:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching department budgets:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch department budgets",
        }
      );
    }
  },

  // GET: Department Budget by ID
  getDepartmentBudgetById: async (budgetId) => {
    try {
      console.log("Fetching department budget:", budgetId);
      const response = await hrApi.get(
        `/FundAllocation/department-budgets/department/${budgetId}`
      );
      console.log("Department budget details:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching department budget:", error);
      throw (
        error.response?.data || { message: "Failed to fetch department budget" }
      );
    }
  },

  // GET: Department Budgets by Department
  getDepartmentBudgetsByDepartment: async (departmentId) => {
    try {
      console.log("Fetching budgets for department:", departmentId);
      const response = await hrApi.get(
        `/FundAllocation/department-budgets/department/${departmentId}`
      );
      console.log("Department budgets:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching department budgets:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch department budgets",
        }
      );
    }
  },

  // HR/DEPTHEAD: Create Budget Allocation
  createBudgetAllocation: async (allocationData) => {
    try {
      console.log("Creating budget allocation:", allocationData);
      const response = await hrApi.post("/FundAllocation/create", {
        departmentId: allocationData.departmentId,
        employeeUserId: allocationData.employeeUserId || null,
        allocationType: allocationData.allocationType,
        amount: allocationData.amount,
        goalStatus: allocationData.goalStatus || "Pending",
        notes: allocationData.notes || "",
        allocatedByUserId: allocationData.allocatedByUserId,
      });
      console.log("Budget allocation created:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating budget allocation:", error);
      throw (
        error.response?.data || {
          message: "Failed to create budget allocation",
        }
      );
    }
  },

  // HR/DEPTHEAD: Update Budget Allocation
  updateBudgetAllocation: async (allocationData) => {
    try {
      console.log("Updating budget allocation:", allocationData);
      const response = await hrApi.put("/FundAllocation/update", {
        allocationId: allocationData.allocationId,
        amount: allocationData.amount,
        goalStatus: allocationData.goalStatus,
        notes: allocationData.notes,
      });
      console.log("Budget allocation updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating budget allocation:", error);
      throw (
        error.response?.data || {
          message: "Failed to update budget allocation",
        }
      );
    }
  },

  // HR/DEPTHEAD: Delete Budget Allocation
  deleteBudgetAllocation: async (allocationId) => {
    try {
      console.log("Deleting budget allocation:", allocationId);
      const response = await hrApi.delete(`/FundAllocation/${allocationId}`);
      console.log("Budget allocation deleted:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error deleting budget allocation:", error);
      throw (
        error.response?.data || {
          message: "Failed to delete budget allocation",
        }
      );
    }
  },
  // Add to existing budgetAllocationService.js after line 180

  // ========== HR: CREATE SUB-ALLOCATION FROM PERIOD ==========
  createFundAllocationFromPeriod: async (allocationData) => {
    try {
      console.log(" Creating fund allocation from period:", allocationData);
      const response = await hrApi.post("/FundAllocation/create", {
        budgetId: allocationData.budgetId,
        departmentId: allocationData.departmentId,
        allocationType: allocationData.allocationType,
        amount: allocationData.amount,
        goalStatus: allocationData.goalStatus || "Approved",
        notes: allocationData.notes || "",
        allocatedByUserId: allocationData.allocatedByUserId,
        period: allocationData.period, //  NEW
        periodYear: allocationData.periodYear, //  NEW
      });
      console.log(" Fund allocation created:", response.data);
      return response.data;
    } catch (error) {
      console.error(" Error creating fund allocation:", error);
      throw (
        error.response?.data || {
          message: "Failed to create fund allocation",
        }
      );
    }
  },

  // HR/DEPTHEAD: Update Utilized Amount
  updateUtilizedAmount: async (budgetData) => {
    try {
      console.log("Updating utilized amount:", budgetData);
      const response = await hrApi.put(
        "/FundAllocation/department-budgets/update-utilized",
        {
          budgetId: budgetData.budgetId,
          utilizedAmount: budgetData.utilizedAmount,
        }
      );
      console.log("Utilized amount updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating utilized amount:", error);
      throw (
        error.response?.data || { message: "Failed to update utilized amount" }
      );
    }
  },

  // GET: Budget Allocations by Budget ID
  // In budgetAllocationService.js
  getBudgetAllocationsByBudget: async (budgetId) => {
    try {
      console.log("Fetching allocations for budget:", budgetId);
      const response = await hrApi.get(`/FundAllocation/by-budget/${budgetId}`);
      console.log("Budget allocations:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching budget allocations:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch budget allocations",
        }
      );
    }
  },

  // Add this method to budgetAllocationService.js

  // ========== GET FUND ALLOCATIONS BY DEPARTMENT ==========
  getFundAllocationsByDepartment: async (departmentId) => {
    try {
      console.log(" Fetching fund allocations for department:", departmentId);
      const response = await hrApi.get(
        `/FundAllocation/by-department/${departmentId}`
      );
      console.log(" Fund allocations by department:", response.data);
      return response.data;
    } catch (error) {
      console.error(" Error fetching fund allocations by department:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch fund allocations by department",
        }
      );
    }
  },

  // GET: Budget Allocations by Type
  getBudgetAllocationsByType: async (type) => {
    try {
      console.log("Fetching allocations by type:", type);
      const response = await hrApi.get(`/FundAllocation/by-type/${type}`);
      console.log("Budget allocations by type:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching budget allocations:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch budget allocations",
        }
      );
    }
  },

  // GET: All Departments
  getAllDepartments: async () => {
    try {
      console.log("Fetching all departments");
      const response = await hrApi.get("/Department/all");
      console.log("Departments:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching departments:", error);
      throw error.response?.data || { message: "Failed to fetch departments" };
    }
  },

  // NEW: DEPT HEAD - Update Utilization for Allocation
  updateUtilization: async (data) => {
    try {
      console.log("Updating utilization:", data);
      const response = await hrApi.put("/FundAllocation/update-utilization", {
        allocationId: data.allocationId,
        utilizedAmount: data.utilizedAmount,
        utilizationPercentage: data.utilizationPercentage,
        notes: data.notes,
        updatedByUserId: data.updatedByUserId,
      });
      console.log("Utilization updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating utilization:", error);
      throw (
        error.response?.data || {
          message: "Failed to update utilization",
        }
      );
    }
  },
};

export default budgetAllocationService;
