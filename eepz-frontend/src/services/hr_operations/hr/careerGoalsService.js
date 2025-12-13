import hrApi from "../hr/hrApi";


const careerGoalsService = {
  // Get career goals overview/statistics for dashboard
  getOverview: async () => {
    try {
      console.log(" Frontend: Fetching career goals overview");
      const response = await hrApi.get("/EmployeeData/goal-tracking/overview");
      console.log(" Frontend: Overview received", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching goals overview:", error);
      throw (
        error.response?.data || { message: "Failed to fetch goals overview" }
      );
    }
  },


  // Get detailed goal statistics
  getGoalStatistics: async () => {
    try {
      console.log(" Frontend: Fetching goal statistics");
      const response = await hrApi.get("/EmployeeData/goal-tracking/goal-statistics");
      console.log(" Frontend: Statistics received", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching goal statistics:", error);
      throw (
        error.response?.data || { message: "Failed to fetch goal statistics" }
      );
    }
  },


  // Get adoption rate of career goals (trend info + breakdown)
  getGoalAdoptionRate: async () => {
    try {
      console.log(" Frontend: Fetching goal adoption rate");
      const response = await hrApi.get("/EmployeeData/goal-tracking/goal-adoption-rate");
      console.log(" Frontend: Adoption rate received", response.data);
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


  // ========== EMPLOYEE GOALS ==========


  // Get employees who have not set any career goals
  getEmployeesWithoutGoals: async () => {
    try {
      console.log(" Frontend: Fetching employees without goals");
      const response = await hrApi.get("/EmployeeData/goal-tracking/employees-without-goals");
      console.log(" Frontend: Employees without goals received", response.data);
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


  // Get all career goals for an employee
  getEmployeeGoals: async (userId) => {
    try {
      console.log(" Frontend: Fetching goals for employee:", userId);
      const response = await hrApi.get(`/EmployeeData/goal-tracking/employee-goals/${userId}`);
      console.log(" Frontend: Employee goals received", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching employee goals:", error);
      throw (
        error.response?.data || { message: "Failed to fetch employee goals" }
      );
    }
  },


  // Get suggested goals for a given userId
  getGoalSuggestions: async (userId) => {
    try {
      console.log(" Frontend: Fetching goal suggestions for user:", userId);
      const response = await hrApi.get(`/EmployeeData/goal-tracking/suggest-goals/${userId}`);
      console.log(" Frontend: Goal suggestions received", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching goal suggestions:", error);
      throw (
        error.response?.data || { message: "Failed to fetch goal suggestions" }
      );
    }
  },


  // ========== GOAL OPERATIONS ==========


  // Get all career goals
  getAllGoals: async () => {
    try {
      console.log(" Frontend: Fetching all career goals");
      const response = await hrApi.get("/EmployeeData/goal-tracking/goals");
      console.log(" Frontend: All goals received", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching all goals:", error);
      throw error.response?.data || { message: "Failed to fetch goals" };
    }
  },


  // Get goal by ID
  getGoalById: async (goalId) => {
    try {
      console.log(" Frontend: Fetching goal ID:", goalId);
      const response = await hrApi.get(`/EmployeeData/goal-tracking/goal/${goalId}`);
      console.log(" Frontend: Goal received", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching goal:", error);
      throw error.response?.data || { message: "Failed to fetch goal" };
    }
  },


  // Create new career goal
  createGoal: async (goalData) => {
    try {
      console.log(" Frontend: Creating goal", goalData);
      const response = await hrApi.post("/EmployeeData/goal-tracking/goal/create", goalData);
      console.log(" Frontend: Goal created", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error creating goal:", error);
      throw error.response?.data || { message: "Failed to create goal" };
    }
  },


  // Update career goal
  updateGoal: async (goalData) => {
    try {
      console.log(" Frontend: Updating goal", goalData);
      const response = await hrApi.put("/EmployeeData/goal-tracking/goal/update", goalData);
      console.log(" Frontend: Goal updated", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error updating goal:", error);
      throw error.response?.data || { message: "Failed to update goal" };
    }
  },


  // Delete career goal
  deleteGoal: async (goalId) => {
    try {
      console.log(" Frontend: Deleting goal ID:", goalId);
      const response = await hrApi.delete(`/EmployeeData/goal-tracking/goal/${goalId}`);
      console.log(" Frontend: Goal deleted", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error deleting goal:", error);
      throw error.response?.data || { message: "Failed to delete goal" };
    }
  },


  // Update goal progress
  updateGoalProgress: async (goalId, progressData) => {
    try {
      console.log(" Frontend: Updating goal progress for ID:", goalId);
      const response = await hrApi.put(
        `/EmployeeData/goal-tracking/goal/${goalId}/progress`,
        progressData
      );
      console.log(" Frontend: Progress updated", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error updating progress:", error);
      throw (
        error.response?.data || { message: "Failed to update goal progress" }
      );
    }
  },


  // ========== APPROVALS & REVIEWS ==========


  // Get pending goal approvals
  getPendingApprovals: async () => {
    try {
      console.log(" Frontend: Fetching pending approvals");
      const response = await hrApi.get("/EmployeeData/goal-tracking/goal-approvals/pending");
      console.log(" Frontend: Pending approvals received", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching pending approvals:", error);
      throw (
        error.response?.data || { message: "Failed to fetch pending approvals" }
      );
    }
  },


  // Approve goal
  approveGoal: async (goalId, approvalData) => {
    try {
      console.log(" Frontend: Approving goal ID:", goalId);
      const response = await hrApi.post(
        `/EmployeeData/goal-tracking/goal/${goalId}/approve`,
        approvalData
      );
      console.log(" Frontend: Goal approved", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error approving goal:", error);
      throw error.response?.data || { message: "Failed to approve goal" };
    }
  },


  // Reject goal
  rejectGoal: async (goalId, rejectionData) => {
    try {
      console.log(" Frontend: Rejecting goal ID:", goalId);
      const response = await hrApi.post(
        `/EmployeeData/goal-tracking/goal/${goalId}/reject`,
        rejectionData
      );
      console.log(" Frontend: Goal rejected", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error rejecting goal:", error);
      throw error.response?.data || { message: "Failed to reject goal" };
    }
  },


  // Get goal approvals for a goal
  getGoalApprovals: async (goalId) => {
    try {
      console.log(" Frontend: Fetching approvals for goal ID:", goalId);
      const response = await hrApi.get(`/EmployeeData/goal-tracking/goal/${goalId}/approvals`);
      console.log(" Frontend: Goal approvals received", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching goal approvals:", error);
      throw (
        error.response?.data || { message: "Failed to fetch goal approvals" }
      );
    }
  },


  // ========== COMMENTS & DISCUSSIONS ==========


  // Add comment to goal
  addComment: async (goalId, commentData) => {
    try {
      console.log(" Frontend: Adding comment to goal ID:", goalId);
      const response = await hrApi.post(
        `/EmployeeData/goal-tracking/goal/${goalId}/comment`,
        commentData
      );
      console.log(" Frontend: Comment added", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error adding comment:", error);
      throw error.response?.data || { message: "Failed to add comment" };
    }
  },


  // Get comments for a goal
  getGoalComments: async (goalId) => {
    try {
      console.log(" Frontend: Fetching comments for goal ID:", goalId);
      const response = await hrApi.get(`/EmployeeData/goal-tracking/goal/${goalId}/comments`);
      console.log(" Frontend: Goal comments received", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error fetching goal comments:", error);
      throw (
        error.response?.data || { message: "Failed to fetch goal comments" }
      );
    }
  },


  // ========== EMAIL & NOTIFICATIONS ==========


  // Send one or more goal-setting reminder emails
  sendGoalReminders: async (reminderData) => {
    try {
      console.log(" Frontend: Sending goal reminders", reminderData);
      const response = await hrApi.post(
        "/EmployeeData/goal-tracking/send-goal-reminders",
        reminderData
      );
      console.log(" Frontend: Reminders sent", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error sending goal reminders:", error);
      throw (
        error.response?.data || { message: "Failed to send goal reminders" }
      );
    }
  },


  // Send goal approval notification
  sendApprovalNotification: async (goalId, notificationData) => {
    try {
      console.log(
        " Frontend: Sending approval notification for goal ID:",
        goalId
      );
      const response = await hrApi.post(
        `/EmployeeData/goal-tracking/goal/${goalId}/notify-approval`,
        notificationData
      );
      console.log(" Frontend: Notification sent", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error sending notification:", error);
      throw error.response?.data || { message: "Failed to send notification" };
    }
  },


  // ========== BULK OPERATIONS ==========


  // Bulk approve goals
  bulkApproveGoals: async (goalIds) => {
    try {
      console.log(" Frontend: Bulk approving goals:", goalIds);
      const response = await hrApi.post("/EmployeeData/goal-tracking/goals/bulk-approve", {
        goalIds,
      });
      console.log(" Frontend: Goals bulk approved", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error bulk approving goals:", error);
      throw error.response?.data || { message: "Failed to bulk approve goals" };
    }
  },


  // Bulk delete goals
  bulkDeleteGoals: async (goalIds) => {
    try {
      console.log(" Frontend: Bulk deleting goals:", goalIds);
      const response = await hrApi.post("/EmployeeData/goal-tracking/goals/bulk-delete", {
        goalIds,
      });
      console.log(" Frontend: Goals bulk deleted", response.data);
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error bulk deleting goals:", error);
      throw error.response?.data || { message: "Failed to bulk delete goals" };
    }
  },


  // ========== EXPORT & DOWNLOAD ==========


  // Export goals to CSV
  exportGoalsToCSV: async (filters = {}) => {
    try {
      console.log(" Frontend: Exporting goals to CSV with filters:", filters);
      const response = await hrApi.get("/EmployeeData/goal-tracking/goals/export/csv", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error(" Frontend: Error exporting goals:", error);
      throw error.response?.data || { message: "Failed to export goals" };
    }
  },


  // Export goals to PDF
  exportGoalsToPDF: async (filters = {}) => {
    try {
      console.log(" Frontend: Exporting goals to PDF with filters:", filters);
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
