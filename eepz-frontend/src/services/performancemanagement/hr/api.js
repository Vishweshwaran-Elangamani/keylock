import axios from "axios";
import authService from "../../auth/authService";

const api = axios.create({
  baseURL: import.meta.env.VITE_PERFORMANCE_API_URL+"/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use(
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

api.interceptors.response.use(
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

          return api(originalRequest);
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
      console.error("   Make sure the backend is running at:", api.defaults.baseURL);
    }

    return Promise.reject(error);
  }
);

export const getAllManagerNominations = () => {
  return api.get("/HRNomination/hr/manager-nominations");
};

export const approveNominations = (payload) => {
  return api.post("/HRNomination/hr/nominations/approve", payload);
};

export const rejectNominations = (payload) => {
  return api.post("/HRNomination/hr/nominations/reject", payload);
};



export const getNominationDetails = (nominationId) => {
  return api.get(`/HRNomination/nomination-details/${nominationId}`);
};

export const getApprovedProfiles = () => {
  return api.get("/HRNomination/approved-profiles");
};

export const getRejectedProfiles = () => {
  return api.get("/HRNomination/rejected-profiles");
};

export const getStatistics = () => {
  return api.get("/HRNomination/statistics");
};


export const getRewardTypes = (activeOnly = false) => {
  return api.get("/HRNomination/reward-types", { params: { activeOnly } });
};

export const createRewardType = (payload) => {
  return api.post("/HRNomination/reward-types", payload);
};

export const updateRewardType = (rewardTypeId, payload) => {
  return api.put(`/HRNomination/reward-types/${rewardTypeId}`, payload);
};


export const getParametersByRewardType = (rewardTypeId) => {
  return api.get(`/HRNomination/reward-types/${rewardTypeId}/parameters`);
};

export const createParameter = (payload) => {
  return api.post("/HRNomination/parameters", payload);
};

export const updateParameter = (parameterId, payload) => {
  return api.put(`/HRNomination/parameters/${parameterId}`, payload);
};

export const deleteParameter = (parameterId) => {
  return api.delete(`/HRNomination/parameters/${parameterId}`);
};


export const getTeamMembers = (managerId) => {
  return api.get(`/AppraisalProcess/manager/${managerId}/project-team`);
};

export const getMyNominations = (managerId) => {
  return api.get(`/AppraisalProcess/manager/${managerId}/nominations`);
};

export const submitNomination = (payload) => {
  return api.post("/EmployeeNomination/submit", payload);
};

export const getDeptHeadSubmittedRatings = () => {
  return api.get('/DeptHeadApprovals/submitted-ratings');
};

export const approveDeptHeadEmployee = (payload) => {
  return api.post('/DeptHeadApprovals/approve-employee', payload);
};

export const getDeptHeadApprovedNominations = (deptHeadId) => {
  return api.get(`/DepartmentHeadNomination/depthead/${deptHeadId}/approved-nominations`);
};

export const getApprovedEmployees = (page = 1, pageSize = 5) => {
  return api.get('/DeptHeadApprovals/approved-employees', {
    params: { page, pageSize }
  });
};

export const getPendingAcknowledgments = () => {
  return api.get('/DeptHeadApprovals/employee/pending-acknowledgments');
};

export const acknowledgeRating = (payload) => {
  return api.post('/DeptHeadApprovals/employee/acknowledge', payload);
};

export const getManagerEmployeeAcknowledgments = () => {
  return api.get("/DeptHeadApprovals/manager/employee-acknowledged-comments");
};

export const getEmployeeNominations = (employeeId) => {
  return api.get(`/EmployeeNomination/search?employeeId=${employeeId}`);
};

export default api;
