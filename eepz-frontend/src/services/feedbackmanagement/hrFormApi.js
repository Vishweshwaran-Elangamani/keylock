import axios from 'axios';

const API_BASE_URL = 'http://localhost:5253';

const hrFormApi = {
  // ============== FORMS ENDPOINTS ==============
  
  /**
   * POST /api/HrFeedbackForm/forms/create
   * Create a new feedback form
   */
  createForm: (payload) =>
    axios.post(`${API_BASE_URL}/api/HrFeedbackForm/forms/create`, payload),

  /**
   * GET /api/HrFeedbackForm/forms/{formId}
   * Get a specific form by ID
   */
  getFormById: (formId) =>
    axios.get(`${API_BASE_URL}/api/HrFeedbackForm/forms/${formId}`),

  /**
   * PUT /api/HrFeedbackForm/forms/{formId}
   * Update a form
   */
  updateForm: (formId, payload) =>
    axios.put(`${API_BASE_URL}/api/HrFeedbackForm/forms/${formId}`, payload),

  /**
   * DELETE /api/HrFeedbackForm/forms/{formId}
   * Delete a form
   */
  deleteForm: (formId) =>
    axios.delete(`${API_BASE_URL}/api/HrFeedbackForm/forms/${formId}`),

  /**
   * GET /api/HrFeedbackForm/forms
   * Get all forms (paginated)
   */
  getAllForms: (pageNumber = 1, pageSize = 10) =>
    axios.get(`${API_BASE_URL}/api/HrFeedbackForm/forms`, {
      params: { pageNumber, pageSize }
    }),

  /**
   * GET /api/HrFeedbackForm/forms/active
   * Get only active forms
   */
  getActiveForms: () =>
    axios.get(`${API_BASE_URL}/api/HrFeedbackForm/forms/active`),

  // ============== RESPONSES ENDPOINTS ==============

  /**
   * POST /api/HrFeedbackForm/responses/create
   * Create a new form response (employee starts filling)
   */
  createResponse: (payload) =>
    axios.post(`${API_BASE_URL}/api/HrFeedbackForm/responses/create`, payload),

  /**
   * GET /api/HrFeedbackForm/responses/{responseId}
   * Get a specific response by ID
   */
  getResponseById: (responseId) =>
    axios.get(`${API_BASE_URL}/api/HrFeedbackForm/responses/${responseId}`),

  /**
   * PUT /api/HrFeedbackForm/responses/{responseId}
   * Update a response (save draft)
   */
  updateResponse: (responseId, payload) =>
    axios.put(`${API_BASE_URL}/api/HrFeedbackForm/responses/${responseId}`, payload),

  /**
   * DELETE /api/HrFeedbackForm/responses/{responseId}
   * Delete a response
   */
  deleteResponse: (responseId) =>
    axios.delete(`${API_BASE_URL}/api/HrFeedbackForm/responses/${responseId}`),

  /**
   * GET /api/HrFeedbackForm/responses/by-form/{formId}
   * Get all responses for a specific form
   */
  getResponsesByFormId: (formId) =>
    axios.get(`${API_BASE_URL}/api/HrFeedbackForm/responses/by-form/${formId}`),

  /**
   * GET /api/HrFeedbackForm/responses/pending-review
   * Get pending responses that need HR review
   */
  getPendingReviews: () =>
    axios.get(`${API_BASE_URL}/api/HrFeedbackForm/responses/pending-review`),

  /**
   * POST /api/HrFeedbackForm/responses/{responseId}/submit
   * Submit a form response (employee finalizes submission)
   */
  submitResponse: (responseId, payload) =>
    axios.post(`${API_BASE_URL}/api/HrFeedbackForm/responses/${responseId}/submit`, payload),

  /**
   * POST /api/HrFeedbackForm/responses/{responseId}/hr-review
   * HR review and approve/reject a response
   * payload: { status: 'Approved' | 'Rejected', hrComments: string }
   */
  hrReviewResponse: (responseId, payload) =>
    axios.post(`${API_BASE_URL}/api/HrFeedbackForm/responses/${responseId}/hr-review`, payload)
};

export default hrFormApi;
