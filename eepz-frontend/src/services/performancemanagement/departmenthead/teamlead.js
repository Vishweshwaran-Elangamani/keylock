import api from "./api";

// Fetch assessments for approver

export function getApproverAssessmentsWithDetails(
  approverUserId,
  page = 1,
  pageSize = 25
) {
  return api.get(`/approver/${approverUserId}/assessments`, {
    params: { page, pageSize },
  });
}

// Submit approver reviews (POST)

export function submitApproverRating(approverUserId, payload) {
  return api.post(`/approver/${approverUserId}/reviews`, payload);
}

export default api;
