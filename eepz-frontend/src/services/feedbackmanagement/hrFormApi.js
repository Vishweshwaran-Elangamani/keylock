import api from "./index_feedback";

export const hrFormApi = {
  createForm: (payload) => api.post("/HrFeedbackForm/forms/create", payload),

  getFormById: (formId) => api.get(`/HrFeedbackForm/forms/${formId}`),

  updateForm: (formId, payload) =>
    api.put(`/HrFeedbackForm/forms/${formId}`, payload),

  deleteForm: (formId) => api.delete(`/HrFeedbackForm/forms/${formId}`),

  getAllForms: (pageNumber = 1, pageSize = 10) =>
    api.get("/HrFeedbackForm/forms", {
      params: { pageNumber, pageSize },
    }),

  getActiveForms: () => api.get("/HrFeedbackForm/forms/active"),

  createResponse: (payload) =>
    api.post("/HrFeedbackForm/responses/create", payload),

  getResponseById: (responseId) =>
    api.get(`/HrFeedbackForm/responses/${responseId}`),

  updateResponse: (responseId, payload) =>
    api.put(`/HrFeedbackForm/responses/${responseId}`, payload),

  deleteResponse: (responseId) =>
    api.delete(`/HrFeedbackForm/responses/${responseId}`),

  getResponsesByFormId: (formId) =>
    api.get(`/HrFeedbackForm/responses/by-form/${formId}`),

  getResponsesByEmployee: async (employeeId) => {
    try {
      const response = await api.get(
        `/HrFeedbackForm/responses/by-employee/${employeeId}`
      );

      const data = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
        ? response.data.data
        : response?.data?.$values || [];

      return { ...response, data };
    } catch (error) {
      console.error(
        `Error fetching responses for employee ${employeeId}:`,
        error
      );
      throw error;
    }
  },

  getPendingReviews: () => api.get("/HrFeedbackForm/responses/pending-review"),

  submitResponse: (responseId, payload) =>
    api.post(`/HrFeedbackForm/responses/${responseId}/submit`, payload),

  hrReviewResponse: (responseId, payload) =>
    api.post(`/HrFeedbackForm/responses/${responseId}/hr-review`, payload),
};

export default hrFormApi;
