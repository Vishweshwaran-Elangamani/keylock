import api_mom from "../../services/meeting/index_mom";

/**
 * Generic API request handler with enhanced error handling
 */
const apiRequest = async (method, url, data = null, config = {}) => {
  try {
    const response = await api_mom[method](url, data, config);

    // Check rate limit headers
    const rateLimit = {
      limit: response.headers["x-ratelimit-limit"],
      remaining: response.headers["x-ratelimit-remaining"],
      reset: response.headers["x-ratelimit-reset"],
    };

    // Warn if rate limit is low
    if (rateLimit.remaining && parseInt(rateLimit.remaining) < 10) {
      console.warn(
        `Rate limit warning: ${rateLimit.remaining}/${rateLimit.limit} requests remaining`
      );
    }

    // Check cache status
    const cacheStatus = response.headers["x-cache"];
    if (cacheStatus) {
      console.log(`Cache ${cacheStatus} for ${url}`);
    }

    return response.data;
  } catch (error) {
    console.error(`API Error [${method.toUpperCase()} ${url}]:`, error);

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"] || 60;
      const errorMessage = `Rate limit exceeded. Please try again in ${retryAfter} seconds.`;
      throw {
        ...error.response?.data,
        message: errorMessage,
        retryAfter,
      };
    }

    // Handle validation errors
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

  /**
   * Create a new MOM
   * Enhanced with date validation and error handling
   * CHANGED: POST /Mom/create → POST /Mom
   */
  createMom: async (momData) => {
    // Client-side validation for meeting date (±7 to 30 days)
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

    // CHANGED: Removed "/create" - RESTful endpoint
    return apiRequest("post", "/Mom", momData);
  },

  /**
   * Update an existing MOM
   * Enhanced with empty payload validation
   * CHANGED: PUT /Mom/update → PUT /Mom/{momId}
   */
  updateMom: async (momData) => {
    // Validate momId
    if (!momData.momId || momData.momId <= 0) {
      throw {
        success: false,
        message: "Invalid MOM ID",
        validationErrors: ["MOM ID is required"],
      };
    }

    // Validate that at least one field is being updated
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

    // Validate date if provided
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

    //CHANGED: PUT /Mom/{momId} - RESTful endpoint with momId in URL
    return apiRequest("put", `/Mom/${momData.momId}`, momData);
  },

  /**
   * Get MOMs submitted by current user
   * NOW WITH PAGINATION SUPPORT
   */
  getMyMoms: (params = {}) => {
    const {
      pageNumber = 1,
      pageSize = 20,
      searchTerm = "",
      meetingType = "",
      startDate = null,
      endDate = null,
    } = params;

    const queryParams = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });

    if (searchTerm) queryParams.append("searchTerm", searchTerm);
    if (meetingType) queryParams.append("meetingType", meetingType);
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    return apiRequest("get", `/Mom/my-moms?${queryParams.toString()}`);
  },

  /**
   * Get a specific MOM by ID
   * Response includes cache headers
   */
  getMomById: (momId) => apiRequest("get", `/Mom/${momId}`),

  /**
   * Delete a MOM with confirmation token
   * REQUIRES CONFIRMATION TOKEN
   */
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

  /**
   * Delete MOM with confirmation prompt
   * Helper method that handles confirmation flow
   */
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

  /**
   * Share a MOM with employees
   */
  shareMom: (momId, employeeIds) =>
    apiRequest("post", "/Mom/share", {
      momId,
      sharedWithEmployeeIds: employeeIds,
    }),

  /**
   * Get MOMs shared by current user
   */
  getMomsSharedByMe: () => apiRequest("get", "/Mom/shared-by-me"),

  /**
   * Get MOMs shared with current user
   */
  getMomsSharedWithMe: () => apiRequest("get", "/Mom/shared-with-me"),

  /**
   * Get all MOMs for HR with pagination and filters
   * Enhanced with pagination support
   */
  getAllMomsForHR: (filters = {}) => {
    const params = new URLSearchParams();

    // Set default pagination
    if (!filters.pageNumber) filters.pageNumber = 1;
    if (!filters.pageSize) filters.pageSize = 20;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        params.append(key, value);
      }
    });

    return apiRequest("get", `/Mom/all-moms?${params.toString()}`);
  },

  /**
   * Update action item status
   */
  updateActionItemStatus: (actionItemId, status) =>
    apiRequest(
      "patch",
      `/Mom/action-items/${actionItemId}/status`,
      JSON.stringify(status),
      { headers: { "Content-Type": "application/json" } }
    ),

  /**
   * Get my action items
   */
  getMyActionItems: () => apiRequest("get", "/Mom/action-items/my-tasks"),

  /**
   * Get action items assigned by me
   */
  getActionItemsAssignedByMe: () =>
    apiRequest("get", "/Mom/action-items/assigned-by-me"),

  /**
   * Get overdue action items
   */
  getOverdueActionItems: () => apiRequest("get", "/Mom/action-items/overdue"),

  /**
   * Get all employees
   */
  getAllEmployees: () => apiRequest("get", "/EmployeeManagement/all"),

  /**
   * Validation helpers
   */
  validation: {
    /**
     * Validate meeting date
     */
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

    /**
     * Validate meeting title
     */
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

    /**
     * Validate discussion point
     */
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

    /**
     * Validate action item
     */
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

      // Validate due date
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

  /**
   * Utility helpers
   */
  utils: {
    /**
     * Check if rate limit is approaching
     */
    isRateLimitLow: (remaining, limit) => {
      if (!remaining || !limit) return false;
      return parseInt(remaining) / parseInt(limit) < 0.2; // Less than 20%
    },

    /**
     * Format date for API
     */
    formatDateForAPI: (date) => {
      return new Date(date).toISOString();
    },

    /**
     * Parse pagination response
     */
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
