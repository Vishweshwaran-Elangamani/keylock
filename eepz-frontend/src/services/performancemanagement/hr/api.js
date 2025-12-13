import axios from "axios";
import authService from "../../auth/authService";

// Base URL for port 5108 (default endpoints)
const BASE_URL_5108 = import.meta.env.VITE_PERFORMANCE_API_URL + "/api";

// Base URL for port 5113 (HRNomination & ManagerNomination endpoints)
const BASE_URL_5113 = BASE_URL_5108.replace("5108", "5113");

// Base URL for port 5222 (Approver, DeptHeadApprovals, Employees, Reviewer, UserProfiles endpoints)
const BASE_URL_5222 = BASE_URL_5108.replace("5108", "5222");

// Helper function to create axios instance with interceptors
const createApiInstance = (baseURL) => {
  const instance = axios.create({
    baseURL: baseURL,
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
  });

  // Request Interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = authService.getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(` JWT Token Added | ${config.method.toUpperCase()} ${config.url}`);
      } else {
        console.warn(`  No JWT Token Found | ${config.method.toUpperCase()} ${config.url}`);
      }

      return config;
    },
    (error) => {
      console.error(" Request Configuration Error:", error);
      return Promise.reject(error);
    }
  );

  // Response Interceptor
  instance.interceptors.response.use(
    (response) => {
      console.log(` API Response Success | ${response.status} | ${response.config.url}`);
      return response;
    },

    async (error) => {
      const originalRequest = error.config;
      const errorStatus = error.response?.status;
      const errorData = error.response?.data;
      const errorMessage = error.message;

      console.error(
        ` API Error | Status: ${errorStatus} | URL: ${error.config?.url} | Message: ${errorMessage}`
      );

      if (errorStatus === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        console.log(" Token expired or invalid. Attempting token refresh...");

        const refreshToken = authService.getRefreshToken();

        if (!refreshToken) {
          console.warn(" No refresh token available. Redirecting to login...");
          authService.clearAuthData();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        try {
          console.log(" Sending refresh token request...");
          const refreshResponse = await authService.refreshAccessToken();

          if (refreshResponse.success) {
            console.log(" Token refreshed successfully! Retrying original request...");

            const newToken = authService.getToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Retry with the correct instance
            return instance(originalRequest);
          } else {
            console.error(" Token refresh failed:", refreshResponse.message);
            authService.clearAuthData();
            window.location.href = "/login";
            return Promise.reject(refreshResponse);
          }
        } catch (refreshError) {
          console.error(" Token refresh error:", refreshError);
          authService.clearAuthData();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }

      if (errorStatus === 403) {
        console.error(" Access Denied: You don't have permission to access this resource");
      }

      if (errorStatus === 404) {
        console.error(" Resource Not Found:", error.config?.url);
      }

      if (errorStatus === 500) {
        console.error(" Server Error: The backend API encountered an error");
        console.error("   Details:", errorData?.message || errorMessage);
      }

      if (!error.response) {
        console.error(" Network Error: Could not reach the API server");
        console.error("   Make sure the backend is running at:", instance.defaults.baseURL);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Create three separate instances
const api = createApiInstance(BASE_URL_5108);
const apiPort5113 = createApiInstance(BASE_URL_5113);
const apiPort5222 = createApiInstance(BASE_URL_5222);

// ============ HRNomination & ManagerNomination endpoints (Port 5113) ============
export const getAllManagerNominations = () => {
  return apiPort5113.get("/HRNomination/hr/manager-nominations");
};

export const approveNominations = (payload) => {
  return apiPort5113.post("/HRNomination/hr/nominations/approve", payload);
};

export const rejectNominations = (payload) => {
  return apiPort5113.post("/HRNomination/hr/nominations/reject", payload);
};

export const getNominationDetails = (nominationId) => {
  return apiPort5113.get(`/HRNomination/nomination-details/${nominationId}`);
};

export const getApprovedProfiles = () => {
  return apiPort5113.get("/HRNomination/approved-profiles");
};

export const getRejectedProfiles = () => {
  return apiPort5113.get("/HRNomination/rejected-profiles");
};

export const getStatistics = () => {
  return apiPort5113.get("/HRNomination/statistics");
};

export const getRewardTypes = (activeOnly = false) => {
  return apiPort5113.get("/HRNomination/reward-types", { params: { activeOnly } });
};

export const createRewardType = (payload) => {
  return apiPort5113.post("/HRNomination/reward-types", payload);
};

export const updateRewardType = (rewardTypeId, payload) => {
  return apiPort5113.put(`/HRNomination/reward-types/${rewardTypeId}`, payload);
};

export const getParametersByRewardType = (rewardTypeId) => {
  return apiPort5113.get(`/HRNomination/reward-types/${rewardTypeId}/parameters`);
};

export const createParameter = (payload) => {
  return apiPort5113.post("/HRNomination/parameters", payload);
};

export const updateParameter = (parameterId, payload) => {
  return apiPort5113.put(`/HRNomination/parameters/${parameterId}`, payload);
};

export const deleteParameter = (parameterId) => {
  return apiPort5113.delete(`/HRNomination/parameters/${parameterId}`);
};

// ============ DeptHeadApprovals endpoints (Port 5222) ============
export const getDeptHeadSubmittedRatings = () => {
  return apiPort5222.get('/DeptHeadApprovals/submitted-ratings');
};

export const approveDeptHeadEmployee = (payload) => {
  return apiPort5222.post('/DeptHeadApprovals/approve-employee', payload);
};

export const getApprovedEmployees = (page = 1, pageSize = 5) => {
  return apiPort5222.get('/DeptHeadApprovals/approved-employees', {
    params: { page, pageSize }
  });
};

export const getPendingAcknowledgments = () => {
  return apiPort5222.get('/DeptHeadApprovals/employee/pending-acknowledgments');
};

export const acknowledgeRating = (payload) => {
  return apiPort5222.post('/DeptHeadApprovals/employee/acknowledge', payload);
};

export const getManagerEmployeeAcknowledgments = () => {
  return apiPort5222.get("/DeptHeadApprovals/manager/employee-acknowledged-comments");
};

// ============ Other endpoints (Port 5108) ============
export const getTeamMembers = (managerId) => {
  return api.get(`/AppraisalProcess/manager/${managerId}/project-team`);
};

export const getMyNominations = (managerId) => {
  return api.get(`/AppraisalProcess/manager/${managerId}/nominations`);
};

export const submitNomination = (payload) => {
  return api.post("/EmployeeNomination/submit", payload);
};

export const getDeptHeadApprovedNominations = (deptHeadId) => {
  return api.get(`/DepartmentHeadNomination/depthead/${deptHeadId}/approved-nominations`);
};

export const getEmployeeNominations = (employeeId) => {
  return api.get(`/EmployeeNomination/search?employeeId=${employeeId}`);
};

// Export all instances
export default api;
export { apiPort5113, apiPort5222 };
