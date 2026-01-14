import hrApi from "../hr/hrApi";
const careerGoalsService = {
  getOverview: async () => {
    try {
      const response = await hrApi.get("/EmployeeData/goal-tracking/overview");
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching goals overview:", error);
      throw (
        error.response?.data || { message: "Failed to fetch goals overview" }
      );
    }
  },
  getGoalStatistics: async () => {
    try {
      const response = await hrApi.get("/EmployeeData/goal-tracking/goal-statistics");
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching goal statistics:", error);
      throw (
        error.response?.data || { message: "Failed to fetch goal statistics" }
      );
    }
  },
  getGoalAdoptionRate: async () => {
    try {
      const response = await hrApi.get("/EmployeeData/goal-tracking/goal-adoption-rate");
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching goal adoption rate:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch goal adoption rate",
        }
      );
    }
  },
  getEmployeesWithoutGoals: async () => {
    try {
      const response = await hrApi.get("/EmployeeData/goal-tracking/employees-without-goals");
      return response.data;
    } catch (error) {
      console.error(
        " Frontend: Error fetching employees without goals:",
        error
      );
      throw (
        error.response?.data || {
          message: "Failed to fetch employees without goals",
        }
      );
    }
  },
  getEmployeeGoals: async (userId) => {
    try {
      const response = await hrApi.get(`/EmployeeData/goal-tracking/employee-goals/${userId}`);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching employee goals:", error);
      throw (
        error.response?.data || { message: "Failed to fetch employee goals" }
      );
    }
  },
  getGoalSuggestions: async (userId) => {
    try {
      const response = await hrApi.get(`/EmployeeData/goal-tracking/suggest-goals/${userId}`);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching goal suggestions:", error);
      throw (
        error.response?.data || { message: "Failed to fetch goal suggestions" }
      );
    }
  },
  getAllGoals: async () => {
    try {
      const response = await hrApi.get("/EmployeeData/goal-tracking/goals");
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching all goals:", error);
      throw error.response?.data || { message: "Failed to fetch goals" };
    }
  },
  getGoalById: async (goalId) => {
    try {
      const response = await hrApi.get(`/EmployeeData/goal-tracking/goal/${goalId}`);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching goal:", error);
      throw error.response?.data || { message: "Failed to fetch goal" };
    }
  },
  createGoal: async (goalData) => {
    try {
      const response = await hrApi.post("/EmployeeData/goal-tracking/goal/create", goalData);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error creating goal:", error);
      throw error.response?.data || { message: "Failed to create goal" };
    }
  },
  updateGoal: async (goalData) => {
    try {
      const response = await hrApi.put("/EmployeeData/goal-tracking/goal/update", goalData);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error updating goal:", error);
      throw error.response?.data || { message: "Failed to update goal" };
    }
  },
  deleteGoal: async (goalId) => {
    try {
      const response = await hrApi.delete(`/EmployeeData/goal-tracking/goal/${goalId}`);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error deleting goal:", error);
      throw error.response?.data || { message: "Failed to delete goal" };
    }
  },
  updateGoalProgress: async (goalId, progressData) => {
    try {
      const response = await hrApi.put(
        `/EmployeeData/goal-tracking/goal/${goalId}/progress`,
        progressData
      );
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error updating progress:", error);
      throw (
        error.response?.data || { message: "Failed to update goal progress" }
      );
    }
  },
  getPendingApprovals: async () => {
    try {
      const response = await hrApi.get("/EmployeeData/goal-tracking/goal-approvals/pending");
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching pending approvals:", error);
      throw (
        error.response?.data || { message: "Failed to fetch pending approvals" }
      );
    }
  },
  approveGoal: async (goalId, approvalData) => {
    try {
      const response = await hrApi.post(
        `/EmployeeData/goal-tracking/goal/${goalId}/approve`,
        approvalData
      );
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error approving goal:", error);
      throw error.response?.data || { message: "Failed to approve goal" };
    }
  },
  rejectGoal: async (goalId, rejectionData) => {
    try {
      const response = await hrApi.post(
        `/EmployeeData/goal-tracking/goal/${goalId}/reject`,
        rejectionData
      );
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error rejecting goal:", error);
      throw error.response?.data || { message: "Failed to reject goal" };
    }
  },
  getGoalApprovals: async (goalId) => {
    try {
      const response = await hrApi.get(`/EmployeeData/goal-tracking/goal/${goalId}/approvals`);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching goal approvals:", error);
      throw (
        error.response?.data || { message: "Failed to fetch goal approvals" }
      );
    }
  },
  addComment: async (goalId, commentData) => {
    try {
      const response = await hrApi.post(
        `/EmployeeData/goal-tracking/goal/${goalId}/comment`,
        commentData
      );
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error adding comment:", error);
      throw error.response?.data || { message: "Failed to add comment" };
    }
  },
  getGoalComments: async (goalId) => {
    try {
      const response = await hrApi.get(`/EmployeeData/goal-tracking/goal/${goalId}/comments`);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching goal comments:", error);
      throw (
        error.response?.data || { message: "Failed to fetch goal comments" }
      );
    }
  },
  sendGoalReminders: async (reminderData) => {
    try {
      const response = await hrApi.post(
        "/EmployeeData/goal-tracking/send-goal-reminders",
        reminderData
      );
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error sending goal reminders:", error);
      throw (
        error.response?.data || { message: "Failed to send goal reminders" }
      );
    }
  },
  sendApprovalNotification: async (goalId, notificationData) => {
    try {
      const response = await hrApi.post(
        `/EmployeeData/goal-tracking/goal/${goalId}/notify-approval`,
        notificationData
      );
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error sending notification:", error);
      throw error.response?.data || { message: "Failed to send notification" };
    }
  },
  bulkApproveGoals: async (goalIds) => {
    try {
      const response = await hrApi.post("/EmployeeData/goal-tracking/goals/bulk-approve", {
        goalIds,
      });
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error bulk approving goals:", error);
      throw error.response?.data || { message: "Failed to bulk approve goals" };
    }
  },
  bulkDeleteGoals: async (goalIds) => {
    try {
      const response = await hrApi.post("/EmployeeData/goal-tracking/goals/bulk-delete", {
        goalIds,
      });
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error bulk deleting goals:", error);
      throw error.response?.data || { message: "Failed to bulk delete goals" };
    }
  },
  exportGoalsToCSV: async (filters = {}) => {
    try {
      const response = await hrApi.get("/EmployeeData/goal-tracking/goals/export/csv", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error exporting goals:", error);
      throw error.response?.data || { message: "Failed to export goals" };
    }
  },
  exportGoalsToPDF: async (filters = {}) => {
    try {
      const response = await hrApi.get("/EmployeeData/goal-tracking/goals/export/pdf", {
        params: filters,
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error exporting goals to PDF:", error);
      throw (
        error.response?.data || { message: "Failed to export goals to PDF" }
      );
    }
  },
};
export default careerGoalsService;
