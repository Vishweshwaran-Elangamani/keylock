import axios from "axios";
import authService from "../../auth/authService";

const BASE_URL_5114 = import.meta.env.VITE_PERFORMANCE_Nominations_API_URL + "/api";

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
      } else {
        console.warn(`⚠️ No JWT Token Found | ${config.method.toUpperCase()} ${config.url}`);
      }

      return config;
    },
    (error) => {
      console.error("❌ Request Configuration Error:", error);
      return Promise.reject(error);
    }
  );

  // Response Interceptor
  instance.interceptors.response.use(
    (response) => {
      return response;
    },

    async (error) => {
      const originalRequest = error.config;
      const errorStatus = error.response?.status;
      const errorData = error.response?.data;
      const errorMessage = error.message;

      console.error(
        `❌ API Error | Status: ${errorStatus} | URL: ${error.config?.url} | Message: ${errorMessage}`
      );

      if (errorStatus === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const refreshToken = authService.getRefreshToken();

        if (!refreshToken) {
          console.warn("⚠️ No refresh token available. Redirecting to login...");
          authService.clearAuthData();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        try {
          const refreshResponse = await authService.refreshAccessToken();

          if (refreshResponse.success) {

            const newToken = authService.getToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Retry with the correct instance
            return instance(originalRequest);
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

      if (errorStatus === 403) {
        console.error("🚫 Access Denied: You don't have permission to access this resource");
      }

      if (errorStatus === 404) {
        console.error("🔍 Resource Not Found:", error.config?.url);
      }

      if (errorStatus === 500) {
        console.error("⚠️ Server Error: The backend API encountered an error");
        console.error("   Details:", errorData?.message || errorMessage);
      }

      if (!error.response) {
        console.error("🌐 Network Error: Could not reach the API server");
        console.error("   Make sure the backend is running at:", instance.defaults.baseURL);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Create API instance for port 5114
const apiPort5114 = createApiInstance(BASE_URL_5114);

// ============ HRNomination & ManagerNomination endpoints (Port 5114) ============
export const getAllManagerNominations = () => {
  return apiPort5114.get("/HRNomination/hr/manager-nominations");
};

export const approveNominations = (payload) => {
  return apiPort5114.post("/HRNomination/hr/nominations/approve", payload);
};

export const rejectNominations = (payload) => {
  return apiPort5114.post("/HRNomination/hr/nominations/reject", payload);
};

export const getNominationDetails = (nominationId) => {
  return apiPort5114.get(`/HRNomination/nomination-details/${nominationId}`);
};

export const getApprovedProfiles = () => {
  return apiPort5114.get("/HRNomination/approved-profiles");
};

export const getRejectedProfiles = () => {
  return apiPort5114.get("/HRNomination/rejected-profiles");
};

export const getStatistics = () => {
  return apiPort5114.get("/HRNomination/statistics");
};

export const getRewardTypes = (activeOnly = false) => {
  return apiPort5114.get("/HRNomination/reward-types", { params: { activeOnly } });
};

export const createRewardType = (payload) => {
  return apiPort5114.post("/HRNomination/reward-types", payload);
};

export const updateRewardType = (rewardTypeId, payload) => {
  return apiPort5114.put(`/HRNomination/reward-types/${rewardTypeId}`, payload);
};

export const getParametersByRewardType = (rewardTypeId) => {
  return apiPort5114.get(`/HRNomination/reward-types/${rewardTypeId}/parameters`);
};

export const createParameter = (payload) => {
  return apiPort5114.post("/HRNomination/parameters", payload);
};

export const updateParameter = (parameterId, payload) => {
  return apiPort5114.put(`/HRNomination/parameters/${parameterId}`, payload);
};

export const deleteParameter = (parameterId) => {
  return apiPort5114.delete(`/HRNomination/parameters/${parameterId}`);
};

export const getDeptHeadApprovedNominations = (deptHeadId) => {
  return apiPort5114.get(`/DepartmentHeadNomination/depthead/${deptHeadId}/approved-nominations`);
};

export const getEmployeeNominations = (employeeId) => {
  return apiPort5114.get('/EmployeeNomination/search', {
    params: { employeeId } 
  });
};

export { apiPort5114 };
export default apiPort5114;
