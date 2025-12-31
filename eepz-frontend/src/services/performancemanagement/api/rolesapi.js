import axios from "axios";
import authService from "../../auth/authService";

const BASE_URL_5113 = import.meta.env.VITE_PERFORMANCE_Roles_API_URL + "/api";

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

      // Skip logging for 404 on decision endpoints (they are optional)
      const isOptionalEndpoint = error.config?.url?.includes('/decision');
      const is404 = errorStatus === 404;
      
      if (!isOptionalEndpoint || !is404) {
        console.error(
          `❌ API Error | Status: ${errorStatus} | URL: ${error.config?.url} | Message: ${errorMessage}`
        );
      }

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

      if (errorStatus === 404 && !isOptionalEndpoint) {
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

const apiPort5113 = createApiInstance(BASE_URL_5113);

// ============================================
// Department Head Approval APIs
// ============================================

export const getDeptHeadSubmittedRatings = () => {
  return apiPort5113.get('/DeptHeadApprovals/submitted-ratings');
};

export const approveDeptHeadEmployee = (payload) => {
  return apiPort5113.post('/DeptHeadApprovals/approve-employee', payload);
};

export const getApprovedEmployees = (page = 1, pageSize = 5) => {
  return apiPort5113.get('/DeptHeadApprovals/approved-employees', {
    params: { page, pageSize }
  });
};

// ← NEW EXPORT ADDED - Get Full Details for Approved Assessment
export const getApprovedEmployeeDetails = (approvalId) => {
  return apiPort5113.get(`/DeptHeadApprovals/approved-employees/${approvalId}/details`);
};

export const getPendingAcknowledgments = () => {
  return apiPort5113.get('/DeptHeadApprovals/employee/pending-acknowledgments');
};

export const acknowledgeRating = (payload) => {
  return apiPort5113.post('/DeptHeadApprovals/employee/acknowledge', payload);
};

export const getManagerEmployeeAcknowledgments = () => {
  return apiPort5113.get("/DeptHeadApprovals/manager/employee-acknowledged-comments");
};

// ============================================
// Attachment APIs (Department Head)
// ============================================

export const getAssessmentAttachments = (departmentHeadId, assessmentId) => {
  return apiPort5113.get(`/DeptHeadApprovals/${departmentHeadId}/assessment/${assessmentId}/attachments`);
};

export const downloadAttachment = (departmentHeadId, attachmentId) => {
  return apiPort5113.get(
    `/DeptHeadApprovals/${departmentHeadId}/attachments/${attachmentId}/download`,
    { responseType: 'blob' }
  );
};

// ============================================
// Employee Role APIs
// ============================================

export const getUserRole = (userId) => {
  return apiPort5113.get(`/Employees/user/${userId}/role`);
};

export const getAllManagers = () => {
  return apiPort5113.get("/Employees/all-managers");
};

// ============================================
// L1 Approver APIs
// ============================================

export const getApproverAssessments = (userId, page = 1, pageSize = 25) => {
  return apiPort5113.get(`/approver/${userId}/assessments`, {
    params: { page, pageSize }
  });
};

export const getApproverSubmittedForms = (userId, page = 1, pageSize = 25) => {
  return apiPort5113.get(`/approver/${userId}/submitted-forms`, {
    params: { page, pageSize }
  });
};

export const getApproverReworkForms = (userId, page = 1, pageSize = 25) => {
  return apiPort5113.get(`/approver/${userId}/rework-forms`, {
    params: { page, pageSize }
  });
};

export const getApproverSubmittedL1Ratings = (userId, page = 1, pageSize = 25) => {
  return apiPort5113.get(`/approver/${userId}/submitted-l1-ratings`, {
    params: { page, pageSize }
  });
};

export const getApproverAssessmentDetail = (userId, assessmentId) => {
  return apiPort5113.get(`/approver/${userId}/assessment/${assessmentId}`);
};

// This endpoint may not exist for all assessments - handle 404 gracefully
export const getApproverAssessmentDecision = async (userId, assessmentId) => {
  try {
    const response = await apiPort5113.get(
      `/approver/${userId}/assessment/${assessmentId}/decision`,
      {
        validateStatus: (status) => {
          // Accept 200-299 and 404 as valid responses
          return (status >= 200 && status < 300) || status === 404;
        }
      }
    );
    
    // If 404, return default structure
    if (response.status === 404) {
      return { data: { note: "", decision: "" } };
    }
    
    return response;
  } catch (error) {
    // Fallback for any other errors
    return { data: { note: "", decision: "" } };
  }
};

export const getApproverAssessmentAttachments = (userId, assessmentId) => {
  return apiPort5113.get(`/approver/${userId}/assessment/${assessmentId}/attachments`);
};

export const submitApproverReviews = (userId, payload) => {
  return apiPort5113.post(`/approver/${userId}/reviews`, payload);
};

export const submitApproverDecision = (userId, payload) => {
  return apiPort5113.post(`/approver/${userId}/decision`, payload);
};

export const downloadApproverAttachment = (userId, attachmentId) => {
  return apiPort5113.get(`/approver/${userId}/attachments/${attachmentId}/download`, {
    responseType: 'blob'
  });
};

// ============================================
// L2 Reviewer APIs
// ============================================

export const getReviewerAssessments = (userId, page = 1, pageSize = 25) => {
  return apiPort5113.get(`/reviewer/${userId}/assessments`, {
    params: { page, pageSize }
  });
};

export const getReviewerSubmittedRatings = (userId, page = 1, pageSize = 25) => {
  return apiPort5113.get(`/reviewer/${userId}/submitted-ratings`, {
    params: { page, pageSize }
  });
};

export const getReviewerAssessmentDetail = (userId, assessmentId) => {
  return apiPort5113.get(`/reviewer/${userId}/assessment/${assessmentId}`);
};

export const getReviewerAssessmentAttachments = (userId, assessmentId) => {
  return apiPort5113.get(`/reviewer/${userId}/assessment/${assessmentId}/attachments`);
};

export const submitReviewerReviews = (userId, payload) => {
  return apiPort5113.post(`/reviewer/${userId}/reviews`, payload);
};

export const submitReviewerDecision = (userId, assessmentId, decision, note = "") => {
  return apiPort5113.post(
    `/reviewer/${userId}/decision?assessmentId=${assessmentId}&decision=${decision}`,
    note,
    { headers: { "Content-Type": "application/json" } }
  );
};

export const downloadReviewerAttachment = (userId, attachmentId) => {
  return apiPort5113.get(`/reviewer/${userId}/attachments/${attachmentId}/download`, {
    responseType: 'blob'
  });
};

export { apiPort5113 };
export default apiPort5113;
