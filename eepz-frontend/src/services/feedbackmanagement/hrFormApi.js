import api from "./index_feedback";

export const hrFormApi = {
  //FORMS ENDPOINTS

  /**
   * POST /api/HrFeedbackForm/forms/create
   * Create a new feedback form
   */
  createForm: (payload) => api.post("/HrFeedbackForm/forms/create", payload),

  /**
   * GET /api/HrFeedbackForm/forms/{formId}
   * Get a specific form by ID
   */
  getFormById: (formId) => api.get(`/HrFeedbackForm/forms/${formId}`),

  /**
   * PUT /api/HrFeedbackForm/forms/{formId}
   * Update a form
   */
  updateForm: (formId, payload) =>
    api.put(`/HrFeedbackForm/forms/${formId}`, payload),

  /**
   * DELETE /api/HrFeedbackForm/forms/{formId}
   * Delete a form
   */
  deleteForm: (formId) => api.delete(`/HrFeedbackForm/forms/${formId}`),

  /**
   * GET /api/HrFeedbackForm/forms
   * Get all forms (paginated)
   */
  getAllForms: (pageNumber = 1, pageSize = 10) =>
    api.get("/HrFeedbackForm/forms", {
      params: { pageNumber, pageSize },
    }),

  /**
   * GET /api/HrFeedbackForm/forms/active
   * Get only active forms
   */
  getActiveForms: () => api.get("/HrFeedbackForm/forms/active"),

  // ============== RESPONSES ENDPOINTS ==============

  /**
   * POST /api/HrFeedbackForm/responses/create
   * Create a new form response (employee starts filling)
   */
  createResponse: (payload) =>
    api.post("/HrFeedbackForm/responses/create", payload),

  /**
   * GET /api/HrFeedbackForm/responses/{responseId}
   * Get a specific response by ID
   */
  getResponseById: (responseId) =>
    api.get(`/HrFeedbackForm/responses/${responseId}`),

  /**
   * PUT /api/HrFeedbackForm/responses/{responseId}
   * Update a response (save draft)
   */
  updateResponse: (responseId, payload) =>
    api.put(`/HrFeedbackForm/responses/${responseId}`, payload),

  /**
   * DELETE /api/HrFeedbackForm/responses/{responseId}
   * Delete a response
   */
  deleteResponse: (responseId) =>
    api.delete(`/HrFeedbackForm/responses/${responseId}`),

  /**
   * GET /api/HrFeedbackForm/responses/by-form/{formId}
   * Get all responses for a specific form
   */
  getResponsesByFormId: (formId) =>
    api.get(`/HrFeedbackForm/responses/by-form/${formId}`),

  /**
   * GET /api/HrFeedbackForm/responses/by-employee/{employeeId}
   * Get all responses by a specific employee
   */
  getResponsesByEmployee: async (employeeId) => {
    try {
      const response = await api.get(
        `/HrFeedbackForm/responses/by-employee/${employeeId}`
      );

      //Extract data array from nested response
      const data = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
        ? response.data.data
        : response?.data?.$values || [];

      return { ...response, data }; // Return with normalized data
    } catch (error) {
      console.error(
        `Error fetching responses for employee ${employeeId}:`,
        error
      );
      throw error;
    }
  },
  /**
   * GET /api/HrFeedbackForm/responses/pending-review
   * Get pending responses that need HR review
   */
  getPendingReviews: () => api.get("/HrFeedbackForm/responses/pending-review"),

  /**
   * POST /api/HrFeedbackForm/responses/{responseId}/submit
   * Submit a form response (employee finalizes submission)
   */
  submitResponse: (responseId, payload) =>
    api.post(`/HrFeedbackForm/responses/${responseId}/submit`, payload),

  /**
   * POST /api/HrFeedbackForm/responses/{responseId}/hr-review
   * HR review and approve/reject a response
   * payload: { status: 'Approved' | 'Rejected', hrComments: string }
   */
  hrReviewResponse: (responseId, payload) =>
    api.post(`/HrFeedbackForm/responses/${responseId}/hr-review`, payload),
};

export default hrFormApi;
