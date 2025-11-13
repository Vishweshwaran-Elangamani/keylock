/*
 * =============================================================================
 * GOAL MODULE API SERVICE
 * =============================================================================
 *
 * CURRENT SETUP (Development):
 * - Uses base URL: http://localhost:5253/api (without /goals)
 * - All endpoints prefixed with /goals
 * - Independent axios instance with auth interceptors
 *
 * MIGRATION STEPS (When integrating with main API):
 *
 * 1. Comment out lines 6-7 (GOAL_API_BASE_URL)
 * 2. Comment out lines 13-48 (goalApi axios instance creation)
 * 3. Uncomment line 10 (import api from '../api')
 * 4. Replace all 'goalApi' with 'api' throughout the file (Ctrl+H)
 * 5. Endpoints already have '/goals' prefix, so no changes needed!
 *
 * =============================================================================
 */

import axios from "axios";

// ==================== GOAL MODULE BASE URL ====================
const GOAL_API_BASE_URL = import.meta.env.VITE_GOAL_API_URL + "/api";

// FUTURE: Use main API base URL from api.js
// import api from '../api';

// ==================== CREATE AXIOS INSTANCE ====================
const goalApi = axios.create({
  baseURL: GOAL_API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for authentication
goalApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
goalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }

      if (error.response.status === 403) {
        console.error("Access denied");
      }
    }
    return Promise.reject(error);
  }
);

// ==================== GOAL SERVICE ====================
const goalService = {
  // ==================== DASHBOARD ====================
  getDashboardSummary: async () => {
    try {
      const response = await goalApi.get("/goals/dashboard/summary");
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      throw error;
    }
  },

  getOngoingGoals: async (type = "self", pageSize = 6) => {
    try {
      const response = await goalApi.get("/goals/query", {
        params: {
          type,
          status: "inprogress",
          pageSize,
          page: 1,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching ongoing goals:", error);
      throw error;
    }
  },

  // ==================== PROJECTS ====================
  getUserProjects: async () => {
    try {
      const response = await goalApi.get("/goals/projects/user");
      return response.data;
    } catch (error) {
      console.error("Error fetching user projects:", error);
      throw error;
    }
  },

  getAllProjects: async () => {
    try {
      const response = await goalApi.get("/goals/projects");
      return response.data;
    } catch (error) {
      console.error("Error fetching all projects:", error);
      throw error;
    }
  },

  getProject: async (projectId) => {
    try {
      const response = await goalApi.get(`/goals/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error);
      throw error;
    }
  },

  getSubordinates: (managerId) => {
    return goalApi.get(`/goals/subordinates/${managerId}`);
  },

  getProjectSubordinates: async (projectId) => {
    return goalApi.get(`/goals/projects/${projectId}/subordinates`);
  },

  // ==================== GOAL CRUD ====================
  createGoal: async (goalData) => {
    try {
      const response = await goalApi.post("/goals", goalData);
      return response.data;
    } catch (error) {
      console.error("Error creating goal:", error);
      throw error;
    }
  },

  getGoal: async (goalId) => {
    try {
      const response = await goalApi.get(`/goals/${goalId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching goal ${goalId}:`, error);
      throw error;
    }
  },

  queryGoals: async (filters = {}) => {
    try {
      const response = await goalApi.get("/goals/query", { params: filters });
      return response.data;
    } catch (error) {
      console.error("Error querying goals:", error);
      throw error;
    }
  },

  updateGoal: async (goalId, updateData) => {
    try {
      const response = await goalApi.put(`/goals/${goalId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Error updating goal ${goalId}:`, error);
      throw error;
    }
  },

  deleteGoal: async (goalId) => {
    try {
      const response = await goalApi.delete(`/goals/${goalId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting goal ${goalId}:`, error);
      throw error;
    }
  },

  // ==================== CHECKLIST ====================
  toggleChecklist: async (goalId, checklistId, isCompleted) => {
    try {
      const response = await goalApi.put(`/goals/${goalId}/checklist/toggle`, {
        checklistId,
        isCompleted,
      });
      return response.data;
    } catch (error) {
      console.error(`Error toggling checklist ${checklistId}:`, error);
      throw error;
    }
  },

  addChecklistItem: async (goalId, itemData) => {
    try {
      const response = await goalApi.post(
        `/goals/${goalId}/checklist`,
        itemData
      );
      return response.data;
    } catch (error) {
      console.error("Error adding checklist item:", error);
      throw error;
    }
  },

  deleteChecklistItem: async (goalId, checklistId) => {
    try {
      const response = await goalApi.delete(
        `/goals/${goalId}/checklist/${checklistId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting checklist ${checklistId}:`, error);
      throw error;
    }
  },

  // ==================== ASSIGNMENTS ====================
  assignGoal: async (goalId, assignmentData) => {
    try {
      const response = await goalApi.post(
        `/goals/${goalId}/assign`,
        assignmentData
      );
      return response.data;
    } catch (error) {
      console.error(`Error assigning goal ${goalId}:`, error);
      throw error;
    }
  },

  getMyAssignments: async () => {
    try {
      const response = await goalApi.get("/goals/assignments/me");
      return response.data;
    } catch (error) {
      console.error("Error fetching assignments:", error);
      throw error;
    }
  },

  // ==================== APPROVALS (CONSOLIDATED) ====================
  /**
   * Request approval for any approval type
   * Supports: completion, closure, reactivation, reopening, task_acknowledgment
   *
   * Usage examples:
   * - Completion: requestApproval(goalId, { approvalType: "completion", proofAttachmentIds: [...] })
   * - Closure: requestApproval(goalId, { approvalType: "closure" })
   * - Reopening: requestApproval(goalId, { approvalType: "reopening" })
   * - Reactivation: requestApproval(goalId, { approvalType: "reactivation" })
   */
  requestApproval: async (goalId, approvalData) => {
    try {
      const response = await goalApi.post(
        `/goals/${goalId}/approvals`,
        approvalData
      );
      return response.data;
    } catch (error) {
      console.error("Error requesting approval:", error);
      throw error;
    }
  },

  getMyApprovals: async (filters = {}) => {
    try {
      const response = await goalApi.get("/goals/approvals/my", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching approvals:", error);
      throw error;
    }
  },

  getPendingApprovals: async () => {
    try {
      const response = await goalApi.get("/goals/approvals/pending");
      return response.data;
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      throw error;
    }
  },

  /**
   * Decide on an approval request
   *
   * Payload format:
   * {
   *   decision: "approved" | "rejected",
   *   newDeadline?: "2025-11-15T10:00:00" // Only for reopening approvals when approving
   * }
   */
  decideApproval: async (approvalId, decision) => {
    try {
      const response = await goalApi.put(
        `/goals/approvals/${approvalId}`,
        decision
      );
      return response.data;
    } catch (error) {
      console.error(`Error deciding approval ${approvalId}:`, error);
      throw error;
    }
  },

  // ==================== COMMENTS ====================
  addComment: async (goalId, comment) => {
    try {
      const response = await goalApi.post(`/goals/${goalId}/comments`, {
        comment,
      });
      return response.data;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },

  listComments: async (goalId, filters = {}) => {
    try {
      const response = await goalApi.get(`/goals/${goalId}/comments`, {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }
  },

  // ==================== TIMELINE ====================
  getTimeline: async (goalId) => {
    try {
      const response = await goalApi.get(`/goals/${goalId}/timeline`);
      return response.data;
    } catch (error) {
      console.error("Error fetching timeline:", error);
      throw error;
    }
  },

  // ==================== ATTACHMENTS ====================
  uploadAttachment: async (goalId, file, title, isProof) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || file.name);

      const response = await goalApi.post(
        `/goals/${goalId}/attachments/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading attachment:", error);
      throw error;
    }
  },

  downloadAttachment: async (attachmentId) => {
    try {
      const response = await goalApi.get(
        `/goals/attachments/${attachmentId}/download`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = "download";

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response;
    } catch (error) {
      console.error("Error downloading attachment:", error);
      throw error;
    }
  },

  deleteAttachment: async (attachmentId) => {
    try {
      const response = await goalApi.delete(
        `/goals/attachments/${attachmentId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting attachment:", error);
      throw error;
    }
  },

  // ==================== PERMISSIONS ====================
  canMarkComplete: async (goalId) => {
    try {
      const response = await goalApi.get(`/goals/${goalId}/can-mark-complete`);
      return response.data;
    } catch (error) {
      console.error("Error checking completion permission:", error);
      return { canMarkComplete: false };
    }
  },

  canEditGoal: async (goalId) => {
    try {
      const response = await goalApi.get(`/goals/${goalId}/can-edit`);
      return response.data;
    } catch (error) {
      console.error("Error checking edit permission:", error);
      return { canEdit: false };
    }
  },

  canAssignGoal: async (goalId) => {
    try {
      const response = await goalApi.get(`/goals/${goalId}/can-assign`);
      return response.data;
    } catch (error) {
      console.error("Error checking assign permission:", error);
      return { canAssign: false };
    }
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if user can comment on a goal
 */
export const canUserComment = (goal, user) => {
  if (!goal || !user) return false;

  const isCreator = goal.createdByEmployeeMasterId === user.empMasterId;
  const isAssignee = goal.assignees?.some(
    (a) => a.employeeMasterId === user.empMasterId
  );
  const isLeadership = user.role === "Leadership";
  const isManager = ["Manager", "Department Head", "Leadership"].includes(
    user.role
  );

  switch (goal.goalType?.toLowerCase()) {
    case "self":
      return isCreator || isManager;

    case "team":
      return isCreator || isAssignee || isManager;

    case "org":
      return isCreator || isLeadership;

    default:
      return false;
  }
};

/**
 * Get goal status badge color
 */
export const getStatusBadgeColor = (status) => {
  const statusMap = {
    pending: "warning",
    open: "info",
    inprogress: "primary",
    completed: "success",
    closed: "danger",
    expired: "dark",
    reopened: "warning",
  };
  return statusMap[status?.toLowerCase()] || "secondary";
};

/**
 * Get goal status display label
 */
export const getStatusLabel = (status) => {
  const labelMap = {
    pending: "Pending",
    open: "Open",
    inprogress: "In Progress",
    completed: "Completed",
    closed: "Closed",
    expired: "Expired",
    reopened: "Reopened",
  };
  return labelMap[status?.toLowerCase()] || "Unknown";
};

export default goalService;
