import api from "./api";

export const getSelfAssessment = (assessmentId) => api.get(`/SelfAssessment/${assessmentId}`);
export const getSelfAssessmentByFormAndUser = (formId, userId) =>
  api.get(`/SelfAssessment/form/${formId}/user/${userId}`);

export const submitSelfAssessment = (payload) => api.post("/SelfAssessment/submit", payload);

export const listSubmitted = (status) => {
  const params = status ? { status } : undefined;
  return api.get("/SelfAssessment/submitted", { params });
};

// Controller expects raw string body for status — send as text/plain or plain string
export const updateAssessmentStatus = (assessmentId, status) =>
  api.patch(`/SelfAssessment/${assessmentId}/status`, status, {
    headers: { "Content-Type": "text/plain" },
  });