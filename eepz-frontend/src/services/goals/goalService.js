import axios from "axios";

// ==================== GOAL MODULE BASE URL ====================
const GOAL_API_BASE_URL = import.meta.env.VITE_GOAL_API_URL + "/api";

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

// ==================== HELPER FUNCTIONS FOR FILE PREVIEW ====================

const PREVIEWABLE_EXTENSIONS = [ 
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".txt",
  ".svg",
];

const NON_PREVIEWABLE_EXTENSIONS = [
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
  ".rar",
  ".7z",
];


export const isFilePreviewable = (filename) => {
  if (!filename) return false;
  const extension = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return PREVIEWABLE_EXTENSIONS.includes(extension);
};

export const getFileIcon = (filename) => {
  if (!filename) return "bi-file-earmark";

  const extension = filename.toLowerCase().substring(filename.lastIndexOf("."));

  const iconMap = {
    ".pdf": "bi-file-earmark-pdf-fill text-danger",
    ".doc": "bi-file-earmark-word-fill text-primary",
    ".docx": "bi-file-earmark-word-fill text-primary",
    ".xls": "bi-file-earmark-excel-fill text-success",
    ".xlsx": "bi-file-earmark-excel-fill text-success",
    ".ppt": "bi-file-earmark-ppt-fill text-warning",
    ".pptx": "bi-file-earmark-ppt-fill text-warning",
    ".png": "bi-file-earmark-image-fill text-info",
    ".jpg": "bi-file-earmark-image-fill text-info",
    ".jpeg": "bi-file-earmark-image-fill text-info",
    ".gif": "bi-file-earmark-image-fill text-info",
    ".txt": "bi-file-earmark-text-fill text-secondary",
    ".zip": "bi-file-earmark-zip-fill text-dark",
    ".rar": "bi-file-earmark-zip-fill text-dark",
  };

  return iconMap[extension] || "bi-file-earmark text-secondary";                                                                    
};

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

  // ==================== CHECKLIST (UPDATED) ====================
  /**
   *  FIXED: Changed to /goal-progress/{goalId}/checklist/toggle
   */
  toggleChecklist: async (goalId, checklistId, isCompleted) => {
    try {
      const response = await goalApi.put(
        `/goal-progress/${goalId}/checklist/toggle`,
        {
          checklistId,
          isCompleted,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error toggling checklist ${checklistId}:`, error);
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

  // ==================== APPROVALS (UPDATED - ALL ROUTES CHANGED) ====================
  /**
   *  FIXED: Changed to /goal-approvals/{goalId}
   */
  requestApproval: async (goalId, approvalData) => {
    try {
      const response = await goalApi.post(
        `/goal-approvals/${goalId}`,
        approvalData
      );
      return response.data;
    } catch (error) {
      console.error("Error requesting approval:", error);
      throw error;
    }
  },

  /**
   *  FIXED: Changed to /goal-approvals/my
   */
  getMyApprovals: async (filters = {}) => {
    try {
      const response = await goalApi.get("/goal-approvals/my", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching approvals:", error);
      throw error;
    }
  },

  /**
   *  FIXED: Changed to /goal-approvals/pending
   */
  getPendingApprovals: async () => {
    try {
      const response = await goalApi.get("/goal-approvals/pending");
      return response.data;
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      throw error;
    }
  }, 

  /**
   *  FIXED: Changed to /goal-approvals/{approvalId}
   */
  decideApproval: async (approvalId, decision) => {
    try {
      const response = await goalApi.put(
        `/goal-approvals/${approvalId}`,
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

  // ==================== ATTACHMENTS (UPDATED - ALL ROUTES CHANGED) ====================
  /**
   *  FIXED: Changed to /goal-attachments/{goalId}/upload
   */
  uploadAttachment: async (goalId, file, title, isProof) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || file.name);

      const response = await goalApi.post(
        `/goal-attachments/${goalId}/upload`,
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

  /**
   *  FIXED: Changed to /goal-attachments/{attachmentId}/preview
   */
  previewAttachment: async (attachmentId, filename) => {
    try {
      if (!isFilePreviewable(filename)) {
        throw new Error(
          "This file type does not support preview. Please download to view."
        );
      }

      const response = await goalApi.get(
        `/goal-attachments/${attachmentId}/preview`,
        {
          responseType: "blob",
        }
      );

      const contentType = response.headers["content-type"] || "application/pdf";
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, "_blank");

      if (!newWindow) {
        window.URL.revokeObjectURL(blobUrl);
        throw new Error("Popup blocked. Please allow popups to preview files.");
      }

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);

      return { success: true };
    } catch (error) {
      console.error("Error previewing attachment:", error);
      throw error;
    }
  },

  /**
   *  FIXED: Changed to /goal-attachments/{attachmentId}/preview
   */
  getPreviewUrl: (attachmentId) => {
    const token = localStorage.getItem("token");
    return `${GOAL_API_BASE_URL}/goal-attachments/${attachmentId}/preview?token=${token}`;
  },

  /**
   *  FIXED: Changed to /goal-attachments/{attachmentId}/download
   */
  downloadAttachment: async (attachmentId) => {
    try {
      const response = await goalApi.get(
        `/goal-attachments/${attachmentId}/download`,
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

  /**
   *  FIXED: Changed to /goal-attachments/{attachmentId}
   */
  deleteAttachment: async (attachmentId) => {
    try {
      const response = await goalApi.delete(
        `/goal-attachments/${attachmentId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting attachment:", error);
      throw error;
    }
  },

  // ==================== PERMISSIONS (FIXED) ====================
  /**
   *  FIXED: Changed to /goals/{goalId}/can-complete
   */
  canMarkComplete: async (goalId) => {
    try {
      const response = await goalApi.get(`/goals/${goalId}/can-complete`);
      return response.data;
    } catch (error) {
      console.error("Error checking completion permission:", error);
      return { canMarkComplete: false };
    }
  },
};

// ==================== HELPER FUNCTIONS ====================

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
