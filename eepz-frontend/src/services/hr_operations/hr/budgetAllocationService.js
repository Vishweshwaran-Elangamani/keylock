import hrApi from "./hrApi";
 
const budgetAllocationService = {
  // LEADERSHIP: Create Department Budget
  createDepartmentBudget: async (budgetData) => {
    try {
      const response = await hrApi.post(
        "/FundAllocation/department-budgets/create",
        {
          departmentId: budgetData.departmentId,
          fiscalYear: budgetData.fiscalYear,
          totalBudget: budgetData.totalBudget,
          allocatedAmount: budgetData.allocatedAmount || 0,
        }
      );
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
      const response = await hrApi.delete(
        `/FundAllocation/department-budgets/${budgetId}`
      );
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
      const response = await hrApi.get(
        "/FundAllocation/department-budgets/all"
      );
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
      const response = await hrApi.get(
        `/FundAllocation/department-budgets/department/${budgetId}`
      );
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
      const response = await hrApi.get(
        `/FundAllocation/department-budgets/department/${departmentId}`
      );
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
      const response = await hrApi.post("/FundAllocation/create", {
        departmentId: allocationData.departmentId,
        employeeUserId: allocationData.employeeUserId || null,
        allocationType: allocationData.allocationType,
        amount: allocationData.amount,
        goalStatus: allocationData.goalStatus || "Pending",
        notes: allocationData.notes || "",
        allocatedByUserId: allocationData.allocatedByUserId,
      });
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
      const response = await hrApi.put("/FundAllocation/update", {
        allocationId: allocationData.allocationId,
        amount: allocationData.amount,
        goalStatus: allocationData.goalStatus,
        notes: allocationData.notes,
      });
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
      const response = await hrApi.delete(`/FundAllocation/${allocationId}`);
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
 
  // ========== HR: CREATE SUB-ALLOCATION FROM PERIOD ==========
  createFundAllocationFromPeriod: async (allocationData) => {
    try {
      const response = await hrApi.post("/FundAllocation/create", {
        budgetId: allocationData.budgetId,
        departmentId: allocationData.departmentId,
        allocationType: allocationData.allocationType,
        amount: allocationData.amount,
        goalStatus: allocationData.goalStatus || "Approved",
        notes: allocationData.notes || "",
        allocatedByUserId: allocationData.allocatedByUserId,
        period: allocationData.period,  // NEW
        periodYear: allocationData.periodYear,  // NEW
      });
      return response.data;
    } catch (error) {
      console.error("Error creating fund allocation:", error);
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
      const response = await hrApi.put(
        "/FundAllocation/department-budgets/update-utilized",
        {
          budgetId: budgetData.budgetId,
          utilizedAmount: budgetData.utilizedAmount,
        }
      );
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
    const response = await hrApi.get(`/FundAllocation/by-budget/${budgetId}`);
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
      const response = await hrApi.get(`/FundAllocation/by-department/${departmentId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching fund allocations by department:", error);
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
      const response = await hrApi.get(`/FundAllocation/by-type/${type}`);
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
      const response = await hrApi.get("/EmployeeData/department/all");
      return response.data;
    } catch (error) {
      console.error("Error fetching departments:", error);
      throw error.response?.data || { message: "Failed to fetch departments" };
    }
  },
 
  // NEW: DEPT HEAD - Update Utilization for Allocation
  updateUtilization: async (data) => {
    try {
      const response = await hrApi.put("/FundAllocation/update-utilization", {
        allocationId: data.allocationId,
        utilizedAmount: data.utilizedAmount,
        utilizationPercentage: data.utilizationPercentage,
        notes: data.notes,
        updatedByUserId: data.updatedByUserId,
      });
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
