import axios from "axios";
import authService from "../../auth/authService";

/**
 * Axios API instance with JWT token management
 * Handles authentication, token refresh, and error responses
 */
const api = axios.create({
  baseURL: "http://localhost:5253/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // 30 second timeout
});

// ============ REQUEST INTERCEPTOR ============
/**
 * Adds JWT token to every request automatically
 */
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`✅ JWT Token Added | ${config.method.toUpperCase()} ${config.url}`);
    } else {
      console.warn(`⚠️  No JWT Token Found | ${config.method.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error("❌ Request Configuration Error:", error);
    return Promise.reject(error);
  }
);

// ============ RESPONSE INTERCEPTOR ============
/**
 * Handles token refresh on 401 responses
 * Automatically retries failed requests after token refresh
 */
api.interceptors.response.use(
  // Success response - pass through
  (response) => {
    console.log(`✅ API Response Success | ${response.status} | ${response.config.url}`);
    return response;
  },
  
  // Error response - handle token refresh or redirect
  async (error) => {
    const originalRequest = error.config;
    const errorStatus = error.response?.status;
    const errorData = error.response?.data;
    const errorMessage = error.message;

    console.error(
      `❌ API Error | Status: ${errorStatus} | URL: ${error.config?.url} | Message: ${errorMessage}`
    );

    // ============ 401 UNAUTHORIZED - Try Token Refresh ============
    if (errorStatus === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log("🔄 Token expired or invalid. Attempting token refresh...");

      const refreshToken = authService.getRefreshToken();
      
      if (!refreshToken) {
        console.warn("❌ No refresh token available. Redirecting to login...");
        authService.clearAuthData();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        console.log("📤 Sending refresh token request...");
        const refreshResponse = await authService.refreshAccessToken();

        if (refreshResponse.success) {
          console.log("✅ Token refreshed successfully! Retrying original request...");
          
          const newToken = authService.getToken();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          return api(originalRequest);
        } else {
          console.error("❌ Token refresh failed:", refreshResponse.message);
          authService.clearAuthData();
          window.location.href = "/login";
          return Promise.reject(refreshResponse);
        }
      } catch (refreshError) {
        console.error("❌ Token refresh error:", refreshError);
        authService.clearAuthData();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // ============ 403 FORBIDDEN ============
    if (errorStatus === 403) {
      console.error("❌ Access Denied: You don't have permission to access this resource");
    }

    // ============ 404 NOT FOUND ============
    if (errorStatus === 404) {
      console.error("❌ Resource Not Found:", error.config?.url);
    }

    // ============ 500 SERVER ERROR ============
    if (errorStatus === 500) {
      console.error("❌ Server Error: The backend API encountered an error");
      console.error("   Details:", errorData?.message || errorMessage);
    }

    // ============ NETWORK ERROR ============
    if (!error.response) {
      console.error("❌ Network Error: Could not reach the API server");
      console.error("   Make sure the backend is running at:", api.defaults.baseURL);
    }

    return Promise.reject(error);
  }
);

// ============================================================
// HR NOMINATION API FUNCTIONS
// ============================================================

/**
 * Get all manager nominations for HR review
 */
export const getAllManagerNominations = () => {
  return api.get("/HRNomination/hr/manager-nominations");
};

/**
 * Approve selected nominations
 * @param {Object} payload - { selectedNominationIds: number[], hrUserId: number, approvalRemarks: string }
 */
export const approveNominations = (payload) => {
  return api.post("/HRNomination/hr/nominations/approve", payload);
};

/**
 * Reject selected nominations
 * @param {Object} payload - { selectedNominationIds: number[], hrUserId: number, rejectionRemarks: string }
 */
export const rejectNominations = (payload) => {
  return api.post("/HRNomination/hr/nominations/reject", payload);
};

/**
 * Get HR dashboard summary
 */
export const getDashboardSummary = () => {
  return api.get("/HRNomination/hr/dashboard/summary");
};

/**
 * Get detailed information about a specific nomination
 * @param {number} nominationId - The nomination ID
 */
export const getNominationDetails = (nominationId) => {
  return api.get(`/HRNomination/nomination-details/${nominationId}`);
};

/**
 * Get all approved nomination profiles
 */
export const getApprovedProfiles = () => {
  return api.get("/HRNomination/approved-profiles");
};

/**
 * Get all rejected nomination profiles
 */
export const getRejectedProfiles = () => {
  return api.get("/HRNomination/rejected-profiles");
};

/**
 * Get nomination statistics
 */
export const getStatistics = () => {
  return api.get("/HRNomination/statistics");
};

/**
 * Debug endpoint to check nominations by status
 */
export const debugNominations = () => {
  return api.get("/HRNomination/debug/nominations");
};

// ============================================================
// REWARD TYPE MANAGEMENT
// ============================================================

/**
 * Get all reward types
 * @param {boolean} activeOnly - Filter for active reward types only
 */
export const getRewardTypes = (activeOnly = false) => {
  return api.get("/HRNomination/reward-types", { params: { activeOnly } });
};

/**
 * Create a new reward type
 * @param {Object} payload - { rewardCategory: string, rewardName: string, description: string, createdBy: number }
 */
export const createRewardType = (payload) => {
  return api.post("/HRNomination/reward-types", payload);
};

/**
 * Update an existing reward type
 * @param {number} rewardTypeId - The reward type ID
 * @param {Object} payload - { rewardName: string, description: string, isActive: boolean }
 */
export const updateRewardType = (rewardTypeId, payload) => {
  return api.put(`/HRNomination/reward-types/${rewardTypeId}`, payload);
};

/**
 * Delete a reward type
 * @param {number} rewardTypeId - The reward type ID
 */
export const deleteRewardType = (rewardTypeId) => {
  return api.delete(`/HRNomination/reward-types/${rewardTypeId}`);
};

// ============================================================
// NOMINATION PARAMETER MANAGEMENT
// ============================================================

/**
 * Get all parameters for a specific reward type
 * @param {number} rewardTypeId - The reward type ID
 */
export const getParametersByRewardType = (rewardTypeId) => {
  return api.get(`/HRNomination/reward-types/${rewardTypeId}/parameters`);
};

/**
 * Create a new parameter for a reward type
 * @param {Object} payload - Parameter configuration object
 */
export const createParameter = (payload) => {
  return api.post("/HRNomination/parameters", payload);
};

/**
 * Update an existing parameter
 * @param {number} parameterId - The parameter ID
 * @param {Object} payload - Updated parameter data
 */
export const updateParameter = (parameterId, payload) => {
  return api.put(`/HRNomination/parameters/${parameterId}`, payload);
};

/**
 * Delete a parameter
 * @param {number} parameterId - The parameter ID
 */
export const deleteParameter = (parameterId) => {
  return api.delete(`/HRNomination/parameters/${parameterId}`);
};

// ============================================================
// MANAGER NOMINATION FUNCTIONS (For Manager Role)
// ============================================================

/**
 * Get team members for a specific manager
 * @param {number} managerId - The ID of the manager
 */
export const getTeamMembers = (managerId) => {
  return api.get(`/AppraisalProcess/manager/${managerId}/project-team`);
};

/**
 * Get all nominations submitted by a manager
 * @param {number} managerId - The ID of the manager
 */
export const getMyNominations = (managerId) => {
  return api.get(`/AppraisalProcess/manager/${managerId}/nominations`);
};

/**
 * Submit a new nomination (from manager to HR)
 * @param {Object} payload - The nomination data
 */
export const submitNomination = (payload) => {
  return api.post("/EmployeeNomination/submit", payload);
};

// ============================================================
// DEPARTMENT HEAD FUNCTIONS
// ============================================================

/**
 * Get submitted ratings for Department Head review
 */
export const getDeptHeadSubmittedRatings = () => {
  return api.get('/AppraisalProcess/depthead/submitted-ratings');
};

/**
 * Approve an employee's assessment (Department Head)
 * @param {Object} payload - Approval data
 */
export const approveDeptHeadEmployee = (payload) => {
  return api.post('/AppraisalProcess/depthead/approve-employee', payload);
};

/**
 * Get approved nominations for department head
 * @param {number} deptHeadId - Department Head ID
 */
export const getDeptHeadApprovedNominations = (deptHeadId) => {
  return api.get(`/DepartmentHeadNomination/depthead/${deptHeadId}/approved-nominations`);
};

/**
 * Get list of approved employees (for Manager/Department Head)
 * @param {number} page - Page number
 * @param {number} pageSize - Number of items per page
 */
export const getApprovedEmployees = (page = 1, pageSize = 5) => {
  return api.get('/AppraisalProcess/manager/approved-employees', {
    params: { page, pageSize }
  });
};

// ============================================================
// EMPLOYEE ACKNOWLEDGMENT FUNCTIONS
// ============================================================

/**
 * Get pending acknowledgments for employee
 */
export const getPendingAcknowledgments = () => {
  return api.get('/AppraisalProcess/employee/pending-acknowledgments');
};

/**
 * Acknowledge a rating
 * @param {Object} payload - Acknowledgment data
 */
export const acknowledgeRating = (payload) => {
  return api.post('/AppraisalProcess/employee/acknowledge', payload);
};

/**
 * Get manager employee acknowledgments
 */
export const getManagerEmployeeAcknowledgments = () => {
  return api.get("/AppraisalProcess/manager/employee-acknowledged-comments");
};

// ============================================================
// EMPLOYEE NOMINATION FUNCTIONS
// ============================================================

/**
 * Search for employee nominations by employee ID
 * @param {number} employeeId - The employee ID
 */
export const getEmployeeNominations = (employeeId) => {
  return api.get(`/EmployeeNomination/search?employeeId=${employeeId}`);
};

export default api;
