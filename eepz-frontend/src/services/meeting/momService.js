import api_mom from "../../services/meeting/index_mom";

const apiRequest = async (method, url, data = null, config = {}) => {
  try {
    const response = await api_mom[method](url, data, config);
    return response.data;
  } catch (error) {
    console.error(`API Error [${method.toUpperCase()} ${url}]:`, error);
    throw error.response?.data || error;
  }
};

const momService = {
  api_mom,
  createMom: (momData) => apiRequest("post", "/Mom/create", momData),
  updateMom: (momData) => apiRequest("put", "/Mom/update", momData),
  getMyMoms: () => apiRequest("get", "/Mom/my-moms"),
  getMomById: (momId) => apiRequest("get", `/Mom/${momId}`),
  deleteMom: (momId) => apiRequest("delete", `/Mom/${momId}`),

  shareMom: (momId, employeeIds) =>
    apiRequest("post", "/Mom/share", {
      momId,
      sharedWithEmployeeIds: employeeIds,
    }),

  getMomsSharedByMe: () => apiRequest("get", "/Mom/shared-by-me"),
  getMomsSharedWithMe: () => apiRequest("get", "/Mom/shared-with-me"),

  getAllMomsForHR: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
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

  getMyActionItems: () => apiRequest("get", "/Mom/action-items/my-tasks"),
  getActionItemsAssignedByMe: () =>
    apiRequest("get", "/Mom/action-items/assigned-by-me"),
  getOverdueActionItems: () => apiRequest("get", "/Mom/action-items/overdue"),

  getAllEmployees: () => apiRequest("get", "/EmployeeManagement/all"),
};

export default momService;
