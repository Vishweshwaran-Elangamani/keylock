import api_mom from "../../services/meeting/index_mom";
 
const apiRequest = async (method, url, data = null, config = {}) => {
  try {
  const token = localStorage.getItem("token");

const defaultConfig = {
  headers: {
    Authorization: token ? `Bearer ${token}` : "",
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...config.headers
  },
  ...config
};

let response;

if (method.toLowerCase() === "get" || method.toLowerCase() === "delete") {
  response = await api_mom[method](url, defaultConfig);
} else {
  response = await api_mom[method](url, data, defaultConfig);
}
 
    const rateLimit = {
      limit: response.headers["x-ratelimit-limit"],
      remaining: response.headers["x-ratelimit-remaining"],
      reset: response.headers["x-ratelimit-reset"],
    };
 
    if (rateLimit.remaining && parseInt(rateLimit.remaining) < 10) {
      console.warn(
        `Rate limit warning: ${rateLimit.remaining}/${rateLimit.limit} requests remaining`
      );
    }
 
    const cacheStatus = response.headers["x-cache"];
    if (cacheStatus) {
    }
 
    return response.data;
  } catch (error) {
    console.error(`API Error [${method.toUpperCase()} ${url}]:`, error);
 
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"] || 60;
      const errorMessage = `Rate limit exceeded. Please try again in ${retryAfter} seconds.`;
      throw {
        ...error.response?.data,
        message: errorMessage,
        retryAfter,
      };
    }
 
    if (error.response?.status === 400) {
      throw {
        ...error.response?.data,
        validationErrors: error.response?.data?.message || "Validation failed",
      };
    }
 
    throw error.response?.data || error;
  }
};
 
const momService = {
  api_mom,
 
  createMom: async (momData) => {
    const meetingDate = new Date(momData.meetingDate);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 7);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
 
    if (meetingDate < minDate || meetingDate > maxDate) {
      throw {
        success: false,
        message: `Meeting date must be between ${
          minDate.toISOString().split("T")[0]
        } and ${maxDate.toISOString().split("T")[0]}`,
        validationErrors: ["Invalid meeting date"],
      };
    }
 
    return apiRequest("post", "/Mom", momData);
  },
 
  updateMom: async (momData) => {
    if (!momData.momId || momData.momId <= 0) {
      throw {
        success: false,
        message: "Invalid MOM ID",
        validationErrors: ["MOM ID is required"],
      };
    }
 
    const hasData = Object.keys(momData).some(
      (key) =>
        key !== "momId" &&
        momData[key] !== null &&
        momData[key] !== undefined &&
        momData[key] !== ""
    );
 
    if (!hasData) {
      throw {
        success: false,
        message:
          "Update payload cannot be empty. At least one field must be provided.",
        validationErrors: ["Empty update payload"],
      };
    }
 
    if (momData.meetingDate) {
      const meetingDate = new Date(momData.meetingDate);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() - 7);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);
 
      if (meetingDate < minDate || meetingDate > maxDate) {
        throw {
          success: false,
          message: `Meeting date must be between ${
            minDate.toISOString().split("T")[0]
          } and ${maxDate.toISOString().split("T")[0]}`,
          validationErrors: ["Invalid meeting date"],
        };
      }
    }
 
    return apiRequest("put", `/Mom/${momData.momId}`, momData);
  },
 
 getMyMoms: (params = {}) => {
  const query = new URLSearchParams({
    ...params,
    _t: Date.now(), 
  }).toString();

  return apiRequest("get", `/Mom/my-moms?${query}`);
},

 
  getMomById: (momId) => {
    const timestamp = new Date().getTime();
    return apiRequest("get", `/Mom/${momId}?_t=${timestamp}`);
  },
 
  deleteMom: async (momId, confirmed = false) => {
    if (!confirmed) {
      throw {
        success: false,
        message: "Deletion requires confirmation",
        requiresConfirmation: true,
        confirmationToken: `DELETE_${momId}`,
      };
    }
 
    const confirmationToken = `DELETE_${momId}`;
    return apiRequest(
      "delete",
      `/Mom/${momId}?confirmationToken=${confirmationToken}`
    );
  },
 
  deleteMomWithConfirmation: async (momId, meetingTitle = "") => {
    const confirmMessage = meetingTitle
      ? `Are you sure you want to delete the MOM for "${meetingTitle}"?\n\nThis action cannot be undone.`
      : `Are you sure you want to delete this MOM?\n\nThis action cannot be undone.`;
 
    const confirmed = window.confirm(confirmMessage);
 
    if (!confirmed) {
      return { success: false, cancelled: true };
    }
 
    try {
      const confirmationToken = `DELETE_${momId}`;
      const result = await apiRequest(
        "delete",
        `/Mom/${momId}?confirmationToken=${confirmationToken}`
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  },
 
  shareMom: (momId, employeeIds) =>
    apiRequest("post", "/Mom/share", {
      momId,
      sharedWithEmployeeIds: employeeIds,
    }),
 
  getMomsSharedByMe: () => {
    const timestamp = new Date().getTime();
    return apiRequest("get", `/Mom/shared-by-me?_t=${timestamp}`);
  },
 
  getMomsSharedWithMe: () => {
    const timestamp = new Date().getTime();
    return apiRequest("get", `/Mom/shared-with-me?_t=${timestamp}`);
  },
 
  getAllMomsForHR: (filters = {}) => {
    const params = new URLSearchParams();
 
    if (!filters.pageNumber) filters.pageNumber = 1;
    if (!filters.pageSize) filters.pageSize = 20;
   
    filters._t = new Date().getTime();
 
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        params.append(key, value);
      }
    });
 
    return apiRequest("get", `/Mom/all-moms?${params.toString()}`);
  },
 
  updateActionItemStatus: (actionItemId, status) =>
    apiRequest(
      "patch",
      `/Mom/action-items/${actionItemId}/status`,
      JSON.stringify(status),
      { headers: { "Content-Type": "application/json" } }
    ),
 
  getMyActionItems: () => {
    const timestamp = new Date().getTime();
    return apiRequest("get", `/Mom/action-items/my-tasks?_t=${timestamp}`);
  },
 
  getActionItemsAssignedByMe: () => {
    const timestamp = new Date().getTime();
    return apiRequest("get", `/Mom/action-items/assigned-by-me?_t=${timestamp}`);
  },
 
  getOverdueActionItems: () => {
    const timestamp = new Date().getTime();
    return apiRequest("get", `/Mom/action-items/overdue?_t=${timestamp}`);
  },
 
  getAllEmployees: () => apiRequest("get", "/EmployeeManagement/all"),
 
  validation: {
    validateMeetingDate: (date) => {
      const meetingDate = new Date(date);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() - 7);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);
 
      if (meetingDate < minDate || meetingDate > maxDate) {
        return {
          valid: false,
          message: `Meeting date must be between ${
            minDate.toISOString().split("T")[0]
          } and ${maxDate.toISOString().split("T")[0]}`,
        };
      }
 
      return { valid: true };
    },
 
    validateMeetingTitle: (title) => {
      if (!title || title.trim().length < 3) {
        return {
          valid: false,
          message: "Meeting title must be at least 3 characters long",
        };
      }
      if (title.length > 200) {
        return {
          valid: false,
          message: "Meeting title cannot exceed 200 characters",
        };
      }
      return { valid: true };
    },
 
    validateDiscussionPoint: (pointText) => {
      if (!pointText || pointText.trim().length === 0) {
        return {
          valid: false,
          message: "Discussion point text cannot be empty",
        };
      }
      if (pointText.length > 2000) {
        return {
          valid: false,
          message: "Discussion point text cannot exceed 2000 characters",
        };
      }
      return { valid: true };
    },
 
    validateActionItem: (item) => {
      if (!item.taskDescription || item.taskDescription.trim().length === 0) {
        return {
          valid: false,
          message: "Action item description cannot be empty",
        };
      }
      if (item.taskDescription.length > 1000) {
        return {
          valid: false,
          message: "Action item description cannot exceed 1000 characters",
        };
      }
 
      const dueDate = new Date(item.dueDate);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
 
      if (dueDate < yesterday) {
        return {
          valid: false,
          message: "Action item due date cannot be in the past",
        };
      }
 
      return { valid: true };
    },
  },
 
  utils: {
    isRateLimitLow: (remaining, limit) => {
      if (!remaining || !limit) return false;
      return parseInt(remaining) / parseInt(limit) < 0.2;
    },
 
    formatDateForAPI: (date) => {
      return new Date(date).toISOString();
    },
 
    parsePaginatedResponse: (response) => {
      if (!response.data) return null;
 
      return {
        items: response.data.data || [],
        totalCount: response.data.totalCount || 0,
        pageNumber: response.data.pageNumber || 1,
        pageSize: response.data.pageSize || 20,
        totalPages: response.data.totalPages || 0,
        hasPreviousPage: response.data.hasPreviousPage || false,
        hasNextPage: response.data.hasNextPage || false,
      };
    },
  },
};
 
export default momService;
 
 