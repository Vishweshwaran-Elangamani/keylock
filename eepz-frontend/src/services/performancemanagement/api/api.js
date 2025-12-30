import axios from "axios";
import authService from "../../auth/authService";

const BASE_URL = import.meta.env.VITE_PERFORMANCE_API_URL + "/api";

const createApiInstance = (baseURL) => {
  const instance = axios.create({
    baseURL: baseURL,
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
  });

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

const api = createApiInstance(BASE_URL);

// Manager APIs
export const getTeamMembers = (managerId) => {
  return api.get(`/AppraisalProcess/manager/${managerId}/project-team`);
};

export const getMyNominations = (managerId) => {
  return api.get(`/AppraisalProcess/manager/${managerId}/nominations`);
};

export const submitNomination = (payload) => {
  return api.post("/EmployeeNomination/submit", payload);
};

// Employee Assessment APIs
export const getEmployeeAssignments = (userId) => {
  return api.get(`/Assignments/employee/${userId}`);
};

export const submitSelfAssessment = (payload) => {
  return api.post("/SelfAssessment/submit", payload);
};

export const viewSelfAssessment = (formId, userId) => {
  return api.get(`/SelfAssessment/view/${formId}/user/${userId}`);
};

// Attachment APIs
export const downloadAttachment = (attachmentId) => {
  return api.get(`/SelfAssessment/attachments/${attachmentId}/download`, {
    responseType: 'blob', // Critical for binary file downloads
  });
};

export default api;
