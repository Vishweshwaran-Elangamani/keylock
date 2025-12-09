import axios from "axios";

// ==================== LnD MODULE BASE URL ====================
const API_BASE_URL = import.meta.env.VITE_LND_API_URL + "/api";

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  const token = localStorage.getItem("token") || "{}";
  return token || "";
};

/**
 * Get headers with auth token
 */
const getHeaders = () => ({
  Authorization: `Bearer ${getAuthToken()}`,
  "Content-Type": "application/json",
});

/**
 * Get headers for multipart form data
 */
const getMultipartHeaders = () => ({
  Authorization: `Bearer ${getAuthToken()}`,
});

/**
 * Build query string from params object
 */
const buildQueryString = (params) => {
  const queryParams = new URLSearchParams();

  Object.keys(params).forEach((key) => {
    if (
      params[key] !== undefined &&
      params[key] !== null &&
      params[key] !== ""
    ) {
      queryParams.append(key, params[key]);
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : "";
};

/**
 * Handle API errors
 */
const handleError = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem("authData");
    window.location.href = "/login";
  }
  throw error;
};

/**
 * L&D Service - All API calls for Learning & Development module
 */
export const lndService = {
  // ==================== SKILLS (LnDSkillsController) ====================

  /**
   * Get current user's skills
   * @param {number} pageNumber - Page number (default: 1)
   * @param {string} searchTerm - Search term (optional)
   * @param {string} sortField - Sort field (optional)
   * @param {string} sortOrder - Sort order: 'asc' or 'desc' (optional)
   * @param {number} pageSize - Items per page (default: 10)
   * @returns {Promise} API response
   */
  getMySkills: async (
    pageNumber = 1,
    searchTerm = "",
    sortField = "",
    sortOrder = "asc",
    pageSize = 10
  ) => {
    try {
      const query = buildQueryString({
        pageNumber,
        searchTerm,
        sortField,
        sortOrder,
        pageSize,
      });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-skills/my-skills${query}`,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get subordinate employees' skills (Manager only)
   * @param {number} pageNumber - Page number
   * @param {number|null} employeeId - Filter by employee (optional)
   * @param {string} searchTerm - Search term (optional)
   * @param {string} sortBy - Sort by field (default: 'employeename')
   * @returns {Promise} API response
   */
  getSubordinateSkills: async (
    pageNumber = 1,
    employeeId = null,
    searchTerm = "",
    sortBy = "employeename"
  ) => {
    try {
      const query = buildQueryString({
        pageNumber,
        employeeId,
        searchTerm,
        sortBy,
      });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-skills/subordinates${query}`,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Record a single skill for an employee (Manager only)
   * @param {object} data - { employeeId, skillId, rating }
   * @returns {Promise} API response
   */
  recordSkill: async (data) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/lnd-skills/record`,
        data,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Record multiple skills for an employee (Manager only)
   * @param {object} data - { employeeId, skills: [{ skillId, rating }] }
   * @returns {Promise} API response
   */
  recordSkillsBulk: async (data) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/lnd-skills/record-bulk`,
        data,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Update employee skill rating (Manager only)
   * @param {object} data - { mapperId, rating }
   * @returns {Promise} API response
   */
  updateSkillRating: async (data) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/lnd-skills/update-rating`,
        data,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Delete employee skill (Manager only)
   * @param {number} mapperId - Skill mapper ID
   * @returns {Promise} API response
   */
  deleteSkill: async (mapperId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/lnd-skills/${mapperId}`,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get subordinate employees for manager with pagination and search
   * @param {number} pageNumber - Page number (default: 1)
   * @param {string} searchTerm - Search term (optional)
   * @param {number} pageSize - Items per page (default: 12)
   * @returns {Promise} API response with paginated employees
   */
  getSubordinateEmployees: async (
    pageNumber = 1,
    searchTerm = "",
    pageSize = 12
  ) => {
    try {
      const query = buildQueryString({ pageNumber, searchTerm, pageSize });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-skills/employees/subordinates${query}`,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get all available skills for dropdown
   * @returns {Promise} List of all skills
   */
  getAllSkills: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lnd-skills/all`, {
        headers: getHeaders(),
      });
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  // ==================== SME (LnDSmeController) ====================

  /**
   * Check if current user is an SME
   * @returns {Promise} API response with boolean
   */
  checkIfSme: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lnd-sme/check`, {
        headers: getHeaders(),
      });
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Apply to become SME
   * @param {FormData} formData - { skillId, proofDocument (file) }
   * @returns {Promise} API response
   */
  applyToBecomeSme: async (formData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/lnd-sme/apply`,
        formData,
        { headers: getMultipartHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get available SMEs for a skill
   * @param {number} skillId - Skill ID (required)
   * @param {number} pageNumber - Page number
   * @param {string} searchTerm - Search term (optional)
   * @returns {Promise} API response
   */
  getAvailableSmes: async (skillId, pageNumber = 1, searchTerm = "") => {
    try {
      const query = buildQueryString({ skillId, pageNumber, searchTerm });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-sme/available${query}`,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  // ==================== ASSIGNMENTS (LnDAssignmentsController) ====================

  /**
   * Get current user's assignments (as mentee)
   * @param {number} pageNumber - Page number
   * @param {string} statusFilter - Status filter (optional)
   * @param {string} searchTerm - Search term (optional)
   * @param {string} sortField - Sort field (optional)
   * @param {string} sortOrder - Sort order (optional)
   * @param {number} pageSize - Items per page (default: 10)
   * @returns {Promise} API response
   */
  getMyAssignments: async (
    pageNumber = 1,
    statusFilter = "",
    searchTerm = "",
    sortField = "",
    sortOrder = "",
    pageSize = 10
  ) => {
    try {
      const query = buildQueryString({
        pageNumber,
        statusFilter,
        searchTerm,
        sortField,
        sortOrder,
        pageSize,
      });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-assignments/my-assignments${query}`,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get team assignments (Manager only)
   * @param {number} pageNumber - Page number
   * @param {string} statusFilter - Status filter (optional)
   * @param {string} searchTerm - Search term (optional)
   * @param {string} sortField - Sort field (optional)
   * @param {string} sortOrder - Sort order (default: asc)
   * @param {number} pageSize - Items per page (default: 10)
   * @returns {Promise} API response
   */
  getTeamAssignments: async (
    pageNumber = 1,
    statusFilter = "",
    searchTerm = "",
    sortField = "",
    sortOrder = "asc",
    pageSize = 10
  ) => {
    try {
      const query = buildQueryString({
        pageNumber,
        statusFilter,
        searchTerm,
        sortField,
        sortOrder,
        pageSize,
      });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-assignments/team${query}`,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Export all team assignments to Excel (Manager only)
   * @param {string} statusFilter - Status filter (optional)
   * @param {string} searchTerm - Search term (optional)
   * @param {string} sortField - Sort field (optional)
   * @param {string} sortOrder - Sort order (optional)
   * @returns {Promise} Blob response
   */
  exportTeamAssignments: async (
    statusFilter = "",
    searchTerm = "",
    sortField = "",
    sortOrder = ""
  ) => {
    try {
      const query = buildQueryString({
        statusFilter,
        searchTerm,
        sortField,
        sortOrder,
      });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-assignments/team/export${query}`,
        {
          headers: getHeaders(),
          responseType: "blob",
        }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get SME assignments (SME only)
   * @param {number} pageNumber - Page number
   * @param {string} statusFilter - Status filter (optional)
   * @param {string} searchTerm - Search term (optional)
   * @param {string} sortField - Sort field (optional)
   * @param {string} sortOrder - Sort order (default: asc)
   * @param {number} pageSize - Items per page (default: 10)
   * @returns {Promise} API response
   */
  getSmeAssignments: async (
    pageNumber = 1,
    statusFilter = "",
    searchTerm = "",
    sortField = "",
    sortOrder = "asc",
    pageSize = 10
  ) => {
    try {
      const query = buildQueryString({
        pageNumber,
        statusFilter,
        searchTerm,
        sortField,
        sortOrder,
        pageSize,
      });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-assignments/sme${query}`,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Request SME assignment for subordinate (Manager only)
   * @param {object} data - { skillId, menteeEmployeeId, mentorEmployeeId, deadline }
   * @returns {Promise} API response
   */
  requestSmeAssignment: async (data) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/lnd-assignments/request-sme`,
        data,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Upload assignment completion proof (Employee only)
   * @param {FormData} formData - { assignmentId, proofDocument (file), completionNotes }
   * @returns {Promise} API response
   */
  uploadCompletionProof: async (formData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/lnd-assignments/upload-proof`,
        formData,
        { headers: getMultipartHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Complete assignment with new rating (Manager only)
   * @param {object} data - { assignmentId, newRating, notes }
   * @returns {Promise} API response
   */
  completeAssignment: async (data) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/lnd-assignments/complete`,
        data,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  // ==================== HR MANAGEMENT (LnDHRController) ====================

  /**
   * Get all organization employees (HR only)
   * @param {number} pageNumber - Page number (default: 1)
   * @param {string} searchTerm - Search term (optional)
   * @param {number} pageSize - Items per page (default: 12)
   * @returns {Promise} API response
   */
  getAllOrganizationEmployees: async (
    pageNumber = 1,
    searchTerm = "",
    pageSize = 12
  ) => {
    try {
      const query = buildQueryString({ pageNumber, searchTerm, pageSize });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-hr/employees/organization${query}`,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get all organization assignments (HR only)
   * @param {number} pageNumber - Page number (default: 1)
   * @param {string} statusFilter - Status filter (optional)
   * @param {string} searchTerm - Search term (optional)
   * @param {string} sortField - Sort field (optional)
   * @param {string} sortOrder - Sort order (optional)
   * @param {number} pageSize - Items per page (default: 10)
   * @returns {Promise} API response
   */
  getAllOrganizationAssignments: async (
    pageNumber = 1,
    statusFilter = "",
    searchTerm = "",
    sortField = "",
    sortOrder = "",
    pageSize = 10
  ) => {
    try {
      const query = buildQueryString({
        pageNumber,
        statusFilter,
        searchTerm,
        sortField,
        sortOrder,
        pageSize,
      });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-hr/assignments/organization${query}`,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Export all organization assignments to Excel (HR only)
   * @param {string} statusFilter - Status filter (optional)
   * @param {string} searchTerm - Search term (optional)
   * @param {string} sortField - Sort field (optional)
   * @param {string} sortOrder - Sort order (optional)
   * @returns {Promise} Blob response
   */
  exportOrganizationAssignments: async (
    statusFilter = "",
    searchTerm = "",
    sortField = "",
    sortOrder = ""
  ) => {
    try {
      const query = buildQueryString({
        statusFilter,
        searchTerm,
        sortField,
        sortOrder,
      });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-hr/assignments/organization/export${query}`,
        {
          headers: getHeaders(),
          responseType: "blob",
        }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get all active SMEs (HR only)
   * @param {number} pageNumber - Page number (default: 1)
   * @param {string} searchTerm - Search term (optional)
   * @param {number} pageSize - Items per page (default: 10)
   * @returns {Promise} API response
   */
  getAllActiveSmes: async (pageNumber = 1, searchTerm = "", pageSize = 10) => {
    try {
      const query = buildQueryString({ pageNumber, searchTerm, pageSize });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-hr/smes/all${query}`,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Export all active SMEs to Excel (HR only)
   * @param {string} searchTerm - Search term (optional)
   * @returns {Promise} Blob response
   */
  exportAllActiveSmes: async (searchTerm = "") => {
    try {
      const query = buildQueryString({
        searchTerm,
      });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-hr/smes/export${query}`,
        {
          headers: getHeaders(),
          responseType: "blob",
        }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get employee skills for HR view
   * @param {number} employeeId - Employee ID
   * @param {number} pageNumber - Page number (default: 1)
   * @param {string} searchTerm - Search term (optional)
   * @param {string} sortBy - Sort by field (default: 'skillname')
   * @returns {Promise} API response
   */
  getEmployeeSkillsForHR: async (
    employeeId,
    pageNumber = 1,
    searchTerm = "",
    sortBy = "skillname"
  ) => {
    try {
      const query = buildQueryString({ pageNumber, searchTerm, sortBy });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-hr/skills/employee/${employeeId}${query}`,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  // ==================== APPROVALS (LnDApprovalsController) ====================

  /**
   * Get current user's pending approvals (as approver)
   * @param {number} pageNumber - Page number
   * @param {string} approvalType - Approval type filter (optional)
   * @param {string} status - Status filter (optional)
   * @param {string} sortField - Sort field (optional)
   * @param {string} sortOrder - Sort order (default: asc)
   * @param {number} pageSize - Items per page (default: 10)
   * @returns {Promise} API response
   */
  getMyApprovals: async (
    pageNumber = 1,
    approvalType = "",
    status = "",
    sortField = "",
    sortOrder = "asc",
    pageSize = 10
  ) => {
    try {
      const query = buildQueryString({
        pageNumber,
        approvalType,
        status,
        sortField,
        sortOrder,
        pageSize,
      });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-approvals/my-approvals${query}`,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Process approval (approve/reject)
   * @param {object} data - { approvalId, isApproved, notes }
   * @returns {Promise} API response
   */
  processApproval: async (data) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/lnd-approvals/process`,
        data,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get approval history
   * @param {number} pageNumber - Page number
   * @param {string} role - Role filter: 'all', 'requester', 'approver'
   * @param {string} approvalType - Approval type filter (optional)
   * @param {string} status - Status filter (optional)
   * @param {string} searchTerm - Search term (optional)
   * @param {string} sortField - Sort field (optional)
   * @param {string} sortOrder - Sort order (optional)
   * @param {number} pageSize - Items per page (default: 10)
   * @returns {Promise} API response
   */
  getApprovalHistory: async (
    pageNumber = 1,
    role = "all",
    approvalType = "",
    status = "",
    searchTerm = "",
    sortField = "",
    sortOrder = "",
    pageSize = 10
  ) => {
    try {
      const query = buildQueryString({
        pageNumber,
        role,
        approvalType,
        status,
        searchTerm,
        sortField,
        sortOrder,
        pageSize,
      });
      const response = await axios.get(
        `${API_BASE_URL}/lnd-approvals/history${query}`,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get detailed approval information
   * @param {number} approvalId - Approval ID
   * @returns {Promise} API response
   */
  getApprovalDetails: async (approvalId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/lnd-approvals/${approvalId}/details`,
        { headers: getHeaders() }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Download approval attachment
   * @param {number} approvalId - Approval ID
   * @returns {Promise} Blob response
   */
  downloadApprovalAttachment: async (approvalId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/lnd-approvals/${approvalId}/download`,
        {
          headers: getHeaders(),
          responseType: "blob",
        }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Preview approval attachment in browser
   * @param {number} approvalId - Approval ID
   * @returns {Promise} Blob response for inline viewing
   */
  previewApprovalAttachment: async (approvalId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/lnd-approvals/${approvalId}/attachment/preview`,
        {
          headers: getHeaders(),
          responseType: "blob",
        }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Download assignment completion proof
   *  ROUTE CHANGED: Moved from /assignments to /approvals
   * @param {number} assignmentId - Assignment ID
   * @returns {Promise} Blob response
   */
  downloadAssignmentProof: async (assignmentId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/lnd-approvals/assignments/${assignmentId}/download-proof`,
        {
          headers: getHeaders(),
          responseType: "blob",
        }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Preview assignment completion proof in browser
   * ROUTE CHANGED: Moved from /assignments to /approvals
   * @param {number} assignmentId - Assignment ID
   * @returns {Promise} Blob response for inline viewing
   */
  previewAssignmentProof: async (assignmentId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/lnd-approvals/assignments/${assignmentId}/proof/preview`,
        {
          headers: getHeaders(),
          responseType: "blob",
        }
      );
      return response;
    } catch (error) {
      return handleError(error);
    }
  },
};

/**
 * Helper function to trigger file download from blob
 * @param {Blob} blob - File blob
 * @param {string} filename - Default filename
 */
export const downloadFile = (blob, filename = "download") => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Helper function to preview file in new browser tab
 * @param {Blob} blob - File blob
 * @param {string} contentType - MIME type of the file
 */
export const previewFile = (blob, contentType = "application/pdf") => {
  const file = new Blob([blob], { type: contentType });
  const fileURL = window.URL.createObjectURL(file);
  
  const previewWindow = window.open(fileURL, "_blank");
  
  if (!previewWindow) {
    const link = document.createElement("a");
    link.href = fileURL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  setTimeout(() => {
    window.URL.revokeObjectURL(fileURL);
  }, 100);
};

export default lndService; 
