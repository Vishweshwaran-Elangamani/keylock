// src/services_api/feedbackApi.js
import api from './http';

// Manager Reviews
export const managerReviewApi = {
  create: (body) => api.post('/managerreview/create', body),
  getById: (id) => api.get(`/managerreview/${id}`),
  getByManager: (managerId) => api.get(`/managerreview/manager/${managerId}`),
  getForTarget: (employeeId) => api.get(`/managerreview/target/${employeeId}`),
  update: (id, body) => api.put(`/managerreview/${id}`, body),
  submit: (id) => api.post(`/managerreview/${id}/submit`),
  modify: (id) => api.post(`/managerreview/${id}/modify`),
  finalize: (id) => api.post(`/managerreview/${id}/finalize`),
  remove: (id) => api.delete(`/managerreview/${id}`),
  list: (page=1, size=20) => api.get('/managerreview/all', { params: { pageNumber: page, pageSize: size }}),
  byStatus: (status) => api.get(`/managerreview/status/${status}`)
};

// Mentor Feedback (Employee -> SME)
export const mentorFeedbackApi = {
  create: (body) => api.post('/mentorfeedback/create', body),
  getById: (id) => api.get(`/mentorfeedback/${id}`),
  aboutMe: (mentorId) => api.get(`/mentorfeedback/about-me/${mentorId}`),
  myFeedback: (menteeId) => api.get(`/mentorfeedback/my-feedback/${menteeId}`),
  update: (id, body) => api.put(`/mentorfeedback/${id}`, body),
  acknowledge: (id) => api.post(`/mentorfeedback/${id}/acknowledge`),
  list: (page=1, size=20) => api.get('/mentorfeedback/all', { params: { pageNumber: page, pageSize: size }})
};

// Org Goal Feedback
export const orgGoalFeedbackApi = {
  create: (body) => api.post('/orggoalfeedback/create', body),
  getById: (id) => api.get(`/orggoalfeedback/${id}`),
  getByObjective: (objectiveId) => api.get(`/orggoalfeedback/goal/${objectiveId}`),
  update: (id, body) => api.put(`/orggoalfeedback/${id}`, body),
  remove: (id) => api.delete(`/orggoalfeedback/${id}`),
  list: (page=1, size=20) => api.get('/orggoalfeedback/all', { params: { pageNumber: page, pageSize: size }})
};

// Peer Feedback Queue (HR Approval)
export const peerQueueApi = {
  create: (body) => api.post('/peerfeedbackqueue/create', body),
  getById: (id) => api.get(`/peerfeedbackqueue/${id}`),
  approve: (id, { isProfessional, isRelevant, approvedByHRId }) =>
    api.post(`/peerfeedbackqueue/${id}/approve`, null, { params: { isProfessional, isRelevant, approvedByHRId }}),
  reject: (id, { rejectedByHRId }) =>
    api.post(`/peerfeedbackqueue/${id}/reject`, null, { params: { rejectedByHRId }}),
  remove: (id) => api.delete(`/peerfeedbackqueue/${id}`),
  pending: () => api.get('/peerfeedbackqueue/pending'),
  approved: () => api.get('/peerfeedbackqueue/approved'),
  list: (page=1, size=20) => api.get('/peerfeedbackqueue/all', { params: { pageNumber: page, pageSize: size }})
};

// HR Forms & Responses
export const hrFormApi = {
  createForm: (body) => api.post('/hrfeedbackform/forms/create', body),
  getForm: (id) => api.get(`/hrfeedbackform/forms/${id}`),
  listForms: () => api.get('/hrfeedbackform/forms'),
  listActive: () => api.get('/hrfeedbackform/forms/active'),
  updateForm: (id, body) => api.put(`/hrfeedbackform/forms/${id}`, body),
  removeForm: (id) => api.delete(`/hrfeedbackform/forms/${id}`),

  createResponse: (body) => api.post('/hrfeedbackform/responses/create', body),
  getResponse: (id) => api.get(`/hrfeedbackform/responses/${id}`),
  byForm: (formId) => api.get(`/hrfeedbackform/responses/by-form/${formId}`),
  pendingReview: () => api.get('/hrfeedbackform/responses/pending-review'),
  updateResponse: (id, body) => api.put(`/hrfeedbackform/responses/${id}`, body),
  submitResponse: (id) => api.post(`/hrfeedbackform/responses/${id}/submit`),
  hrReview: (id, { hrComments, reviewedByHRId }) =>
    api.post(`/hrfeedbackform/responses/${id}/hr-review`, null, { params: { hrComments, reviewedByHRId }}),
  removeResponse: (id) => api.delete(`/hrfeedbackform/responses/${id}`)
};

// Shared date helpers (re-use index.css tokens for visuals in UI)
export const dateHelpers = {
  daysRemaining: (iso) => {
    if (!iso) return 0;
    const d = new Date(iso), now = new Date();
    return Math.ceil((d - now) / (1000*60*60*24));
  },
  formatDeadline: (iso) => iso ? new Date(iso).toLocaleString() : 'N/A',
  urgency: (iso) => {
    const d = new Date(iso), now = new Date();
    const diff = (d - now) / (1000*60*60*24);
    if (diff < 0) return { status: 'Overdue', color: '#E01950', icon: '⚠️' };
    if (diff <= 3) return { status: 'Due Soon', color: '#E2B93B', icon: '⏳' };
    if (diff <= 7) return { status: 'Upcoming', color: '#0F62FE', icon: '📅' };
    return { status: 'On Track', color: '#24A148', icon: '✅' };
  }
};
